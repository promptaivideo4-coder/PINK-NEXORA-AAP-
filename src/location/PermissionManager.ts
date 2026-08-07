/**
 * PermissionManager.ts
 * Handles browser Permissions API for geolocation
 * Graceful fallbacks, never crashes
 */

import { PermissionState } from './types';
import { logger } from './Logger';
import { errorHandler } from './ErrorHandler';

type PermissionChangeCallback = (state: PermissionState) => void;

class PermissionManager {
  private currentState: PermissionState = 'unknown';
  private permissionStatus: PermissionStatus | null = null;
  private listeners: Set<PermissionChangeCallback> = new Set();
  private isListening = false;

  /**
   * Check current permission state
   */
  async checkPermission(): Promise<PermissionState> {
    // Check if navigator.geolocation exists at all
    if (!('geolocation' in navigator)) {
      this.currentState = 'unsupported';
      logger.logPermission(this.currentState);
      return this.currentState;
    }

    // Try Permissions API if available (Android Chrome supports it)
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        this.permissionStatus = status;
        this.currentState = status.state as PermissionState;

        logger.logPermission(this.currentState);

        // Listen for changes
        if (!this.isListening) {
          status.onchange = () => {
            const newState = status.state as PermissionState;
            this.currentState = newState;
            logger.logPermission(newState);
            this.notifyListeners(newState);
          };
          this.isListening = true;
        }

        return this.currentState;
      } catch (e) {
        // Permissions API query failed - fallback to unknown, will learn on watchPosition
        logger.logWarn('Permissions API query failed, fallback to unknown', e);
        this.currentState = 'unknown';
        return this.currentState;
      }
    }

    // Permissions API not available - return unknown, we will infer from watchPosition result
    this.currentState = 'unknown';
    logger.logInfo('Permissions API not available, using unknown state');
    return this.currentState;
  }

  getCurrentState(): PermissionState {
    return this.currentState;
  }

  /**
   * Update state from GeolocationPositionError
   */
  updateFromError(error: GeolocationPositionError): PermissionState {
    if (error.code === error.PERMISSION_DENIED) {
      this.currentState = 'denied';
      this.notifyListeners('denied');
    }
    return this.currentState;
  }

  updateFromSuccess(): PermissionState {
    if (this.currentState !== 'granted') {
      this.currentState = 'granted';
      this.notifyListeners('granted');
    }
    return this.currentState;
  }

  onChange(callback: PermissionChangeCallback): () => void {
    this.listeners.add(callback);
    // Immediately call with current state if known
    if (this.currentState !== 'unknown') {
      callback(this.currentState);
    }
    // Return unsubscribe
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(state: PermissionState) {
    this.listeners.forEach((cb) => {
      errorHandler.safeExecute(() => cb(state), undefined, 'PermissionManager notify');
    });
  }

  /**
   * Check if we can request permission (prompt state)
   */
  canRequestPermission(): boolean {
    return this.currentState === 'prompt' || this.currentState === 'unknown';
  }

  isDenied(): boolean {
    return this.currentState === 'denied';
  }

  isGranted(): boolean {
    return this.currentState === 'granted';
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.permissionStatus) {
      this.permissionStatus.onchange = null;
    }
    this.listeners.clear();
    this.isListening = false;
    this.permissionStatus = null;
  }
}

export const permissionManager = new PermissionManager();
export default PermissionManager;
