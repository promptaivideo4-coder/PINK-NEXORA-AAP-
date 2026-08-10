/**
 * ShopLocationPicker.tsx
 * ======================
 * Reusable "exact shop location" picker — map pin + device GPS + confirm + save.
 *
 * Uses existing centralized location (useNexoraLocation → LocationContext →
 * src/location/*) for "Use current location". Map = Leaflet (no API key).
 *
 * FLOW (Settings / Edit Shop Location):
 *   Use Current Location  →  Map pin appears  →  Owner drag/select pin
 *     →  Confirm Location  →  "Save Your Shop Location?" popup
 *     →  Save Shop Location  →  ✓ Location saved successfully
 *
 * Accuracy is WARNING-only — kabhi save block nahi karta.
 * Pin drag/click → location_source = 'manual'.
 * Owner explicit "Save Shop Location" par hi confirmed=true save hota hai.
 * User GPS kabhi saved shop location ko overwrite nahi karta.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, LocateFixed, CheckCircle2, Loader2, AlertTriangle, Navigation as NavIcon, Check, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '../contexts/LocationContext';
import { reverseGeocodePlace } from '../lib/reverseGeocode';
import { SUPPORTED_JAIPUR_ZONES, normalizeZone } from '../lib/salonServiceArea';

export interface ConfirmedShopLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  area: string;
  zone: string;
  landmark: string;
  pincode: string;
  /** GPS accuracy (m) at selection time — informational only */
  accuracyM: number | null;
  /** How the location was selected: 'gps' | 'manual' */
  source: 'gps' | 'manual';
}

export interface ShopLocationSaveInput extends ConfirmedShopLocation {
  /** Owner explicit confirm — save ke liye zaroori */
  confirmed: boolean;
  confirmedAt: string;
}

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  /** Location CONFIRMED hone par callback — lat/lng + details (registration) */
  onConfirm: (loc: ConfirmedShopLocation) => void;
  /** Settings: async save callback — ise diya to internal "Save Your Shop Location?" popup use hota hai */
  onSave?: (loc: ShopLocationSaveInput) => Promise<{ ok: boolean; error?: string | null }>;
  /** Successful save ke baad (modal close / refresh) */
  onSaved?: () => void;
  /** Already-confirmed location (prefill) */
  confirmed?: ConfirmedShopLocation | null;
}

const DEFAULT_CENTER: [number, number] = [26.9124, 75.7873]; // Jaipur fallback
const GOOD_ACCURACY_M = 100;

/** Pure CSS marker — leaflet default icon assets se bachne ke liye */
const markerIcon = L.divIcon({
  className: 'custom-shop-pin',
  html: `<div style="width:36px;height:36px;background:#ac0053;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;">
           <div style="width:12px;height:12px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

/** Valid coordinate check — accuracy is NOT part of validity (informational only) */
function isValidLatLng(lat: number | null, lng: number | null): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

export default function ShopLocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onSave,
  onSaved,
  confirmed,
}: Props) {
  const { currentLocation, lastKnownFix, requestLocation } = useLocation();

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapReadyRef = useRef(false);

  // ---- State ----
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [address, setAddress] = useState(confirmed?.address ?? '');
  const [city, setCity] = useState(confirmed?.city ?? '');
  const [area, setArea] = useState(confirmed?.area ?? '');
  const [zone, setZone] = useState(confirmed?.zone ?? '');
  const [landmark, setLandmark] = useState(confirmed?.landmark ?? '');
  const [pincode, setPincode] = useState(confirmed?.pincode ?? '');
  const [geocoding, setGeocoding] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsWarn, setGpsWarn] = useState(false);
  const [source, setSource] = useState<'gps' | 'manual'>('manual');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // ---- Helper: reverse geocode (cached, no repeated calls for same coords) ----
  const lastGeocodeRef = useRef<{ lat: number; lng: number } | null>(null);
  const reverseGeocodeAt = useCallback(async (latitude: number, longitude: number) => {
    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const lastKey = lastGeocodeRef.current
      ? `${lastGeocodeRef.current.lat.toFixed(4)},${lastGeocodeRef.current.lng.toFixed(4)}`
      : '';
    if (key === lastKey) return; // skip duplicate
    lastGeocodeRef.current = { lat: latitude, lng: longitude };

    setGeocoding(true);
    try {
      const place = await reverseGeocodePlace(latitude, longitude);
      if (place) {
        if (place.city) setCity((c) => c || place.city!);
        if (place.locality) setArea((a) => a || place.locality!);
      }
    } catch {
      /* manual edit possible */
    } finally {
      setGeocoding(false);
    }
  }, []);

  // ---- Helper: update coords + move map/marker + source ----
  const setPinPosition = useCallback(
    (latitude: number, longitude: number, newSource: 'gps' | 'manual') => {
      const lat6 = Number(latitude.toFixed(6));
      const lng6 = Number(longitude.toFixed(6));
      setLat(lat6);
      setLng(lng6);
      setSource(newSource);
      if (leafletRef.current && markerRef.current) {
        leafletRef.current.setView([latitude, longitude], 15);
        markerRef.current.setLatLng([latitude, longitude]);
      }
      reverseGeocodeAt(latitude, longitude);
    },
    [reverseGeocodeAt]
  );

  // ---- Init map once (after modal animation) ----
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    // Leaflet needs a visible container. Use a small delay so the modal animation
    // finishes and the container has actual dimensions.
    const initTimer = setTimeout(() => {
      if (!mapRef.current || leafletRef.current) return;

      const start: [number, number] =
        lat !== null && lng !== null ? [lat, lng] : DEFAULT_CENTER;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(start, 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Force re-render after tile layer is added (ensures map fills container)
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      const marker = L.marker(start, { icon: markerIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      // Drag release → coords update + source=manual + reverse geocode
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        setPinPosition(p.lat, p.lng, 'manual');
      });

      // Map click → pin moves + coords update + source=manual
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setPinPosition(e.latlng.lat, e.latlng.lng, 'manual');
      });

      leafletRef.current = map;
      mapReadyRef.current = true;

      // If initial coords exist, immediately zoom + center (after map is ready)
      if (lat !== null && lng !== null) {
        setTimeout(() => {
          map.invalidateSize();
          map.setView([lat, lng], 15);
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        }, 150);
      }
    }, 300); // 300ms — matches modal animation duration

    return () => {
      clearTimeout(initTimer);
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        markerRef.current = null;
        mapReadyRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Sync marker position when lat/lng change (from GPS or reopening) ----
  useEffect(() => {
    if (
      lat !== null &&
      lng !== null &&
      leafletRef.current &&
      markerRef.current &&
      mapReadyRef.current
    ) {
      leafletRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  // ---- Apply a GPS fix to form + map — source='gps', accuracy WARNING only ----
  const applyFix = useCallback(
    (latitude: number, longitude: number, accuracy: number) => {
      setGpsAccuracy(accuracy);
      setGpsWarn(accuracy > GOOD_ACCURACY_M);
      setPinPosition(latitude, longitude, 'gps');
    },
    [setPinPosition]
  );

  // ---- Use current device location ----
  const useDeviceLocation = useCallback(() => {
    setLocating(true);
    setGpsWarn(false);
    setGpsAccuracy(null);

    // Ask browser for GPS
    requestLocation();
    const loc = currentLocation || lastKnownFix;

    if (loc) {
      applyFix(loc.latitude, loc.longitude, loc.accuracy);
      setLocating(false);
    } else {
      // Try native geolocation directly as fallback
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            applyFix(latitude, longitude, accuracy);
            setLocating(false);
          },
          () => {
            setLocating(false);
            setSaveError('GPS permission denied. Tap the map to pick your location.');
            setTimeout(() => setSaveError(null), 4000);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocating(false);
      }
    }
  }, [requestLocation, currentLocation, lastKnownFix, applyFix]);

  // ---- Watch — device location update par auto-fill (sirf jab koi pin nahi laga) ----
  useEffect(() => {
    const loc = currentLocation || lastKnownFix;
    if (loc && lat === null && lng === null) {
      applyFix(loc.latitude, loc.longitude, loc.accuracy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, lastKnownFix]);

  // ---- Build confirmed location object ----
  function buildConfirmedLocation(): ConfirmedShopLocation {
    return {
      latitude: lat as number,
      longitude: lng as number,
      address: address.trim(),
      city: city.trim(),
      area: area.trim(),
      zone: normalizeZone(zone) ?? zone.trim(),
      landmark: landmark.trim(),
      pincode: pincode.trim(),
      accuracyM: gpsAccuracy,
      source,
    };
  }

  // ---- STEP: Confirm Location ----
  // Validates lat/lng, then:
  //   - Settings (onSave provided): opens "Save Your Shop Location?" popup
  //   - Registration (no onSave): calls onConfirm directly
  function handleConfirmLocation() {
    if (!isValidLatLng(lat, lng)) return; // accuracy NEVER blocks
    if (onSave) {
      setSaveError(null);
      setSavedMsg(null);
      setConfirmOpen(true);
    } else {
      setGpsWarn(false);
      onConfirm(buildConfirmedLocation());
    }
  }

  // ---- STEP: Save Shop Location — ONLY yahan se Supabase persist ----
  async function handleSaveShopLocation() {
    if (!onSave) return;
    // Validate coordinates once more
    if (!isValidLatLng(lat, lng)) {
      setSaveError('Invalid coordinates. Please set your location on the map.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await onSave({
        ...buildConfirmedLocation(),
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      });
      if (res.ok) {
        setConfirmOpen(false);
        setSavedMsg('✓ Shop location saved successfully');
        onSaved?.();
      } else {
        setSaveError(res.error || 'Failed to save shop location');
      }
    } catch (e) {
      setSaveError(String((e as Error)?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const hasPin = isValidLatLng(lat, lng);
  const coordsLabel = hasPin ? `${lat!.toFixed(6)}, ${lng!.toFixed(6)}` : '';

  return (
    <div className="flex flex-col gap-3">
      {/* =========== Map with draggable pin =========== */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden">
        <div ref={mapRef} className="w-full h-60 bg-surface-variant" style={{ minHeight: '240px' }} />
        <div className="p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={useDeviceLocation}
              disabled={locating}
              type="button"
              className="flex-1 bg-primary text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Locating...' : 'Use Current Location'}
            </button>
            <button
              onClick={() => {
                if (leafletRef.current) {
                  leafletRef.current.invalidateSize();
                  leafletRef.current.setView([26.9124, 75.7873], 13);
                }
              }}
              type="button"
              className="flex-1 bg-surface-container-high text-on-surface text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <NavIcon className="w-3.5 h-3.5" /> Select on Map
            </button>
          </div>

          {/* Coordinates display */}
          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
            {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span className="font-mono">
              {hasPin
                ? coordsLabel
                : 'Pin nahi laga — map par click karo ya marker drag karo'}
            </span>
            {hasPin && (
              <span className="ml-auto text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> pinned
              </span>
            )}
          </div>

          {/* Source + accuracy info */}
          {hasPin && (
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
              <span>
                Source: <b>{source === 'gps' ? 'GPS' : 'Manual'}</b>
                {gpsAccuracy !== null && ` • Accuracy: ${Math.round(gpsAccuracy)}m`}
              </span>
              {gpsWarn && (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Low accuracy
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========== Low GPS accuracy warning — WARNING ONLY, kabhi block nahi =========== */}
      {gpsWarn && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800 leading-relaxed">
            ⚠ GPS accuracy is approximately{' '}
            <b>{gpsAccuracy !== null ? Math.round(gpsAccuracy) : '?'}</b>m. You can drag the pin
            to the exact shop location.
          </div>
        </div>
      )}

      {/* =========== Saved success message =========== */}
      {savedMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[12px] font-bold text-emerald-700">{savedMsg}</span>
        </div>
      )}

      {/* =========== Location details =========== */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Location Details
        </h3>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-on-surface-variant">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Shop 12, Main Bazar"
            className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant">
              Area / Locality
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Raja Park"
              className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Jaipur"
              className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant">
              Zone (optional)
            </label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="">Select zone</option>
              {SUPPORTED_JAIPUR_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="302004"
              className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-on-surface-variant">
            Landmark (optional)
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Near City Park"
            className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* =========== Confirm Location — primary button =========== */}
      <button
        type="button"
        onClick={handleConfirmLocation}
        disabled={!hasPin}
        className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
      >
        <MapPin className="w-4 h-4" /> Confirm Location
      </button>
      {!hasPin && (
        <p className="text-[11px] text-amber-700 bg-amber-500/10 rounded-lg px-3 py-2 text-center">
          Shop location is required. Please set your exact shop location on the map to continue.
        </p>
      )}

      {/* =========== Save Your Shop Location? popup (rendered via Portal) =========== */}
      {confirmOpen &&
        onSave &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ touchAction: 'auto' }}
          >
            <div className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Save Your Shop Location?</h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                This location will be used as your official shop location on your salon profile,
                map and directions.
              </p>
              <div className="mt-3 bg-surface-container-low rounded-xl p-3 font-mono text-[11px] text-on-surface-variant">
                📍 {coordsLabel}
                {gpsAccuracy !== null && (
                  <div className="mt-1 text-[10px] opacity-70">
                    Accuracy: ~{Math.round(gpsAccuracy)}m • Source: {source === 'gps' ? 'GPS' : 'Manual'}
                  </div>
                )}
              </div>
              {saveError && (
                <div className="mt-2 text-[11px] font-semibold text-error bg-error/10 rounded-lg px-3 py-2">
                  {saveError}
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => {
                    setConfirmOpen(false);
                    setSaveError(null);
                  }}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold text-xs active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveShopLocation}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {saving ? 'Saving...' : 'Save Shop Location'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
