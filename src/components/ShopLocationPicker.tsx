/**
 * ShopLocationPicker.tsx
 * ======================
 * Bidirectional Shop Location picker with address autocomplete + draggable map pin.
 *
 * FLOW:
 *   Address autocomplete → Geocode → Map pin moves
 *   OR
 *   Map pin drag → Reverse geocode → Address fields update
 *   → Confirm Location → "Save Your Shop Location?" popup → Save
 *
 * Accuracy is WARNING-only — kabhi save block nahi karta.
 * Pin drag/click → location_source = 'manual'.
 * GPS → location_source = 'gps'.
 * Owner explicit "Save Shop Location" par hi confirmed=true save hota hai.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin,
  LocateFixed,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Navigation as NavIcon,
  Check,
  Search,
  X,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '../contexts/LocationContext';
import { reverseGeocodePlace } from '../lib/reverseGeocode';
import { SUPPORTED_JAIPUR_ZONES, normalizeZone } from '../lib/salonServiceArea';
import {
  createGeocodingService,
  extractStructuredAddress,
  debounce,
  type AutocompleteResult,
  type GeocodingResult,
} from '../lib/geocodingService';
import { GEOCODING_CONFIG, JAIPUR_VIEWBOX } from '../lib/geocodingConfig';

export interface ConfirmedShopLocation {
  latitude: number;
  longitude: number;
  fullAddress?: string;
  address: string;
  city: string;
  area: string;
  zone: string;
  landmark: string;
  pincode: string;
  accuracyM: number | null;
  source: 'gps' | 'manual';
}

export interface ShopLocationSaveInput extends ConfirmedShopLocation {
  /** Owner explicit confirm — save ke liye zaroori */
  confirmed: boolean;
  confirmedAt: string;
}

interface Props {
  initialLat?: number | null;
  initialLng?: number | null;
  /** Location CONFIRMED hone par callback — lat/lng + details (registration) */
  onConfirm: (loc: ConfirmedShopLocation) => void;
  /** Settings: async save callback — ise diya to internal "Save Your Shop Location?" popup use hota hai */
  onSave?: (loc: ShopLocationSaveInput) => Promise<{ ok: boolean; error?: string | null }>;
  /** Successful save ke baad (modal close / refresh) */
  onSaved?: () => void;
  /** Already-confirmed location (prefill) */
  confirmed?: ConfirmedShopLocation | null;
}

const DEFAULT_CENTER: [number, number] = GEOCODING_CONFIG.defaultCenter || [26.9124, 75.7873];
const DEFAULT_CITY = GEOCODING_CONFIG.defaultCity || 'Jaipur';
const DEFAULT_STATE = GEOCODING_CONFIG.defaultState || 'Rajasthan';

const markerIcon = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;background:#e6007e;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35);"><div style="width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:7px;left:7px;"></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

const GOOD_ACCURACY_M = 100;

function isValidLatLng(lat: number | null, lng: number | null): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

export default function ShopLocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onSave,
  onSaved,
  confirmed,
}: Props) {
  const { currentLocation, lastKnownFix, requestLocation } = useLocation();

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // Geocoding service instance (provider-abstracted)
  const geocodingService = useRef(createGeocodingService(GEOCODING_CONFIG));

  // Address autocomplete state
  const [addressInput, setAddressInput] = useState(confirmed?.fullAddress || '');
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Location state — default to Jaipur/Rajasthan for new forms
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [address, setAddress] = useState(confirmed?.address || '');
  const [city, setCity] = useState(confirmed?.city || DEFAULT_CITY);
  const [area, setArea] = useState(confirmed?.area || '');
  const [zone, setZone] = useState(confirmed?.zone || '');
  const [landmark, setLandmark] = useState(confirmed?.landmark || '');
  const [pincode, setPincode] = useState(confirmed?.pincode || '');
  const [geocoding, setGeocoding] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsWarn, setGpsWarn] = useState(false);
  const [source, setSource] = useState<'gps' | 'manual'>(
    initialLat && initialLng ? 'manual' : 'manual'
  );

  // Confirm + save state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Race-condition protection: track the latest pin position
  // Reverse geocode responses for older positions must be ignored
  const latestPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const reverseGeocodeInflightRef = useRef<string | null>(null);

  // Debounced geocode function using service layer
  // RACE-CONDITION PROTECTION: track the query this call was made for
  // so stale responses from earlier queries are discarded.
  const latestQueryRef = useRef<string>('');
  const debouncedGeocode = useRef(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        latestQueryRef.current = '';
        return;
      }
      latestQueryRef.current = query;
      setIsGeocoding(true);
      try {
        const results = await geocodingService.current.autocomplete(query, 5);
        // Only apply results if the user hasn't typed more since we started
        if (latestQueryRef.current === query) {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        }
        // else: stale response, discard
      } catch {
        if (latestQueryRef.current === query) {
          setSuggestions([]);
        }
      } finally {
        setIsGeocoding(false);
      }
    }, 300)
  ).current;

  // Address input handler
  const handleAddressInput = useCallback(
    (value: string) => {
      setAddressInput(value);
      debouncedGeocode(value);
    },
    [debouncedGeocode]
  );

  // Select address from suggestions
  const handleSelectSuggestion = useCallback(
    async (result: AutocompleteResult) => {
      setAddressInput(result.displayName);
      setSuggestions([]);
      setShowSuggestions(false);

      let newLat = result.latitude;
      let newLng = result.longitude;

      // If autocomplete didn't include coordinates, forward geocode
      if (newLat === undefined || newLng === undefined) {
        const geoResult: GeocodingResult | null = await geocodingService.current.forwardGeocode(result.displayName);
        if (geoResult) {
          newLat = geoResult.latitude;
          newLng = geoResult.longitude;
        }
      }

      if (newLat === undefined || newLng === undefined) {
        // Cannot determine coordinates - allow manual selection
        return;
      }

      setLat(Number(newLat.toFixed(6)));
      setLng(Number(newLng.toFixed(6)));
      setSource('manual');

      if (leafletRef.current && markerRef.current) {
        leafletRef.current.setView([newLat, newLng], 16);
        markerRef.current.setLatLng([newLat, newLng]);
      }

      // Extract structured address
      // CRITICAL: We set the main `address` field to the FULL address
      // (this is what gets saved to Supabase as location_address)
      // Individual fields are set separately for the UI inputs
      if (result.address) {
        const addr = result.address;
        const fullParts: string[] = [];
        if (addr.houseNumber) fullParts.push(addr.houseNumber);
        if (addr.street) fullParts.push(addr.street);
        if (addr.suburb) fullParts.push(addr.suburb);
        if (addr.city) fullParts.push(addr.city);
        if (addr.stateDistrict) fullParts.push(addr.stateDistrict);
        if (addr.state) fullParts.push(addr.state);
        if (addr.postcode) fullParts.push(addr.postcode);
        const fullAddress = fullParts.join(', ');
        
        // The main address field = full address (saved to Supabase)
        if (fullAddress) setAddress(fullAddress);
        // Individual fields for UI editing
        if (addr.suburb) setArea(addr.suburb);
        if (addr.city) setCity(addr.city);
        if (addr.state) setZone(addr.state);
        if (addr.postcode) setPincode(addr.postcode);
        if (addr.street) setLandmark(addr.street);
      }

      setSavedMsg(null);
      setSaveError(null);
    },
    []
  );

  // Init map once — draggable pin
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      DEFAULT_CENTER,
      12
    );
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Restrict map panning/zooming to Jaipur area when no saved location
    if (JAIPUR_VIEWBOX && lat === null && lng === null) {
      const [lngW, latS, lngE, latN] = JAIPUR_VIEWBOX;
      map.setMaxBounds([[latS, lngW], [latN, lngE]]);
      map.fitBounds([[latS, lngW], [latN, lngE]]);
    }

    const start: [number, number] =
      lat !== null && lng !== null ? [lat, lng] : DEFAULT_CENTER;
    const marker = L.marker(start, { icon: markerIcon, draggable: true }).addTo(map);
    markerRef.current = marker;

    // Drag release → coords update + source=manual + reverse geocode
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      setLat(Number(p.lat.toFixed(6)));
      setLng(Number(p.lng.toFixed(6)));
      setSource('manual');
      reverseGeocodeAt(p.lat, p.lng);
    });

    // Map click → pin moves + coords update + source=manual
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLat(Number(e.latlng.lat.toFixed(6)));
      setLng(Number(e.latlng.lng.toFixed(6)));
      setSource('manual');
      reverseGeocodeAt(e.latlng.lat, e.latlng.lng);
    });

    leafletRef.current = map;

    // If initial coords exist, move map + marker
    if (lat !== null && lng !== null) {
      setTimeout(() => {
        map.setView([lat, lng], 15);
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      }, 100);
    }

    return () => {
      map.remove();
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial coords → marker + map move (reopen par saved pin exact wahi)
  useEffect(() => {
    if (lat !== null && lng !== null && leafletRef.current && markerRef.current) {
      leafletRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Reverse geocode — auto-fill details using service layer
  // RACE-CONDITION PROTECTION:
  //   - latestPositionRef tracks the pin's current position
  //   - reverseGeocodeInflightRef tracks the in-flight request's key
  //   - Responses for stale positions are IGNORED
  async function reverseGeocodeAt(latitude: number, longitude: number) {
    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const myPosition = { lat: latitude, lng: longitude };
    latestPositionRef.current = myPosition;
    reverseGeocodeInflightRef.current = key;

    setGeocoding(true);
    try {
      const address = await geocodingService.current.reverseGeocode(latitude, longitude);

      // Check if position changed while we were fetching
      const cur = latestPositionRef.current;
      if (!cur || cur.lat !== latitude || cur.lng !== longitude) {
        // Stale response — pin has moved, ignore this result
        return;
      }

      if (address) {
        if (address.city) setCity((c) => c || address.city!);
        if (address.suburb) setArea((a) => a || address.suburb!);
        if (address.state) {
          const norm = normalizeZone(address.state);
          if (norm) setZone((z) => z || norm);
        }
        if (address.postcode) setPincode((p) => p || address.postcode!);
        if (address.street) setLandmark((l) => l || address.street!);
      } else {
        // Fallback to existing BigDataCloud reverse geocoding
        const place = await reverseGeocodePlace(latitude, longitude);
        // Stale check again after fallback
        const cur2 = latestPositionRef.current;
        if (cur2 && (cur2.lat !== latitude || cur2.lng !== longitude)) return;
        if (place) {
          if (place.city) setCity((c) => c || place.city!);
          if (place.locality) setArea((a) => a || place.locality!);
          if (place.principalSubdivision) {
            const norm = normalizeZone(place.principalSubdivision);
            if (norm) setZone((z) => z || norm);
          }
        }
      }
    } catch {
      /* manual edit possible */
    } finally {
      setGeocoding(false);
    }
  }

  // Apply a GPS fix to form + map — source='gps', accuracy WARNING only
  function applyFix(latitude: number, longitude: number, accuracy: number) {
    setGpsAccuracy(accuracy);
    setGpsWarn(accuracy > GOOD_ACCURACY_M);
    setSource('gps');
    setLat(Number(latitude.toFixed(6)));
    setLng(Number(longitude.toFixed(6)));
    if (leafletRef.current && markerRef.current) {
      leafletRef.current.setView([latitude, longitude], 15);
      markerRef.current.setLatLng([latitude, longitude]);
    }
    reverseGeocodeAt(latitude, longitude);
  }

  // Use current device location — existing centralized system
  function useDeviceLocation() {
    setGpsWarn(false);
    setGpsAccuracy(null);
    requestLocation(); // watcher start (async — fix aane par watch effect set karega)
    const loc = currentLocation || lastKnownFix;
    if (loc) {
      applyFix(loc.latitude, loc.longitude, loc.accuracy);
    }
  }

  // Watch — device location update par auto-fill (sirf jab koi pin nahi laga)
  useEffect(() => {
    const loc = currentLocation || lastKnownFix;
    if (loc && lat === null && lng === null) {
      applyFix(loc.latitude, loc.longitude, loc.accuracy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, lastKnownFix]);

  function buildConfirmedLocation(): ConfirmedShopLocation {
    return {
      latitude: lat as number,
      longitude: lng as number,
      fullAddress: address.trim(),
      address: address.trim(),
      city: city.trim(),
      area: area.trim(),
      zone: normalizeZone(zone) ?? zone.trim(),
      landmark: landmark.trim(),
      pincode: pincode.trim(),
      accuracyM: gpsAccuracy,
      source,
    };
  }

  // STEP: Confirm Location — validate → popup (Settings) ya onConfirm (registration)
  function handleConfirmLocation() {
    if (!isValidLatLng(lat, lng)) return; // accuracy NEVER blocks
    if (onSave) {
      // Settings: internal "Save Your Shop Location?" popup
      setSaveError(null);
      setSavedMsg(null);
      setConfirmOpen(true);
    } else {
      // Registration: parent ko confirmed location dete hain (no save yet)
      setGpsWarn(false);
      onConfirm(buildConfirmedLocation());
    }
  }

  // STEP: Save Shop Location — ONLY yahan se Supabase persist
  async function handleSaveShopLocation() {
    if (!onSave) return;
    if (saving) return; // DUPLICATE-SAVE PREVENTION
    if (!isValidLatLng(lat, lng)) {
      setSaveError('Invalid coordinates. Please set your location on the map.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await onSave({
        ...buildConfirmedLocation(),
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      });
      if (res.ok) {
        setConfirmOpen(false);
        setSavedMsg('✓ Shop location saved successfully');
        onSaved?.();
      } else {
        setSaveError(res.error || 'Failed to save shop location');
      }
    } catch (e) {
      setSaveError(String((e as Error)?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const hasPin = isValidLatLng(lat, lng);
  const coordsLabel = hasPin ? `${lat!.toFixed(6)}, ${lng!.toFixed(6)}` : '';

  return (
    <div className="flex flex-col gap-3">
      {/* ===== ADDRESS AUTOCOMPLETE ===== */}
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Business Address
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={addressInput}
            onChange={(e) => handleAddressInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search address (e.g., Bandra West, Mumbai)"
            className="w-full h-10 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none transition-all"
          />
          {isGeocoding && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ac0053] animate-spin" />
          )}
          {addressInput && !isGeocoding && (
            <button
              onClick={() => {
                setAddressInput('');
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onMouseDown={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="text-xs font-medium text-gray-900 line-clamp-2">
                  {suggestion.displayName}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== MAP WITH DRAGGABLE PIN ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div ref={mapRef} className="w-full h-60 bg-gray-100" />
        <div className="p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={useDeviceLocation}
              type="button"
              className="flex-1 bg-[#ac0053] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <LocateFixed className="w-3.5 h-3.5" /> Use Current Location
            </button>
            <button
              onClick={() => {
                if (leafletRef.current)
                  leafletRef.current.setView([26.9124, 75.7873], 13);
              }}
              type="button"
              className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-gray-200"
            >
              <NavIcon className="w-3.5 h-3.5" /> Reset Map
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-600">
            {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span className="font-mono text-xs">
              {hasPin
                ? coordsLabel
                : 'Pin nahi laga — address search karo ya map par click karo'}
            </span>
            {hasPin && (
              <span className="ml-auto text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> pinned
              </span>
            )}
          </div>
          {hasPin && (
            <span className="text-[10px] text-gray-500">
              Source: <b>{source === 'gps' ? 'GPS' : 'Manual'}</b>
              {gpsAccuracy !== null ? ` • Accuracy: ${Math.round(gpsAccuracy)}m` : ''}
            </span>
          )}
        </div>
      </div>

      {/* ===== GPS ACCURACY WARNING ===== */}
      {gpsWarn && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800">
            ⚠ GPS accuracy is approximately {gpsAccuracy !== null ? Math.round(gpsAccuracy) : '?'}m.
            You can drag the pin to the exact shop location.
          </div>
        </div>
      )}

      {/* ===== SAVED SUCCESS MESSAGE ===== */}
      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[12px] font-bold text-emerald-700">{savedMsg}</span>
        </div>
      )}

      {/* ===== LOCATION DETAILS ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Location Details
        </h3>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-600">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Shop 12, Main Bazar"
            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">Area / Locality</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Raja Park"
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Jaipur"
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none transition-all"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">Zone (optional)</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none transition-all"
            >
              <option value="">Select zone</option>
              {SUPPORTED_JAIPUR_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="302004"
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none transition-all"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-600">Landmark (optional)</label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Near City Park"
            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] outline-none transition-all"
          />
        </div>
      </div>

      {/* ===== CONFIRM LOCATION BUTTON ===== */}
      <button
        type="button"
        onClick={handleConfirmLocation}
        disabled={!hasPin}
        className="w-full bg-[#ac0053] text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MapPin className="w-4 h-4" /> Confirm Location
      </button>
      {!hasPin && (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 text-center">
          Shop location is required. Please set your exact shop location on the map to continue.
        </p>
      )}

      {/* ===== SAVE YOUR SHOP LOCATION? POPUP ===== */}
      {confirmOpen &&
        onSave &&
        createPortal(
          <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#ac0053]/10 text-[#ac0053] flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Save Your Shop Location?
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                This location will be used as your official shop location on your salon profile,
                map and directions.
              </p>

              {/* Location preview */}
              <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="font-mono text-[11px] text-gray-700">📍 {coordsLabel}</div>
                {address && (
                  <div className="text-[11px] text-gray-600">
                    <b>Address:</b> {address}
                  </div>
                )}
                {city && (
                  <div className="text-[11px] text-gray-600">
                    <b>City:</b> {city}
                  </div>
                )}
                {area && (
                  <div className="text-[11px] text-gray-600">
                    <b>Area:</b> {area}
                  </div>
                )}
                {pincode && (
                  <div className="text-[11px] text-gray-600">
                    <b>Pincode:</b> {pincode}
                  </div>
                )}
                <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-200">
                  Source: {source === 'gps' ? 'GPS' : 'Manual'}
                  {gpsAccuracy && ` • Accuracy: ${Math.round(gpsAccuracy)}m`}
                </div>
              </div>

              {/* Error message */}
              {saveError && (
                <div className="mt-2 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {saveError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => {
                    setConfirmOpen(false);
                    setSaveError(null);
                  }}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveShopLocation}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#ac0053] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 hover:bg-[#ba005b]"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {saving ? 'Saving...' : 'Save Shop Location'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
