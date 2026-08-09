-- =============================================================
-- NexoraOS Staff Management — Phase 1: Database Foundation
-- =============================================================
-- Run date: 2026-08-09
--
-- EXISTING TABLES REUSED (no recreation):
--   - salons              (business/store — id, organization_id, name, ...)
--   - organization_members (user_id, organization_id, role, status)
--   - services            (salon_id, name, price_paise, duration_minutes, ...)
--   - staff               (EXTENDED with new columns)
--   - staff_services      (staff_id, service_id, custom_price_paise, ...)
--   - staff_schedules     (staff_id, day_of_week, start_time, end_time, is_working)
--   - commission_plans    (growth-partner level — NOT reused for staff commission)
--
-- NEW TABLES CREATED:
--   1. staff_emergency_contacts
--   2. skills
--   3. staff_skills
--   4. staff_service_commissions
--   5. staff_commission_settings
--
-- EXISTING TABLE ALTERED:
--   - staff               (add missing columns)
--   - staff_services      (add is_active column)
-- =============================================================


-- =============================================================
-- 1. EXTEND EXISTING `staff` TABLE
-- =============================================================
-- Existing columns already present:
--   id, salon_id, organization_member_id, name, email, phone,
--   role_title, specialty, bio, avatar_path, commission_percent,
--   employment_status, live_status, rating_average, review_count,
--   created_at, updated_at, deleted_at
--
-- We ADD only the columns that do NOT already exist.

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS full_name            TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo_url    TEXT,
  ADD COLUMN IF NOT EXISTS gender               TEXT
    CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS date_of_birth        DATE,
  ADD COLUMN IF NOT EXISTS joining_date         DATE,
  ADD COLUMN IF NOT EXISTS primary_role         TEXT,
  ADD COLUMN IF NOT EXISTS experience_years     INTEGER DEFAULT 0
    CHECK (experience_years >= 0),
  ADD COLUMN IF NOT EXISTS is_active            BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_public            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS self_service_enabled BOOLEAN NOT NULL DEFAULT false;

-- Backfill full_name from existing `name` column
UPDATE public.staff SET full_name = name WHERE full_name IS NULL;

-- Normalize employment_status values to match spec (active/probation/inactive/terminated)
-- Existing data may use 'active' already (default). Ensure constraint covers all values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.staff'::regclass
      AND conname = 'staff_employment_status_check'
  ) THEN
    ALTER TABLE public.staff
      ADD CONSTRAINT staff_employment_status_check
      CHECK (employment_status IN ('active', 'probation', 'inactive', 'terminated'));
  END IF;
END $$;

-- =============================================================
-- 2. EXTEND EXISTING `staff_services` TABLE
-- =============================================================
-- Already has: staff_id, service_id, custom_price_paise,
--   custom_duration_minutes, commission_percent_override
-- Add is_active column if missing.

ALTER TABLE public.staff_services
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- Add unique constraint if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.staff_services'::regclass
      AND conname = 'staff_services_staff_id_service_id_key'
  ) THEN
    ALTER TABLE public.staff_services
      ADD CONSTRAINT staff_services_staff_id_service_id_key UNIQUE (staff_id, service_id);
  END IF;
END $$;

-- Add foreign keys if not present (staff_services may not have them)
DO $$
BEGIN
  -- staff_id FK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.staff_services'::regclass
      AND conname = 'staff_services_staff_id_fkey'
  ) THEN
    ALTER TABLE public.staff_services
      ADD CONSTRAINT staff_services_staff_id_fkey
      FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;
  END IF;
  -- service_id FK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.staff_services'::regclass
      AND conname = 'staff_services_service_id_fkey'
  ) THEN
    ALTER TABLE public.staff_services
      ADD CONSTRAINT staff_services_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
END $$;


-- =============================================================
-- 3. staff_emergency_contacts (NEW)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_emergency_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id     UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- =============================================================
-- 4. skills (NEW)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (business_id, name)
);


-- =============================================================
-- 5. staff_skills (NEW — junction)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_skills (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  skill_id   UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (staff_id, skill_id)
);


-- =============================================================
-- 6. staff_service_commissions (NEW)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_service_commissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id         UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  service_id       UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  commission_type  TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (
      (commission_type = 'percentage' AND commission_value >= 0 AND commission_value <= 100)
      OR
      (commission_type = 'fixed' AND commission_value >= 0)
    ),
  effective_from   DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to     DATE,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- =============================================================
-- 7. staff_commission_settings (NEW)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_commission_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id             UUID NOT NULL UNIQUE REFERENCES public.staff(id) ON DELETE CASCADE,
  commission_model     TEXT NOT NULL DEFAULT 'percentage'
    CHECK (commission_model IN ('percentage', 'fixed', 'tiered')),
  default_percentage   NUMERIC(5,2) DEFAULT 0
    CHECK (default_percentage >= 0 AND default_percentage <= 100),
  default_fixed_amount NUMERIC(12,2) DEFAULT 0
    CHECK (default_fixed_amount >= 0),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- =============================================================
-- INDEXES
-- =============================================================

-- staff table
CREATE INDEX IF NOT EXISTS idx_staff_salon_id
  ON public.staff (salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id
  ON public.staff (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_phone
  ON public.staff (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_email
  ON public.staff (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_employment_status
  ON public.staff (employment_status);
CREATE INDEX IF NOT EXISTS idx_staff_is_active
  ON public.staff (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_staff_is_public
  ON public.staff (is_public) WHERE is_public = true;

-- staff_emergency_contacts
CREATE INDEX IF NOT EXISTS idx_staff_emergency_contacts_staff_id
  ON public.staff_emergency_contacts (staff_id);

-- skills
CREATE INDEX IF NOT EXISTS idx_skills_business_id
  ON public.skills (business_id);

-- staff_skills
CREATE INDEX IF NOT EXISTS idx_staff_skills_staff_id
  ON public.staff_skills (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_skills_skill_id
  ON public.staff_skills (skill_id);

-- staff_services
CREATE INDEX IF NOT EXISTS idx_staff_services_staff_id
  ON public.staff_services (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service_id
  ON public.staff_services (service_id);

-- staff_service_commissions
CREATE INDEX IF NOT EXISTS idx_staff_service_commissions_staff_id
  ON public.staff_service_commissions (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_service_commissions_service_id
  ON public.staff_service_commissions (service_id);
CREATE INDEX IF NOT EXISTS idx_staff_service_commissions_active
  ON public.staff_service_commissions (staff_id, service_id)
  WHERE is_active = true;

-- staff_commission_settings
CREATE INDEX IF NOT EXISTS idx_staff_commission_settings_staff_id
  ON public.staff_commission_settings (staff_id);


-- =============================================================
-- UPDATED_AT TRIGGERS
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_updated_at ON public.staff;
CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_emergency_contacts_updated_at ON public.staff_emergency_contacts;
CREATE TRIGGER trg_staff_emergency_contacts_updated_at
  BEFORE UPDATE ON public.staff_emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_service_commissions_updated_at ON public.staff_service_commissions;
CREATE TRIGGER trg_staff_service_commissions_updated_at
  BEFORE UPDATE ON public.staff_service_commissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_commission_settings_updated_at ON public.staff_commission_settings;
CREATE TRIGGER trg_staff_commission_settings_updated_at
  BEFORE UPDATE ON public.staff_commission_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.staff                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_emergency_contacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_skills              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_service_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_commission_settings ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- RLS HELPER: user_manages_salon(p_salon_id UUID)
-- =============================================================
-- Uses existing organization_members (user_id, role, status)
-- and salons (id, organization_id, deleted_at) tables.

CREATE OR REPLACE FUNCTION public.user_manages_salon(p_salon_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.salons s ON s.organization_id = om.organization_id
    WHERE s.id = p_salon_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'manager', 'admin')
      AND om.status = 'active'
      AND s.deleted_at IS NULL
  );
$$;


-- =============================================================
-- RLS POLICIES: staff (manager/owner CRUD)
-- =============================================================

DROP POLICY IF EXISTS staff_manager_select ON public.staff;
CREATE POLICY staff_manager_select
  ON public.staff FOR SELECT
  USING (public.user_manages_salon(salon_id));

DROP POLICY IF EXISTS staff_manager_insert ON public.staff;
CREATE POLICY staff_manager_insert
  ON public.staff FOR INSERT
  WITH CHECK (public.user_manages_salon(salon_id));

DROP POLICY IF EXISTS staff_manager_update ON public.staff;
CREATE POLICY staff_manager_update
  ON public.staff FOR UPDATE
  USING (public.user_manages_salon(salon_id))
  WITH CHECK (public.user_manages_salon(salon_id));

DROP POLICY IF EXISTS staff_manager_delete ON public.staff;
CREATE POLICY staff_manager_delete
  ON public.staff FOR DELETE
  USING (public.user_manages_salon(salon_id));

-- Public read: only active + public staff (for customer-facing website)
DROP POLICY IF EXISTS staff_public_read ON public.staff;
CREATE POLICY staff_public_read
  ON public.staff FOR SELECT
  USING (is_active = true AND is_public = true AND deleted_at IS NULL);


-- =============================================================
-- RLS POLICIES: staff_emergency_contacts
-- =============================================================

DROP POLICY IF EXISTS staff_emergency_manager_select ON public.staff_emergency_contacts;
CREATE POLICY staff_emergency_manager_select
  ON public.staff_emergency_contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_emergency_manager_insert ON public.staff_emergency_contacts;
CREATE POLICY staff_emergency_manager_insert
  ON public.staff_emergency_contacts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_emergency_manager_update ON public.staff_emergency_contacts;
CREATE POLICY staff_emergency_manager_update
  ON public.staff_emergency_contacts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_emergency_manager_delete ON public.staff_emergency_contacts;
CREATE POLICY staff_emergency_manager_delete
  ON public.staff_emergency_contacts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));


-- =============================================================
-- RLS POLICIES: skills
-- =============================================================

DROP POLICY IF EXISTS skills_manager_select ON public.skills;
CREATE POLICY skills_manager_select
  ON public.skills FOR SELECT
  USING (public.user_manages_salon(business_id));

DROP POLICY IF EXISTS skills_manager_insert ON public.skills;
CREATE POLICY skills_manager_insert
  ON public.skills FOR INSERT
  WITH CHECK (public.user_manages_salon(business_id));

DROP POLICY IF EXISTS skills_manager_update ON public.skills;
CREATE POLICY skills_manager_update
  ON public.skills FOR UPDATE
  USING (public.user_manages_salon(business_id))
  WITH CHECK (public.user_manages_salon(business_id));

DROP POLICY IF EXISTS skills_manager_delete ON public.skills;
CREATE POLICY skills_manager_delete
  ON public.skills FOR DELETE
  USING (public.user_manages_salon(business_id));

-- Public can read skills (needed to display staff specializations)
DROP POLICY IF EXISTS skills_public_read ON public.skills;
CREATE POLICY skills_public_read
  ON public.skills FOR SELECT
  USING (true);


-- =============================================================
-- RLS POLICIES: staff_skills
-- =============================================================

DROP POLICY IF EXISTS staff_skills_manager_select ON public.staff_skills;
CREATE POLICY staff_skills_manager_select
  ON public.staff_skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_skills_manager_insert ON public.staff_skills;
CREATE POLICY staff_skills_manager_insert
  ON public.staff_skills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_skills_manager_delete ON public.staff_skills;
CREATE POLICY staff_skills_manager_delete
  ON public.staff_skills FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

-- Public read for public staff skills
DROP POLICY IF EXISTS staff_skills_public_read ON public.staff_skills;
CREATE POLICY staff_skills_public_read
  ON public.staff_skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND s.is_active = true AND s.is_public = true AND s.deleted_at IS NULL
  ));


-- =============================================================
-- RLS POLICIES: staff_services
-- =============================================================

DROP POLICY IF EXISTS staff_services_manager_select ON public.staff_services;
CREATE POLICY staff_services_manager_select
  ON public.staff_services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_services_manager_insert ON public.staff_services;
CREATE POLICY staff_services_manager_insert
  ON public.staff_services FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_services_manager_update ON public.staff_services;
CREATE POLICY staff_services_manager_update
  ON public.staff_services FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_services_manager_delete ON public.staff_services;
CREATE POLICY staff_services_manager_delete
  ON public.staff_services FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

-- Public read for public staff services
DROP POLICY IF EXISTS staff_services_public_read ON public.staff_services;
CREATE POLICY staff_services_public_read
  ON public.staff_services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND s.is_active = true AND s.is_public = true AND s.deleted_at IS NULL
  ));


-- =============================================================
-- RLS POLICIES: staff_service_commissions
-- =============================================================

DROP POLICY IF EXISTS staff_commission_manager_select ON public.staff_service_commissions;
CREATE POLICY staff_commission_manager_select
  ON public.staff_service_commissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_commission_manager_insert ON public.staff_service_commissions;
CREATE POLICY staff_commission_manager_insert
  ON public.staff_service_commissions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_commission_manager_update ON public.staff_service_commissions;
CREATE POLICY staff_commission_manager_update
  ON public.staff_service_commissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_commission_manager_delete ON public.staff_service_commissions;
CREATE POLICY staff_commission_manager_delete
  ON public.staff_service_commissions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));


-- =============================================================
-- RLS POLICIES: staff_commission_settings
-- =============================================================

DROP POLICY IF EXISTS staff_comm_settings_manager_select ON public.staff_commission_settings;
CREATE POLICY staff_comm_settings_manager_select
  ON public.staff_commission_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_comm_settings_manager_insert ON public.staff_commission_settings;
CREATE POLICY staff_comm_settings_manager_insert
  ON public.staff_commission_settings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_comm_settings_manager_update ON public.staff_commission_settings;
CREATE POLICY staff_comm_settings_manager_update
  ON public.staff_commission_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));

DROP POLICY IF EXISTS staff_comm_settings_manager_delete ON public.staff_commission_settings;
CREATE POLICY staff_comm_settings_manager_delete
  ON public.staff_commission_settings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)
  ));
