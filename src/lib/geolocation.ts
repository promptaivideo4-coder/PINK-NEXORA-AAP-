/**
 * geolocation.ts — Nexora Location System
 * =========================================
 * Saare 15 requirements yahan implement hain:
 *
 *  1. Google Geolocation API bilkul nahi — sirf browser navigator.geolocation
 *  2. Koi Google API Key nahi
 *  3. Sirf `navigator.geolocation`
 *  4. `watchPosition()` (getCurrentPosition nahi) — continuous fixes
 *  5. High accuracy config: enableHighAccuracy: true, timeout: 15000, maximumAge: 0
 *  6. Pehla GPS reading turant use NAHI hota — multiple updates collect hote hain,
 *     location tabhi ACCEPT hoti hai jab accuracy <= 30 meters
 *  7. Accurate location milne par save hota hai: latitude, longitude, accuracy, timestamp
 *  8. Har salon tak distance = Haversine formula
 *  9. Salons nearest → farthest sort
 * 10. Refresh sirf tab jab user 100+ meters move kare
 * 11. Permission denied → "Please enable location to see nearby salons."
 * 12. Complete logging: Latitude, Longitude, Accuracy, Permission Status,
 *     GPS Provider, Timestamp
 * 13. Saare errors gracefully handle
 * 14. Android Chrome PWA ke liye optimized (single active watcher,
 *     screen on hone par hi watch, low CPU)
 * 15. Koi external location API nahi
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;        // meters
  timestamp: number;       // epoch ms
  provider: 'GPS' | 'Network' | 'Unknown';
}

export type LocationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';

export interface LocationSession {
  permission: LocationPermission;
  lastFix: GeoLocation | null;      // aakhri raw fix (koi bhi accuracy)
  acceptedFix: GeoLocation | null;  // accepted fix (accuracy <= ACCEPT_ACCURACY_M)
  watcherId: number | null;
  watchActive: boolean;
  fixesReceived: number;
  movesTriggered: number;
}

export interface LocationCallbacks {
  /** Har RAW GPS update par call (chahe accuracy kuch bhi ho) */
  onRawUpdate?: (loc: GeoLocation, session: LocationSession) => void;
  /** Jab accuracy <= 30m ka fix milta hai (ya pehla accepted) */
  onAcceptedFix?: (loc: GeoLocation, session: LocationSession) => void;
  /** Jab user 100m+ move karke location refresh hoti hai */
  onMoved?: (from: GeoLocation, to: GeoLocation, distanceM: number) => void;
  /** Permission denied */
  onPermissionDenied?: () => void;
  /** Koi bhi error */
  onError?: (code: number | null, message: string) => void;
  /** Watch start/stop */
  onWatchStateChange?: (active: boolean) => void;
}

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

export const LOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
  /** Location tabhi accept karo jab accuracy isse kam ya barabar ho */
  ACCEPT_ACCURACY_M: 30,
  /** Itna move (meters) hone par hi location refresh karo */
  MOVEMENT_THRESHOLD_M: 100,
} as const;

export const PERMISSION_DENIED_MESSAGE = 'Please enable location to see nearby salons.';

/* ------------------------------------------------------------------ */
/* Logging (requirement #12)                                           */
/* ------------------------------------------------------------------ */

export interface LocationLogEntry {
  at: number;
  kind: 'watch' | 'raw' | 'accepted' | 'moved' | 'error' | 'permission' | 'stop';
  message: string;
}

const MAX_LOG_ENTRIES = 100;
let logBuffer: LocationLogEntry[] = [];

function log(kind: LocationLogEntry['kind'], message: string) {
  const entry: LocationLogEntry = { at: Date.now(), kind, message };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  // eslint-disable-next-line no-console
  console.log(`[NexoraGeo] ${entry.message}`);
}

export function getLocationLog(): LocationLogEntry[] {
  return [...logBuffer];
}

export function clearLocationLog() {
  logBuffer = [];
}

function formatCoords(l: GeoLocation): string {
  return `lat=${l.latitude.toFixed(6)}, lng=${l.longitude.toFixed(6)}, acc=${Math.round(l.accuracy)}m`;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/** Best-effort GPS provider detection (requirement #12 - GPS Provider). */
export function detectProvider(coords: GeolocationCoordinates): GeoLocation['provider'] {
  // High accuracy + speed available → almost certainly real GPS
  if (typeof coords.speed === 'number' && coords.speed !== null && coords.speed >= 0) return 'GPS';
  if (typeof coords.accuracy === 'number') {
    if (coords.accuracy <= 20) return 'GPS';      // sub-20m accuracy is GPS-grade
    if (coords.accuracy <= 100) return 'Network'; // typical wifi/cell triangulation
  }
  return 'Unknown';
}

/** Haversine distance in kilometers (requirement #8). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface SalonWithCoords {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
  ratingAverage?: number;
  [key: string]: unknown;
}

export interface SalonDistance {
  salon: SalonWithCoords;
  distanceKm: number | null; // null = coordinates missing
}

/** Har salon tak distance + nearest se sort (requirement #8, #9). */
export function sortSalonsByDistance(
  salons: SalonWithCoords[],
  origin: { latitude: number; longitude: number } | null,
): SalonDistance[] {
  if (!origin) {
    return salons.map((salon) => ({ salon, distanceKm: null }));
  }
  return salons
    .map((salon) => {
      if (
        typeof salon.latitude !== 'number' ||
        typeof salon.longitude !== 'number' ||
        Number.isNaN(salon.latitude) ||
        Number.isNaN(salon.longitude)
      ) {
        return { salon, distanceKm: null as number | null };
      }
      return {
        salon,
        distanceKm: haversineKm(origin.latitude, origin.longitude, salon.latitude, salon.longitude),
      };
    })
    .sort((a, b) => {
      // Salons without coordinates go last
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

/* ------------------------------------------------------------------ */
/* Core tracker — watchPosition based (requirements #3, #4, #5)        */
/* ------------------------------------------------------------------ */

export class LocationTracker {
  private session: LocationSession = {
    permission: 'unknown',
    lastFix: null,
    acceptedFix: null,
    watcherId: null,
    watchActive: false,
    fixesReceived: 0,
    movesTriggered: 0,
  };
  private callbacks: LocationCallbacks = {};
  private stopped = false;

  constructor(callbacks: LocationCallbacks = {}) {
    this.callbacks = callbacks;
  }

  getSession(): LocationSession {
    return { ...this.session, lastFix: this.session.lastFix ? { ...this.session.lastFix } : null, acceptedFix: this.session.acceptedFix ? { ...this.session.acceptedFix } : null };
  }

  /** Start continuous watch (requirement #4). */
  start(): void {
    if (this.session.watchActive || this.stopped) return;

    if (!isGeolocationSupported()) {
      this.session.permission = 'unsupported';
      log('permission', 'Geolocation not supported in this browser');
      this.callbacks.onError?.(null, 'Geolocation is not supported in this browser.');
      return;
    }

    this.resolvePermission();

    log('watch', 'Starting watchPosition (enableHighAccuracy, timeout 15s, maximumAge 0)');

    this.session.watcherId = navigator.geolocation.watchPosition(
      this.handlePosition,
      this.handleError,
      {
        enableHighAccuracy: LOCATION_CONFIG.enableHighAccuracy,
        timeout: LOCATION_CONFIG.timeout,
        maximumAge: LOCATION_CONFIG.maximumAge,
      },
    );
    this.session.watchActive = this.session.watcherId !== null;
    this.callbacks.onWatchStateChange?.(this.session.watchActive);
  }

  /** Stop watching (PWA: screen chhupne par band karna efficient hai). */
  stop(): void {
    if (this.session.watcherId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.session.watcherId);
    }
    this.session.watcherId = null;
    this.session.watchActive = false;
    this.stopped = true;
    log('stop', 'watchPosition cleared');
    this.callbacks.onWatchStateChange?.(false);
  }

  /** Watch dobara chalu karo (after stop). */
  restart(): void {
    this.stopped = false;
    this.start();
  }

  private resolvePermission(): void {
    if (!('permissions' in navigator)) {
      this.session.permission = 'unknown';
      log('permission', `Permission status: ${this.session.permission}`);
      return;
    }
    try {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          this.session.permission = (status.state as LocationPermission) || 'unknown';
          log('permission', `Permission status: ${this.session.permission}`);
          if (status.state === 'denied') {
            log('permission', PERMISSION_DENIED_MESSAGE);
            this.callbacks.onPermissionDenied?.();
          }
        })
        .catch(() => {
          this.session.permission = 'unknown';
          log('permission', 'Permission API unavailable — status unknown');
        });
    } catch {
      this.session.permission = 'unknown';
      log('permission', 'Permission query failed — status unknown');
    }
  }

  /** Har raw GPS update (requirement #6, #7, #10). */
  private handlePosition = (position: GeolocationPosition): void => {
    const coords = position.coords;
    const fix: GeoLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: Math.round(coords.accuracy ?? -1),
      timestamp: position.timestamp,
      provider: detectProvider(coords),
    };

    this.session.fixesReceived += 1;
    this.session.lastFix = fix;

    log('raw', `RAW fix #${this.session.fixesReceived} → ${formatCoords(fix)} | provider=${fix.provider} | ts=${new Date(fix.timestamp).toISOString()}`);

    this.callbacks.onRawUpdate?.(fix, this.getSession());

    // ---- Requirement #6: accuracy gate ----
    if (fix.accuracy < 0) {
      log('raw', 'Accuracy unavailable — waiting for better fix');
      return;
    }
    if (fix.accuracy > LOCATION_CONFIG.ACCEPT_ACCURACY_M) {
      log('raw', `Accuracy ${fix.accuracy}m > ${LOCATION_CONFIG.ACCEPT_ACCURACY_M}m — waiting for better GPS fix`);
      return;
    }

    const prev = this.session.acceptedFix;

    // ---- Requirement #10: 100m movement threshold ----
    if (prev) {
      const movedM = haversineKm(prev.latitude, prev.longitude, fix.latitude, fix.longitude) * 1000;
      if (movedM < LOCATION_CONFIG.MOVEMENT_THRESHOLD_M) {
        log('raw', `Moved only ${Math.round(movedM)}m (< ${LOCATION_CONFIG.MOVEMENT_THRESHOLD_M}m) — no refresh`);
        return;
      }
      this.session.movesTriggered += 1;
      log('moved', `User moved ${Math.round(movedM)}m ≥ ${LOCATION_CONFIG.MOVEMENT_THRESHOLD_M}m — refreshing location`);
      this.callbacks.onMoved?.(prev, fix, Math.round(movedM));
    } else {
      log('accepted', `First accepted fix (accuracy ${fix.accuracy}m ≤ ${LOCATION_CONFIG.ACCEPT_ACCURACY_M}m)`);
    }

    // ---- Requirement #7: save lat / lng / accuracy / timestamp ----
    this.session.acceptedFix = fix;
    log('accepted', `ACCEPTED → ${formatCoords(fix)} | saved ts=${new Date(fix.timestamp).toISOString()}`);
    this.callbacks.onAcceptedFix?.(fix, this.getSession());
  };

  /** Saare errors gracefully (requirement #13). */
  private handleError = (err: GeolocationPositionError): void => {
    const code = err?.code ?? null;
    let message = err?.message || 'Unknown geolocation error';

    switch (code) {
      case 1: // PERMISSION_DENIED
        this.session.permission = 'denied';
        message = PERMISSION_DENIED_MESSAGE;
        log('permission', `PERMISSION_DENIED → ${PERMISSION_DENIED_MESSAGE}`);
        this.callbacks.onPermissionDenied?.();
        break;
      case 2: // POSITION_UNAVAILABLE
        message = 'Position unavailable — GPS signal lost. Trying again…';
        log('error', `POSITION_UNAVAILABLE (code ${code}): ${message}`);
        break;
      case 3: // TIMEOUT
        message = 'Location request timed out (15s). Retrying…';
        log('error', `TIMEOUT (code ${code}): ${message}`);
        break;
      default:
        log('error', `Geolocation error (code ${code}): ${message}`);
    }

    this.callbacks.onError?.(code, message);
  };
}

/* ------------------------------------------------------------------ */
/* Convenience: ek baar me tracker banake start karo                   */
/* ------------------------------------------------------------------ */

export function startLocationTracking(callbacks: LocationCallbacks): LocationTracker {
  const tracker = new LocationTracker(callbacks);
  tracker.start();
  return tracker;
}
