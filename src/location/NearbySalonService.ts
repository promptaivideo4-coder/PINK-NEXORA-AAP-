/**
 * NearbySalonService.ts
 * Calculates salon distances locally using Haversine
 * No external APIs - client side only
 */

import { Salon, SalonWithDistance, GroupedSalons, ValidatedLocation } from './types';
import { distanceCalculator } from './DistanceCalculator';
import { salonSorter } from './SalonSorter';
import { LOCATION_CONFIG } from './constants';
import { logger } from './Logger';

class NearbySalonService {
  private lastCalculatedLocation: ValidatedLocation | null = null;
  private cachedGrouped: GroupedSalons | null = null;
  private cachedSalonsRef: Salon[] | null = null;

  /**
   * Calculate distances for all salons - only if moved >100m
   */
  calculateIfNeeded(
    currentLocation: ValidatedLocation,
    salons: Salon[],
    force = false
  ): { grouped: GroupedSalons; recalculated: boolean } | null {
    // No location => can't calculate
    if (!currentLocation) return null;

    // Check if accuracy is poor - spec says never calculate from poor GPS
    if (currentLocation.accuracy > LOCATION_CONFIG.maxAccuracyForCalc) {
      logger.logWarn(
        `Skipping salon calculation - accuracy ${currentLocation.accuracy}m > ${LOCATION_CONFIG.maxAccuracyForCalc}m`
      );
      return null;
    }

    // Check movement threshold
    if (!force && this.lastCalculatedLocation) {
      const moved = distanceCalculator.calculateDistanceMeters(
        this.lastCalculatedLocation.latitude,
        this.lastCalculatedLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (moved < LOCATION_CONFIG.minMovementMeters) {
        logger.logInfo(
          `Skipping recalc - movement ${moved.toFixed(1)}m < ${LOCATION_CONFIG.minMovementMeters}m threshold`
        );
        // Return cached if available and same salons ref
        if (this.cachedGrouped && this.cachedSalonsRef === salons) {
          return { grouped: this.cachedGrouped, recalculated: false };
        }
        // If salons changed but didn't move, we still need recalc
        if (this.cachedSalonsRef !== salons) {
          logger.logInfo('Salon list reference changed - recalculating even though movement <100m');
        } else {
          // No recalc needed, return cached
          return this.cachedGrouped
            ? { grouped: this.cachedGrouped, recalculated: false }
            : null;
        }
      } else {
        logger.logSuccess(`Movement ${moved.toFixed(1)}m >= ${LOCATION_CONFIG.minMovementMeters}m - recalculating`);
      }
    }

    const result = this.calculate(currentLocation, salons);
    this.lastCalculatedLocation = currentLocation;
    this.cachedGrouped = result;
    this.cachedSalonsRef = salons;

    return { grouped: result, recalculated: true };
  }

  /**
   * Core Haversine calculation for all salons
   */
  calculate(currentLocation: ValidatedLocation, salons: Salon[]): GroupedSalons {
    const start = performance.now();

    logger.logSalonRecalc(salons.length, currentLocation.movementDistance ?? 0);

    const withDistance: SalonWithDistance[] = salons.map((salon) => {
      const distance = distanceCalculator.calculateDistanceMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        salon.latitude,
        salon.longitude
      );

      return {
        ...salon,
        distance,
        distanceKm: distance / 1000,
        distanceLabel: distanceCalculator.formatDistance(distance),
      };
    });

    // Filter out invalid distances (Infinity)
    const validSalons = withDistance.filter((s) => isFinite(s.distance));

    const grouped = salonSorter.sortAndGroup(validSalons);

    const duration = performance.now() - start;
    logger.logInfo(`Salon distance calc completed in ${duration.toFixed(2)}ms for ${salons.length} salons`);

    return grouped;
  }

  /**
   * Calculate single salon distance
   */
  calculateSingle(
    currentLocation: ValidatedLocation,
    salon: Salon
  ): SalonWithDistance {
    const distance = distanceCalculator.calculateDistanceMeters(
      currentLocation.latitude,
      currentLocation.longitude,
      salon.latitude,
      salon.longitude
    );

    return {
      ...salon,
      distance,
      distanceKm: distance / 1000,
      distanceLabel: distanceCalculator.formatDistance(distance),
    };
  }

  getLastLocation(): ValidatedLocation | null {
    return this.lastCalculatedLocation;
  }

  getCached(): GroupedSalons | null {
    return this.cachedGrouped;
  }

  clearCache() {
    this.lastCalculatedLocation = null;
    this.cachedGrouped = null;
    this.cachedSalonsRef = null;
  }
}

export const nearbySalonService = new NearbySalonService();
export default NearbySalonService;
