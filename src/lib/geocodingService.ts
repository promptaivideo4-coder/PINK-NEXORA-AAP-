/**
 * Geocoding Service - Provider-Abstracted Layer
 * ===============================================
 * Production-ready geocoding with pluggable providers.
 * 
 * Features:
 * - Address autocomplete (search/suggest)
 * - Forward geocoding (address → coordinates)
 * - Reverse geocoding (coordinates → address)
 * - Provider abstraction (swap providers without UI changes)
 * - Caching layer (memory + localStorage)
 * - Debouncing for autocomplete
 * - Error handling
 * 
 * Usage:
 *   const service = createGeocodingService();
 *   const results = await service.autocomplete("Bandra West");
 *   const coords = await service.forwardGeocode("Mumbai, India");
 *   const address = await service.reverseGeocode(19.0596, 72.8295);
 */

export type GeocodingProvider = 'nominatim' | 'mapbox' | 'google' | 'opencage' | 'here';

export interface GeocodingConfig {
  provider: GeocodingProvider;
  apiKey?: string;
  baseURL?: string;
  language?: string;
  countryBias?: string;
  maxResults?: number;
  /** Bounding box [lngW, latS, lngE, latN] to restrict search area */
  viewbox?: [number, number, number, number];
  /** If true, results are strictly limited to viewbox */
  bounded?: boolean;
  /** Default city for new forms */
  defaultCity?: string;
  /** Default state for new forms */
  defaultState?: string;
  /** Default map center [lat, lng] */
  defaultCenter?: [number, number];
}

export interface GeocodingAddress {
  street?: string;
  houseNumber?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  state?: string;
  stateDistrict?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: GeocodingAddress;
  boundingBox?: [number, number, number, number];
  relevance?: number;
}

export interface AutocompleteResult {
  placeId: string;
  displayName: string;
  address: GeocodingAddress;
  latitude?: number;
  longitude?: number;
}

export interface GeocodingService {
  /** Search for address suggestions (autocomplete) */
  autocomplete(query: string, limit?: number): Promise<AutocompleteResult[]>;
  
  /** Convert address string to coordinates */
  forwardGeocode(address: string): Promise<GeocodingResult | null>;
  
  /** Convert coordinates to address */
  reverseGeocode(latitude: number, longitude: number): Promise<GeocodingAddress | null>;
  
  /** Get current configuration */
  getConfig(): GeocodingConfig;
}

// ===== Cache Layer =====

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class GeocodingCache {
  private memory = new Map<string, { data: any; timestamp: number }>();
  private storageKey = 'nexora-geocoding-cache';
  
  get<T>(key: string): T | null {
    const cached = this.memory.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const all = JSON.parse(stored);
        const entry = all[key];
        if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
          this.memory.set(key, entry);
          return entry.data as T;
        }
      }
    } catch {}
    
    return null;
  }
  
  set(key: string, data: any): void {
    const entry = { data, timestamp: Date.now() };
    this.memory.set(key, entry);
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      const all = stored ? JSON.parse(stored) : {};
      all[key] = entry;
      localStorage.setItem(this.storageKey, JSON.stringify(all));
    } catch {}
  }
}

const cache = new GeocodingCache();

// ===== Inflight Deduplication =====

// Tracks in-flight promises by key. If the same request is already pending,
// we return the existing Promise instead of firing a new HTTP call.
// Entry is deleted in both success and failure branches so subsequent calls
// with the same key will issue a fresh request (not a stuck one).
const inflight = new Map<string, Promise<any>>();

function withInflight<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  
  const promise = factory().finally(() => {
    inflight.delete(key);
  });
  
  inflight.set(key, promise);
  return promise;
}

// ===== Provider Implementations =====

class NominatimProvider {
  private config: GeocodingConfig;
  
  constructor(config: GeocodingConfig) {
    this.config = config;
  }
  
  async autocomplete(query: string, limit = 5): Promise<AutocompleteResult[]> {
    if (!query || query.length < 3) return [];
    
    const cacheKey = `nominatim:autocomplete:${query.toLowerCase()}`;
    const cached = cache.get<AutocompleteResult[]>(cacheKey);
    if (cached) return cached;
    
    return withInflight(cacheKey, async () => {
      try {
        let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1&countrycodes=${this.config.countryBias || 'in'}`;
        
        // Scope to configured bounding box (e.g. Jaipur)
        if (this.config.viewbox && this.config.bounded) {
          const [lngW, latS, lngE, latN] = this.config.viewbox;
          url += `&viewbox=${lngW},${latS},${lngE},${latN}&bounded=1`;
        } else if (this.config.viewbox) {
          const [lngW, latS, lngE, latN] = this.config.viewbox;
          url += `&viewbox=${lngW},${latS},${lngE},${latN}`;
        }
        
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json', 'Accept-Language': this.config.language || 'en' }
        });
        
        if (!res.ok) return [];
        
        const data = await res.json();
        const results: AutocompleteResult[] = data.map((item: any) => ({
          placeId: `nominatim:${item.place_id}`,
          displayName: item.display_name,
          address: this.normalizeAddress(item.address || {}),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
        
        cache.set(cacheKey, results);
        return results;
      } catch {
        return [];
      }
    });
  }
  
  async forwardGeocode(address: string): Promise<GeocodingResult | null> {
    if (!address) return null;
    
    const cacheKey = `nominatim:forward:${address.toLowerCase()}`;
    const cached = cache.get<GeocodingResult>(cacheKey);
    if (cached) return cached;
    
    return withInflight(cacheKey, async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1&countrycodes=${this.config.countryBias || 'in'}`;
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json', 'Accept-Language': this.config.language || 'en' }
        });
        
        if (!res.ok) return null;
        
        const data = await res.json();
        if (!data || data.length === 0) return null;
        
        const item = data[0];
        const result: GeocodingResult = {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          displayName: item.display_name,
          address: this.normalizeAddress(item.address || {}),
          boundingBox: item.boundingbox ? [
            parseFloat(item.boundingbox[0]),
            parseFloat(item.boundingbox[1]),
            parseFloat(item.boundingbox[2]),
            parseFloat(item.boundingbox[3]),
          ] : undefined,
        };
        
        cache.set(cacheKey, result);
        return result;
      } catch {
        return null;
      }
    });
  }
  
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingAddress | null> {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    
    const cacheKey = `nominatim:reverse:${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cached = cache.get<GeocodingAddress>(cacheKey);
    if (cached) return cached;
    
    return withInflight(cacheKey, async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`;
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json', 'Accept-Language': this.config.language || 'en' }
        });
        
        if (!res.ok) return null;
        
        const data = await res.json();
        const address = this.normalizeAddress(data.address || {});
        
        cache.set(cacheKey, address);
        return address;
      } catch {
        return null;
      }
    });
  }
  
  private normalizeAddress(raw: any): GeocodingAddress {
    return {
      street: raw.road,
      houseNumber: raw.house_number,
      suburb: raw.suburb || raw.neighbourhood || raw.quarter,
      city: raw.city || raw.town || raw.village,
      state: raw.state,
      stateDistrict: raw.state_district,
      postcode: raw.postcode,
      country: raw.country,
      countryCode: raw.country_code,
    };
  }
}

// ===== Provider Factory =====

function createProvider(config: GeocodingConfig) {
  switch (config.provider) {
    case 'nominatim':
      return new NominatimProvider(config);
    // case 'mapbox':
    //   return new MapboxProvider(config);
    // case 'google':
    //   return new GoogleProvider(config);
    // case 'opencage':
    //   return new OpenCageProvider(config);
    // case 'here':
    //   return new HereProvider(config);
    default:
      return new NominatimProvider(config);
  }
}

// ===== Service Factory =====

export function createGeocodingService(config: GeocodingConfig = {
  provider: 'nominatim',
  language: 'en',
  countryBias: 'in',
  maxResults: 5,
}): GeocodingService {
  const provider = createProvider(config);
  
  return {
    async autocomplete(query: string, limit?: number): Promise<AutocompleteResult[]> {
      return provider.autocomplete(query, limit || config.maxResults || 5);
    },
    
    async forwardGeocode(address: string): Promise<GeocodingResult | null> {
      return provider.forwardGeocode(address);
    },
    
    async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingAddress | null> {
      return provider.reverseGeocode(latitude, longitude);
    },
    
    getConfig(): GeocodingConfig {
      return config;
    },
  };
}

// ===== Utility: Extract structured address from result =====

export function extractStructuredAddress(result: GeocodingResult): {
  fullAddress: string;
  shopNumber?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
} {
  const addr = result.address;
  
  const parts: string[] = [];
  if (addr.houseNumber) parts.push(addr.houseNumber);
  if (addr.street) parts.push(addr.street);
  if (addr.suburb) parts.push(addr.suburb);
  if (addr.city) parts.push(addr.city);
  if (addr.stateDistrict) parts.push(addr.stateDistrict);
  if (addr.state) parts.push(addr.state);
  if (addr.postcode) parts.push(addr.postcode);
  
  return {
    fullAddress: parts.join(', '),
    shopNumber: addr.houseNumber,
    area: addr.suburb,
    city: addr.city,
    state: addr.state,
    pincode: addr.postcode,
    landmark: addr.street,
  };
}

// ===== Utility: Debounce =====

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
