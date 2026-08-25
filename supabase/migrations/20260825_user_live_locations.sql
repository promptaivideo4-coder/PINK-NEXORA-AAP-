-- ============================================================
-- 20260825_user_live_locations.sql
-- ============================================================
-- Private, per-user LIVE location record used by the authenticated
-- shop-owner/staff PWA (`src/hooks/useLocationSync.ts` +
-- `src/lib/liveLocationSync.ts`).
--
-- SECURITY MODEL
--   * RLS ON, and every policy is scoped to `auth.uid() = user_id`, so a
--     signed-in user can only ever read or write THEIR OWN row.
--   * NO policy for `anon` → the table is invisible/unwritable to logged-out
--     visitors and to the public salon websites. Live positions are never
--     exposed publicly.
--   * The app talks to this table with the normal anon key + the user's JWT
--     (role = authenticated). No service_role key, no SECURITY DEFINER
--     function, therefore no RLS bypass anywhere.
--   * One row per user (PK on user_id) — an upserted "latest position", not an
--     unbounded location history.
--
-- NOTE: this table intentionally does NOT replace the canonical shop location
-- on public.salons. The shop location stays owner-confirmed through the
-- existing `update_shop_location` RPC / ShopLocation screen.
--
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_live_locations (
  user_id      uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  latitude     double precision NOT NULL,
  longitude    double precision NOT NULL,
  accuracy_m   double precision,
  heading      double precision,
  speed_mps    double precision,
  captured_at  timestamptz NOT NULL DEFAULT timezone('utc', now()),
  synced_at    timestamptz NOT NULL DEFAULT timezone('utc', now()),
  source       text NOT NULL DEFAULT 'gps' CHECK (source IN ('gps', 'manual')),
  CONSTRAINT user_live_locations_latitude_range
    CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT user_live_locations_longitude_range
    CHECK (longitude BETWEEN -180 AND 180)
);

-- Fast "recently seen" lookups for owner-side dashboards (still RLS-gated).
CREATE INDEX IF NOT EXISTS idx_user_live_locations_synced_at
  ON public.user_live_locations (synced_at DESC);

ALTER TABLE public.user_live_locations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Policies: own row only.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read their own live location"
  ON public.user_live_locations;
CREATE POLICY "Users can read their own live location"
  ON public.user_live_locations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own live location"
  ON public.user_live_locations;
CREATE POLICY "Users can insert their own live location"
  ON public.user_live_locations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own live location"
  ON public.user_live_locations;
CREATE POLICY "Users can update their own live location"
  ON public.user_live_locations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own live location"
  ON public.user_live_locations;
CREATE POLICY "Users can delete their own live location"
  ON public.user_live_locations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Grants: authenticated only. `anon` and `public` get nothing.
-- ------------------------------------------------------------
REVOKE ALL ON public.user_live_locations FROM anon;
REVOKE ALL ON public.user_live_locations FROM public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_live_locations TO authenticated;

COMMENT ON TABLE public.user_live_locations IS
  'Private live position per authenticated user. Own-row RLS only; never public. Separate from the owner-confirmed shop location on public.salons.';
COMMENT ON COLUMN public.user_live_locations.synced_at IS
  'When the device last pushed this row (ISO/timestamptz, UTC).';
COMMENT ON COLUMN public.user_live_locations.accuracy_m IS
  'GPS accuracy in metres reported by the device for this fix.';
