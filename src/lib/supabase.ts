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
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: unknown;
  message?: string;
  hint?: string;
  error?: { message?: string };
  msg?: string;
};

/**
 * Uses Vercel's same-origin function for the initial credentials exchange.
 * This avoids client-network/CORS failures seen on some installed PWA browsers.
 */
async function directSupabaseAuth(route: 'signup' | 'login', payload: Record<string, unknown>) {
  const email = String(payload.email || '').trim();
  const password = String(payload.password || '');

  if (route === 'login') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  const metadata = payload.data && typeof payload.data === 'object'
    ? payload.data as Record<string, any>
    : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: metadata ? { data: metadata } : undefined,
  });
  if (error) throw error;
  return data;
}

async function applyAuthTokens(result: AuthApiResponse) {
  if (!result.access_token || !result.refresh_token) return null;

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
    if (error) throw error;
    return data;
  } catch {
    // Some installed browsers block direct cross-origin requests after the
    // server exchange. Keep the authenticated session locally so login is
    // still successful; the next app load restores it through Supabase.
    const projectRef = new URL(effectiveUrl).hostname.split('.')[0];
    const expiresAt = result.expires_at || Math.floor(Date.now() / 1000) + (result.expires_in || 3600);
    const session = {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_at: expiresAt,
      expires_in: result.expires_in || 3600,
      token_type: result.token_type || 'bearer',
      user: result.user,
    };
    localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session));
    return { session, user: result.user };
  }
}

/**
 * Uses the same-origin auth proxy first. Local Express previews mount the
 * proxy directly; Vercel uses api/auth/*.ts. If either proxy is unavailable,
 * fall back to Supabase's browser client instead of showing a generic
 * "Authentication request failed" message.
 */
export async function authenticateThroughApp(
  route: 'signup' | 'login',
  payload: Record<string, unknown>,
) {
  let proxyError: Error | null = null;

  try {
    const response = await fetch(`/api/auth/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => ({}))) as AuthApiResponse;

    if (response.ok) {
      const tokenSession = await applyAuthTokens(result);
      if (tokenSession) return tokenSession;
      // Supabase can create an account successfully while email confirmation
      // is enabled, so a signup response may contain a user but no session.
      if (route === 'signup' && result.user) return { session: null, user: result.user };
      proxyError = new Error('The authentication proxy returned an incomplete response.');
    } else {
      proxyError = new Error(result.error?.message || result.message || result.msg || 'Authentication request failed.');
    }
  } catch (error: any) {
    proxyError = error instanceof Error ? error : new Error(String(error));
  }

  try {
    return await directSupabaseAuth(route, payload);
  } catch (directError: any) {
    // Prefer the real Supabase error because it explains invalid credentials,
    // unconfirmed email, rate limiting, etc. much better than a proxy error.
    if (directError instanceof Error) throw directError;
    if (proxyError) throw proxyError;
    throw new Error('Authentication request failed.');
  }
}
