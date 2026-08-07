/**
 * ErrorHandler.ts
 * Robust error handling for all GPS scenarios
 * Never crash - graceful recovery paths
 */

import { GPSErrorCode, GPSStatus, StatusMessage } from './types';
import { STATUS_MESSAGES } from './constants';
import { logger } from './Logger';

export interface GPSAppError {
  code: GPSErrorCode;
  message: string;
  userMessage: StatusMessage | string;
  status: GPSStatus;
  canRetry: boolean;
  originalError?: unknown;
}

class ErrorHandler {
  /**
   * Handle GeolocationPositionError from browser
   */
  handleGeolocationError(error: GeolocationPositionError): GPSAppError {
    let appError: GPSAppError;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        appError = {
          code: 'PERMISSION_DENIED',
          message: `Permission denied: ${error.message}`,
          userMessage: STATUS_MESSAGES.PERMISSION_DENIED,
          status: 'permission-denied',
          canRetry: true,
          originalError: error,
        };
        break;

      case error.POSITION_UNAVAILABLE:
        appError = {
          code: 'POSITION_UNAVAILABLE',
          message: `Position unavailable: ${error.message}. GPS may be disabled or signal lost.`,
          userMessage: STATUS_MESSAGES.WEAK_SIGNAL,
          status: 'weak-signal',
          canRetry: true,
          originalError: error,
        };
        break;

      case error.TIMEOUT:
        appError = {
          code: 'TIMEOUT',
          message: `GPS timeout: ${error.message}. Waiting for better fix.`,
          userMessage: STATUS_MESSAGES.WAITING_BETTER,
          status: 'weak-signal',
          canRetry: true,
          originalError: error,
        };
        break;

      default:
        appError = {
          code: 'UNKNOWN',
          message: `Unknown geolocation error: ${error.message}`,
          userMessage: STATUS_MESSAGES.IMPROVING,
          status: 'error',
          canRetry: true,
          originalError: error,
        };
    }

    logger.logError(`Geolocation error [${appError.code}]: ${appError.message}`, error);
    return appError;
  }

  handleBrowserUnsupported(): GPSAppError {
    const err: GPSAppError = {
      code: 'UNSUPPORTED',
      message: 'Geolocation API not supported in this browser',
      userMessage: 'Location services not supported in this browser.',
      status: 'unsupported',
      canRetry: false,
    };
    logger.logError(err.message);
    return err;
  }

  handleOffline(): GPSAppError {
    const err: GPSAppError = {
      code: 'OFFLINE',
      message: 'Device offline, GPS may be degraded',
      userMessage: STATUS_MESSAGES.WAITING_BETTER,
      status: 'offline',
      canRetry: true,
    };
    logger.logWarn(err.message);
    return err;
  }

  handleWatchFailed(error: unknown): GPSAppError {
    const err: GPSAppError = {
      code: 'WATCH_FAILED',
      message: `watchPosition failed: ${error instanceof Error ? error.message : String(error)}`,
      userMessage: STATUS_MESSAGES.IMPROVING,
      status: 'error',
      canRetry: true,
      originalError: error,
    };
    logger.logError(err.message, error);
    return err;
  }

  handleGPSDisabled(): GPSAppError {
    const err: GPSAppError = {
      code: 'GPS_DISABLED',
      message: 'GPS disabled on device',
      userMessage: STATUS_MESSAGES.WEAK_SIGNAL,
      status: 'weak-signal',
      canRetry: true,
    };
    logger.logWarn(err.message);
    return err;
  }

  handleWeakSignal(accuracy: number): GPSAppError {
    const err: GPSAppError = {
      code: 'WEAK_SIGNAL',
      message: `Weak GPS signal, accuracy: ${accuracy}m`,
      userMessage: accuracy > 100 ? STATUS_MESSAGES.WAITING_BETTER : STATUS_MESSAGES.IMPROVING,
      status: accuracy > 100 ? 'waiting-better' : 'improving',
      canRetry: true,
    };
    logger.logWarn(err.message);
    return err;
  }

  /**
   * Safe wrapper - never throws
   */
  safeExecute<T>(fn: () => T, fallback: T, context: string): T {
    try {
      return fn();
    } catch (e) {
      logger.logError(`Exception in ${context}`, e);
      return fallback;
    }
  }

  async safeExecuteAsync<T>(fn: () => Promise<T>, fallback: T, context: string): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      logger.logError(`Async exception in ${context}`, e);
      return fallback;
    }
  }
}

export const errorHandler = new ErrorHandler();
export default ErrorHandler;
