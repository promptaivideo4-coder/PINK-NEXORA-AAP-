import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type OwnerAccessStatus = 'checking' | 'authorized' | 'denied';

export interface OwnerAccess {
  status: OwnerAccessStatus;
  /** The caller's role in the owning organization (null when denied). */
  role: string | null;
  error: string | null;
  hasAccess: boolean;
  loading: boolean;
}

const MANAGERIAL_ROLES = new Set(['owner', 'manager', 'admin']);

function denied(error: string): OwnerAccess {
  return { status: 'denied', role: null, error, hasAccess: false, loading: false };
}

function authorized(role: string): OwnerAccess {
  return { status: 'authorized', role, error: null, hasAccess: true, loading: false };
}

/**
 * REAL access check for owner/manager-only screens.
 *
 * Authority comes from the canonical backend: the caller must have a
 * valid Supabase session AND an ACTIVE owner/manager/admin row in
 * `organization_members` (read with their own JWT, RLS-scoped to their rows).
 */
export function useOwnerAccess(): OwnerAccess {
  const [state, setState] = useState<OwnerAccess>({
    status: 'checking',
    role: null,
    error: null,
    hasAccess: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setState(denied('Not signed in.'));
          return;
        }
        const { data: members, error } = await supabase
          .from('organization_members')
          .select('organization_id, role, status')
          .eq('user_id', user.id);
        if (error) {
          if (!cancelled) setState(denied(error.message));
          return;
        }
        const active = (members ?? []).find(
          (m: { status: string; role: string }) => m.status === 'active' && MANAGERIAL_ROLES.has(String(m.role)),
        );
        if (!cancelled) {
          setState(active
            ? authorized(String(active.role))
            : denied('Your account does not have owner/manager access to a salon.'));
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Access check failed.';
        if (!cancelled) setState(denied(message));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}
