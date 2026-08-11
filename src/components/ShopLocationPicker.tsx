/**
 * ShopLocationPicker.tsx
 * ======================
 * SIMPLE Shop Location picker.
 *
 * FLOW:
 *   1. Owner types business address
 *   2. Clicks "Find Location"
 *   3. Address is geocoded → lat/lng
 *   4. Map pin moves to those coordinates
 *   5. Owner can drag the pin to adjust
 *   6. Clicks "Confirm Location"
 *   7. Modal: "Save Your Shop Location?"
 *   8. Clicks "Save Shop Location"
 *   9. Saved to existing salons record via updateShopLocation
 *  10. Success toast, modal closes
 *
 * NO live autocomplete.
 * NO GPS.
 * NO provider fallback chain.
 * NO complex service layer.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Loader2, AlertTriangle, Check } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocodePlace } from '../lib/reverseGeocode';
import { SUPPORTED_JAIPUR_ZONES, normalizeZone } from '../lib/salonServiceArea';

// ===== Types =====

export interface ConfirmedShopLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  area: string;
  zone: string;
  landmark: string;
  pincode: string;
  accuracyM: number | null;
  source: 'gps' | 'manual';
}

export interface ShopLocationSaveInput extends ConfirmedShopLocation {
  confirmed: boolean;
  confirmedAt: string;
}

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirm: (loc: ConfirmedShopLocation) => void;
  onSave?: (loc: ShopLocationSaveInput) => Promise<{ ok: boolean; error?: string | null }>;
  onSaved?: () => void;
  confirmed?: ConfirmedShopLocation | null;
}

// ===== Nominatim direct call (no service layer) =====

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
}

async function geocodeAddress(query: string): Promise<NominatimResult | null> {
  try {
    // Bias toward Jaipur area via viewbox, but don't hard-restrict
    const viewbox = '75.55,26.70,76.10,27.15';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&countrycodes=in&viewbox=${viewbox}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult[];
    return data && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

// ===== Jaipur center + default map zoom =====

const JAIPUR_CENTER: [number, number] = [26.9124, 75.7873];
const DEFAULT_ZOOM = 12;
const PICK_ZOOM = 16;

// ===== Draggable pink pin icon =====

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;background:#e6007e;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35);"><div style="width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:7px;left:7px;"></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

// ===== Helpers =====

function isValidLatLng(lat: number | null, lng: number | null): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function extractAddressParts(item: NominatimResult): {
  fullAddress: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
} {
  const a = item.address || {};
  const parts: string[] = [];
  if (a.house_number) parts.push(a.house_number);
  if (a.road) parts.push(a.road);
  if (a.suburb || a.neighbourhood) parts.push(a.suburb || a.neighbourhood || '');
  if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village || '');
  if (a.state) parts.push(a.state);
  if (a.postcode) parts.push(a.postcode);

  const cap = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

  return {
    fullAddress: parts.join(', '),
    area: cap(a.suburb || a.neighbourhood),
    city: cap(a.city || a.town || a.village),
    state: a.state,
    pincode: a.postcode,
    landmark: a.road,
  };
}

// ===== Component =====

export default function ShopLocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onSave,
  onSaved,
  confirmed,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  const markerObj = useRef<L.Marker | null>(null);

  const [address, setAddress] = useState(confirmed?.address || '');
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [city, setCity] = useState(confirmed?.city || 'Jaipur');
  const [area, setArea] = useState(confirmed?.area || '');
  const [zone, setZone] = useState(confirmed?.zone || '');
  const [landmark, setLandmark] = useState(confirmed?.landmark || '');
  const [pincode, setPincode] = useState(confirmed?.pincode || '');

  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Stale-request protection: track the query this call was for
  const latestQueryRef = useRef<string>('');

  // ===== Init map =====
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    const start: [number, number] =
      lat !== null && lng !== null ? [lat, lng] : JAIPUR_CENTER;

    const map = L.map(mapRef.current, { zoomControl: true }).setView(start, start === JAIPUR_CENTER ? DEFAULT_ZOOM : PICK_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(start, { icon: pinIcon, draggable: true }).addTo(map);
    markerObj.current = marker;

    // Drag end → update lat/lng + reverse geocode
    marker.on('dragend', async () => {
      const p = marker.getLatLng();
      setLat(Number(p.lat.toFixed(6)));
      setLng(Number(p.lng.toFixed(6)));
      await reverseGeocodeAndFill(p.lat, p.lng);
    });

    // Map click → move pin + update lat/lng + reverse geocode
    map.on('click', async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLat(Number(e.latlng.lat.toFixed(6)));
      setLng(Number(e.latlng.lng.toFixed(6)));
      await reverseGeocodeAndFill(e.latlng.lat, e.latlng.lng);
    });

    mapObj.current = map;
    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      if (map) map.remove();
      mapObj.current = null;
      markerObj.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker when lat/lng change (from geocode or initial load)
  useEffect(() => {
    if (lat !== null && lng !== null && mapObj.current && markerObj.current) {
      markerObj.current.setLatLng([lat, lng]);
      mapObj.current.setView([lat, lng], PICK_ZOOM);
    }
  }, [lat, lng]);

  // Reverse geocode with stale-protection
  const reverseGeocodeAndFill = useCallback(async (latitude: number, longitude: number) => {
    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const myPosition = { lat: latitude, lng: longitude };
    reverseGeoInflightRef.current = key;

    try {
      const place = await reverseGeocodePlace(latitude, longitude);
      // If position changed while fetching, ignore this result
      if (reverseGeoInflightRef.current !== key) return;

      if (place) {
        if (place.city) setCity((c) => c || place.city!);
        if (place.locality) setArea((a) => a || place.locality!);
        if (place.principalSubdivision) {
          const norm = normalizeZone(place.principalSubdivision);
          if (norm) setZone((z) => z || norm);
        }
      }
    } catch {
      // manual edit possible
    }
  }, []);

  const reverseGeoInflightRef = useRef<string | null>(null);

  // ===== Find Location handler =====
  const handleFindLocation = async () => {
    if (!address.trim()) {
      setGeoError('Please enter a business address.');
      setGeoSuccess(null);
      return;
    }

    setGeoError(null);
    setGeoSuccess(null);
    setGeocoding(true);
    latestQueryRef.current = address.trim();

    const result = await geocodeAddress(address.trim());

    // If user typed more while fetching, discard this response
    if (latestQueryRef.current !== address.trim()) {
      setGeocoding(false);
      return;
    }

    setGeocoding(false);

    if (!result) {
      setGeoError('Location not found — try a more specific address (e.g., "Vaishali Nagar, Jaipur") or click on the map.');
      return;
    }

    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);

    setLat(Number(newLat.toFixed(6)));
    setLng(Number(newLng.toFixed(6)));

    const parts = extractAddressParts(result);
    if (parts.fullAddress) setAddress(parts.fullAddress);
    if (parts.area) setArea(parts.area);
    if (parts.city) setCity(parts.city);
    if (parts.state) {
      const norm = normalizeZone(parts.state);
      if (norm) setZone(norm);
    }
    if (parts.pincode) setPincode(parts.pincode);
    if (parts.landmark) setLandmark(parts.landmark);

    setGeoSuccess('Location found. Drag the pin to adjust if needed.');

    // Move map
    if (mapObj.current && markerObj.current) {
      markerObj.current.setLatLng([newLat, newLng]);
      mapObj.current.setView([newLat, newLng], PICK_ZOOM);
    }
  };

  // ===== Build confirmed location =====
  const buildConfirmedLocation = useCallback((): ConfirmedShopLocation => ({
    latitude: lat as number,
    longitude: lng as number,
    address: address.trim(),
    city: city.trim(),
    area: area.trim(),
    zone: normalizeZone(zone) ?? zone.trim(),
    landmark: landmark.trim(),
    pincode: pincode.trim(),
    accuracyM: null,
    source: 'manual',
  }), [lat, lng, address, city, area, zone, landmark, pincode]);

  // ===== Confirm Location =====
  const handleConfirmLocation = () => {
    if (!isValidLatLng(lat, lng)) {
      setGeoError('Please find or select a location on the map first.');
      return;
    }
    if (onSave) {
      setSaveError(null);
      setSavedMsg(null);
      setConfirmOpen(true);
    } else {
      onConfirm(buildConfirmedLocation());
    }
  };

  // ===== Save Shop Location =====
  const handleSaveShopLocation = async () => {
    if (!onSave) return;
    if (saving) return; // duplicate-save prevention
    if (!isValidLatLng(lat, lng)) {
      setSaveError('Invalid coordinates.');
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
  };

  const hasPin = isValidLatLng(lat, lng);
  const coordsLabel = hasPin ? `${lat!.toFixed(6)}, ${lng!.toFixed(6)}` : '';

  return (
    <div className="flex flex-col gap-3">
      {/* ===== Business Address Input ===== */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Business Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setGeoError(null); setGeoSuccess(null); }}
            placeholder="e.g., Vaishali Nagar, Jaipur"
            className="flex-1 h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none"
          />
          <button
            type="button"
            onClick={handleFindLocation}
            disabled={geocoding || !address.trim()}
            className="h-10 px-4 bg-[#ac0053] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50 hover:bg-[#ba005b] transition-colors"
          >
            {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
            {geocoding ? 'Finding...' : 'Find Location'}
          </button>
        </div>
      </div>

      {/* Status messages */}
      {geoError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800">{geoError}</div>
        </div>
      )}
      {geoSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] font-semibold text-emerald-700">{geoSuccess}</span>
        </div>
      )}

      {/* ===== Map ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div ref={mapRef} className="w-full h-60 bg-gray-100" />
        <div className="p-3 text-[11px] text-gray-500">
          {hasPin ? (
            <span className="font-mono">📍 {coordsLabel}</span>
          ) : (
            <span>Type an address and click "Find Location", or click on the map.</span>
          )}
        </div>
      </div>

      {/* ===== Saved success message ===== */}
      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[12px] font-bold text-emerald-700">{savedMsg}</span>
        </div>
      )}

      {/* ===== Location Details ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location Details</h3>
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Area / Locality</label>
          <input type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., Vaishali Nagar"
            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jaipur"
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Zone (optional)</label>
            <select value={zone} onChange={(e) => setZone(e.target.value)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none">
              <option value="">Select zone</option>
              {SUPPORTED_JAIPUR_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Pincode</label>
            <input type="text" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="302021"
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none tracking-widest font-mono" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Landmark (optional)</label>
            <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near Shani Mandir"
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none" />
          </div>
        </div>
      </div>

      {/* ===== Confirm Location Button ===== */}
      <button
        type="button"
        onClick={handleConfirmLocation}
        disabled={!hasPin}
        className="w-full bg-[#ac0053] text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MapPin className="w-4 h-4" /> Confirm Location
      </button>
      {!hasPin && (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 text-center">
          Shop location is required. Find a location or click on the map.
        </p>
      )}

      {/* ===== Save Your Shop Location? Modal ===== */}
      {confirmOpen && onSave && createPortal(
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#ac0053]/10 text-[#ac0053] flex items-center justify-center mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Save Your Shop Location?</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              This location will be used as your official shop location on your salon profile, map and directions.
            </p>

            <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-1.5">
              <div className="font-mono text-[11px] text-gray-700"> {coordsLabel}</div>
              {address && <div className="text-[11px] text-gray-600"><b>Address:</b> {address}</div>}
              {city && <div className="text-[11px] text-gray-600"><b>City:</b> {city}</div>}
              {area && <div className="text-[11px] text-gray-600"><b>Area:</b> {area}</div>}
              {pincode && <div className="text-[11px] text-gray-600"><b>Pincode:</b> {pincode}</div>}
            </div>

            {saveError && (
              <div className="mt-2 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setConfirmOpen(false); setSaveError(null); }} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 disabled:opacity-50">Cancel</button>
              <button onClick={handleSaveShopLocation} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#ac0053] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#ba005b] disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
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
