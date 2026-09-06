/**
 * sync-manager.ts
 * ===============
 * Enqueueing side of the offline write path.
 *
 * `queueAction()` writes a schema-correct action into the IndexedDB queue and
 * then asks the app (and, when supported, the service worker) to replay it.
 * The actual replay logic lives in `offlineReplay.ts` — this module only
 * persists and nudges.
 *
 * IMPORTANT: the payload passed here must already use the real column names of
 * `public.bookings` / `public.customers` (see `toBookingRow` / `toCustomerRow`).
 * The previous implementation enqueued invented fields that no table has, so
 * replay could never have succeeded.
 */

import { addToQueue, PendingAction, isOfflineQueueSupported } from './offline-db';
import { supabase } from './supabase';

/** Broadcast channel used to tell the app shell "there is work to replay". */
export const OFFLINE_QUEUE_CHANGED_EVENT = 'nexora:offline-queue-changed';

/** Tag registered for Background Sync. Handled by `src/sw.ts`. */
export const BACKGROUND_SYNC_TAG = 'sync-supabase';

function notifyQueueChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OFFLINE_QUEUE_CHANGED_EVENT));
}

/**
 * Registers a Background Sync request so the service worker can replay the
 * queue even after the tab is closed. Silently skipped where unsupported
 * (iOS Safari, Firefox) — the in-page drain on reconnect covers those.
 */
async function requestBackgroundSync(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(
      BACKGROUND_SYNC_TAG,
    );
    return true;
  } catch (err) {
    // Registration can be refused by the browser; the in-page retry path still
    // runs whenever the app regains connectivity, so this is not fatal.
    console.debug('[sync-manager] Background Sync registration failed:', err);
    return false;
  }
}

/** Adds an action to the offline queue and triggers a replay attempt. */
export async function queueAction(
  type: PendingAction['type'],
  data: Record<string, unknown>,
): Promise<void> {
  if (!isOfflineQueueSupported()) {
    throw new Error('This browser does not support offline storage, so the change could not be saved.');
  }

  // Capture the caller's access token so the service worker can replay this
  // action with the same RLS identity if the tab is closed first. The page
  // itself always replays with the live session, so a stale token only ever
  // affects the background path — and a rejected write stays queued.
  let accessToken: string | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token ?? undefined;
  } catch {
    accessToken = undefined;
  }

  const action: PendingAction = {
    type,
    data,
    timestamp: Date.now(),
    attempts: 0,
    accessToken,
  };

  await addToQueue(action);
  notifyQueueChanged();
  await requestBackgroundSync();
}

/** Fires `onSync` every time the browser regains connectivity. */
export function setupOnlineListener(onSync: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => {
    console.debug('[sync-manager] App is back online');
    onSync();
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
