/**
 * useLocationSync.ts
 * ==================
 * Synchronizes the AUTHENTICATED user's live location with the Nexora backend.
 *
 * Design constraints (all enforced here):
 *  - Runs ONLY while a valid session exists. Mounting it with `enabled: false`
 *    (signed-out user) does nothing at all: no permission prompt, no watcher,
 *    no network write.
 *  - Does NOT create a second GPS watcher. It drives the existing centralized
 *    system (`locationService` → `gpsWatcher` → `navigator.geolocation`) and
 *    consumes validated fixes from the existing `locationStore`.
 *  - Backend writes go through `liveLocationSync`, which uses the shared
 *    Supabase client + the signed-in JWT, so Postgres RLS decides. Nothing is
 *    public: `public.user_live_locations` has no anon policy.
 *  - Throttled by movement AND time, so battery and write volume stay bounded.
 *  - Cleaning up (sign-out / unmount) unsubscribes, cancels pending pushes and
 *    stops the watcher if this hook is the one that started it.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { distanceCalculator, gpsWatcher, locationService, locationStore, logger } from '../location';
import type { ValidatedLocation } from '../location/types';
import {
  isBackendSyncEnabled,
  resetBackendSyncAvailability,
  syncUserLiveLocation,
  type LiveLocationSyncResult,
} from '../lib/liveLocationSync';

export interface UseLocationSyncOptions {
  /** Must be true ONLY when a valid Supabase session exists. */
  enabled: boolean;
  /** `session.user.id` — without it no sync is possible (or wanted). */
  userId?: string | null;
  /** Minimum movement since the last push before writing again (metres). */
  minMovementMeters?: number;
  /** Minimum time between pushes even if the user keeps moving (ms). */
  minIntervalMs?: number;
  /**
   * Optional existing entry point for starting device tracking (e.g. the
   * `requestLocation()` from `LocationContext`). When supplied it is used so
   * permission UX / status banners keep behaving exactly as before; otherwise
   * the centralized `locationService` is started directly.
   */
  startTracking?: () => void | Promise<unknown>;
  /** Emit device log lines through the Nexora location logger. */
  debug?: boolean;
}

export type LocationSyncState =
  | 'idle'
  | 'tracking'
  | 'syncing'
  | 'synced'
  | 'local-only'
  | 'error';

export interface UseLocationSyncReturn {
  /** True while the hook owns an active, authenticated sync session. */
  active: boolean;
  state: LocationSyncState;
  lastSyncedAt: number | null;
  lastSyncedLocation: ValidatedLocation | null;
  /** False once the backend table is known to be unavailable. */
  backendAvailable: boolean;
  /** Number of successful backend pushes in this session. */
  pushCount: number;
  /** Push the current fix immediately, ignoring the throttle. */
  syncNow: () => Promise<LiveLocationSyncResult>;
  /** Stop tracking + syncing (also happens automatically on sign-out). */
  stop: () => void;
}

const DEFAULT_MIN_MOVEMENT_METERS = 50;
const DEFAULT_MIN_INTERVAL_MS = 60_000;

export function useLocationSync(options: UseLocationSyncOptions): UseLocationSyncReturn {
  const {
    enabled,
    userId = null,
    minMovementMeters = DEFAULT_MIN_MOVEMENT_METERS,
    minIntervalMs = DEFAULT_MIN_INTERVAL_MS,
    startTracking,
    debug = false,
  } = options;

  const [active, setActive] = useState(false);
  const [state, setState] = useState<LocationSyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [lastSyncedLocation, setLastSyncedLocation] = useState<ValidatedLocation | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [pushCount, setPushCount] = useState(0);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const pendingFixRef = useRef<ValidatedLocation | null>(null);
  const lastPushedRef = useRef<{ location: ValidatedLocation; at: number } | null>(null);
  /** Warning kinds already logged — keeps failure logging to ONE line each. */
  const warnedRef = useRef<Set<string>>(new Set());
  const activeRef = useRef(false);
  const userIdRef = useRef<string | null>(userId);
  const throttleRef = useRef({ minMovementMeters, minIntervalMs });

  // Keep latest values readable inside long-lived callbacks without
  // re-running (and therefore restarting) the tracking effect.
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  useEffect(() => {
    throttleRef.current = { minMovementMeters, minIntervalMs };
  }, [minMovementMeters, minIntervalMs]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const shouldPush = useCallback((location: ValidatedLocation): boolean => {
    const last = lastPushedRef.current;
    if (!last) return true;
    const { minMovementMeters: minMove, minIntervalMs: minMs } = throttleRef.current;
    const movedMeters = distanceCalculator.calculateDistanceMeters(
      last.location.latitude,
      last.location.longitude,
      location.latitude,
      location.longitude,
    );
    if (movedMeters >= minMove) return true;
    return Date.now() - last.at >= minMs;
  }, []);

  /**
   * Logs a failure class exactly once per armed session. Backend problems must
   * be visible but must never spam the console on every GPS fix.
   */
  const warnOnce = useCallback((kind: string, message: string) => {
    if (warnedRef.current.has(kind)) return;
    warnedRef.current.add(kind);
    logger.logWarn(`[useLocationSync] ${message}`);
  }, []);

  const push = useCallback(
    async (location: ValidatedLocation): Promise<LiveLocationSyncResult> => {
      const uid = userIdRef.current;
      // Hard guard: never sync without an authenticated user id.
      if (!uid || !activeRef.current) return 'skipped';
      if (inFlightRef.current) {
        pendingFixRef.current = location;
        return 'skipped';
      }
      if (!isBackendSyncEnabled()) {
        setBackendAvailable(false);
        return 'disabled';
      }

      inFlightRef.current = true;
      if (mountedRef.current) setState('syncing');

      const result = await syncUserLiveLocation(uid, location);
      inFlightRef.current = false;

      if (!mountedRef.current || !activeRef.current) return result;

      if (result === 'synced') {
        lastPushedRef.current = { location, at: Date.now() };
        setLastSyncedAt(location.timestamp || Date.now());
        setLastSyncedLocation(location);
        setPushCount((count) => count + 1);
        setState('synced');
        if (debug) {
          logger.logInfo(
            `[useLocationSync] pushed live location for ${uid} ` +
              `(${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`,
          );
        }
      } else if (result === 'disabled') {
        // Table not migrated / unavailable — stay useful with local GPS only.
        setBackendAvailable(false);
        setState('local-only');
        warnOnce(
          'disabled',
          'backend live-location sync disabled (table unavailable) — continuing with local GPS only',
        );
      } else if (result === 'error') {
        // Transient failure (offline, aborted request, RLS rejection). GPS
        // keeps working; the next accepted fix simply retries.
        setState('error');
        warnOnce(
          'error',
          'live-location push failed — continuing with local GPS only, will retry on the next fix',
        );
      }

      // A newer fix arrived while the write was in flight — send it too.
      const pending = pendingFixRef.current;
      pendingFixRef.current = null;
      if (pending && activeRef.current && shouldPush(pending)) {
        return push(pending);
      }
      return result;
    },
    [debug, shouldPush, warnOnce],
  );

  const handleFix = useCallback(
    (location: ValidatedLocation | null) => {
      if (!location || !activeRef.current) return;
      if (!shouldPush(location)) return;
      void push(location);
    },
    [push, shouldPush],
  );

  const syncNow = useCallback(async (): Promise<LiveLocationSyncResult> => {
    const current = locationStore.getLocation();
    if (!current) return 'skipped';
    return push(current);
  }, [push]);

  const stop = useCallback(() => {
    activeRef.current = false;
    pendingFixRef.current = null;
    warnedRef.current.clear();
    if (mountedRef.current) {
      setActive(false);
      setState('idle');
    }
    // The authenticated location session owns the shared GPS watcher for the
    // app. Stop the actual browser watch on sign-out, disabled transitions, and
    // unmount so no orphaned geolocation subscription survives the session.
    locationService.stop();
  }, []);

  // ---------------------------------------------------------------------
  // Core lifecycle: start only when authenticated, tear down otherwise.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !userId) {
      // Signed-out (or session not resolved yet) — stop pushing to the
      // backend, but leave the shared GPS watcher alone.
      if (activeRef.current) {
        stop();
        lastPushedRef.current = null;
      }
      return;
    }

    activeRef.current = true;
    setActive(true);
    setState('tracking');
    lastPushedRef.current = null;
    resetBackendSyncAvailability();
    setBackendAvailable(true);
    if (debug) logger.logInfo(`[useLocationSync] armed for user ${userId}`);

    // 1. Ensure exactly ONE watcher exists. `gpsWatcher.start()` internally
    //    stops any previous watcher, and `locationService.start()` no-ops when
    //    already running — so this can never create a duplicate watcher.
    if (!gpsWatcher.isActive()) {
      const beginTracking = async () => {
        try {
          if (startTracking) {
            await startTracking();
          } else {
            await locationService.start();
          }
        } catch (error) {
          if (debug) logger.logWarn(`[useLocationSync] failed to start tracking: ${String(error)}`);
        }
      };
      void beginTracking();
    }

    // 2. Consume validated fixes from the existing centralized store.
    //    `subscribeToLocation` replays the current fix immediately, so an
    //    already-known position is pushed right after sign-in.
    const unsubscribe = locationStore.subscribeToLocation((event) => {
      handleFix(event.location);
    });

    return () => {
      unsubscribe();
      stop();
      if (debug) logger.logInfo('[useLocationSync] disarmed');
    };
  }, [enabled, userId, startTracking, handleFix, stop, debug]);

  return {
    active,
    state,
    lastSyncedAt,
    lastSyncedLocation,
    backendAvailable,
    pushCount,
    syncNow,
    stop,
  };
}

export default useLocationSync;
