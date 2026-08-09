-- =============================================================
-- NexoraOS Staff Management — Phase 3: Scheduling, Services,
-- Commission & Availability
-- =============================================================
-- Depends on Phase 1 (staff, staff_services, staff_schedules,
-- staff_service_commissions, staff_commission_settings) and
-- Phase 2 (staff_roles, permissions, role_permissions).
--
-- NEW TABLES:
--   1. staff_shifts
--   2. staff_breaks
--   3. staff_blocked_times
--   4. staff_availability_overrides
--
-- EXISTING REUSED (no modification):
--   - staff_schedules (day_of_week, start_time, end_time, is_working)
--   - staff_services (staff_id, service_id, custom_duration_minutes, is_active)
--   - staff_service_commissions (staff_id, service_id, commission_type/value)
--   - staff_commission_settings (staff_id, commission_model, defaults)
--   - bookings (staff_id, appointment_start, appointment_end)
--   - booking_items (staff_id, service_id)
--   - services (duration_minutes, price_paise)
--
-- NEW FUNCTIONS:
--   - get_staff_available_slots(business_id, staff_id, service_id, date)
--   - validate_break_inside_shift()
--
-- BOOKINGS OVERLAP PREVENTION:
--   Already exists: bookings_staff_active_slot_no_overlap (exclusion constraint)
--   New index: idx_bookings_staff_active_overlap (partial, for RPC performance)
-- =============================================================


-- =============================================================
-- 1. staff_shifts
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.staff_schedules(id) ON DELETE SET NULL,
  shift_date DATE,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  shift_type TEXT NOT NULL DEFAULT 'regular'
    CHECK (shift_type IN ('regular', 'overtime', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CHECK (end_time > start_time)
);


-- =============================================================
-- 2. staff_breaks
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_breaks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  shift_id   UUID REFERENCES public.staff_shifts(id) ON DELETE CASCADE,
  break_start TIME NOT NULL,
  break_end  TIME NOT NULL,
  break_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CHECK (break_end > break_start)
);


-- =============================================================
-- 3. staff_blocked_times
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_blocked_times (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  reason     TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CHECK (end_at > start_at)
);


-- =============================================================
-- 4. staff_availability_overrides
-- =============================================================
CREATE TABLE IF NOT EXISTS public.staff_availability_overrides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_available  BOOLEAN NOT NULL DEFAULT false,
  start_time    TIME,
  end_time      TIME,
  reason        TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CHECK (is_available = false OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)),
  UNIQUE (staff_id, override_date)
);


-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_id
  ON public.staff_shifts (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_shift_date
  ON public.staff_shifts (shift_date) WHERE shift_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_shifts_schedule_id
  ON public.staff_shifts (schedule_id) WHERE schedule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_breaks_staff_id
  ON public.staff_breaks (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_breaks_shift_id
  ON public.staff_breaks (shift_id) WHERE shift_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_breaks_break_date
  ON public.staff_breaks (break_date) WHERE break_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_blocked_times_staff_id
  ON public.staff_blocked_times (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_blocked_times_range
  ON public.staff_blocked_times (staff_id, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_staff_availability_overrides_staff_id
  ON public.staff_availability_overrides (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_overrides_date
  ON public.staff_availability_overrides (staff_id, override_date);

-- Booking overlap index for RPC performance
CREATE INDEX IF NOT EXISTS idx_bookings_staff_active_overlap
  ON public.bookings (staff_id, appointment_start, appointment_end)
  WHERE status NOT IN ('cancelled', 'completed', 'no_show') AND staff_id IS NOT NULL;


-- =============================================================
-- UPDATED_AT TRIGGERS
-- =============================================================
DROP TRIGGER IF EXISTS trg_staff_shifts_updated_at ON public.staff_shifts;
CREATE TRIGGER trg_staff_shifts_updated_at
  BEFORE UPDATE ON public.staff_shifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_breaks_updated_at ON public.staff_breaks;
CREATE TRIGGER trg_staff_breaks_updated_at
  BEFORE UPDATE ON public.staff_breaks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_availability_overrides_updated_at ON public.staff_availability_overrides;
CREATE TRIGGER trg_staff_availability_overrides_updated_at
  BEFORE UPDATE ON public.staff_availability_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- VALIDATION: break must be inside shift working time
-- =============================================================
CREATE OR REPLACE FUNCTION public.validate_break_inside_shift()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE v_start TIME; v_end TIME;
BEGIN
  IF NEW.shift_id IS NOT NULL THEN
    SELECT start_time, end_time INTO v_start, v_end
    FROM public.staff_shifts WHERE id = NEW.shift_id;
    IF v_start IS NOT NULL AND (NEW.break_start < v_start OR NEW.break_end > v_end) THEN
      RAISE EXCEPTION 'Break must be inside shift working time (% – %)', v_start, v_end;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_break_inside_shift ON public.staff_breaks;
CREATE TRIGGER trg_validate_break_inside_shift
  BEFORE INSERT OR UPDATE ON public.staff_breaks
  FOR EACH ROW EXECUTE FUNCTION public.validate_break_inside_shift();


-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE public.staff_shifts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_breaks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_blocked_times         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability_overrides ENABLE ROW LEVEL SECURITY;

-- staff_shifts
DROP POLICY IF EXISTS staff_shifts_manager_select ON public.staff_shifts;
CREATE POLICY staff_shifts_manager_select ON public.staff_shifts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_shifts_manager_insert ON public.staff_shifts;
CREATE POLICY staff_shifts_manager_insert ON public.staff_shifts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_shifts_manager_update ON public.staff_shifts;
CREATE POLICY staff_shifts_manager_update ON public.staff_shifts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_shifts_manager_delete ON public.staff_shifts;
CREATE POLICY staff_shifts_manager_delete ON public.staff_shifts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));

-- staff_breaks
DROP POLICY IF EXISTS staff_breaks_manager_select ON public.staff_breaks;
CREATE POLICY staff_breaks_manager_select ON public.staff_breaks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_breaks_manager_insert ON public.staff_breaks;
CREATE POLICY staff_breaks_manager_insert ON public.staff_breaks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_breaks_manager_update ON public.staff_breaks;
CREATE POLICY staff_breaks_manager_update ON public.staff_breaks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_breaks_manager_delete ON public.staff_breaks;
CREATE POLICY staff_breaks_manager_delete ON public.staff_breaks FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));

-- staff_blocked_times
DROP POLICY IF EXISTS staff_blocked_times_manager_select ON public.staff_blocked_times;
CREATE POLICY staff_blocked_times_manager_select ON public.staff_blocked_times FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_blocked_times_manager_insert ON public.staff_blocked_times;
CREATE POLICY staff_blocked_times_manager_insert ON public.staff_blocked_times FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_blocked_times_manager_update ON public.staff_blocked_times;
CREATE POLICY staff_blocked_times_manager_update ON public.staff_blocked_times FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_blocked_times_manager_delete ON public.staff_blocked_times;
CREATE POLICY staff_blocked_times_manager_delete ON public.staff_blocked_times FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));

-- staff_availability_overrides
DROP POLICY IF EXISTS staff_availability_overrides_manager_select ON public.staff_availability_overrides;
CREATE POLICY staff_availability_overrides_manager_select ON public.staff_availability_overrides FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_availability_overrides_manager_insert ON public.staff_availability_overrides;
CREATE POLICY staff_availability_overrides_manager_insert ON public.staff_availability_overrides FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_availability_overrides_manager_update ON public.staff_availability_overrides;
CREATE POLICY staff_availability_overrides_manager_update ON public.staff_availability_overrides FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));
DROP POLICY IF EXISTS staff_availability_overrides_manager_delete ON public.staff_availability_overrides;
CREATE POLICY staff_availability_overrides_manager_delete ON public.staff_availability_overrides FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.staff s WHERE s.id = staff_id AND public.user_manages_salon(s.salon_id)));


-- =============================================================
-- RPC: get_staff_available_slots
-- =============================================================
-- Returns genuinely available time slots for a given staff member
-- on a given date, considering:
--   - Regular schedule (staff_schedules)
--   - Custom/overtime shifts (staff_shifts)
--   - Breaks (staff_breaks)
--   - Blocked times (staff_blocked_times)
--   - Availability overrides (staff_availability_overrides)
--   - Leave (availability override with is_available=false)
--   - Existing bookings (bookings)
--   - Service duration (services.duration_minutes + staff_services.custom_duration_minutes)
--
-- Uses Asia/Kolkata timezone for all slot generation.
-- Generates 30-minute slot windows.

CREATE OR REPLACE FUNCTION public.get_staff_available_slots(
  p_business_id UUID,
  p_staff_id UUID,
  p_service_id UUID,
  p_date DATE
)
RETURNS TABLE(slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_of_week SMALLINT;
  v_service_duration INT;
  v_effective_duration INT;
  v_schedule_start TIME;
  v_schedule_end TIME;
  v_is_working BOOLEAN;
  v_override_available BOOLEAN;
  v_override_start TIME;
  v_override_end TIME;
  v_has_override BOOLEAN;
  v_slot_start TIME;
  v_slot_end TIME;
  v_blocked BOOLEAN;
  v_in_break BOOLEAN;
  v_in_booking BOOLEAN;
  v_slot_tstz_start TIMESTAMPTZ;
  v_slot_tstz_end TIMESTAMPTZ;
  v_tz TEXT := 'Asia/Kolkata';
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::SMALLINT;

  -- Get effective service duration
  SELECT s.duration_minutes,
         COALESCE(NULLIF(ss.custom_duration_minutes, 0), s.duration_minutes)
  INTO v_service_duration, v_effective_duration
  FROM public.services s
  LEFT JOIN public.staff_services ss
    ON ss.service_id = s.id AND ss.staff_id = p_staff_id AND ss.is_active = true
  WHERE s.id = p_service_id AND s.deleted_at IS NULL;

  IF v_service_duration IS NULL THEN
    RAISE EXCEPTION 'Service not found or deleted';
  END IF;

  -- Check availability override
  SELECT sao.is_available, sao.start_time, sao.end_time, true
  INTO v_override_available, v_override_start, v_override_end, v_has_override
  FROM public.staff_availability_overrides sao
  WHERE sao.staff_id = p_staff_id AND sao.override_date = p_date
  LIMIT 1;

  -- Override says NOT available → no slots
  IF v_has_override AND NOT v_override_available THEN
    RETURN;
  END IF;

  -- Determine working window
  IF v_has_override AND v_override_available THEN
    v_schedule_start := v_override_start;
    v_schedule_end := v_override_end;
    v_is_working := true;
  ELSE
    -- Regular schedule
    SELECT ss.start_time, ss.end_time, ss.is_working
    INTO v_schedule_start, v_schedule_end, v_is_working
    FROM public.staff_schedules ss
    WHERE ss.staff_id = p_staff_id AND ss.day_of_week = v_day_of_week
    LIMIT 1;

    IF NOT COALESCE(v_is_working, false) THEN
      -- Try custom shift
      SELECT sh.start_time, sh.end_time
      INTO v_schedule_start, v_schedule_end
      FROM public.staff_shifts sh
      WHERE sh.staff_id = p_staff_id AND sh.shift_date = p_date
      LIMIT 1;

      IF v_schedule_start IS NULL THEN
        RETURN; -- Not working, no override, no custom shift
      END IF;
    END IF;
  END IF;

  -- Generate 30-minute slots
  v_slot_start := v_schedule_start;

  WHILE v_slot_start + (v_effective_duration || ' minutes')::INTERVAL <= v_schedule_end LOOP
    v_slot_end := v_slot_start + (v_effective_duration || ' minutes')::INTERVAL;

    -- Convert to TIMESTAMPTZ (IST → UTC)
    v_slot_tstz_start := timezone(v_tz, (p_date + v_slot_start)::TIMESTAMP);
    v_slot_tstz_end := timezone(v_tz, (p_date + v_slot_end)::TIMESTAMP);

    v_blocked := false;

    -- Check breaks
    SELECT EXISTS (
      SELECT 1 FROM public.staff_breaks sb
      WHERE sb.staff_id = p_staff_id
        AND (sb.break_date IS NULL OR sb.break_date = p_date)
        AND sb.break_start < v_slot_end
        AND sb.break_end > v_slot_start
    ) INTO v_in_break;

    IF v_in_break THEN v_blocked := true; END IF;

    -- Check blocked times
    IF NOT v_blocked THEN
      SELECT EXISTS (
        SELECT 1 FROM public.staff_blocked_times sbt
        WHERE sbt.staff_id = p_staff_id
          AND sbt.start_at < v_slot_tstz_end
          AND sbt.end_at > v_slot_tstz_start
      ) INTO v_blocked;
    END IF;

    -- Check existing bookings
    IF NOT v_blocked THEN
      SELECT EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.staff_id = p_staff_id
          AND b.status NOT IN ('cancelled', 'completed', 'no_show')
          AND b.appointment_start < v_slot_tstz_end
          AND b.appointment_end > v_slot_tstz_start
      ) INTO v_in_booking;

      IF COALESCE(v_in_booking, false) THEN
        v_blocked := true;
      END IF;
    END IF;

    -- Emit available slot
    IF NOT v_blocked THEN
      slot_start := v_slot_tstz_start;
      slot_end := v_slot_tstz_end;
      RETURN NEXT;
    END IF;

    v_slot_start := v_slot_start + INTERVAL '30 minutes';
  END LOOP;
END;
$$;
