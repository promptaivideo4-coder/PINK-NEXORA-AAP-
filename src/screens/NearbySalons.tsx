/**
 * NearbySalons – Ultra Minimal (Only Salons, Location Silent)
 * Dashboard se hata diya, sirf yahan location use hoga
 * No drama UI – no big black buttons, no pink status pills
 */

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { MapPin } from 'lucide-react';
import {
  SalonWithCoords,
  SalonDistance,
  groupSalonsByDistance,
  PERMISSION_DENIED_MESSAGE,
} from '../lib/geolocation';
import { useLocation } from '../contexts/LocationContext';
import { supabase } from '../lib/supabase';

const DEMO_SALONS: SalonWithCoords[] = [
  { id: 's1', name: 'Glamour Salon — C-Scheme', latitude: 26.9124, longitude: 75.7873, address: 'C-Scheme, Jaipur', city: 'Jaipur', ratingAverage: 4.8, rating: 4.8, featured: true, lastActiveAt: Date.now() - 5 * 60 * 1000 },
  { id: 's2', name: 'Luxe Beauty Lounge — MI Road', latitude: 26.892, longitude: 75.796, address: 'MI Road, Jaipur', city: 'Jaipur', ratingAverage: 4.6, rating: 4.6, featured: false, lastActiveAt: Date.now() - 30 * 60 * 1000 },
  { id: 's3', name: 'Rajwada Salon — Johari Bazar', latitude: 26.926, longitude: 75.8235, address: 'Johari Bazar, Jaipur', city: 'Jaipur', ratingAverage: 4.5, rating: 4.5, featured: false, lastActiveAt: Date.now() - 120 * 60 * 1000 },
  { id: 's4', name: 'Pink City Cuts — Hawa Mahal', latitude: 26.9239, longitude: 75.8267, address: 'Hawa Mahal Rd, Jaipur', city: 'Jaipur', ratingAverage: 4.9, rating: 4.9, featured: true, lastActiveAt: Date.now() - 2 * 60 * 1000 },
  { id: 's5', name: 'Sunrise Unisex Salon — Tonk Rd', latitude: 26.88, longitude: 75.808, address: 'Tonk Road, Jaipur', city: 'Jaipur', ratingAverage: 4.2, rating: 4.2, featured: false, lastActiveAt: Date.now() - 60 * 60 * 1000 },
  { id: 's6', name: 'Bold Beauty Studio — Malviya Nagar', latitude: 26.8575, longitude: 75.815, address: 'Malviya Nagar, Jaipur', city: 'Jaipur', ratingAverage: 4.4, rating: 4.4, featured: true, lastActiveAt: Date.now() - 10 * 60 * 1000 },
];

function fmtDistance(km: number | null, m: number | null): string {
  if (m !== null && isFinite(m)) {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  }
  if (km === null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function NearbySalons({ navigate }: NavigationProps) {
  const {
    acceptedFix,
    permissionDenied,
    currentLocation,
    groupedSalons: productionGrouped,
    setSalons: setSalonsToService,
    requestLocation,
    retryPermission,
  } = useLocation();

  const [salons, setSalons] = useState<SalonWithCoords[]>(DEMO_SALONS);
  const [grouped, setGrouped] = useState(() => groupSalonsByDistance(DEMO_SALONS, null));

  // Auto request location silently when screen opens (no drama)
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch real salons
  useEffect(() => {
    async function fetchReal() {
      try {
        const { data, error } = await supabase
          .from('salons')
          .select('id, name, latitude, longitude, rating_average, verified, address, city, updated_at')
          .eq('verified', true)
          .is('deleted_at', null)
          .limit(80);
        if (!error && data && data.length > 0) {
          const mapped: SalonWithCoords[] = data
            .filter((r: any) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
            .map((r: any) => ({
              id: String(r.id),
              name: r.name || 'Salon',
              latitude: r.latitude,
              longitude: r.longitude,
              address: r.address || null,
              city: r.city || null,
              ratingAverage: Number(r.rating_average ?? 0),
              rating: Number(r.rating_average ?? 0),
              featured: Boolean((r as any).featured ?? false),
              lastActiveAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
            }));
          if (mapped.length > 0) {
            setSalons(mapped);
            setSalonsToService(mapped as any);
          } else {
            setSalonsToService(DEMO_SALONS as any);
          }
        } else {
          setSalonsToService(DEMO_SALONS as any);
        }
      } catch {
        setSalonsToService(DEMO_SALONS as any);
      }
    }
    fetchReal();
  }, [setSalonsToService]);

  useEffect(() => {
    if (acceptedFix && !productionGrouped) {
      setGrouped(groupSalonsByDistance(salons, { latitude: acceptedFix.latitude, longitude: acceptedFix.longitude }));
    }
  }, [acceptedFix, salons, productionGrouped]);

  useEffect(() => {
    if (productionGrouped) {
      const convert = (arr: any[]): SalonDistance[] =>
        arr.map((s: any) => ({
          salon: {
            id: s.id,
            name: s.name,
            latitude: s.latitude,
            longitude: s.longitude,
            address: (s as any).address ?? null,
            city: (s as any).city ?? null,
            ratingAverage: s.rating ?? 0,
            rating: s.rating ?? 0,
            featured: s.featured ?? false,
          },
          distanceKm: s.distanceKm ?? s.distance / 1000 ?? null,
          distanceM: s.distance ?? null,
          distanceLabel: s.distanceLabel ?? fmtDistance(s.distanceKm ?? s.distance / 1000, s.distance),
        }));
      setGrouped({
        nearby: convert((productionGrouped as any).nearby || []),
        close: convert((productionGrouped as any).close || []),
        aroundYou: convert((productionGrouped as any).aroundYou || []),
        everythingElse: convert((productionGrouped as any).everythingElse || []),
        allSorted: convert((productionGrouped as any).allSorted || []),
      });
    }
  }, [productionGrouped]);

  const displayLoc = currentLocation || acceptedFix;

  return (
    <Layout currentScreen="nearby-salons" navigate={navigate} title="Nearby Salons" showBack onBack={() => navigate('dashboard')}>
      <div className="px-4 py-5 flex flex-col gap-4 max-w-md mx-auto w-full pb-28">

        {/* Permission denied – minimal */}
        {permissionDenied && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-[12px] text-red-700 font-medium">{PERMISSION_DENIED_MESSAGE}</p>
            <button onClick={retryPermission} className="text-[12px] font-bold text-red-700 underline">Retry</button>
          </div>
        )}

        {/* Subtle location info – only if available, no big card */}
        {displayLoc && (
          <p className="text-[11px] text-[#8a8a8a] px-1">
            📍 {displayLoc.latitude.toFixed(4)}, {displayLoc.longitude.toFixed(4)} • {Math.round(displayLoc.accuracy)}m away
          </p>
        )}

        {/* Salons list – clean */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold">Nearby Salons</h2>
            <span className="text-[11px] text-[#8a8a8a]">{displayLoc ? `${grouped.allSorted.length} found` : `${salons.length} salons`}</span>
          </div>

          <div className="flex flex-col gap-3">
            {grouped.nearby.length > 0 && <Group title="Nearby" sub="0–2 km" salons={grouped.nearby} />}
            {grouped.close.length > 0 && <Group title="Close" sub="2–5 km" salons={grouped.close} />}
            {grouped.aroundYou.length > 0 && <Group title="Around You" sub="5–10 km" salons={grouped.aroundYou} />}
            {grouped.everythingElse.length > 0 && <Group title="More" sub="" salons={grouped.everythingElse} />}
            
            {/* Fallback when no location – show all unsorted */}
            {!displayLoc && grouped.allSorted.length === 0 && (
              <div className="flex flex-col gap-2">
                {salons.map((s) => (
                  <div key={s.id} className="bg-white border border-[#f0f0f0] rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate">{s.name}</p>
                      <p className="text-[11px] text-[#8a8a8a] truncate">{(s as any).address || 'Jaipur'}</p>
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

function Group({ title, sub, salons }: { title: string; sub: string; salons: SalonDistance[] }) {
  if (salons.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] font-semibold">{title}</span>
        {sub && <span className="text-[10px] text-[#8a8a8a]">{sub}</span>}
      </div>
      <div className="flex flex-col gap-2">
        {salons.map(({ salon, distanceM, distanceKm, distanceLabel }) => (
          <div key={salon.id} className="bg-white border border-[#f0f0f0] rounded-xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-all">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{salon.name}</p>
              <p className="text-[11px] text-[#8a8a8a] truncate">{(salon as any).address || 'Jaipur'}{distanceLabel ? ` • ${distanceLabel}` : ''}</p>
            </div>
            {distanceLabel && <span className="text-[12px] font-bold text-[#1f1f1f] ml-3 shrink-0">{distanceLabel}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
