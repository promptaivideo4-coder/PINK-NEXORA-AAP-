import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type OwnerAccessStatus = 'checking' | 'authorized' | 'denied';

export interface OwnerAccess {
  status: OwnerAccessStatus;
  /** The caller's role in the owning organization (null when denied). */
  role: string | null;
  error: string | null;
}

const MANAGERIAL_ROLES = new Set(['owner', 'manager', 'admin']);

/**
 * REAL access check for owner/manager-only screens.
 *
 * The previous implementation read `nexora-user-role` / `nexora-demo-role`
 * from localStorage (defaulting to 'owner'), which is client-trusted: any
 * signed-in user — or a user who edited localStorage — passed the check.
 *
 * Authority now comes from the canonical backend: the caller must have a
 * valid Supabase session AND an ACTIVE owner/manager/admin row in
 * `organization_members` (read with their own JWT, RLS-scoped to their rows).
 */
export function useOwnerAccess(): OwnerAccess {
  const [state, setState] = useState<OwnerAccess>({ status: 'checking', role: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setState({ status: 'denied', role: null, error: 'Not signed in.' });
          return;
        }
        const { data: members, error } = await supabase
          .from('organization_members')
          .select('organization_id, role, status')
          .eq('user_id', user.id);
        if (error) {
          // Fail CLOSED: an unreadable membership table must not default to
          // authorized (the old code's failure mode).
          if (!cancelled) setState({ status: 'denied', role: null, error: error.message });
          return;
        }
        const active = (members ?? []).find((m: any) => m.status === 'active' && MANAGERIAL_ROLES.has(String(m.role)));
        if (!cancelled) {
          setState(active
            ? { status: 'authorized', role: String(active.role), error: null }
            : { status: 'denied', role: null, error: 'Your account does not have owner/manager access to a salon.' });
        }
      } catch (e: any) {
        if (!cancelled) setState({ status: 'denied', role: null, error: e?.message || 'Access check failed.' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}
