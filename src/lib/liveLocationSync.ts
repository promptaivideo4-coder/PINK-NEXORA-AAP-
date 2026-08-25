/**
 * liveLocationSync.ts
 * ===================
 * Backend data layer for the authenticated user's LIVE location.
 *
 * Rules enforced here:
 *  - Uses the ONE shared Supabase client (`src/lib/supabase.ts`) with the
 *    signed-in user's JWT, so every write is evaluated by Postgres RLS.
 *    No service_role key, no SECURITY DEFINER bypass, no anon writes.
 *  - Writes only to `public.user_live_locations`, an RLS-protected table whose
 *    policies allow a user to read/update ONLY their own row
 *    (see supabase/migrations/20260825_user_live_locations.sql).
 *  - Never touches `public.salons` location columns: the canonical shop
 *    location stays owner-confirmed via the existing `update_shop_location`
 *    RPC / ShopLocation screen. Live tracking must not overwrite it.
 *
 * The module degrades gracefully: if the live-location table has not been
 * created in the project yet (or RLS rejects the write), backend sync is
 * switched off for the session and the device keeps working GPS-only.
 */

import { supabase } from './supabase';
import type { ValidatedLocation } from '../location/types';

export const LIVE_LOCATION_TABLE = 'user_live_locations';

/** Outcome of a single backend push. */
export type LiveLocationSyncResult =
  | 'synced'
  | 'skipped'
  | 'disabled'
  | 'error';

export interface LiveLocationRow {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy_m: number | null;
  heading: number | null;
  speed_mps: number | null;
  captured_at: string;
  synced_at: string;
  source: 'gps' | 'manual';
}

/**
 * True once a push has failed in a way that will keep failing for this session
 * (missing table / missing column). Prevents hammering the API on every fix.
 */
let backendAvailable = true;
let disabledReason: string | null = null;

export function isBackendSyncEnabled(): boolean {
  return backendAvailable;
}

export function getBackendSyncDisabledReason(): string | null {
  return disabledReason;
}

/** Re-arm backend sync (used when a new session starts). */
export function resetBackendSyncAvailability(): void {
  backendAvailable = true;
  disabledReason = null;
}

function isSchemaError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code || '';
  // 42P01 undefined_table, 42703 undefined_column, PGRST205 unknown relation
  if (code === '42P01' || code === '42703' || code === 'PGRST205') return true;
  const message = (error.message || '').toLowerCase();
  return message.includes('does not exist') || message.includes('could not find the table');
}

/**
 * Upsert the authenticated user's latest validated fix.
 *
 * The row is keyed by `user_id`, so this is an idempotent "latest position"
 * record — one row per user, no unbounded location history.
 */
export async function syncUserLiveLocation(
  userId: string,
  location: ValidatedLocation,
): Promise<LiveLocationSyncResult> {
  if (!backendAvailable || !userId) return 'disabled';

  const nowIso = new Date().toISOString();
  const capturedAt = new Date(location.timestamp || Date.now()).toISOString();

  const row: LiveLocationRow = {
    user_id: userId,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy_m: Number.isFinite(location.accuracy) ? location.accuracy : null,
    heading: location.heading ?? null,
    speed_mps: location.speed ?? null,
    captured_at: capturedAt,
    synced_at: nowIso,
    source: 'gps',
  };

  try {
    const { error } = await supabase
      .from(LIVE_LOCATION_TABLE)
      .upsert(row, { onConflict: 'user_id' });

    if (!error) return 'synced';

    if (isSchemaError(error)) {
      // Table not migrated on this project yet — stop retrying, keep GPS local.
      backendAvailable = false;
      disabledReason = error.message || `${LIVE_LOCATION_TABLE} is unavailable`;
      return 'disabled';
    }

    return 'error';
  } catch (error) {
    // Network drop / aborted request / unexpected client failure. A location
    // write must never escape as an unhandled exception: the device keeps
    // tracking locally and the caller decides whether to retry.
    const message = error instanceof Error ? error.message : String(error);
    if (isSchemaError({ message })) {
      backendAvailable = false;
      disabledReason = message;
      return 'disabled';
    }
    return 'error';
  }
}

/**
 * Remove the stored live position for a user (privacy cleanup on sign-out).
 * Best-effort: a failure here must never block the sign-out flow, and RLS
 * already guarantees only the owner's own row can be affected.
 */
export async function clearUserLiveLocation(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await supabase.from(LIVE_LOCATION_TABLE).delete().eq('user_id', userId);
  } catch {
    // ignore — sign-out cleanup is best-effort
  }
}
