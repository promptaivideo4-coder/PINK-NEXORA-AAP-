import React from 'react';
import { useLocation } from '../contexts/LocationContext';
import { SimpleStatus, ValidatedLocation } from '../location/types';

/**
 * LocationStatusIndicator — compact real-time location status for the header.
 *
 * Uses ONLY the centralized location system (LocationContext → src/location/*).
 * Koi naya GPS/geocoding logic nahi — sirf existing normalized state ka view.
 *
 * State logic (data-driven, taaki "Detecting..." par atka na rahe):
 *  1. currentLocation ho       → 📍 Location detected (ya city/locality agar ho)
 *  2. lastKnownFix ho          → 📍 Location detected (req #5 — available fix dikhao)
 *  3. simpleStatus requesting  → ⏳ Detecting location...
 *  4. denied/error/unavailable → ⚠️ Location unavailable
 *  5. else (idle)              → 📍 Location (muted)
 *
 * Style OfflineSyncStatus ("Synced" badge) ke design se match karta hai:
 * same pill shape, spacing, colors, typography, responsive behaviour.
 */

export interface LocationIndicatorState {
  icon: string;
  label: string;
  badgeClass: string;
}

/**
 * Pure state derivation — testable without React.
 * Data pehle, phir status: location data available ho to 'requesting' bhi success dikhata hai.
 */
export function deriveLocationIndicatorState(
  simpleStatus: SimpleStatus,
  currentLocation: ValidatedLocation | null,
  lastKnownFix: ValidatedLocation | null,
): LocationIndicatorState {
  const hasLocation = !!currentLocation || !!lastKnownFix;

  if (hasLocation) {
    // Req #2: existing city/locality value ho to dikhao, warna generic message
    const loc = currentLocation || lastKnownFix;
    const city = (loc as ValidatedLocation & { city?: string | null }).city;
    return {
      icon: '📍',
      label: city ? city : 'Location detected',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    };
  }

  switch (simpleStatus) {
    case 'success':
      // Status 'updated' hamesha fix ke saath aata hai; data missing ho tab bhi
      // status sahi batao (store reset jaisi edge case ke liye).
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
  // Req #6: context se subscribe — value change par ye component re-render hota hai
  const { simpleStatus, currentLocation, lastKnownFix } = useLocation();

  const { icon, label, badgeClass } = deriveLocationIndicatorState(
    simpleStatus,
    currentLocation,
    lastKnownFix,
  );

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
