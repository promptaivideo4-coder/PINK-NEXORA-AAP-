import { describe, expect, it } from 'vitest';
import {
  PUBLIC_SCREENS,
  isPublicScreen,
  resolveGuardedScreen,
  resolveInitialScreen,
} from './workspaceScreens';

describe('workspace screen routing', () => {
  it('treats splash/welcome/login as public and dashboard as protected', () => {
    expect(isPublicScreen('splash')).toBe(true);
    expect(isPublicScreen('welcome')).toBe(true);
    expect(isPublicScreen('login')).toBe(true);
    expect(isPublicScreen('reset-password')).toBe(true);
    expect(isPublicScreen('register-stepper')).toBe(true);
    expect(isPublicScreen('dashboard')).toBe(false);
    expect(isPublicScreen('website-builder')).toBe(false);
    expect(PUBLIC_SCREENS.has('staff')).toBe(false);
  });

  it('opens login when the visitor is already on the Main Website auth route', () => {
    expect(
      resolveInitialScreen({ pathname: '/auth/login', search: '', hash: '' }),
    ).toBe('login');
  });

  it('honors ?screen= preview links used during workspace integration', () => {
    expect(
      resolveInitialScreen({ pathname: '/', search: '?screen=dashboard', hash: '' }),
    ).toBe('dashboard');
    expect(
      resolveInitialScreen({ pathname: '/', search: '?screen=new-staff', hash: '' }),
    ).toBe('new-staff');
    expect(
      resolveInitialScreen({ pathname: '/', search: '', hash: '#/staff' }),
    ).toBe('staff');
  });

  it('falls back to splash for a fresh visitor', () => {
    expect(resolveInitialScreen({ pathname: '/', search: '', hash: '' })).toBe('splash');
  });

  it('sends unsigned visitors on protected screens to login after session resolve', () => {
    expect(resolveGuardedScreen('dashboard', true, false)).toBe('login');
    expect(resolveGuardedScreen('welcome', true, false)).toBe('welcome');
    expect(resolveGuardedScreen('dashboard', false, false)).toBe('dashboard');
    expect(resolveGuardedScreen('dashboard', true, true)).toBe('dashboard');
  });
});
