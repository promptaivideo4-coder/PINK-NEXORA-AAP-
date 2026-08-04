// Owner data layer — replaces localStorage business data with the shared
// Supabase project (qwaehqsmodekbgvnaavz).
//
// All reads/writes are RLS-scoped server-side:
//   - owners see/manage only salons they own (organization_members role=owner)
//     via private.can_manage_salon_settings() policies (20260804 migration)
//   - money rows (payouts) are read-only here; settlement runs server-side
//     daily at 22:00 IST (locked business rule #5)
// No service_role, no secrets — anon/publishable key + auth.uid() only.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface OwnerSalon {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  address: string | null;
  area: string | null;
  city: string | null;
  business_category: string | null;
  cover_image_path: string | null;
  rating_average: number;
  review_count: number;
  verified: boolean;
  is_active: boolean;
  accepts_online_bookings: boolean;
  starting_price_paise: number | null;
  organization_id: string | null;
}

export interface OwnerService {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_paise: number;
  is_active: boolean;
  is_bookable_online: boolean;
}

export interface OwnerStaff {
  id: string;
  salon_id: string;
  name: string;
  role: string | null;
  bio: string | null;
  is_active: boolean;
}

export interface OwnerBooking {
  id: string;
  salon_id: string;
  customer_id: string | null;
  appointment_start: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  total_amount_paise: number;
  advance_amount_paise: number;
  created_at: string;
  customer?: { full_name: string | null; email: string | null } | null;
}

export interface OwnerOffer {
  id: string;
  salon_id: string;
  title: string;
  description: string | null;
  discount_type: string | null;
  discount_value: number | null;
  is_active: boolean;
}

export interface OwnerPayout {
  id: string;
  salon_id: string;
  run_date: string;
  booking_count: number;
  gross_paise: number;
  platform_fee_paise: number;
  amount_paise: number;
  status: string;
  payout_reference: string | null;
  created_at: string;
}

export interface SalonReview {
  id: string;
  salon_id: string | null;
  rating: number | null;
  comment: string | null;
  author: string | null;
  verified: boolean;
  created_at: string | null;
}

export interface SetupProposal {
  id: string;
  onboarding_application_id: string | null;
  salon_id: string | null;
  owner_user_id: string | null;
  owner_email: string | null;
  growth_partner_id: string | null;
  status: string;
  payload: Record<string, unknown> | null;
  version: number | null;
  owner_notes: string | null;
  submitted_at: string | null;
  published_at: string | null;
  updated_at: string | null;
}

const isMissingRelationError = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /could not find a (table|schema)|relation .* does not exist/i.test(error.message || '')
  );
};

// ---------------------------------------------------------------------------
// Salon resolution — the owner's shops via organization_members.
// ---------------------------------------------------------------------------
export async function resolveOwnerSalons(
  client: SupabaseClient,
  userId: string,
): Promise<OwnerSalon[]> {
  let orgIds: string[] = [];
  const { data: memberships, error: memError } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .eq('status', 'active');
  if (memError && !isMissingRelationError(memError)) throw memError;
  orgIds = (memberships ?? []).map((m: any) => m.organization_id).filter(Boolean);

  const SALON_COLUMNS =
    'id, slug, name, description, address, area, city, business_category, cover_image_path, rating_average, review_count, verified, is_active, accepts_online_bookings, starting_price_paise, organization_id';

  if (orgIds.length > 0) {
    const { data, error } = await client
      .from('salons')
      .select(SALON_COLUMNS)
      .in('organization_id', orgIds)
      .limit(20);
    if (error) throw error;
    if ((data ?? []).length > 0) return (data ?? []) as OwnerSalon[];
  }

  // Fallback: RLS already limits this to manageable/verified salons.
  const { data, error } = await client.from('salons').select(SALON_COLUMNS).limit(20);
  if (error) throw error;
  return (data ?? []) as OwnerSalon[];
}

export async function updateSalonProfile(
  client: SupabaseClient,
  salonId: string,
  patch: Partial<
    Pick<
      OwnerSalon,
      'name' | 'description' | 'address' | 'area' | 'city' | 'business_category' | 'cover_image_path'
    >
  >,
): Promise<void> {
  const { error } = await client.from('salons').update(patch).eq('id', salonId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Services CRUD.
// ---------------------------------------------------------------------------
const SERVICE_COLUMNS =
  'id, salon_id, name, description, duration_minutes, price_paise, is_active, is_bookable_online';

export async function fetchServices(
  client: SupabaseClient,
  salonId: string,
): Promise<OwnerService[]> {
  const { data, error } = await client
    .from('services')
    .select(SERVICE_COLUMNS)
    .eq('salon_id', salonId)
    .order('name');
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return (data ?? []) as OwnerService[];
}

export async function createService(
  client: SupabaseClient,
  input: {
    salonId: string;
    name: string;
    description?: string;
    durationMinutes: number;
    pricePaise: number;
    isBookableOnline?: boolean;
  },
): Promise<OwnerService> {
  const { data, error } = await client
    .from('services')
    .insert({
      salon_id: input.salonId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      duration_minutes: input.durationMinutes,
      price_paise: input.pricePaise,
      is_active: true,
      is_bookable_online: input.isBookableOnline !== false,
    })
    .select(SERVICE_COLUMNS)
    .single();
  if (error) throw error;
  return data as OwnerService;
}

export async function updateService(
  client: SupabaseClient,
  serviceId: string,
  patch: Partial<{
    name: string;
    description: string | null;
    duration_minutes: number;
    price_paise: number;
    is_active: boolean;
    is_bookable_online: boolean;
  }>,
): Promise<void> {
  const { error } = await client.from('services').update(patch).eq('id', serviceId);
  if (error) throw error;
}

export async function deleteService(client: SupabaseClient, serviceId: string): Promise<void> {
  const { error } = await client.from('services').delete().eq('id', serviceId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Staff CRUD.
// ---------------------------------------------------------------------------
const STAFF_COLUMNS = 'id, salon_id, name, role, bio, is_active';

export async function fetchStaff(client: SupabaseClient, salonId: string): Promise<OwnerStaff[]> {
  const { data, error } = await client
    .from('staff')
    .select(STAFF_COLUMNS)
    .eq('salon_id', salonId)
    .order('name');
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return (data ?? []) as OwnerStaff[];
}

export async function createStaff(
  client: SupabaseClient,
  input: { salonId: string; name: string; role?: string; bio?: string },
): Promise<OwnerStaff> {
  const { data, error } = await client
    .from('staff')
    .insert({
      salon_id: input.salonId,
      name: input.name.trim(),
      role: input.role?.trim() || null,
      bio: input.bio?.trim() || null,
      is_active: true,
    })
    .select(STAFF_COLUMNS)
    .single();
  if (error) throw error;
  return data as OwnerStaff;
}

export async function updateStaff(
  client: SupabaseClient,
  staffId: string,
  patch: Partial<{ name: string; role: string | null; bio: string | null; is_active: boolean }>,
): Promise<void> {
  const { error } = await client.from('staff').update(patch).eq('id', staffId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Bookings — the salon's real bookings (RLS: owner-managed salons only).
// ---------------------------------------------------------------------------
const BOOKING_COLUMNS =
  'id, salon_id, customer_id, appointment_start, status, total_amount_paise, advance_amount_paise, created_at';

export async function fetchBookings(
  client: SupabaseClient,
  salonId: string,
): Promise<OwnerBooking[]> {
  const { data, error } = await client
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('salon_id', salonId)
    .order('appointment_start', { ascending: false })
    .limit(100);
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  const bookings = (data ?? []) as OwnerBooking[];

  // Best-effort customer names via profiles (select-only).
  const customerIds = Array.from(
    new Set(bookings.map((b) => b.customer_id).filter((id): id is string => Boolean(id))),
  );
  if (customerIds.length > 0) {
    try {
      const { data: profiles } = await client
        .from('profiles')
        .select('id, full_name, email')
        .in('id', customerIds);
      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      for (const booking of bookings) {
        if (booking.customer_id) booking.customer = byId.get(booking.customer_id) ?? null;
      }
    } catch {
      // names are decorative — never block bookings on them
    }
  }
  return bookings;
}

export async function updateBookingStatus(
  client: SupabaseClient,
  bookingId: string,
  status: OwnerBooking['status'],
): Promise<void> {
  const { error } = await client.from('bookings').update({ status }).eq('id', bookingId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Offers CRUD.
// ---------------------------------------------------------------------------
export async function fetchOffers(client: SupabaseClient, salonId: string): Promise<OwnerOffer[]> {
  const { data, error } = await client
    .from('offers')
    .select('id, salon_id, title, description, discount_type, discount_value, is_active')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return (data ?? []) as OwnerOffer[];
}

// ---------------------------------------------------------------------------
// Payouts — READ ONLY (locked rule: settlement runs daily at 22:00 IST).
// ---------------------------------------------------------------------------
export async function fetchOwnerPayouts(
  client: SupabaseClient,
  salonId: string,
): Promise<OwnerPayout[]> {
  const { data, error } = await client
    .from('owner_payouts')
    .select(
      'id, salon_id, run_date, booking_count, gross_paise, platform_fee_paise, amount_paise, status, payout_reference, created_at',
    )
    .eq('salon_id', salonId)
    .order('run_date', { ascending: false })
    .limit(50);
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return (data ?? []) as OwnerPayout[];
}

// ---------------------------------------------------------------------------
// Reviews for the salon.
// ---------------------------------------------------------------------------
export async function fetchSalonReviews(
  client: SupabaseClient,
  salonId: string,
): Promise<SalonReview[]> {
  const { data, error } = await client
    .from('reviews')
    .select('id, salon_id, rating, comment, author, verified, created_at')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return (data ?? []) as SalonReview[];
}

// ---------------------------------------------------------------------------
// Website setup proposals — the owner review system.
// Proposals are prepared upstream (Growth Partner / onboarding); the owner
// reviews them and calls review_salon_setup() to approve / request changes /
// reject / publish. Publishing writes the live salon + website rows and the
// shop attribution server-side.
// ---------------------------------------------------------------------------
const PROPOSAL_COLUMNS =
  'id, onboarding_application_id, salon_id, owner_user_id, owner_email, growth_partner_id, status, payload, version, owner_notes, submitted_at, published_at, updated_at';

export async function fetchOwnerProposals(
  client: SupabaseClient,
  salonIds: string[],
): Promise<SetupProposal[]> {
  if (salonIds.length === 0) return [];
  const { data, error } = await client
    .from('salon_setup_proposals')
    .select(PROPOSAL_COLUMNS)
    .in('salon_id', salonIds)
    .order('updated_at', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return (data ?? []) as SetupProposal[];
}

export type ProposalAction = 'approve' | 'publish' | 'request_changes' | 'reject';

export async function reviewProposal(
  client: SupabaseClient,
  proposalId: string,
  action: ProposalAction,
  notes?: string,
): Promise<void> {
  const { error } = await client.rpc('review_salon_setup', {
    p_proposal_id: proposalId,
    p_action: action,
    p_notes: notes?.trim() || null,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Published website visibility check (what the customer app actually sees).
// ---------------------------------------------------------------------------
export async function fetchPublicWebsite(
  client: SupabaseClient,
  salonId: string,
): Promise<{ slug: string; is_published: boolean; config: Record<string, unknown> } | null> {
  const { data, error } = await client
    .from('salon_public_websites')
    .select('slug, is_published, config')
    .eq('salon_id', salonId)
    .maybeSingle();
  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }
  return data;
}
