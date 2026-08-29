/**
 * Builder workspace routing — screens 1–16 (wizard), 17 (staff), 18–25 (owner dashboard).
 * Kept free of React so routing can be unit-tested without the builder shell.
 */

export const TOTAL_STEPS = 16;
export const MAX_STEP_INDEX = 15; // 0-based: 0..15 => screens 1..16

/** Owner dashboard tabs that map onto screens 18–25. */
export type DashboardTab =
  | 'overview'
  | 'website'
  | 'bookings'
  | 'payments'
  | 'share'
  | 'settings'
  | 'referral'
  | 'branding';

export const DASHBOARD_TABS: DashboardTab[] = [
  'overview',
  'website',
  'bookings',
  'payments',
  'share',
  'settings',
  'referral',
  'branding',
];

export type BuilderModule = 'wizard' | 'staff-management' | 'dashboard';

export function isDashboardTab(value: string | null | undefined): value is DashboardTab {
  return !!value && (DASHBOARD_TABS as string[]).includes(value);
}

/** Universal 25-screen id for the builder TopBar navigator. */
export function getCurrentScreen(args: {
  activeModule: BuilderModule;
  dashboardTab: DashboardTab;
  step: number;
}): number {
  if (args.activeModule === 'staff-management') return 17;
  if (args.activeModule === 'dashboard') {
    const tabIndex = DASHBOARD_TABS.indexOf(args.dashboardTab);
    return 18 + Math.max(0, tabIndex);
  }
  return args.step + 1;
}

export type NavigateIntent =
  | { kind: 'wizard'; step: number; toast: string }
  | { kind: 'staff'; toast: string }
  | { kind: 'dashboard'; tab: DashboardTab; toast: string }
  | { kind: 'publish-required'; toast: string };

/**
 * Resolve a TopBar screen id into a builder navigation intent.
 * Dashboard (18–25) is locked until the salon is actually published.
 */
export function resolveNavigateToScreen(
  screenId: number,
  publishState: string | undefined,
): NavigateIntent {
  if (screenId >= 1 && screenId <= 16) {
    return {
      kind: 'wizard',
      step: screenId - 1,
      toast: `Navigated to Screen ${String(screenId).padStart(2, '0')}`,
    };
  }
  if (screenId === 17) {
    return { kind: 'staff', toast: 'Opened Staff Management Module (Screen 17)' };
  }
  if (screenId >= 18 && screenId <= 25) {
    if (publishState !== 'published') {
      return {
        kind: 'publish-required',
        toast: 'Publish your website to the database first to open the dashboard',
      };
    }
    const tab = DASHBOARD_TABS[screenId - 18] ?? 'overview';
    return {
      kind: 'dashboard',
      tab,
      toast: `Opened Dashboard — ${tab} (Screen ${String(screenId).padStart(2, '0')})`,
    };
  }
  return { kind: 'wizard', step: 0, toast: 'Navigated to Screen 01' };
}
