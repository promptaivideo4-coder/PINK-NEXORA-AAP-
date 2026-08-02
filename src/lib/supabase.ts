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

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const effectiveUrl = configuredUrl || DEFAULT_SUPABASE_URL;
const effectiveKey = configuredAnonKey || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(effectiveUrl, effectiveKey);

/** True when a usable Supabase client is available. */
export const isSupabaseConfigured = () =>
  Boolean(effectiveUrl && effectiveKey && !effectiveUrl.includes('placeholder'));
