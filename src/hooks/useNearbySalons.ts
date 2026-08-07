/**
 * useNearbySalons.ts
 * Hook for salon distance calculation - only recalculates when user moves >100m
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Salon, GroupedSalons, ValidatedLocation } from '../location/types';
import { locationService } from '../location/LocationService';
import { nearbySalonService } from '../location/NearbySalonService';
import { locationStore } from '../location/LocationStore';

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
}

export function useNearbySalons(
  options: UseNearbySalonsOptions
): UseNearbySalonsReturn {
  const { salons, autoRecalc = true } = options;

  const [grouped, setGrouped] = useState<GroupedSalons | null>(() =>
    locationService.getNearbySalons()
  );
  const [recalcCount, setRecalcCount] = useState(0);
  const [lastLocation, setLastLocation] = useState<ValidatedLocation | null>(() =>
    locationStore.getLocation()
  );
  const [isRecalculating, setIsRecalculating] = useState(false);

  const salonsRef = useRef(salons);

  // Keep salons ref updated and push to service
  useEffect(() => {
    salonsRef.current = salons;
    locationService.setSalons(salons);

    // Force recalc when salon list changes and we have location
    if (locationStore.getLocation()) {
      const result = locationService.forceRecalculate();
      if (result) {
        setGrouped(result);
        setRecalcCount((c) => c + 1);
      }
    }
  }, [salons]);

  const handleLocationUpdate = useCallback((loc: ValidatedLocation) => {
    setLastLocation(loc);
    if (!autoRecalc) return;

    // Only recalc is already handled by service's debounced logic
    // We listen to custom event as well
    const result = nearbySalonService.calculateIfNeeded(
      loc,
      salonsRef.current,
      false
    );
    if (result) {
      setGrouped((prev) => {
        // Prevent unnecessary render if not recalculated
        if (!result.recalculated && prev) return prev;
        return result.grouped;
      });
      if (result.recalculated) {
        setRecalcCount((c) => c + 1);
      }
    }
  }, [autoRecalc]);

  useEffect(() => {
    const unsub = locationStore.subscribeToLocation((event) => {
      handleLocationUpdate(event.location);
    });

    const handleSalonsUpdated = (e: Event) => {
      const custom = e as CustomEvent<GroupedSalons>;
      setGrouped(custom.detail);
      setRecalcCount((c) => c + 1);
      setIsRecalculating(false);
    };

    window.addEventListener('nexora-salons-updated', handleSalonsUpdated as EventListener);

    return () => {
      unsub();
      window.removeEventListener('nexora-salons-updated', handleSalonsUpdated as EventListener);
    };
  }, [handleLocationUpdate]);

  const forceRecalculate = useCallback(() => {
    setIsRecalculating(true);
    const loc = locationStore.getLocation();
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
  }, []);

  return {
    grouped,
    allSorted: grouped?.allSorted ?? [],
    recalcCount,
    lastLocation,
    forceRecalculate,
    isRecalculating,
  };
}

export default useNearbySalons;
