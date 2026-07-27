# Shop Owner App PWA Architecture & Validation Report

## 1. PWA Architecture
The Nexora Shop Owner application uses a modern **Vite + React + Vite PWA (Workbox)** architecture integrated with Workbox Workflows and custom offline fallback logic.
- **Frontend Framework**: React 18 with TypeScript & Vite.
- **PWA Service Worker**: Managed via `vite-plugin-pwa` with `autoUpdate` registration.
- **Routing**: Client-side state-driven navigation with fallback restoration using `VALID_SCREENS` check.
- **Offline Shell**: HTML App Shell caching with dedicated `/offline` screen routing fallback.

---

## 2. Manifest Configuration
The web app manifest (`manifest.webmanifest`) is automatically generated at build time via `vite.config.ts` with the following parameters:
- **Name**: `Nexora Business - Shop Owner`
- **Short Name**: `Nexora Owner`
- **Description**: `All-in-one salon & shop management platform for salon owners.`
- **Theme Color**: `#8e004b` (Nexora Brand Magenta)
- **Background Color**: `#fcf8f8` (Surface Container Light)
- **Display Mode**: `standalone`
- **Orientation**: `portrait`
- **Start URL**: `/`
- **Scope**: `/`
- **Icons**:
  - `pwa-192x192.png` (192x192, `image/png`, `any maskable`)
  - `pwa-512x512.png` (512x512, `image/png`, `any maskable`)
  - `apple-touch-icon.png` (180x180, `image/png`)
  - `favicon.ico` (32x32)

---

## 3. Service Worker Strategy
- **Mode**: `autoUpdate` (Workbox strategy managed via `vite-plugin-pwa`).
- **Precache Glob Patterns**: `**/*.{js,css,html,ico,png,svg,woff2}`.
- **Runtime Caching Strategies**:
  - **Google Fonts Stylesheets**: StaleWhileRevalidate (`google-fonts-stylesheets`).
  - **Google Fonts Webfonts**: CacheFirst (`google-fonts-webfonts`, 1-year expiration).
  - **Images & Visual Assets**: StaleWhileRevalidate (`images-cache`, 30-day expiration).
  - **HTML Navigation**: NetworkFirst with `index.html` fallback.

---

## 4. Cached and Non-Cached Resources
- **Cached Resources**:
  - Static application bundle assets (`JS`, `CSS`, `HTML`).
  - Local font files and Google Webfonts.
  - SVG icons and PNG PWA assets.
  - App Shell structural assets.
- **Non-Cached Resources (Excluded)**:
  - Private API endpoints (`/api/*`).
  - OAuth and Supabase Auth callbacks (`/auth/*`, URLs with `code=` parameters).
  - Sensitive customer & financial records in dynamic requests.

---

## 5. Offline Behaviour
- **Offline Detection**: React `navigator.onLine` window listeners attached at root `App.tsx`.
- **Offline Banner**: Sticky non-intrusive banner indicating offline status.
- **Offline Fallback Route**: Seamless redirection or rendering of `/offline` route when core resources or connectivity fail.
- **Local Persistence**: Appointments, customer lists, staff records, and theme preferences utilize safe defensive `JSON.parse` wrappers to prevent app crashes if data is corrupted.

---

## 6. Installation Behaviour
- **Standard Prompt**: Captures browser `beforeinstallprompt` event and defers execution until user clicks an explicit install button.
- **Install App Screen**: `/install-app` provides step-by-step OS-specific instructions for Android Chrome, iOS Safari, macOS, and Windows.
- **Dismissal & Tracking**: Dismissing install banners persists `nexora-install-dismissed` locally without intrusive re-prompting on every page load.
- **Modal Entrance Animation**: Custom CSS animation `.manual-installation-modal` with `0.4s cubic-bezier(0.16, 1, 0.3, 1)` fade-in and 10px slide-up effect.

---

## 7. Update Behaviour
- **SW Lifecycle**: New service workers are registered automatically in background.
- **Skip Waiting**: Configured for clean replacement of stale assets on reload.
- **Version Cleanups**: Workbox automatically purges old cache buckets on new build deployment.

---

## 8. Security Decisions
- **Private Data Caching**: Financial data and customer secrets are never stored in Cache Storage or plain Service Worker caches.
- **Auth Navigation Deny List**: Auth URLs (`/auth/*`, OAuth callback codes) explicitly denied from fallback caching in `vite.config.ts`.
- **Owner Session Cleanup**: On logout in `Settings.tsx`, `clearOwnerSessionData()` purges sensitive cached keys (`nexora_full_name`, `nexora_email`, `nexora_phone`, `selected_customer_data`, etc.).
- **App Scope Integrity**: Service Worker controls strictly `/` under Shop Owner scope without bleeding into external Customer/Partner routes.

---

## 9. Platform / Browser Support
- **Android**: Full PWA installation via Web App Manifest & Chrome `beforeinstallprompt`.
- **iOS / iPadOS**: PWA installation via Safari "Add to Home Screen" instructions and `apple-touch-icon`.
- **Desktop (Chrome/Edge/macOS/Windows)**: Standalone desktop app window supported via standard Chromium app prompt.

---

## 10. Files Changed / Created
- `src/utils/storage.ts`: Created safe `JSON.parse` helper (`safeGetJSON`) and `clearOwnerSessionData()` logout utility.
- `src/utils/notifications.ts`: Created explicit permission requester & browser preference accessor interface.
- `src/index.css`: Added keyframe animation `modalEntrance` and CSS selector `.manual-installation-modal`.
- `src/types.ts`: Added `VALID_SCREENS` whitelist array for route restoration validation.
- `src/screens/Settings.tsx`: Integrated session data cleanup on logout and explicit notification permission handling.
- `src/screens/StaffDetail.tsx`: Updated `localStorage` parse with defensive error handling.
- `src/screens/StaffManagement.tsx`: Updated `localStorage` parse with defensive error handling.
- `src/contexts/ThemeContext.tsx`: Updated `localStorage` parse with defensive error handling.
- `vite.config.ts`: Added `navigateFallbackDenylist` for `/api/`, `/auth/`, and OAuth callbacks.
- `public/`: Added `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, and `favicon.ico`.
- `SHOP_OWNER_PWA_REPORT.md`: This comprehensive architecture and validation report.

---

## 11. Tests & Checks Executed
1. **TypeScript Typecheck**: Executed `tsc --noEmit` -> **PASSED** (0 errors).
2. **ESLint / Linter**: Executed `lint_applet` -> **PASSED** (0 errors).
3. **Production Build**: Executed `compile_applet` / `vite build` -> **PASSED**.
4. **PWA Manifest Validation**: Manifest fields, colors, icons verified against standard PWA specifications -> **PASSED**.
5. **Service Worker Registration**: SW registration code verified in `App.tsx` and `sw.js` -> **PASSED**.
6. **Icon Availability**: Verified 192x192, 512x512, apple-touch-icon, and favicon in `/public` -> **PASSED**.
7. **Start URL & Scope**: Verified `/` start URL and scope in `manifest.webmanifest` -> **PASSED**.
8. **Offline App-Shell Check**: Verified `/offline` fallback route and offline status handler -> **PASSED**.
9. **Route Validation & Fallback**: Verified valid screen check against `VALID_SCREENS` -> **PASSED**.
10. **Lighthouse Audit Note**: *Environment Limitation*: Headless Chromium and Google Lighthouse binary are not available in the sandboxed Cloud Run container runtime environment. Consequently, an automated Lighthouse CLI run could not be executed directly in container shell. Manual PWA checks (manifest, SW, icons, offline shell, HTTPS delivery) pass all criteria.

---

## 12. Deferred Backend Notification Work
- **No Fake Push Subscriptions**: Backend push server and VAPID key exchange deferred until full Supabase / Firebase integration.
- **No Automatic Popups**: No automatic permission requests fire on initial page load.
- **Explicit Action Trigger**: Browser permission popup is triggered only when the user toggles Notifications on in Settings/Profile.

---

## 13. Remaining Limitations
- **Background Push**: Native push notifications require server-side VAPID payload signing and active FCM/WebPush backend services.
- **Background Sync**: Background appointment sync queued in IndexedDB/localStorage requires active backend endpoint connections once live.
