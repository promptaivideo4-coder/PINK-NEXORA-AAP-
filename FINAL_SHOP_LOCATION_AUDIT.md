# FINAL SHOP LOCATION AUDIT & TEST REPORT

## Audit Date
Static code audit with targeted runtime verification (no browser session available).

## Rules Followed
- No deployment
- No database migrations
- No schema alterations
- No RLS bypasses
- No Google/Mapbox/HERE added
- No secret API keys in frontend
- No claimed PASS without evidence

---

## A. FILES CHANGED

| File | Change | Reason |
|------|--------|--------|
| `src/components/ShopLocationPicker.tsx` | Race-condition protection, duplicate-save guard, fix address overwrite bug | Autocomplete results could overwrite address; stale reverse geocode could overwrite newer data |
| `src/screens/Settings.tsx` | Expanded `shopLoc` state, pass full location to picker | `zone`, `landmark`, `accuracyM`, `source`, `confirmed` were lost on reopen |
| `src/lib/razorpay.ts` | Removed `RAZORPAY_KEY_SECRET` export | SECURITY: secret must never be in frontend bundle |

---

## B. TESTS PERFORMED

### Static Code Audit (completed)
- Grep for hardcoded secrets
- Verify provider abstraction exists in code
- Verify cache implementation exists
- Verify debounce exists
- Verify RLS policies
- Verify RPC signature and columns
- Verify save flow from UI → Settings → shopRepository → RPC
- Verify reload flow from Supabase → Settings → picker
- Verify no schema changes
- Verify `inflight` request deduplication

### Runtime (NOT performed)
- No browser session available in this environment
- No live Supabase connection
- No actual HTTP calls to Nominatim
- No Leaflet DOM rendering

---

## C. VERIFICATION TABLE

| # | Test | Status | Evidence |
|---|------|--------|----------|
| 1 | Address search (autocomplete UI renders) | **NOT VERIFIED — REQUIRES MANUAL TEST** | UI code exists; no browser to test render |
| 2 | Address search (Nominatim returns results) | **NOT VERIFIED — REQUIRES MANUAL TEST** | Depends on live Nominatim API |
| 3 | Address selection updates UI | **NOT VERIFIED — REQUIRES MANUAL TEST** | Requires click interaction |
| 4 | Address → coordinates (forward geocode) | **NOT VERIFIED — REQUIRES MANUAL TEST** | Requires live API call |
| 5 | Automatic pin movement | **NOT VERIFIED — REQUIRES MANUAL TEST** | Requires Leaflet DOM + live coords |
| 6 | Pin drag | **NOT VERIFIED — REQUIRES MANUAL TEST** | Requires Leaflet DOM + drag events |
| 7 | Reverse geocoding | **NOT VERIFIED — REQUIRES MANUAL TEST** | Requires live BigDataCloud/Nominatim |
| 8 | GPS (use current location) | **NOT VERIFIED — REQUIRES MANUAL TEST** | Requires real device GPS |
| 9 | GPS accuracy handling | **PASS** | Code checks `accuracy > GOOD_ACCURACY_M` and sets warning; never blocks save |
| 10 | Confirm modal shows | **NOT VERIFIED — REQUIRES MANUAL TEST** | Requires button click |
| 11 | Confirm modal validates coords | **PASS** | `isValidLatLng()` called; rejects out-of-range or non-finite |
| 12 | Supabase save (RPC call) | **PASS (by code audit)** | `update_shop_location` RPC invoked with all 12 params; no schema changes; RLS intact |
| 13 | RLS / security | **PASS (by code audit)** | RPC is `security definer`, revoked from public, verifies owner via `organization_members`, uses `auth.uid()` |
| 14 | Reload persistence | **PASS (by code audit)** | Settings.tsx calls `fetchMyShop()` on mount and after save; passes lat/lng to picker; picker moves marker in `useEffect` |
| 15 | Error handling (address fail) | **PASS (by code audit)** | `catch` blocks exist; `setSuggestions([])` on failure; user can still pick manually |
| 16 | Error handling (geocoding fail) | **PASS (by code audit)** | `catch` blocks exist; fallback to BigDataCloud; no crash path |
| 17 | Error handling (GPS fail) | **PASS (by code audit)** | Error callback sets `locationStatus='error'`; user can still pick manually |
| 18 | Error handling (save fail) | **PASS (by code audit)** | `res.ok` check; `setSaveError()`; modal stays open; user can retry |
| 19 | Error handling (network loss) | **NOT VERIFIED — REQUIRES MANUAL TEST** | Cache may serve stale; fetch will fail; no offline UI indicator |
| 20 | Duplicate save prevention | **PASS** | `saving` flag check at top of `handleSaveShopLocation` |
| 21 | Debounce | **PASS** | 300ms debounce via `debounce()` wrapper; latest-query rejection |
| 22 | Cache | **PASS** | `GeocodingCache` class with memory + localStorage; 24h TTL |
| 23 | Inflight deduplication | **FAIL (partial)** | Cache helps but no `inflight` Map for concurrent same-query dedup. See section H. |
| 24 | Provider abstraction | **PASS** | `GeocodingService` interface, `NominatimProvider` implementation, config in `geocodingConfig.ts` |
| 25 | Mobile usability | **NOT VERIFIED — REQUIRES MANUAL TEST** | Responsive CSS exists; touch events untested |
| 26 | Pin draggable on mobile | **NOT VERIFIED — REQUIRES MANUAL TEST** | Leaflet handles touch; untested |
| 27 | Loading indicators | **PASS** | `isGeocoding`, `geocoding`, `saving` states drive spinners |
| 28 | Buttons disabled during save | **PASS** | `disabled={saving}` on Save button; early return on `if (saving)` |
| 29 | Modal closes only on success | **PASS** | `setConfirmOpen(false)` only in `if (res.ok)` branch |
| 30 | Success only after confirmed DB success | **PASS** | `setSavedMsg` only after `res.ok` |
| 31 | Address field gets FULL address (not just shop number) | **PASS (fixed)** | Previous bug where `setAddress(houseNumber)` overwrote full address is fixed |
| 32 | Zone/landmark preserved on reopen | **PASS (fixed)** | `shopLoc` state now includes `zone`, `landmark`, `locationAccuracyM`, `locationSource` |
| 33 | No hardcoded API keys | **PASS** | `apiKey: import.meta.env.VITE_GEOCODING_API_KEY` |
| 34 | No secret keys in frontend bundle | **PASS (fixed)** | `RAZORPAY_KEY_SECRET` removed from export |
| 35 | No service_role key | **PASS** | Confirmed — not present anywhere |

---

## D. DATABASE / SCHEMA CHANGES

**NONE.** Zero migrations. Zero ALTER TABLE. Zero new columns. Zero new tables. Zero RLS changes.

---

## E. SECURITY FINDINGS

### Critical (fixed in this audit)

1. **`RAZORPAY_KEY_SECRET` was exported from frontend bundle** — FIXED. Removed from `src/lib/razorpay.ts`. The secret is server-only; only `KEY_ID` (public) is needed for checkout.js.

### Verified secure

2. No other hardcoded secrets.
3. All geocoding API keys read from `import.meta.env.VITE_GEOCODING_API_KEY`.
4. RPC is `security definer` but internally verifies `auth.uid()` against `organization_members`.
5. RPC is `revoke from public` / `grant execute to authenticated`.
6. User can only update salons where they are an active owner.
7. No SQL injection vectors (Supabase client, parameterized RPC).
8. No `service_role` key in frontend code.

### Limitation

9. Nominatim public API is called from the browser. Nominatim's usage policy states this is acceptable for "light" usage but discourages heavy production autocomplete. No secret leakage (Nominatim doesn't require auth).

---

## F. PROVIDER LIMITATIONS

### Nominatim (current provider)

**Pros:**
- Free, no API key
- CORS-enabled
- Good address coverage in India

**Hard limitations (Nominatim policy, not code):**
- **1 request/second** rate limit
- **No heavy/continuous use** — their ToS explicitly forbids using it as a primary production autocomplete for high-traffic apps
- **No SLA** — downtime is possible
- **Attribution required** — "© OpenStreetMap contributors"

**What this means for "production-ready":**
The code architecture IS production-ready (provider abstraction exists). But with Nominatim as the active provider, it is **NOT production-ready for production traffic volumes**. To go production:

1. Switch `PROVIDER` in `src/lib/geocodingConfig.ts` to `'mapbox'`, `'google'`, `'opencage'`, or `'here'`
2. Add the API key to environment: `VITE_GEOCODING_API_KEY=<key>`
3. Implement the corresponding provider class (skeleton ready in `geocodingService.ts`)

Until that switch is made, the Nominatim provider should be considered **development/testing only**.

---

## G. REMAINING ISSUES

### Functional

1. **No `inflight` Map in `geocodingService.ts`** — Cache prevents repeat queries, but doesn't deduplicate concurrent in-flight requests for the same query. If two components call `autocomplete("Mumbai")` simultaneously before the first resolves, both hit Nominatim. Low practical risk due to UI debounce, but the architecture claim is slightly overstated.

2. **`fullAddress` interface field unused in save flow** — `ConfirmedShopLocation.fullAddress` exists but the save function (`updateShopLocation`) only maps `loc.address`. This is fine because `address` now correctly holds the full address (bug fixed), but the redundant field is dead code.

3. **No offline indicator for map** — If user loses network while editing, the picker doesn't show a clear "offline" state. Map tiles fail silently; autocomplete fails with empty results (handled).

4. **Settings.tsx reads `shop.address` (maps to `location_address`)** but the column could be null if the shop was created before location feature. `?? null` handles it; pin just won't move.

### Documentation

5. **No automated tests** — Only manual verification paths documented. No Jest/Vitest test files exist for this feature.

---

## H. WHETHER GENUINELY PRODUCTION-READY

### Honest verdict: **ARCHITECTURE yes, DEPLOYMENT no — not yet**

**What IS production-ready:**
- Provider abstraction layer (clean swap without UI changes)
- Cache layer with TTL
- Debouncing
- Race-condition protection (latestPositionRef, latestQueryRef)
- RLS-preserving save path
- Error handling structure
- Type safety

**What is NOT yet production-ready:**
- Nominatim as the active provider (ToS violation at scale)
- No live verification that the end-to-end flow works
- No integration tests
- No load testing

**What would make it production-ready:**
1. Switch provider to Mapbox or Google (5 minutes of config + implementation)
2. Manual browser test of the full flow
3. Add integration tests for the save flow
4. Add offline UI indicators

---

## I. MANUAL TEST SCRIPT (for the next human)

Run these in order on a real device:

1. Open Settings → click "Edit Location"
2. Type "Bandra West, Mumbai" in address input
3. **Verify:** suggestions dropdown appears within ~1s
4. **Verify:** select top result; map pin moves to Mumbai
5. **Verify:** address, city, area, pincode fields populate
6. **Drag** the pin to a nearby street
7. **Verify:** coordinates update; reverse geocode populates address
8. Click "Use Current Location"
9. **Verify:** pin moves to your location
10. Click "Confirm Location"
11. **Verify:** modal opens with address + coords + source
12. Click "Cancel"
13. **Verify:** modal closes; no save happened
14. Click "Confirm Location" again, then "Save Shop Location"
15. **Verify:** loading spinner; success toast; modal closes
16. **Reload the page**
17. **Verify:** Settings shows "Location set"
18. **Open Edit Location again**
19. **Verify:** pin is at saved coordinates
20. **Verify:** address fields contain saved values
21. Test on mobile — drag pin, type address
22. Turn off WiFi; try to search address
23. **Verify:** shows empty results; user can still drag pin

---

## J. CHANGES IN THIS AUDIT

```
src/components/ShopLocationPicker.tsx   - 5 fixes (race, duplicate-save, address overwrite, fullAddress in confirmed)
src/screens/Settings.tsx                - 3 fixes (full shopLoc state, full confirmed prop)
src/lib/razorpay.ts                     - 1 security fix (remove KEY_SECRET export)
```

**Do NOT deploy until Nominatim is replaced with a production provider OR traffic is expected to be light (< 1 req/sec).**
