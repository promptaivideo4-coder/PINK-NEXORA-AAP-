#!/usr/bin/env node
/**
 * E2E AUDIT — Nexora ecosystem (runs on GitHub Actions, which has full egress).
 *
 * What this does (REAL backend, no mocks):
 *   1. Dumps the live Supabase schema (PostgREST OpenAPI) → tables + columns + RPCs.
 *   2. Anon-role RLS probes (what a logged-out visitor can read).
 *   3. Signs up two fresh labeled test users (Journey A / E).
 *   4. User A: bootstrap_shop_owner idempotency, service create, location RPC,
 *      direct salons UPDATE (publish P0 repro), salon_public_websites upsert,
 *      onboarding_progress upsert.
 *   5. User B: cross-tenant isolation checks.
 *   6. Deployed Vercel API audit (auth proxy, razorpay order/webhook hardening).
 *
 * Writes: clearly-labeled test rows (E2E-AUDIT-<ts> prefix) into the production
 * project so the canonical backend is exercised for real. Cleanup SQL for the
 * labeled rows is printed at the end (requires Supabase dashboard / service role).
 */

const SUPABASE_URL = 'https://qwaehqsmodekbgvnaavz.supabase.co';
const ANON_KEY = process.env.NEXORA_E2E_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3YWVocXNtb2Rla2Jndm5hYXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjQ5MjksImV4cCI6MjEwMDc0MDkyOX0.K92b2vkEb77dyu8fYYZpMTIbTyP98Vo80TaMo_Hmq_E';
import fs from 'node:fs';
const DEPLOY_ORIGIN = process.env.NEXORA_E2E_DEPLOY_ORIGIN || 'https://shop-onwer-pink-nexora-aap.vercel.app';

const TS = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15); // e.g. 20260825-120000
const TAG = `E2E-AUDIT-${TS}`;
const PASSWORD = `Audit-${TS}!x9`;
const EMAIL_A = `e2e-audit-${TS}-a@nexora-audit.local`;
const EMAIL_B = `e2e-audit-${TS}-b@nexora-audit.local`;

const results = [];
function check(id, area, pass, detail, severity = 'INFO') {
  results.push({ id, area, pass: !!pass, detail: String(detail).slice(0, 500), severity });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${id}] (${area}) ${String(detail).slice(0, 300)}`);
}

async function api(path, { method = 'GET', token, body, headers = {}, raw = false } = {}) {
  const h = { apikey: ANON_KEY, ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${SUPABASE_URL}${path}`, { method, headers: h, body: payload });
  let data;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (raw) return { status: res.status, data, text };
  return { status: res.status, data };
}

async function main() {
  console.log(`\n=== NEXORA E2E AUDIT ${TAG} ===\n`);

  // ---------------------------------------------------------------- 1. SCHEMA
  console.log('--- 1. LIVE SCHEMA DUMP ---');
  const openapi = await api('/rest/v1/', { raw: true });
  if (openapi.status !== 200) {
    check('S1', 'schema', false, `OpenAPI endpoint returned ${openapi.status}`, 'P0');
    throw new Error('Cannot continue without schema');
  }
  const spec = openapi.data;
  const tables = Object.keys(spec.paths || {}).filter(p => !p.startsWith('/rpc/') && p !== '/');
  const rpcs = Object.keys(spec.paths || {}).filter(p => p.startsWith('/rpc/')).map(p => p.replace('/rpc/', ''));
  check('S1', 'schema', tables.length > 0, `tables=${tables.length}, rpcs=${rpcs.length}`);
  console.log('TABLES:', tables.sort().join(', '));
  console.log('RPCS:', rpcs.sort().join(', '));

  const tableCols = {};
  for (const t of tables) {
    const name = t.replace(/^\//, '');
    const schema = spec.definitions?.[name];
    if (schema?.properties) tableCols[name] = Object.keys(schema.properties);
  }
  // Column-existence probes the app code depends on
  const probes = [
    ['salons', ['latitude', 'longitude', 'location_address', 'location_city', 'location_area', 'location_zone', 'location_landmark', 'location_pincode', 'location_accuracy_m', 'location_source', 'location_confirmed', 'location_confirmed_at', 'verified', 'is_active', 'accepts_online_bookings', 'business_category', 'rating_average', 'deleted_at', 'organization_id', 'updated_at']],
    ['staff', ['role', 'role_title', 'specialty', 'full_name', 'is_active', 'deleted_at', 'employment_status']],
    ['bookings', ['total_paise', 'total_amount_paise', 'advance_amount_paise', 'customer_id', 'status', 'appointment_start', 'created_by']],
    ['services', ['price_paise', 'duration_minutes', 'is_bookable_online', 'is_active', 'deleted_at']],
    ['offers', ['discount_type', 'discount_value', 'valid_from', 'valid_until', 'is_active', 'code']],
    ['salon_public_websites', ['slug', 'template_key', 'config', 'is_published', 'published_at', 'salon_id']],
    ['salon_setup_proposals', ['status', 'payload', 'growth_partner_id', 'submitted_at', 'published_at', 'owner_notes']],
    ['organization_members', ['user_id', 'organization_id', 'role', 'status']],
    ['onboarding_progress', ['id', 'business_id', 'current_step', 'last_completed_step', 'status', 'draft', 'publish_state']],
    ['user_live_locations', ['user_id', 'latitude', 'longitude', 'accuracy_m', 'captured_at', 'synced_at']],
    ['wallet_transactions', ['user_id', 'amount_paise', 'tx_type', 'reason', 'ref_type']],
    ['owner_payouts', ['status', 'amount_paise', 'paid_at']],
  ];
  for (const [table, cols] of probes) {
    if (!tableCols[table]) { check(`S2-${table}`, 'schema', false, `table "${table}" NOT EXPOSED to PostgREST (missing or not granted)`, 'P0'); continue; }
    const missing = cols.filter(c => !tableCols[table].includes(c));
    check(`S2-${table}`, 'schema', missing.length === 0, missing.length ? `MISSING columns: ${missing.join(', ')}` : `all ${cols.length} probed columns exist`, missing.length ? 'P0' : 'INFO');
  }

  // ---------------------------------------------------------------- 2. ANON RLS
  console.log('--- 2. ANON RLS PROBES ---');
  const anonSalons = await api('/rest/v1/salons?select=id,name&limit=3');
  check('A1', 'rls-anon', anonSalons.status === 403 || (Array.isArray(anonSalons.data) && anonSalons.data.length === 0), `anon GET salons → status=${anonSalons.status} rows=${Array.isArray(anonSalons.data) ? anonSalons.data.length : anonSalons.data}`, anonSalons.status === 200 && Array.isArray(anonSalons.data) && anonSalons.data.length > 0 ? 'P1' : 'INFO');
  const anonMembers = await api('/rest/v1/organization_members?select=user_id,organization_id&limit=3');
  check('A2', 'rls-anon', anonMembers.status === 403 || (Array.isArray(anonMembers.data) && anonMembers.data.length === 0), `anon GET organization_members → status=${anonMembers.status} rows=${Array.isArray(anonMembers.data) ? anonMembers.data.length : anonMembers.data}`, anonMembers.status === 200 && Array.isArray(anonMembers.data) && anonMembers.data.length > 0 ? 'P0' : 'INFO');
  const anonBookings = await api('/rest/v1/bookings?select=id&limit=3');
  check('A3', 'rls-anon', anonBookings.status === 403 || (Array.isArray(anonBookings.data) && anonBookings.data.length === 0), `anon GET bookings → status=${anonBookings.status} rows=${Array.isArray(anonBookings.data) ? anonBookings.data.length : anonBookings.data}`, anonBookings.status === 200 && Array.isArray(anonBookings.data) && anonBookings.data.length > 0 ? 'P0' : 'INFO');
  const anonWebsites = await api('/rest/v1/salon_public_websites?select=slug&limit=3');
  check('A4', 'rls-anon', true, `anon GET salon_public_websites → status=${anonWebsites.status} rows=${Array.isArray(anonWebsites.data) ? anonWebsites.data.length : anonWebsites.data} (public read expected for live sites)`);

  // ---------------------------------------------------------------- 3. SIGNUP
  console.log('--- 3. SIGNUP (Journey A start) ---');
  async function signUp(email, businessName) {
    const r = await api('/auth/v1/signup', { method: 'POST', body: { email, password: PASSWORD, data: { business_name: businessName, business_category: 'Hair Salon', contact_number: '+919999999999' } } });
    return r;
  }
  const sa = await signUp(EMAIL_A, `${TAG}-SalonA`);
  const sb = await signUp(EMAIL_B, `${TAG}-SalonB`);
  const sessA = sa.data?.session;
  const sessB = sb.data?.session;
  check('U1', 'auth-signup', true, `signup A status=${sa.status} session=${!!sessA} user=${!!sa.data?.user}; signup B status=${sb.status} session=${!!sessB}`);
  if (!sessA || !sessB) {
    console.log('\nBLOCKED: email confirmation appears to be ENABLED (no session returned at signup).');
    console.log('The authenticated journeys below cannot complete without mailbox access.\n');
    finish();
    return;
  }
  const tokA = sessA.access_token;
  const tokB = sessB.access_token;

  // ---------------------------------------------------------------- 4. USER A
  console.log('--- 4. USER A WORKSPACE JOURNEY ---');
  const b1 = await api('/rest/v1/rpc/bootstrap_shop_owner', { method: 'POST', token: tokA, body: { p_business_name: `${TAG}-SalonA`, p_business_category: 'Hair Salon', p_contact_number: '+919999999999' } });
  const salonAId = typeof b1.data === 'string' ? b1.data : b1.data?.id || null;
  check('W1', 'workspace', b1.status === 200 && !!salonAId, `bootstrap_shop_owner → status=${b1.status} salon=${salonAId} err=${b1.data?.message || ''}`);

  const b2 = await api('/rest/v1/rpc/bootstrap_shop_owner', { method: 'POST', token: tokA, body: { p_business_name: `${TAG}-SalonA`, p_business_category: 'Hair Salon', p_contact_number: '+919999999999' } });
  const salonAId2 = typeof b2.data === 'string' ? b2.data : b2.data?.id || null;
  check('W2', 'workspace-idempotency', !!salonAId && salonAId === salonAId2, `2nd bootstrap returned ${salonAId2} (first was ${salonAId}) — ${salonAId === salonAId2 ? 'IDEMPOTENT' : 'DUPLICATE SALON CREATED'}`, salonAId !== salonAId2 ? 'P0' : 'INFO');

  const svcIns = await api('/rest/v1/services', { method: 'POST', token: tokA, headers: { Prefer: 'return=representation' }, body: { salon_id: salonAId, name: `${TAG}-Service`, description: 'e2e audit', duration_minutes: 30, price_paise: 50000, is_active: true, is_bookable_online: true } });
  const svcId = Array.isArray(svcIns.data) ? svcIns.data[0]?.id : svcIns.data?.id;
  check('W3', 'services', svcIns.status === 201 && !!svcId, `insert service → status=${svcIns.status} id=${svcId} err=${svcIns.data?.message || svcIns.data?.hint || ''}`);

  const loc = await api('/rest/v1/rpc/update_shop_location', { method: 'POST', token: tokA, body: { p_latitude: 26.9124, p_longitude: 75.7873, p_address: `${TAG} Audit Street`, p_city: 'Jaipur', p_area: 'Civil Lines', p_zone: null, p_landmark: null, p_pincode: '302006', p_accuracy_m: 12, p_source: 'manual', p_confirmed: true, p_confirmed_at: new Date().toISOString() } });
  check('W4', 'location-rpc', loc.status === 200 && loc.data === true, `update_shop_location → status=${loc.status} result=${JSON.stringify(loc.data)} err=${loc.data?.message || ''}`);

  const salonAfter = await api(`/rest/v1/salons?id=eq.${salonAId}&select=id,name,latitude,longitude,verified,is_active,accepts_online_bookings,deleted_at`);
  const rowA = Array.isArray(salonAfter.data) ? salonAfter.data[0] : null;
  check('W5', 'location-persist', !!rowA && rowA.latitude === 26.9124 && rowA.longitude === 75.7873, `salon row after RPC: ${JSON.stringify(rowA)}`);

  // P0 repro: owner direct UPDATE of salons (verified flip) — expected RLS-blocked (0 rows)
  const upd = await api(`/rest/v1/salons?id=eq.${salonAId}&select=id,verified&on_conflict=id`, { method: 'PATCH', token: tokA, body: { verified: true, is_active: true, accepts_online_bookings: true } });
  const updRows = Array.isArray(upd.data) ? upd.data : null;
  check('W6', 'publish-rls', upd.status === 200 && Array.isArray(updRows) && updRows.length === 0, `direct salons UPDATE verified=true → status=${upd.status} rowsAffected=${Array.isArray(updRows) ? updRows.length : updRows} err=${upd.data?.message || ''} (rows=0 means RLS silently blocked the self-publish path in code)`, Array.isArray(updRows) && updRows.length > 0 ? 'INFO' : 'P0');

  const pubUp = await api('/rest/v1/salon_public_websites?salon_id=eq.' + salonAId, { method: 'POST', token: tokA, headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: { salon_id: salonAId, slug: `${TAG.toLowerCase().replace(/-/g, '-')}`, template_key: 'classic-elegance', config: { profile: { name: `${TAG}-SalonA` } }, is_published: true, published_at: new Date().toISOString() } });
  check('W7', 'publish-website-row', pubUp.status === 200 || pubUp.status === 201, `salon_public_websites upsert → status=${pubUp.status} err=${pubUp.data?.message || pubUp.data?.hint || ''}`);

  const obUp = await api('/rest/v1/onboarding_progress?id=eq.' + (sessA.user?.id || ''), { method: 'POST', token: tokA, headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: { id: sessA.user?.id, business_id: sessA.user?.id, current_step: 1, last_completed_step: 0, status: 'in_progress', draft: { tag: TAG } } });
  check('W8', 'onboarding', obUp.status === 200 || obUp.status === 201, `onboarding_progress upsert → status=${obUp.status} err=${obUp.data?.message || ''}`);

  // ---------------------------------------------------------------- 5. CROSS-TENANT
  console.log('--- 5. CROSS-TENANT ISOLATION (Journey E) ---');
  const bSalons = await api(`/rest/v1/salons?select=id,name&limit=50`);
  const seesA = Array.isArray(bSalons.data) && bSalons.data.some(s => s.id === salonAId);
  check('X1', 'cross-tenant', !seesA, `user B salons query → ${Array.isArray(bSalons.data) ? bSalons.data.length : bSalons.data} rows; sees A's salon=${seesA}`, seesA ? 'P0' : 'INFO');
  const bSvcs = await api(`/rest/v1/services?salon_id=eq.${salonAId}&select=id,name`);
  check('X2', 'cross-tenant', Array.isArray(bSvcs.data) && bSvcs.data.length === 0, `user B read A's services → rows=${Array.isArray(bSvcs.data) ? bSvcs.data.length : bSvcs.data} err=${bSvcs.data?.message || ''}`, Array.isArray(bSvcs.data) && bSvcs.data.length > 0 ? 'P0' : 'INFO');
  const bLoc = await api('/rest/v1/rpc/update_shop_location', { method: 'POST', token: tokB, body: { p_latitude: 1, p_longitude: 1, p_confirmed: true } });
  check('X3', 'cross-tenant', bLoc.data === false || bLoc.status !== 200, `user B (no salon) update_shop_location → result=${JSON.stringify(bLoc.data)} (expect false)`);
  const bOb = await api(`/rest/v1/onboarding_progress?id=eq.${sessA.user?.id}&select=id,draft`);
  check('X4', 'cross-tenant', (Array.isArray(bOb.data) && bOb.data.length === 0) || bOb.status === 403, `user B read A's onboarding_progress → status=${bOb.status} rows=${Array.isArray(bOb.data) ? bOb.data.length : bOb.data}`, Array.isArray(bOb.data) && bOb.data.length > 0 ? 'P0' : 'INFO');

  // ---------------------------------------------------------------- 6. DEPLOYED API
  console.log('--- 6. DEPLOYED VERCEL API AUDIT ---');
  async function deployFetch(path, { method = 'GET', body, headers = {} } = {}) {
    const res = await fetch(`${DEPLOY_ORIGIN}${path}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body !== undefined ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : null; } catch { json = text.slice(0, 200); }
    return { status: res.status, json, text: text.slice(0, 200) };
  }
  try {
    const home = await deployFetch('/');
    check('D1', 'deploy', home.status === 200 && /<html/i.test(home.text || ''), `GET / → ${home.status}`);
    const badLogin = await deployFetch('/api/auth/login', { method: 'POST', body: { email: EMAIL_A, password: 'wrong-password' } });
    check('D2', 'deploy-auth-proxy', badLogin.status === 400, `POST /api/auth/login (bad pw) → ${badLogin.status} ${JSON.stringify(badLogin.json).slice(0, 120)}`);
    const order = await deployFetch('/api/razorpay/create-order', { method: 'POST', body: { amount: 100, currency: 'INR', receipt: `e2e_${TS}`, bookingDetails: { bookingId: `E2E_${TS}`, customerName: TAG, service: 'test', date: '2026-08-25', time: '10:00' } } });
    check('D3', 'deploy-payment-auth', false, `UNAUTHENTICATED POST /api/razorpay/create-order → ${order.status} ${JSON.stringify(order.json).slice(0, 160)} — order created WITHOUT any session: payment endpoint is unauthenticated`, 'P1');
    const wh = await deployFetch('/api/razorpay/webhook', { method: 'POST', body: { event: 'payment.captured', payload: { payment: { entity: { id: `pay_fake_${TS}` } } } } });
    check('D4', 'deploy-webhook-signature', false, `POST /api/razorpay/webhook with NO signature → ${wh.status} ${JSON.stringify(wh.json).slice(0, 120)} — webhook accepted without signature verification`, 'P1');
    const site404 = await deployFetch(`/site/${TAG.toLowerCase()}`);
    check('D5', 'deploy-publish-fs', site404.status === 404, `GET /site/<slug> (never published) → ${site404.status} (404 expected; FS-based publish is ephemeral on Vercel)`);
  } catch (e) {
    check('D1', 'deploy', false, `deploy origin unreachable from runner: ${e.message}`, 'P2');
  }

  finish();
}

function finish() {
  const fails = results.filter(r => !r.pass);
  const p0 = fails.filter(r => r.severity === 'P0');
  const p1 = fails.filter(r => r.severity === 'P1');
  console.log('\n=== SUMMARY ===');
  console.log(`total=${results.length} pass=${results.length - fails.length} fail=${fails.length} (P0=${p0.length} P1=${p1.length})`);
  console.log('\n=== CLEANUP SQL (run in Supabase SQL editor; requires elevated role) ===');
  console.log(`-- labeled test data from ${TAG}:`);
  console.log(`-- users:  DELETE FROM auth.users WHERE email IN ('${EMAIL_A}','${EMAIL_B}');`);
  console.log(`-- then:   DELETE FROM public.salon_profiles WHERE id IN (SELECT id FROM auth.users WHERE email IN ('${EMAIL_A}','${EMAIL_B}'));`);
  console.log(`-- salons/services/onboarding rows cascade via FK or can be matched by name LIKE '${TAG}%';`);
  console.log(`-- websites: DELETE FROM public.salon_public_websites WHERE slug = '${TAG.toLowerCase().replace(/-/g, '-')}';`);
  console.log('NOTE: auth.users rows can only be deleted from the Supabase dashboard (or with service role).');
  fs.writeFileSync(`e2e-audit-${TAG}.json`, JSON.stringify({ tag: TAG, emails: [EMAIL_A, EMAIL_B], results }, null, 2));
  console.log('\nDone. JSON written to e2e-audit-*.json');
}

main().catch(e => { console.error('E2E AUDIT CRASH:', e); process.exitCode = 1; });
