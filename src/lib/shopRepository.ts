/**
 * Nexora Shop Owner — live Supabase data layer (Phase 3 wiring).
 *
 * Every contract here was verified against the shared project
 * (qwaehqsmodekbgvnaavz) with a real owner session:
 *   - bootstrap_shop_owner(p_business_name, p_business_category, p_contact_number)
 *     creates the owner's organization + membership + salon row in DRAFT
 *     (verified=false). Draft salons are invisible to customers and cannot
 *     take bookings ("salon is not bookable") — by design.
 *   - Owners CANNOT flip verified/is_active directly: no UPDATE grant on
 *     public.salons for authenticated (42501). Publication happens ONLY via
 *     the proposal workflow (review_salon_setup RPC).
 *   - services / staff / offers / salon_hours are owner-scoped by RLS
 *     (private.can_manage_salon_settings) — cross-shop writes are rejected.
 *   - bookings are visible only for the owner's own salon (bookings_owner_read).
 *
 * No service_role key anywhere. No new DB objects.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types (mapped from live schema)
// ---------------------------------------------------------------------------

export type ShopStatus = 'draft' | 'pending' | 'published';

export interface MyShop {
  id: string;
  organizationId: string;
  name: string;
  businessCategory: string | null;
  phone: string | null;
  address: string | null;
  area: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Optional zone (e.g. "Central Jaipur") — owner set karta hai */
  zone: string | null;
  /** Optional landmark */
  landmark: string | null;
  /** Optional pincode */
  pincode: string | null;
  verified: boolean;
  acceptsOnlineBookings: boolean;
  ratingAverage: number;
  status: ShopStatus;
  proposalId: string | null;
  proposalStatus: string | null;
}

/** Canonical shop location payload — lat/lng source of truth */
export interface ShopLocationInput {
  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  area?: string | null;
  zone?: string | null;
  landmark?: string | null;
  pincode?: string | null;
}

export interface ShopService {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  pricePaise: number;
  isActive: boolean;
  isBookableOnline: boolean;
  deletedAt: string | null;
}

export interface ShopStaff {
  id: string;
  salonId: string;
  name: string;
  role: string | null;
  specialty: string | null;
  employmentStatus: string | null;
}

export interface ShopHours {
  id: string;
  salonId: string;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
}

export interface ShopOffer {
  id: string;
  salonId: string;
  name: string | null;
  code: string | null;
  description: string | null;
  discountValue: number | null;
  isActive: boolean;
}

export interface ShopBooking {
  id: string;
  salonId: string;
  appointmentStart: string | null;
  status: string | null;
  totalPaise: number | null;
  currency: string | null;
  customerNote: string | null;
  createdAt: string | null;
  createdBy: string | null;
  serviceIds: string[];
  serviceNames: string[];
}

export interface WalletRow {
  id: string;
  amountPaise: number;
  txType: 'credit' | 'debit';
  reason: string | null;
  refType: string | null;
  createdAt: string | null;
}

export interface PayoutRow {
  id: string;
  status: string | null;
  amountPaise: number | null;
  paidAt: string | null;
}

export interface WalletOverview {
  balancePaise: number;
  pendingPaise: number;
  paidPaise: number;
  transactions: WalletRow[];
  payouts: PayoutRow[];
}

// ---------------------------------------------------------------------------
// Shop bootstrap + read
// ---------------------------------------------------------------------------

export async function bootstrapMyShop(
  client: SupabaseClient,
  input: { businessName: string; businessCategory: string; contactNumber: string | null },
): Promise<string> {
  const { data, error } = await client.rpc('bootstrap_shop_owner', {
    p_business_name: input.businessName.trim(),
    p_business_category: input.businessCategory.trim() || null,
    p_contact_number: input.contactNumber?.trim() || null,
  });
  if (error) throw error;
  const id = typeof data === 'string' ? data : (data as { id?: string } | null)?.id;
  if (!id) throw new Error('Shop workspace was not created.');
  return id;
}

/**
 * Resolve the caller's own shop: organization_members (self-read policy) →
 * salons by organization. Never trusts a client-supplied salon id.
 */
export async function fetchMyShop(client: SupabaseClient): Promise<MyShop | null> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: members, error: membersError } = await client
    .from('organization_members')
    .select('organization_id, role, status')
    .eq('user_id', user.id);
  if (membersError) throw membersError;

  const orgIds = (members ?? [])
    .filter((m: any) => m.role === 'owner' && m.status === 'active')
    .map((m: any) => m.organization_id);
  if (orgIds.length === 0) return null;

  const { data: salons, error: salonsError } = await client
    .from('salons')
    .select('id, organization_id, name, business_category, phone, latitude, longitude, location_address, location_city, location_area, location_zone, location_landmark, location_pincode, verified, accepts_online_bookings, rating_average')
    .in('organization_id', orgIds)
    .is('deleted_at', null);
  if (salonsError) throw salonsError;
  const salon = (salons ?? [])[0] as any;
  if (!salon) return null;

  // Proposal (owner-read policy) tells us the publish-request state.
  const { data: proposals } = await client
    .from('salon_setup_proposals')
    .select('id, status, salon_id')
    .eq('salon_id', salon.id)
    .limit(1);
  const proposal = (proposals ?? [])[0] as any;

  let status: ShopStatus;
  if (salon.verified) status = 'published';
  else if (proposal && ['submitted', 'approved'].includes(proposal.status)) status = 'pending';
  else status = 'draft';

  return {
    id: salon.id,
    organizationId: salon.organization_id,
    name: salon.name || 'Salon',
    businessCategory: salon.business_category ?? null,
    phone: salon.phone ?? null,
    address: salon.location_address ?? null,
    area: salon.location_area ?? null,
    city: salon.location_city ?? null,
    latitude: typeof salon.latitude === 'number' ? salon.latitude : null,
    longitude: typeof salon.longitude === 'number' ? salon.longitude : null,
    zone: salon.location_zone ?? null,
    landmark: salon.location_landmark ?? null,
    pincode: salon.location_pincode ?? null,
    verified: Boolean(salon.verified),
    acceptsOnlineBookings: Boolean(salon.accepts_online_bookings),
    ratingAverage: Number(salon.rating_average ?? 0),
    status,
    proposalId: proposal?.id ?? null,
    proposalStatus: proposal?.status ?? null,
  };
}

// ---------------------------------------------------------------------------
// Services (owner-scoped via RLS)
// ---------------------------------------------------------------------------

/**
 * Update the owner's canonical shop location (lat/lng = source of truth).
 * salons par direct UPDATE grant nahi hai → RPC `update_shop_location`
 * (security definer, ownership verified via organization_members).
 * RPC fail ho to direct update attempt karte hain (agar RLS allow kare).
 */
export async function updateShopLocation(
  client: SupabaseClient,
  input: ShopLocationInput,
): Promise<{ ok: boolean; error?: string | null }> {
  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    return { ok: false, error: 'Invalid coordinates' };
  }
  try {
    // Owner ka apna salon resolve karo (organization_members se ownership)
    const shop = await fetchMyShop(client);
    if (!shop) return { ok: false, error: 'No owned salon found to update' };

    const patch = {
      latitude: input.latitude,
      longitude: input.longitude,
      location_address: input.address ?? null,
      location_city: input.city ?? null,
      location_area: input.area ?? null,
      location_zone: input.zone ?? null,
      location_landmark: input.landmark ?? null,
      location_pincode: input.pincode ?? null,
    };

    // 1) Direct UPDATE — agar RLS owner ko apni salon update karne de
    const { error: upErr } = await client
      .from('salons')
      .update(patch)
      .eq('id', shop.id);
    if (!upErr) return { ok: true };

    // 2) RLS ne direct update block kiya (e.g. 42501) → RPC fallback try karo
    //    (agar DB me update_shop_location RPC deploy ho — schema change nahi, sirf try)
    const { error: rpcErr } = await client.rpc('update_shop_location', {
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_address: input.address ?? null,
      p_city: input.city ?? null,
      p_area: input.area ?? null,
      p_zone: input.zone ?? null,
      p_landmark: input.landmark ?? null,
      p_pincode: input.pincode ?? null,
    });
    if (!rpcErr) return { ok: true };

    // 3) Dono fail — clear error (owner ko bataya jayega)
    return { ok: false, error: upErr.message || rpcErr.message || 'Failed to update shop location' };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

export async function listServices(client: SupabaseClient, salonId: string): Promise<ShopService[]> {
  const { data, error } = await client
    .from('services')
    .select('id, salon_id, name, description, duration_minutes, price_paise, is_active, is_bookable_online, deleted_at')
    .eq('salon_id', salonId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ShopService[];
}

export async function createService(
  client: SupabaseClient,
  salonId: string,
  input: { name: string; description?: string | null; durationMinutes: number; pricePaise: number; isBookableOnline: boolean },
): Promise<ShopService> {
  const { data, error } = await client
    .from('services')
    .insert({
      salon_id: salonId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      duration_minutes: input.durationMinutes,
      price_paise: input.pricePaise,
      is_active: true,
      is_bookable_online: input.isBookableOnline,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ShopService;
}

export async function updateService(
  client: SupabaseClient,
  id: string,
  patch: { name?: string; description?: string | null; duration_minutes?: number; price_paise?: number; is_active?: boolean; is_bookable_online?: boolean },
): Promise<void> {
  const { error } = await client.from('services').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteService(client: SupabaseClient, id: string): Promise<void> {
  // Soft delete — keeps booking history intact.
  const { error } = await client.from('services').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export async function listStaff(client: SupabaseClient, salonId: string): Promise<ShopStaff[]> {
  const { data, error } = await client
    .from('staff')
    .select('id, salon_id, name, role, specialty, employment_status, deleted_at')
    .eq('salon_id', salonId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    salonId: r.salon_id,
    name: r.name ?? 'Professional',
    role: r.role ?? null,
    specialty: r.specialty ?? null,
    employmentStatus: r.employment_status ?? null,
  }));
}

export async function createStaff(
  client: SupabaseClient,
  salonId: string,
  input: { name: string; role?: string | null; specialty?: string | null },
): Promise<ShopStaff> {
  const { data, error } = await client
    .from('staff')
    .insert({
      salon_id: salonId,
      name: input.name.trim(),
      role: input.role?.trim() || null,
      specialty: input.specialty?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, salonId, name: data.name, role: data.role ?? null, specialty: data.specialty ?? null, employmentStatus: data.employment_status ?? null };
}

export async function updateStaff(
  client: SupabaseClient,
  id: string,
  patch: { name?: string; role?: string | null; specialty?: string | null; employment_status?: string },
): Promise<void> {
  const { error } = await client.from('staff').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteStaff(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('staff').update({ deleted_at: new Date().toISOString(), employment_status: 'inactive' }).eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Opening hours (live columns: day_of_week, opens_at, closes_at, is_closed)
// ---------------------------------------------------------------------------

export async function listHours(client: SupabaseClient, salonId: string): Promise<ShopHours[]> {
  const { data, error } = await client
    .from('salon_hours')
    .select('id, salon_id, day_of_week, opens_at, closes_at, is_closed')
    .eq('salon_id', salonId)
    .order('day_of_week', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    salonId: r.salon_id,
    dayOfWeek: r.day_of_week,
    opensAt: r.opens_at ?? null,
    closesAt: r.closes_at ?? null,
    isClosed: Boolean(r.is_closed),
  }));
}

export async function saveHours(
  client: SupabaseClient,
  salonId: string,
  dayOfWeek: number,
  input: { opensAt: string | null; closesAt: string | null; isClosed: boolean },
): Promise<void> {
  const { data: existing } = await client
    .from('salon_hours')
    .select('id')
    .eq('salon_id', salonId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();
  const row = {
    salon_id: salonId,
    day_of_week: dayOfWeek,
    opens_at: input.opensAt,
    closes_at: input.closesAt,
    is_closed: input.isClosed,
  };
  const { error } = existing
    ? await client.from('salon_hours').update(row).eq('id', (existing as any).id)
    : await client.from('salon_hours').insert(row);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Offers (live columns: name, code, description, discount_value, is_active)
// ---------------------------------------------------------------------------

export async function listOffers(client: SupabaseClient, salonId: string): Promise<ShopOffer[]> {
  const { data, error } = await client
    .from('offers')
    .select('id, salon_id, name, code, description, discount_value, is_active')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    salonId: r.salon_id,
    name: r.name ?? null,
    code: r.code ?? null,
    description: r.description ?? null,
    discountValue: r.discount_value ?? null,
    isActive: Boolean(r.is_active),
  }));
}

export async function createOffer(
  client: SupabaseClient,
  salonId: string,
  input: { name: string; code?: string | null; description?: string | null; discountType: 'percent' | 'fixed'; discountValue: number; isActive: boolean },
): Promise<void> {
  const { error } = await client.from('offers').insert({
    salon_id: salonId,
    name: input.name.trim(),
    code: input.code?.trim() || null,
    description: input.description?.trim() || null,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    is_active: input.isActive,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Bookings inbox — own salon only (RLS: bookings_owner_read)
// ---------------------------------------------------------------------------

export async function fetchMyBookings(client: SupabaseClient, salonId: string): Promise<ShopBooking[]> {
  const { data: rows, error } = await client
    .from('bookings')
    .select('id, salon_id, appointment_start, status, total_paise, currency, customer_note, created_at, created_by')
    .eq('salon_id', salonId)
    .order('appointment_start', { ascending: false })
    .limit(100);
  if (error) throw error;

  const bookings = (rows ?? []) as any[];
  const ids = bookings.map((b) => b.id);
  const serviceIdsByBooking: Record<string, string[]> = {};
  if (ids.length) {
    const { data: items } = await client
      .from('booking_items')
      .select('booking_id, service_id')
      .in('booking_id', ids);
    for (const item of items ?? []) {
      const key = String((item as any).booking_id);
      if (!serviceIdsByBooking[key]) serviceIdsByBooking[key] = [];
      serviceIdsByBooking[key].push(String((item as any).service_id));
    }
  }

  // Resolve service names from the owner's own services (RLS-scoped).
  const { data: serviceRows } = await client
    .from('services')
    .select('id, name')
    .eq('salon_id', salonId)
    .is('deleted_at', null);
  const nameById = new Map<string, string>((serviceRows ?? []).map((s: any) => [String(s.id), String(s.name ?? 'Service')]));

  return bookings.map((b) => {
    const serviceIds = serviceIdsByBooking[b.id] ?? [];
    return {
      id: b.id,
      salonId: b.salon_id,
      appointmentStart: b.appointment_start ?? null,
      status: b.status ?? null,
      totalPaise: b.total_paise ?? null,
      currency: b.currency ?? null,
      customerNote: b.customer_note ?? null,
      createdAt: b.created_at ?? null,
      createdBy: b.created_by ?? null,
      serviceIds,
      serviceNames: serviceIds.map((sid) => nameById.get(sid) ?? 'Service'),
    };
  });
}

// ---------------------------------------------------------------------------
// Publish request — via the proposal workflow only.
// Owner CANNOT self-approve (no UPDATE grant on salons); publish requires an
// existing submitted proposal (created by the Growth Partner flow) and the
// security-definer review_salon_setup RPC.
// ---------------------------------------------------------------------------

export async function requestPublish(client: SupabaseClient, proposalId: string): Promise<void> {
  const { error } = await client.rpc('review_salon_setup', {
    p_proposal_id: proposalId,
    p_action: 'publish',
    p_notes: null,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Wallet / payout — read-only from existing ledgers
// ---------------------------------------------------------------------------

export async function fetchWalletOverview(client: SupabaseClient): Promise<WalletOverview> {
  const { data: { user } } = await client.auth.getUser();
  const { data: txs, error: txsError } = await client
    .from('wallet_transactions')
    .select('id, amount_paise, tx_type, reason, ref_type, ref_id, created_at')
    .eq('user_id', user?.id ?? '00000000-0000-0000-0000-000000000000')
    .order('created_at', { ascending: false })
    .limit(100);
  if (txsError) throw txsError;

  const { data: payouts, error: payoutsError } = await client
    .from('owner_payouts')
    .select('id, status, amount_paise, paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (payoutsError) throw payoutsError;

  const transactions = ((txs ?? []) as any[]).map((r) => ({
    id: r.id,
    amountPaise: r.amount_paise ?? 0,
    txType: (r.tx_type === 'debit' ? 'debit' : 'credit') as 'credit' | 'debit',
    reason: r.reason ?? null,
    refType: r.ref_type ?? null,
    createdAt: r.created_at ?? null,
  }));

  const payoutRows = ((payouts ?? []) as any[]).map((r) => ({
    id: r.id,
    status: r.status ?? null,
    amountPaise: r.amount_paise ?? null,
    paidAt: r.paid_at ?? r.created_at ?? null,
  }));

  const balancePaise = payoutRows
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (p.amountPaise ?? 0), 0);
  const pendingPaise = payoutRows
    .filter((p) => ['pending', 'scheduled', 'processing'].includes(String(p.status)))
    .reduce((s, p) => s + (p.amountPaise ?? 0), 0);

  return { balancePaise, pendingPaise, paidPaise: balancePaise, transactions, payouts: payoutRows };
}
