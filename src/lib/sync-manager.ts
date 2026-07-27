
import { addToQueue, PendingAction } from './offline-db';

export async function queueAction(type: PendingAction['type'], data: any) {
  const action: PendingAction = {
    type,
    data,
    timestamp: Date.now(),
  };

  await addToQueue(action);

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-supabase');
      console.log('Background sync registered');
    } catch (err) {
      console.log('Background sync registration failed:', err);
    }
  } else {
    // Fallback: If Background Sync is not supported, we could trigger a manual sync
    // when the app comes back online.
    console.log('Background Sync not supported, will rely on manual sync');
  }
}

export function setupOnlineListener(onSync: () => void) {
  window.addEventListener('online', () => {
    console.log('App is back online');
    onSync();
  });
}
