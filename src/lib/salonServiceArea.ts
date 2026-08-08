/**
 * salonServiceArea.ts
 * ===================
 * Location-based salon service-area determination — Jaipur service area.
 *
 * GPS → service area → salon catalog filter (actual salon coordinates se
 * distance logic already handles sorting/grouping — NearbySalonService).
 *
 * IMPORTANT (honesty note — requirement: no invented boundary):
 * Project me Jaipur ka koi real boundary/geofence (GeoJSON polygon) dataset
 * NAHI hai. Isliye strict point-in-polygon filtering NAHI ki ja rahi.
 * Yahan:
 *  - `isJaipurServiceArea()` — reverse geocoding (cached) se city-level hint
 *    milta hai (kis city ka salon catalog load karna hai).
 *  - Actual salon filtering/showing — salon ke apne `city`/`area` fields +
 *    existing GPS+salon-coordinate Haversine distance logic (NearbySalonService).
 *  - Strict boundary check ke liye real Jaipur boundary dataset (GeoJSON)
 *    required hai — wo is project me nahi hai.
 *
 * Supported Jaipur service-area reference (localities/zones):
 *  Central, East, North, South and West Jaipur.
 */

/** Supported Jaipur service-area zones — reference list */
export const SUPPORTED_JAIPUR_ZONES = [
  'Central Jaipur',
  'East Jaipur',
  'North Jaipur',
  'South Jaipur',
  'West Jaipur',
] as const;

export type JaipurZone = (typeof SUPPORTED_JAIPUR_ZONES)[number];

/** Plain zone names bhi accept (Central/East/North/South/West) */
const PLAIN_ZONES = ['Central', 'East', 'North', 'South', 'West'];

/**
 * Normalize a free-text area/zone string into a canonical Jaipur zone.
 * Returns null agar supported zone nahi hai.
 */
export function normalizeZone(area: string | null | undefined): JaipurZone | null {
  if (!area) return null;
  const a = area.trim();
  const lower = a.toLowerCase();

  // "Central Jaipur" / "Central" / "Central-Jaipur" / "central"
  for (let i = 0; i < SUPPORTED_JAIPUR_ZONES.length; i++) {
    const zone = SUPPORTED_JAIPUR_ZONES[i];
    if (lower === zone.toLowerCase()) return zone;
    const plain = PLAIN_ZONES[i];
    if (lower === plain.toLowerCase()) return zone;
    if (lower === `${plain.toLowerCase()}-jaipur`) return zone;
    if (lower.startsWith(plain.toLowerCase()) && lower.includes('jaipur')) return zone;
  }
  return null;
}

/** Normalize a salon city string — 'jaipur' match */
export function isJaipurCity(city: string | null | undefined): boolean {
  if (!city) return false;
  return city.toLowerCase().includes('jaipur');
}

/** Salon service area (city catalog) — sirf naam se boundary nahi */
export interface ServiceArea {
  /** Reverse-geocoded city (hint ke liye) */
  city: string | null;
  /** True when reverse geocode city == Jaipur area → Jaipur catalog load */
  isJaipur: boolean;
  /** Resolved locality/zone (agar supported zone me hai) */
  zone: JaipurZone | null;
  /** True agar locality supported Jaipur zone me hai */
  isSupportedZone: boolean;
}

/**
 * Determine service area from reverse-geocoded place.
 * NOTE: ye city-level HINT hai (kis catalog load karna hai) —
 * GPS boundary/polygon nahi. Strict filtering distance logic se hoti hai.
 */
export function resolveServiceArea(place: {
  city?: string | null;
  locality?: string | null;
} | null): ServiceArea {
  if (!place) {
    return { city: null, isJaipur: false, zone: null, isSupportedZone: false };
  }
  const city = place.city || null;
  const isJaipur = isJaipurCity(city) || isJaipurCity(place.locality);
  const zone = normalizeZone(place.locality);
  return {
    city,
    isJaipur,
    zone,
    isSupportedZone: zone !== null,
  };
}

/** Jaipur salons filter — salon ke apne city field se (GPS boundary nahi) */
export function filterJaipurSalons<T extends { city?: string | null }>(salons: T[]): T[] {
  return salons.filter((s) => isJaipurCity(s.city));
}
