import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, CloudOff, Cloud, Check, ArrowUpRight, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOfflineSync } from '../contexts/OfflineSyncContext';

interface OfflineSyncStatusProps {
  compact?: boolean;
}

export default function OfflineSyncStatus({ compact = false }: OfflineSyncStatusProps) {
  const { isOnline, isSyncing, syncState, pendingCount, lastSyncedAt, triggerSync, pendingActions } = useOfflineSync();
  const [showPopover, setShowPopover] = useState(false);

  // Format relative last sync time
  const formatLastSync = () => {
    if (!lastSyncedAt) return 'Never';
    const diffMs = Date.now() - new Date(lastSyncedAt).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Header Status Badge Button */}
      <button
        onClick={() => setShowPopover(!showPopover)}
        className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 border cursor-pointer active:scale-95 ${
          isSyncing || syncState === 'active'
            ? 'bg-primary/10 text-primary border-primary/30 shadow-sm shadow-primary/10'
            : syncState === 'pending' || !isOnline
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
            : syncState === 'complete'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            : 'bg-surface-container/60 hover:bg-surface-container text-on-surface-variant border-outline-variant/30'
        }`}
        title="Offline Sync Status"
        aria-label="Offline Sync Status"
      >
        {/* Status Icon */}
        {isSyncing || syncState === 'active' ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : !isOnline ? (
          <CloudOff className="w-3.5 h-3.5 text-amber-500" />
        ) : syncState === 'pending' ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        ) : syncState === 'complete' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Cloud className="w-3.5 h-3.5 text-on-surface-variant/70 group-hover:text-primary transition-colors" />
        )}

        {/* Label text */}
        {!compact && (
          <span className="truncate max-w-[85px] sm:max-w-none text-[11px] font-semibold tracking-tight">
            {isSyncing || syncState === 'active' ? (
              <span className="text-primary">Syncing...</span>
            ) : !isOnline ? (
              <span className="text-amber-600 dark:text-amber-400">Offline {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
            ) : syncState === 'pending' ? (
              <span className="text-amber-600 dark:text-amber-400">Pending ({pendingCount})</span>
            ) : syncState === 'complete' ? (
              <span className="text-emerald-600 dark:text-emerald-400">Synced</span>
            ) : (
              <span>Synced</span>
            )}
          </span>
        )}
      </button>

      {/* Popover Card */}
      <AnimatePresence>
        {showPopover && (
          <>
            {/* Backdrop for closing */}
            <div 
              className="fixed inset-0 z-[60]" 
              onClick={() => setShowPopover(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-72 z-[70] bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant/40 rounded-2xl shadow-xl p-4 text-on-surface text-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">Background Sync</h4>
                    <p className="text-[11px] text-on-surface-variant">
                      {isOnline ? 'Connected to network' : 'Offline mode active'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-2 bg-surface/50 rounded-xl p-2.5 border border-outline-variant/20">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-on-surface-variant">Sync State:</span>
                  <span className="font-bold capitalize flex items-center gap-1">
                    {isSyncing || syncState === 'active' ? (
                      <span className="text-primary flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Active
                      </span>
                    ) : syncState === 'pending' ? (
                      <span className="text-amber-500">Pending ({pendingCount} queued)</span>
                    ) : syncState === 'complete' ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Complete
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">Up to date</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-on-surface-variant">Last Synced:</span>
                  <span className="font-medium text-on-surface">{formatLastSync()}</span>
                </div>

                {pendingCount > 0 && (
                  <div className="pt-1.5 border-t border-outline-variant/20">
                    <p className="text-[10px] font-semibold text-amber-500 mb-1">Queued Changes:</p>
                    <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {pendingActions.map((act, idx) => (
                        <li key={idx} className="text-[10px] text-on-surface-variant bg-surface/80 px-2 py-0.5 rounded border border-outline-variant/20 flex items-center gap-1 truncate">
                          <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                          <span className="truncate">{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={async () => {
                    await triggerSync();
                  }}
                  disabled={isSyncing || !isOnline}
                  className="flex-1 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-primary/10"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
