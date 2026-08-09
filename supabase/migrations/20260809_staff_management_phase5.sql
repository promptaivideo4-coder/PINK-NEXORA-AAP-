-- =============================================================
-- NexoraOS Staff Management — Phase 5: Payroll, Commission,
-- Bonuses, Deductions, Private Documents & Audit
-- =============================================================
-- Depends on Phase 1-4.
--
-- NEW TABLES (8):
--   1. payroll_periods
--   2. staff_payroll_records
--   3. staff_payroll_commissions
--   4. staff_bonus_records
--   5. staff_payroll_deductions
--   6. staff_payment_accounts
--   7. staff_documents
--   8. staff_audit_logs
--
-- NEW STORAGE BUCKET:
--   staff-private-documents (PRIVATE, never public)
--
-- NEW RPCs (4):
--   - calculate_staff_commission(staff_id, booking_id, service_id, amount)
--   - calculate_payroll_record(period_id, staff_id, base_salary)
--   - process_payroll(period_id)
--   - settle_payroll(period_id)
--
-- EXISTING REUSED:
--   - bookings (staff_id, status, completed_at, total_paise)
--   - booking_items (booking_id, service_id, staff_id, unit_price_paise)
--   - staff_service_commissions (service-specific commission overrides)
--   - staff_commission_settings (default commission model)
--   - staff_services (commission_percent_override)
--   - salons (business_id FK)
--   - staff (staff_id FK)
-- =============================================================


-- =============================================================
-- 1. payroll_periods
-- =============================================================
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'processing', 'settled', 'locked')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CHECK (period_end >= period_start),
  UNIQUE (business_id, period_start, period_end)
);


-- =============================================================
-- 2. staff_payroll_records
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_payroll_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  staff_id          UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  base_salary       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
  total_commission  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_commission >= 0),
  total_bonus       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_bonus >= 0),
  total_deductions  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_deductions >= 0),
  net_payable       NUMERIC(12,2) GENERATED ALWAYS AS (base_salary + total_commission + total_bonus - total_deductions) STORED,
  payment_status    TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'processing', 'paid', 'settled')),
  processed_at      TIMESTAMPTZ,
  settled_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (payroll_period_id, staff_id)
);


-- =============================================================
-- 3. staff_payroll_commissions
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_payroll_commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_record_id UUID NOT NULL REFERENCES public.staff_payroll_records(id) ON DELETE CASCADE,
  staff_id          UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  booking_id        UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  service_id        UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_rate   NUMERIC(5,2) NOT NULL DEFAULT 0,
  commission_type   TEXT NOT NULL DEFAULT 'percentage'
    CHECK (commission_type IN ('percentage', 'fixed')),
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'eligible'
    CHECK (status IN ('eligible', 'excluded', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- =============================================================
-- 4. staff_bonus_records
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_bonus_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id          UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  payroll_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE SET NULL,
  bonus_type        TEXT NOT NULL DEFAULT 'performance'
    CHECK (bonus_type IN ('performance', 'sales_incentive', 'festival', 'other')),
  amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- =============================================================
-- 5. staff_payroll_deductions
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_payroll_deductions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_record_id UUID NOT NULL REFERENCES public.staff_payroll_records(id) ON DELETE CASCADE,
  staff_id          UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  deduction_type    TEXT NOT NULL DEFAULT 'advance'
    CHECK (deduction_type IN ('advance', 'tax', 'penalty', 'other')),
  description       TEXT,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- =============================================================
-- 6. staff_payment_accounts (SENSITIVE — encrypted fields)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_payment_accounts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id                 UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  payment_method           TEXT NOT NULL DEFAULT 'bank_transfer'
    CHECK (payment_method IN ('bank_transfer', 'upi', 'cash', 'cheque')),
  account_name             TEXT,
  account_number_encrypted TEXT,
  ifsc_encrypted           TEXT,
  upi_id_encrypted         TEXT,
  is_primary               BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- =============================================================
-- 7. staff_documents
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id            UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  document_type       TEXT NOT NULL
    CHECK (document_type IN ('government_id', 'address_proof', 'employment_contract', 'skill_certificate', 'other')),
  file_name           TEXT NOT NULL,
  storage_path        TEXT NOT NULL,
  mime_type           TEXT,
  file_size           INTEGER,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  uploaded_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- =============================================================
-- 8. staff_audit_logs (append-only for normal staff)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  staff_id     UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    UUID,
  old_value    JSONB,
  new_value    JSONB,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ip_address   INET,
  note         TEXT
);


-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_payroll_periods_business_id ON public.payroll_periods (business_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON public.payroll_periods (business_id, status);

CREATE INDEX IF NOT EXISTS idx_staff_payroll_records_period ON public.staff_payroll_records (payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_records_staff ON public.staff_payroll_records (staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_payroll_commissions_record ON public.staff_payroll_commissions (payroll_record_id);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_commissions_staff ON public.staff_payroll_commissions (staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_bonus_records_staff ON public.staff_bonus_records (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_bonus_records_period ON public.staff_bonus_records (payroll_period_id) WHERE payroll_period_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_payroll_deductions_record ON public.staff_payroll_deductions (payroll_record_id);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_deductions_staff ON public.staff_payroll_deductions (staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_payment_accounts_staff ON public.staff_payment_accounts (staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_documents_staff ON public.staff_documents (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_type ON public.staff_documents (staff_id, document_type);

CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_business ON public.staff_audit_logs (business_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_staff ON public.staff_audit_logs (staff_id) WHERE staff_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_performed ON public.staff_audit_logs (performed_at DESC);


-- =============================================================
-- TRIGGERS
-- =============================================================
DROP TRIGGER IF EXISTS trg_payroll_periods_updated_at ON public.payroll_periods;
CREATE TRIGGER trg_payroll_periods_updated_at
  BEFORE UPDATE ON public.payroll_periods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_payroll_records_updated_at ON public.staff_payroll_records;
CREATE TRIGGER trg_staff_payroll_records_updated_at
  BEFORE UPDATE ON public.staff_payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_payment_accounts_updated_at ON public.staff_payment_accounts;
CREATE TRIGGER trg_staff_payment_accounts_updated_at
  BEFORE UPDATE ON public.staff_payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_documents_updated_at ON public.staff_documents;
CREATE TRIGGER trg_staff_documents_updated_at
  BEFORE UPDATE ON public.staff_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- RLS ENABLE
-- =============================================================
ALTER TABLE public.payroll_periods         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payroll_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payroll_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_bonus_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payroll_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payment_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_logs        ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- RLS POLICIES: payroll_periods (manager only)
-- =============================================================
DROP POLICY IF EXISTS payroll_periods_manager_select ON public.payroll_periods;
CREATE POLICY payroll_periods_manager_select ON public.payroll_periods FOR SELECT
  USING (public.user_manages_salon(business_id));
DROP POLICY IF EXISTS payroll_periods_manager_insert ON public.payroll_periods;
CREATE POLICY payroll_periods_manager_insert ON public.payroll_periods FOR INSERT
  WITH CHECK (public.user_manages_salon(business_id));
DROP POLICY IF EXISTS payroll_periods_manager_update ON public.payroll_periods;
CREATE POLICY payroll_periods_manager_update ON public.payroll_periods FOR UPDATE
  USING (public.user_manages_salon(business_id))
  WITH CHECK (public.user_manages_salon(business_id));


-- =============================================================
-- RLS POLICIES: staff_payroll_records
-- =============================================================
DROP POLICY IF EXISTS payroll_records_manager_select ON public.staff_payroll_records;
CREATE POLICY payroll_records_manager_select ON public.staff_payroll_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.payroll_periods pp WHERE pp.id = payroll_period_id AND public.user_manages_salon(pp.business_id)));
DROP POLICY IF EXISTS payroll_records_manager_insert ON public.staff_payroll_records;
CREATE POLICY payroll_records_manager_insert ON public.staff_payroll_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.payroll_periods pp WHERE pp.id = payroll_period_id AND public.user_manages_salon(pp.business_id)));
DROP POLICY IF EXISTS payroll_records_manager_update ON public.staff_payroll_records;
CREATE POLICY payroll_records_manager_update ON public.staff_payroll_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.payroll_periods pp WHERE pp.id = payroll_period_id AND public.user_manages_salon(pp.business_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.payroll_periods pp WHERE pp.id = payroll_period_id AND public.user_manages_salon(pp.business_id)));
-- Staff can view their OWN payroll only
DROP POLICY IF EXISTS payroll_records_staff_own_select ON public.staff_payroll_records;
CREATE POLICY payroll_records_staff_own_select ON public.staff_payroll_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));


-- =============================================================
-- RLS POLICIES: staff_payroll_commissions
-- =============================================================
DROP POLICY IF EXISTS payroll_commissions_manager_select ON public.staff_payroll_commissions;
CREATE POLICY payroll_commissions_manager_select ON public.staff_payroll_commissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff_payroll_records spr JOIN public.payroll_periods pp ON pp.id = spr.payroll_period_id WHERE spr.id = payroll_record_id AND public.user_manages_salon(pp.business_id)));
DROP POLICY IF EXISTS payroll_commissions_manager_insert ON public.staff_payroll_commissions;
CREATE POLICY payroll_commissions_manager_insert ON public.staff_payroll_commissions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff_payroll_records spr JOIN public.payroll_periods pp ON pp.id = spr.payroll_period_id WHERE spr.id = payroll_record_id AND public.user_manages_salon(pp.business_id)));
DROP POLICY IF EXISTS payroll_commissions_staff_own_select ON public.staff_payroll_commissions;
CREATE POLICY payroll_commissions_staff_own_select ON public.staff_payroll_commissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));


-- =============================================================
-- RLS POLICIES: staff_bonus_records
-- =============================================================
DROP POLICY IF EXISTS bonus_records_manager_select ON public.staff_bonus_records;
CREATE POLICY bonus_records_manager_select ON public.staff_bonus_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS bonus_records_manager_insert ON public.staff_bonus_records;
CREATE POLICY bonus_records_manager_insert ON public.staff_bonus_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS bonus_records_manager_delete ON public.staff_bonus_records;
CREATE POLICY bonus_records_manager_delete ON public.staff_bonus_records FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS bonus_records_staff_own_select ON public.staff_bonus_records;
CREATE POLICY bonus_records_staff_own_select ON public.staff_bonus_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));


-- =============================================================
-- RLS POLICIES: staff_payroll_deductions
-- =============================================================
DROP POLICY IF EXISTS deductions_manager_select ON public.staff_payroll_deductions;
CREATE POLICY deductions_manager_select ON public.staff_payroll_deductions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS deductions_manager_insert ON public.staff_payroll_deductions;
CREATE POLICY deductions_manager_insert ON public.staff_payroll_deductions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS deductions_manager_delete ON public.staff_payroll_deductions;
CREATE POLICY deductions_manager_delete ON public.staff_payroll_deductions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS deductions_staff_own_select ON public.staff_payroll_deductions;
CREATE POLICY deductions_staff_own_select ON public.staff_payroll_deductions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));


-- =============================================================
-- RLS POLICIES: staff_payment_accounts (HIGHLY SENSITIVE)
-- =============================================================
DROP POLICY IF EXISTS payment_accounts_manager_select ON public.staff_payment_accounts;
CREATE POLICY payment_accounts_manager_select ON public.staff_payment_accounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS payment_accounts_manager_insert ON public.staff_payment_accounts;
CREATE POLICY payment_accounts_manager_insert ON public.staff_payment_accounts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS payment_accounts_manager_update ON public.staff_payment_accounts;
CREATE POLICY payment_accounts_manager_update ON public.staff_payment_accounts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS payment_accounts_staff_own_select ON public.staff_payment_accounts;
CREATE POLICY payment_accounts_staff_own_select ON public.staff_payment_accounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS payment_accounts_staff_own_insert ON public.staff_payment_accounts;
CREATE POLICY payment_accounts_staff_own_insert ON public.staff_payment_accounts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));


-- =============================================================
-- RLS POLICIES: staff_documents (SENSITIVE)
-- =============================================================
DROP POLICY IF EXISTS documents_manager_select ON public.staff_documents;
CREATE POLICY documents_manager_select ON public.staff_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS documents_manager_update ON public.staff_documents;
CREATE POLICY documents_manager_update ON public.staff_documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS documents_manager_delete ON public.staff_documents;
CREATE POLICY documents_manager_delete ON public.staff_documents FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS documents_staff_own_select ON public.staff_documents;
CREATE POLICY documents_staff_own_select ON public.staff_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS documents_staff_own_insert ON public.staff_documents;
CREATE POLICY documents_staff_own_insert ON public.staff_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));


-- =============================================================
-- RLS POLICIES: staff_audit_logs
-- =============================================================
DROP POLICY IF EXISTS audit_logs_manager_select ON public.staff_audit_logs;
CREATE POLICY audit_logs_manager_select ON public.staff_audit_logs FOR SELECT
  USING (public.user_manages_salon(business_id));
-- System can insert (via RPCs, triggers)
DROP POLICY IF EXISTS audit_logs_system_insert ON public.staff_audit_logs;
CREATE POLICY audit_logs_system_insert ON public.staff_audit_logs FOR INSERT
  WITH CHECK (true);
-- No DELETE policy = normal staff cannot delete audit logs


-- =============================================================
-- STORAGE BUCKET: staff-private-documents (PRIVATE)
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('staff-private-documents', 'staff-private-documents', false, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- RPC: calculate_staff_commission
-- =============================================================
-- Resolves commission for a specific booking:
--   1. staff_service_commissions (service-specific override)
--   2. staff_services.commission_percent_override
--   3. staff_commission_settings (default model)
-- Only completed/eligible bookings generate commission.
-- Cancelled/refunded/no_show bookings return eligible=false.

CREATE OR REPLACE FUNCTION public.calculate_staff_commission(
  p_staff_id UUID,
  p_booking_id UUID,
  p_service_id UUID,
  p_service_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_commission RECORD;
  v_default_commission RECORD;
  v_commission_type TEXT;
  v_commission_value NUMERIC;
  v_commission_amount NUMERIC;
  v_booking_status TEXT;
BEGIN
  -- Only completed/eligible bookings generate commission
  SELECT status INTO v_booking_status FROM public.bookings WHERE id = p_booking_id;
  IF v_booking_status IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Booking not found');
  END IF;
  IF v_booking_status IN ('cancelled', 'refunded', 'no_show') THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Booking status: ' || v_booking_status);
  END IF;

  -- 1. Service-specific commission override
  SELECT commission_type, commission_value INTO v_service_commission
  FROM public.staff_service_commissions
  WHERE staff_id = p_staff_id AND service_id = p_service_id
    AND is_active = true
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    AND effective_from <= CURRENT_DATE
  ORDER BY effective_from DESC LIMIT 1;

  IF v_service_commission IS NOT NULL THEN
    v_commission_type := v_service_commission.commission_type;
    v_commission_value := v_service_commission.commission_value;
  ELSE
    -- 2. staff_services percent override
    SELECT commission_percent_override INTO v_commission_value
    FROM public.staff_services
    WHERE staff_id = p_staff_id AND service_id = p_service_id AND is_active = true;

    IF v_commission_value IS NOT NULL AND v_commission_value > 0 THEN
      v_commission_type := 'percentage';
    ELSE
      -- 3. Default commission settings
      SELECT commission_model, default_percentage, default_fixed_amount INTO v_default_commission
      FROM public.staff_commission_settings WHERE staff_id = p_staff_id;

      IF v_default_commission IS NOT NULL THEN
        v_commission_type := v_default_commission.commission_model;
        IF v_commission_type = 'percentage' THEN
          v_commission_value := v_default_commission.default_percentage;
        ELSE
          v_commission_value := v_default_commission.default_fixed_amount;
        END IF;
      ELSE
        RETURN jsonb_build_object('eligible', true, 'commission_type', 'percentage', 'commission_rate', 0, 'commission_amount', 0);
      END IF;
    END IF;
  END IF;

  -- Calculate
  IF v_commission_type = 'percentage' THEN
    v_commission_amount := p_service_amount * v_commission_value / 100;
  ELSE
    v_commission_amount := v_commission_value;
  END IF;

  RETURN jsonb_build_object(
    'eligible', true,
    'commission_type', v_commission_type,
    'commission_rate', v_commission_value,
    'commission_amount', ROUND(v_commission_amount, 2)
  );
END;
$$;


-- =============================================================
-- RPC: calculate_payroll_record
-- =============================================================
-- Creates or updates a payroll record for a staff member in a period.
-- Calculates commissions from completed bookings, sums bonuses and deductions.
-- Formula: net_payable = base_salary + total_commission + total_bonus - total_deductions

CREATE OR REPLACE FUNCTION public.calculate_payroll_record(
  p_payroll_period_id UUID,
  p_staff_id UUID,
  p_base_salary NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period RECORD;
  v_record_id UUID;
  v_total_commission NUMERIC := 0;
  v_total_bonus NUMERIC := 0;
  v_total_deductions NUMERIC := 0;
  v_booking RECORD;
  v_comm_result JSONB;
  v_comm_amount NUMERIC;
BEGIN
  SELECT * INTO v_period FROM public.payroll_periods WHERE id = p_payroll_period_id;
  IF v_period IS NULL THEN RAISE EXCEPTION 'Payroll period not found'; END IF;

  -- Create or update payroll record
  INSERT INTO public.staff_payroll_records (payroll_period_id, staff_id, base_salary)
  VALUES (p_payroll_period_id, p_staff_id, p_base_salary)
  ON CONFLICT (payroll_period_id, staff_id)
  DO UPDATE SET base_salary = EXCLUDED.base_salary
  RETURNING id INTO v_record_id;

  -- Clear existing commissions
  DELETE FROM public.staff_payroll_commissions WHERE payroll_record_id = v_record_id;

  -- Calculate commissions from completed bookings in period
  FOR v_booking IN
    SELECT b.id as booking_id, bi.service_id, bi.unit_price_paise, bi.line_total_paise
    FROM public.bookings b
    JOIN public.booking_items bi ON bi.booking_id = b.id
    WHERE b.staff_id = p_staff_id
      AND b.status NOT IN ('cancelled', 'refunded', 'no_show')
      AND b.completed_at IS NOT NULL
      AND b.completed_at >= v_period.period_start::TIMESTAMPTZ
      AND b.completed_at < (v_period.period_end + INTERVAL '1 day')::TIMESTAMPTZ
  LOOP
    v_comm_result := public.calculate_staff_commission(
      p_staff_id, v_booking.booking_id, v_booking.service_id,
      COALESCE(v_booking.line_total_paise, v_booking.unit_price_paise, 0) / 100.0
    );

    IF (v_comm_result->>'eligible')::BOOLEAN THEN
      v_comm_amount := COALESCE((v_comm_result->>'commission_amount')::NUMERIC, 0);

      INSERT INTO public.staff_payroll_commissions (
        payroll_record_id, staff_id, booking_id, service_id,
        service_amount, commission_rate, commission_type, commission_amount, status
      ) VALUES (
        v_record_id, p_staff_id, v_booking.booking_id, v_booking.service_id,
        COALESCE(v_booking.line_total_paise, 0) / 100.0,
        COALESCE((v_comm_result->>'commission_rate')::NUMERIC, 0),
        COALESCE(v_comm_result->>'commission_type', 'percentage'),
        v_comm_amount, 'eligible'
      );

      v_total_commission := v_total_commission + v_comm_amount;
    END IF;
  END LOOP;

  -- Sum bonuses
  SELECT COALESCE(SUM(amount), 0) INTO v_total_bonus
  FROM public.staff_bonus_records
  WHERE staff_id = p_staff_id AND payroll_period_id = p_payroll_period_id;

  -- Sum deductions
  SELECT COALESCE(SUM(amount), 0) INTO v_total_deductions
  FROM public.staff_payroll_deductions
  WHERE payroll_record_id = v_record_id;

  -- Update totals
  UPDATE public.staff_payroll_records
  SET total_commission = v_total_commission,
      total_bonus = v_total_bonus,
      total_deductions = v_total_deductions
  WHERE id = v_record_id;

  RETURN v_record_id;
END;
$$;


-- =============================================================
-- RPC: process_payroll
-- =============================================================
CREATE OR REPLACE FUNCTION public.process_payroll(p_payroll_period_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period RECORD;
  v_is_manager BOOLEAN;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_period FROM public.payroll_periods WHERE id = p_payroll_period_id;
  IF v_period IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Period not found'); END IF;

  SELECT public.user_manages_salon(v_period.business_id) INTO v_is_manager;
  IF NOT v_is_manager THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authorized'); END IF;

  IF v_period.status NOT IN ('draft', 'processing') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Period is ' || v_period.status);
  END IF;

  UPDATE public.staff_payroll_records
  SET payment_status = 'processing', processed_at = now()
  WHERE payroll_period_id = p_payroll_period_id AND payment_status = 'pending';
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.payroll_periods SET status = 'processing' WHERE id = p_payroll_period_id;

  INSERT INTO public.staff_audit_logs (business_id, action, entity_type, entity_id, performed_by, note)
  VALUES (v_period.business_id, 'payroll_processed', 'payroll_period', p_payroll_period_id, auth.uid(),
          'Processed ' || v_count || ' payroll records');

  RETURN jsonb_build_object('ok', true, 'processed', v_count, 'status', 'processing');
END;
$$;


-- =============================================================
-- RPC: settle_payroll
-- =============================================================
CREATE OR REPLACE FUNCTION public.settle_payroll(p_payroll_period_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period RECORD;
  v_is_manager BOOLEAN;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_period FROM public.payroll_periods WHERE id = p_payroll_period_id;
  IF v_period IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Period not found'); END IF;

  SELECT public.user_manages_salon(v_period.business_id) INTO v_is_manager;
  IF NOT v_is_manager THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authorized'); END IF;

  IF v_period.status != 'processing' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Period must be processing first');
  END IF;

  UPDATE public.staff_payroll_records
  SET payment_status = 'settled', settled_at = now()
  WHERE payroll_period_id = p_payroll_period_id AND payment_status = 'processing';
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.payroll_periods SET status = 'settled' WHERE id = p_payroll_period_id;

  INSERT INTO public.staff_audit_logs (business_id, action, entity_type, entity_id, performed_by, note)
  VALUES (v_period.business_id, 'payroll_settled', 'payroll_period', p_payroll_period_id, auth.uid(),
          'Settled ' || v_count || ' payroll records');

  RETURN jsonb_build_object('ok', true, 'settled', v_count, 'status', 'settled');
END;
$$;
