/**
 * SalonSorter.ts
 * Intelligent salon sorting per spec:
 * 1. Nearest Distance
 * 2. Highest Rating
 * 3. Featured Status
 * 4. Recently Active
 */

import { SalonWithDistance, GroupedSalons } from './types';
import { DISTANCE_GROUPS } from './constants';
import { logger } from './Logger';

class SalonSorter {
  /**
   * Main sort function - stable, efficient
   */
  sort(salons: SalonWithDistance[]): SalonWithDistance[] {
    // Copy to avoid mutating original
    const sorted = [...salons];

    sorted.sort((a, b) => {
      // 1. Nearest Distance (primary)
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      // 2. Highest Rating (secondary) - if distance equal within 50m
      const distanceDiff = Math.abs(a.distance - b.distance);
      if (distanceDiff < 50 && a.rating !== b.rating) {
        return b.rating - a.rating; // Higher rating first
      }

      // 3. Featured Status
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1; // Featured first
      }

      // 4. Recently Active
      const aActive = a.lastActiveAt ?? 0;
      const bActive = b.lastActiveAt ?? 0;
      if (aActive !== bActive) {
        return bActive - aActive; // More recent first
      }

      // Fallback: alphabetical
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }

  /**
   * Group salons into sections per spec
   * - Nearby (0-2 km)
   * - Close (2-5 km)
   * - Around You (5-10 km)
   * - Everything Else
   */
  group(salonsSorted: SalonWithDistance[]): GroupedSalons {
    const nearby: SalonWithDistance[] = [];
    const close: SalonWithDistance[] = [];
    const aroundYou: SalonWithDistance[] = [];
    const everythingElse: SalonWithDistance[] = [];

    for (const salon of salonsSorted) {
      if (salon.distance <= DISTANCE_GROUPS.NEARBY_MAX_M) {
        nearby.push(salon);
      } else if (salon.distance <= DISTANCE_GROUPS.CLOSE_MAX_M) {
        close.push(salon);
      } else if (salon.distance <= DISTANCE_GROUPS.AROUND_MAX_M) {
        aroundYou.push(salon);
      } else {
        everythingElse.push(salon);
      }
    }

    const grouped: GroupedSalons = {
      nearby,
      close,
      aroundYou,
      everythingElse,
      allSorted: salonsSorted,
    };

    logger.logInfo(
      `Salons grouped: Nearby(0-2km)=${nearby.length}, Close(2-5km)=${close.length}, Around(5-10km)=${aroundYou.length}, Others=${everythingElse.length}`
    );

    return grouped;
  }

  /**
   * Combined sort + group
   */
  sortAndGroup(salons: SalonWithDistance[]): GroupedSalons {
    const sorted = this.sort(salons);
    return this.group(sorted);
  }
}

export const salonSorter = new SalonSorter();
export default SalonSorter;
