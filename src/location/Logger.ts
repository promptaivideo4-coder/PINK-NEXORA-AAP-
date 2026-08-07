/**
 * Logger.ts
 * Centralized detailed development logger for Nexora GPS
 * Spec requires detailed logs for every GPS update
 */

import { GPSLogEntry, ValidatedLocation, PermissionState, GPSStatus, StatusMessage } from './types';
import { LOG_PREFIX, DEBUG_ENABLED } from './constants';

class Logger {
  private isDebug: boolean;
  private updateCount: number = 0;

  constructor(debug = DEBUG_ENABLED) {
    this.isDebug = debug;
  }

  setDebug(enabled: boolean) {
    this.isDebug = enabled;
  }

  private formatTimestamp(ts: number): string {
    return new Date(ts).toISOString();
  }

  private shouldLog(): boolean {
    // Always log in dev, errors always in prod
    return this.isDebug;
  }

  /**
   * Log every GPS update - example format from spec
   */
  logGPSUpdate(params: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    speed: number | null;
    heading: number | null;
    movementDistance: number | null;
    permissionStatus: PermissionState;
    accepted: boolean;
    reason: string;
    status: GPSStatus;
    message: StatusMessage;
    triggerRecalc: boolean;
    rawPosition?: GeolocationPosition;
    validatedLocation?: ValidatedLocation | null;
  }) {
    this.updateCount++;
    const entry: GPSLogEntry = {
      updateCount: this.updateCount,
      timestamp: this.formatTimestamp(params.timestamp),
      latitude: params.latitude,
      longitude: params.longitude,
      accuracy: params.accuracy,
      speed: params.speed,
      heading: params.heading,
      movementDistance: params.movementDistance,
      permissionStatus: params.permissionStatus,
      provider: 'Browser / HTML5 Geolocation',
      accepted: params.accepted,
      reason: params.reason,
      status: params.status,
      message: params.message,
      triggerRecalc: params.triggerRecalc,
    };

    if (params.accepted) {
      const log = `
${LOG_PREFIX} GPS Update #${entry.updateCount}

Latitude: ${entry.latitude.toFixed(6)}
Longitude: ${entry.longitude.toFixed(6)}
Accuracy: ${entry.accuracy}m
Timestamp: ${entry.timestamp}
Speed: ${entry.speed ?? 'N/A'}
Heading: ${entry.heading ?? 'N/A'}

Accepted

Saving location...

Movement: ${entry.movementDistance !== null ? `${entry.movementDistance.toFixed(1)}m` : 'First fix / N/A'}
Permission: ${entry.permissionStatus}
Provider: ${entry.provider}

${entry.triggerRecalc ? 'Recalculating salon distances...\nSorting salons...\nUI refreshed.' : 'Movement <100m - ignoring update.'}
      `.trim();

      if (this.shouldLog()) console.log(`%c${log}`, 'color: #00C853; font-weight: bold;');
    } else {
      const log = `
${LOG_PREFIX} GPS Update #${entry.updateCount}

Latitude: ${entry.latitude.toFixed(6)}
Longitude: ${entry.longitude.toFixed(6)}
Accuracy: ${entry.accuracy}m
Timestamp: ${entry.timestamp}
Speed: ${entry.speed ?? 'N/A'}
Heading: ${entry.heading ?? 'N/A'}

Rejected

Reason:
${entry.reason}

${entry.message}
Status: ${entry.status}
Permission: ${entry.permissionStatus}
Provider: ${entry.provider}
      `.trim();

      if (this.shouldLog()) console.warn(`%c${log}`, 'color: #FF6D00;');
    }

    // Structured log for analytics / debugging
    if (this.shouldLog()) {
      console.debug(`${LOG_PREFIX} Structured:`, entry);
    }

    return entry;
  }

  logInfo(message: string, data?: unknown) {
    if (!this.shouldLog()) return;
    console.log(`${LOG_PREFIX} ${message}`, data ?? '');
  }

  logWarn(message: string, data?: unknown) {
    console.warn(`${LOG_PREFIX} ${message}`, data ?? '');
  }

  logError(message: string, error?: unknown) {
    // Errors always log even in production
    console.error(`${LOG_PREFIX} ERROR: ${message}`, error ?? '');
  }

  logSuccess(message: string, data?: unknown) {
    if (!this.shouldLog()) return;
    console.log(`%c${LOG_PREFIX} ${message}`, 'color: #2962FF; font-weight: bold;', data ?? '');
  }

  logWatcher(action: 'started' | 'stopped' | 'cleaned', watchId?: number) {
    if (!this.shouldLog()) return;
    if (action === 'started') {
      console.log(`%c${LOG_PREFIX} GPS watcher started - ID: ${watchId}`, 'color: #0091EA;');
    } else if (action === 'stopped') {
      console.log(`%c${LOG_PREFIX} GPS watcher stopped - ID: ${watchId}`, 'color: #DD2C00;');
    } else {
      console.log(`${LOG_PREFIX} Previous watcher cleaned up`);
    }
  }

  logPermission(state: PermissionState) {
    if (!this.shouldLog()) return;
    console.log(`${LOG_PREFIX} Permission status: ${state}`);
  }

  logSalonRecalc(count: number, triggerDistance: number) {
    if (!this.shouldLog()) return;
    console.log(
      `%c${LOG_PREFIX} Recalculating distances for ${count} salons - Movement: ${triggerDistance.toFixed(1)}m`,
      'color: #6200EA;'
    );
  }

  resetCount() {
    this.updateCount = 0;
  }

  getUpdateCount() {
    return this.updateCount;
  }
}

// Singleton instance
export const logger = new Logger();
export default Logger;
