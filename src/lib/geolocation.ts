/**
 * geolocation.ts — Nexora Production Native GPS
 * =============================================
 * MASTER IMPLEMENTATION – Production-Ready per spec:
 * - ONLY navigator.geolocation.watchPosition()
 * - No Google APIs, no Mapbox, no external SDKs
 * - Config exactly { enableHighAccuracy:true, timeout:15000, maximumAge:0 }
 * - Single active watcher with clearWatch()
 * - Intelligent validation: 0-15m excellent immediate, 16-30 good, 31-50 wait 10s, 51-100 wait, >100 reject
 * - Stable logic: valid coords, newer, not duplicate <5m, no impossible jumps
 * - Saves lat/lng/accuracy/timestamp/speed/heading globally
 * - Continuous tracking, only >100m triggers refresh
 * - Haversine R=6371000m client-side only
 * - Sorting: distance → rating → featured → recent
 * - Grouped: Nearby 0-2km, Close 2-5km, Around 5-10km, Everything Else
 * - Permission handling, detailed logs, never crash
 *
 * This file is backward-compatible with old LocationContext but internally uses
 * the new production modules in src/location/*
 */

import {
  locationService,
  locationStore,
  distanceCalculator,
  permissionManager,
  logger,
  salonSorter,
  GPS_OPTIONS,
  STATUS_MESSAGES,
  LOCATION_CONFIG as NEW_CONFIG,
  EARTH_RADIUS_METERS,
  ACCURACY_THRESHOLDS,
  DISTANCE_GROUPS,
} from '../location';

/* ------------------------------------------------------------------ */
/* Backward-compatible types (old code still imports these)            */
/* ------------------------------------------------------------------ */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  provider: 'GPS' | 'Network' | 'Unknown' | 'Browser / HTML5 Geolocation';
  speed?: number | null;
  heading?: number | null;
  savedAt?: number;
}

export type LocationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';

export interface LocationSession {
  permission: LocationPermission;
  lastFix: GeoLocation | null; // raw
  acceptedFix: GeoLocation | null; // validated
  watcherId: number | null;
  watchActive: boolean;
  fixesReceived: number;
  movesTriggered: number;
}

export interface LocationCallbacks {
  onRawUpdate?: (loc: GeoLocation, session: LocationSession) => void;
  onAcceptedFix?: (loc: GeoLocation, session: LocationSession) => void;
  onMoved?: (from: GeoLocation, to: GeoLocation, distanceM: number) => void;
  onPermissionDenied?: () => void;
  onError?: (code: number | null, message: string) => void;
  onWatchStateChange?: (active: boolean) => void;
}

export interface LocationLogEntry {
  at: number;
  kind: 'watch' | 'raw' | 'accepted' | 'moved' | 'error' | 'permission' | 'stop';
  message: string;
}

export const PERMISSION_DENIED_MESSAGE = STATUS_MESSAGES.PERMISSION_DENIED;
export const PERMISSION_DENIED_EXACT = 'Please enable location to discover nearby salons.';

/* Config – backward compatible + new exact values */
export const LOCATION_CONFIG = {
  enableHighAccuracy: GPS_OPTIONS.enableHighAccuracy,
  timeout: GPS_OPTIONS.timeout,
  maximumAge: GPS_OPTIONS.maximumAge,
  ACCEPT_ACCURACY_M: 30, // legacy threshold – new system uses 15/30/50/100 table internally
  MOVEMENT_THRESHOLD_M: NEW_CONFIG.minMovementMeters,
} as const;

/* ------------------------------------------------------------------ */
/* Logging (requirement #12) – bridges new logger to old getLog API   */
/* ------------------------------------------------------------------ */

const MAX_LOG_ENTRIES = 150;
let logBuffer: LocationLogEntry[] = [];

function pushLog(kind: LocationLogEntry['kind'], message: string) {
  const entry: LocationLogEntry = { at: Date.now(), kind, message };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  // Also push to new logger for console output
  if (kind === 'accepted') logger.logSuccess(message);
  else if (kind === 'error' || kind === 'permission') logger.logWarn(message);
  else logger.logInfo(message);
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
/* Helpers – production Haversine R=6371000m, no external APIs        */
/* ------------------------------------------------------------------ */

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export function detectProvider(_coords?: GeolocationCoordinates | null): GeoLocation['provider'] {
  return 'Browser / HTML5 Geolocation';
}

/** Haversine in km – uses production distanceCalculator with R=6371000m */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return distanceCalculator.calculateDistanceMeters(lat1, lng1, lat2, lng2) / 1000;
}

/** Meters version – production */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return distanceCalculator.calculateDistanceMeters(lat1, lng1, lat2, lng2);
}

export interface SalonWithCoords {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
  ratingAverage?: number;
  rating?: number;
  featured?: boolean;
  lastActiveAt?: number;
  [key: string]: unknown;
}

export interface SalonDistance {
  salon: SalonWithCoords;
  distanceKm: number | null;
  distanceM: number | null;
  distanceLabel?: string;
}

/** Production sorter: uses new modules – distance, rating, featured, recent */
export function sortSalonsByDistance(
  salons: SalonWithCoords[],
  origin: { latitude: number; longitude: number } | null,
): SalonDistance[] {
  if (!origin) {
    return salons.map((salon) => ({ salon, distanceKm: null, distanceM: null }));
  }

  // Build typed salons for production sorter
  const typed = salons.map((s) => ({
    id: s.id,
    name: s.name,
    latitude: typeof s.latitude === 'number' ? s.latitude! : 0,
    longitude: typeof s.longitude === 'number' ? s.longitude! : 0,
    rating: (s.ratingAverage ?? s.rating ?? 0) as number,
    featured: Boolean(s.featured),
    lastActiveAt: s.lastActiveAt,
    _original: s,
  }));

  // Calculate with production Haversine
  const withDist = typed
    .filter((t) => distanceCalculator.isValidCoordinate(t.latitude, t.longitude))
    .map((t) => {
      const distM = distanceCalculator.calculateDistanceMeters(
        origin.latitude,
        origin.longitude,
        t.latitude,
        t.longitude,
      );
      return {
        original: t._original,
        distanceM: distM,
        distanceKm: distM / 1000,
        distanceLabel: distanceCalculator.formatDistance(distM),
        sortable: {
          id: t.id,
          name: t.name,
          latitude: t.latitude,
          longitude: t.longitude,
          rating: t.rating,
          featured: t.featured,
          lastActiveAt: t.lastActiveAt,
          distance: distM,
          distanceKm: distM / 1000,
          distanceLabel: distanceCalculator.formatDistance(distM),
        } as any,
      };
    });

  // Separate valid vs invalid coords
  const invalid = salons
    .filter(
      (s) =>
        typeof s.latitude !== 'number' ||
        typeof s.longitude !== 'number' ||
        !distanceCalculator.isValidCoordinate(s.latitude as number, s.longitude as number),
    )
    .map((s) => ({ salon: s, distanceKm: null, distanceM: null }));

  // Use production sorter
  const sortedValid = salonSorter.sort(withDist.map((w) => w.sortable));

  // Map back to SalonDistance preserving original order for ties
  const result: SalonDistance[] = sortedValid.map((s) => {
    const found = withDist.find((w) => w.sortable.id === s.id);
    return {
      salon: found ? found.original : { id: s.id, name: s.name },
      distanceKm: found ? found.distanceKm : s.distanceKm,
      distanceM: found ? found.distanceM : s.distance,
      distanceLabel: found ? found.distanceLabel : distanceCalculator.formatDistance(s.distance),
    };
  });

  // Append invalid at end
  return [...result, ...invalid];
}

/** Grouped salons – new production grouping */
export function groupSalonsByDistance(
  salons: SalonWithCoords[],
  origin: { latitude: number; longitude: number } | null,
) {
  const sorted = sortSalonsByDistance(salons, origin);
  if (!origin) {
    return {
      nearby: [],
      close: [],
      aroundYou: [],
      everythingElse: sorted,
      allSorted: sorted,
    };
  }

  const nearby: SalonDistance[] = [];
  const close: SalonDistance[] = [];
  const aroundYou: SalonDistance[] = [];
  const everythingElse: SalonDistance[] = [];

  for (const s of sorted) {
    if (s.distanceM === null) {
      everythingElse.push(s);
      continue;
    }
    if (s.distanceM <= DISTANCE_GROUPS.NEARBY_MAX_M) nearby.push(s);
    else if (s.distanceM <= DISTANCE_GROUPS.CLOSE_MAX_M) close.push(s);
    else if (s.distanceM <= DISTANCE_GROUPS.AROUND_MAX_M) aroundYou.push(s);
    else everythingElse.push(s);
  }

  return {
    nearby,
    close,
    aroundYou,
    everythingElse,
    allSorted: sorted,
  };
}

/* ------------------------------------------------------------------ */
/* Production LocationTracker – wraps new locationService singleton    */
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
  private unsubLocation: (() => void) | null = null;
  private unsubStatus: (() => void) | null = null;
  private unsubPermission: (() => void) | null = null;
  private stopped = false;
  private lastRawCount = 0;

  constructor(callbacks: LocationCallbacks = {}) {
    this.callbacks = callbacks;
    pushLog('watch', `LocationTracker created – config ${JSON.stringify(GPS_OPTIONS)} | thresholds 0-15 excellent, 16-30 good, 31-50 wait 10s, 51-100 improving, >100 reject`);
  }

  getSession(): LocationSession {
    return {
      ...this.session,
      lastFix: this.session.lastFix ? { ...this.session.lastFix } : null,
      acceptedFix: this.session.acceptedFix ? { ...this.session.acceptedFix } : null,
    };
  }

  async start(): Promise<void> {
    if (this.session.watchActive || this.stopped) return;

    if (!isGeolocationSupported()) {
      this.session.permission = 'unsupported';
      pushLog('permission', 'Geolocation not supported');
      this.callbacks.onError?.(null, 'Geolocation is not supported in this browser.');
      return;
    }

    // Check permission via new manager
    const perm = await permissionManager.checkPermission();
    this.session.permission = perm as LocationPermission;
    pushLog('permission', `Permission status: ${perm}`);

    // Subscribe to new store before starting
    this.setupSubscriptions();

    pushLog('watch', `Starting watchPosition – enableHighAccuracy:${GPS_OPTIONS.enableHighAccuracy}, timeout:${GPS_OPTIONS.timeout}, maximumAge:${GPS_OPTIONS.maximumAge}`);

    const started = await locationService.start();
    this.session.watchActive = started;
    this.session.watcherId = started ? 1 : null; // dummy id consistent with old API
    this.callbacks.onWatchStateChange?.(this.session.watchActive);
  }

  stop(): void {
    locationService.stop();
    this.session.watcherId = null;
    this.session.watchActive = false;
    this.stopped = true;
    this.teardownSubscriptions();
    pushLog('stop', 'watchPosition cleared via clearWatch()');
    this.callbacks.onWatchStateChange?.(false);
  }

  restart(): void {
    this.stopped = false;
    this.start();
  }

  private setupSubscriptions() {
    if (this.unsubLocation) return;

    // Track raw updates via internal counter – we need to intercept all positions for logging
    // Using locationService subscription + manual counting for session
    let lastAccepted: GeoLocation | null = this.session.acceptedFix;

    // Subscribe to location store – accepted fixes
    this.unsubLocation = locationStore.subscribeToLocation((event) => {
      const loc = event.location;
      const geo: GeoLocation = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        timestamp: loc.timestamp,
        provider: loc.provider as any,
        speed: loc.speed,
        heading: loc.heading,
        savedAt: loc.savedAt,
      };

      // Movement detection for legacy onMoved
      if (lastAccepted) {
        const distM = haversineMeters(
          lastAccepted.latitude,
          lastAccepted.longitude,
          geo.latitude,
          geo.longitude,
        );
        if (distM >= LOCATION_CONFIG.MOVEMENT_THRESHOLD_M) {
          this.session.movesTriggered++;
          pushLog('moved', `User moved ${Math.round(distM)}m ≥ ${LOCATION_CONFIG.MOVEMENT_THRESHOLD_M}m – refreshing location`);
          this.callbacks.onMoved?.(lastAccepted, geo, Math.round(distM));
        }
      } else {
        pushLog('accepted', `First accepted fix (accuracy ${geo.accuracy}m – thresholds: 0-15 excellent, 16-30 good, 31-50 wait 10s)`);
      }

      lastAccepted = geo;
      this.session.acceptedFix = geo;
      this.session.lastFix = geo; // keep lastFix as at least accepted
      pushLog('accepted', `ACCEPTED → ${formatCoords(geo)} | provider=${geo.provider} | speed=${geo.speed ?? 'N/A'} | heading=${geo.heading ?? 'N/A'}`);

      this.callbacks.onAcceptedFix?.(geo, this.getSession());
    });

    // Also subscribe to permission
    this.unsubPermission = locationStore.subscribeToPermission((state) => {
      this.session.permission = state as LocationPermission;
      if (state === 'denied') {
        pushLog('permission', PERMISSION_DENIED_MESSAGE);
        this.callbacks.onPermissionDenied?.();
      }
    });

    // Status messages for error handling
    this.unsubStatus = locationStore.subscribeToStatus((evt) => {
      if (evt.status === 'permission-denied') {
        this.callbacks.onPermissionDenied?.();
      } else if (evt.status === 'error' || evt.status === 'weak-signal' || evt.status === 'offline') {
        // don't spam errors – only if message changed
      }
    });

    // Additionally, intercept raw updates for logging – we hook into logger's raw?
    // For simplicity, we increment fixesReceived on every store update + simulate raw via polling
    // Real raw counting happens in locationService – we mirror its updateCount
    const interval = setInterval(() => {
      if (this.stopped || !this.session.watchActive) {
        clearInterval(interval);
        return;
      }
      // Sync fixesReceived from service
      const count = locationService.getUpdateCount();
      if (count !== this.lastRawCount) {
        this.session.fixesReceived = count;
        this.lastRawCount = count;
        // Raw fix is current raw from store or last known
        const loc = locationStore.getLocation();
        if (loc) {
          const rawGeo: GeoLocation = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            timestamp: loc.timestamp,
            provider: loc.provider as any,
            speed: loc.speed,
            heading: loc.heading,
          };
          this.session.lastFix = rawGeo;
          this.callbacks.onRawUpdate?.(rawGeo, this.getSession());
        }
      }
    }, 500);
  }

  private teardownSubscriptions() {
    if (this.unsubLocation) {
      this.unsubLocation();
      this.unsubLocation = null;
    }
    if (this.unsubStatus) {
      this.unsubStatus();
      this.unsubStatus = null;
    }
    if (this.unsubPermission) {
      this.unsubPermission();
      this.unsubPermission = null;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Convenience */
/* ------------------------------------------------------------------ */

export function startLocationTracking(callbacks: LocationCallbacks): LocationTracker {
  const tracker = new LocationTracker(callbacks);
  tracker.start();
  return tracker;
}

/* ------------------------------------------------------------------ */
/* Extra production exports – so new code can import from lib as well */
/* ------------------------------------------------------------------ */

export { distanceCalculator, locationService, locationStore, permissionManager, STATUS_MESSAGES, ACCURACY_THRESHOLDS, EARTH_RADIUS_METERS };
