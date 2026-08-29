import { describe, expect, it } from 'vitest';
import {
  MAIN_WEBSITE_AUTH_ROUTE,
  isOnMainWebsiteAuthRoute,
  redirectToMainWebsiteAuth,
} from './authRoutes';

describe('auth routes', () => {
  it('recognizes the Main Website auth path', () => {
    expect(isOnMainWebsiteAuthRoute({ pathname: '/auth/login', hash: '' })).toBe(true);
    expect(isOnMainWebsiteAuthRoute({ pathname: '/auth/login/reset', hash: '' })).toBe(true);
  });

  it('recognizes the legacy owner-login hash', () => {
    expect(
      isOnMainWebsiteAuthRoute({ pathname: '/', hash: '#/app/owner/login' }),
    ).toBe(true);
  });

  it('does not treat the workspace dashboard as an auth route', () => {
    expect(isOnMainWebsiteAuthRoute({ pathname: '/', hash: '' })).toBe(false);
    expect(isOnMainWebsiteAuthRoute({ pathname: '/dashboard', hash: '' })).toBe(false);
  });

  it('redirects signed-out users onto the auth route without looping', () => {
    const original = window.location;
    const replaced: string[] = [];
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/', hash: '', search: '' },
    });
    const replaceState = window.history.replaceState.bind(window.history);
    window.history.replaceState = ((state: unknown, title: string, url?: string | null) => {
      replaced.push(String(url));
      return replaceState(state, title, url);
    }) as typeof window.history.replaceState;

    expect(redirectToMainWebsiteAuth()).toBe(true);
    expect(replaced[0]).toBe(MAIN_WEBSITE_AUTH_ROUTE);

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: MAIN_WEBSITE_AUTH_ROUTE, hash: '', search: '' },
    });
    expect(redirectToMainWebsiteAuth()).toBe(false);

    window.history.replaceState = replaceState;
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });
});
