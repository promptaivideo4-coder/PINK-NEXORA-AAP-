/**
 * useAutoSave — Universal auto-save hook for PWA + Supabase persistence.
 *
 * Saves to localStorage instantly (for offline PWA UX),
 * then queues a Supabase upsert in the background.
 *
 * Usage:
 *   const { status, lastSavedAt, saveNow } = useAutoSave(data, {
 *     key: 'nexora_builder_state',
 *     supabaseTable: 'onboarding_progress',
 *     supabaseId: shopId,
 *     debounceMs: 200,
 *   });
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  /** localStorage key for offline persistence */
  storageKey: string;
  /** Debounce ms before saving (default 200ms — snappy for PWA) */
  debounceMs?: number;
  /** Optional Supabase table for cloud persistence */
  supabaseTable?: string;
  /** Supabase row id (typically business_id or user_id) */
  supabaseId?: string | null;
  /** Extra columns to merge into Supabase row */
  supabasePayload?: Record<string, unknown>;
  /** Supabase client instance */
  client?: SupabaseClient | null;
}

export function useAutoSave(
  data: unknown,
  opts: UseAutoSaveOptions,
) {
  const {
    storageKey,
    debounceMs = 200,
    supabaseTable,
    supabaseId,
    supabasePayload = {},
    client,
  } = opts;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Persist to localStorage
  const saveToLocalStorage = useCallback((value: unknown) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      setLastSavedAt(Date.now());
      setStatus('saved');
      return true;
    } catch (err: any) {
      console.warn('LocalStorage save failed:', err?.message || err);
      setError(err?.message || 'Local save failed');
      setStatus('error');
      return false;
    }
  }, [storageKey]);

  // Persist to Supabase (background, non-blocking)
  const saveToSupabase = useCallback(async () => {
    if (!supabaseTable || !supabaseId || !client) return;
    try {
      const payload = {
        id: supabaseId,
        ...supabasePayload,
        draft: dataRef.current,
        updated_at: new Date().toISOString(),
      };
      const { error } = await client
        .from(supabaseTable)
        .upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase save failed:', error.message);
        // Non-fatal — localStorage already saved
      }
    } catch (err: any) {
      console.warn('Supabase save error:', err?.message || err);
    }
  }, [supabaseTable, supabaseId, supabasePayload, client]);

  // Debounced save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // On first mount, try to load from localStorage
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setLastSavedAt(Date.now());
        }
      } catch {}
      return;
    }

    setStatus('saving');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const ok = saveToLocalStorage(dataRef.current);
      if (ok) {
        void saveToSupabase();
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, debounceMs, saveToLocalStorage, saveToSupabase, storageKey]);

  // Immediate save (no debounce) — for explicit "Save" buttons
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('saving');
    const ok = saveToLocalStorage(dataRef.current);
    if (ok) {
      void saveToSupabase();
    }
  }, [saveToLocalStorage, saveToSupabase]);

  // Cleanup on unmount — flush pending save
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Sync final save before unmount
        saveToLocalStorage(dataRef.current);
      }
    };
  }, [saveToLocalStorage]);

  return { status, lastSavedAt, error, saveNow };
}
