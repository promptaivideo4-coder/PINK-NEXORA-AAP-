/**
 * reverseGeocode.ts
 * =================
 * Minimal production-safe reverse geocoding — lat/lng → city/locality name.
 *
 * Service: BigDataCloud `reverse-geocode-client`
 *  - Free, NO API key, CORS-enabled, designed for client-side use.
 *  - Returns: city / locality / principalSubdivision.
 *
 * Caching (taaki har GPS update / render par baar-baar call na ho):
 *  - In-memory Map (session)
 *  - localStorage (persist, TTL 24h) — key = rounded lat/lng (~3 decimals ≈ 110m)
 *  - Concurrent request dedupe — ek hi in-flight fetch per coordinate pair.
 *
 * Graceful: network/API fail hone par `null` return hota hai —
 * caller "Location detected" par fallback kar leta hai.
 */

const GEO_CACHE_KEY = 'nexora-geo-city-cache';
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const GEO_API = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

interface CacheEntry {
  key: string;
  city: string | null;
  at: number;
}

/* ---------------- caches ---------------- */
const memoryCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

function cacheKey(lat: number, lng: number): string {
  // ~3 decimals ≈ 110m precision — minor GPS drift par cache hit rahta hai
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function loadPersisted(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persist(entries: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable — ignore */
  }
}

/* ---------------- public ---------------- */

/** Reverse-geocoded place info (cached) */
export interface GeoPlace {
  city: string | null;
  locality: string | null;
  principalSubdivision: string | null;
  principalSubdivisionCode: string | null;
  countryName: string | null;
}

interface PlaceEntry extends CacheEntry {
  place: GeoPlace | null;
}

const memoryPlaceCache = new Map<string, PlaceEntry>();
const inflightPlace = new Map<string, Promise<GeoPlace | null>>();

/**
 * Resolve full place info (city/locality/subdivision) — cached, deduped.
 * Returns `null` on any failure — caller fallback.
 */
export async function reverseGeocodePlace(
  lat: number,
  lng: number,
): Promise<GeoPlace | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  const key = cacheKey(lat, lng);
  const now = Date.now();

  const mem = memoryPlaceCache.get(key);
  if (mem && now - mem.at < GEO_CACHE_TTL_MS) return mem.place;

  const persisted = loadPersisted();
  const pEntry = persisted[key] as PlaceEntry | undefined;
  if (pEntry && pEntry.place && now - pEntry.at < GEO_CACHE_TTL_MS) {
    memoryPlaceCache.set(key, pEntry);
    return pEntry.place;
  }

  const existing = inflightPlace.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<GeoPlace | null> => {
    try {
      const res = await fetch(
        `${GEO_API}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`,
        { method: 'GET' },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        city?: string | null;
        locality?: string | null;
        principalSubdivision?: string | null;
        principalSubdivisionCode?: string | null;
        countryName?: string | null;
      };
      const place: GeoPlace = {
        city: (data.city && data.city.trim()) || null,
        locality: (data.locality && data.locality.trim()) || null,
        principalSubdivision: (data.principalSubdivision && data.principalSubdivision.trim()) || null,
        principalSubdivisionCode: (data.principalSubdivisionCode && data.principalSubdivisionCode.trim()) || null,
        countryName: (data.countryName && data.countryName.trim()) || null,
      };

      const entry: PlaceEntry = { key, city: place.city, at: Date.now(), place };
      memoryPlaceCache.set(key, entry);
      const next = { ...persisted, [key]: entry };
      persist(next);

      return place;
    } catch {
      return null;
    }
  })();

  inflightPlace.set(key, promise);
  try {
    return await promise;
  } finally {
    inflightPlace.delete(key);
  }
}

/**
 * Resolve city/locality name for given coordinates.
 * Returns `null` on any failure (network, API, empty result) — caller fallback.
 */
export async function reverseGeocodeCity(
  lat: number,
  lng: number,
): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  const key = cacheKey(lat, lng);
  const now = Date.now();

  // 1. In-memory cache (fresh)
  const mem = memoryCache.get(key);
  if (mem && now - mem.at < GEO_CACHE_TTL_MS) return mem.city;

  // 2. localStorage cache (fresh)
  const persisted = loadPersisted();
  const pEntry = persisted[key];
  if (pEntry && now - pEntry.at < GEO_CACHE_TTL_MS) {
    memoryCache.set(key, pEntry);
    return pEntry.city;
  }

  // 3. Concurrent request dedupe
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<string | null> => {
    try {
      const res = await fetch(
        `${GEO_API}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`,
        { method: 'GET' },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        city?: string | null;
        locality?: string | null;
        principalSubdivision?: string | null;
      };
      // Priority: city → locality → principalSubdivision
      const city =
        (data.city && data.city.trim()) ||
        (data.locality && data.locality.trim()) ||
        (data.principalSubdivision && data.principalSubdivision.trim()) ||
        null;

      const entry: CacheEntry = { key, city, at: Date.now() };
      memoryCache.set(key, entry);
      const next = { ...persisted, [key]: entry };
      persist(next);

      return city;
    } catch {
      return null;
    }
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}
