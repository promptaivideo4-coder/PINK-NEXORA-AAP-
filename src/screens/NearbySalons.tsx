/**
 * NearbySalons.tsx – MINIMAL UI (Only Location Show)
 * User ne bola: "IS TARAH SE NHI BANANA HAI ONLY LOCATION HI SHOW HO NA YE ITNA SAB KUCH"
 * Isliye ab sirf location aur nearby salons dikhega, koi debug log / config / zyada detail nahi
 *
 * Production GPS logic same hai (watchPosition only, 0-15 excellent, 16-30 good, 31-50 wait 10s, 51-100 improving, >100 reject, Haversine R=6371000, >100m recalc)
 * Par UI minimal clean
 */

import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { MapPin, LocateFixed, AlertTriangle } from 'lucide-react';
import {
  SalonWithCoords,
  SalonDistance,
  groupSalonsByDistance,
  PERMISSION_DENIED_MESSAGE,
  STATUS_MESSAGES,
} from '../lib/geolocation';
import { useLocation } from '../contexts/LocationContext';
import { supabase } from '../lib/supabase';

const DEMO_SALONS: SalonWithCoords[] = [
  { id: 's1', name: 'Glamour Salon — C-Scheme', latitude: 26.9124, longitude: 75.7873, address: 'C-Scheme, Jaipur', city: 'Jaipur', ratingAverage: 4.8, rating: 4.8, featured: true, lastActiveAt: Date.now() - 5 * 60 * 1000 },
  { id: 's2', name: 'Luxe Beauty Lounge — MI Road', latitude: 26.892, longitude: 75.796, address: 'MI Road, Jaipur', city: 'Jaipur', ratingAverage: 4.6, rating: 4.6, featured: false, lastActiveAt: Date.now() - 30 * 60 * 1000 },
  { id: 's3', name: 'Rajwada Salon — Johari Bazar', latitude: 26.926, longitude: 75.8235, address: 'Johari Bazar', city: 'Jaipur', ratingAverage: 4.5, rating: 4.5, featured: false, lastActiveAt: Date.now() - 120 * 60 * 1000 },
  { id: 's4', name: 'Pink City Cuts — Hawa Mahal', latitude: 26.9239, longitude: 75.8267, address: 'Hawa Mahal Rd, Jaipur', city: 'Jaipur', ratingAverage: 4.9, rating: 4.9, featured: true, lastActiveAt: Date.now() - 2 * 60 * 1000 },
  { id: 's5', name: 'Sunrise Unisex Salon — Tonk Rd', latitude: 26.88, longitude: 75.808, address: 'Tonk Road, Jaipur', city: 'Jaipur', ratingAverage: 4.2, rating: 4.2, featured: false, lastActiveAt: Date.now() - 60 * 60 * 1000 },
  { id: 's6', name: 'Bold Beauty Studio — Malviya Nagar', latitude: 26.8575, longitude: 75.815, address: 'Malviya Nagar, Jaipur', city: 'Jaipur', ratingAverage: 4.4, rating: 4.4, featured: true, lastActiveAt: Date.now() - 10 * 60 * 1000 },
];

function fmtDistance(km: number | null, m: number | null): string {
  if (m !== null && isFinite(m)) {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  }
  if (km === null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function NearbySalons({ navigate }: NavigationProps) {
  const {
    acceptedFix,
    permission,
    permissionDenied,
    watchOn,
    requestLocation,
    currentLocation,
    gpsStatus,
    statusMessage,
    groupedSalons: productionGrouped,
    setSalons: setSalonsToService,
    retryPermission,
  } = useLocation();

  const [salons, setSalons] = useState<SalonWithCoords[]>(DEMO_SALONS);
  const [grouped, setGrouped] = useState(() => groupSalonsByDistance(DEMO_SALONS, null));
  const [isFetching, setIsFetching] = useState(false);

  // Fetch real salons from Supabase (verified) else demo
  useEffect(() => {
    async function fetchReal() {
      setIsFetching(true);
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
      } finally {
        setIsFetching(false);
      }
    }
    fetchReal();
  }, [setSalonsToService]);

  // Local grouping fallback when productionGrouped not yet available
  useEffect(() => {
    if (acceptedFix && !productionGrouped) {
      setGrouped(groupSalonsByDistance(salons, { latitude: acceptedFix.latitude, longitude: acceptedFix.longitude }));
    }
  }, [acceptedFix, salons, productionGrouped]);

  // Use production grouped when available
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
  const isDenied = permissionDenied || permission === 'denied';

  // Minimal status text
  let statusText = 'Detecting your location...';
  if (isDenied) statusText = PERMISSION_DENIED_MESSAGE;
  else if (displayLoc) statusText = `Location updated • ${Math.round(displayLoc.accuracy)}m accuracy`;
  else if (statusMessage) statusText = statusMessage;

  return (
    <Layout currentScreen="nearby-salons" navigate={navigate} title="Nearby Salons" showBack onBack={() => navigate('dashboard')}>
      <div className="px-4 py-5 flex flex-col gap-4 max-w-md mx-auto w-full pb-28">

        {/* Minimal status pill */}
        <div className={`rounded-2xl px-4 py-3 flex items-center gap-2.5 ${isDenied ? 'bg-red-50 border border-red-200' : displayLoc ? 'bg-[#fdf2f6] border border-[#f8d7e3]' : 'bg-[#fdf2f6] border border-[#f8d7e3]'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDenied ? 'bg-red-500 text-white' : 'bg-[#c6005c] text-white'}`}>
            {isDenied ? <AlertTriangle className="w-4 h-4" /> : <LocateFixed className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-semibold truncate ${isDenied ? 'text-red-700' : 'text-[#1f1f1f]'}`}>{statusText}</p>
            <p className="text-[11px] text-[#6b6b6b]">{watchOn ? 'Live GPS active' : 'Tap retry to enable location'}</p>
          </div>
          {watchOn && !isDenied && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
        </div>

        {/* If denied – only retry */}
        {isDenied && (
          <button onClick={retryPermission} className="w-full bg-[#c6005c] text-white font-bold text-sm py-3 rounded-xl">
            Retry Location
          </button>
        )}

        {/* ONLY LOCATION card – minimal */}
        <div className="bg-white border border-[#f0f0f0] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[#c6005c]" />
            <h2 className="text-[14px] font-bold">My Location</h2>
            {displayLoc && <span className="ml-auto text-[10px] bg-[#fdf2f6] text-[#c6005c] px-2 py-0.5 rounded-full font-bold">{Math.round(displayLoc.accuracy)}m</span>}
          </div>
          {displayLoc ? (
            <div className="space-y-1">
              <p className="text-[13px] font-mono">Lat: <b>{displayLoc.latitude.toFixed(5)}</b> • Lng: <b>{displayLoc.longitude.toFixed(5)}</b></p>
              <p className="text-[11px] text-[#6b6b6b]">{displayLoc.latitude.toFixed(6)}, {displayLoc.longitude.toFixed(6)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[13px] text-[#6b6b6b]">Location abhi available nahi hai</p>
              <button onClick={requestLocation} className="w-full bg-[#1f1f1f] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                <LocateFixed className="w-3.5 h-3.5" /> Location abhi le
              </button>
            </div>
          )}
        </div>

        {/* Nearby salons – clean list only */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold">Nearby Salons</h2>
            <span className="text-[11px] text-[#6b6b6b]">{isFetching ? 'Loading...' : displayLoc ? `${grouped.allSorted.length} found` : 'Need location'}</span>
          </div>

          {!displayLoc ? (
            <div className="bg-white border border-dashed border-[#e0e0e0] rounded-2xl p-6 text-center">
              <MapPin className="w-8 h-8 mx-auto text-[#c6c6c6] mb-2" />
              <p className="text-[13px] text-[#6b6b6b]">Enable location to see salons near you</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {grouped.nearby.length > 0 && <Group title="Nearby" km="0–2 km" salons={grouped.nearby} />}
              {grouped.close.length > 0 && <Group title="Close" km="2–5 km" salons={grouped.close} />}
              {grouped.aroundYou.length > 0 && <Group title="Around You" km="5–10 km" salons={grouped.aroundYou} />}
              {grouped.everythingElse.length > 0 && <Group title="Others" km=">10 km" salons={grouped.everythingElse} />}
              {grouped.allSorted.length === 0 && <p className="text-center text-[13px] text-[#6b6b6b] py-6">No salons found</p>}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Group({ title, km, salons }: { title: string; km: string; salons: SalonDistance[] }) {
  if (salons.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] font-bold">{title}</span>
        <span className="text-[10px] text-[#6b6b6b]">{km}</span>
        <span className="text-[10px] bg-[#f5f5f5] px-2 py-0.5 rounded-full">{salons.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {salons.map(({ salon, distanceM, distanceKm, distanceLabel }) => (
          <div key={salon.id} className="bg-white border border-[#f0f0f0] rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate">{salon.name}</p>
              <p className="text-[11px] text-[#6b6b6b] truncate">{(salon as any).address || 'Jaipur'}</p>
            </div>
            <span className="text-[12px] font-bold text-[#c6005c] ml-3 shrink-0">{distanceLabel || fmtDistance(distanceKm, distanceM)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
