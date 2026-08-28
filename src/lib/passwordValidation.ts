/**
 * Central password rules for Nexora.
 *
 * Supabase Auth (GoTrue) enforces "minimum character groups" on this project:
 * a password must contain at least one lowercase letter, one uppercase letter
 * and one number. When it does not, Supabase rejects the request with:
 *
 *   "Password should contain at least one character of each:
 *    abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789."
 *
 * Instead of surfacing that cryptic message after a failed network round-trip,
 * every surface that sets a password (sign-up, reset, change password)
 * validates against the same rules BEFORE calling Supabase and shows the
 * requirement that is missing.
 */

export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRule = {
  id: 'length' | 'lowercase' | 'uppercase' | 'number';
  /** Checklist wording shown in the UI. */
  label: string;
  /** Wording used when listing the rules a password does not satisfy yet. */
  missingLabel: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    missingLabel: `at least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter (a-z)',
    missingLabel: 'a lowercase letter (a-z)',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A-Z)',
    missingLabel: 'an uppercase letter (A-Z)',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'number',
    label: 'One number (0-9)',
    missingLabel: 'a number (0-9)',
    test: (password) => /[0-9]/.test(password),
  },
];

/** Rules the given password does NOT satisfy yet. */
export function unmetPasswordRules(password: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password));
}

/** Human readable, comma separated list of what is still missing. */
export function describeMissingRules(password: string): string {
  return unmetPasswordRules(password).map((rule) => rule.missingLabel).join(', ');
}

export type PasswordValidation =
  | { valid: true; message: null }
  | { valid: false; message: string };

/**
 * Validates a password against Supabase's required character groups.
 * Returns a ready-to-display message when it is not acceptable.
 */
export function validatePassword(password: string): PasswordValidation {
  if (!password) {
    return { valid: false, message: 'Password is required.' };
  }

  const missing = unmetPasswordRules(password);
  if (missing.length > 0) {
    return {
      valid: false,
      message: `Password must contain at least ${PASSWORD_MIN_LENGTH} characters, including one lowercase letter (a-z), one uppercase letter (A-Z) and one number (0-9). Missing: ${describeMissingRules(password)}.`,
    };
  }

  return { valid: true, message: null };
}

/** True when the password satisfies every rule. */
export const isStrongPassword = (password: string): boolean =>
  unmetPasswordRules(password).length === 0;

/**
 * Translates Supabase/GoTrue password errors into the same friendly wording we
 * show for client-side validation, so the user never sees the raw
 * "abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789" message.
 */
export function friendlyPasswordError(message?: string | null): string | null {
  if (!message) return null;

  if (/should contain at least one character of each|character group/i.test(message)) {
    return `Password must contain at least ${PASSWORD_MIN_LENGTH} characters, including one lowercase letter (a-z), one uppercase letter (A-Z) and one number (0-9). Example: Glow@2026`;
  }

  if (/password should be at least \d+ characters|password.*too short/i.test(message)) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long and include a lowercase letter, an uppercase letter and a number.`;
  }

  if (/weak_password|password.*(leaked|compromised|breached)/i.test(message)) {
    return 'This password is too easy to guess or was exposed in a data breach. Please choose a different one.';
  }

  return null;
}
