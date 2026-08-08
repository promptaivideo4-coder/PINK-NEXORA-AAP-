/**
 * Nexora GPS Constants
 * Strictly native browser Geolocation only
 */

import { LocationServiceConfig, StatusMessage, GPSStatus, SimpleStatus } from './types';

/**
 * GPS Configuration - EXACT values from spec
 * Must not be changed for performance reasons
 */
export const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

export const LOCATION_CONFIG: LocationServiceConfig = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
  /** Only trigger updates when user moves >100m */
  minMovementMeters: 100,
  /** Max accuracy allowed for any calculation = 100m */
  maxAccuracyForCalc: 100,
  /** Wait up to 10s for better fix when accuracy 31-50m */
  moderateAccuracyWaitMs: 10000,
  /** Below this distance, treat as duplicate */
  duplicateThresholdMeters: 5,
  /** Impossible jump: >1km in <5s */
  impossibleJumpMeters: 1000,
  impossibleJumpTimeMs: 5000,
};

/** Earth radius for Haversine - spec requires 6371000 meters */
export const EARTH_RADIUS_METERS = 6371000;

/** Accuracy thresholds - spec exact */
export const ACCURACY_THRESHOLDS = {
  EXCELLENT_MAX: 15, // 0-15m -> Accept immediately
  GOOD_MAX: 30, // 16-30m -> Accept
  MODERATE_MAX: 50, // 31-50m -> Wait up to 10s
  POOR_MAX: 100, // 51-100m -> Continue waiting
  REJECT_ABOVE: 100, // >100m -> Reject
} as const;

/** Status messages - EXACT strings from spec, must not change */
export const STATUS_MESSAGES: Record<string, StatusMessage> = {
  DETECTING: 'Detecting your location...',
  IMPROVING: 'Improving your location...',
  WEAK_SIGNAL: 'GPS signal is weak...',
  UPDATED: 'Location updated.',
  WAITING_BETTER: 'Waiting for better GPS accuracy...',
  PERMISSION_DENIED: 'Please enable location to discover nearby salons.',
};

/** Distance groups */
export const DISTANCE_GROUPS = {
  NEARBY_MAX_M: 2000, // 0-2km
  CLOSE_MAX_M: 5000, // 2-5km
  AROUND_MAX_M: 10000, // 5-10km
} as const;

/** Impossible speed in m/s - 200 km/h = ~55 m/s, we use 55 */
export const MAX_REASONABLE_SPEED_MS = 55; // 200 km/h

/** Logging config */
export const LOG_PREFIX = '[Nexora GPS]';
export const DEBUG_ENABLED = process.env.NODE_ENV !== 'production' ? true : false;

/**
 * Normalize GPSStatus into the simplified UI vocabulary:
 * idle | requesting | success | error | denied | unavailable
 * No duplicate state — sirf existing status ka derived view.
 */
export function simplifyStatus(status: GPSStatus): SimpleStatus {
  switch (status) {
    case 'idle':
      return 'idle';
    case 'detecting':
    case 'improving':
    case 'weak-signal':
    case 'waiting-better':
      return 'requesting';
    case 'updated':
      return 'success';
    case 'permission-denied':
      return 'denied';
    case 'unsupported':
    case 'offline':
      return 'unavailable';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
}
