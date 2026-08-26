/**
 * NearbySalons – Ultra Minimal (Only Salons, Location Silent)
 * ==========================================================
 * Location architecture: SHOP'S SAVED LOCATION = salon ki canonical location.
 *  - Salon list: verified salons apni saved lat/lng/city/area se.
 *  - User GPS sirf "Near Me" distance sorting ke liye (NearbySalonService).
 *  - Salon detail: map marker + Get Directions salon ke saved coordinates se.
 *  - User GPS salon ki location kabhi overwrite nahi karta.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { MapPin, X, Navigation as NavIcon, Loader2 } from 'lucide-react';
import { Salon, SalonWithDistance } from '../location/types';
import { STATUS_MESSAGES } from '../location/constants';
import { nearbySalonService } from '../location/NearbySalonService';
import { useLocation } from '../contexts/LocationContext';
import { useNearbySalons } from '../hooks/useNearbySalons';
import { salonAreaLabel, salonFullLabel, getDirectionsUrl } from '../lib/salonServiceArea';
import { supabase } from '../lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/** Supabase salon row (verified salons) — typed mapping row */
interface SalonRow {
  id: string | number;
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  rating_average: number | null;
  verified: boolean | null;
  location_address: string | null;
  location_area: string | null;
  location_city: string | null;
  location_zone: string | null;
  location_landmark: string | null;
  location_pincode: string | null;
  updated_at: string | null;
  featured?: boolean | null;
}

/** Address accessor — Salon has index signature `[key: string]: unknown` */
function salonAddress(s: Salon | SalonWithDistance): string | null {
  return (s.address as string | null | undefined) ?? null;
}



/** Leaflet CSS marker — default icon assets se bachne ke liye */
const detailMarkerIcon = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;background:#e6007e;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35);"><div style="width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:7px;left:7px;"></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

/** Salon detail modal — map marker + saved address + Get Directions (salon coords se) */
function SalonDetailModal({ salon, onClose }: { salon: Salon; onClose: () => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const hasCoords =
      typeof salon.latitude === 'number' &&
      typeof salon.longitude === 'number' &&
      Number.isFinite(salon.latitude) &&
      Number.isFinite(salon.longitude);
    const center: [number, number] = hasCoords
      ? [salon.latitude as number, salon.longitude as number]
      : [26.9124, 75.7873];
    const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    if (hasCoords) {
      L.marker(center, { icon: detailMarkerIcon }).addTo(map);
    }
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [salon.latitude, salon.longitude]);

  const hasCoords =
    typeof salon.latitude === 'number' &&
    typeof salon.longitude === 'number' &&
    Number.isFinite(salon.latitude) &&
    Number.isFinite(salon.longitude);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/40">
          <h2 className="text-base font-bold truncate flex-1">{salon.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map — salon ke saved coordinates par marker */}
        <div className="relative h-52 bg-surface-variant">
          <div ref={mapRef} className="absolute inset-0" />
          {!hasCoords && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-variant/80 text-xs text-on-surface-variant">
              Owner ne abhi coordinates set nahi kiye — address saved hai.
            </div>
          )}
        </div>

        {/* Saved location details */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">{salonFullLabel(salon)}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {salonAreaLabel(salon) || (salonAddress(salon) || 'Location set by salon')}
              </p>
            </div>
          </div>

          {hasCoords && (
            <div className="bg-surface-container-low rounded-xl px-3 py-2 font-mono text-[10.5px] text-on-surface-variant">
              📍 {Number(salon.latitude).toFixed(6)}, {Number(salon.longitude).toFixed(6)}
            </div>
          )}

          {/* Get Directions — salon ke saved coordinates se */}
          <a
            href={hasCoords ? getDirectionsUrl(Number(salon.latitude), Number(salon.longitude)) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={hasCoords ? undefined : (e) => e.preventDefault()}
            className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl transition-all ${
              hasCoords
                ? 'bg-primary text-white hover:opacity-90 active:scale-[0.98] shadow-md'
                : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
            }`}
          >
            <NavIcon className="w-4 h-4" />
            {hasCoords ? 'Get Directions' : 'Directions unavailable (no coordinates)'}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function NearbySalons({ navigate }: NavigationProps) {
  // Centralized location access (context = global state layer)
  const {
    permission,
    permissionDenied,
    currentLocation,
    lastKnownFix,
    requestLocation,
    retryPermission,
    watchOn,
    statusMessage,
    errorMsg: ctxError,
  } = useLocation();

  // REAL data only — the previous hardcoded DEMO_SALONS (fake Jaipur salons
  // with fake ratings) were removed in the final release audit. Empty or
  // failed loads now show an honest empty/error state.
  const [salons, setSalons] = useState<Salon[]>([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [salonsError, setSalonsError] = useState<string | null>(null);
  const [fallbackGrouped, setFallbackGrouped] = useState<import('../location/types').GroupedSalons | null>(null);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);

  // Composition hook — location (useNexoraLocation) + distance/sort/group (src/location)
  // User GPS sirf distance sorting ke liye — salon locations kabhi nahi badalti.
  const { grouped, isLoading, error, isDenied } = useNearbySalons({ salons });

  // Auto request location silently when screen opens (no drama)
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Fetch real salons from Supabase (verified salons with their OWN saved location)
  const fetchRealSalons = useCallback(async () => {
    setSalonsLoading(true);
    setSalonsError(null);
    try {
      const { data, error } = await supabase
        .from('salons')
        .select('id, name, latitude, longitude, rating_average, verified, location_address, location_area, location_city, location_zone, location_landmark, location_pincode, updated_at')
        .eq('verified', true)
        .is('deleted_at', null)
        .limit(80);
      if (error) {
        setSalonsError(error.message);
        setSalons([]);
        return;
      }
      const mapped: Salon[] = (data ?? [])
        // NULL coordinates wale salons gracefully skip (koi fake coords nahi) —
        // owner ne location set nahi ki to salon distance-list me nahi aata.
        .filter((r: SalonRow) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
        .map((r: SalonRow) => ({
          id: String(r.id),
          name: r.name || 'Salon',
          latitude: r.latitude as number,
          longitude: r.longitude as number,
          address: r.location_address || null,
          area: r.location_area || null,
          city: r.location_city || null,
          zone: r.location_zone || null,
          landmark: r.location_landmark || null,
          pincode: r.location_pincode || null,
          rating: Number(r.rating_average ?? 0),
          ratingAverage: Number(r.rating_average ?? 0),
          featured: Boolean(r.featured ?? false),
          lastActiveAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
        }));
      setSalons(mapped);
    } catch (e: any) {
      console.error('Nearby salons fetch failed:', e);
      setSalonsError(e?.message || 'Could not load salons');
      setSalons([]);
    } finally {
      setSalonsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRealSalons(); }, [fetchRealSalons]);

  // STEP 10: low-accuracy fallback — validated location nahi, par lastKnownFix se
  // bhi grouping dikha do (screen low-GPS areas me usable rehti hai).
  useEffect(() => {
    if (!grouped && lastKnownFix && salons.length > 0) {
      const result = nearbySalonService.calculateIfNeeded(lastKnownFix, salons, true);
      if (result) setFallbackGrouped(result.grouped);
    }
  }, [grouped, lastKnownFix, salons]);

  const displayLoc = currentLocation || lastKnownFix;
  const isLowAccuracy = !!lastKnownFix && !currentLocation;
  const displayGrouped = grouped || fallbackGrouped;

  return (
    <Layout currentScreen="nearby-salons" navigate={navigate} title="Nearby Salons" showBack onBack={() => navigate('dashboard')}>
      <div className="px-4 py-5 flex flex-col gap-4 max-w-md mx-auto w-full pb-28">

        {/* Permission denied – minimal */}
        {permissionDenied && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-[12px] text-red-700 font-medium">{STATUS_MESSAGES.PERMISSION_DENIED}</p>
            <button onClick={retryPermission} className="text-[12px] font-bold text-red-700 underline">Retry</button>
          </div>
        )}

        {/* Browser does not support geolocation – graceful (STEP 16) */}
        {permission === 'unsupported' && !permissionDenied && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-[12px] text-gray-700 font-medium">
              Location services not supported in this browser. Isko enable karne ke liye Chrome/Safari me kholo.
            </p>
          </div>
        )}

        {/* Loading state – GPS detect ho raha hai (subtle) */}
        {!displayLoc && !permissionDenied && permission !== 'unsupported' && watchOn && (
          <p className="text-[11px] text-[#8a8a8a] px-1">
            ⏳ {statusMessage || 'Detecting your location...'}
          </p>
        )}

        {/* Error state (non-denied) – timeout / unavailable / weak signal / offline */}
        {!permissionDenied && permission !== 'unsupported' && (ctxError || error) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-[12px] text-amber-800 font-medium">{ctxError || error}</p>
            <button onClick={() => retryPermission()} className="text-[12px] font-bold text-amber-800 underline">Retry</button>
          </div>
        )}

        {/* Subtle location info – only if available, no big card */}
        {displayLoc && (
          <p className="text-[11px] text-[#8a8a8a] px-1">
            📍 {displayLoc.latitude.toFixed(4)}, {displayLoc.longitude.toFixed(4)} • {Math.round(displayLoc.accuracy)}m away
            {isLowAccuracy && (
              <span className="text-amber-600 font-semibold"> • low accuracy — better GPS fix ka wait</span>
            )}
          </p>
        )}

        {/* Database error state (separate from GPS errors) */}
        {salonsError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-[12px] text-red-700 font-medium">Could not load salons from the database: {salonsError}</p>
            <button onClick={() => void fetchRealSalons()} className="text-[12px] font-bold text-red-700 underline shrink-0">Retry</button>
          </div>
        )}

        {/* Salons list – clean */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold">Nearby Salons</h2>
            <span className="text-[11px] text-[#8a8a8a]">
              {displayLoc
                ? `${displayGrouped?.allSorted.length ?? 0} found`
                : `${salons.length} salons`}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {displayGrouped && (
              <>
                {displayGrouped.nearby.length > 0 && <Group title="Nearby" sub="0–2 km" salons={displayGrouped.nearby} onOpen={setSelectedSalon} />}
                {displayGrouped.close.length > 0 && <Group title="Close" sub="2–5 km" salons={displayGrouped.close} onOpen={setSelectedSalon} />}
                {displayGrouped.aroundYou.length > 0 && <Group title="Around You" sub="5–10 km" salons={displayGrouped.aroundYou} onOpen={setSelectedSalon} />}
                {displayGrouped.everythingElse.length > 0 && <Group title="More" sub="" salons={displayGrouped.everythingElse} onOpen={setSelectedSalon} />}
              </>
            )}

            {/* Empty state — no verified salons with a saved location yet */}
            {!salonsLoading && !salonsError && salons.length === 0 && (
              <div className="bg-white border border-dashed border-[#e0e0e0] rounded-xl p-6 text-center">
                <p className="text-[13px] font-bold">No verified salons yet</p>
                <p className="text-[11px] text-[#8a8a8a] mt-1">
                  Salons appear here once the owner verifies the salon and saves its exact location.
                </p>
              </div>
            )}

            {/* Fallback when no location – show all unsorted */}
            {!displayLoc && (!displayGrouped || displayGrouped.allSorted.length === 0) && (
              <div className="flex flex-col gap-2">
                {salons.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSalon(s)}
                    className="bg-white border border-[#f0f0f0] rounded-xl p-3.5 flex items-center justify-between text-left active:scale-[0.99] transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate">{s.name}</p>
                      <p className="text-[11px] text-[#8a8a8a] truncate">{salonAreaLabel(s) || salonAddress(s) || 'Location set by salon'}</p>
                    </div>
                    <MapPin className="w-4 h-4 text-[#c6c6c6] ml-3 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Salon detail modal — owner ki saved location */}
      {selectedSalon && <SalonDetailModal salon={selectedSalon} onClose={() => setSelectedSalon(null)} />}
    </Layout>
  );
}

function Group({
  title,
  sub,
  salons,
  onOpen,
}: {
  title: string;
  sub: string;
  salons: SalonWithDistance[];
  onOpen: (s: Salon) => void;
}) {
  if (salons.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] font-semibold">{title}</span>
        {sub && <span className="text-[10px] text-[#8a8a8a]">{sub}</span>}
      </div>
      <div className="flex flex-col gap-2">
        {salons.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpen(s)}
            className="bg-white border border-[#f0f0f0] rounded-xl p-3.5 flex items-center justify-between text-left active:scale-[0.99] transition-all"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{s.name}</p>
              <p className="text-[11px] text-[#8a8a8a] truncate">
                {salonAreaLabel(s) || salonAddress(s) || 'Location set by salon'}
                {s.distanceLabel ? ` • ${s.distanceLabel}` : ''}
              </p>
            </div>
            {s.distanceLabel && (
              <span className="text-[12px] font-bold text-[#1f1f1f] ml-3 shrink-0">{s.distanceLabel}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
