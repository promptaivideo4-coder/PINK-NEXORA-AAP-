/**
 * useNexoraLocation.ts
 * React hook for Nexora PWA GPS - production ready, battery efficient
 * Prevents unnecessary renders, handles cleanup
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ValidatedLocation,
  GPSStatus,
  StatusMessage,
  PermissionState,
} from '../location/types';
import { locationService } from '../location/LocationService';
import { locationStore } from '../location/LocationStore';
import { STATUS_MESSAGES } from '../location/constants';

interface UseNexoraLocationOptions {
  autoStart?: boolean;
  debug?: boolean;
}

interface UseNexoraLocationReturn {
  location: ValidatedLocation | null;
  status: GPSStatus;
  message: StatusMessage;
  permission: PermissionState;
  updateCount: number;
  isTracking: boolean;
  start: () => Promise<boolean>;
  stop: () => void;
  retryPermission: () => Promise<boolean>;
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

  useEffect(() => {
    mountedRef.current = true;

    // Subscribe to location
    const unsubLoc = locationStore.subscribeToLocation((event) => {
      if (!mountedRef.current) return;
      setLocation(event.location);
      setUpdateCount((c) => c + 1);
    });

    const unsubStatus = locationStore.subscribeToStatus((event) => {
      if (!mountedRef.current) return;
      setStatusState({ status: event.status, message: event.message });
    });

    const unsubPerm = locationStore.subscribeToPermission((state) => {
      if (!mountedRef.current) return;
      setPermission(state);
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

  return {
    location,
    status: statusState.status,
    message: statusState.message,
    permission,
    updateCount,
    isTracking,
    start,
    stop,
    retryPermission,
    isDenied: permission === 'denied' || statusState.status === 'permission-denied',
    isReady: !!location && location.accuracy <= 100,
  };
}

export default useNexoraLocation;
