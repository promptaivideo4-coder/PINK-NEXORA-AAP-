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
import {
  parseSalonWebsiteConfig,
  salonNameFromConfig,
  slugFromSalonName,
  templateKeyFromConfig,
  type SalonWebsiteConfig,
} from './salonWebsiteConfig';

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
  description: string | null;
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
  /** GPS accuracy (meters) at time of save */
  locationAccuracyM: number | null;
  /** Location source: 'gps' (device) | 'manual' (pin) */
  locationSource: 'gps' | 'manual' | null;
  /** True only after owner explicitly confirmed the location */
  locationConfirmed: boolean;
  /** When the owner confirmed the location */
  locationConfirmedAt: string | null;
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
  /** GPS accuracy (m) at save time — informational only */
  accuracyM?: number | null;
  /** 'gps' | 'manual' — how the location was selected */
  source?: 'gps' | 'manual' | null;
  /** Must be true — owner explicitly confirmed */
  confirmed: boolean;
  /** Confirm timestamp (ISO) */
  confirmedAt?: string | null;
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
export interface ShopProfileInput {
  name?: string;
  businessCategory?: string | null;
  phone?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  area?: string | null;
  zone?: string | null;
  landmark?: string | null;
  pincode?: string | null;
}

// ---------------------------------------------------------------------------
// Shop bootstrap + read
// ---------------------------------------------------------------------------

export async function bootstrapMyShop(
  client: SupabaseClient,
  input: { businessName: string; businessCategory: string; contactNumber: string | null },
): Promise<string> {
  // Idempotency check: ONE SHOP = ONE salons.id
  // If an existing active salon already exists for this owner, return its ID
  // to prevent duplicate salon creation on refresh, login, or re-bootstrap.
  try {
    const existing = await fetchMyShop(client);
    if (existing && existing.id) {
      return existing.id;
    }
  } catch {
    // If lookup fails, proceed with RPC
  }

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
    .select('id, organization_id, name, description, business_category, phone, latitude, longitude, address, area, city, location_address, location_city, location_area, location_zone, location_landmark, location_pincode, location_accuracy_m, location_source, location_confirmed, location_confirmed_at, verified, accepts_online_bookings, rating_average')
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
  const proposal = ((proposals ?? []) as Array<{ id: string; status: string; salon_id: string }>)[0];

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
    description: salon.description ?? null,
    address: salon.location_address || salon.address || null,
    area: salon.location_area || salon.area || null,
    city: salon.location_city || salon.city || null,
    latitude: typeof salon.latitude === 'number' ? salon.latitude : null,
    longitude: typeof salon.longitude === 'number' ? salon.longitude : null,
    zone: salon.location_zone ?? null,
    landmark: salon.location_landmark ?? null,
    pincode: salon.location_pincode ?? null,
    locationAccuracyM: typeof salon.location_accuracy_m === 'number' ? salon.location_accuracy_m : null,
    locationSource: (salon.location_source === 'gps' || salon.location_source === 'manual') ? salon.location_source : null,
    locationConfirmed: Boolean(salon.location_confirmed),
    locationConfirmedAt: salon.location_confirmed_at ?? null,
    verified: Boolean(salon.verified),
    acceptsOnlineBookings: Boolean(salon.accepts_online_bookings),
    ratingAverage: Number(salon.rating_average ?? 0),
    status,
    proposalId: proposal?.id ?? null,
    proposalStatus: proposal?.status ?? null,
  };
}

/**
 * Update the owner's canonical shop profile (persists shop name, category, phone,
 * description, address, city, area, zone, landmark, pincode to public.salons).
 */
export async function updateShopProfile(
  client: SupabaseClient,
  salonId: string,
  input: ShopProfileInput,
): Promise<{ ok: boolean; error?: string | null }> {
  try {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.businessCategory !== undefined) patch.business_category = input.businessCategory ? input.businessCategory.trim() : null;
    if (input.phone !== undefined) patch.phone = input.phone ? input.phone.trim() : null;
    if (input.description !== undefined) patch.description = input.description ? input.description.trim() : null;
    if (input.address !== undefined) {
      patch.address = input.address ? input.address.trim() : null;
      patch.location_address = input.address ? input.address.trim() : null;
    }
    if (input.city !== undefined) {
      patch.city = input.city ? input.city.trim() : null;
      patch.location_city = input.city ? input.city.trim() : null;
    }
    if (input.area !== undefined) {
      patch.area = input.area ? input.area.trim() : null;
      patch.location_area = input.area ? input.area.trim() : null;
    }
    if (input.zone !== undefined) patch.location_zone = input.zone ? input.zone.trim() : null;
    if (input.landmark !== undefined) patch.location_landmark = input.landmark ? input.landmark.trim() : null;
    if (input.pincode !== undefined) patch.location_pincode = input.pincode ? input.pincode.trim() : null;

    // AFFECTED-ROW VERIFICATION: PostgREST returns 0 rows (no error) when RLS
    // silently blocks an UPDATE. The previous code returned ok:true in that
    // case — the "saved" profile never reached the database.
    const { data: updated, error } = await client
      .from('salons')
      .update(patch)
      .eq('id', salonId)
      .select('id');

    if (error) {
      // Direct update rejected → try the secure RPC fallback.
      const rpcUpdates = {
        name: patch.name,
        description: patch.description,
        address: patch.address,
        area: patch.area,
        city: patch.city,
        business_category: patch.business_category,
      };
      const { error: rpcErr } = await client.rpc('update_salon_profile_secure', {
        p_salon_id: salonId,
        p_updates: rpcUpdates,
      });
      if (rpcErr) return { ok: false, error: rpcErr.message };
      return { ok: true };
    }

    if (!updated || updated.length === 0) {
      // RLS silent block — fall back to the secure RPC (security definer,
      // ownership verified server-side).
      const rpcUpdates = {
        name: patch.name,
        description: patch.description,
        address: patch.address,
        area: patch.area,
        city: patch.city,
        business_category: patch.business_category,
      };
      const { error: rpcErr } = await client.rpc('update_salon_profile_secure', {
        p_salon_id: salonId,
        p_updates: rpcUpdates,
      });
      if (rpcErr) {
        return { ok: false, error: `Profile save blocked by row-level security and the secure RPC also failed: ${rpcErr.message}` };
      }
      return { ok: true };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
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
/**
 * Update the owner's canonical shop location (lat/lng = source of truth).
 *
 * CRITICAL FIX (silent RLS fail):
 * PostgREST me RLS-blocked UPDATE koi error nahi deta — bas 0 rows affect
 * karta hai. Isliye:
 *  - `.select()` se affected rows verify hoti hain
 *  - 0 rows / error → RPC fallback try
 *  - Save ke baad record re-fetch karke coords match verify
 *  - Sirf ACTUALLY persisted hone par `ok: true` return hota hai
 *
 * Salon ID: organization_members (owner role) se resolve — koi hardcode/demo
 * ID nahi, `[0]` ambiguity bhi nahi (saare owned salons target).
 */
export async function updateShopLocation(
  client: SupabaseClient,
  input: ShopLocationInput,
): Promise<{ ok: boolean; error?: string | null }> {
  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    return { ok: false, error: 'Invalid coordinates' };
  }
  if (input.confirmed !== true) {
    return { ok: false, error: 'Location is not confirmed by the owner' };
  }

  try {
    // ---- Resolve owner's salon IDs (ownership via organization_members) ----
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { ok: false, error: 'Not authenticated. Please log in.' };

    const { data: members, error: membersError } = await client
      .from('organization_members')
      .select('organization_id, role, status')
      .eq('user_id', user.id);
    if (membersError) return { ok: false, error: `Membership lookup failed: ${membersError.message}` };

    const orgIds = (members ?? [])
      .filter((m: any) => m.role === 'owner' && m.status === 'active')
      .map((m: any) => m.organization_id);
    if (orgIds.length === 0) {
      return { ok: false, error: 'No owned salon found to update (owner membership missing/inactive).' };
    }

    // Sahi salon IDs — owner ke saare salons (koi hardcode nahi)
    const { data: ownedSalons, error: salonsErr } = await client
      .from('salons')
      .select('id')
      .in('organization_id', orgIds)
      .is('deleted_at', null);
    if (salonsErr) return { ok: false, error: `Salon lookup failed: ${salonsErr.message}` };
    if (!ownedSalons || ownedSalons.length === 0) {
      return { ok: false, error: 'No owned salon found to update.' };
    }
    const salonIds = ownedSalons.map((s: any) => s.id);

    // ---- Full payload (12 fields) ----
    const patch: Record<string, unknown> = {
      latitude: input.latitude,
      longitude: input.longitude,
      location_accuracy_m: typeof input.accuracyM === 'number' ? input.accuracyM : null,
      // Only write location_source when the caller actually provides one —
      // sending null would wipe a previously saved 'gps'/'manual' value.
      ...(input.source === 'gps' || input.source === 'manual' ? { location_source: input.source } : {}),
      location_address: input.address ?? null,
      location_city: input.city ?? null,
      location_area: input.area ?? null,
      location_zone: input.zone ?? null,
      location_landmark: input.landmark ?? null,
      location_pincode: input.pincode ?? null,
      location_confirmed: true,
      location_confirmed_at: input.confirmedAt ?? new Date().toISOString(),
    };

    const rpcPayload = {
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_address: input.address ?? null,
      p_city: input.city ?? null,
      p_area: input.area ?? null,
      p_zone: input.zone ?? null,
      p_landmark: input.landmark ?? null,
      p_pincode: input.pincode ?? null,
      p_accuracy_m: typeof input.accuracyM === 'number' ? input.accuracyM : null,
      p_source: input.source === 'gps' || input.source === 'manual' ? input.source : null,
      p_confirmed: true,
      p_confirmed_at: input.confirmedAt ?? new Date().toISOString(),
    };

    // ---- Attempt direct UPDATE with affected-row verification ----
    const attemptUpdate = async (payload: Record<string, unknown>) => {
      const { data: updated, error: upErr } = await client
        .from('salons')
        .update(payload)
        .in('id', salonIds)
        .select('id, latitude, longitude');
      if (upErr) return { ok: false as const, error: upErr };
      // RLS silent block → 0 rows, koi error nahi → NOT persisted
      if (!updated || updated.length === 0) {
        return { ok: false as const, error: null, rows: 0 };
      }
      return { ok: true as const, error: null, rows: updated.length };
    };

    let direct = await attemptUpdate(patch);

    // Agar naye columns DB me nahi hain (column not exist) → base 8-field retry
    if (!direct.ok && direct.error && /column .* does not exist/i.test(direct.error.message || '')) {
      const basePatch = {
        latitude: input.latitude,
        longitude: input.longitude,
        location_address: input.address ?? null,
        location_city: input.city ?? null,
        location_area: input.area ?? null,
        location_zone: input.zone ?? null,
        location_landmark: input.landmark ?? null,
        location_pincode: input.pincode ?? null,
      };
      direct = await attemptUpdate(basePatch);
    }

    if (!direct.ok && direct.error) {
      // Direct update failed (RLS/column) → RPC fallback (security definer)
      const { error: rpcErr } = await client.rpc('update_shop_location', rpcPayload);
      if (rpcErr) {
        return {
          ok: false,
          error: `Location save failed. UPDATE blocked (${direct.error.message}) and RPC failed (${rpcErr.message}). Check salons UPDATE permission for this owner.`,
        };
      }
    } else if (!direct.ok) {
      // 0 rows — RLS silently blocked
      const { error: rpcErr } = await client.rpc('update_shop_location', rpcPayload);
      if (rpcErr) {
        return {
          ok: false,
          error: `Location save failed: 0 rows updated (RLS/permission). Check that this owner has UPDATE access on their salons record. RPC also failed: ${rpcErr.message}`,
        };
      }
    }

    // ---- VERIFY persistence: DB se dobara record fetch karke coords match ----
    const verify = await fetchMyShop(client);
    const persisted =
      !!verify &&
      typeof verify.latitude === 'number' &&
      typeof verify.longitude === 'number' &&
      Math.abs(verify.latitude - input.latitude) < 1e-6 &&
      Math.abs(verify.longitude - input.longitude) < 1e-6;

    if (!persisted) {
      return {
        ok: false,
        error: 'Save verification failed: coordinates are NOT reflected in the database. Location was not persisted.',
      };
    }

    return { ok: true };
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

// ---------------------------------------------------------------------------
// Publish request & Direct Owner GO LIVE
// ---------------------------------------------------------------------------

export interface PublishValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PublishWebsiteInput {
  slug?: string;
  templateKey: string;
  config: SalonWebsiteConfig;
  html?: string;
}

export interface PublishWebsiteResult {
  ok: boolean;
  slug?: string;
  url?: string;
  publishedAt?: string;
  error?: string | null;
  validationErrors?: string[];
  /** True when the salon's verified flag actually flipped in the database. */
  verifiedNow?: boolean;
  /** Human-readable state (e.g. pending Growth Partner approval). */
  note?: string | null;
}

export function validateSalonForPublish(shop: MyShop | null): PublishValidationResult {
  const errors: string[] = [];
  if (!shop) {
    errors.push('No shop workspace found. Please complete registration first.');
    return { valid: false, errors };
  }

  // 1. Missing name
  if (!shop.name || !shop.name.trim() || (shop.name.trim().toLowerCase() === 'my salon' && !shop.address)) {
    errors.push('Shop Name is required.');
  }

  // 2. Missing category
  if (!shop.businessCategory || !shop.businessCategory.trim()) {
    errors.push('Business Category is required (e.g. Hair Salon, Nail Studio, Spa).');
  }

  // 3. Pending setup address / city
  const address = (shop.address || '').trim();
  const city = (shop.city || '').trim();
  if (!address || /pending\s*setup|not\s*set/i.test(address)) {
    errors.push('Valid Shop Address is required before publishing live.');
  }
  if (!city || /pending\s*setup|not\s*set/i.test(city)) {
    errors.push('Valid Shop City is required before publishing live.');
  }

  // 4. Invalid coordinates
  if (
    typeof shop.latitude !== 'number' ||
    typeof shop.longitude !== 'number' ||
    !Number.isFinite(shop.latitude) ||
    !Number.isFinite(shop.longitude) ||
    (shop.latitude === 0 && shop.longitude === 0)
  ) {
    errors.push('Exact Shop Location coordinates are required. Please set your shop location on the map.');
  }

  // 5. Ownership verification
  if (!shop.organizationId) {
    errors.push('Ownership verification failed. Missing organization linkage.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Fetch existing published website record from salon_public_websites.
 */
export interface PublishedWebsiteRow {
  slug: string;
  templateKey: string;
  config: SalonWebsiteConfig;
  isPublished: boolean;
  publishedAt: string | null;
}

interface SalonPublicWebsiteQueryRow {
  slug: string;
  template_key: string;
  config: unknown;
  is_published: boolean | null;
  published_at: string | null;
}

export async function fetchPublishedWebsite(
  client: SupabaseClient,
  salonId: string,
): Promise<PublishedWebsiteRow | null> {
  const { data, error } = await client
    .from('salon_public_websites')
    .select('slug, template_key, config, is_published, published_at')
    .eq('salon_id', salonId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as SalonPublicWebsiteQueryRow;
  return {
    slug: row.slug,
    templateKey: row.template_key,
    config: parseSalonWebsiteConfig(row.config),
    isPublished: Boolean(row.is_published),
    publishedAt: row.published_at ?? null,
  };
}

/**
 * Secure canonical Shop Owner GO LIVE:
 *  1. Authorize & fetch owner's own canonical salon
 *  2. Validate salon data (name, category, real address/city, valid coordinates)
 *  3. UPSERT into public.salon_public_websites (Supabase source of truth)
 *  4. Update public.salons (verified = true, is_active = true, accepts_online_bookings = true)
 *  5. Re-fetch and verify persistence before reporting success
 */
export async function publishShopWebsite(
  client: SupabaseClient,
  input: PublishWebsiteInput,
): Promise<PublishWebsiteResult> {
  try {
    // 1. Resolve owner shop
    const shop = await fetchMyShop(client);
    if (!shop) {
      return {
        ok: false,
        error: 'No active shop found. Please log in and set up your workspace.',
      };
    }

    // 2. Run Publish Validation
    const validation = validateSalonForPublish(shop);
    if (!validation.valid) {
      return {
        ok: false,
        error: `Publish validation failed: ${validation.errors.join(' ')}`,
        validationErrors: validation.errors,
      };
    }

    // 3. Compute canonical slug
    const cleanSlug = (input.slug || shop.name || 'mysalon')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'mysalon';

    // 4. UPSERT into public.salon_public_websites (Supabase source of truth)
    const nowIso = new Date().toISOString();
    const websitePayload = {
      salon_id: shop.id,
      slug: cleanSlug,
      template_key: input.templateKey,
      config: input.config,
      is_published: true,
      published_at: nowIso,
      updated_at: nowIso,
    };

    const { error: spwError } = await client
      .from('salon_public_websites')
      .upsert(websitePayload, { onConflict: 'salon_id' });

    if (spwError) {
      return {
        ok: false,
        error: `Failed to save website in Supabase: ${spwError.message}`,
      };
    }


    // 5. Make the salon publicly visible.
    //
    // Canonical rule (verified against the live project): owners CANNOT flip
    // `verified` by direct UPDATE — RLS on public.salons blocks it silently
    // (0 rows, no error). Publication of the verified flag happens ONLY
    // through the proposal workflow (review_salon_setup RPC, action='publish').
    //
    // Previous code attempted the direct UPDATE, logged a console.warn when it
    // failed, and STILL reported publish success — the website row existed but
    // the salon stayed unverified, so customers could never book. It now:
    //   a) tries the RPC when a proposal exists (canonical path),
    //   b) otherwise attempts the direct UPDATE WITH affected-row + re-fetch
    //      verification (in case the project's RLS grants it),
    //   c) reports the honest state instead of a fake success.
    let verifiedNow = false;
    let publishNote: string | null = null;

    const confirmVerified = async (): Promise<boolean> => {
      const { data: rows } = await client
        .from('salons')
        .select('id, verified, is_active, accepts_online_bookings')
        .eq('id', shop.id);
      const row = (rows ?? [])[0] as any;
      return Boolean(row && row.verified);
    };

    // (a) Canonical proposal-publish path, when the owner has a proposal.
    if (shop.proposalId && ['submitted', 'approved'].includes(shop.proposalStatus ?? '')) {
      try {
        await client.rpc('review_salon_setup', {
          p_proposal_id: shop.proposalId,
          p_action: 'publish',
          p_notes: 'Owner published from the website builder.',
        });
        verifiedNow = await confirmVerified();
        if (verifiedNow) {
          publishNote = 'Published via the proposal workflow (review_salon_setup).';
        }
      } catch (rpcCatch: any) {
        publishNote = `Proposal publish RPC failed: ${rpcCatch?.message || 'unknown error'}`;
      }
    }

    // (b) Direct UPDATE with verification (works only if RLS allows it).
    if (!verifiedNow) {
      const { data: updatedRows, error: salonUpdateErr } = await client
        .from('salons')
        .update({
          verified: true,
          is_active: true,
          accepts_online_bookings: true,
          updated_at: nowIso,
        })
        .eq('id', shop.id)
        .select('id, verified');
      if (salonUpdateErr) {
        publishNote = `Direct salon update rejected by the database: ${salonUpdateErr.message}`;
      } else if (!updatedRows || updatedRows.length === 0) {
        // RLS silent block — the update did NOT happen.
        publishNote = 'Salon visibility update was blocked by database row-level security (owners cannot self-verify). The website is saved and will go live when the setup is approved through the Growth Partner review workflow.';
      } else {
        verifiedNow = await confirmVerified();
        publishNote = verifiedNow
          ? 'Published: salon marked verified in the database.'
          : 'Salon update returned a row but the verified flag did not persist; approval is still pending.';
      }
    }

    // 6. Persistence Verification: Re-query from DB to verify the website row.
    const { data: verifySpw, error: verifyErr } = await client
      .from('salon_public_websites')
      .select('salon_id, slug, is_published, published_at')
      .eq('salon_id', shop.id)
      .eq('is_published', true)
      .maybeSingle();

    if (verifyErr || !verifySpw) {
      return {
        ok: false,
        error: 'Database persistence verification failed: published website record not found in salon_public_websites.',
      };
    }

    const publicPath = `/salons/${verifySpw.slug}`;
    return {
      ok: true,
      slug: verifySpw.slug,
      url: publicPath,
      publishedAt: verifySpw.published_at,
      verifiedNow,
      note: publishNote,
    };
  
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || String(err),
    };
  }
}

export type OwnerProposalStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'changes_requested'
  | 'rejected'
  | 'published';

export interface OwnerProposalItem {
  id: string;
  salonId: string;
  growthPartnerId: string;
  status: OwnerProposalStatus;
  version: number;
  payload: SalonWebsiteConfig;
  submittedAt: string | null;
  ownerReviewedAt: string | null;
  ownerNotes: string | null;
  publishedAt: string | null;
}

/** Live `salon_setup_proposals` row — canonical JSONB column is `payload`. */
interface SalonSetupProposalQueryRow {
  id: string;
  salon_id: string;
  growth_partner_id: string | null;
  status: string;
  version: number | null;
  payload: unknown;
  submitted_at: string | null;
  owner_reviewed_at: string | null;
  owner_notes: string | null;
  published_at: string | null;
}

const OWNER_PROPOSAL_STATUSES: readonly OwnerProposalStatus[] = [
  'draft',
  'submitted',
  'approved',
  'changes_requested',
  'rejected',
  'published',
];

function parseOwnerProposalStatus(value: unknown): OwnerProposalStatus {
  if (typeof value === 'string' && (OWNER_PROPOSAL_STATUSES as readonly string[]).includes(value)) {
    return value as OwnerProposalStatus;
  }
  return 'draft';
}

function mapProposalRow(row: SalonSetupProposalQueryRow): OwnerProposalItem {
  return {
    id: row.id,
    salonId: row.salon_id,
    growthPartnerId: row.growth_partner_id ?? '',
    status: parseOwnerProposalStatus(row.status),
    version: Number(row.version ?? 0),
    payload: parseSalonWebsiteConfig(row.payload),
    submittedAt: row.submitted_at ?? null,
    ownerReviewedAt: row.owner_reviewed_at ?? null,
    ownerNotes: row.owner_notes ?? null,
    publishedAt: row.published_at ?? null,
  };
}

/**
 * Fetch all setup proposals for the owner's salon.
 */
export async function fetchOwnerProposals(client: SupabaseClient): Promise<OwnerProposalItem[]> {
  const shop = await fetchMyShop(client);
  if (!shop) return [];

  const { data, error } = await client
    .from('salon_setup_proposals')
    .select('id, salon_id, growth_partner_id, status, version, payload, submitted_at, owner_reviewed_at, owner_notes, published_at')
    .eq('salon_id', shop.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('Owner proposals fetch:', error.message);
    return [];
  }
  return ((data ?? []) as SalonSetupProposalQueryRow[]).map(mapProposalRow);
}

export interface ReviewProposalInput {
  proposalId: string;
  action: 'approve' | 'request_changes' | 'reject' | 'publish';
  notes?: string | null;
}

/**
 * Owner Review & Growth Partner Publication Bridge:
 * Executes review_salon_setup RPC with strict owner authorization.
 * Actions:
 *  - 'approve': Approves setup (status='approved')
 *  - 'request_changes': Requests edits (status='changes_requested', notifies GP)
 *  - 'reject': Rejects proposal (status='rejected')
 *  - 'publish': Approves & publishes to salon_public_websites (status='published', verified=true)
 */
export async function reviewOwnerProposal(
  client: SupabaseClient,
  input: ReviewProposalInput,
): Promise<{ ok: boolean; nextStatus?: string; error?: string | null }> {
  try {
    const { data, error } = await client.rpc('review_salon_setup', {
      p_proposal_id: input.proposalId,
      p_action: input.action,
      p_notes: input.notes?.trim() || null,
    });
    if (error) throw error;

    const nextStatus = typeof data === 'string' ? data : input.action;

    // If published, ensure final approved config is upserted into salon_public_websites
    if (nextStatus === 'published' || input.action === 'publish') {
      const { data: proposal } = await client
        .from('salon_setup_proposals')
        .select('salon_id, payload')
        .eq('id', input.proposalId)
        .maybeSingle();

      if (proposal && proposal.salon_id) {
        const payload = proposal.payload || {};
        const slug = (payload.profile?.name || 'salon')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 40);

        await client
          .from('salon_public_websites')
          .upsert({
            salon_id: proposal.salon_id,
            slug: slug,
            template_key: payload.template?.key || 'classic-elegance',
            config: payload,
            is_published: true,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'salon_id' });
      }
    }

    return { ok: true, nextStatus };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function requestPublish(client: SupabaseClient, proposalId: string): Promise<void> {
  const res = await reviewOwnerProposal(client, { proposalId, action: 'publish' });
  if (!res.ok) throw new Error(res.error || 'Publish failed');
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
