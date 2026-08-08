/**
 * useNexoraLocation.ts
 * React hook for Nexora PWA GPS - production ready, battery efficient
 * Prevents unnecessary renders, handles cleanup
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ValidatedLocation,
  GPSStatus,
  SimpleStatus,
  StatusMessage,
  PermissionState,
} from '../location/types';
import { locationService } from '../location/LocationService';
import { locationStore } from '../location/LocationStore';
import { STATUS_MESSAGES, simplifyStatus } from '../location/constants';

interface UseNexoraLocationOptions {
  autoStart?: boolean;
  debug?: boolean;
}

interface UseNexoraLocationReturn {
  /** Current validated location (normalized state) */
  location: ValidatedLocation | null;
  status: GPSStatus;
  /** Normalized status: idle | requesting | success | error | denied | unavailable */
  simpleStatus: SimpleStatus;
  /** True while GPS is acquiring/improving a fix — loading state */
  isLoading: boolean;
  /** User-friendly error message (timeout / unavailable / denied / unsupported) */
  error: string | null;
  message: StatusMessage;
  permission: PermissionState;
  updateCount: number;
  isTracking: boolean;
  /** Start / acquire location (triggers permission prompt if needed) */
  start: () => Promise<boolean>;
  /** Stop watch */
  stop: () => void;
  /** Retry after permission denial / failure */
  retryPermission: () => Promise<boolean>;
  /** Force recalculation of nearby salons with current fix — refresh location data */
  refresh: () => void;
  isDenied: boolean;
  isReady: boolean;
}

export function useNexoraLocation(
  options: UseNexoraLocationOptions = {}
): UseNexoraLocationReturn {
  const { autoStart = true, debug = false } = options;

  const [location, setLocation] = useState<ValidatedLocation | null>(() =>
    locationStore.getLocation()
  );
  const [statusState, setStatusState] = useState<{
    status: GPSStatus;
    message: StatusMessage;
  }>(() => locationStore.getStatus());
  const [permission, setPermission] = useState<PermissionState>(() =>
    locationStore.getPermission()
  );
  const [updateCount, setUpdateCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const start = useCallback(async () => {
    if (debug) console.log('[useNexoraLocation] Starting...');
    const started = await locationService.start();
    if (mountedRef.current) {
      setIsTracking(started);
    }
    return started;
  }, [debug]);

  const stop = useCallback(() => {
    if (debug) console.log('[useNexoraLocation] Stopping...');
    locationService.stop();
    if (mountedRef.current) {
      setIsTracking(false);
    }
  }, [debug]);

  const retryPermission = useCallback(async () => {
    if (debug) console.log('[useNexoraLocation] Retry permission...');
    const ok = await locationService.retryPermission();
    if (mountedRef.current) {
      setIsTracking(ok);
    }
    return ok;
  }, [debug]);

  const refresh = useCallback(() => {
    if (debug) console.log('[useNexoraLocation] Refreshing location data...');
    try {
      locationService.forceRecalculate();
    } catch (e) {
      if (debug) console.error('[useNexoraLocation] refresh failed', e);
    }
  }, [debug]);

  useEffect(() => {
    mountedRef.current = true;

    // Subscribe to location
    const unsubLoc = locationStore.subscribeToLocation((event) => {
      if (!mountedRef.current) return;
      setLocation(event.location);
      setUpdateCount((c) => c + 1);
      // Success — clear any error
      setError(null);
    });

    const unsubStatus = locationStore.subscribeToStatus((event) => {
      if (!mountedRef.current) return;
      setStatusState({ status: event.status, message: event.message });

      // Derive error state from status
      if (event.status === 'permission-denied') {
        setError(STATUS_MESSAGES.PERMISSION_DENIED);
      } else if (event.status === 'error') {
        setError(event.error?.message || STATUS_MESSAGES.WAITING_BETTER);
      } else if (event.status === 'unsupported') {
        setError('Geolocation is not supported in this browser.');
      } else if (event.status === 'offline') {
        setError('Device offline – GPS may be degraded');
      } else if (event.status === 'updated' || event.status === 'detecting') {
        setError(null);
      }
    });

    const unsubPerm = locationStore.subscribeToPermission((state) => {
      if (!mountedRef.current) return;
      setPermission(state);
      if (state === 'denied') {
        setError(STATUS_MESSAGES.PERMISSION_DENIED);
      } else if (state === 'granted' || state === 'prompt') {
        setError(null);
      }
    });

    // Also subscribe via service for tracking state
    let lastLocation: ValidatedLocation | null = locationStore.getLocation();
    const unsubService = locationService.subscribeToLocation((loc) => {
      if (!mountedRef.current) return;
      if (loc) {
        // Prevent duplicate state updates if same timestamp
        if (lastLocation && loc.timestamp === lastLocation.timestamp) return;
        lastLocation = loc;
      }
    });

    // Auto start
    if (autoStart) {
      start();
    }

    return () => {
      mountedRef.current = false;
      unsubLoc();
      unsubStatus();
      unsubPerm();
      unsubService();
      // Do NOT stop tracking on unmount to keep PWA background behavior
      // Only stop if explicitly wanted? We'll keep running for better UX
      // If you want to stop on unmount, uncomment:
      // locationService.stop();
    };
  }, [autoStart, start, debug]);

  const simpleStatus = simplifyStatus(statusState.status);
  const isLoading = simpleStatus === 'requesting';

  return {
    location,
    status: statusState.status,
    simpleStatus,
    isLoading,
    error,
    message: statusState.message,
    permission,
    updateCount,
    isTracking,
    start,
    stop,
    retryPermission,
    refresh,
    isDenied: permission === 'denied' || statusState.status === 'permission-denied',
    isReady: !!location && location.accuracy <= 100,
  };
}

export default useNexoraLocation;

