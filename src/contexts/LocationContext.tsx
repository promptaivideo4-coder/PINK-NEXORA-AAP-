/**
 * LocationContext.tsx
 * ===================
 * Production-Ready Native GPS – Nexora PWA
 * 
 * Uses new src/location/* modules internally:
 * - ONLY navigator.geolocation.watchPosition()
 * - Config { enableHighAccuracy:true, timeout:15000, maximumAge:0 }
 * - Intelligent validation: 0-15 excellent immediate, 16-30 good, 31-50 wait 10s, 51-100 improving, >100 reject
 * - Stable: valid coords, newer, not duplicate <5m, no impossible jumps
 * - Saves lat/lng/accuracy/timestamp/speed/heading globally
 * - Continuous tracking, only >100m triggers
 * - Haversine R=6371000m
 * - No external APIs
 *
 * Backward compatible with old UI (NearbySalons old code) + exposes new production fields
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
  GeoLocation,
  LocationPermission,
  LocationLogEntry,
  getLocationLog,
  clearLocationLog,
  PERMISSION_DENIED_MESSAGE,
} from '../lib/geolocation';

import {
  locationService,
  locationStore,
  permissionManager,
  logger,
  STATUS_MESSAGES,
} from '../location';

import type {
  ValidatedLocation,
  GPSStatus,
  StatusMessage,
  GroupedSalons,
  Salon,
} from '../location/types';
import { nearbySalonService } from '../location/NearbySalonService';

interface LocationContextValue {
  // Old API (kept for existing screens)
  permission: LocationPermission;
  acceptedFix: GeoLocation | null;
  rawFix: GeoLocation | null;
  watchOn: boolean;
  errorMsg: string | null;
  permissionDenied: boolean;
  movedNotif: string | null;
  logs: LocationLogEntry[];
  requestLocation: () => void;
  stopLocation: () => void;
  clearLogs: () => void;

  // New production API
  currentLocation: ValidatedLocation | null;
  gpsStatus: GPSStatus;
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
  const [permission, setPermission] = useState<LocationPermission>('unknown');
  const [acceptedFix, setAcceptedFix] = useState<GeoLocation | null>(null);
  const [rawFix, setRawFix] = useState<GeoLocation | null>(null);
  const [watchOn, setWatchOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [movedNotif, setMovedNotif] = useState<string | null>(null);
  const [logs, setLogs] = useState<LocationLogEntry[]>(getLocationLog());

  // New production state
  const [currentLocation, setCurrentLocation] = useState<ValidatedLocation | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(STATUS_MESSAGES.DETECTING);
  const [updateCount, setUpdateCount] = useState(0);
  const [groupedSalons, setGroupedSalons] = useState<GroupedSalons | null>(null);

  const initializedRef = useRef(false);

  // Keep logs synced via polling (old API) + also subscribe to store for new logs
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(getLocationLog());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Initialize once – production service
    if (initializedRef.current) return;
    initializedRef.current = true;

    logger.logInfo('LocationProvider mounting – initializing production GPS service');

    // Initialize service (permission check etc)
    locationService.initialize().then(() => {
      setPermission(locationService.getPermissionState() as LocationPermission);
    });

    // Subscribe to location store – new production flow
    const unsubLoc = locationStore.subscribeToLocation((event) => {
      const loc = event.location;
      setCurrentLocation(loc);
      setUpdateCount(loc.updateCount);
      setLogs(getLocationLog());

      // Map to old GeoLocation for backward compat
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

      setAcceptedFix(geo);
      setRawFix(geo); // for old UI, rawFix at least equals accepted
      setPermissionDenied(false);
      setErrorMsg(null);

      // Movement notification
      if (event.movementDistance >= 100) {
        setMovedNotif(
          `📡 Moved ${Math.round(event.movementDistance)} m — location refreshed (${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)})`,
        );
        // Auto-clear after 5s
        setTimeout(() => setMovedNotif(null), 5000);
      }

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
        setErrorMsg(PERMISSION_DENIED_MESSAGE);
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
      setPermission(state as LocationPermission);
      if (state === 'denied') {
        setPermissionDenied(true);
        setErrorMsg(PERMISSION_DENIED_MESSAGE);
      }
    });

    // Salon updates event
    const handleSalonsUpdated = (e: Event) => {
      const custom = e as CustomEvent<GroupedSalons>;
      setGroupedSalons(custom.detail);
    };
    window.addEventListener('nexora-salons-updated', handleSalonsUpdated as EventListener);

    // Auto-start if permission already granted or prompt
    // Don't auto-start on mount – App.tsx controls via requestLocation on login
    // But we keep watcher ready

    return () => {
      unsubLoc();
      unsubStatus();
      unsubPerm();
      window.removeEventListener('nexora-salons-updated', handleSalonsUpdated as EventListener);
      // Don't stop on unmount – keep for PWA background, but LocationProvider unmounts rarely
    };
  }, []);

  const requestLocation = useCallback(async () => {
    setPermissionDenied(false);
    setErrorMsg(null);
    setMovedNotif(null);
    setLogs(getLocationLog());

    logger.logInfo('requestLocation() called – starting production watchPosition');
    setGpsStatus('detecting');
    setStatusMessage(STATUS_MESSAGES.DETECTING);
    setWatchOn(true);

    // Ensure permission check
    const perm = await permissionManager.checkPermission();
    setPermission(perm as LocationPermission);

    if (perm === 'denied') {
      setPermissionDenied(true);
      setErrorMsg(PERMISSION_DENIED_MESSAGE);
      setGpsStatus('permission-denied');
      setStatusMessage(STATUS_MESSAGES.PERMISSION_DENIED);
      setWatchOn(false);
      return;
    }

    const started = await locationService.start();
    setWatchOn(started);
    if (!started) {
      setErrorMsg('Failed to start GPS – check permission');
    }
  }, []);

  const stopLocation = useCallback(() => {
    logger.logInfo('stopLocation() called – clearing watcher');
    locationService.stop();
    setWatchOn(false);
    setGpsStatus('idle');
    setStatusMessage(STATUS_MESSAGES.DETECTING);
  }, []);

  const clearLogs = useCallback(() => {
    clearLocationLog();
    setLogs([]);
    logger.resetCount();
  }, []);

  const setSalons = useCallback((salons: Salon[]) => {
    // Convert generic salon input to production Salon format if needed
    // Assume incoming salons have latitude/longitude – if from Supabase, map them
    locationService.setSalons(salons as any);
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
      setErrorMsg(PERMISSION_DENIED_MESSAGE);
    } else {
      setPermissionDenied(false);
      setErrorMsg(null);
    }
    return ok;
  }, []);

  const isReady = !!currentLocation && currentLocation.accuracy <= 100;

  const value: LocationContextValue = {
    // old
    permission,
    acceptedFix,
    rawFix,
    watchOn,
    errorMsg,
    permissionDenied,
    movedNotif,
    logs,
    requestLocation,
    stopLocation,
    clearLogs,
    // new
    currentLocation,
    gpsStatus,
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
