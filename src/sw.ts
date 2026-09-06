/// <reference lib="webworker" />
/**
 * Nexora service worker.
 *
 * Built with `vite-plugin-pwa`'s `injectManifest` strategy, so THIS file is the
 * real source of `dist/sw.js`.
 *
 * Why not `generateSW` + a hand-written `public/sw.js`?
 * -----------------------------------------------------
 * The project used to ship a hand-written `public/sw.js` containing the
 * Background Sync handler. Because `generateSW` writes its own `dist/sw.js`
 * during the build, that file was always overwritten and never ran. As a
 * result `registration.sync.register('sync-supabase')` queued a tag that no
 * service worker was listening for, and every offline write was silently lost.
 * Owning the service-worker source is what lets offline writes survive a
 * closed tab.
 */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { NavigationRoute, registerRoute } from 'workbox-routing';

import { BACKGROUND_SYNC_TAG } from './lib/sync-manager';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

/**
 * Supabase project coordinates, injected at build time (see `define` in
 * vite.config.ts). Only the public anon key is ever present here; Postgres RLS
 * — not the service worker — decides what a write may do.
 */
declare const __NEXORA_SUPABASE_URL__: string;
declare const __NEXORA_SUPABASE_ANON_KEY__: string;

/* ------------------------------------------------------------------ */
/* App shell precaching                                                */
/* ------------------------------------------------------------------ */

// `self.__WB_MANIFEST` is injected by vite-plugin-pwa at build time.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Take over on the first visit so `beforeinstallprompt` fires immediately
// instead of requiring a reload.
self.skipWaiting();
clientsClaim();

// SPA navigation fallback. `/api/*` and Supabase PKCE `?code=` callbacks must
// always reach the network, so they are denied the fallback.
//
// `/auth/login` is deliberately NOT denied: it is a first-class app route
// (App.tsx renders the Login screen for it), so navigation requests to it must
// fall back to the precached index.html. Denying it would push that navigation
// to the network and break the route offline.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//, /\?.*code=/],
  }),
);

/* ------------------------------------------------------------------ */
/* Runtime caching (migrated from the old generateSW `workbox` block)   */
/* ------------------------------------------------------------------ */

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'image-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50 })],
  }),
);

/* ------------------------------------------------------------------ */
/* Background Sync — replay the offline write queue                    */
/* ------------------------------------------------------------------ */

async function replayQueuedWrites(): Promise<void> {
  const [{ createClient }, { getQueue, removeFromQueue, updateAction }, { drainQueue }] = await Promise.all([
    import('@supabase/supabase-js'),
    import('./lib/offline-db'),
    import('./lib/offlineReplay'),
  ]);

  const url = __NEXORA_SUPABASE_URL__;
  const anonKey = __NEXORA_SUPABASE_ANON_KEY__;
  if (!url || !anonKey) {
    // Nothing can be written without project coordinates. Leave every action
    // queued — the in-page replay picks them up next time the app is opened.
    throw new Error('Nexora background sync: Supabase coordinates unavailable in this build');
  }

  const result = await drainQueue(
    (action) =>
      createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: action.accessToken ? { Authorization: `Bearer ${action.accessToken}` } : {},
        },
      }),
    { getQueue, removeFromQueue, updateAction },
  );

  // Let open tabs refresh their sync badge.
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: 'nexora:sync-complete', synced: result.synced, remaining: result.remaining });
  }

  if (result.remaining > 0) {
    // Throwing lets the browser retry the sync tag with its own backoff.
    throw new Error(`Nexora background sync: ${result.remaining} action(s) still pending`);
  }
}

interface NexoraSyncEvent extends ExtendableEvent {
  tag: string;
}

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as NexoraSyncEvent;
  if (syncEvent.tag === BACKGROUND_SYNC_TAG) {
    syncEvent.waitUntil(replayQueuedWrites());
  }
});

/** Lets the page request a replay directly (used where Background Sync is unsupported). */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string } | undefined;
  if (data?.type === 'nexora:sync-now') {
    event.waitUntil(replayQueuedWrites().catch((error) => console.error('[sw] replay failed', error)));
  }
});
