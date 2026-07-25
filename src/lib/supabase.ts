/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholder values to prevent the app from crashing on boot if secrets are missing.
// Auth features will only work once the user provides real credentials.
const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(effectiveUrl, effectiveKey);

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('placeholder');
};
