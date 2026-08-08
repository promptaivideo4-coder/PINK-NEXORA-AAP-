/**
 * ShopLocation.tsx — SHOP OWNER: Set Shop Location
 * =================================================
 * Owner apni salon ka CANONICAL location set karta hai (lat/lng source of truth).
 *
 * 2 tarike:
 *  1. "Use current device location" — existing centralized location system
 *     (useNexoraLocation → LocationContext → src/location/*) se.
 *  2. Map par exact jagah pick (Leaflet, draggable marker) — no API key.
 *
 * Save: lat/lng/address/city/area/zone/landmark/pincode → salons table
 * (RPC update_shop_location — owner ki apni salon par hi).
 *
 * User ke GPS se salon ki location kabhi overwrite nahi hoti.
 */

import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { MapPin, LocateFixed, Save, CheckCircle2, Loader2, AlertTriangle, Navigation as NavIcon } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { fetchMyShop, updateShopLocation } from '../lib/shopRepository';
import { useLocation } from '../contexts/LocationContext';
import { reverseGeocodePlace } from '../lib/reverseGeocode';
import { SUPPORTED_JAIPUR_ZONES, normalizeZone } from '../lib/salonServiceArea';

const DEFAULT_CENTER: [number, number] = [26.9124, 75.7873]; // Jaipur fallback

/** Pure CSS marker — leaflet default icon assets se bachne ke liye */
const markerIcon = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;background:#e6007e;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35);"><div style="width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:7px;left:7px;"></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

export default function ShopLocation({ navigate }: NavigationProps) {
  // Existing centralized location (owner ke device location ke liye)
  const { currentLocation, lastKnownFix, requestLocation } = useLocation();

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [shopName, setShopName] = useState('My Salon');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [zone, setZone] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Load current saved shop location (canonical — pehle se save ho to)
  useEffect(() => {
    (async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (shop) {
          setShopName(shop.name);
          if (typeof shop.latitude === 'number' && typeof shop.longitude === 'number') {
            setLat(shop.latitude);
            setLng(shop.longitude);
            setAddress(shop.address ?? '');
            setCity(shop.city ?? '');
            setArea(shop.area ?? '');
            setZone(shop.zone ?? '');
            setLandmark(shop.landmark ?? '');
            setPincode(shop.pincode ?? '');
          }
        }
      } catch {
        /* shop load fail — defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Init map (once) — draggable marker = exact location pick
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(DEFAULT_CENTER, { icon: markerIcon, draggable: true }).addTo(map);
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

  // Saved coords load hone par marker + map move
  useEffect(() => {
    if (lat !== null && lng !== null && leafletRef.current && markerRef.current) {
      leafletRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  // Reverse geocode — fields auto-fill (city/area/address)
  async function reverseGeocodeAt(latitude: number, longitude: number) {
    setGeocoding(true);
    try {
      const place = await reverseGeocodePlace(latitude, longitude);
      if (place) {
        if (place.city) setCity(place.city);
        if (place.locality) setArea(place.locality);
        if (place.principalSubdivision && !city) setCity(place.principalSubdivision);
      }
    } catch {
      /* ignore — manual edit possible */
    } finally {
      setGeocoding(false);
    }
  }

  // Owner device location se — existing centralized system
  async function useDeviceLocation() {
    requestLocation();
    const loc = currentLocation || lastKnownFix;
    if (loc) {
      setLat(Number(loc.latitude.toFixed(6)));
      setLng(Number(loc.longitude.toFixed(6)));
      if (leafletRef.current && markerRef.current) {
        leafletRef.current.setView([loc.latitude, loc.longitude], 15);
        markerRef.current.setLatLng([loc.latitude, loc.longitude]);
      }
      reverseGeocodeAt(loc.latitude, loc.longitude);
    } else {
      setToast({ type: 'err', msg: 'Device location abhi available nahi — permission check karo ya map par pick karo.' });
    }
  }

  // Device location update hone par auto-fill (watch)
  useEffect(() => {
    const loc = currentLocation || lastKnownFix;
    if (loc && lat === null && lng === null) {
      setLat(Number(loc.latitude.toFixed(6)));
      setLng(Number(loc.longitude.toFixed(6)));
      if (leafletRef.current && markerRef.current) {
        leafletRef.current.setView([loc.latitude, loc.longitude], 15);
        markerRef.current.setLatLng([loc.latitude, loc.longitude]);
      }
      reverseGeocodeAt(loc.latitude, loc.longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, lastKnownFix]);

  async function save() {
    if (lat === null || lng === null) {
      setToast({ type: 'err', msg: 'Pehle location select karo (device ya map).' });
      return;
    }
    setSaving(true);
    setToast(null);
    try {
      const res = await updateShopLocation(supabase, {
        latitude: lat,
        longitude: lng,
        address: address.trim() || null,
        city: city.trim() || null,
        area: area.trim() || null,
        zone: normalizeZone(zone) ?? (zone.trim() || null),
        landmark: landmark.trim() || null,
        pincode: pincode.trim() || null,
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      });
      if (res.ok) {
        setToast({ type: 'ok', msg: 'Shop location saved — yahi salon ki canonical location hai.' });
      } else {
        setToast({ type: 'err', msg: res.error || 'Save failed' });
      }
    } catch (e) {
      setToast({ type: 'err', msg: String((e as Error)?.message ?? e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout currentScreen="shop-location" navigate={navigate} title="Set Shop Location" showBack onBack={() => navigate('profile')}>
      <div className="px-4 py-5 flex flex-col gap-4 max-w-md mx-auto w-full pb-28">

        {/* Intro */}
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> {shopName} — Shop Location
          </h2>
          <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
            Yeh saved location hi salon ki <b>canonical location</b> hai — users ko map marker, address
            aur Get Directions yahi coordinates se dikhenge. User ke GPS se salon ki location kabhi nahi badalti.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-xs text-on-surface-variant py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading shop...</div>
        ) : (
          <>
            {/* Map picker */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden">
              <div ref={mapRef} className="w-full h-64 bg-surface-variant" />
              <div className="p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={useDeviceLocation}
                    className="flex-1 bg-primary text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <LocateFixed className="w-3.5 h-3.5" /> Use current device location
                  </button>
                  <button
                    onClick={() => setToast({ type: 'ok', msg: 'Map par click karo ya marker drag karo — exact location pick hoga.' })}
                    className="flex-1 bg-surface-container-high text-on-surface text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <NavIcon className="w-3.5 h-3.5" /> Pick on map
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                  {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span className="font-mono">
                    {lat !== null && lng !== null
                      ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                      : 'Location not selected'}
                  </span>
                  {lat !== null && lng !== null && (
                    <span className="ml-auto text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> pinned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
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
                  <label className="text-[11px] font-semibold text-on-surface-variant">Pincode (optional)</label>
                  <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="302004" className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-on-surface-variant">Landmark (optional)</label>
                <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near City Park" className="w-full h-10 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
            </div>

            {/* Toast */}
            {toast && (
              <div className={`flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2.5 ${toast.type === 'ok' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'}`}>
                {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{toast.msg}</span>
              </div>
            )}

            {/* Save */}
            <button
              onClick={save}
              disabled={saving || lat === null}
              className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Shop Location'}
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
