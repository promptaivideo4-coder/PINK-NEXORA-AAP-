-- ============================================================
-- 20260810_location_fields.sql
-- ============================================================
-- Ensures all location columns exist on public.salons table.
-- Uses ALTER TABLE ... ADD COLUMN IF NOT EXISTS — safe to re-run.
-- ============================================================

-- Location columns (canonical shop location set by owner)
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_address text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_city text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_area text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_zone text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_landmark text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_pincode text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_accuracy_m numeric;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_source text CHECK (location_source IN ('gps', 'manual'));
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS location_confirmed_at timestamptz;

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_salons_location_confirmed ON public.salons(location_confirmed) WHERE location_confirmed = true;
CREATE INDEX IF NOT EXISTS idx_salons_latlng ON public.salons(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- RLS: Allow owner to UPDATE their own salon's location fields
-- (The existing RLS policy should already cover this via organization_members,
-- but the RPC update_shop_location uses SECURITY DEFINER as a safe fallback.)

COMMENT ON COLUMN public.salons.location_source IS 'gps = set via device GPS; manual = pin placed on map';
COMMENT ON COLUMN public.salons.location_confirmed IS 'TRUE only after owner explicitly confirms via "Save Shop Location" button';
COMMENT ON COLUMN public.salons.location_confirmed_at IS 'ISO timestamp when owner last confirmed the location';
COMMENT ON COLUMN public.salons.location_accuracy_m IS 'GPS accuracy in meters at time of selection (informational only)';
