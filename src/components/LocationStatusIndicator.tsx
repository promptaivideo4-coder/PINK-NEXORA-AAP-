import React, { useEffect, useState } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { SimpleStatus, ValidatedLocation } from '../location/types';
import { reverseGeocodeCity } from '../lib/reverseGeocode';

/**
 * LocationStatusIndicator — compact real-time location status for the header.
 *
 * Uses ONLY the centralized location system (LocationContext → src/location/*).
 * City/locality name: reverseGeocodeCity (cached) — koi mock/hardcode nahi.
 *
 * States:
 *  1. Location data available (currentLocation || lastKnownFix):
 *       - name resolve ho raha hai → 📍 Locating...
 *       - name mil gaya          → 📍 [City]
 *       - name resolve fail hua  → 📍 Location detected (graceful fallback)
 *  2. No location yet:
 *       - requesting → ⏳ Detecting location...
 *       - denied/error/unavailable → ⚠️ Location unavailable
 *       - idle → 📍 Location (muted)
 *
 * Style OfflineSyncStatus ("Synced" badge) ke design se match karta hai.
 */

export interface LocationIndicatorState {
  icon: string;
  label: string;
  badgeClass: string;
}

/**
 * Pure state derivation for NO-location cases — testable without React.
 */
export function deriveLocationIndicatorState(
  simpleStatus: SimpleStatus,
): LocationIndicatorState {
  switch (simpleStatus) {
    case 'success':
      return {
        icon: '📍',
        label: 'Location detected',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    case 'requesting':
      return {
        icon: '⏳',
        label: 'Detecting location...',
        badgeClass: 'bg-primary/10 text-primary border-primary/30',
      };
    case 'denied':
    case 'error':
    case 'unavailable':
      return {
        icon: '⚠️',
        label: 'Location unavailable',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
    default: // idle
      return {
        icon: '📍',
        label: 'Location',
        badgeClass: 'bg-surface-container/60 text-on-surface-variant border-outline-variant/30',
      };
  }
}

export default function LocationStatusIndicator() {
  // Req: context se subscribe — state change par re-render
  const { simpleStatus, currentLocation, lastKnownFix } = useLocation();

  const loc = currentLocation || lastKnownFix;
  const [cityName, setCityName] = useState<string | null | 'resolving'>('resolving');

  // Reverse geocode — sirf tab jab coords badlein (cached, no repeated calls)
  useEffect(() => {
    if (!loc) {
      setCityName('resolving');
      return;
    }
    let cancelled = false;
    setCityName('resolving');
    reverseGeocodeCity(loc.latitude, loc.longitude).then((name) => {
      if (!cancelled) setCityName(name ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [loc?.latitude, loc?.longitude, loc?.accuracy]);

  let icon: string;
  let label: string;
  let badgeClass: string;

  if (loc) {
    // Location data available — city name display logic
    if (cityName === 'resolving') {
      icon = '📍';
      label = 'Locating...';
      badgeClass = 'bg-primary/10 text-primary border-primary/30';
    } else if (cityName) {
      icon = '📍';
      label = cityName;
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    } else {
      // GPS mila, city name resolve nahi hua — graceful fallback
      icon = '📍';
      label = 'Location detected';
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
  } else {
    // No location yet — existing loading/error/idle states unchanged
    ({ icon, label, badgeClass } = deriveLocationIndicatorState(simpleStatus));
  }

  return (
    <span
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border select-none ${badgeClass}`}
      title={label}
      aria-label={label}
      role="status"
    >
      <span className="leading-none">{icon}</span>
      <span className="hidden sm:inline truncate max-w-[120px] text-[11px] font-semibold tracking-tight">
        {label}
      </span>
    </span>
  );
}
