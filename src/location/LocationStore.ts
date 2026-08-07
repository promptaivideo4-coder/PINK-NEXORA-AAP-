/**
 * LocationStore.ts
 * Centralized state manager for validated location
 * Available globally, prevents unnecessary renders
 */

import {
  ValidatedLocation,
  GPSStatus,
  StatusMessage,
  LocationChangeEvent,
  StatusChangeEvent,
  PermissionState,
} from './types';
import { STATUS_MESSAGES } from './constants';
import { logger } from './Logger';

type LocationListener = (event: LocationChangeEvent) => void;
type StatusListener = (event: StatusChangeEvent) => void;
type PermissionListener = (state: PermissionState) => void;

class LocationStore {
  private currentLocation: ValidatedLocation | null = null;
  private previousLocation: ValidatedLocation | null = null;
  private gpsStatus: GPSStatus = 'idle';
  private statusMessage: StatusMessage = STATUS_MESSAGES.DETECTING;
  private permissionState: PermissionState = 'unknown';

  private locationListeners: Set<LocationListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private permissionListeners: Set<PermissionListener> = new Set();

  // For preventing duplicate state updates
  private lastNotifiedLocationTimestamp: number | null = null;

  getLocation(): ValidatedLocation | null {
    return this.currentLocation;
  }

  getPreviousLocation(): ValidatedLocation | null {
    return this.previousLocation;
  }

  getStatus(): { status: GPSStatus; message: StatusMessage } {
    return {
      status: this.gpsStatus,
      message: this.statusMessage,
    };
  }

  getPermission(): PermissionState {
    return this.permissionState;
  }

  /**
   * Save validated location - globally available
   */
  setLocation(location: ValidatedLocation, movementDistance: number): boolean {
    // Avoid duplicate saves
    if (
      this.lastNotifiedLocationTimestamp !== null &&
      location.timestamp === this.lastNotifiedLocationTimestamp
    ) {
      return false;
    }

    this.previousLocation = this.currentLocation;
    this.currentLocation = location;
    this.lastNotifiedLocationTimestamp = location.timestamp;

    logger.logInfo(
      `Location saved globally: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(
        6
      )} accuracy=${location.accuracy}m`
    );

    const event: LocationChangeEvent = {
      location,
      previousLocation: this.previousLocation,
      movementDistance,
    };

    this.notifyLocationListeners(event);
    return true;
  }

  setStatus(status: GPSStatus, message: StatusMessage, error?: StatusChangeEvent['error']) {
    // Prevent unnecessary status updates
    if (this.gpsStatus === status && this.statusMessage === message) {
      return;
    }

    this.gpsStatus = status;
    this.statusMessage = message;

    const event: StatusChangeEvent = {
      status,
      message,
      error,
    };

    this.notifyStatusListeners(event);
  }

  setPermission(state: PermissionState) {
    if (this.permissionState === state) return;
    this.permissionState = state;
    this.notifyPermissionListeners(state);
  }

  // Subscriptions
  subscribeToLocation(listener: LocationListener): () => void {
    this.locationListeners.add(listener);
    // Immediately notify with current if available
    if (this.currentLocation) {
      listener({
        location: this.currentLocation,
        previousLocation: this.previousLocation,
        movementDistance: this.currentLocation.movementDistance ?? 0,
      });
    }
    return () => this.locationListeners.delete(listener);
  }

  subscribeToStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    // Immediate notify
    listener({
      status: this.gpsStatus,
      message: this.statusMessage,
    });
    return () => this.statusListeners.delete(listener);
  }

  subscribeToPermission(listener: PermissionListener): () => void {
    this.permissionListeners.add(listener);
    if (this.permissionState !== 'unknown') {
      listener(this.permissionState);
    }
    return () => this.permissionListeners.delete(listener);
  }

  private notifyLocationListeners(event: LocationChangeEvent) {
    this.locationListeners.forEach((l) => {
      try {
        l(event);
      } catch (e) {
        logger.logError('Location listener error', e);
      }
    });
  }

  private notifyStatusListeners(event: StatusChangeEvent) {
    this.statusListeners.forEach((l) => {
      try {
        l(event);
      } catch (e) {
        logger.logError('Status listener error', e);
      }
    });
  }

  private notifyPermissionListeners(state: PermissionState) {
    this.permissionListeners.forEach((l) => {
      try {
        l(state);
      } catch (e) {
        logger.logError('Permission listener error', e);
      }
    });
  }

  clear() {
    this.currentLocation = null;
    this.previousLocation = null;
    this.lastNotifiedLocationTimestamp = null;
    this.gpsStatus = 'idle';
    this.statusMessage = STATUS_MESSAGES.DETECTING;
  }

  destroy() {
    this.locationListeners.clear();
    this.statusListeners.clear();
    this.permissionListeners.clear();
    this.clear();
  }
}

export const locationStore = new LocationStore();
export default LocationStore;
