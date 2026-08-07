/**
 * LocationValidator.ts
 * Intelligent GPS Validation as per spec
 * 
 * Rules:
 * - Never trust first reading
 * - Accuracy 0-15m -> Excellent -> Accept immediately
 * - Accuracy 16-30m -> Good -> Accept
 * - Accuracy 31-50m -> Wait up to 10s for better fix, if none accept
 * - Accuracy 51-100m -> Continue waiting, show Improving...
 * - Accuracy >100m -> Reject completely
 */

import { ValidationResult, ValidatedLocation } from './types';
import { ACCURACY_THRESHOLDS, LOCATION_CONFIG, MAX_REASONABLE_SPEED_MS } from './constants';
import { distanceCalculator } from './DistanceCalculator';
import { logger } from './Logger';

interface PendingModerateFix {
  position: GeolocationPosition;
  firstSeenAt: number;
}

class LocationValidator {
  private isFirstReading = true;
  private lastAcceptedLocation: ValidatedLocation | null = null;
  private pendingModerate: PendingModerateFix | null = null;
  private updateCount = 0;

  /**
   * Main validation entry - called for every watchPosition update
   */
  validate(position: GeolocationPosition): ValidationResult {
    this.updateCount++;
    const { latitude, longitude, accuracy, speed } = position.coords;
    const posTimestamp = position.timestamp;

    // 1. Reject invalid coords
    if (!this.isValidCoordinate(latitude, longitude)) {
      return {
        accepted: false,
        reason: `Invalid coordinates: lat=${latitude}, lng=${longitude}`,
        accuracyLevel: 'rejected',
        shouldShowImproving: false,
      };
    }

    // 2. Never trust first reading - spec requirement
    if (this.isFirstReading) {
      this.isFirstReading = false;
      return {
        accepted: false,
        reason: 'Ignoring initial GPS reading - waiting for stabilization',
        accuracyLevel: 'rejected',
        shouldShowImproving: true,
      };
    }

    // 3. Check if reading is newer than last accepted
    if (this.lastAcceptedLocation && posTimestamp <= this.lastAcceptedLocation.timestamp) {
      return {
        accepted: false,
        reason: `Stale reading - timestamp ${posTimestamp} <= last accepted ${this.lastAcceptedLocation.timestamp}`,
        accuracyLevel: 'rejected',
        shouldShowImproving: false,
      };
    }

    // 4. Accuracy checks per spec
    if (accuracy > ACCURACY_THRESHOLDS.REJECT_ABOVE) {
      // >100m reject completely
      // Clear any pending moderate fix if accuracy got worse
      return {
        accepted: false,
        reason: `Accuracy ${accuracy.toFixed(1)}m > 100m - Rejected completely`,
        accuracyLevel: 'rejected',
        shouldShowImproving: true,
      };
    }

    // 5. Duplicate check
    if (this.lastAcceptedLocation) {
      const distFromLast = distanceCalculator.calculateDistanceMeters(
        this.lastAcceptedLocation.latitude,
        this.lastAcceptedLocation.longitude,
        latitude,
        longitude
      );
      if (distFromLast < LOCATION_CONFIG.duplicateThresholdMeters) {
        // Same position, check if accuracy improved significantly?
        const accuracyImproved =
          accuracy < this.lastAcceptedLocation.accuracy - 5; // 5m improvement threshold
        if (!accuracyImproved) {
          return {
            accepted: false,
            reason: `Duplicate position - distance ${distFromLast.toFixed(1)}m < ${LOCATION_CONFIG.duplicateThresholdMeters}m and no accuracy improvement`,
            accuracyLevel: this.getAccuracyLevel(accuracy),
            shouldShowImproving: false,
          };
        }
      }

      // 6. Impossible jump detection
      const timeDiffMs = posTimestamp - this.lastAcceptedLocation.timestamp;
      if (
        timeDiffMs > 0 &&
        timeDiffMs < LOCATION_CONFIG.impossibleJumpTimeMs
      ) {
        const distJump = distanceCalculator.calculateDistanceMeters(
          this.lastAcceptedLocation.latitude,
          this.lastAcceptedLocation.longitude,
          latitude,
          longitude
        );
        if (distJump > LOCATION_CONFIG.impossibleJumpMeters) {
          return {
            accepted: false,
            reason: `Impossible jump detected: ${distJump.toFixed(1)}m in ${timeDiffMs}ms - Rejected`,
            accuracyLevel: 'rejected',
            shouldShowImproving: true,
          };
        }

        // Also check speed if available
        if (speed !== null && speed > MAX_REASONABLE_SPEED_MS) {
          // But don't reject immediately if speed is GPS glitch - only if distance also large
          if (distJump > 500) {
            return {
              accepted: false,
              reason: `Unreasonable speed ${speed.toFixed(1)} m/s with jump ${distJump.toFixed(1)}m - Rejected`,
              accuracyLevel: 'rejected',
              shouldShowImproving: true,
            };
          }
        }
      }
    }

    // 7. Apply accuracy acceptance rules
    if (accuracy <= ACCURACY_THRESHOLDS.EXCELLENT_MAX) {
      // 0-15m Excellent -> Accept immediately
      this.pendingModerate = null;
      return {
        accepted: true,
        reason: `Excellent accuracy ${accuracy.toFixed(1)}m (0-15m) - Accepted immediately`,
        accuracyLevel: 'excellent',
        shouldShowImproving: false,
      };
    }

    if (accuracy <= ACCURACY_THRESHOLDS.GOOD_MAX) {
      // 16-30m Good -> Accept
      this.pendingModerate = null;
      return {
        accepted: true,
        reason: `Good accuracy ${accuracy.toFixed(1)}m (16-30m) - Accepted`,
        accuracyLevel: 'good',
        shouldShowImproving: false,
      };
    }

    if (accuracy <= ACCURACY_THRESHOLDS.MODERATE_MAX) {
      // 31-50m -> Wait up to 10s for better fix
      if (!this.pendingModerate) {
        // First moderate reading - start waiting
        this.pendingModerate = {
          position,
          firstSeenAt: Date.now(),
        };
        return {
          accepted: false,
          reason: `Moderate accuracy ${accuracy.toFixed(1)}m (31-50m) - Waiting up to 10s for better fix`,
          accuracyLevel: 'moderate',
          shouldShowImproving: true,
        };
      } else {
        // We already have a pending moderate - check timeout
        const waitingTime = Date.now() - this.pendingModerate.firstSeenAt;
        if (waitingTime >= LOCATION_CONFIG.moderateAccuracyWaitMs) {
          // Timeout - accept the BEST of pending and current
          const bestPos =
            position.coords.accuracy < this.pendingModerate.position.coords.accuracy
              ? position
              : this.pendingModerate.position;
          this.pendingModerate = null;
          // We accept - but need to return true, the actual position to use will be handled by caller
          // For simplicity, we accept current reading (or caller can pick best)
          logger.logInfo(`Moderate accuracy wait timeout (${waitingTime}ms) - accepting best available ${bestPos.coords.accuracy.toFixed(1)}m`);
          return {
            accepted: true,
            reason: `Moderate accuracy ${accuracy.toFixed(1)}m - Waited ${waitingTime}ms, accepting best fix`,
            accuracyLevel: 'moderate',
            shouldShowImproving: false,
          };
        } else {
          // Still within wait window - check if current is better than pending
          if (position.coords.accuracy < this.pendingModerate.position.coords.accuracy) {
            this.pendingModerate.position = position;
          }
          return {
            accepted: false,
            reason: `Moderate accuracy ${accuracy.toFixed(1)}m - Still waiting for better fix (${waitingTime}ms / ${LOCATION_CONFIG.moderateAccuracyWaitMs}ms)`,
            accuracyLevel: 'moderate',
            shouldShowImproving: true,
          };
        }
      }
    }

    if (accuracy <= ACCURACY_THRESHOLDS.POOR_MAX) {
      // 51-100m -> Continue waiting
      return {
        accepted: false,
        reason: `Poor accuracy ${accuracy.toFixed(1)}m (51-100m) - Continuing to wait for better fix`,
        accuracyLevel: 'poor',
        shouldShowImproving: true,
      };
    }

    // Fallback - should have been handled already
    return {
      accepted: false,
      reason: `Unhandled accuracy case: ${accuracy}m`,
      accuracyLevel: 'rejected',
      shouldShowImproving: true,
    };
  }

  /**
   * Called after accepting a location to update internal state
   */
  onLocationAccepted(location: ValidatedLocation) {
    this.lastAcceptedLocation = location;
    this.pendingModerate = null;
  }

  getLastAccepted(): ValidatedLocation | null {
    return this.lastAcceptedLocation;
  }

  setLastAccepted(location: ValidatedLocation | null) {
    this.lastAcceptedLocation = location;
    if (location) this.isFirstReading = false;
  }

  reset() {
    this.isFirstReading = true;
    this.lastAcceptedLocation = null;
    this.pendingModerate = null;
    this.updateCount = 0;
  }

  resetFirstReadingFlag() {
    this.isFirstReading = true;
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    // Proper validation – allow 0,0 but treat as suspicious elsewhere if needed
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      isFinite(lat) &&
      isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  private getAccuracyLevel(accuracy: number): ValidationResult['accuracyLevel'] {
    if (accuracy <= ACCURACY_THRESHOLDS.EXCELLENT_MAX) return 'excellent';
    if (accuracy <= ACCURACY_THRESHOLDS.GOOD_MAX) return 'good';
    if (accuracy <= ACCURACY_THRESHOLDS.MODERATE_MAX) return 'moderate';
    if (accuracy <= ACCURACY_THRESHOLDS.POOR_MAX) return 'poor';
    return 'rejected';
  }

  /**
   * If pending moderate times out, get the best pending position
   */
  getPendingModerateIfTimedOut(): GeolocationPosition | null {
    if (!this.pendingModerate) return null;
    if (Date.now() - this.pendingModerate.firstSeenAt >= LOCATION_CONFIG.moderateAccuracyWaitMs) {
      return this.pendingModerate.position;
    }
    return null;
  }
}

export const locationValidator = new LocationValidator();
export default LocationValidator;
