-- ============================================================================
-- Nexora audit fix — MISSING TABLES
-- File: 20260907_audit_fix_missing_tables.sql
--
-- The application code queries five tables that NO earlier migration created
-- (and `profiles`, which the schema replaced with `salon_profiles` while the
-- client still reads/writes `profiles`). Every query below was derived from
-- the real call sites:
--
--   staff_schedules      src/lib/staffRepository.ts  (5 refs, incl. the
--                        `staff!inner(salon_id)` embed which REQUIRES the FK)
--   wallet_transactions  src/lib/shopRepository.ts  fetchWalletOverview()
--   owner_payouts        src/lib/shopRepository.ts  fetchWalletOverview()
--   offers               src/lib/shopRepository.ts  listOffers / createOffer
--   reviews              src/lib/staffRepository.ts fetchReviewsForStaff()
--   profiles             src/screens/Profile.tsx    load/save personal details
--
-- All statements are idempotent and safe to re-run.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. Ensure the shared updated_at trigger function exists (created by the base
--    schema migration, redefined defensively so this file stands alone).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;


-- ============================================================================
-- 1. staff_schedules — weekly working hours per staff member
-- ============================================================================
-- Contract (from staffRepository.ts):
--   id, staff_id, day_of_week (0-6), start_time, end_time, is_working
--   fetchAllSchedulesForSalon() embeds `staff!inner(salon_id)`, which only
--   works when a real FK staff_schedules.staff_id -> staff.id exists.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME WITHOUT TIME ZONE,
  end_time TIME WITHOUT TIME ZONE,
  is_working BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT staff_schedules_staff_id_day_of_week_key UNIQUE (staff_id, day_of_week),
  CONSTRAINT staff_schedules_times_check CHECK (
    start_time IS NULL OR end_time IS NULL OR start_time < end_time
  )
);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_id
  ON public.staff_schedules(staff_id);

DROP TRIGGER IF EXISTS trg_staff_schedules_updated_at ON public.staff_schedules;
CREATE TRIGGER trg_staff_schedules_updated_at
  BEFORE UPDATE ON public.staff_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

-- Salon owners/managers/admins manage their staff's schedules.
DROP POLICY IF EXISTS "staff_schedules_manager_all" ON public.staff_schedules;
CREATE POLICY "staff_schedules_manager_all"
  ON public.staff_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
    )
  );

-- Staff members can read and manage their own schedule.
DROP POLICY IF EXISTS "staff_schedules_staff_select" ON public.staff_schedules;
CREATE POLICY "staff_schedules_staff_select"
  ON public.staff_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = staff_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff_schedules_staff_update" ON public.staff_schedules;
CREATE POLICY "staff_schedules_staff_update"
  ON public.staff_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = staff_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = staff_id AND s.user_id = auth.uid()
    )
  );


-- ============================================================================
-- 2. wallet_transactions — owner credit/debit ledger
-- ============================================================================
-- Contract (from fetchWalletOverview):
--   id, user_id, amount_paise, tx_type ('credit'|'debit'), reason,
--   ref_type, ref_id, created_at
-- The ledger is append-only for clients: no UPDATE/DELETE policies.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
  amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (amount_paise >= 0),
  tx_type TEXT NOT NULL CHECK (tx_type IN ('credit', 'debit')),
  reason TEXT,
  ref_type TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id
  ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_salon_id
  ON public.wallet_transactions(salon_id) WHERE salon_id IS NOT NULL;

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users see their own ledger rows.
DROP POLICY IF EXISTS "wallet_transactions_select_own" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_select_own"
  ON public.wallet_transactions FOR SELECT
  USING (user_id = auth.uid());

-- Users may append ledger notes for themselves; salon managers may append
-- rows for their salon (e.g. booking-driven credits).
DROP POLICY IF EXISTS "wallet_transactions_insert_own" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_insert_own"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wallet_transactions_insert_salon" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_insert_salon"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (
    salon_id IS NOT NULL AND public.user_manages_salon(salon_id)
  );


-- ============================================================================
-- 3. owner_payouts — payout requests/summary for the owner wallet
-- ============================================================================
-- Contract (from fetchWalletOverview):
--   id, status ('pending'|'scheduled'|'processing'|'paid'|'failed'),
--   amount_paise, paid_at, created_at
-- IMPORTANT: the app queries this table WITHOUT a user filter, so the RLS
-- policy is what scopes rows to the signed-in owner.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.owner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
  amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (amount_paise >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'scheduled', 'processing', 'paid', 'failed')
  ),
  paid_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_owner_payouts_owner_id
  ON public.owner_payouts(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_salon_id
  ON public.owner_payouts(salon_id) WHERE salon_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_owner_payouts_updated_at ON public.owner_payouts;
CREATE TRIGGER trg_owner_payouts_updated_at
  BEFORE UPDATE ON public.owner_payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.owner_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_payouts_select_own" ON public.owner_payouts;
CREATE POLICY "owner_payouts_select_own"
  ON public.owner_payouts FOR SELECT
  USING (
    owner_id = auth.uid()
    OR (salon_id IS NOT NULL AND public.user_manages_salon(salon_id))
  );

-- Status transitions are made by salon managers (or the platform service role).
DROP POLICY IF EXISTS "owner_payouts_manager_update" ON public.owner_payouts;
CREATE POLICY "owner_payouts_manager_update"
  ON public.owner_payouts FOR UPDATE
  USING (salon_id IS NOT NULL AND public.user_manages_salon(salon_id))
  WITH CHECK (salon_id IS NOT NULL AND public.user_manages_salon(salon_id));

DROP POLICY IF EXISTS "owner_payouts_manager_insert" ON public.owner_payouts;
CREATE POLICY "owner_payouts_manager_insert"
  ON public.owner_payouts FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    OR (salon_id IS NOT NULL AND public.user_manages_salon(salon_id))
  );


-- ============================================================================
-- 4. offers — promotional offers/coupon codes per salon
-- ============================================================================
-- Contract (from listOffers / createOffer):
--   id, salon_id, name, code, description,
--   discount_type ('percent'|'fixed'), discount_value, is_active,
--   valid_from, valid_until, created_at
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT offers_validity_window_check CHECK (
    valid_until IS NULL OR valid_until >= valid_from
  )
);

CREATE INDEX IF NOT EXISTS idx_offers_salon_id
  ON public.offers(salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_active
  ON public.offers(salon_id) WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_offers_updated_at ON public.offers;
CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offers_manager_all" ON public.offers;
CREATE POLICY "offers_manager_all"
  ON public.offers FOR ALL
  USING (public.user_manages_salon(salon_id))
  WITH CHECK (public.user_manages_salon(salon_id));

-- Staff of the salon can read offers shown to customers.
DROP POLICY IF EXISTS "offers_staff_select" ON public.offers;
CREATE POLICY "offers_staff_select"
  ON public.offers FOR SELECT
  USING (public.user_is_salon_staff(salon_id));

-- Public can read ACTIVE offers of VERIFIED salons (customer-facing website).
DROP POLICY IF EXISTS "offers_public_read_active" ON public.offers;
CREATE POLICY "offers_public_read_active"
  ON public.offers FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = salon_id AND s.is_verified = true AND s.deleted_at IS NULL
    )
  );


-- ============================================================================
-- 5. reviews — customer ratings for a salon (and optionally a staff member)
-- ============================================================================
-- The only code reader today is fetchReviewsForStaff() which selects * by
-- salon_id; the Reviews screen renders rating / comment / customer name /
-- service / reply. Columns below model that contract.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  service_name TEXT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_salon_id
  ON public.reviews(salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_staff_id
  ON public.reviews(staff_id) WHERE staff_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id
  ON public.reviews(booking_id) WHERE booking_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public: read visible reviews of VERIFIED salons (customer-facing website).
DROP POLICY IF EXISTS "reviews_public_select" ON public.reviews;
CREATE POLICY "reviews_public_select"
  ON public.reviews FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = salon_id AND s.is_verified = true AND s.deleted_at IS NULL
    )
  );

-- Salon managers and staff can read all reviews of their salon (incl. hidden).
DROP POLICY IF EXISTS "reviews_manager_select" ON public.reviews;
CREATE POLICY "reviews_manager_select"
  ON public.reviews FOR SELECT
  USING (public.user_manages_salon(salon_id));

DROP POLICY IF EXISTS "reviews_staff_select" ON public.reviews;
CREATE POLICY "reviews_staff_select"
  ON public.reviews FOR SELECT
  USING (public.user_is_salon_staff(salon_id));

-- Any authenticated user may leave a review (rating bounded by CHECK).
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON public.reviews;
CREATE POLICY "reviews_authenticated_insert"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = salon_id AND s.deleted_at IS NULL
    )
  );

-- Only salon managers can reply / moderate.
DROP POLICY IF EXISTS "reviews_manager_update" ON public.reviews;
CREATE POLICY "reviews_manager_update"
  ON public.reviews FOR UPDATE
  USING (public.user_manages_salon(salon_id))
  WITH CHECK (public.user_manages_salon(salon_id));

-- Managers can remove abusive reviews.
DROP POLICY IF EXISTS "reviews_manager_delete" ON public.reviews;
CREATE POLICY "reviews_manager_delete"
  ON public.reviews FOR DELETE
  USING (public.user_manages_salon(salon_id));

-- ----------------------------------------------------------------------------
-- 5a. Keep denormalised rating aggregates in sync with reviews:
--     - salons.rating_average        (avg rating per salon)
--     - staff.rating_average / staff.review_count (when staff_id is set)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_review_aggregates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_salon_id UUID;
  v_staff_id UUID;
BEGIN
  v_salon_id := COALESCE(NEW.salon_id, OLD.salon_id);
  v_staff_id := COALESCE(NEW.staff_id, OLD.staff_id);

  UPDATE public.salons s
  SET rating_average = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 2)
        FROM public.reviews r
        WHERE r.salon_id = v_salon_id AND r.is_visible = true
      ), 0)
  WHERE s.id = v_salon_id;

  IF v_staff_id IS NOT NULL THEN
    UPDATE public.staff st
    SET rating_average = COALESCE((
          SELECT ROUND(AVG(r.rating)::numeric, 2)
          FROM public.reviews r
          WHERE r.staff_id = v_staff_id AND r.is_visible = true
        ), 0),
        review_count = (
          SELECT COUNT(*)
          FROM public.reviews r
          WHERE r.staff_id = v_staff_id AND r.is_visible = true
        )
    WHERE st.id = v_staff_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_refresh_aggregates ON public.reviews;
CREATE TRIGGER trg_reviews_refresh_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_review_aggregates();


-- ============================================================================
-- 6. profiles — per-auth-user personal details (the app's Profile screen)
-- ============================================================================
-- The base schema created `salon_profiles` (business fields), but Profile.tsx
-- reads/writes `public.profiles` (id, full_name, phone). This creates the
-- missing table, auto-populates it on signup and backfills existing users.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Auto-create the profile row whenever a new auth user appears.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill profiles for users created before this migration. Prefers the
-- business contact captured in salon_profiles, then auth metadata.
INSERT INTO public.profiles (id, full_name, phone)
SELECT u.id,
       COALESCE(sp.contact_number, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
       NULLIF(sp.contact_number, '')
FROM auth.users u
LEFT JOIN public.salon_profiles sp ON sp.id = u.id
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 7. GRANTS — Supabase default privileges do not automatically cover tables
--    created inside migrations in every project, so grant explicitly.
--    RLS above decides which rows are reachable; grants only decide which
--    commands may be attempted.
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_schedules      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_payouts        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews              TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.profiles             TO authenticated;

GRANT SELECT ON public.offers  TO anon;
GRANT SELECT ON public.reviews TO anon;
