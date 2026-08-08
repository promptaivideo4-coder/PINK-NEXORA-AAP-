import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate', // SW auto-activates + controls page on FIRST visit,
        // so Chrome fires beforeinstallprompt / shows the address-bar install icon
        // immediately instead of requiring a reload. (More reliable installability;
        // your custom Install button still works via the beforeinstallprompt event.)
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        // Keep the generated file name stable so the <head> link + Vercel headers match.
        manifestFilename: 'manifest.webmanifest',
        manifest: {
          name: 'Nexora Salon App',
          short_name: 'Nexora',
          description: 'Premium Salon Management Platform',
          // --- Explicit start_url/scope are REQUIRED by Chrome's installability ---
          start_url: '/',
          scope: '/',
          lang: 'en',
          orientation: 'portrait',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          theme_color: '#8e004b',
          background_color: '#fff8f8',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          cleanupOutdatedCaches: true,
          // Bundle (Leaflet + app) 2MiB cross kar sakta hai — precache limit badhao
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          // Let the SW take control immediately after first registration so
          // Chrome can show the install prompt on the FIRST visit (default
          // behaviour waits for a reload, which users read as
          // "download not working").
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Don't cache API calls, Supabase calls, or non-GET requests
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /\?.*code=/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <--- 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <--- 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 50
                }
              }
            }
          ],
          // Ensure we don't cache sensitive data or non-GET requests
          // Workbox by default only caches GET requests.
          // navigateFallbackDenylist is also useful if we had specific API routes handled by the same origin
        },
        devOptions: {
          // Register the service worker in dev too, so beforeinstallprompt
          // fires and the PWA install option is actually available/testable.
          enabled: true,
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Allow preview hosts (e.g. sandboxed live previews) to access the dev server.
      allowedHosts: true as const,
    },
  };
});
