/**
 * Nexora PWA - Native GPS Location System
 * Production-ready Type Definitions
 * 
 * ONLY browser native Geolocation API is used.
 * No external location providers.
 */

/** Raw browser geolocation position */
export interface RawGeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

/** Validated and accepted location - globally stored */
export interface ValidatedLocation {
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Accuracy in meters */
  accuracy: number;
  /** Unix timestamp (ms) from Geolocation API */
  timestamp: number;
  /** Timestamp when we saved it (ms) */
  savedAt: number;
  /** Speed in m/s if available */
  speed: number | null;
  /** Heading in degrees 0-360 if available */
  heading: number | null;
  /** Always 'Browser / HTML5 Geolocation' */
  provider: 'Browser / HTML5 Geolocation';
  /** Total GPS update count when this was accepted */
  updateCount: number;
  /** Movement from last accepted location in meters */
  movementDistance: number | null;
  /** Is this the first fix? */
  isFirstFix: boolean;
}

/** GPS Status for UI feedback */
export type GPSStatus =
  | 'idle'
  | 'detecting'
  | 'improving'
  | 'weak-signal'
  | 'waiting-better'
  | 'updated'
  | 'permission-denied'
  | 'error'
  | 'unsupported'
  | 'offline';

/** User-friendly status messages - EXACT strings from spec */
export type StatusMessage =
  | 'Detecting your location...'
  | 'Improving your location...'
  | 'GPS signal is weak...'
  | 'Location updated.'
  | 'Waiting for better GPS accuracy...'
  | 'Please enable location to discover nearby salons.';

/** Permission states */
export type PermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported' | 'unknown';

/** GPS Error codes */
export type GPSErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'GPS_DISABLED'
  | 'WEAK_SIGNAL'
  | 'OFFLINE'
  | 'UNSUPPORTED'
  | 'WATCH_FAILED'
  | 'UNKNOWN';

/** Validation result */
export interface ValidationResult {
  accepted: boolean;
  reason: string;
  accuracyLevel: 'excellent' | 'good' | 'moderate' | 'poor' | 'rejected';
  shouldShowImproving: boolean;
}

/** Salon model - as provided by backend */
export interface Salon {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rating: number; // 0-5
  featured: boolean;
  lastActiveAt?: number; // timestamp ms
  [key: string]: unknown;
}

/** Salon with computed distance */
export interface SalonWithDistance extends Salon {
  distance: number; // meters from user
  distanceKm: number;
  distanceLabel: string;
}

/** Grouped salons */
export interface GroupedSalons {
  nearby: SalonWithDistance[]; // 0-2 km
  close: SalonWithDistance[]; // 2-5 km
  aroundYou: SalonWithDistance[]; // 5-10 km
  everythingElse: SalonWithDistance[]; // >10 km
  allSorted: SalonWithDistance[];
}

/** Logger payload */
export interface GPSLogEntry {
  updateCount: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  movementDistance: number | null;
  permissionStatus: PermissionState;
  provider: string;
  accepted: boolean;
  reason: string;
  status: GPSStatus;
  message: StatusMessage;
  triggerRecalc: boolean;
}

/** LocationService config */
export interface LocationServiceConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  minMovementMeters: number;
  maxAccuracyForCalc: number;
  moderateAccuracyWaitMs: number;
  duplicateThresholdMeters: number;
  impossibleJumpMeters: number;
  impossibleJumpTimeMs: number;
}

/** Location change event */
export interface LocationChangeEvent {
  location: ValidatedLocation;
  previousLocation: ValidatedLocation | null;
  movementDistance: number;
}

/** Permission change event */
export interface PermissionChangeEvent {
  state: PermissionState;
}

/** Status change event */
export interface StatusChangeEvent {
  status: GPSStatus;
  message: StatusMessage;
  error?: {
    code: GPSErrorCode;
    message: string;
    originalError?: unknown;
  };
}
