/**
 * NearbySalons – Ultra Minimal (Only Salons, Location Silent)
 * ==========================================================
 * STEP 12/14: COMPLETE — legacy shim hata diya gaya.
 * Location → useNearbySalons → useNexoraLocation → LocationContext → src/location/*
 * Koi direct GPS / koi old shim import nahi.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { MapPin } from 'lucide-react';
import { Salon, SalonWithDistance } from '../location/types';
import { STATUS_MESSAGES } from '../location/constants';
import { nearbySalonService } from '../location/NearbySalonService';
import { useLocation } from '../contexts/LocationContext';
import { useNearbySalons } from '../hooks/useNearbySalons';
import { supabase } from '../lib/supabase';
import { reverseGeocodePlace } from '../lib/reverseGeocode';
import { resolveServiceArea, filterJaipurSalons, ServiceArea } from '../lib/salonServiceArea';

/** Supabase salon row (verified salons) — typed mapping row */
interface SalonRow {
  id: string | number;
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  rating_average: number | null;
  verified: boolean | null;
  address: string | null;
  area: string | null;
  city: string | null;
  updated_at: string | null;
  featured?: boolean | null;
}

/** Address accessor — Salon has index signature `[key: string]: unknown` */
function salonAddress(s: Salon | SalonWithDistance): string | null {
  return (s.address as string | null | undefined) ?? null;
}

const DEMO_SALONS: Salon[] = [
  { id: 's1', name: 'Glamour Salon — C-Scheme', latitude: 26.9124, longitude: 75.7873, address: 'C-Scheme, Jaipur', city: 'Jaipur', rating: 4.8, ratingAverage: 4.8, featured: true, lastActiveAt: Date.now() - 5 * 60 * 1000 },
  { id: 's2', name: 'Luxe Beauty Lounge — MI Road', latitude: 26.892, longitude: 75.796, address: 'MI Road, Jaipur', city: 'Jaipur', rating: 4.6, ratingAverage: 4.6, featured: false, lastActiveAt: Date.now() - 30 * 60 * 1000 },
  { id: 's3', name: 'Rajwada Salon — Johari Bazar', latitude: 26.926, longitude: 75.8235, address: 'Johari Bazar, Jaipur', city: 'Jaipur', rating: 4.5, ratingAverage: 4.5, featured: false, lastActiveAt: Date.now() - 120 * 60 * 1000 },
  { id: 's4', name: 'Pink City Cuts — Hawa Mahal', latitude: 26.9239, longitude: 75.8267, address: 'Hawa Mahal Rd, Jaipur', city: 'Jaipur', rating: 4.9, ratingAverage: 4.9, featured: true, lastActiveAt: Date.now() - 2 * 60 * 1000 },
  { id: 's5', name: 'Sunrise Unisex Salon — Tonk Rd', latitude: 26.88, longitude: 75.808, address: 'Tonk Road, Jaipur', city: 'Jaipur', rating: 4.2, ratingAverage: 4.2, featured: false, lastActiveAt: Date.now() - 60 * 60 * 1000 },
  { id: 's6', name: 'Bold Beauty Studio — Malviya Nagar', latitude: 26.8575, longitude: 75.815, address: 'Malviya Nagar, Jaipur', city: 'Jaipur', rating: 4.4, ratingAverage: 4.4, featured: true, lastActiveAt: Date.now() - 10 * 60 * 1000 },
];

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

  const [salons, setSalons] = useState<Salon[]>(DEMO_SALONS);
  const [fallbackGrouped, setFallbackGrouped] = useState<import('../location/types').GroupedSalons | null>(null);

  // Service-area state — GPS coords → reverse geocode → Jaipur catalog decide
  const [serviceArea, setServiceArea] = useState<ServiceArea>({
    city: null,
    isJaipur: false,
    zone: null,
    isSupportedZone: false,
  });

  // Location-based service area (Jaipur): GPS coords se, cached reverse geocode.
  // NOTE: strict point-in-polygon Jaipur boundary dataset project me nahi hai —
  // ye city-level hint hai (kis catalog load karna hai); salon filtering/distance
  // actual salon coordinates + Haversine se hoti hai (NearbySalonService).
  useEffect(() => {
    const loc = currentLocation || lastKnownFix;
    if (!loc) return;
    let cancelled = false;
    reverseGeocodePlace(loc.latitude, loc.longitude).then((place) => {
      if (!cancelled) setServiceArea(resolveServiceArea(place));
    });
    return () => {
      cancelled = true;
    };
  }, [currentLocation?.latitude, currentLocation?.longitude, lastKnownFix?.latitude, lastKnownFix?.longitude]);

  // Service-area filter: Jaipur me ho to sirf Jaipur salons (salon.city field se).
  // GPS boundary nahi — salon ka apna city/area metadata + distance logic.
  // Memoized taaki useNearbySalons ka salons-effect har render par na chale.
  const visibleSalons = useMemo(
    () => (serviceArea.isJaipur ? filterJaipurSalons(salons) : salons),
    [serviceArea.isJaipur, salons],
  );

  // Composition hook — location (useNexoraLocation) + distance/sort/group (src/location)
  const { grouped, isLoading, error, isDenied } = useNearbySalons({ salons: visibleSalons });

  // Auto request location silently when screen opens (no drama)
  // requestLocation useCallback([]) se stable hai — mount par hi ek baar fire hoga.
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Fetch real salons from Supabase (verified salons with coordinates)
  useEffect(() => {
    async function fetchReal() {
      try {
        const { data, error } = await supabase
          .from('salons')
          .select('id, name, latitude, longitude, rating_average, verified, address, area, city, updated_at')
          .eq('verified', true)
          .is('deleted_at', null)
          .limit(80);
        if (!error && data && data.length > 0) {
          const mapped: Salon[] = (data as SalonRow[])
            .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
            .map((r) => ({
              id: String(r.id),
              name: r.name || 'Salon',
              latitude: r.latitude as number,
              longitude: r.longitude as number,
              address: r.address || null,
              area: r.area || null,
              city: r.city || null,
              rating: Number(r.rating_average ?? 0),
              ratingAverage: Number(r.rating_average ?? 0),
              featured: Boolean(r.featured ?? false),
              lastActiveAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
            }));
          if (mapped.length > 0) setSalons(mapped);
        }
      } catch {
        // demo salons rahenge
      }
    }
    fetchReal();
  }, []);

  // STEP 10: low-accuracy fallback — validated location nahi, par lastKnownFix se
  // bhi grouping dikha do (screen low-GPS areas me usable rehti hai).
  useEffect(() => {
    if (!grouped && lastKnownFix && visibleSalons.length > 0) {
      const result = nearbySalonService.calculateIfNeeded(lastKnownFix, visibleSalons, true);
      if (result) setFallbackGrouped(result.grouped);
    }
  }, [grouped, lastKnownFix, visibleSalons]);

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

        {/* Salons list – clean */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold">Nearby Salons</h2>
            <span className="text-[11px] text-[#8a8a8a]">
              {displayLoc
                ? `${displayGrouped?.allSorted.length ?? 0} found`
                : `${visibleSalons.length} salons`}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {displayGrouped && (
              <>
                {displayGrouped.nearby.length > 0 && <Group title="Nearby" sub="0–2 km" salons={displayGrouped.nearby} />}
                {displayGrouped.close.length > 0 && <Group title="Close" sub="2–5 km" salons={displayGrouped.close} />}
                {displayGrouped.aroundYou.length > 0 && <Group title="Around You" sub="5–10 km" salons={displayGrouped.aroundYou} />}
                {displayGrouped.everythingElse.length > 0 && <Group title="More" sub="" salons={displayGrouped.everythingElse} />}
              </>
            )}

            {/* Fallback when no location – show all unsorted */}
            {!displayLoc && (!displayGrouped || displayGrouped.allSorted.length === 0) && (
              <div className="flex flex-col gap-2">
                {visibleSalons.map((s) => (
                  <div key={s.id} className="bg-white border border-[#f0f0f0] rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate">{s.name}</p>
                      <p className="text-[11px] text-[#8a8a8a] truncate">{salonAddress(s) || 'Jaipur'}</p>
                    </div>
                    <MapPin className="w-4 h-4 text-[#c6c6c6] ml-3" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Group({ title, sub, salons }: { title: string; sub: string; salons: SalonWithDistance[] }) {
  if (salons.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] font-semibold">{title}</span>
        {sub && <span className="text-[10px] text-[#8a8a8a]">{sub}</span>}
      </div>
      <div className="flex flex-col gap-2">
        {salons.map((s) => (
          <div key={s.id} className="bg-white border border-[#f0f0f0] rounded-xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-all">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{s.name}</p>
              <p className="text-[11px] text-[#8a8a8a] truncate">
                {salonAddress(s) || 'Jaipur'}{s.distanceLabel ? ` • ${s.distanceLabel}` : ''}
              </p>
            </div>
            {s.distanceLabel && (
              <span className="text-[12px] font-bold text-[#1f1f1f] ml-3 shrink-0">{s.distanceLabel}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
