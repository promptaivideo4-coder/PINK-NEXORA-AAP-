-- =============================================================
-- NexoraOS Staff Management — Phase 2: Role & Permission System
-- =============================================================
-- Depends on Phase 1 (staff table extended, user_manages_salon exists)
--
-- NEW TABLES:
--   1. staff_roles
--   2. permissions
--   3. role_permissions
--
-- ALTERED:
--   - staff (add staff_role_id FK)
--
-- NEW FUNCTIONS:
--   - public.staff_has_permission(p_staff_id, p_module, p_action)
--   - public.auth_user_staff_has_permission(p_module, p_action)
--   - public.get_auth_user_staff_role(p_salon_id)
-- =============================================================


-- =============================================================
-- 1. staff_roles
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (business_id, name)
);

-- =============================================================
-- 2. permissions
-- =============================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module      TEXT NOT NULL,
  action      TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (module, action),
  CHECK (module IN (
    'dashboard', 'bookings', 'customers', 'services',
    'staff', 'website', 'marketing', 'analytics',
    'payroll', 'wallet', 'settings'
  )),
  CHECK (action IN ('view', 'create', 'edit', 'delete', 'approve'))
);

-- =============================================================
-- 3. role_permissions (junction)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES public.staff_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (role_id, permission_id)
);

-- =============================================================
-- 4. Link staff to roles
-- =============================================================
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS staff_role_id UUID REFERENCES public.staff_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_staff_role_id
  ON public.staff (staff_role_id) WHERE staff_role_id IS NOT NULL;


-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_staff_roles_business_id
  ON public.staff_roles (business_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
  ON public.role_permissions (role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
  ON public.role_permissions (permission_id);


-- =============================================================
-- UPDATED_AT TRIGGERS
-- =============================================================
DROP TRIGGER IF EXISTS trg_staff_roles_updated_at ON public.staff_roles;
CREATE TRIGGER trg_staff_roles_updated_at
  BEFORE UPDATE ON public.staff_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE public.staff_roles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- SEED: Default permissions (11 modules × 5 actions = 55)
-- =============================================================
INSERT INTO public.permissions (module, action, description) VALUES
  -- dashboard
  ('dashboard', 'view',    'View dashboard overview'),
  ('dashboard', 'create',  'Create dashboard widgets'),
  ('dashboard', 'edit',    'Edit dashboard layout'),
  ('dashboard', 'delete',  'Remove dashboard widgets'),
  ('dashboard', 'approve', 'Approve dashboard changes'),
  -- bookings
  ('bookings', 'view',    'View bookings'),
  ('bookings', 'create',  'Create new bookings'),
  ('bookings', 'edit',    'Edit existing bookings'),
  ('bookings', 'delete',  'Cancel or delete bookings'),
  ('bookings', 'approve', 'Approve booking requests'),
  -- customers
  ('customers', 'view',    'View customer list and profiles'),
  ('customers', 'create',  'Add new customers'),
  ('customers', 'edit',    'Edit customer information'),
  ('customers', 'delete',  'Delete customer records'),
  ('customers', 'approve', 'Approve customer requests'),
  -- services
  ('services', 'view',    'View services catalog'),
  ('services', 'create',  'Create new services'),
  ('services', 'edit',    'Edit service details and pricing'),
  ('services', 'delete',  'Remove services'),
  ('services', 'approve', 'Approve service changes'),
  -- staff
  ('staff', 'view',    'View staff directory'),
  ('staff', 'create',  'Add new staff members'),
  ('staff', 'edit',    'Edit staff profiles'),
  ('staff', 'delete',  'Remove staff members'),
  ('staff', 'approve', 'Approve staff requests'),
  -- website
  ('website', 'view',    'View website settings'),
  ('website', 'create',  'Create website content'),
  ('website', 'edit',    'Edit website configuration'),
  ('website', 'delete',  'Remove website content'),
  ('website', 'approve', 'Approve website changes'),
  -- marketing
  ('marketing', 'view',    'View marketing campaigns'),
  ('marketing', 'create',  'Create marketing campaigns'),
  ('marketing', 'edit',    'Edit marketing content'),
  ('marketing', 'delete',  'Delete marketing campaigns'),
  ('marketing', 'approve', 'Approve marketing campaigns'),
  -- analytics
  ('analytics', 'view',    'View analytics and reports'),
  ('analytics', 'create',  'Create custom reports'),
  ('analytics', 'edit',    'Edit report configurations'),
  ('analytics', 'delete',  'Delete reports'),
  ('analytics', 'approve', 'Approve report sharing'),
  -- payroll (SENSITIVE)
  ('payroll', 'view',    'View payroll and earnings'),
  ('payroll', 'create',  'Create payroll records'),
  ('payroll', 'edit',    'Edit payroll entries'),
  ('payroll', 'delete',  'Delete payroll records'),
  ('payroll', 'approve', 'Approve payroll settlements'),
  -- wallet (SENSITIVE)
  ('wallet', 'view',    'View wallet and transactions'),
  ('wallet', 'create',  'Create wallet entries'),
  ('wallet', 'edit',    'Edit wallet records'),
  ('wallet', 'delete',  'Delete wallet records'),
  ('wallet', 'approve', 'Approve wallet transactions'),
  -- settings (SENSITIVE)
  ('settings', 'view',    'View business settings'),
  ('settings', 'create',  'Create settings entries'),
  ('settings', 'edit',    'Edit business configuration'),
  ('settings', 'delete',  'Delete settings entries'),
  ('settings', 'approve', 'Approve settings changes')
ON CONFLICT (module, action) DO NOTHING;


-- =============================================================
-- SEED: Default roles per business
-- We use a function so every existing salon gets the 3 system roles.
-- Future salons get them via trigger on salons insert.
-- =============================================================

CREATE OR REPLACE FUNCTION public.seed_staff_roles_for_business(p_business_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manager_id UUID;
  v_provider_id UUID;
  v_receptionist_id UUID;
  v_perm RECORD;
BEGIN
  -- Skip if roles already exist
  IF EXISTS (SELECT 1 FROM public.staff_roles WHERE business_id = p_business_id) THEN
    RETURN;
  END IF;

  -- Create system roles
  INSERT INTO public.staff_roles (business_id, name, description, is_system_role)
  VALUES (p_business_id, 'Manager', 'Full Access', true)
  RETURNING id INTO v_manager_id;

  INSERT INTO public.staff_roles (business_id, name, description, is_system_role)
  VALUES (p_business_id, 'Service Provider', 'Assigned Access', true)
  RETURNING id INTO v_provider_id;

  INSERT INTO public.staff_roles (business_id, name, description, is_system_role)
  VALUES (p_business_id, 'Receptionist', 'Frontdesk Access', true)
  RETURNING id INTO v_receptionist_id;

  -- Manager: ALL permissions
  FOR v_perm IN SELECT id FROM public.permissions
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_manager_id, v_perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Service Provider: dashboard view, bookings view/create/edit, services view, customers view
  FOR v_perm IN SELECT id FROM public.permissions WHERE
    (module = 'dashboard' AND action = 'view') OR
    (module = 'bookings' AND action IN ('view', 'create', 'edit')) OR
    (module = 'services' AND action = 'view') OR
    (module = 'customers' AND action = 'view')
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_provider_id, v_perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Receptionist: dashboard view, bookings CRUD+approve, customers view/create/edit, services view, staff view
  FOR v_perm IN SELECT id FROM public.permissions WHERE
    (module = 'dashboard' AND action = 'view') OR
    (module = 'bookings' AND action IN ('view', 'create', 'edit', 'approve')) OR
    (module = 'customers' AND action IN ('view', 'create', 'edit')) OR
    (module = 'services' AND action = 'view') OR
    (module = 'staff' AND action = 'view')
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_receptionist_id, v_perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Link existing staff with role_title matching system roles
  UPDATE public.staff
  SET staff_role_id = v_manager_id
  WHERE salon_id = p_business_id
    AND deleted_at IS NULL
    AND lower(role_title) IN ('manager', 'senior manager', 'admin');

  UPDATE public.staff
  SET staff_role_id = v_provider_id
  WHERE salon_id = p_business_id
    AND deleted_at IS NULL
    AND staff_role_id IS NULL
    AND lower(role_title) IN (
      'senior stylist', 'stylist', 'junior stylist', 'master barber',
      'color specialist', 'nail artist', 'massage therapist',
      'service provider', 'beautician'
    );

  UPDATE public.staff
  SET staff_role_id = v_receptionist_id
  WHERE salon_id = p_business_id
    AND deleted_at IS NULL
    AND staff_role_id IS NULL
    AND lower(role_title) IN ('receptionist', 'frontdesk', 'front desk');
END;
$$;

-- Seed roles for ALL existing salons
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.salons WHERE deleted_at IS NULL
  LOOP
    PERFORM public.seed_staff_roles_for_business(r.id);
  END LOOP;
END;
$$;

-- Auto-seed for new salons
CREATE OR REPLACE FUNCTION public.auto_seed_staff_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_staff_roles_for_business(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_seed_staff_roles ON public.salons;
CREATE TRIGGER trg_auto_seed_staff_roles
  AFTER INSERT ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.auto_seed_staff_roles();


-- =============================================================
-- FUNCTION: staff_has_permission(p_staff_id, p_module, p_action)
-- =============================================================
-- Checks if a staff member has a specific permission via their role.

CREATE OR REPLACE FUNCTION public.staff_has_permission(
  p_staff_id UUID,
  p_module TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff s
    JOIN public.staff_roles sr ON sr.id = s.staff_role_id
    JOIN public.role_permissions rp ON rp.role_id = sr.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE s.id = p_staff_id
      AND s.deleted_at IS NULL
      AND s.is_active = true
      AND p.module = p_module
      AND p.action = p_action
  );
$$;


-- =============================================================
-- FUNCTION: auth_user_staff_has_permission(p_module, p_action)
-- =============================================================
-- Resolves auth.uid() → staff → role → permission.
-- Also grants full access to organization owners/managers/admins.

CREATE OR REPLACE FUNCTION public.auth_user_staff_has_permission(
  p_salon_id UUID,
  p_module TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_manager BOOLEAN;
  v_staff_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Owner/Manager/Admin via organization_members always has access
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.salons s ON s.organization_id = om.organization_id
    WHERE s.id = p_salon_id
      AND om.user_id = v_user_id
      AND om.role IN ('owner', 'manager', 'admin')
      AND om.status = 'active'
      AND s.deleted_at IS NULL
  ) INTO v_is_manager;

  IF v_is_manager THEN
    RETURN true;
  END IF;

  -- Regular staff: resolve user_id → staff → role → permission
  SELECT s.id INTO v_staff_id
  FROM public.staff s
  WHERE s.user_id = v_user_id
    AND s.salon_id = p_salon_id
    AND s.deleted_at IS NULL
    AND s.is_active = true
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.staff_has_permission(v_staff_id, p_module, p_action);
END;
$$;


-- =============================================================
-- FUNCTION: get_auth_user_staff_role(p_salon_id)
-- =============================================================
-- Returns the role name for the authenticated user at a given salon.

CREATE OR REPLACE FUNCTION public.get_auth_user_staff_role(p_salon_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sr.name
  FROM public.staff s
  JOIN public.staff_roles sr ON sr.id = s.staff_role_id
  WHERE s.user_id = auth.uid()
    AND s.salon_id = p_salon_id
    AND s.deleted_at IS NULL
    AND s.is_active = true
  LIMIT 1;
$$;


-- =============================================================
-- RLS POLICIES: staff_roles
-- =============================================================

-- Managers/owners can do everything with roles
DROP POLICY IF EXISTS staff_roles_manager_select ON public.staff_roles;
CREATE POLICY staff_roles_manager_select
  ON public.staff_roles FOR SELECT
  USING (public.user_manages_salon(business_id));

DROP POLICY IF EXISTS staff_roles_manager_insert ON public.staff_roles;
CREATE POLICY staff_roles_manager_insert
  ON public.staff_roles FOR INSERT
  WITH CHECK (public.user_manages_salon(business_id));

DROP POLICY IF EXISTS staff_roles_manager_update ON public.staff_roles;
CREATE POLICY staff_roles_manager_update
  ON public.staff_roles FOR UPDATE
  USING (public.user_manages_salon(business_id))
  WITH CHECK (public.user_manages_salon(business_id));

DROP POLICY IF EXISTS staff_roles_manager_delete ON public.staff_roles;
CREATE POLICY staff_roles_manager_delete
  ON public.staff_roles FOR DELETE
  USING (public.user_manages_salon(business_id) AND is_system_role = false);


-- =============================================================
-- RLS POLICIES: permissions (read-only for authenticated, managed by system)
-- =============================================================

DROP POLICY IF EXISTS permissions_read ON public.permissions;
CREATE POLICY permissions_read
  ON public.permissions FOR SELECT
  USING (true);

-- Only service role can modify permissions (they are system-managed)
-- No INSERT/UPDATE/DELETE policies for authenticated role


-- =============================================================
-- RLS POLICIES: role_permissions
-- =============================================================

DROP POLICY IF EXISTS role_permissions_manager_select ON public.role_permissions;
CREATE POLICY role_permissions_manager_select
  ON public.role_permissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.staff_roles sr
    WHERE sr.id = role_id AND public.user_manages_salon(sr.business_id)
  ));

DROP POLICY IF EXISTS role_permissions_manager_insert ON public.role_permissions;
CREATE POLICY role_permissions_manager_insert
  ON public.role_permissions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff_roles sr
    WHERE sr.id = role_id AND public.user_manages_salon(sr.business_id)
  ));

DROP POLICY IF EXISTS role_permissions_manager_delete ON public.role_permissions;
CREATE POLICY role_permissions_manager_delete
  ON public.role_permissions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.staff_roles sr
    WHERE sr.id = role_id AND public.user_manages_salon(sr.business_id)
  ));


-- =============================================================
-- PERMISSION-BASED RLS POLICIES: Sensitive modules
-- =============================================================
-- These policies enforce that staff can ONLY access sensitive data
-- if their role explicitly grants the permission.

-- Payroll: staff can only view if they have payroll.view permission
-- (Owner/manager always has access via user_manages_salon)
-- This is enforced at the application layer via auth_user_staff_has_permission()
-- since payroll tables are not yet created. When they are, add:
--   USING (public.auth_user_staff_has_permission(salon_id, 'payroll', 'view'))

-- For now, we create a view helper that frontend can use:
CREATE OR REPLACE FUNCTION public.check_staff_permission(p_module TEXT, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Returns true if the auth user is a manager OR has the specific permission
  -- This is the main function the frontend/RPC should call
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.salons s ON s.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'manager', 'admin')
      AND om.status = 'active'
      AND s.deleted_at IS NULL
  ) OR EXISTS (
    SELECT 1
    FROM public.staff st
    JOIN public.staff_roles sr ON sr.id = st.staff_role_id
    JOIN public.role_permissions rp ON rp.role_id = sr.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE st.user_id = auth.uid()
      AND st.deleted_at IS NULL
      AND st.is_active = true
      AND p.module = p_module
      AND p.action = p_action
  );
$$;
