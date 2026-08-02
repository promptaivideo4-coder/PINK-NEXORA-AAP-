/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

/**
 * Public Supabase project settings for Nexora.
 * The anon/publishable key is designed to be present in browser bundles; access
 * to data is protected by Supabase Row Level Security, not by hiding this key.
 * Vercel environment variables override these defaults for another project.
 */
const DEFAULT_SUPABASE_URL = 'https://qwaehqsmodekbgvnaavz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3YWVocXNtb2Rla2Jndm5hYXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjQ5MjksImV4cCI6MjEwMDc0MDkyOX0.K92b2vkEb77dyu8fYYZpMTIbTyP98Vo80TaMo_Hmq_E';

// Accept a normal URL and also recover from accidental Markdown/brackets such as
// "[https://project.supabase.co](https://project.supabase.co)" pasted into Vercel.
function normaliseSupabaseUrl(value?: string): string | undefined {
  const match = value?.trim().match(/https:\/\/[a-z0-9-]+\.supabase\.co/i);
  return match?.[0];
}

const configuredUrl = normaliseSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const effectiveUrl = configuredUrl || DEFAULT_SUPABASE_URL;
const effectiveKey = configuredAnonKey || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(effectiveUrl, effectiveKey);

/** True when a usable Supabase client is available. */
export const isSupabaseConfigured = () =>
  Boolean(effectiveUrl && effectiveKey && !effectiveUrl.includes('placeholder'));

type AuthApiResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: unknown;
  error?: { message?: string };
  msg?: string;
};

/**
 * Uses Vercel's same-origin function for the initial credentials exchange.
 * This avoids client-network/CORS failures seen on some installed PWA browsers.
 */
export async function authenticateThroughApp(
  route: 'signup' | 'login',
  payload: Record<string, unknown>,
) {
  const response = await fetch(`/api/auth/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = (await response.json().catch(() => ({}))) as AuthApiResponse;
  if (!response.ok) throw new Error(result.error?.message || result.msg || 'Authentication request failed.');

  if (result.access_token && result.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
    if (error) throw error;
    return data;
  }

  return { session: null, user: result.user };
}
