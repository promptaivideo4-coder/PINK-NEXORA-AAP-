# FINAL QA REPORT — SHOP LOCATION SYSTEM

## A. FILES CHANGED

| File | Change |
|------|--------|
| `src/lib/geocodingService.ts` | Added `inflight` Map + `withInflight()` wrapper around all three provider methods (`autocomplete`, `forwardGeocode`, `reverseGeocode`). Keys normalized to lowercase for autocomplete/forward. Entry deleted in `.finally()` on both success and failure paths. |
| `src/components/ShopLocationPicker.tsx` | (previous audit) Race-condition protection, duplicate-save guard, address overwrite fix, fullAddress in confirmed interface |
| `src/screens/Settings.tsx` | (previous audit) Expanded `shopLoc` state, pass full location to picker |
| `src/lib/razorpay.ts` | (previous audit) Removed `RAZORPAY_KEY_SECRET` export |

---

## B. INFLIGHT DEDUPLICATION IMPLEMENTATION DETAILS

```typescript
const inflight = new Map<string, Promise<any>>();

function withInflight<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;  // ← reuse in-flight promise
  
  const promise = factory().finally(() => {
    inflight.delete(key);  // ← cleanup on BOTH success and failure
  });
  
  inflight.set(key, promise);
  return promise;
}
```

**Keys used:**
- Autocomplete: `nominatim:autocomplete:${query.toLowerCase()}`
- Forward geocode: `nominatim:forward:${address.toLowerCase()}`
- Reverse geocode: `nominatim:reverse:${lat.toFixed(4)},${lng.toFixed(4)}`

**Layers of request reduction (in order):**
1. **Debounce** (300ms, UI layer) — prevents rapid-fire calls from typing
2. **Latest-query rejection** (UI layer) — stale responses discarded
3. **Cache hit** (memory + localStorage, 24h TTL) — skips HTTP entirely
4. **Inflight dedup** (provider layer) — reuses pending Promise for same key
5. **Reverse-geocode stale rejection** (UI layer) — position moved during fetch

These are independent and composable. A single user typing "Mumbai" triggers exactly 1 HTTP call (after debounce settles).

---

## C. SECURITY AUDIT RESULT

**Status: CLEAN**

| Check | Result |
|-------|--------|
| No `_SECRET` variables imported into frontend | ✅ PASS |
| No `RAZORPAY_KEY_SECRET` in frontend bundle | ✅ FIXED (removed in prior commit) |
| No service-role Supabase key in frontend | ✅ PASS |
| No private API keys hardcoded | ✅ PASS |
| Only `VITE_*` public env vars exposed | ✅ PASS |
| RLS policies unchanged | ✅ PASS |
| Authentication/authorization untouched | ✅ PASS |
| Existing RPC ownership verification intact | ✅ PASS (`auth.uid()` → `organization_members` → `role='owner'`) |
| RPC revoked from public, granted to authenticated only | ✅ PASS |

---

## D. DATABASE / SCHEMA CONFIRMATION

**ZERO changes.**

- No migrations added
- No `ALTER TABLE`
- No new columns
- No new tables
- No RLS bypass
- Uses only existing `salons` columns: `latitude`, `longitude`, `location_address`, `location_city`, `location_area`, `location_zone`, `location_landmark`, `location_pincode`, `location_accuracy_m`, `location_source`, `location_confirmed`, `location_confirmed_at`
- Uses existing RPC `update_shop_location`

---

## E. PROVIDER LIMITATION

**Current provider: Nominatim (OpenStreetMap)**

**NOT APPROVED FOR PRODUCTION** under expected traffic volumes because:
- Nominatim ToS: max 1 request/second
- Nominatim ToS: no "heavy use" as primary production autocomplete
- Nominatim has no SLA; downtime is possible
- No attribution mechanism in code yet (would need to display "© OpenStreetMap contributors")

**Architecture supports swap:** change `PROVIDER` in `src/lib/geocodingConfig.ts` to `'mapbox'`, `'google'`, `'opencage'`, or `'here'` and add `VITE_GEOCODING_API_KEY` to environment. Provider interface is stable; UI requires no changes.

---

## F. STATIC VERIFICATION RESULT

| Test | Status | Evidence |
|------|--------|----------|
| Address search (code path) | ✅ Code exists | `debouncedGeocode` → `geocodingService.autocomplete` → `NominatimProvider.autocomplete` → Nominatim HTTP |
| Address selection (code path) | ✅ Code exists | `handleSelectSuggestion` → `setLat/setLng` → `leafletRef.setView` + `markerRef.setLatLng` + address field updates |
| Pin automatically moves | ✅ Code exists | `markerRef.current.setLatLng([newLat, newLng])` + `leafletRef.current.setView([newLat, newLng], 16)` |
| Address fields populate | ✅ Code exists | `setAddress`, `setArea`, `setCity`, `setZone`, `setPincode`, `setLandmark` calls from structured address |
| Pin drag | ✅ Code exists | `marker.on('dragend', ...)` with `setLat/setLng` + `reverseGeocodeAt` |
| Reverse geocoding | ✅ Code exists | `reverseGeocodeAt` calls `geocodingService.reverseGeocode` with stale-response rejection |
| GPS | ✅ Code exists | `useDeviceLocation` → `requestLocation()` → `applyFix` → `setLat/setLng` + `reverseGeocodeAt` |
| Accuracy display | ✅ Code exists | `gpsAccuracy` state displayed when not null; warning shown when `> GOOD_ACCURACY_M` |
| Confirm modal | ✅ Code exists | `setConfirmOpen(true)` gated by `isValidLatLng(lat, lng)` |
| Cancel | ✅ Code exists | `setConfirmOpen(false)` in Cancel button |
| Save Shop Location | ✅ Code exists | `handleSaveShopLocation` → `onSave({confirmed: true, confirmedAt: ISO})` |
| Supabase persistence | ✅ Code verified | `handleSaveLocation` in Settings.tsx → `updateShopLocation` in shopRepository → RPC `update_shop_location` → `public.salons` update |
| Reload persistence | ✅ Code verified | `fetchMyShop()` on Settings mount → `setShopLoc` with all fields → picker `useEffect` moves marker |
| Location Set indicator | ✅ Code exists | `locationSet` boolean derived from `shopLoc` lat/lng; badge shown |
| Mobile usability | ⚠️ Code paths exist | Responsive CSS, Leaflet touch events; no device verification |
| Network/API failure | ✅ Code verified | `catch` blocks in all three service methods; UI shows empty/unchanged state |
| Inflight deduplication | ✅ Code exists | `withInflight()` wrapper + `inflight` Map + `.finally()` cleanup |
| Duplicate-save prevention | ✅ Code exists | `if (saving) return` guard + `disabled={saving}` on button |
| No schema changes | ✅ Verified | Zero migrations, zero ALTER TABLE |
| No hardcoded secrets | ✅ Verified | `apiKey: import.meta.env.VITE_GEOCODING_API_KEY`; no RAZORPAY_KEY_SECRET in bundle |
| RLS preserved | ✅ Verified | RPC signature, revoke, owner verification intact |

---

## G. MANUAL TEST CHECKLIST

All items below **REQUIRE manual browser/device verification** (not performable in this environment):

- [ ] Address autocomplete shows suggestions
- [ ] Selecting a suggestion moves pin and populates fields
- [ ] Pin drag updates coordinates and reverse-geocodes
- [ ] GPS button drops pin at current location
- [ ] Confirm Location modal opens with correct data
- [ ] Cancel closes modal without saving
- [ ] Save Shop Location persists to Supabase
- [ ] Reload shows saved location
- [ ] Location Set indicator visible after save
- [ ] Mobile: type, drag, save works
- [ ] Network failure: no crash, graceful degradation
- [ ] Slow Nominatim: inflight dedup prevents duplicate requests

---

## H. FINAL DEPLOYMENT STATUS

# READY FOR MANUAL QA

**Rationale:** All code-level blockers identified in the audit have been addressed. The implementation is structurally sound, secure, and architecturally clean. No further code changes are needed before manual browser/device verification.

**Blockers that WOULD prevent deployment (none present):**
- ~~Hardcoded secrets in frontend~~ → FIXED
- ~~Inflight deduplication missing~~ → FIXED
- ~~Address overwrite bug~~ → FIXED
- ~~Reload lost zone/landmark~~ → FIXED

**Remaining items before production deployment:**
1. Run the manual test checklist (section G)
2. If Nominatim traffic exceeds 1 req/sec, switch to Mapbox/Google
3. Add attribution text per Nominatim ToS ("© OpenStreetMap contributors")
4. Consider adding integration tests for the save flow

**DO NOT DEPLOY until manual QA passes.**
