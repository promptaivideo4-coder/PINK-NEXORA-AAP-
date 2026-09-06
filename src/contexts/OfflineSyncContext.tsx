import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { supabase } from '../lib/supabase';
import { drainQueue, type DrainResult } from '../lib/offlineReplay';
import {
  countQueue,
  getQueue,
  isOfflineQueueSupported,
  updateAction,
  removeFromQueue,
  type PendingAction,
} from '../lib/offline-db';
import { OFFLINE_QUEUE_CHANGED_EVENT } from '../lib/sync-manager';

export type SyncState = 'idle' | 'pending' | 'active' | 'error' | 'complete';

interface OfflineSyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncState: SyncState;
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastResult: DrainResult | null;
  /** Human-readable label per queued action, for the status popover. */
  pendingActions: PendingAction[];
  triggerSync: () => Promise<DrainResult | null>;
  refreshPending: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

const LAST_SYNCED_KEY = 'nexora_last_synced_at';

function readLastSyncedAt(): Date | null {
  if (typeof localStorage === 'undefined') return null;
  const saved = localStorage.getItem(LAST_SYNCED_KEY);
  if (!saved) return null;
  const date = new Date(saved);
  return Number.isNaN(date.getTime()) ? null : date;
}

interface OfflineSyncProviderProps {
  children: React.ReactNode;
  isOnline: boolean;
  isSyncing: boolean;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Offline sync provider backed by the REAL IndexedDB write queue.
 *
 * The previous version kept two hard-coded strings in localStorage
 * ("Offline Appointment Queue", "Staff Availability Cache") — so the badge
 * always claimed 2 pending changes — and `triggerSync()` was a 2.2s timer that
 * reported success without writing anything. Both are gone: the count now comes
 * from the queue and `triggerSync()` actually replays it through Supabase.
 */
export function OfflineSyncProvider({ children, isOnline, isSyncing, setIsSyncing }: OfflineSyncProviderProps) {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(readLastSyncedAt);
  const [lastResult, setLastResult] = useState<DrainResult | null>(null);
  const inFlightRef = useRef(false);

  const refreshPending = useCallback(async () => {
    if (!isOfflineQueueSupported()) {
      setPendingActions([]);
      return;
    }
    try {
      setPendingActions(await getQueue());
    } catch (error) {
      console.error('[OfflineSync] Failed to read the offline queue', error);
      setPendingActions([]);
    }
  }, []);

  const triggerSync = useCallback(async (): Promise<DrainResult | null> => {
    if (inFlightRef.current) return null;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSyncState('pending');
      return null;
    }
    if (!isOfflineQueueSupported()) return null;

    inFlightRef.current = true;
    setIsSyncing(true);
    setSyncState('active');

    let result: DrainResult | null = null;
    try {
      result = await drainQueue(() => supabase, { getQueue, removeFromQueue, updateAction });
      setLastResult(result);

      if (result.failed > 0) {
        // At least one action could not be written — stay honest about it.
        setSyncState('error');
      } else {
        const now = new Date();
        setLastSyncedAt(now);
        setSyncState('complete');
        try {
          localStorage.setItem(LAST_SYNCED_KEY, now.toISOString());
        } catch {
          /* Storage can be full or blocked — non-fatal. */
        }
      }
      await refreshPending();
      return result;
    } catch (error) {
      console.error('[OfflineSync] Sync failed', error);
      setSyncState('error');
      return result;
    } finally {
      setIsSyncing(false);
      inFlightRef.current = false;
    }
  }, [refreshPending, setIsSyncing]);

  // Read the queue on mount and whenever something enqueues a new action.
  useEffect(() => {
    void refreshPending();
    if (typeof window === 'undefined') return;
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refreshPending);
    return () => window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refreshPending);
  }, [refreshPending]);

  // Replay as soon as connectivity returns, and settle the badge back to idle
  // a few seconds after a completed run.
  useEffect(() => {
    if (!isOnline) {
      setSyncState(pendingActions.length > 0 ? 'pending' : 'idle');
      return;
    }
    if (pendingActions.length === 0) {
      setSyncState((current) => (current === 'active' ? 'active' : current));
      return;
    }
    void triggerSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, pendingActions.length]);

  useEffect(() => {
    if (syncState !== 'complete') return;
    const timer = setTimeout(() => setSyncState('idle'), 3500);
    return () => clearTimeout(timer);
  }, [syncState]);

  const computedSyncState: SyncState = isSyncing
    ? 'active'
    : !isOnline && pendingActions.length > 0
      ? 'pending'
      : syncState === 'complete' && pendingActions.length > 0
        ? 'pending'
        : syncState;

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        syncState: computedSyncState,
        pendingCount: pendingActions.length,
        lastSyncedAt,
        lastResult,
        pendingActions,
        triggerSync,
        refreshPending,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
}

function fallbackValue(): OfflineSyncContextType {
  return {
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    isSyncing: false,
    syncState: 'idle',
    pendingCount: 0,
    lastSyncedAt: null,
    lastResult: null,
    pendingActions: [],
    triggerSync: async () => null,
    refreshPending: async () => {},
  };
}

export function useOfflineSync(): OfflineSyncContextType {
  return useContext(OfflineSyncContext) ?? fallbackValue();
}
