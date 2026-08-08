/**
 * useNearbySalons.ts
 * ==================
 * Composition hook — sirf CENTRALIZED location system se data leta hai.
 * Yahan KOI GPS acquisition nahi — location `useNexoraLocation()` (primary hook)
 * → LocationStore → src/location/* se aati hai.
 *
 * Responsibilities (STEP 8):
 * 1. Current location — centralized system se
 * 2. Distances — DistanceCalculator (Haversine, via locationService/nearbySalonService)
 * 3. Sort — SalonSorter
 * 4. Group — SalonSorter (Nearby 0–2km, Close 2–5km, Around You 5–10km, More 10+km)
 * 5. Return data required by UI
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Salon, GroupedSalons, ValidatedLocation } from '../location/types';
import { locationService } from '../location/LocationService';
import { nearbySalonService } from '../location/NearbySalonService';
import { useNexoraLocation } from './useNexoraLocation';

interface UseNearbySalonsOptions {
  salons: Salon[];
  autoRecalc?: boolean;
}

interface UseNearbySalonsReturn {
  grouped: GroupedSalons | null;
  allSorted: Salon[];
  recalcCount: number;
  lastLocation: ValidatedLocation | null;
  forceRecalculate: () => void;
  isRecalculating: boolean;
  // UI helpers — additive, non-breaking
  isLoading: boolean;
  error: string | null;
  isDenied: boolean;
}

export function useNearbySalons(
  options: UseNearbySalonsOptions
): UseNearbySalonsReturn {
  const { salons, autoRecalc = true } = options;

  // 1. Location — centralized system se (koi apna GPS acquisition nahi)
  const { location, isLoading, error, isDenied } = useNexoraLocation();

  const [grouped, setGrouped] = useState<GroupedSalons | null>(() =>
    locationService.getNearbySalons()
  );
  const [recalcCount, setRecalcCount] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const salonsRef = useRef(salons);
  const autoRecalcRef = useRef(autoRecalc);
  autoRecalcRef.current = autoRecalc;
  const initialFillRef = useRef(false);

  // Keep salons pushed to centralized service (2,3,4 — service sort/group karta hai)
  useEffect(() => {
    salonsRef.current = salons;
    locationService.setSalons(salons);
  }, [salons]);

  // Recalculate when location changes — service internally gates by >100m movement.
  // `grouped` ko dep me nahi rakhte taaki grouping update par effect re-run na ho
  // (initial fill ref-based hai, isliye stale closure ka koi issue nahi).
  useEffect(() => {
    if (!location) return;
    if (!autoRecalcRef.current) return;
    const result = nearbySalonService.calculateIfNeeded(location, salonsRef.current, false);
    if (result) {
      if (result.recalculated) {
        setGrouped(result.grouped);
        setRecalcCount((c) => c + 1);
      } else if (!initialFillRef.current) {
        // Location update but no movement trigger — still fill initial grouping (once)
        initialFillRef.current = true;
        setGrouped(result.grouped);
      }
    }
  }, [location]);

  // External grouped-update event (service dispatches after recalc)
  useEffect(() => {
    const handleSalonsUpdated = (e: Event) => {
      const custom = e as CustomEvent<GroupedSalons>;
      if (custom.detail) {
        setGrouped(custom.detail);
        setRecalcCount((c) => c + 1);
        setIsRecalculating(false);
      }
    };
    window.addEventListener('nexora-salons-updated', handleSalonsUpdated as EventListener);
    return () =>
      window.removeEventListener('nexora-salons-updated', handleSalonsUpdated as EventListener);
  }, []);

  const forceRecalculate = useCallback(() => {
    setIsRecalculating(true);
    const loc = locationService.getCurrentLocation() || location;
    if (!loc) {
      setIsRecalculating(false);
      return;
    }
    const result = nearbySalonService.calculateIfNeeded(loc, salonsRef.current, true);
    if (result) {
      setGrouped(result.grouped);
      setRecalcCount((c) => c + 1);
    }
    setIsRecalculating(false);
  }, [location]);

  return {
    grouped,
    allSorted: grouped?.allSorted ?? [],
    recalcCount,
    lastLocation: location,
    forceRecalculate,
    isRecalculating,
    // additive
    isLoading,
    error,
    isDenied,
  };
}

export default useNearbySalons;
