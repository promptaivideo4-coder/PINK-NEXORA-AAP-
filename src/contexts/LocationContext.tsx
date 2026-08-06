/**
 * LocationContext.tsx
 * ====================
 * Global location state for the whole app.
 *
 * - Login ke turant baad App khud `requestLocation()` call karta hai →
 *   browser ka permission prompt turant aata hai.
 * - Permission milne ke baad location auto-capture hoti hai (30m gate).
 * - Har screen (Dashboard, NearbySalons) isi ek context se location
 *   read karti hai — koi duplicate tracker nahi.
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
  LocationTracker,
  GeoLocation,
  LocationPermission,
  LocationLogEntry,
  getLocationLog,
  clearLocationLog,
  PERMISSION_DENIED_MESSAGE,
} from '../lib/geolocation';

interface LocationContextValue {
  permission: LocationPermission;
  acceptedFix: GeoLocation | null;
  rawFix: GeoLocation | null;
  watchOn: boolean;
  errorMsg: string | null;
  permissionDenied: boolean;
  movedNotif: string | null;
  logs: LocationLogEntry[];
  /** Location le lo (permission prompt bhi yahi se trigger hota hai) */
  requestLocation: () => void;
  /** Tracking band karo */
  stopLocation: () => void;
  /** Logs clear karo */
  clearLogs: () => void;
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

  const trackerRef = useRef<LocationTracker | null>(null);

  useEffect(() => {
    // Tracker ek baar banao (callbacks → React state)
    const tracker = new LocationTracker({
      onRawUpdate: (_fix, s) => {
        setRawFix(s.lastFix);
        setPermission(s.permission);
        setLogs(getLocationLog());
      },
      onAcceptedFix: (fix, s) => {
        setAcceptedFix(fix);
        setPermission(s.permission);
        setMovedNotif(null);
        setLogs(getLocationLog());
      },
      onMoved: (_from, to, dist) => {
        setMovedNotif(
          `📡 Moved ${dist} m — location refreshed (${to.latitude.toFixed(5)}, ${to.longitude.toFixed(5)})`,
        );
        setLogs(getLocationLog());
      },
      onPermissionDenied: () => {
        setPermissionDenied(true);
        setErrorMsg(PERMISSION_DENIED_MESSAGE);
        setLogs(getLocationLog());
      },
      onError: (_code, msg) => {
        setErrorMsg(msg);
        setLogs(getLocationLog());
      },
      onWatchStateChange: (active) => setWatchOn(active),
    });
    trackerRef.current = tracker;

    // Unmount hone par GPS band (battery/CPU bachao)
    return () => {
      tracker.stop();
      trackerRef.current = null;
    };
  }, []);

  const requestLocation = useCallback(() => {
    setPermissionDenied(false);
    setErrorMsg(null);
    setMovedNotif(null);
    trackerRef.current?.restart();
    setLogs(getLocationLog());
  }, []);

  const stopLocation = useCallback(() => {
    trackerRef.current?.stop();
    setLogs(getLocationLog());
  }, []);

  const clearLogs = useCallback(() => {
    clearLocationLog();
    setLogs([]);
  }, []);

  const value: LocationContextValue = {
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
