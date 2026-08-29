import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from './authErrors';

describe('auth flow error mapping', () => {
  it('explains invalid login credentials in owner-facing copy', () => {
    expect(getAuthErrorMessage({ message: 'Invalid login credentials' }, 'fallback')).toMatch(
      /Register karein/i,
    );
  });

  it('explains a bad anon key', () => {
    expect(getAuthErrorMessage({ message: 'Invalid API key' }, 'fallback')).toMatch(
      /VITE_SUPABASE_ANON_KEY/,
    );
  });

  it('explains a network failure to the auth endpoint', () => {
    expect(getAuthErrorMessage({ message: 'Failed to fetch' }, 'fallback')).toMatch(
      /auth endpoint/i,
    );
  });

  it('falls back to the original message when the error is unknown', () => {
    expect(getAuthErrorMessage({ message: 'Email not confirmed' }, 'fallback')).toBe(
      'Email not confirmed',
    );
    expect(getAuthErrorMessage(null, 'Could not sign in')).toBe('Could not sign in');
  });
});
