/**
 * Map raw Supabase / fetch errors to the owner-facing login copy.
 * Isolated so auth flows can be tested without rendering Login.tsx.
 */
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  const message = String((error as { message?: string } | null)?.message || fallback);
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials') || normalized.includes('invalid_credentials')) {
    return 'Supabase auth call successful hai, lekin is email/password ka account match nahi hua. Pehle Register karein ya email/password check karein.';
  }
  if (normalized.includes('invalid api key') || normalized.includes('api key')) {
    return 'Supabase public anon/publishable key invalid hai. Vercel me VITE_SUPABASE_ANON_KEY update karke redeploy karein.';
  }
  if (normalized.includes('failed to fetch') || normalized.includes('unable to reach')) {
    return 'Supabase auth endpoint tak request nahi pahunch rahi. Network ya deployment API route check karein.';
  }
  return message;
}
