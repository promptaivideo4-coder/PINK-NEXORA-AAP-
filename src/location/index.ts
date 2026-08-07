/**
 * Nexora PWA - Native GPS Location System
 * Main barrel export - production ready
 * 
 * ONLY Browser Geolocation API - No external dependencies
 */

export * from './types';
export * from './constants';

// Core modules
export { logger } from './Logger';
export { errorHandler } from './ErrorHandler';
export { permissionManager } from './PermissionManager';
export { distanceCalculator } from './DistanceCalculator';
export { locationValidator } from './LocationValidator';
export { gpsWatcher } from './GPSWatcher';
export { locationStore } from './LocationStore';
export { salonSorter } from './SalonSorter';
export { nearbySalonService } from './NearbySalonService';
export { locationService } from './LocationService';

// Classes for testing / custom instances
export { default as Logger } from './Logger';
export { default as ErrorHandler } from './ErrorHandler';
export { default as PermissionManager } from './PermissionManager';
export { default as DistanceCalculator } from './DistanceCalculator';
export { default as LocationValidator } from './LocationValidator';
export { default as GPSWatcher } from './GPSWatcher';
export { default as LocationStore } from './LocationStore';
export { default as SalonSorter } from './SalonSorter';
export { default as NearbySalonService } from './NearbySalonService';
export { default as LocationService } from './LocationService';

// Re-export singleton as default for easy import
import { locationService } from './LocationService';
export default locationService;
