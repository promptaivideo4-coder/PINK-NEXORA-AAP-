/**
 * offlineReplay.ts
 * ================
 * The REAL offline write path for Nexora.
 *
 * Why this file exists
 * --------------------
 * The app used to have two disconnected offline implementations and neither of
 * them could actually persist anything:
 *
 *  1. `public/sw.js` contained a genuine Background Sync handler — but it is
 *     never shipped. `vite-plugin-pwa` runs in `generateSW` mode and writes its
 *     own `dist/sw.js`, overwriting the copied `public/sw.js` at build time. So
 *     `registration.sync.register('sync-supabase')` registered a tag that no
 *     service worker was listening for. Queued writes were silently dropped.
 *  2. `OfflineSyncContext` kept a list of human-readable strings in
 *     localStorage and its `triggerSync()` was `await sleep(2200)` followed by
 *     marking everything "complete" — a purely cosmetic simulation.
 *
 * This module replaces both with one schema-correct replay engine that runs in
 * the page (so it works with the generated Workbox service worker) and is also
 * imported by the service worker for true background replay when the tab is
 * closed.
 *
 * Design rules
 * ------------
 *  - Payloads are validated and normalised to the real column names of
 *    `public.bookings` / `public.customers` before they are written. The old
 *    queue stored invented fields (`client_id`, `service_id: 'haircut-1'`,
 *    `appointment_time`) that do not exist in the schema, so replay could never
 *    have succeeded even with a working sync handler.
 *  - A failed action STAYS in the queue and is retried on the next drain. It is
 *    never silently discarded.
 *  - Actions that are structurally invalid (can never succeed) are reported as
 *    `rejected` so the UI can surface them instead of retrying forever.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** Action types the offline queue understands. */
export type OfflineActionType = 'CREATE_CLIENT' | 'CREATE_APPOINTMENT' | 'UPDATE_PROFILE';

export interface OfflineAction {
  id?: number;
  type: OfflineActionType;
  data: Record<string, unknown>;
  timestamp: number;
  /** Bumped on every failed attempt so poison pills can be surfaced. */
  attempts?: number;
  /** Last error message, for the sync-status popover. */
  lastError?: string;
  /**
   * Access token captured when the action was queued.
   *
   * The page replays with the live Supabase session, so this is only consulted
   * by the service worker. RLS still decides what the write may do — the token
   * is the user's own, stored in their own origin, and never sent anywhere else.
   */
  accessToken?: string;
}

/**
 * Supplies the client used to write an action.
 *
 * The page passes a constant factory returning the shared, session-backed
 * client. The service worker builds a short-lived client per action using the
 * token captured at enqueue time (see `OfflineAction.accessToken`).
 */
export type ClientFactory = (action: OfflineAction) => SupabaseClient | Promise<SupabaseClient>;

export type ReplayOutcome = 'synced' | 'retryable-failure' | 'rejected';

export interface ReplayResult {
  action: OfflineAction;
  outcome: ReplayOutcome;
  error?: string;
}

export interface DrainResult {
  total: number;
  synced: number;
  failed: number;
  rejected: number;
  remaining: number;
  results: ReplayResult[];
}

/* ------------------------------------------------------------------ */
/* Payload normalisation                                               */
/* ------------------------------------------------------------------ */

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function toIso(value: unknown): string | null {
  const raw = asString(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Splits a free-text name into `first_name` / `last_name`, which is what
 * `public.customers` actually stores (`full_name` is a generated column and
 * cannot be written to).
 */
function splitName(name: string): { first_name: string; last_name: string | null } {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first_name: name, last_name: null };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

/** Builds a `public.customers` insert row, or null when the payload is unusable. */
export function toCustomerRow(action: OfflineAction): Record<string, unknown> | null {
  const data = action.data ?? {};
  const salonId = asString(data.salon_id);
  const phone = asString(data.phone) ?? asString(data.customer_phone);
  const name = asString(data.name) ?? asString(data.customer_name);

  if (!salonId || !phone || !name) return null;

  const { first_name, last_name } = splitName(name);
  return {
    salon_id: salonId,
    first_name,
    last_name,
    phone,
    whatsapp_number: asString(data.whatsapp_number) ?? phone,
    email: asString(data.email),
    address: asString(data.address),
    city: asString(data.city),
    customer_type: asString(data.customer_type) ?? 'New',
    notes: asString(data.notes),
    join_date: new Date().toISOString().slice(0, 10),
  };
}

/** Builds a `public.bookings` insert row, or null when the payload is unusable. */
export function toBookingRow(action: OfflineAction): Record<string, unknown> | null {
  const data = action.data ?? {};
  const salonId = asString(data.salon_id);
  const customerName = asString(data.customer_name) ?? asString(data.name);
  const customerPhone = asString(data.customer_phone) ?? asString(data.phone);
  const start = toIso(data.appointment_start) ?? toIso(data.appointment_time);
  const end = toIso(data.appointment_end) ?? start;

  if (!salonId || !customerName || !customerPhone || !start || !end) return null;

  // `appointment_end` must not precede `appointment_start`.
  if (new Date(end).getTime() < new Date(start).getTime()) return null;

  const status = asString(data.status);
  return {
    salon_id: salonId,
    customer_id: asString(data.customer_id),
    staff_id: asString(data.staff_id),
    appointment_start: start,
    appointment_end: end,
    status: status && ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'].includes(status)
      ? status
      : 'pending',
    total_paise: Number.isFinite(Number(data.total_paise)) ? Number(data.total_paise) : 0,
    advance_paise: Number.isFinite(Number(data.advance_paise)) ? Number(data.advance_paise) : 0,
    payment_status: 'pending',
    payment_method: asString(data.payment_method),
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: asString(data.customer_email) ?? asString(data.email),
    notes: asString(data.notes),
  };
}

/* ------------------------------------------------------------------ */
/* Replay                                                              */
/* ------------------------------------------------------------------ */

/**
 * Replays a single queued action.
 *
 * `UPDATE_PROFILE` deliberately targets `public.salons` (via the owner's own
 * shop row) rather than the non-existent `public.profiles` table the old
 * service worker assumed.
 */
export async function replayAction(
  client: SupabaseClient,
  action: OfflineAction,
): Promise<ReplayResult> {
  try {
    if (action.type === 'CREATE_CLIENT') {
      const row = toCustomerRow(action);
      if (!row) {
        return {
          action,
          outcome: 'rejected',
          error: 'Missing salon_id, name or phone — cannot create the customer.',
        };
      }
      const { error } = await client.from('customers').insert(row);
      return error ? { action, outcome: 'retryable-failure', error: error.message } : { action, outcome: 'synced' };
    }

    if (action.type === 'CREATE_APPOINTMENT') {
      const row = toBookingRow(action);
      if (!row) {
        return {
          action,
          outcome: 'rejected',
          error: 'Missing salon_id, customer name/phone or appointment time — cannot create the booking.',
        };
      }
      const { error } = await client.from('bookings').insert(row);
      return error ? { action, outcome: 'retryable-failure', error: error.message } : { action, outcome: 'synced' };
    }

    if (action.type === 'UPDATE_PROFILE') {
      const salonId = asString(action.data?.salon_id);
      if (!salonId) {
        return { action, outcome: 'rejected', error: 'Missing salon_id — cannot update the shop profile.' };
      }
      const patch: Record<string, unknown> = {};
      for (const key of ['name', 'description', 'contact_number', 'email', 'business_category']) {
        const value = asString(action.data?.[key]);
        if (value !== null) patch[key] = value;
      }
      if (Object.keys(patch).length === 0) {
        return { action, outcome: 'rejected', error: 'Profile update contained no writable fields.' };
      }
      const { error } = await client.from('salons').update(patch).eq('id', salonId);
      return error ? { action, outcome: 'retryable-failure', error: error.message } : { action, outcome: 'synced' };
    }

    return { action, outcome: 'rejected', error: `Unknown action type: ${String(action.type)}` };
  } catch (error) {
    // Network-level failure (offline, DNS, aborted) — keep the action queued.
    return {
      action,
      outcome: 'retryable-failure',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Drains every action currently in `queue`.
 *
 * - Actions that succeed are removed from the queue.
 * - Actions that fail with a retryable error stay queued and get their attempt
 *   counter + last error updated, so the UI can show why they are pending.
 * - Structurally invalid actions are removed from the queue (retrying can never
 *   help) but reported as `rejected` so the caller can surface them.
 */
export async function drainQueue(
  getClient: ClientFactory,
  queue: {
    getQueue: () => Promise<OfflineAction[]>;
    removeFromQueue: (id: number) => Promise<void>;
    updateAction?: (action: OfflineAction) => Promise<void>;
  },
): Promise<DrainResult> {
  const pending = await queue.getQueue();
  const results: ReplayResult[] = [];

  for (const action of pending) {
    // A client that cannot be constructed (e.g. missing env in the SW) must not
    // destroy the action — treat it as retryable.
    let client: SupabaseClient;
    try {
      client = await getClient(action);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ action, outcome: 'retryable-failure', error: message });
      continue;
    }

    const result = await replayAction(client, action);
    results.push(result);

    if (action.id == null) continue;

    if (result.outcome === 'synced' || result.outcome === 'rejected') {
      await queue.removeFromQueue(action.id);
    } else if (queue.updateAction) {
      // Retryable: keep it queued, but record the failure for the UI.
      await queue.updateAction({
        ...action,
        attempts: (action.attempts ?? 0) + 1,
        lastError: result.error,
      });
    }
  }

  const synced = results.filter((r) => r.outcome === 'synced').length;
  const rejected = results.filter((r) => r.outcome === 'rejected').length;
  const failed = results.filter((r) => r.outcome === 'retryable-failure').length;

  return {
    total: pending.length,
    synced,
    failed,
    rejected,
    remaining: failed,
    results,
  };
}
