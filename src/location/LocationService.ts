/**
 * LocationService.ts
 * Master orchestrator - Production-ready Native GPS for Nexora PWA
 * 
 * Flow (spec exact):
 * 1. User opens PWA
 * 2. Permission requested
 * 3. watchPosition() starts immediately
 * 4. Initial readings ignored while accuracy improves
 * 5. Continuously evaluates updates
 * 6. Once acceptable accuracy, location validated and saved
 * 7. Lat, Lng, Accuracy, Timestamp, Speed, Heading stored
 * 8. Distances calculated locally via Haversine
 * 9. Salons sorted by distance, rating, featured, recent activity
 * 10. Sections updated automatically
 * 11. Watcher remains active
 * 12. Moves >100m -> refresh automatically
 * 13. Poor accuracy -> wait for better fix
 * 14. Permissions, failures handled gracefully
 * 15. No external APIs
 */

import {
  ValidatedLocation,
  GPSStatus,
  StatusMessage,
  PermissionState,
  StatusChangeEvent,
  Salon,
  GroupedSalons,
} from './types';
import { STATUS_MESSAGES, LOCATION_CONFIG } from './constants';
import { logger } from './Logger';
import { errorHandler, GPSAppError } from './ErrorHandler';
import { permissionManager } from './PermissionManager';
import { distanceCalculator } from './DistanceCalculator';
import { locationValidator } from './LocationValidator';
import { gpsWatcher } from './GPSWatcher';
import { locationStore } from './LocationStore';
import { nearbySalonService } from './NearbySalonService';

type Unsubscribe = () => void;

class LocationService {
  private isInitialized = false;
  private isStarted = false;
  /** Invalidates an in-progress start when the authenticated owner logs out. */
  private startGeneration = 0;
  private updateCount = 0;
  private currentPermission: PermissionState = 'unknown';
  private lastAccepted: ValidatedLocation | null = null;
  private salonList: Salon[] = [];
  private lastGrouped: GroupedSalons | null = null;

  private status: GPSStatus = 'idle';
  private statusMessage: StatusMessage = STATUS_MESSAGES.DETECTING;

  // Listeners
  private locationUnsub: Unsubscribe | null = null;
  private permissionUnsub: Unsubscribe | null = null;

  // Debounce for UI updates
  private statusDebounceTimer: number | null = null;
  private salonRecalcDebounceTimer: number | null = null;

  // For moderate accuracy wait handling
  private moderateCheckInterval: number | null = null;

  /** Initialize once */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.logInfo('Initializing Nexora Location Service...');

    // Check permissions
    this.currentPermission = await permissionManager.checkPermission();
    locationStore.setPermission(this.currentPermission);

    // Listen to permission changes
    this.permissionUnsub = permissionManager.onChange((state) => {
      this.currentPermission = state;
      locationStore.setPermission(state);
      logger.logPermission(state);

      if (state === 'denied') {
        this.setStatus('permission-denied', STATUS_MESSAGES.PERMISSION_DENIED);
      } else if (state === 'granted' && this.isStarted) {
        // Permission granted after previously denied - restart if needed
        logger.logInfo('Permission granted - ensuring watcher active');
        if (!gpsWatcher.isActive()) {
          this.startWatcher();
        }
      }
    });

    // Monitor offline
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Cleanup on page hide for PWA lifecycle
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Check offline initial
    if (!navigator.onLine) {
      logger.logWarn('Device offline at init');
    }

    this.isInitialized = true;
    logger.logSuccess('Location Service initialized');
  }

  /** Start GPS tracking - main entry point */
  async start(): Promise<boolean> {
    const generation = this.startGeneration;
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Logout/unmount may have stopped the service while initialization was
    // awaiting permissions. Do not resurrect the browser watcher afterwards.
    if (generation !== this.startGeneration) return false;

    if (this.isStarted) {
      logger.logWarn('Location Service already started');
      return true;
    }

    logger.logInfo('Starting GPS tracking...');

    // Reset state
    locationValidator.reset();
    logger.resetCount();
    this.updateCount = 0;
    this.setStatus('detecting', STATUS_MESSAGES.DETECTING);

    const started = this.startWatcher();
    if (started) {
      this.isStarted = true;
      // Setup interval to check pending moderate fix timeout
      this.setupModerateCheck();
    }

    return started;
  }

  private startWatcher(): boolean {
    return gpsWatcher.start(
      this.handlePosition.bind(this),
      this.handleError.bind(this)
    );
  }

  /** Stop everything */
  stop(): void {
    logger.logInfo('Stopping Location Service...');
    this.startGeneration += 1;
    gpsWatcher.stop();
    if (this.moderateCheckInterval) {
      clearInterval(this.moderateCheckInterval);
      this.moderateCheckInterval = null;
    }
    if (this.statusDebounceTimer) {
      window.clearTimeout(this.statusDebounceTimer);
      this.statusDebounceTimer = null;
    }
    if (this.salonRecalcDebounceTimer) {
      window.clearTimeout(this.salonRecalcDebounceTimer);
      this.salonRecalcDebounceTimer = null;
    }
    this.isStarted = false;
    this.setStatus('idle', STATUS_MESSAGES.DETECTING);
  }

  /** Full cleanup - for app unmount */
  destroy(): void {
    this.stop();
    if (this.permissionUnsub) {
      this.permissionUnsub();
      this.permissionUnsub = null;
    }
    if (this.locationUnsub) {
      this.locationUnsub();
      this.locationUnsub = null;
    }
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    permissionManager.destroy();
    locationStore.destroy();
    nearbySalonService.clearCache();
    locationValidator.reset();
    this.isInitialized = false;
    logger.logInfo('Location Service destroyed');
  }

  /**
   * Core position handler - called for every watchPosition update
   */
  private handlePosition(position: GeolocationPosition): void {
    this.updateCount++;
    permissionManager.updateFromSuccess();

    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const timestamp = position.timestamp;

    // Calculate movement from last accepted
    let movementDistance: number | null = null;
    if (this.lastAccepted) {
      movementDistance = distanceCalculator.calculateDistanceMeters(
        this.lastAccepted.latitude,
        this.lastAccepted.longitude,
        latitude,
        longitude
      );
    }

    // Validate
    const validation = locationValidator.validate(position);

    // Determine status message based on validation
    let status: GPSStatus = this.status;
    let message: StatusMessage = this.statusMessage;

    if (!validation.accepted) {
      // STEP 10: low-accuracy (>100m) fix ko store karo as lastKnownFix —
      // app decide karta hai ki usable hai ya nahi. Screen unusable nahi banti.
      if (validation.accuracyLevel === 'low' && Number.isFinite(latitude) && Number.isFinite(longitude)) {
        locationStore.setLastKnownFix({
          latitude,
          longitude,
          accuracy,
          timestamp,
          savedAt: Date.now(),
          speed: speed ?? null,
          heading: heading ?? null,
          provider: 'Browser / HTML5 Geolocation',
          updateCount: this.updateCount,
          movementDistance,
          isFirstFix: this.updateCount === 1,
          accuracyLevel: 'low',
          isLowAccuracyFallback: true,
        });
      }

      if (validation.accuracyLevel === 'rejected' && this.updateCount === 1) {
        status = 'detecting';
        message = STATUS_MESSAGES.DETECTING;
      } else if (validation.accuracyLevel === 'poor' || validation.shouldShowImproving) {
        if (accuracy > 100) {
          status = 'waiting-better';
          message = STATUS_MESSAGES.WAITING_BETTER;
        } else if (accuracy > 50) {
          status = 'improving';
          message = STATUS_MESSAGES.IMPROVING;
        } else {
          status = 'improving';
          message = STATUS_MESSAGES.IMPROVING;
        }
      }

      // Special weak signal
      if (validation.reason.toLowerCase().includes('impossible') || accuracy > 100) {
        status = 'weak-signal';
        message = STATUS_MESSAGES.WEAK_SIGNAL;
        if (accuracy > 100) {
          status = 'waiting-better';
          message = STATUS_MESSAGES.WAITING_BETTER;
        }
      }

      this.debouncedSetStatus(status, message);

      // Log rejected
      logger.logGPSUpdate({
        latitude,
        longitude,
        accuracy,
        timestamp,
        speed,
        heading,
        movementDistance,
        permissionStatus: this.currentPermission,
        accepted: false,
        reason: validation.reason,
        status,
        message,
        triggerRecalc: false,
        rawPosition: position,
      });

      return;
    }

    // ACCEPTED
    const isFirstFix = this.lastAccepted === null;
    const previous = this.lastAccepted;

    // Calculate if we should trigger recalc - movement >100m OR first fix
    let shouldRecalc = false;
    let moveDistForSave = movementDistance ?? 0;

    if (isFirstFix) {
      shouldRecalc = true;
      moveDistForSave = 0;
    } else if (movementDistance !== null && movementDistance >= LOCATION_CONFIG.minMovementMeters) {
      shouldRecalc = true;
    }

    const validated: ValidatedLocation = {
      latitude,
      longitude,
      accuracy,
      timestamp,
      savedAt: Date.now(),
      speed: speed ?? null,
      heading: heading ?? null,
      provider: 'Browser / HTML5 Geolocation',
      updateCount: this.updateCount,
      movementDistance: isFirstFix ? null : movementDistance,
      isFirstFix,
    };

    // Save globally
    // But first check if we actually moved enough for store to notify
    // We always update internal lastAccepted, but only notify store if significant OR first fix
    if (isFirstFix || shouldRecalc || this.shouldUpdateForAccuracyImprovement(validated)) {
      locationStore.setLocation(validated, moveDistForSave);
      this.lastAccepted = validated;
      locationValidator.onLocationAccepted(validated);

      // Update status
      this.debouncedSetStatus('updated', STATUS_MESSAGES.UPDATED);

      // Log accepted
      logger.logGPSUpdate({
        latitude,
        longitude,
        accuracy,
        timestamp,
        speed,
        heading,
        movementDistance: isFirstFix ? null : movementDistance,
        permissionStatus: this.currentPermission,
        accepted: true,
        reason: validation.reason,
        status: 'updated',
        message: STATUS_MESSAGES.UPDATED,
        triggerRecalc: shouldRecalc,
        rawPosition: position,
        validatedLocation: validated,
      });

      // Trigger salon recalculation if needed
      if (shouldRecalc && this.salonList.length > 0) {
        this.debouncedRecalculateSalons(validated);
      }
    } else {
      // Accepted but not significant movement - still update validator but don't trigger UI
      // We still want to track that we got a good fix even if <100m
      logger.logGPSUpdate({
        latitude,
        longitude,
        accuracy,
        timestamp,
        speed,
        heading,
        movementDistance,
        permissionStatus: this.currentPermission,
        accepted: true,
        reason: `${validation.reason} - but movement ${movementDistance?.toFixed(1)}m < ${LOCATION_CONFIG.minMovementMeters}m, ignoring UI update`,
        status: 'updated',
        message: STATUS_MESSAGES.UPDATED,
        triggerRecalc: false,
        rawPosition: position,
        validatedLocation: validated,
      });

      // Still update lastAccepted for accuracy improvement tracking, but don't notify store
      // To avoid battery drain, we keep lastAccepted as last NOTIFIED? Let's keep both
      // For simplicity, we update validator but not store
      // However we should still consider updating lastAccepted if accuracy much better
      if (this.shouldUpdateForAccuracyImprovement(validated)) {
        locationStore.setLocation(validated, moveDistForSave);
        this.lastAccepted = validated;
        locationValidator.onLocationAccepted(validated);
      }
    }
  }

  private shouldUpdateForAccuracyImprovement(newLoc: ValidatedLocation): boolean {
    if (!this.lastAccepted) return true;
    // If new accuracy is significantly better (10m improvement) and position almost same (<20m), update
    if (
      newLoc.accuracy < this.lastAccepted.accuracy - 10 &&
      distanceCalculator.calculateDistanceMeters(
        this.lastAccepted.latitude,
        this.lastAccepted.longitude,
        newLoc.latitude,
        newLoc.longitude
      ) < 20
    ) {
      return true;
    }
    return false;
  }

  private handleError(error: GeolocationPositionError): void {
    this.updateCount++;

    const appError = errorHandler.handleGeolocationError(error);
    this.currentPermission = permissionManager.updateFromError(error);

    let status: GPSStatus = 'error';
    let message: StatusMessage = STATUS_MESSAGES.IMPROVING;

    if (appError.code === 'PERMISSION_DENIED') {
      status = 'permission-denied';
      message = STATUS_MESSAGES.PERMISSION_DENIED;
      locationStore.setPermission('denied');
    } else if (appError.code === 'POSITION_UNAVAILABLE') {
      status = 'weak-signal';
      message = STATUS_MESSAGES.WEAK_SIGNAL;
    } else if (appError.code === 'TIMEOUT') {
      status = 'waiting-better';
      message = STATUS_MESSAGES.WAITING_BETTER;
    }

    this.setStatus(status, message, {
      code: appError.code,
      message: appError.message,
      originalError: appError.originalError,
    });

    logger.logGPSUpdate({
      latitude: this.lastAccepted?.latitude ?? 0,
      longitude: this.lastAccepted?.longitude ?? 0,
      accuracy: 0,
      timestamp: Date.now(),
      speed: null,
      heading: null,
      movementDistance: null,
      permissionStatus: this.currentPermission,
      accepted: false,
      reason: appError.message,
      status,
      message,
      triggerRecalc: false,
    });

    // Auto-retry logic for transient errors
    if (appError.canRetry && appError.code !== 'PERMISSION_DENIED') {
      logger.logInfo(`Auto-retrying after error ${appError.code} in 3s...`);
      setTimeout(() => {
        if (this.isStarted && !gpsWatcher.isActive()) {
          this.startWatcher();
        }
      }, 3000);
    }
  }

  private debouncedSetStatus(status: GPSStatus, message: StatusMessage) {
    // Debounce rapid status changes to prevent UI flicker - 300ms
    if (this.statusDebounceTimer) {
      window.clearTimeout(this.statusDebounceTimer);
    }
    this.statusDebounceTimer = window.setTimeout(() => {
      this.setStatus(status, message);
    }, status === 'updated' ? 0 : 300) as unknown as number;
  }

  private setStatus(status: GPSStatus, message: StatusMessage, error?: StatusChangeEvent['error']) {
    if (this.status === status && this.statusMessage === message) return;
    this.status = status;
    this.statusMessage = message;
    locationStore.setStatus(status, message, error);
  }

  private setupModerateCheck() {
    if (this.moderateCheckInterval) clearInterval(this.moderateCheckInterval);
    this.moderateCheckInterval = window.setInterval(() => {
      const pending = locationValidator.getPendingModerateIfTimedOut();
      if (pending) {
        logger.logInfo('Pending moderate fix timed out - forcing acceptance');
        this.handlePosition(pending);
      }
    }, 1000) as unknown as number;
  }

  private debouncedRecalculateSalons(location: ValidatedLocation) {
    if (this.salonRecalcDebounceTimer) {
      window.clearTimeout(this.salonRecalcDebounceTimer);
    }
    this.salonRecalcDebounceTimer = window.setTimeout(() => {
      const result = nearbySalonService.calculateIfNeeded(location, this.salonList, false);
      if (result?.recalculated) {
        this.lastGrouped = result.grouped;
        // Notify via custom event - could also use store
        window.dispatchEvent(
          new CustomEvent('nexora-salons-updated', { detail: result.grouped })
        );
      }
    }, 200) as unknown as number;
  }

  // Public API for salons
  setSalons(salons: Salon[]) {
    this.salonList = salons;
    logger.logInfo(`Salon list set - ${salons.length} salons`);
    if (this.lastAccepted) {
      const result = nearbySalonService.calculateIfNeeded(this.lastAccepted, salons, true);
      if (result) {
        this.lastGrouped = result.grouped;
      }
    }
  }

  getNearbySalons(): GroupedSalons | null {
    if (!this.lastAccepted) return null;
    const result = nearbySalonService.calculateIfNeeded(
      this.lastAccepted,
      this.salonList,
      false
    );
    return result?.grouped ?? this.lastGrouped;
  }

  forceRecalculate(): GroupedSalons | null {
    if (!this.lastAccepted) return null;
    const result = nearbySalonService.calculateIfNeeded(
      this.lastAccepted,
      this.salonList,
      true
    );
    if (result) {
      this.lastGrouped = result.grouped;
      return result.grouped;
    }
    return null;
  }

  // Getters
  getCurrentLocation(): ValidatedLocation | null {
    return locationStore.getLocation();
  }

  getStatus(): { status: GPSStatus; message: StatusMessage } {
    return locationStore.getStatus();
  }

  getPermissionState(): PermissionState {
    return this.currentPermission;
  }

  getUpdateCount(): number {
    return this.updateCount;
  }

  // Subscriptions - for React hooks
  subscribeToLocation(callback: (loc: ValidatedLocation | null) => void): Unsubscribe {
    return locationStore.subscribeToLocation((event) => {
      callback(event.location);
    });
  }

  subscribeToStatus(
    callback: (status: GPSStatus, message: StatusMessage) => void
  ): Unsubscribe {
    return locationStore.subscribeToStatus((event) => {
      callback(event.status, event.message);
    });
  }

  // Retry permission
  async retryPermission(): Promise<boolean> {
    logger.logInfo('Retrying permission request...');
    this.currentPermission = await permissionManager.checkPermission();
    if (this.currentPermission === 'denied') {
      this.setStatus('permission-denied', STATUS_MESSAGES.PERMISSION_DENIED);
      return false;
    }

    // Try to restart watcher - will trigger browser prompt if needed
    this.stop();
    locationValidator.resetFirstReadingFlag();
    const started = this.startWatcher();
    if (started) {
      this.isStarted = true;
      this.setStatus('detecting', STATUS_MESSAGES.DETECTING);
    }
    return started;
  }

  private handleOnline = () => {
    logger.logInfo('Device online');
    if (this.isStarted && !gpsWatcher.isActive()) {
      this.startWatcher();
    }
  };

  private handleOffline = () => {
    logger.logWarn('Device offline');
    locationStore.setStatus('offline', STATUS_MESSAGES.WAITING_BETTER, {
      code: 'OFFLINE',
      message: 'Device offline',
    });
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      logger.logInfo('App foreground - checking GPS watcher');
      if (this.isStarted && !gpsWatcher.isActive()) {
        logger.logInfo('Watcher inactive while in background - restarting');
        this.startWatcher();
      }
    } else {
      // App background - keep watcher active for PWA requirement but log
      logger.logInfo('App background - keeping watcher active for quick resume');
    }
  };
}

// Singleton
export const locationService = new LocationService();
export default LocationService;
