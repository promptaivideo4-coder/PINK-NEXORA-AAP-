-- =============================================================
-- NexoraOS Staff Management — Phase 4: Attendance, Leave & Shift Swap
-- =============================================================
-- Depends on Phase 1-3.
--
-- NEW TABLES:
--   1. staff_attendance
--   2. leave_types
--   3. staff_leave_balances
--   4. staff_leave_requests
--   5. staff_shift_swap_requests
--
-- EXISTING REUSED:
--   - staff (id, salon_id, user_id)
--   - staff_shifts (id, shift_id for swap)
--   - staff_availability_overrides (created on leave approval)
--   - bookings (checked during swap approval)
--   - staff_blocked_times (checked during swap approval)
--
-- NEW FUNCTIONS:
--   - approve_leave_request(request_id, manager_note)
--   - reject_leave_request(request_id, manager_note)
--   - approve_shift_swap(request_id)
--   - reject_shift_swap(request_id, reason)
--   - prevent_overlapping_leave() — trigger
--   - auto_calc_worked_minutes() — trigger
--   - seed_leave_types_for_business(business_id)
--   - auto_seed_leave_types() — trigger
-- =============================================================


-- =============================================================
-- 1. staff_attendance
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in        TIMESTAMPTZ,
  check_out       TIMESTAMPTZ,
  worked_minutes  INTEGER DEFAULT 0 CHECK (worked_minutes >= 0),
  status          TEXT NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'late', 'absent', 'half_day', 'leave')),
  manager_note    TEXT,
  edited_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  edited_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (staff_id, attendance_date),
  CHECK (check_out IS NULL OR check_in IS NULL OR check_out >= check_in)
);


-- =============================================================
-- 2. leave_types
-- =============================================================
CREATE TABLE IF NOT EXISTS public.leave_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  default_days  INTEGER NOT NULL DEFAULT 0 CHECK (default_days >= 0),
  is_paid       BOOLEAN NOT NULL DEFAULT true,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (business_id, name)
);


-- =============================================================
-- 3. staff_leave_balances
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_leave_balances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type_id   UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  allocated_days  NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (allocated_days >= 0),
  used_days       NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (used_days >= 0),
  remaining_days  NUMERIC(5,1) GENERATED ALWAYS AS (allocated_days - used_days) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (staff_id, leave_type_id, year)
);


-- =============================================================
-- 4. staff_leave_requests
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_leave_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type_id   UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  total_days      NUMERIC(5,1) NOT NULL CHECK (total_days > 0),
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  manager_note    TEXT,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CHECK (end_date >= start_date)
);


-- =============================================================
-- 5. staff_shift_swap_requests
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_shift_swap_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_staff_id   UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  replacement_staff_id  UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  shift_id              UUID REFERENCES public.staff_shifts(id) ON DELETE SET NULL,
  swap_date             DATE NOT NULL,
  original_start_time   TIME NOT NULL,
  original_end_time     TIME NOT NULL,
  reason                TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);


-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id
  ON public.staff_attendance (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_business_id
  ON public.staff_attendance (business_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date
  ON public.staff_attendance (staff_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_leave_types_business_id
  ON public.leave_types (business_id);

CREATE INDEX IF NOT EXISTS idx_staff_leave_balances_staff_id
  ON public.staff_leave_balances (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_balances_year
  ON public.staff_leave_balances (staff_id, year);

CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_staff_id
  ON public.staff_leave_requests (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_status
  ON public.staff_leave_requests (staff_id, status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_dates
  ON public.staff_leave_requests (staff_id, start_date, end_date) WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_staff_shift_swap_requests_req
  ON public.staff_shift_swap_requests (requesting_staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shift_swap_requests_rep
  ON public.staff_shift_swap_requests (replacement_staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shift_swap_requests_status
  ON public.staff_shift_swap_requests (status) WHERE status = 'pending';


-- =============================================================
-- TRIGGERS: updated_at
-- =============================================================
DROP TRIGGER IF EXISTS trg_staff_attendance_updated_at ON public.staff_attendance;
CREATE TRIGGER trg_staff_attendance_updated_at
  BEFORE UPDATE ON public.staff_attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_leave_balances_updated_at ON public.staff_leave_balances;
CREATE TRIGGER trg_staff_leave_balances_updated_at
  BEFORE UPDATE ON public.staff_leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_leave_requests_updated_at ON public.staff_leave_requests;
CREATE TRIGGER trg_staff_leave_requests_updated_at
  BEFORE UPDATE ON public.staff_leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_shift_swap_requests_updated_at ON public.staff_shift_swap_requests;
CREATE TRIGGER trg_staff_shift_swap_requests_updated_at
  BEFORE UPDATE ON public.staff_shift_swap_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- VALIDATION: Prevent overlapping approved leave
-- =============================================================
CREATE OR REPLACE FUNCTION public.prevent_overlapping_leave()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    IF EXISTS (
      SELECT 1 FROM public.staff_leave_requests slr
      WHERE slr.staff_id = NEW.staff_id
        AND slr.id != NEW.id
        AND slr.status = 'approved'
        AND slr.start_date <= NEW.end_date
        AND slr.end_date >= NEW.start_date
    ) THEN
      RAISE EXCEPTION 'Overlapping approved leave exists for this staff member in the requested date range';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_overlapping_leave ON public.staff_leave_requests;
CREATE TRIGGER trg_prevent_overlapping_leave
  BEFORE INSERT OR UPDATE ON public.staff_leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.prevent_overlapping_leave();


-- =============================================================
-- VALIDATION: Auto-calculate worked_minutes on check_out
-- =============================================================
CREATE OR REPLACE FUNCTION public.auto_calc_worked_minutes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
    NEW.worked_minutes := EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 60;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_calc_worked_minutes ON public.staff_attendance;
CREATE TRIGGER trg_auto_calc_worked_minutes
  BEFORE INSERT OR UPDATE ON public.staff_attendance
  FOR EACH ROW EXECUTE FUNCTION public.auto_calc_worked_minutes();


-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE public.staff_attendance           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leave_balances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leave_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shift_swap_requests  ENABLE ROW LEVEL SECURITY;

-- staff_attendance: manager CRUD + staff self-read
DROP POLICY IF EXISTS attendance_manager_select ON public.staff_attendance;
CREATE POLICY attendance_manager_select ON public.staff_attendance FOR SELECT
  USING (public.user_manages_salon(business_id));
DROP POLICY IF EXISTS attendance_manager_insert ON public.staff_attendance;
CREATE POLICY attendance_manager_insert ON public.staff_attendance FOR INSERT
  WITH CHECK (public.user_manages_salon(business_id));
DROP POLICY IF EXISTS attendance_manager_update ON public.staff_attendance;
CREATE POLICY attendance_manager_update ON public.staff_attendance FOR UPDATE
  USING (public.user_manages_salon(business_id))
  WITH CHECK (public.user_manages_salon(business_id));
DROP POLICY IF EXISTS attendance_manager_delete ON public.staff_attendance;
CREATE POLICY attendance_manager_delete ON public.staff_attendance FOR DELETE
  USING (public.user_manages_salon(business_id));
DROP POLICY IF EXISTS attendance_self_select ON public.staff_attendance;
CREATE POLICY attendance_self_select ON public.staff_attendance FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));

-- leave_types: manager CRUD + staff read active types
DROP POLICY IF EXISTS leave_types_manager_select ON public.leave_types;
CREATE POLICY leave_types_manager_select ON public.leave_types FOR SELECT
  USING (public.user_manages_salon(business_id));
DROP POLICY IF EXISTS leave_types_manager_insert ON public.leave_types;
CREATE POLICY leave_types_manager_insert ON public.leave_types FOR INSERT
  WITH CHECK (public.user_manages_salon(business_id));
DROP POLICY IF EXISTS leave_types_manager_update ON public.leave_types;
CREATE POLICY leave_types_manager_update ON public.leave_types FOR UPDATE
  USING (public.user_manages_salon(business_id))
  WITH CHECK (public.user_manages_salon(business_id));
DROP POLICY IF EXISTS leave_types_staff_select ON public.leave_types;
CREATE POLICY leave_types_staff_select ON public.leave_types FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.staff s WHERE s.salon_id = business_id AND s.user_id = auth.uid() AND s.deleted_at IS NULL
  ));

-- staff_leave_balances: manager read/update + staff self-read
DROP POLICY IF EXISTS leave_balances_manager_select ON public.staff_leave_balances;
CREATE POLICY leave_balances_manager_select ON public.staff_leave_balances FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS leave_balances_manager_update ON public.staff_leave_balances;
CREATE POLICY leave_balances_manager_update ON public.staff_leave_balances FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS leave_balances_self_select ON public.staff_leave_balances;
CREATE POLICY leave_balances_self_select ON public.staff_leave_balances FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));

-- staff_leave_requests: manager read/update + staff self-read/self-insert
DROP POLICY IF EXISTS leave_requests_manager_select ON public.staff_leave_requests;
CREATE POLICY leave_requests_manager_select ON public.staff_leave_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS leave_requests_manager_update ON public.staff_leave_requests;
CREATE POLICY leave_requests_manager_update ON public.staff_leave_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS leave_requests_self_select ON public.staff_leave_requests;
CREATE POLICY leave_requests_self_select ON public.staff_leave_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS leave_requests_self_insert ON public.staff_leave_requests;
CREATE POLICY leave_requests_self_insert ON public.staff_leave_requests FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));

-- staff_shift_swap_requests: manager read/update + staff self-read/self-insert
DROP POLICY IF EXISTS swap_requests_manager_select ON public.staff_shift_swap_requests;
CREATE POLICY swap_requests_manager_select ON public.staff_shift_swap_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = requesting_staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS swap_requests_manager_update ON public.staff_shift_swap_requests;
CREATE POLICY swap_requests_manager_update ON public.staff_shift_swap_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = requesting_staff_id AND public.user_manages_salon(s.salon_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = requesting_staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS swap_requests_self_select ON public.staff_shift_swap_requests;
CREATE POLICY swap_requests_self_select ON public.staff_shift_swap_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE (s.id = requesting_staff_id OR s.id = replacement_staff_id) AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS swap_requests_self_insert ON public.staff_shift_swap_requests;
CREATE POLICY swap_requests_self_insert ON public.staff_shift_swap_requests FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = requesting_staff_id AND s.user_id = auth.uid()));


-- =============================================================
-- SEED: Default leave types
-- =============================================================
CREATE OR REPLACE FUNCTION public.seed_leave_types_for_business(p_business_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.leave_types WHERE business_id = p_business_id) THEN RETURN; END IF;
  INSERT INTO public.leave_types (business_id, name, default_days, is_paid) VALUES
    (p_business_id, 'Casual Leave', 12, true),
    (p_business_id, 'Sick Leave', 6, true),
    (p_business_id, 'Emergency Leave', 3, true),
    (p_business_id, 'Personal Leave', 5, false),
    (p_business_id, 'Other', 0, false);
END;
$$;

-- Seed for existing salons
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.salons WHERE deleted_at IS NULL LOOP
    PERFORM public.seed_leave_types_for_business(r.id);
  END LOOP;
END $$;

-- Auto-seed for new salons
CREATE OR REPLACE FUNCTION public.auto_seed_leave_types()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_leave_types_for_business(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_seed_leave_types ON public.salons;
CREATE TRIGGER trg_auto_seed_leave_types
  AFTER INSERT ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.auto_seed_leave_types();


-- =============================================================
-- RPC: approve_leave_request
-- =============================================================
CREATE OR REPLACE FUNCTION public.approve_leave_request(
  p_request_id UUID,
  p_manager_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req RECORD;
  v_is_manager BOOLEAN;
  v_year INTEGER;
BEGIN
  SELECT slr.*, s.salon_id INTO v_req
  FROM public.staff_leave_requests slr
  JOIN public.staff s ON s.id = slr.staff_id
  WHERE slr.id = p_request_id;

  IF v_req IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Request not found');
  END IF;

  SELECT public.user_manages_salon(v_req.salon_id) INTO v_is_manager;
  IF NOT v_is_manager THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Request is not pending');
  END IF;

  v_year := EXTRACT(YEAR FROM v_req.start_date);

  -- Update or create leave balance
  INSERT INTO public.staff_leave_balances (staff_id, leave_type_id, year, allocated_days, used_days)
  VALUES (v_req.staff_id, v_req.leave_type_id, v_year, 0, v_req.total_days)
  ON CONFLICT (staff_id, leave_type_id, year)
  DO UPDATE SET used_days = public.staff_leave_balances.used_days + v_req.total_days;

  -- Mark leave days as unavailable
  INSERT INTO public.staff_availability_overrides (staff_id, override_date, is_available, reason)
  SELECT v_req.staff_id, d::DATE, false, 'Approved leave: ' || COALESCE(v_req.reason, '')
  FROM generate_series(v_req.start_date, v_req.end_date, '1 day'::INTERVAL) d
  ON CONFLICT (staff_id, override_date)
  DO UPDATE SET is_available = false, reason = 'Approved leave: ' || COALESCE(v_req.reason, '');

  -- Approve the request
  UPDATE public.staff_leave_requests
  SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), manager_note = p_manager_note
  WHERE id = p_request_id;

  RETURN jsonb_build_object('ok', true, 'status', 'approved');
END;
$$;


-- =============================================================
-- RPC: reject_leave_request
-- =============================================================
CREATE OR REPLACE FUNCTION public.reject_leave_request(
  p_request_id UUID,
  p_manager_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req RECORD;
  v_is_manager BOOLEAN;
BEGIN
  SELECT slr.*, s.salon_id INTO v_req
  FROM public.staff_leave_requests slr
  JOIN public.staff s ON s.id = slr.staff_id
  WHERE slr.id = p_request_id;

  IF v_req IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Request not found');
  END IF;

  SELECT public.user_manages_salon(v_req.salon_id) INTO v_is_manager;
  IF NOT v_is_manager THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Request is not pending');
  END IF;

  UPDATE public.staff_leave_requests
  SET status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), manager_note = p_manager_note
  WHERE id = p_request_id;

  RETURN jsonb_build_object('ok', true, 'status', 'rejected');
END;
$$;


-- =============================================================
-- RPC: approve_shift_swap
-- =============================================================
CREATE OR REPLACE FUNCTION public.approve_shift_swap(p_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req RECORD;
  v_is_manager BOOLEAN;
BEGIN
  SELECT ssr.*, s.salon_id INTO v_req
  FROM public.staff_shift_swap_requests ssr
  JOIN public.staff s ON s.id = ssr.requesting_staff_id
  WHERE ssr.id = p_request_id;

  IF v_req IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Request not found');
  END IF;

  SELECT public.user_manages_salon(v_req.salon_id) INTO v_is_manager;
  IF NOT v_is_manager THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Request is not pending');
  END IF;

  -- Verify replacement staff is active
  IF NOT EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = v_req.replacement_staff_id AND is_active = true AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Replacement staff is not active');
  END IF;

  -- Verify no leave on swap date
  IF EXISTS (
    SELECT 1 FROM public.staff_leave_requests slr
    WHERE slr.staff_id = v_req.replacement_staff_id
      AND slr.status = 'approved'
      AND v_req.swap_date BETWEEN slr.start_date AND slr.end_date
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Replacement staff has approved leave on this date');
  END IF;

  -- Verify no blocked time
  IF EXISTS (
    SELECT 1 FROM public.staff_blocked_times sbt
    WHERE sbt.staff_id = v_req.replacement_staff_id
      AND sbt.start_at < timezone('Asia/Kolkata', (v_req.swap_date + v_req.original_end_time)::TIMESTAMP)
      AND sbt.end_at > timezone('Asia/Kolkata', (v_req.swap_date + v_req.original_start_time)::TIMESTAMP)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Replacement staff has blocked time during this shift');
  END IF;

  -- Verify no overlapping booking
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.staff_id = v_req.replacement_staff_id
      AND b.status NOT IN ('cancelled', 'completed', 'no_show')
      AND b.appointment_start < timezone('Asia/Kolkata', (v_req.swap_date + v_req.original_end_time)::TIMESTAMP)
      AND b.appointment_end > timezone('Asia/Kolkata', (v_req.swap_date + v_req.original_start_time)::TIMESTAMP)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Replacement staff has overlapping booking');
  END IF;

  -- Verify no conflicting shift
  IF EXISTS (
    SELECT 1 FROM public.staff_shifts ss
    WHERE ss.staff_id = v_req.replacement_staff_id
      AND ss.shift_date = v_req.swap_date
      AND ss.start_time < v_req.original_end_time
      AND ss.end_time > v_req.original_start_time
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Replacement staff has a conflicting shift');
  END IF;

  -- Approve: reassign the shift
  IF v_req.shift_id IS NOT NULL THEN
    UPDATE public.staff_shifts SET staff_id = v_req.replacement_staff_id WHERE id = v_req.shift_id;
  END IF;

  UPDATE public.staff_shift_swap_requests
  SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('ok', true, 'status', 'approved');
END;
$$;


-- =============================================================
-- RPC: reject_shift_swap
-- =============================================================
CREATE OR REPLACE FUNCTION public.reject_shift_swap(
  p_request_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req RECORD;
  v_is_manager BOOLEAN;
BEGIN
  SELECT ssr.*, s.salon_id INTO v_req
  FROM public.staff_shift_swap_requests ssr
  JOIN public.staff s ON s.id = ssr.requesting_staff_id
  WHERE ssr.id = p_request_id;

  IF v_req IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Request not found');
  END IF;

  SELECT public.user_manages_salon(v_req.salon_id) INTO v_is_manager;
  IF NOT v_is_manager THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authorized');
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Request is not pending');
  END IF;

  UPDATE public.staff_shift_swap_requests
  SET status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('ok', true, 'status', 'rejected');
END;
$$;
