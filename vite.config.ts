import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // `process.env` is NOT populated from .env files while the config is being
  // evaluated, so read them explicitly. Without this the anon key folds to an
  // empty string and esbuild statically eliminates the whole background-sync
  // replay path from the built service worker.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    // Supabase coordinates are baked into the service-worker bundle so
    // `src/sw.ts` can replay the offline write queue. Only the public anon key
    // is injected (never a service-role key), and RLS still governs every write.
    define: {
      __NEXORA_SUPABASE_URL__: JSON.stringify(
        env.VITE_SUPABASE_URL || 'https://qwaehqsmodekbgvnaavz.supabase.co',
      ),
      __NEXORA_SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        // `injectManifest` builds the service worker from `src/sw.ts` instead of
        // generating one. The previous `generateSW` mode overwrote the
        // hand-written `public/sw.js` at build time, so its Background Sync
        // handler never ran and queued offline writes were lost.
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectManifest: {
          // Leaflet + the app bundle push the precache past Workbox's default.
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
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
        // NOTE: the old `workbox.*` block was generateSW-only. Its precache,
        // navigation-fallback and runtime-caching rules now live in `src/sw.ts`,,
        // which is the service-worker source under the `injectManifest` strategy.
        devOptions: {
          // Register the service worker in dev too, so beforeinstallprompt
          // fires and the PWA install option is actually available/testable.
          enabled: true,
          // `injectManifest` needs these two explicitly: `type: 'module'` to
          // match the emitted ESM worker, and `navigateFallback` so the dev
          // middleware knows which document to serve for SPA routes.
          type: 'module',
          navigateFallback: 'index.html',
        }
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react';
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'motion';
            if (id.includes('node_modules/recharts')) return 'charts';
            if (id.includes('node_modules/leaflet')) return 'leaflet';
            if (id.includes('node_modules/lucide-react')) return 'icons';
            if (id.includes('node_modules/@supabase')) return 'supabase';
            return undefined;
          },
        },
      },
    },
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
