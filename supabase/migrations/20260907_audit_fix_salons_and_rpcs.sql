-- ============================================================================
-- Nexora audit fix — MISSING COLUMNS & RPCs (salons / proposals)
-- File: 20260907_audit_fix_salons_and_rpcs.sql
--
-- Fixes three schema/code contract breaks:
--
--   A. `salons` is missing columns the client reads and writes:
--      phone, address, city, area, accepts_online_bookings, rating_average
--      and the `verified` spelling used by the publish flow (the canonical
--      column is `is_verified`). fetchShop() SELECTs every one of them, so
--      before this migration the whole shop-status load failed.
--
--   B. `salon_setup_proposals` is missing the columns the owner dashboard
--      selects (growth_partner_id, version, payload, submitted_at,
--      owner_reviewed_at, owner_notes, published_at) and its status CHECK
--      rejects the statuses the workflow uses (submitted / changes_requested /
--      published / draft).
--
--   C. The client calls two RPCs that no migration defined:
--      update_salon_profile_secure(p_salon_id, p_updates)
--      review_salon_setup(p_proposal_id, p_action, p_notes)
--
-- All statements are idempotent and safe to re-run.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- A. salons — add the missing columns
-- ----------------------------------------------------------------------------
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS accepts_online_bookings BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating_average NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN;

-- Backfill the convenience mirrors from the canonical columns.
UPDATE public.salons SET
  phone    = COALESCE(phone, contact_number),
  address  = COALESCE(address, location_address),
  city     = COALESCE(city, location_city),
  area     = COALESCE(area, location_area),
  verified = COALESCE(verified, is_verified);

-- Keep `verified` and `is_verified` in sync whichever spelling a caller writes
-- (the publish flow writes `verified`, the base schema exposes `is_verified`).
CREATE OR REPLACE FUNCTION public.salons_sync_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM NEW.is_verified THEN
    -- Whichever side was explicitly written wins; the other follows.
    IF TG_OP = 'UPDATE' AND NEW.verified IS DISTINCT FROM OLD.verified THEN
      NEW.is_verified := NEW.verified;
    ELSIF TG_OP = 'UPDATE' AND NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      NEW.verified := NEW.is_verified;
    ELSE
      NEW.is_verified := COALESCE(NEW.is_verified, NEW.verified);
      NEW.verified    := COALESCE(NEW.verified, NEW.is_verified);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salons_sync_verified ON public.salons;
CREATE TRIGGER trg_salons_sync_verified
  BEFORE INSERT OR UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.salons_sync_verified();


-- ----------------------------------------------------------------------------
-- B. salon_setup_proposals — add the missing columns, widen the status CHECK
-- ----------------------------------------------------------------------------
ALTER TABLE public.salon_setup_proposals
  ADD COLUMN IF NOT EXISTS growth_partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_notes TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_salon_setup_proposals_salon_updated
  ON public.salon_setup_proposals(salon_id, updated_at DESC);

-- The workflow uses statuses beyond the original CHECK constraint.
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT c.conname INTO v_conname
  FROM pg_constraint c
  WHERE c.conrelid = 'public.salon_setup_proposals'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%status%'
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.salon_setup_proposals DROP CONSTRAINT %I', v_conname);
  END IF;

  ALTER TABLE public.salon_setup_proposals
    ADD CONSTRAINT salon_setup_proposals_status_check CHECK (
      status IN (
        'draft', 'pending', 'under_review', 'submitted', 'approved',
        'changes_requested', 'rejected', 'expired', 'published'
      )
    );
END $$;


-- ----------------------------------------------------------------------------
-- C1. update_salon_profile_secure
-- ----------------------------------------------------------------------------
-- Security-definer profile update used as the fallback when the direct RLS
-- update is blocked. Ownership is verified server-side via
-- user_manages_salon(); keys are whitelisted and mirrored into the canonical
-- location_* columns.
CREATE OR REPLACE FUNCTION public.update_salon_profile_secure(
  p_salon_id UUID,
  p_updates JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_manages_salon(p_salon_id) THEN
    RAISE EXCEPTION 'update_salon_profile_secure: caller does not manage salon %', p_salon_id;
  END IF;

  UPDATE public.salons s SET
    name              = COALESCE((p_updates ->> 'name'), s.name),
    description       = CASE WHEN p_updates ? 'description'
                              THEN p_updates ->> 'description' ELSE s.description END,
    business_category = CASE WHEN p_updates ? 'business_category'
                              THEN p_updates ->> 'business_category' ELSE s.business_category END,
    phone             = CASE WHEN p_updates ? 'phone'
                              THEN NULLIF(p_updates ->> 'phone', '') ELSE s.phone END,
    contact_number    = COALESCE(NULLIF(p_updates ->> 'phone', ''), s.contact_number),
    address           = CASE WHEN p_updates ? 'address'
                              THEN p_updates ->> 'address' ELSE s.address END,
    location_address  = CASE WHEN p_updates ? 'address'
                              THEN p_updates ->> 'address' ELSE s.location_address END,
    city              = CASE WHEN p_updates ? 'city'
                              THEN p_updates ->> 'city' ELSE s.city END,
    location_city     = CASE WHEN p_updates ? 'city'
                              THEN p_updates ->> 'city' ELSE s.location_city END,
    area              = CASE WHEN p_updates ? 'area'
                              THEN p_updates ->> 'area' ELSE s.area END,
    location_area     = CASE WHEN p_updates ? 'area'
                              THEN p_updates ->> 'area' ELSE s.location_area END,
    updated_at        = timezone('utc', now())
  WHERE s.id = p_salon_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.update_salon_profile_secure(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_salon_profile_secure(UUID, JSONB) TO authenticated;


-- ----------------------------------------------------------------------------
-- C2. review_salon_setup
-- ----------------------------------------------------------------------------
-- Proposal review / publication bridge called by the owner dashboard
-- (shopRepository.reviewOwnerProposal). Returns the new status string.
--
-- Actions:
--   'approve'         -> status 'approved'
--   'request_changes' -> status 'changes_requested'
--   'reject'          -> status 'rejected'
--   'publish'         -> status 'published' + salon goes live
--                        (verified / is_active / accepts_online_bookings)
--
-- Caller must be an active owner/manager/admin of the proposal's organization.
CREATE OR REPLACE FUNCTION public.review_salon_setup(
  p_proposal_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal   public.salon_setup_proposals%ROWTYPE;
  v_org_id     UUID;
  v_new_status TEXT;
BEGIN
  IF p_action NOT IN ('approve', 'request_changes', 'reject', 'publish') THEN
    RAISE EXCEPTION 'review_salon_setup: unknown action %', p_action;
  END IF;

  SELECT * INTO v_proposal
  FROM public.salon_setup_proposals
  WHERE id = p_proposal_id;

  IF v_proposal.id IS NULL THEN
    RAISE EXCEPTION 'review_salon_setup: proposal % not found', p_proposal_id;
  END IF;

  -- The proposal's organization, falling back to the salon's organization for
  -- proposals created before organization_id was reliably populated.
  v_org_id := COALESCE(
    v_proposal.organization_id,
    (SELECT s.organization_id FROM public.salons s WHERE s.id = v_proposal.salon_id)
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = v_org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'manager', 'admin')
      AND om.status = 'active'
  ) THEN
    RAISE EXCEPTION 'review_salon_setup: caller is not a manager of this organization';
  END IF;

  v_new_status := CASE p_action
    WHEN 'approve'         THEN 'approved'
    WHEN 'request_changes' THEN 'changes_requested'
    WHEN 'reject'          THEN 'rejected'
    WHEN 'publish'         THEN 'published'
  END;

  UPDATE public.salon_setup_proposals
  SET status            = v_new_status,
      reviewed_by       = auth.uid(),
      reviewed_at       = timezone('utc', now()),
      review_notes      = COALESCE(p_notes, review_notes),
      owner_reviewed_at = timezone('utc', now()),
      owner_notes       = COALESCE(p_notes, owner_notes),
      published_at      = CASE WHEN p_action = 'publish'
                               THEN timezone('utc', now()) ELSE published_at END,
      updated_at        = timezone('utc', now())
  WHERE id = p_proposal_id;

  IF p_action = 'publish' AND v_proposal.salon_id IS NOT NULL THEN
    UPDATE public.salons
    SET verified                 = true,
        is_active                = true,
        accepts_online_bookings  = true,
        deleted_at               = NULL,
        updated_at               = timezone('utc', now())
    WHERE id = v_proposal.salon_id;
  END IF;

  RETURN v_new_status;
END;
$$;

REVOKE ALL ON FUNCTION public.review_salon_setup(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_salon_setup(UUID, TEXT, TEXT) TO authenticated;


-- ----------------------------------------------------------------------------
-- C3. bootstrap_shop_owner
-- ----------------------------------------------------------------------------
-- Called by the registration stepper (shopRepository.bootstrapMyShop) to create
-- the owner's workspace: one organization, an active owner membership and the
-- salon row. Idempotent — returns the existing salon id when the caller
-- already owns a live salon. Returns the salon id as text-friendly UUID.
CREATE OR REPLACE FUNCTION public.bootstrap_shop_owner(
  p_business_name TEXT,
  p_business_category TEXT DEFAULT NULL,
  p_contact_number TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email   TEXT;
  v_org_id  UUID;
  v_salon_id UUID;
  v_slug    TEXT;
  v_base_slug TEXT;
  v_suffix  INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'bootstrap_shop_owner: caller is not authenticated';
  END IF;

  SELECT COALESCE(u.email, '') INTO v_email FROM auth.users u WHERE u.id = v_user_id;

  -- Idempotency: one live salon per owner.
  SELECT s.id INTO v_salon_id
  FROM public.salons s
  JOIN public.organization_members om ON om.organization_id = s.organization_id
  WHERE om.user_id = v_user_id
    AND om.role = 'owner'
    AND om.status = 'active'
    AND s.deleted_at IS NULL
  LIMIT 1;
  IF v_salon_id IS NOT NULL THEN
    RETURN v_salon_id;
  END IF;

  -- Organization (reuse an existing active org membership if present).
  SELECT om.organization_id INTO v_org_id
  FROM public.organization_members om
  WHERE om.user_id = v_user_id AND om.status = 'active'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug, email, phone)
    VALUES (
      COALESCE(NULLIF(p_business_name, ''), 'My Business'),
      'org-' || substr(md5(v_user_id::text || clock_timestamp()::text), 1, 12),
      v_email,
      NULLIF(p_contact_number, '')
    )
    RETURNING id INTO v_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, status, email)
    VALUES (v_org_id, v_user_id, 'owner', 'active', v_email);
  END IF;

  -- Unique slug: business name + incrementing suffix.
  v_base_slug := lower(regexp_replace(COALESCE(NULLIF(p_business_name, ''), 'salon'), '[^a-z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  IF v_base_slug = '' THEN
    v_base_slug := 'salon';
  END IF;
  v_base_slug := left(v_base_slug, 40);

  LOOP
    v_slug := CASE WHEN v_suffix = 0 THEN v_base_slug
                   ELSE v_base_slug || '-' || v_suffix END;
    BEGIN
      INSERT INTO public.salons (
        organization_id, owner_id, name, slug, business_category,
        contact_number, phone, email, is_active, verified, is_verified
      ) VALUES (
        v_org_id, v_user_id, COALESCE(NULLIF(p_business_name, ''), 'My Salon'),
        v_slug, COALESCE(NULLIF(p_business_category, ''), 'Salon'),
        COALESCE(p_contact_number, ''), COALESCE(p_contact_number, ''), v_email,
        true, false, false
      )
      RETURNING id INTO v_salon_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_suffix := v_suffix + 1;
      IF v_suffix > 50 THEN
        RAISE EXCEPTION 'bootstrap_shop_owner: could not allocate a unique slug';
      END IF;
    END;
  END LOOP;

  RETURN v_salon_id;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_shop_owner(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_shop_owner(TEXT, TEXT, TEXT) TO authenticated;
