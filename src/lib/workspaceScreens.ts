/**
 * App-shell workspace routing. Kept free of React so public vs protected
 * screen rules can be unit-tested without mounting App.tsx.
 */
import type { ScreenName } from '../types';
import { isOnMainWebsiteAuthRoute, type LocationLike } from './authRoutes';

/** Screens that a signed-out visitor may see. Everything else requires a session. */
export const PUBLIC_SCREENS = new Set<ScreenName>([
  'splash',
  'welcome',
  'login',
  'reset-password',
  'register-stepper',
]);

export function isPublicScreen(screen: ScreenName): boolean {
  return PUBLIC_SCREENS.has(screen);
}

/** Direct `?screen=` preview links used during screen integration. */
const PREVIEW_SCREEN_MAP: Record<string, ScreenName> = {
  dashboard: 'dashboard',
  'new-staff': 'new-staff',
  'staff-detail': 'staff-detail',
  'staff-schedule': 'staff-schedule',
  'staff-attendance': 'staff-attendance',
  'leave-swap': 'leave-swap',
  'staff-payroll': 'staff-payroll',
  'staff-payroll-detail': 'staff-payroll-detail',
  'staff-payroll-breakdown': 'staff-payroll-breakdown',
  'staff-roles-access': 'staff-roles-access',
  'staff-performance': 'staff-performance',
  'staff-self-service': 'staff-self-service',
  'staff-website-booking': 'staff-website-booking',
  staff: 'staff',
};

export type WorkspaceLocation = LocationLike & { search: string };

function readLocation(loc?: WorkspaceLocation): WorkspaceLocation {
  if (loc) return loc;
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '' };
  }
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

/** Entry screen for a fresh load, including the Main Website auth route. */
export function resolveInitialScreen(loc?: WorkspaceLocation): ScreenName {
  const location = readLocation(loc);
  if (isOnMainWebsiteAuthRoute(location)) return 'login';

  const params = new URLSearchParams(location.search);
  const previewScreen = params.get('screen');
  if (previewScreen && PREVIEW_SCREEN_MAP[previewScreen]) {
    return PREVIEW_SCREEN_MAP[previewScreen];
  }

  const isStaffPreview =
    previewScreen === 'staff' ||
    location.hash === '#staff' ||
    location.hash === '#/staff';
  if (isStaffPreview) return 'staff';

  return 'splash';
}

/** Guard: protected screens require a resolved session. */
export function resolveGuardedScreen(
  currentScreen: ScreenName,
  sessionResolved: boolean,
  hasSession: boolean,
): ScreenName {
  if (sessionResolved && !hasSession && !isPublicScreen(currentScreen)) {
    return 'login';
  }
  return currentScreen;
}
