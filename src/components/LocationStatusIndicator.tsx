import React from 'react';
import { useLocation } from '../contexts/LocationContext';

/**
 * LocationStatusIndicator — compact real-time location status for the header.
 *
 * Uses ONLY the centralized location system (LocationContext → src/location/*).
 * Koi naya GPS/geocoding logic nahi — sirf existing normalized state ka view.
 *
 * States:
 *  - Success : 📍 Location detected
 *  - Loading : ⏳ Detecting location...
 *  - Error/denied/unavailable : ⚠️ Location unavailable
 *  - Idle    : 📍 Location (muted — abhi request hua hi nahi)
 *
 * Style OfflineSyncStatus ("Synced" badge) ke design se match karta hai:
 * same pill shape, spacing, colors, typography, responsive behaviour.
 */
export default function LocationStatusIndicator() {
  const { simpleStatus } = useLocation();

  let icon: string;
  let label: string;
  let badgeClass: string;

  switch (simpleStatus) {
    case 'success':
      icon = '📍';
      label = 'Location detected';
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      break;
    case 'requesting':
      icon = '⏳';
      label = 'Detecting location...';
      badgeClass = 'bg-primary/10 text-primary border-primary/30';
      break;
    case 'denied':
    case 'error':
    case 'unavailable':
      icon = '⚠️';
      label = 'Location unavailable';
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      break;
    default: // idle
      icon = '📍';
      label = 'Location';
      badgeClass = 'bg-surface-container/60 text-on-surface-variant border-outline-variant/30';
      break;
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
