/**
 * Geocoding Configuration
 * ========================
 * Central configuration for geocoding provider.
 * Change provider here to switch all geocoding behavior.
 * 
 * Available Providers:
 * - 'nominatim': Free, no API key, OpenStreetMap (current)
 * - 'mapbox': Paid, requires API key, production-grade
 * - 'google': Paid, requires API key, most accurate
 * - 'opencage': Paid, requires API key, good coverage
 * - 'here': Paid, requires API key, enterprise-grade
 * 
 * To switch provider:
 * 1. Change PROVIDER below
 * 2. Add API key to environment variables
 * 3. Redeploy
 */

import type { GeocodingConfig, GeocodingProvider } from './geocodingService';

// ===== Current Provider Configuration =====

export const PROVIDER: GeocodingProvider = 'nominatim';

// Jaipur bounding box (approximate) for scoped autocomplete
// Format: [left, bottom, right, top] = [lngW, latS, lngE, latN]
export const JAIPUR_VIEWBOX: [number, number, number, number] = [
  75.55, 26.70,   // southwest corner (lng, lat)
  76.10, 27.15,   // northeast corner (lng, lat)
];

export const GEOCODING_CONFIG: GeocodingConfig = {
  provider: PROVIDER,
  
  // API Key (required for paid providers)
  apiKey: import.meta.env.VITE_GEOCODING_API_KEY,
  
  // Base URL (optional, for custom deployments)
  baseURL: import.meta.env.VITE_GEOCODING_BASE_URL,
  
  // Language for results
  language: 'en',
  
  // Country bias (ISO country code)
  countryBias: 'in',
  
  // Restrict autocomplete to Jaipur bounding box
  viewbox: JAIPUR_VIEWBOX,
  
  // When true, search results are strictly limited to viewbox area
  bounded: true,
  
  // Max results per query
  maxResults: 5,
  
  // Default location values (for new forms)
  defaultCity: 'Jaipur',
  defaultState: 'Rajasthan',
  defaultCenter: [26.9124, 75.7873],
};

// ===== Provider-Specific Notes =====

/*
NOMINATIM (OpenStreetMap):
  ✅ Free, no API key
  ✅ CORS-enabled for browser use
  ✅ Good for development and testing
  ⚠️ Rate limited (1 request/second)
  ️ Not for heavy production use
   No API key needed

MAPBOX:
  ✅ Production-ready
  ✅ Fast, reliable
  ✅ Excellent autocomplete
  ⚠️ Paid ($4 per 1000 requests)
  🔑 API key required
  📝 Sign up: https://www.mapbox.com/
  🔑 Set VITE_GEOCODING_API_KEY=your_mapbox_key

GOOGLE:
  ✅ Most accurate
  ✅ Best autocomplete
  ✅ Global coverage
  ⚠️ Paid ($5 per 1000 requests)
  ⚠️ Requires Google Cloud project
  🔑 API key required
  📝 Sign up: https://developers.google.com/maps
  🔑 Set VITE_GEOCODING_API_KEY=your_google_key

OPENCAGE:
  ✅ Good balance of cost/quality
  ✅ Simple pricing ($50/month for 10k requests)
  🔑 API key required
  📝 Sign up: https://opencagedata.com/
  🔑 Set VITE_GEOCODING_API_KEY=your_opencage_key

HERE:
  ✅ Enterprise-grade
  ✅ Excellent for logistics
  ⚠️ More complex pricing
  🔑 API key required
  📝 Sign up: https://developer.here.com/
  🔑 Set VITE_GEOCODING_API_KEY=your_here_key
*/
