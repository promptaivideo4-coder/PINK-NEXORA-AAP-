/**
 * authRoutes.ts
 * =============
 * Single source of truth for the Main Website authentication route.
 *
 * Kept free of React / CSS / PWA imports on purpose so the routing rules can be
 * exercised directly (and reused by any future routing layer) without dragging
 * the whole app shell along.
 */

/** Main Website authentication route — signed-out users always land here. */
export const MAIN_WEBSITE_AUTH_ROUTE = '/auth/login';

/** Legacy in-app hash equivalent of the same route. */
const LEGACY_AUTH_HASH = '/app/owner/login';

export type LocationLike = {
  pathname: string;
  hash: string;
};

function readLocation(loc?: LocationLike): LocationLike {
  if (loc) return loc;
  if (typeof window === 'undefined') return { pathname: '', hash: '' };
  return { pathname: window.location.pathname, hash: window.location.hash };
}

/** True when the browser is already sitting on the Main Website auth route. */
export function isOnMainWebsiteAuthRoute(loc?: LocationLike): boolean {
  const { pathname, hash } = readLocation(loc);
  if (!pathname && !hash) return false;
  return (
    pathname === MAIN_WEBSITE_AUTH_ROUTE ||
    pathname.startsWith(`${MAIN_WEBSITE_AUTH_ROUTE}/`) ||
    hash.includes(LEGACY_AUTH_HASH)
  );
}

/**
 * Sends the user to the Main Website authentication route.
 *
 * - Guarded by `isOnMainWebsiteAuthRoute()` so it can never loop.
 * - Uses `history.replaceState` (not a hard reload) so the PWA keeps working
 *   offline and the caller's existing Login UI stays in charge — no reload
 *   loop, no splash flash.
 * - Reloading `/auth/login` resolves back to the login screen, so the URL and
 *   the UI always agree.
 *
 * @returns true when a navigation was performed.
 */
export function redirectToMainWebsiteAuth(): boolean {
  if (typeof window === 'undefined') return false;
  if (isOnMainWebsiteAuthRoute()) return false; // already there — never loop
  try {
    window.history.replaceState(window.history.state, '', MAIN_WEBSITE_AUTH_ROUTE);
    return true;
  } catch {
    // History can be blocked in some installed-PWA contexts. The caller's
    // in-app screen change is what actually keeps the user out of the app.
    return false;
  }
}
