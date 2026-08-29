-- =============================================================
-- PINK-NEXORA-AAP - Base Schema: Core Tables
-- =============================================================
-- RUN THIS FIRST - Before all staff management migrations
-- Creates the foundational tables that all other migrations depend on
-- 
-- Tables created:
--   1. organizations
--   2. organization_members
--   3. salons
--   4. services
--   5. customers
--   6. bookings
--   7. booking_items
--   8. salon_hours
--   9. salon_public_websites
--   10. salon_setup_proposals
-- =============================================================


-- =============================================================
-- 1. organizations - Business organizations/tenants
-- =============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_email ON public.organizations(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active) WHERE is_active = true;


-- =============================================================
-- 2. organization_members - Users belonging to organizations with roles
-- =============================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'admin', 'staff', 'receptionist')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (organization_id, user_id)
);

-- Indexes for organization_members
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON public.organization_members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON public.organization_members(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON public.organization_members(organization_id, status);


-- =============================================================
-- 3. salons - Individual salon/business locations
-- =============================================================
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  business_category TEXT NOT NULL DEFAULT 'Salon',
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Location fields (canonical shop location)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_address TEXT,
  location_city TEXT,
  location_area TEXT,
  location_zone TEXT,
  location_landmark TEXT,
  location_pincode TEXT,
  location_accuracy_m NUMERIC,
  location_source TEXT CHECK (location_source IN ('gps', 'manual')),
  location_confirmed BOOLEAN NOT NULL DEFAULT false,
  location_confirmed_at TIMESTAMPTZ,
  
  -- Business info
  starting_price_paise INTEGER DEFAULT 0,
  cover_image_path TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_note TEXT,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for salons
CREATE INDEX IF NOT EXISTS idx_salons_organization_id ON public.salons(organization_id);
CREATE INDEX IF NOT EXISTS idx_salons_slug ON public.salons(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_salons_owner_id ON public.salons(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_salons_location_confirmed ON public.salons(location_confirmed) WHERE location_confirmed = true;
CREATE INDEX IF NOT EXISTS idx_salons_latlng ON public.salons(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_salons_is_active ON public.salons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_salons_is_verified ON public.salons(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_salons_deleted_at ON public.salons(deleted_at) WHERE deleted_at IS NULL;


-- =============================================================
-- 4. services - Salon services catalog
-- =============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Hair',
  price_paise INTEGER NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for services
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON public.services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(salon_id, category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(salon_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON public.services(deleted_at) WHERE deleted_at IS NULL;


-- =============================================================
-- 5. customers - Salon customers
-- =============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Customer info
  first_name TEXT NOT NULL,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name || ' ' || last_name, first_name)) STORED,
  email TEXT,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  -- Metadata
  customer_type TEXT CHECK (customer_type IN ('VIP', 'Gold Member', 'New', 'Standard', 'Walk-in')),
  total_visits INTEGER NOT NULL DEFAULT 0,
  total_spend_paise INTEGER NOT NULL DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  join_date DATE,
  notes TEXT,
  tags TEXT[],
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  
  -- Unique constraint: one customer per salon per phone
  UNIQUE (salon_id, phone)
);

-- Indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_salon_id ON public.customers(salon_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(salon_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(salon_id, customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(salon_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON public.customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON public.customers(salon_id, last_visit_at DESC) WHERE last_visit_at IS NOT NULL;


-- =============================================================
-- 6. bookings - Customer appointments
-- =============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Appointment details
  appointment_start TIMESTAMPTZ NOT NULL,
  appointment_end TIMESTAMPTZ NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')
  ),
  
  -- Payment
  total_paise INTEGER NOT NULL DEFAULT 0 CHECK (total_paise >= 0),
  advance_paise INTEGER NOT NULL DEFAULT 0 CHECK (advance_paise >= 0),
  payment_status TEXT DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'partial', 'paid', 'refunded', 'failed', 'cancelled')
  ),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'wallet', 'bank_transfer')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  
  -- Customer info (denormalized for performance)
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Notes
  notes TEXT,
  cancellation_reason TEXT,
  
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  
  -- Constraints
  CHECK (appointment_end > appointment_start),
  CHECK (advance_paise <= total_paise)
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_salon_id ON public.bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON public.bookings(staff_id) WHERE staff_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(salon_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_range ON public.bookings(salon_id, appointment_start, appointment_end);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_active ON public.bookings(staff_id, appointment_start, appointment_end)
  WHERE status NOT IN ('cancelled', 'completed', 'no_show') AND staff_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(salon_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(salon_id, created_at DESC);

-- Exclusion constraint to prevent double-booking same staff at same time
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE INDEX IF NOT EXISTS bookings_staff_active_slot_no_overlap
  ON public.bookings (staff_id, tstzrange(appointment_start, appointment_end))
  WHERE status NOT IN ('cancelled', 'completed', 'no_show') AND staff_id IS NOT NULL;


-- =============================================================
-- 7. booking_items - Individual services within a booking
-- =============================================================
CREATE TABLE IF NOT EXISTS public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  
  -- Pricing
  unit_price_paise INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total_paise INTEGER NOT NULL DEFAULT 0 GENERATED ALWAYS AS (unit_price_paise * quantity) STORED,
  
  -- Commission tracking
  commission_percent NUMERIC(5,2) DEFAULT 0,
  commission_paise INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded')
  ),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for booking_items
CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id ON public.booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_service_id ON public.booking_items(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_staff_id ON public.booking_items(staff_id) WHERE staff_id IS NOT NULL;


-- =============================================================
-- 8. salon_hours - Business operating hours
-- =============================================================
CREATE TABLE IF NOT EXISTS public.salon_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open BOOLEAN NOT NULL DEFAULT true,
  open_time TIME NOT NULL DEFAULT '09:00:00',
  close_time TIME NOT NULL DEFAULT '19:00:00',
  is_24_hours BOOLEAN NOT NULL DEFAULT false,
  
  -- Unique: one entry per salon per day
  UNIQUE (salon_id, day_of_week),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for salon_hours
CREATE INDEX IF NOT EXISTS idx_salon_hours_salon_id ON public.salon_hours(salon_id);


-- =============================================================
-- 9. salon_public_websites - Published salon websites
-- =============================================================
CREATE TABLE IF NOT EXISTS public.salon_public_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Website config
  slug TEXT NOT NULL UNIQUE,
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  
  -- Content
  site_title TEXT,
  meta_description TEXT,
  favicon_url TEXT,
  
  -- Theme
  theme_template TEXT NOT NULL DEFAULT 'luxury',
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#EC4899',
  
  -- Content snapshot (JSONB for full site data)
  content_snapshot JSONB NOT NULL DEFAULT '{}',
  
  -- Publish state
  publish_state TEXT NOT NULL DEFAULT 'draft' CHECK (
    publish_state IN ('draft', 'publishing', 'published', 'unpublished', 'error')
  ),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for salon_public_websites
CREATE INDEX IF NOT EXISTS idx_salon_public_websites_slug ON public.salon_public_websites(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_salon_public_websites_salon_id ON public.salon_public_websites(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_public_websites_publish_state ON public.salon_public_websites(publish_state);
CREATE INDEX IF NOT EXISTS idx_salon_public_websites_subdomain ON public.salon_public_websites(subdomain) WHERE subdomain IS NOT NULL;


-- =============================================================
-- 10. salon_setup_proposals - Growth partner proposals
-- =============================================================
CREATE TABLE IF NOT EXISTS public.salon_setup_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Proposal details
  proposal_name TEXT NOT NULL,
  proposed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  proposed_email TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'under_review', 'approved', 'rejected', 'expired')
  ),
  
  -- Content
  proposal_data JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  
  -- Review
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Timestamps
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for salon_setup_proposals
CREATE INDEX IF NOT EXISTS idx_salon_setup_proposals_salon_id ON public.salon_setup_proposals(salon_id) WHERE salon_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_salon_setup_proposals_status ON public.salon_setup_proposals(status);
CREATE INDEX IF NOT EXISTS idx_salon_setup_proposals_proposed_by ON public.salon_setup_proposals(proposed_by);


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

-- Apply to all tables
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER trg_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_salons_updated_at ON public.salons;
CREATE TRIGGER trg_salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_booking_items_updated_at ON public.booking_items;
CREATE TRIGGER trg_booking_items_updated_at
  BEFORE UPDATE ON public.booking_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_salon_hours_updated_at ON public.salon_hours;
CREATE TRIGGER trg_salon_hours_updated_at
  BEFORE UPDATE ON public.salon_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_salon_public_websites_updated_at ON public.salon_public_websites;
CREATE TRIGGER trg_salon_public_websites_updated_at
  BEFORE UPDATE ON public.salon_public_websites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_salon_setup_proposals_updated_at ON public.salon_setup_proposals;
CREATE TRIGGER trg_salon_setup_proposals_updated_at
  BEFORE UPDATE ON public.salon_setup_proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- ROW LEVEL SECURITY (RLS) - TENANT ISOLATION
-- =============================================================

-- Helper function: Check if user is member of organization with role
CREATE OR REPLACE FUNCTION public.user_is_org_member(
  p_organization_id UUID,
  p_required_roles TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND (p_required_roles IS NULL OR om.role = ANY(p_required_roles))
  );
$$;

-- Helper function: Check if user manages salon (owner/manager/admin)
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

-- Helper function: Check if user is salon staff
CREATE OR REPLACE FUNCTION public.user_is_salon_staff(p_salon_id UUID)
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
      AND om.role IN ('owner', 'manager', 'admin', 'staff', 'receptionist')
      AND om.status = 'active'
      AND s.deleted_at IS NULL
  );
$$;

-- Helper function: Check if user is customer of salon
CREATE OR REPLACE FUNCTION public.user_is_customer(p_salon_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.salon_id = p_salon_id
      AND c.user_id = auth.uid()
      AND c.deleted_at IS NULL
  );
$$;


-- =============================================================
-- RLS POLICIES: organizations
-- =============================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Owners can manage their organizations
DROP POLICY IF EXISTS "Organization owners can manage" ON public.organizations;
CREATE POLICY "Organization owners can manage"
  ON public.organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = public.organizations.id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
        AND om.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = public.organizations.id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
        AND om.status = 'active'
    )
  );


-- =============================================================
-- RLS POLICIES: organization_members
-- =============================================================
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Users can see their own membership
DROP POLICY IF EXISTS "Users can view own membership" ON public.organization_members;
CREATE POLICY "Users can view own membership"
  ON public.organization_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own profile in membership
DROP POLICY IF EXISTS "Users can update own profile" ON public.organization_members;
CREATE POLICY "Users can update own profile"
  ON public.organization_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND pg_has_role('authenticated', 'USAGE')
    -- Only allow updating non-role fields
    AND (NEW.role IS NULL OR NEW.role = OLD.role)
    AND (NEW.status IS NULL OR NEW.status = OLD.status)
  );

-- Organization owners can manage all members
DROP POLICY IF EXISTS "Owners can manage organization members" ON public.organization_members;
CREATE POLICY "Owners can manage organization members"
  ON public.organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om2
      WHERE om2.organization_id = public.organization_members.organization_id
        AND om2.user_id = auth.uid()
        AND om2.role = 'owner'
        AND om2.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_members om2
      WHERE om2.organization_id = public.organization_members.organization_id
        AND om2.user_id = auth.uid()
        AND om2.role = 'owner'
        AND om2.status = 'active'
    )
  );


-- =============================================================
-- RLS POLICIES: salons
-- =============================================================
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- Owners/managers can manage their salons
DROP POLICY IF EXISTS "Owners/Managers can manage salons" ON public.salons;
CREATE POLICY "Owners/Managers can manage salons"
  ON public.salons
  FOR ALL
  USING (public.user_manages_salon(id))
  WITH CHECK (public.user_manages_salon(id));

-- Staff can view their salon
DROP POLICY IF EXISTS "Staff can view their salon" ON public.salons;
CREATE POLICY "Staff can view their salon"
  ON public.salons
  FOR SELECT
  USING (public.user_is_salon_staff(id));

-- Public can view verified salons (for customer-facing website)
DROP POLICY IF EXISTS "Public can view verified salons" ON public.salons;
CREATE POLICY "Public can view verified salons"
  ON public.salons
  FOR SELECT
  USING (is_verified = true AND deleted_at IS NULL);


-- =============================================================
-- RLS POLICIES: services
-- =============================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Owners/managers can manage their services
DROP POLICY IF EXISTS "Owners/Managers can manage services" ON public.services;
CREATE POLICY "Owners/Managers can manage services"
  ON public.services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.services.salon_id
        AND public.user_manages_salon(s.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.services.salon_id
        AND public.user_manages_salon(s.id)
    )
  );

-- Staff can view their salon's services
DROP POLICY IF EXISTS "Staff can view salon services" ON public.services;
CREATE POLICY "Staff can view salon services"
  ON public.services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.services.salon_id
        AND public.user_is_salon_staff(s.id)
    )
  );

-- Public can view active services of verified salons
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
  ON public.services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.services.salon_id
        AND s.is_verified = true
        AND s.deleted_at IS NULL
    )
    AND public.services.is_active = true
    AND public.services.deleted_at IS NULL
  );


-- =============================================================
-- RLS POLICIES: customers
-- =============================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Owners/managers can manage their customers
DROP POLICY IF EXISTS "Owners/Managers can manage customers" ON public.customers;
CREATE POLICY "Owners/Managers can manage customers"
  ON public.customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.customers.salon_id
        AND public.user_manages_salon(s.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.customers.salon_id
        AND public.user_manages_salon(s.id)
    )
  );

-- Staff can view their salon's customers
DROP POLICY IF EXISTS "Staff can view salon customers" ON public.customers;
CREATE POLICY "Staff can view salon customers"
  ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.customers.salon_id
        AND public.user_is_salon_staff(s.id)
    )
  );

-- Customers can view their own profile
DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
CREATE POLICY "Customers can view own profile"
  ON public.customers
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );


-- =============================================================
-- RLS POLICIES: bookings
-- =============================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Owners/managers can manage their bookings
DROP POLICY IF EXISTS "Owners/Managers can manage bookings" ON public.bookings;
CREATE POLICY "Owners/Managers can manage bookings"
  ON public.bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.bookings.salon_id
        AND public.user_manages_salon(s.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.bookings.salon_id
        AND public.user_manages_salon(s.id)
    )
  );

-- Staff can view their assigned bookings
DROP POLICY IF EXISTS "Staff can view their bookings" ON public.bookings;
CREATE POLICY "Staff can view their bookings"
  ON public.bookings
  FOR SELECT
  USING (
    (staff_id = auth.uid() OR
     EXISTS (
       SELECT 1
       FROM public.staff s
       WHERE s.id = public.bookings.staff_id
         AND s.user_id = auth.uid()
     ))
    AND (
      EXISTS (
        SELECT 1
        FROM public.salons s
        WHERE s.id = public.bookings.salon_id
          AND public.user_is_salon_staff(s.id)
      )
    )
  );

-- Staff can update their assigned bookings status
DROP POLICY IF EXISTS "Staff can update their booking status" ON public.bookings;
CREATE POLICY "Staff can update their booking status"
  ON public.bookings
  FOR UPDATE
  USING (
    (staff_id = auth.uid() OR
     EXISTS (
       SELECT 1
       FROM public.staff s
       WHERE s.id = public.bookings.staff_id
         AND s.user_id = auth.uid()
     ))
    AND (
      EXISTS (
        SELECT 1
        FROM public.salons s
        WHERE s.id = public.bookings.salon_id
          AND public.user_is_salon_staff(s.id)
      )
    )
    AND (
      -- Only allow updating status and notes
      NEW.salon_id = OLD.salon_id
      AND NEW.staff_id = OLD.staff_id
      AND NEW.customer_id = OLD.customer_id
      AND NEW.appointment_start = OLD.appointment_start
      AND NEW.appointment_end = OLD.appointment_end
      AND NEW.total_paise = OLD.total_paise
      AND NEW.advance_paise = OLD.advance_paise
    )
  WITH CHECK (
    (staff_id = auth.uid() OR
     EXISTS (
       SELECT 1
       FROM public.staff s
       WHERE s.id = public.bookings.staff_id
         AND s.user_id = auth.uid()
     ))
    AND (
      EXISTS (
        SELECT 1
        FROM public.salons s
        WHERE s.id = public.bookings.salon_id
          AND public.user_is_salon_staff(s.id)
      )
    )
  );

-- Customers can view their own bookings
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
CREATE POLICY "Customers can view own bookings"
  ON public.bookings
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR (
      EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = public.bookings.customer_id
          AND c.user_id = auth.uid()
      )
    )
    AND deleted_at IS NULL
  );


-- =============================================================
-- RLS POLICIES: booking_items
-- =============================================================
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

-- Owners/managers can manage their booking items
DROP POLICY IF EXISTS "Owners/Managers can manage booking items" ON public.booking_items;
CREATE POLICY "Owners/Managers can manage booking items"
  ON public.booking_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = public.booking_items.booking_id
        AND public.user_manages_salon(s.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = public.booking_items.booking_id
        AND public.user_manages_salon(s.id)
    )
  );

-- Staff can view their booking items
DROP POLICY IF EXISTS "Staff can view their booking items" ON public.booking_items;
CREATE POLICY "Staff can view their booking items"
  ON public.booking_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = public.booking_items.booking_id
        AND (
          b.staff_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.staff st
            WHERE st.id = b.staff_id
              AND st.user_id = auth.uid()
          )
          OR public.user_is_salon_staff(s.id)
        )
    )
  );


-- =============================================================
-- RLS POLICIES: salon_hours
-- =============================================================
ALTER TABLE public.salon_hours ENABLE ROW LEVEL SECURITY;

-- Owners/managers can manage their salon hours
DROP POLICY IF EXISTS "Owners/Managers can manage salon hours" ON public.salon_hours;
CREATE POLICY "Owners/Managers can manage salon hours"
  ON public.salon_hours
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.salon_hours.salon_id
        AND public.user_manages_salon(s.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.salon_hours.salon_id
        AND public.user_manages_salon(s.id)
    )
  );

-- Public can view verified salon hours
DROP POLICY IF EXISTS "Public can view verified salon hours" ON public.salon_hours;
CREATE POLICY "Public can view verified salon hours"
  ON public.salon_hours
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.salon_hours.salon_id
        AND s.is_verified = true
        AND s.deleted_at IS NULL
    )
  );


-- =============================================================
-- RLS POLICIES: salon_public_websites
-- =============================================================
ALTER TABLE public.salon_public_websites ENABLE ROW LEVEL SECURITY;

-- Owners/managers can manage their website
DROP POLICY IF EXISTS "Owners/Managers can manage website" ON public.salon_public_websites;
CREATE POLICY "Owners/Managers can manage website"
  ON public.salon_public_websites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.salon_public_websites.salon_id
        AND public.user_manages_salon(s.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.salon_public_websites.salon_id
        AND public.user_manages_salon(s.id)
    )
  );

-- Public can view published websites
DROP POLICY IF EXISTS "Public can view published websites" ON public.salon_public_websites;
CREATE POLICY "Public can view published websites"
  ON public.salon_public_websites
  FOR SELECT
  USING (
    publish_state = 'published'
    AND is_active = true
    AND deleted_at IS NULL
  );


-- =============================================================
-- RLS POLICIES: salon_setup_proposals
-- =============================================================
ALTER TABLE public.salon_setup_proposals ENABLE ROW LEVEL SECURITY;

-- Owners/managers can view their proposals
DROP POLICY IF EXISTS "Owners/Managers can view proposals" ON public.salon_setup_proposals;
CREATE POLICY "Owners/Managers can view proposals"
  ON public.salon_setup_proposals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.salon_setup_proposals.salon_id
        AND public.user_manages_salon(s.id)
    )
    OR proposed_by = auth.uid()
  );

-- Owners/managers can manage their proposals
DROP POLICY IF EXISTS "Owners/Managers can manage proposals" ON public.salon_setup_proposals;
CREATE POLICY "Owners/Managers can manage proposals"
  ON public.salon_setup_proposals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.salon_setup_proposals.salon_id
        AND public.user_manages_salon(s.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = public.salon_setup_proposals.salon_id
        AND public.user_manages_salon(s.id)
    )
  );


-- =============================================================
-- BACKFILL: Create organization for existing salon_profiles
-- =============================================================
-- If salon_profiles exists (from schema.sql), create organizations for them
DO $$
BEGIN
  -- Check if we need to migrate from salon_profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salon_profiles') THEN
    -- Create organizations for each salon_profile owner
    INSERT INTO public.organizations (id, name, email, slug)
    SELECT 
      sp.id,
      COALESCE(sp.business_name, 'My Salon'),
      sp.email,
      'salon-' || gen_random_uuid()::text
    FROM public.salon_profiles sp
    ON CONFLICT (id) DO NOTHING;

    -- Create salon entries
    INSERT INTO public.salons (
      id, organization_id, owner_id, name, slug, email, contact_number,
      business_category, is_verified
    )
    SELECT 
      sp.id,
      sp.id,
      sp.id,
      COALESCE(sp.business_name, 'My Salon'),
      'salon-' || gen_random_uuid()::text,
      sp.email,
      sp.contact_number,
      sp.business_category,
      true
    FROM public.salon_profiles sp
    ON CONFLICT (id) DO NOTHING;

    -- Create organization members
    INSERT INTO public.organization_members (
      organization_id, user_id, role, status, email, full_name
    )
    SELECT 
      sp.id,
      sp.id,
      'owner',
      'active',
      sp.email,
      COALESCE(sp.business_name, 'Owner')
    FROM public.salon_profiles sp
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
END $$;


-- =============================================================
-- COMMENTS ON TABLES
-- =============================================================

COMMENT ON TABLE public.organizations IS 'Business organizations/tenants that own one or more salons';
COMMENT ON TABLE public.organization_members IS 'Users belonging to organizations with roles (owner, manager, admin, staff, receptionist)';
COMMENT ON TABLE public.salons IS 'Individual salon/business locations belonging to an organization';
COMMENT ON TABLE public.services IS 'Service catalog for each salon';
COMMENT ON TABLE public.customers IS 'Salon customers with contact info and visit history';
COMMENT ON TABLE public.bookings IS 'Customer appointments with staff assignments and payment tracking';
COMMENT ON TABLE public.booking_items IS 'Individual services within a booking with pricing and commission tracking';
COMMENT ON TABLE public.salon_hours IS 'Business operating hours per day of week';
COMMENT ON TABLE public.salon_public_websites IS 'Published salon websites with content snapshots';
COMMENT ON TABLE public.salon_setup_proposals IS 'Growth partner proposals for salon setup';

COMMENT ON COLUMN public.salons.location_confirmed IS 'TRUE only after owner explicitly confirms via Save Shop Location button';
COMMENT ON COLUMN public.salons.location_confirmed_at IS 'ISO timestamp when owner last confirmed the location';
COMMENT ON COLUMN public.salons.location_accuracy_m IS 'GPS accuracy in meters at time of selection (informational only)';
COMMENT ON COLUMN public.salons.location_source IS 'gps = set via device GPS; manual = pin placed on map';
COMMENT ON COLUMN public.bookings.total_paise IS 'Total amount in paise (100 paise = 1 rupee)';
COMMENT ON COLUMN public.bookings.advance_paise IS 'Advance/deposit amount in paise';
