/**
 * salonServiceArea.ts
 * ===================
 * Salon service-area — SHOP'S SAVED LOCATION is the source of truth.
 *
 * HARD RULE: Salon ka area/city uski APNI saved shop location se aata hai
 * (owner ne Set Shop Location se save kiya). User ke GPS se salon ki location
 * kabhi nahi badalti — user GPS sirf optional "Near Me"/distance ke liye.
 *
 * Ye module sirf helpers deta hai:
 *  - SUPPORTED_JAIPUR_ZONES — owner ke "Set Shop Location" form me zone picker
 *    ke liye reference (Central/East/North/South/West Jaipur).
 *  - normalizeZone() — free-text zone → canonical zone.
 *  - salonAreaLabel() — salon ki saved area/city se display label.
 *  - isJaipurCity() — salon ke apne city field se.
 *
 * NOTE: Project me real Jaipur boundary/geofence (GeoJSON polygon) dataset
 * nahi hai. Isliye strict point-in-polygon filtering nahi ki ja rahi —
 * salon apni saved coordinates + area se hi identify hota hai.
 */

/** Supported Jaipur service-area zones — owner picker reference */
export const SUPPORTED_JAIPUR_ZONES = [
  'Central Jaipur',
  'East Jaipur',
  'North Jaipur',
  'South Jaipur',
  'West Jaipur',
] as const;

export type JaipurZone = (typeof SUPPORTED_JAIPUR_ZONES)[number];

const PLAIN_ZONES = ['Central', 'East', 'North', 'South', 'West'];

/**
 * Normalize a free-text zone into a canonical Jaipur zone.
 * Returns null agar supported zone nahi hai.
 */
export function normalizeZone(zone: string | null | undefined): JaipurZone | null {
  if (!zone) return null;
  const lower = zone.trim().toLowerCase();
  for (let i = 0; i < SUPPORTED_JAIPUR_ZONES.length; i++) {
    const z = SUPPORTED_JAIPUR_ZONES[i];
    const plain = PLAIN_ZONES[i];
    if (lower === z.toLowerCase()) return z;
    if (lower === plain.toLowerCase()) return z;
    if (lower === `${plain.toLowerCase()}-jaipur`) return z;
    if (lower.startsWith(plain.toLowerCase()) && lower.includes('jaipur')) return z;
  }
  return null;
}

/** Salon ka apna city field — 'jaipur' match (case-insensitive) */
export function isJaipurCity(city: string | null | undefined): boolean {
  if (!city) return false;
  return city.toLowerCase().includes('jaipur');
}

/** Salon-like minimal shape */
export interface SalonAreaInfo {
  area?: string | null;
  city?: string | null;
  address?: string | null;
  landmark?: string | null;
  zone?: string | null;
}

/**
 * Display label for a salon's OWN saved location.
 * e.g. "Raja Park, Jaipur" | "Jaipur" | "Address area"
 */
export function salonAreaLabel(s: SalonAreaInfo): string {
  const parts: string[] = [];
  if (s.area && s.area.trim()) parts.push(s.area.trim());
  if (s.city && s.city.trim()) parts.push(s.city.trim());
  return parts.join(', ');
}

/** Full address-ish label: area, city + landmark/address fallback */
export function salonFullLabel(s: SalonAreaInfo): string {
  const base = salonAreaLabel(s);
  if (base) return base;
  if (s.landmark && s.landmark.trim()) return s.landmark.trim();
  if (s.address && s.address.trim()) return s.address.trim();
  return 'Location set by salon';
}

/** Get Directions deep link — salon ke saved coordinates se (no API key) */
export function getDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
