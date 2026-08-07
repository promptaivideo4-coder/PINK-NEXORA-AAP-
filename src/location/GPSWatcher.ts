/**
 * GPSWatcher.ts
 * Single active watcher manager - production ready
 * ONLY uses navigator.geolocation.watchPosition()
 * Always cleans up previous watcher
 */

import { GPS_OPTIONS } from './constants';
import { logger } from './Logger';
import { errorHandler } from './ErrorHandler';

type PositionCallback = (position: GeolocationPosition) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;

class GPSWatcher {
  private watchId: number | null = null;
  private isWatching = false;
  private positionCallback: PositionCallback | null = null;
  private errorCallback: ErrorCallback | null = null;

  /**
   * Start watching - ensures only one active watcher
   */
  start(
    onPosition: PositionCallback,
    onError: ErrorCallback
  ): boolean {
    // Cleanup any existing watcher first - spec requirement
    this.stop();

    if (!('geolocation' in navigator)) {
      logger.logError('Geolocation not supported');
      const err = {
        code: 0,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as unknown as GeolocationPositionError;
      onError(err);
      return false;
    }

    this.positionCallback = onPosition;
    this.errorCallback = onError;

    try {
      // EXACT spec config
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Wrap in safe execute
          errorHandler.safeExecute(
            () => this.positionCallback?.(position),
            undefined,
            'GPSWatcher position callback'
          );
        },
        (error) => {
          errorHandler.safeExecute(
            () => this.errorCallback?.(error),
            undefined,
            'GPSWatcher error callback'
          );
        },
        GPS_OPTIONS
      );

      this.isWatching = true;
      logger.logWatcher('started', this.watchId);
      logger.logInfo(`GPS watcher started with options: ${JSON.stringify(GPS_OPTIONS)}`);
      return true;
    } catch (e) {
      logger.logError('Failed to start watchPosition', e);
      const wrapped = errorHandler.handleWatchFailed(e);
      // Convert to GeolocationPositionError-like for callback
      const geoError = {
        code: 2,
        message: wrapped.message,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError;
      onError(geoError);
      return false;
    }
  }

  /**
   * Emergency fallback using getCurrentPosition - only if absolutely required
   * Spec says do NOT use getCurrentPosition except as emergency compatibility fallback
   */
  emergencyGetCurrentPosition(
    onPosition: PositionCallback,
    onError: ErrorCallback
  ): void {
    logger.logWarn('Using emergency getCurrentPosition fallback - browser compatibility');
    if (!('geolocation' in navigator)) {
      const err = {
        code: 0,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as unknown as GeolocationPositionError;
      onError(err);
      return;
    }

    navigator.geolocation.getCurrentPosition(onPosition, onError, GPS_OPTIONS);
  }

  /**
   * Stop watcher - always use clearWatch
   */
  stop(): void {
    if (this.watchId !== null) {
      try {
        navigator.geolocation.clearWatch(this.watchId);
        logger.logWatcher('stopped', this.watchId);
      } catch (e) {
        logger.logError('Failed to clearWatch', e);
      }
      this.watchId = null;
    }
    this.isWatching = false;
    this.positionCallback = null;
    this.errorCallback = null;
  }

  /**
   * Cleanup wrapper
   */
  cleanup(): void {
    if (this.watchId !== null) {
      logger.logWatcher('cleaned');
    }
    this.stop();
  }

  getWatchId(): number | null {
    return this.watchId;
  }

  isActive(): boolean {
    return this.isWatching && this.watchId !== null;
  }
}

// Singleton - ensures one active watcher globally
export const gpsWatcher = new GPSWatcher();
export default GPSWatcher;
