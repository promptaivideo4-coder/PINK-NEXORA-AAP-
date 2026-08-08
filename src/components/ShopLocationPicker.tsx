/**
 * ShopLocationPicker.tsx
 * ======================
 * Reusable "exact shop location" picker — map pin + device GPS + confirm.
 *
 * Uses existing centralized location (useNexoraLocation → LocationContext →
 * src/location/*) for "Use current location". Map = Leaflet (no API key).
 *
 * Owner CONFIRM karne par hi location accepted hoti hai. Pin drag/click se
 * exact location set hoti hai. Reverse geocode (existing, cached) se
 * address/city/area auto-fill (owner edit kar sakta hai).
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, CheckCircle2, Loader2, AlertTriangle, Navigation as NavIcon } from 'lucide-react';
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
}

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  /** Location confirm hone par callback — lat/lng + details */
  onConfirm: (loc: ConfirmedShopLocation) => void;
  /** Already-confirmed location (prefill) */
  confirmed?: ConfirmedShopLocation | null;
}

const DEFAULT_CENTER: [number, number] = [26.9124, 75.7873];

const markerIcon = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;background:#e6007e;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35);"><div style="width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:7px;left:7px;"></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

/** Reasonable GPS accuracy to allow quick confirm (meters) */
const GOOD_ACCURACY_M = 100;

/** Valid coordinate check — accuracy is NOT part of validity (informational only) */
function isValidLatLng(lat: number | null, lng: number | null): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

export default function ShopLocationPicker({ initialLat, initialLng, onConfirm, confirmed }: Props) {
  const { currentLocation, lastKnownFix, requestLocation } = useLocation();

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

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

  // Init map once
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const start: [number, number] =
      lat !== null && lng !== null ? [lat, lng] : DEFAULT_CENTER;
    const marker = L.marker(start, { icon: markerIcon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const p = marker.getLatLng();
      setLat(Number(p.lat.toFixed(6)));
      setLng(Number(p.lng.toFixed(6)));
      reverseGeocodeAt(p.lat, p.lng);
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLat(Number(e.latlng.lat.toFixed(6)));
      setLng(Number(e.latlng.lng.toFixed(6)));
      reverseGeocodeAt(e.latlng.lat, e.latlng.lng);
    });

    leafletRef.current = map;
    return () => {
      map.remove();
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial coords → marker + map move
  useEffect(() => {
    if (lat !== null && lng !== null && leafletRef.current && markerRef.current) {
      leafletRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Reverse geocode — auto-fill details (cached, no repeated calls)
  async function reverseGeocodeAt(latitude: number, longitude: number) {
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
  }

  // Apply a fix to the form + map (coords, accuracy WARNING only — kabhi block nahi)
  function applyFix(latitude: number, longitude: number, accuracy: number) {
    setGpsAccuracy(accuracy);
    // Accuracy is informational/warning only — valid coords par save hamesha allowed
    setGpsWarn(accuracy > GOOD_ACCURACY_M);
    setLat(Number(latitude.toFixed(6)));
    setLng(Number(longitude.toFixed(6)));
    if (leafletRef.current && markerRef.current) {
      leafletRef.current.setView([latitude, longitude], 15);
      markerRef.current.setLatLng([latitude, longitude]);
    }
    reverseGeocodeAt(latitude, longitude);
  }

  // Use current device location — existing centralized system
  function useDeviceLocation() {
    setGpsWarn(false);
    setGpsAccuracy(null);
    requestLocation(); // watcher start (async — fix aane par watch effect lat/lng set karega)
    const loc = currentLocation || lastKnownFix;
    if (loc) {
      // Fix pehle se available ho to turant form+map me set
      applyFix(loc.latitude, loc.longitude, loc.accuracy);
    }
    // Agar loc null hai (stale closure / abhi fix nahi aayi) — watch effect
    // currentLocation/lastKnownFix update hote hi lat/lng set kar dega (niche).
  }

  // Watch — device location update par auto-fill (sirf jab koi pin nahi laga)
  useEffect(() => {
    const loc = currentLocation || lastKnownFix;
    if (loc && lat === null && lng === null) {
      applyFix(loc.latitude, loc.longitude, loc.accuracy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, lastKnownFix]);

  function confirm() {
    // Valid coordinates required (range/finite) — accuracy NEVER blocks save
    if (!isValidLatLng(lat, lng)) return;
    // Owner explicitly confirmed — warning clear (save ke baad bhi nahi dikhega)
    setGpsWarn(false);
    setGpsAccuracy(null);
    onConfirm({
      latitude: lat as number,
      longitude: lng as number,
      address: address.trim(),
      city: city.trim(),
      area: area.trim(),
      zone: normalizeZone(zone) ?? zone.trim(),
      landmark: landmark.trim(),
      pincode: pincode.trim(),
    });
  }

  const hasPin = isValidLatLng(lat, lng);

  return (
    <div className="flex flex-col gap-3">
      {/* Map with draggable pin */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden">
        <div ref={mapRef} className="w-full h-60 bg-surface-variant" />
        <div className="p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={useDeviceLocation}
              type="button"
              className="flex-1 bg-primary text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <LocateFixed className="w-3.5 h-3.5" /> Use Current Location
            </button>
            <button
              onClick={() => {
                if (leafletRef.current) leafletRef.current.setView([26.9124, 75.7873], 13);
              }}
              type="button"
              className="flex-1 bg-surface-container-high text-on-surface text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <NavIcon className="w-3.5 h-3.5" /> Select on Map
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
            {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span className="font-mono">
              {hasPin ? `${lat!.toFixed(6)}, ${lng!.toFixed(6)}` : 'Pin nahi laga — map par click karo ya marker drag karo'}
            </span>
            {hasPin && (
              <span className="ml-auto text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> pinned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* GPS accuracy warning — poor accuracy par retry/pin guidance */}
      {gpsWarn && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800">
            <b>GPS accuracy kam hai ({gpsAccuracy !== null ? Math.round(gpsAccuracy) : '?'}m).</b>{' '}
            Retry GPS karo ya pin ko map par exact shop location par drag karo.
          </div>
        </div>
      )}

      {/* Location details — auto-filled, owner edit kar sakta hai */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Location Details</h3>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-on-surface-variant">Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Shop 12, Main Bazar" className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant">Area / Locality</label>
            <input type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Raja Park" className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jaipur" className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant">Zone (optional)</label>
            <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
              <option value="">Select zone</option>
              {SUPPORTED_JAIPUR_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant">Pincode</label>
            <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="302004" className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-on-surface-variant">Landmark (optional)</label>
          <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near City Park" className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
        </div>
      </div>

      {/* Confirm */}
      <button
        type="button"
        onClick={confirm}
        disabled={!hasPin}
        className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
      >
        <MapPin className="w-4 h-4" /> Confirm Shop Location
      </button>
      {!hasPin && (
        <p className="text-[11px] text-amber-700 bg-amber-500/10 rounded-lg px-3 py-2 text-center">
          Shop location is required. Please set your exact shop location on the map to continue.
        </p>
      )}
    </div>
  );
}
