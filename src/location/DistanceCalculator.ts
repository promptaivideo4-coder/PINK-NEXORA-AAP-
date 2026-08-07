/**
 * DistanceCalculator.ts
 * Pure Haversine formula - NO external APIs
 * Earth radius 6371000 meters as per spec
 */

import { EARTH_RADIUS_METERS } from './constants';

class DistanceCalculator {
  private readonly R = EARTH_RADIUS_METERS;

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Validate coordinates
   */
  isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      isFinite(lat) &&
      isFinite(lng)
    );
  }

  /**
   * Haversine distance in meters - CLIENT SIDE ONLY
   * Formula:
   * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
   * c = 2 ⋅ atan2(√a, √(1−a))
   * d = R ⋅ c
   */
  calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    if (!this.isValidCoordinate(lat1, lon1) || !this.isValidCoordinate(lat2, lon2)) {
      return Infinity;
    }

    const φ1 = this.toRad(lat1);
    const φ2 = this.toRad(lat2);
    const Δφ = this.toRad(lat2 - lat1);
    const Δλ = this.toRad(lon2 - lon1);

    const sinΔφ = Math.sin(Δφ / 2);
    const sinΔλ = Math.sin(Δλ / 2);

    const a =
      sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = this.R * c;
    return d;
  }

  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return this.calculateDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
  }

  /**
   * Batch calculation - optimized for thousands of salons
   */
  calculateBatch(
    userLat: number,
    userLng: number,
    points: Array<{ latitude: number; longitude: number }>
  ): number[] {
    if (!this.isValidCoordinate(userLat, userLng)) return points.map(() => Infinity);

    const φ1 = this.toRad(userLat);
    const cosφ1 = Math.cos(φ1);
    const userLngRad = this.toRad(userLng);

    return points.map((p) => {
      if (!this.isValidCoordinate(p.latitude, p.longitude)) return Infinity;

      const φ2 = this.toRad(p.latitude);
      const Δφ = this.toRad(p.latitude - userLat);
      const Δλ = this.toRad(p.longitude - userLng);

      const sinΔφ = Math.sin(Δφ / 2);
      const sinΔλ = Math.sin(Δλ / 2);

      const a =
        sinΔφ * sinΔφ + cosφ1 * Math.cos(φ2) * sinΔλ * sinΔλ;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return this.R * c;
    });
  }

  formatDistance(meters: number): string {
    if (!isFinite(meters) || meters === Infinity) return 'N/A';
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters / 1000)} km`;
  }

  /**
   * Check if movement > threshold
   */
  hasMovedSignificantly(
    prevLat: number,
    prevLng: number,
    newLat: number,
    newLng: number,
    thresholdMeters: number
  ): boolean {
    const dist = this.calculateDistanceMeters(prevLat, prevLng, newLat, newLng);
    return dist >= thresholdMeters;
  }
}

export const distanceCalculator = new DistanceCalculator();
export default DistanceCalculator;
