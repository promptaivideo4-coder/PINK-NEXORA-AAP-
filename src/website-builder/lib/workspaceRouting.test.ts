import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_TABS,
  MAX_STEP_INDEX,
  TOTAL_STEPS,
  getCurrentScreen,
  isDashboardTab,
  resolveNavigateToScreen,
} from './workspaceRouting';

describe('builder workspace routing', () => {
  it('maps wizard steps 0–15 onto screens 1–16', () => {
    expect(TOTAL_STEPS).toBe(16);
    expect(MAX_STEP_INDEX).toBe(15);
    expect(getCurrentScreen({ activeModule: 'wizard', dashboardTab: 'overview', step: 0 })).toBe(1);
    expect(getCurrentScreen({ activeModule: 'wizard', dashboardTab: 'overview', step: 15 })).toBe(16);
  });

  it('maps staff management to screen 17 and dashboard tabs to screens 18–25', () => {
    expect(getCurrentScreen({ activeModule: 'staff-management', dashboardTab: 'overview', step: 0 })).toBe(17);
    expect(DASHBOARD_TABS).toEqual([
      'overview',
      'website',
      'bookings',
      'payments',
      'share',
      'settings',
      'referral',
      'branding',
    ]);
    expect(getCurrentScreen({ activeModule: 'dashboard', dashboardTab: 'overview', step: 0 })).toBe(18);
    expect(getCurrentScreen({ activeModule: 'dashboard', dashboardTab: 'website', step: 0 })).toBe(19);
    expect(getCurrentScreen({ activeModule: 'dashboard', dashboardTab: 'branding', step: 0 })).toBe(25);
  });

  it('keeps dashboard (18–25) locked until the salon is published', () => {
    expect(resolveNavigateToScreen(20, 'draft')).toEqual({
      kind: 'publish-required',
      toast: 'Publish your website to the database first to open the dashboard',
    });
    expect(resolveNavigateToScreen(20, 'published')).toEqual({
      kind: 'dashboard',
      tab: 'bookings',
      toast: 'Opened Dashboard — bookings (Screen 20)',
    });
  });

  it('routes wizard and staff screen ids without requiring publish', () => {
    expect(resolveNavigateToScreen(1, 'draft')).toMatchObject({ kind: 'wizard', step: 0 });
    expect(resolveNavigateToScreen(16, 'draft')).toMatchObject({ kind: 'wizard', step: 15 });
    expect(resolveNavigateToScreen(17, 'draft')).toMatchObject({ kind: 'staff' });
    expect(isDashboardTab('overview')).toBe(true);
    expect(isDashboardTab('services')).toBe(false);
  });
});
