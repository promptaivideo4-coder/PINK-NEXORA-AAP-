import React, { createContext, useContext, useState, useEffect } from 'react';

export type SyncState = 'idle' | 'pending' | 'active' | 'complete';

interface OfflineSyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncState: SyncState;
  pendingCount: number;
  lastSyncedAt: Date | null;
  triggerSync: () => Promise<void>;
  addPendingChange: (actionName: string) => void;
  pendingActions: string[];
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

interface OfflineSyncProviderProps {
  children: React.ReactNode;
  isOnline: boolean;
  isSyncing: boolean;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
}

export function OfflineSyncProvider({ children, isOnline, isSyncing, setIsSyncing }: OfflineSyncProviderProps) {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [pendingActions, setPendingActions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_pending_offline_actions');
      return saved ? JSON.parse(saved) : ['Offline Appointment Queue', 'Staff Availability Cache'];
    } catch {
      return ['Offline Appointment Queue'];
    }
  });

  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    const saved = localStorage.getItem('nexora_last_synced_at');
    return saved ? new Date(saved) : new Date();
  });

  useEffect(() => {
    try {
      localStorage.setItem('nexora_pending_offline_actions', JSON.stringify(pendingActions));
    } catch (e) {
      console.error(e);
    }
  }, [pendingActions]);

  const addPendingChange = (actionName: string) => {
    setPendingActions((prev) => [...prev, actionName]);
    if (!isOnline && !isSyncing) {
      setSyncState('pending');
    }
  };

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncState('active');

    // Simulate background network synchronization
    await new Promise((resolve) => setTimeout(resolve, 2200));

    setIsSyncing(false);
    setSyncState('complete');
    setPendingActions([]);
    const now = new Date();
    setLastSyncedAt(now);
    localStorage.setItem('nexora_last_synced_at', now.toISOString());

    setTimeout(() => {
      setSyncState('idle');
    }, 3500);
  };

  // Auto trigger sync when transitioning online with pending actions
  useEffect(() => {
    if (isOnline && pendingActions.length > 0 && !isSyncing && syncState !== 'complete') {
      triggerSync();
    }
  }, [isOnline]);

  const computedSyncState: SyncState = isSyncing
    ? 'active'
    : syncState === 'complete'
    ? 'complete'
    : pendingActions.length > 0
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
        triggerSync,
        addPendingChange,
        pendingActions,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    // Provide safe fallback if context isn't wrapped
    return {
      isOnline: navigator.onLine,
      isSyncing: false,
      syncState: 'idle' as SyncState,
      pendingCount: 0,
      lastSyncedAt: new Date(),
      triggerSync: async () => {},
      addPendingChange: () => {},
      pendingActions: [],
    };
  }
  return context;
}
