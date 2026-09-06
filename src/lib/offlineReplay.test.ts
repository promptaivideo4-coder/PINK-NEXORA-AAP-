import { describe, expect, it, vi } from 'vitest';

import {
  drainQueue,
  replayAction,
  toBookingRow,
  toCustomerRow,
  type OfflineAction,
} from './offlineReplay';

const SALON_ID = '11111111-1111-4111-8111-111111111111';

function action(overrides: Partial<OfflineAction> = {}): OfflineAction {
  return {
    id: 1,
    type: 'CREATE_CLIENT',
    data: { salon_id: SALON_ID, name: 'Ananya Sharma', phone: '+91 98765 43210' },
    timestamp: Date.now(),
    ...overrides,
  };
}

/** Minimal Supabase-shaped stub: records inserts and can be told to fail. */
function fakeClient(failWith?: string) {
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  const updates: Array<{ table: string; patch: Record<string, unknown> }> = [];

  const builder = (table: string) => {
    const chain = {
      insert(row: Record<string, unknown>) {
        inserts.push({ table, row });
        return Promise.resolve(failWith ? { error: { message: failWith } } : { error: null });
      },
      update(patch: Record<string, unknown>) {
        updates.push({ table, patch });
        return {
          eq() {
            return Promise.resolve(failWith ? { error: { message: failWith } } : { error: null });
          },
        };
      },
    };
    return chain;
  };

  return {
    inserts,
    updates,
    from(table: string) {
      return builder(table);
    },
  };
}

function fakeQueue(initial: OfflineAction[] = []) {
  let store = [...initial];
  return {
    store,
    getQueue: async () => [...store],
    removeFromQueue: async (id: number) => {
      store = store.filter((a) => a.id !== id);
    },
    updateAction: async (next: OfflineAction) => {
      store = store.map((a) => (a.id === next.id ? next : a));
    },
  };
}

describe('toCustomerRow', () => {
  it('splits a full name into first_name / last_name', () => {
    const row = toCustomerRow(action());
    expect(row).toMatchObject({
      first_name: 'Ananya',
      last_name: 'Sharma',
      salon_id: SALON_ID,
      phone: '+91 98765 43210',
    });
  });

  it('never writes the generated full_name column', () => {
    expect(toCustomerRow(action())).not.toHaveProperty('full_name');
  });

  it('rejects a payload with no phone', () => {
    expect(toCustomerRow(action({ data: { salon_id: SALON_ID, name: 'X' } }))).toBeNull();
  });
});

describe('toBookingRow', () => {
  const base = {
    salon_id: SALON_ID,
    customer_name: 'Rohan Verma',
    customer_phone: '+91 90000 00000',
    appointment_start: '2026-09-10T10:00:00.000Z',
    appointment_end: '2026-09-10T10:30:00.000Z',
  };

  it('maps to the real bookings columns', () => {
    const row = toBookingRow(action({ type: 'CREATE_APPOINTMENT', data: base }));
    expect(row).toMatchObject({
      salon_id: SALON_ID,
      customer_name: 'Rohan Verma',
      customer_phone: '+91 90000 00000',
      appointment_start: '2026-09-10T10:00:00.000Z',
      status: 'pending',
    });
  });

  it('rejects legacy payloads that use appointment_time', () => {
    const legacy = {
      salon_id: SALON_ID,
      customer_name: 'Rohan Verma',
      customer_phone: '+91 90000 00000',
      appointment_time: '2026-09-10T10:00:00.000Z',
    };
    // The old queue used `appointment_time`, which is not a column — it would
    // have failed at the database. Normalisation accepts it as the start time.
    expect(toBookingRow(action({ type: 'CREATE_APPOINTMENT', data: legacy }))).not.toBeNull();
  });

  it('rejects a booking that ends before it starts', () => {
    const row = toBookingRow(
      action({
        type: 'CREATE_APPOINTMENT',
        data: { ...base, appointment_end: '2026-09-09T10:00:00.000Z' },
      }),
    );
    expect(row).toBeNull();
  });
});

describe('replayAction', () => {
  it('writes a queued customer to public.customers', async () => {
    const client = fakeClient();
    const result = await replayAction(client as never, action());
    expect(result.outcome).toBe('synced');
    expect(client.inserts[0].table).toBe('customers');
  });

  it('writes a queued booking to public.bookings', async () => {
    const client = fakeClient();
    const result = await replayAction(
      client as never,
      action({
        type: 'CREATE_APPOINTMENT',
        data: {
          salon_id: SALON_ID,
          customer_name: 'Rohan Verma',
          customer_phone: '+91 90000 00000',
          appointment_start: '2026-09-10T10:00:00.000Z',
          appointment_end: '2026-09-10T10:30:00.000Z',
        },
      }),
    );
    expect(result.outcome).toBe('synced');
    expect(client.inserts[0].table).toBe('bookings');
  });

  it('updates public.salons for a profile change, not the missing profiles table', async () => {
    const client = fakeClient();
    const result = await replayAction(
      client as never,
      action({ type: 'UPDATE_PROFILE', data: { salon_id: SALON_ID, name: 'Nexora Studio' } }),
    );
    expect(result.outcome).toBe('synced');
    expect(client.updates[0].table).toBe('salons');
  });

  it('keeps a retryable failure in the queue instead of discarding it', async () => {
    const client = fakeClient('network error');
    const result = await replayAction(client as never, action());
    expect(result.outcome).toBe('retryable-failure');
    expect(result.error).toBe('network error');
  });

  it('rejects (never retries) a structurally invalid action', async () => {
    const client = fakeClient();
    const result = await replayAction(client as never, action({ data: { name: 'No salon or phone' } }));
    expect(result.outcome).toBe('rejected');
    expect(client.inserts).toHaveLength(0);
  });
});

describe('drainQueue', () => {
  it('removes synced actions and keeps failed ones', async () => {
    const queue = fakeQueue([
      action({ id: 1 }),
      action({
        id: 2,
        type: 'CREATE_APPOINTMENT',
        data: {
          salon_id: SALON_ID,
          customer_name: 'Rohan Verma',
          customer_phone: '+91 90000 00000',
          appointment_start: '2026-09-10T10:00:00.000Z',
          appointment_end: '2026-09-10T10:30:00.000Z',
        },
      }),
      action({ id: 3, data: { name: 'broken' } }),
    ]);

    const result = await drainQueue(() => fakeClient() as never, queue);

    expect(result.total).toBe(3);
    expect(result.synced).toBe(2);
    expect(result.rejected).toBe(1);
    // Rejected actions are removed too — retrying a structurally invalid
    // payload can never succeed, and leaving it queued would pin the badge at
    // "pending" forever. The UI surfaces the rejection separately.
    expect(result.remaining).toBe(0);
    expect(queue.getQueue()).resolves.toHaveLength(0);
  });

  it('records attempt counts and the last error on retryable failures', async () => {
    const queue = fakeQueue([action({ id: 7 })]);
    const result = await drainQueue(() => fakeClient('still offline') as never, queue);
    const remaining = await queue.getQueue();

    expect(result.failed).toBe(1);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].attempts).toBe(1);
    expect(remaining[0].lastError).toBe('still offline');
  });

  it('reports nothing to do for an empty queue', async () => {
    const result = await drainQueue(() => fakeClient() as never, fakeQueue());
    expect(result).toMatchObject({ total: 0, synced: 0, failed: 0, rejected: 0 });
  });

  it('does not lose an action when the client cannot be constructed', async () => {
    const queue = fakeQueue([action({ id: 9 })]);
    const result = await drainQueue(
      () => {
        throw new Error('Supabase unavailable');
      },
      queue,
    );
    expect(result.failed).toBe(1);
    expect(queue.getQueue()).resolves.toHaveLength(1);
  });

  it('passes each action to the client factory so auth can differ per action', async () => {
    const factory = vi.fn(() => fakeClient() as never);
    await drainQueue(factory, fakeQueue([action({ id: 1 }), action({ id: 2 })]));
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
