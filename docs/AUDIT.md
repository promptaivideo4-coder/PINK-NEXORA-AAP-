# NEXORA (PINK-NEXORA-AAP) — Complete App Audit

**Date:** 2026-09-06 · **Branch:** `arena/01a074a4-pink-nexora-aap`
**Scope:** full codebase (237 files), Supabase schema, API routes, PWA/offline layer
**Verification:** `tsc --noEmit` ✅ · `vitest run` ✅ 40/40 · `vite build` ✅

> This is the live audit document. Older reports were moved to
> [`archive/`](./archive/README.md) — several of them describe files and tables
> that no longer exist and should not be relied on.

---

## 0. TL;DR

| Area | Verdict |
|------|---------|
| Type safety / build / tests | ✅ Clean — but tests cover only ~5% of the surface |
| Offline sync | 🔴 **Was fake and lost data — fixed in this pass** |
| Navigation reachability | 🔴 **8 screens were unreachable — fixed in this pass** |
| Duplication | 🟠 Heavy — 15 files + ~900 lines removed in this pass |
| Database schema | 🔴 6 tables referenced in code but never created; migrations cannot run in filename order |
| Dead backend surface | 🟠 4 Vercel API routes (1,638 lines) + 44/67 repository functions are never called |
| Security hygiene | 🟠 Supabase anon key hard-coded in 3 committed files |
| Accessibility | 🟠 906 buttons / 31 `aria-label`s; 43 of 82 `<img>` have no `alt` |

Net change this pass: **41 files changed, −1,544 / +764 lines** (net −780).

---

## 1. Method

1. Built a dependency graph from `src/main.tsx` and flagged every unreachable module.
2. Built a call graph for every exported symbol in `lib/`, `hooks/` and `api/`.
3. Built a screen-reachability graph from every `navigate('…')` call plus `BottomNav`.
4. Diffed Supabase tables referenced in `src/` against `CREATE TABLE` statements in `supabase/`.
5. Grepped for duplicated JSX blocks ≥8 lines across all `.tsx` files (144 hits).
6. Verified with `tsc --noEmit`, `vitest run`, `vite build`.

---

## 2. DUPLICATE / UNNECESSARY — removed in this pass

### 2.1 Dead files (15 deleted)

| File | Why |
|------|-----|
| `add_assign_stylist.cjs`, `add_checkout_modal.cjs`, `add_states.cjs`, `add_stylist_workload.cjs`, `add_whatsapp.cjs`, `fix_whatsapp.cjs`, `update_bookings.cjs`, `update_services.cjs` | One-shot codemods that already mutated `src/screens/*.tsx`. Not referenced by `package.json` or anything else. Keeping them invites re-running a script against code that has since diverged. |
| `replace_currency.js` | Exact duplicate of `replace_currency.cjs` |
| `update_staffdetail_prices.js` | Exact duplicate of `update_staffdetail_prices.cjs` |
| `get_imports.js` | 2-line debug scratch file |
| `src/utils/export.ts` | 26 lines, **zero importers** — unreachable from `main.tsx` |
| `public/sw.js` | 134 lines. Never shipped: `vite-plugin-pwa` was in `generateSW` mode and overwrote it with its own `dist/sw.js`. Replaced by a real `src/sw.ts` (see §3.1). |

### 2.2 Duplicated code blocks (≈900 lines removed)

| Location | Duplication | Action |
|----------|-------------|--------|
| `src/App.tsx` | A 45-line `if (params.get('screen') === '…')` chain that re-declared the **same 14 entries** already in `workspaceScreens.ts`. Two sources of truth that had already drifted. | Replaced with a `PREVIEW_SCREEN_MAP` lookup. 639 → 594 lines. |
| `src/screens/Profile.tsx` | An "App Preferences" panel (Theme / Language / Notifications / Security) duplicating the **Appearance** + **App Settings** sections of `Settings.tsx` — and writing to orphan keys (`nexora_theme`, `nexora_language`) that nothing reads, so the controls appeared to work but changed nothing. The real ones write to `ThemeContext` / `LanguageContext`. | Replaced with a single deep-link to Settings; removed 4 modals + 9 dead state vars. **1,683 → 1,215 lines.** |
| `src/screens/Marketing.tsx` | A 90-line "Blueprint Detail Modal" whose guard excluded **all seven** module ids handled above it — unreachable. Its two buttons only closed the modal. | Removed. |
| `src/screens/InstallApp.tsx` | The "Incompatible Browser" banner rendered twice; the copies had drifted (one had a "PWA Blocked" badge, the other didn't). | Extracted `<IncompatibleBrowserNotice showBadge />`. |
| `src/App.tsx` routes | `'staff-payroll-detail'` **and** `'staff-payroll-breakdown'` both rendered `<PayrollBreakdown />`; `'revenue-analytics'` **and** `'analytics'` both rendered `<RevenueAnalytics />`. | Removed the two redundant aliases from `types.ts`, `VALID_SCREENS`, `PREVIEW_SCREEN_MAP` and the switch. |
| `src/screens/Profile.tsx` | 5 near-identical modal shells (`fixed inset-0 … bg-black/40 backdrop-blur-xs` + `motion.div` + close button) | Still present — see §5.1 |
| `RolesAccessControl.tsx` / `StaffPerformance.tsx` | Identical 8-line page header block, copy-pasted | Still present — see §5.1 |

### 2.3 Documentation (12 root reports → `docs/`)

The repo root carried 2,732 lines of overlapping markdown. Six were superseded
point-in-time reports (moved to `docs/archive/`, flagged as historical); six
were still-relevant references (moved to `docs/`). Cross-references were
rewritten. A fresh root has **zero** markdown files now.

---

## 3. CRITICAL BUGS — fixed in this pass

### 3.1 🔴 Offline mode was cosmetic and silently discarded data

Three independent defects stacked into total data loss:

1. **`public/sw.js` never ran.** `vite.config.ts` used `generateSW`, which writes
   its own `dist/sw.js` at build time, overwriting the copied `public/sw.js`.
   Verified: the built `dist/sw.js` contained **0** `sync` handlers.
2. **So `registration.sync.register('sync-supabase')` queued a tag nobody
   listened for.** Queued bookings/clients were written to IndexedDB and then
   left there forever.
3. **`OfflineSyncContext.triggerSync()` was a 2.2-second `setTimeout`** that
   then marked everything "complete" (`// Simulate background network
   synchronization`). The badge showed "Synced ✓" while nothing had been
   written. Its `pendingActions` even defaulted to two hard-coded strings, so a
   fresh install **always claimed 2 pending changes**.

**Fix:**

- New `src/lib/offlineReplay.ts` — a schema-correct replay engine. Payloads are
  normalised to the real columns of `public.bookings` / `public.customers`
  before insert. Failures stay queued with an attempt counter and last error;
  structurally invalid payloads are surfaced as `rejected` instead of retrying
  forever.
- `OfflineSyncContext` rewritten to read the **real** IndexedDB queue, drain it
  through Supabase on `triggerSync()`, and auto-drain when connectivity returns.
- `vite.config.ts` switched to `strategies: 'injectManifest'` with
  `src/sw.ts` as the service-worker source, so Background Sync actually ships.
  Verified: `dist/sw.js` now contains the `sync-supabase` handler.
- `NewAppointment.tsx` de-mocked: it previously enqueued
  `{ client_id, service_id: 'haircut-1', staff_id: 'staff-1', appointment_time }`
  — **none of which are columns**. It now loads the real salon + customers and
  enqueues `salon_id`, `customer_name`, `customer_phone`,
  `appointment_start`, `appointment_end`.
- 16 new unit tests (24 → 40 total) cover normalisation, retry, rejection and
  the "client cannot be constructed" path.

### 3.2 🔴 Eight staff screens were unreachable from the UI

`StaffSchedule`, `StaffAttendance`, `LeaveShiftSwap`, `PayrollBreakdown`,
`RolesAccessControl`, `StaffPerformance`, `StaffSelfService` and
`StaffWebsiteBooking` — **~4,400 lines** — were fully built and routed in
`App.tsx`, but nothing in the app ever navigated to them. They could only be
opened by hand-typing `?screen=staff-schedule` into the URL, and several still
boot from demo data (`getDemoStaff()`, `demoEvents()`).

**Fix:** added a **Staff Workspace** grid to `StaffManagement.tsx` — the staff
hub that *is* reachable from the Dashboard quick action and from Settings —
with an entry point for each screen (Schedule, Attendance, Leave & Shift Swap,
Payroll, Roles & Access, Performance, Self Service, Website Booking). Also
wired `NearbySalons` (previously 100% unreachable) into Settings, and added a
back button to `StaffManagement`, which had **no** navigation chrome at all.

⚠️ These screens are now reachable but several still run on mock data. See §5.2.

---

## 4. MISSING ITEMS & GAPS (not fixed — needs decisions)

### 4.1 🔴 Database: 6 tables queried by the app do not exist

Code reads these; **no** `CREATE TABLE` exists anywhere in `supabase/`:

| Table | Queried from | Consequence |
|-------|--------------|-------------|
| `staff_schedules` | `staffRepository.ts` (5×) | Staff Schedule screen queries a non-existent table |
| `wallet_transactions` | `shopRepository.ts` | Wallet screen has no data source |
| `owner_payouts` | `shopRepository.ts` | Payments tab has no data source |
| `reviews` | `staffRepository.ts` | Staff ratings have no source |
| `offers` | `shopRepository.ts` | Offers CRUD (`listOffers`/`createOffer`) targets a missing table |
| `profiles` | `Profile.tsx`, `Login` | Owner profile read fails silently |

### 4.2 🔴 Migrations cannot run in filename order

`supabase/migrations/` contains, in lexicographic (i.e. execution) order:

```
20260809_staff_management_phase1.sql   ← REFERENCES public.salons, public.services
20260809_…phase2..5.sql
20260810_location_fields.sql           ← ALTER TABLE public.salons
20260810_onboarding_progress.sql
20260825_user_live_locations.sql
20260829_base_schema_core_tables.sql   ← actually CREATES salons, services…
```

The **base schema is dated last**. A fresh `supabase db push` runs the staff
phases first; `phase1` declares `FOREIGN KEY (business_id) REFERENCES
public.salons(id)` before `salons` exists → **fresh install fails**.

`supabase/README.md` documents the correct manual order but it contradicts the
filenames, and its commands use the wrong path (`supabase/2026….sql` instead of
`supabase/migrations/2026….sql`).

Also redundant: `20260810_location_fields.sql` adds columns that
`20260829_base_schema_core_tables.sql` already defines inline.

### 4.3 🟠 Dead backend surface

- **`api/bookings`, `api/customers`, `api/services`, `api/staff`** — 1,638 lines
  of Vercel serverless handlers. **No client code calls them** (the app talks to
  Supabase directly via RLS) and `server.ts` only mounts the Razorpay + auth
  routes. They are live, deployed, unauthenticated endpoints over your data.
- **`staffRepository.ts`** — 44 of 67 exported functions have zero callers
  (`createShift`, `clockIn`, `processPayroll`, `settlePayroll`, …).
- **`shopRepository.ts`** — 7 unused exports (`listOffers`, `createOffer`,
  `saveHours`, `deleteStaff`, `updateService`, `requestPublish`,
  `validateSalonForPublish`).
- **`src/hooks/useNearbySalons.ts`** + `src/components/…` — `useNearbySalons`
  is now used only by `NearbySalons.tsx` (wired this pass).

### 4.4 🟠 Profile screen does not persist to the database

`src/screens/Profile.tsx` keeps the **entire business profile** — business name,
category, phone, description, GST number, address, city, area, zone, landmark,
PIN, logo, opening hours — in **localStorage** (`nexora_business_*`, 82
reads/writes), seeded with hard-coded demo values (`'Suman Gupta'`,
`'suman.g@nexora.app'`, `'+91 98765 43210'`).

Meanwhile `WebsiteBuilder`, `ShopLocation` and `Dashboard` all read the same
concept from the `salons` table. **The two can never agree**, and the profile
does not follow the owner across devices. `shopRepository.updateShopProfile()`
already exists and is partially wired — the screen should use it.

### 4.5 🟠 Navigation chrome is inconsistent

26 of 41 screens do not use the shared `Layout`/`TopBar`/`BottomNav`, so the
bottom nav simply disappears on Bookings, Customers, Staff Management, Payroll
and every staff sub-screen. Several (e.g. `StaffManagement`, `Bookings`) had no
back affordance at all apart from the browser button. Fixed for
`StaffManagement`; the rest are outstanding.

### 4.6 🟠 Security hygiene

| Issue | Location |
|-------|----------|
| Hard-coded Supabase anon key committed | `server.ts:37`, `api/auth/login.ts:3`, `api/auth/signup.ts:3` |
| Production project URL committed | `.env.example` |
| `any` casts | 132 occurrences in `src/` |
| `console.*` in shipped code | 96 occurrences (12 are the location logger) |
| No secret scanning / dependency audit in CI | — |

The anon key is public by design and RLS is the real boundary, but hard-coding
it means **rotating the key requires a code change and redeploy**.

### 4.7 🟠 Quality tooling missing

- **No ESLint or Prettier config** — `npm run lint` is just `tsc --noEmit`,
  which does not even check for unused imports (`noUnusedLocals` is off; turning
  it on reports 100+ unused imports across `CustomerProfile.tsx`,
  `Marketing.tsx`, …).
- **No CI.** `docs/e2e-audit-workflow.yml` exists but was never installed to
  `.github/workflows/` (the header explains the App lacked the `workflows`
  permission). So there is no automated gate on `main`.
- **Test coverage is thin:** 40 tests, all against `src/lib/*` and one landing
  component. Zero tests for any screen, repository, hook or the offline IndexedDB
  layer's real I/O.

### 4.8 🟠 Accessibility

| Metric | Value |
|--------|-------|
| `<button>` elements | 906 |
| `aria-label` attributes | 31 |
| `<img>` elements | 82 |
| `<img>` without `alt` | 43 |
| `role=` attributes | 4 |

Icon-only buttons (close, back, more) are largely unlabelled, and many
interactive elements are `<div onClick>` rather than `<button>` — not keyboard
reachable and not announced as controls.

### 4.9 🟡 Feature gaps (versus a typical salon-management product)

Not present anywhere in the codebase:

- **Inventory / retail products** — no table, no screen
- **Expense tracking** — P&L is impossible today
- **Invoicing / receipts** — a checkout modal exists in `Bookings.tsx` but no
  invoice record or PDF export
- **Point of sale** — no walk-in billing flow
- **Notification centre** — `notifications.ts` + a Settings toggle exist, but
  there is no inbox or scheduled-reminder engine
- **Multi-location / branch support** — schema is one salon per organization
- **Customer-facing booking app** — `CustomerBookingPreview.tsx` lives inside the
  website builder only; there is no standalone customer surface
- **Staff-facing login** — `StaffSelfService` exists but there is no staff auth
  role flow feeding it
- **Audit trail** — `staff_audit_logs` exists, but nothing writes to it

### 4.10 🟡 `RoleConflict.tsx` is an unreachable mock

126 lines with `const existingRole = "Customer";` hard-coded and no
role-conflict detection anywhere in the auth flow. Nothing navigates to it.

---

## 5. Recommended next steps (priority order)

1. **Add the 6 missing tables** (§4.1) and **renumber the migrations** so the
   base schema sorts first (§4.2). Fix the README paths. Nothing else on this
   list matters until a fresh install works.
2. **Replace mock data in the newly-wired staff screens** (§3.2) —
   `StaffSchedule`, `StaffAttendance` and `LeaveShiftSwap` boot from
   `getDemoStaff()` / `demoEvents()`, so they now look real but are not.
3. **Move Profile.tsx onto `shopRepository.updateShopProfile`** (§4.4) and drop
   the 40 `nexora_business_*` localStorage keys.
4. **Delete or secure `api/{bookings,customers,services,staff}`** (§4.3).
5. **Add ESLint + Prettier + a GitHub Actions gate** (tsc, vitest, build) (§4.7).
6. **Adopt `Layout` on the remaining 25 screens** (§4.5).

### 5.1 Deferred dedupes (safe, mechanical, not done to limit blast radius)

- Extract a shared `<Modal>` from the 5 duplicated shells in `Profile.tsx` and
  the 2 in `Settings.tsx`.
- Extract the duplicated page header used by `RolesAccessControl`,
  `StaffPerformance`, `StaffDetail`, `StaffSchedule`, `StaffAttendance`,
  `LeaveShiftSwap`, `PayrollBreakdown` and `StaffSelfService` (all 8 copy the
  same `fixed inset-x-0 top-0 z-50 … max-w-4xl` header with an arrow back
  button). This would remove ~250 lines and unify the back-navigation
  behaviour.
- Enable `noUnusedLocals` and delete the ~100 unused imports it reports.

### 5.2 Known-risk note on the newly reachable screens

Wiring these screens made previously-hidden code visible. Before release,
confirm which of them read real Supabase data:

| Screen | Data source |
|--------|-------------|
| `StaffManagement`, `StaffDetail`, `StaffPerformance`, `StaffWebsiteBooking` | ✅ Supabase (`staffRepository`) |
| `PayrollEarnings`, `PayrollBreakdown` | ⚠️ Partially Supabase + `localStorage` settlements |
| `StaffSchedule` | 🔴 Demo data (`getDemoStaff`, `demoEvents`, `getStoredSwaps`) |
| `StaffAttendance`, `LeaveShiftSwap` | 🔴 Local/mock state |
| `RolesAccessControl`, `StaffSelfService` | 🔴 Local state |
