/**
 * LocationContext.tsx
 * ===================
 * GLOBAL React state/access layer for location — SIRF context.
 *
 * - Koi GPS implementation nahi — sab kuch `src/location/*` ko delegate hota hai
 *   (LocationService → GPSWatcher → navigator.geolocation).
 * - Normalized location state (`ValidatedLocation`) expose karta hai.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  locationService,
  locationStore,
  permissionManager,
  logger,
  STATUS_MESSAGES,
  simplifyStatus,
} from '../location';

import type {
  ValidatedLocation,
  GPSStatus,
  SimpleStatus,
  StatusMessage,
  PermissionState,
  GroupedSalons,
  Salon,
} from '../location/types';

interface LocationContextValue {
  // Compat API (existing screens)
  permission: PermissionState;
  watchOn: boolean;
  errorMsg: string | null;
  permissionDenied: boolean;
  requestLocation: () => void;

  // Normalized production API
  /** Normalized location state — single source for the app */
  currentLocation: ValidatedLocation | null;
  /** Last known fix (koi bhi accuracy, low-accuracy fallback bhi) — app decide kare */
  lastKnownFix: ValidatedLocation | null;
  gpsStatus: GPSStatus;
  /** Normalized status: idle | requesting | success | error | denied | unavailable */
  simpleStatus: SimpleStatus;
  statusMessage: StatusMessage;
  updateCount: number;
  groupedSalons: GroupedSalons | null;
  setSalons: (salons: Salon[]) => void;
  forceRecalculate: () => void;
  retryPermission: () => Promise<boolean>;
  isReady: boolean;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [watchOn, setWatchOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Normalized production state
  const [currentLocation, setCurrentLocation] = useState<ValidatedLocation | null>(null);
  const [lastKnownFix, setLastKnownFix] = useState<ValidatedLocation | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(STATUS_MESSAGES.DETECTING);
  const [updateCount, setUpdateCount] = useState(0);
  const [groupedSalons, setGroupedSalons] = useState<GroupedSalons | null>(null);

  const initializedRef = useRef(false);
  const watchOnRef = useRef(false);
  const hasLocationRef = useRef(false);

  useEffect(() => {
    watchOnRef.current = watchOn;
  }, [watchOn]);
  useEffect(() => {
    hasLocationRef.current = !!currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    // Initialize once – production service
    if (initializedRef.current) return;
    initializedRef.current = true;

    logger.logInfo('LocationProvider mounting – initializing production GPS service');

    // Initialize service (permission check etc)
    locationService.initialize().then(() => {
      setPermission(locationService.getPermissionState());
    });

    // Subscribe to location store – new production flow
    const unsubLoc = locationStore.subscribeToLocation((event) => {
      const loc = event.location;
      setCurrentLocation(loc);
      setUpdateCount(loc.updateCount);
      setPermissionDenied(false);
      setErrorMsg(null);

      // Update grouped salons if we have salons
      const grouped = locationService.getNearbySalons();
      if (grouped) setGroupedSalons(grouped);
    });

    const unsubStatus = locationStore.subscribeToStatus((evt) => {
      setGpsStatus(evt.status);
      setStatusMessage(evt.message);
      setWatchOn(evt.status !== 'idle' && evt.status !== 'permission-denied' && evt.status !== 'unsupported');

      if (evt.status === 'permission-denied') {
        setPermissionDenied(true);
        setErrorMsg(STATUS_MESSAGES.PERMISSION_DENIED);
        setPermission('denied');
      } else if (evt.status === 'weak-signal' || evt.status === 'waiting-better' || evt.status === 'improving' || evt.status === 'detecting') {
        setErrorMsg(evt.message);
        setPermissionDenied(false);
      } else if (evt.status === 'updated') {
        setErrorMsg(null);
        setPermissionDenied(false);
      } else if (evt.status === 'offline') {
        setErrorMsg('Device offline – GPS may be degraded');
      }
    });

    const unsubPerm = locationStore.subscribeToPermission((state) => {
      setPermission(state);
      if (state === 'denied') {
        setPermissionDenied(true);
        setErrorMsg(STATUS_MESSAGES.PERMISSION_DENIED);
      }
    });

    // Last known fix — low-accuracy fallback (app decide karta hai usable hai ya nahi)
    const unsubLastKnown = locationStore.subscribeToLastKnownFix((event) => {
      setLastKnownFix(event.location);
    });

    // Salon updates event
    const handleSalonsUpdated = (e: Event) => {
      const custom = e as CustomEvent<GroupedSalons>;
      setGroupedSalons(custom.detail);
    };
    window.addEventListener('nexora-salons-updated', handleSalonsUpdated as EventListener);

    return () => {
      unsubLoc();
      unsubStatus();
      unsubPerm();
      unsubLastKnown();
      window.removeEventListener('nexora-salons-updated', handleSalonsUpdated as EventListener);
    };
  }, []);

  const requestLocation = useCallback(async () => {
    // STEP 17: repeated permission requests avoid — agar pehle se tracking +
    // location mil chuki hai to dobara permission query / start mat karo.
    if (watchOnRef.current && hasLocationRef.current) return;

    setPermissionDenied(false);
    setErrorMsg(null);
    logger.logInfo('requestLocation() called – starting production watchPosition');
    setGpsStatus('detecting');
    setStatusMessage(STATUS_MESSAGES.DETECTING);
    setWatchOn(true);
    watchOnRef.current = true;

    // Ensure permission check
    const perm = await permissionManager.checkPermission();
    setPermission(perm);

    if (perm === 'denied') {
      setPermissionDenied(true);
      setErrorMsg(STATUS_MESSAGES.PERMISSION_DENIED);
      setGpsStatus('permission-denied');
      setStatusMessage(STATUS_MESSAGES.PERMISSION_DENIED);
      setWatchOn(false);
      return;
    }

    // Browser geolocation unsupported — graceful state (STEP 16)
    if (perm === 'unsupported') {
      setGpsStatus('unsupported');
      setStatusMessage(STATUS_MESSAGES.DETECTING);
      setErrorMsg('Location services not supported in this browser.');
      setWatchOn(false);
      return;
    }

    const started = await locationService.start();
    setWatchOn(started);
    if (!started) {
      setErrorMsg('Failed to start GPS – check permission');
    }
  }, []);

  const setSalons = useCallback((salons: Salon[]) => {
    // Delegate to service – production salon grouping
    locationService.setSalons(salons);
    const grouped = locationService.getNearbySalons();
    if (grouped) setGroupedSalons(grouped);
  }, []);

  const forceRecalculate = useCallback(() => {
    const grouped = locationService.forceRecalculate();
    if (grouped) setGroupedSalons(grouped);
  }, []);

  const retryPermission = useCallback(async () => {
    logger.logInfo('Retrying permission...');
    const ok = await locationService.retryPermission();
    setWatchOn(ok);
    if (!ok) {
      setPermissionDenied(true);
      setErrorMsg(STATUS_MESSAGES.PERMISSION_DENIED);
    } else {
      setPermissionDenied(false);
      setErrorMsg(null);
    }
    return ok;
  }, []);

  const isReady = !!currentLocation && currentLocation.accuracy <= 100;

  const value: LocationContextValue = {
    // compat
    permission,
    watchOn,
    errorMsg,
    permissionDenied,
    requestLocation,
    // normalized production
    currentLocation,
    lastKnownFix,
    gpsStatus,
    simpleStatus: simplifyStatus(gpsStatus),
    statusMessage,
    updateCount,
    groupedSalons,
    setSalons,
    forceRecalculate,
    retryPermission,
    isReady,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return ctx;
}

// Re-export for convenience
export { STATUS_MESSAGES };
