/**
 * StepLocation.tsx — SIMPLE BIDIRECTIONAL Location System
 * 
 * Flow 1: Business Address → Map Pin (FORWARD GEOCODE)
 *   User fills Shop No, Area, City, State, Pincode
 *   → System finds lat/lng automatically
 *   → Pin appears on map
 * 
 * Flow 2: Map Pin → Business Address (REVERSE GEOCODE)
 *   User clicks/drags pin on map
 *   → Address fields auto-fill
 * 
 * Both use OpenStreetMap Nominatim — 100% FREE, NO API KEY
 * 
 * Final saved location = this is where shop search happens
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SalonData, SalonAddress, SalonOpeningHours, DaySchedule } from '../types';
import PreviewPane from '../components/PreviewPane';
import {
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Check,
  Building2,
  Loader2,
  Copy,
  Crosshair,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  data: SalonData;
  setData: React.Dispatch<React.SetStateAction<SalonData>>;
  onNext: () => void;
  onPrev: () => void;
  onSave?: (msg?: string) => void;
}

// ====== Nominatim (FREE forward/reverse geocoding) ======
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/** Convert address text → lat/lng (FORWARD geocoding) */
async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}

/** Convert lat/lng → address fields (REVERSE geocoding) */
async function reverseGeocode(lat: number, lng: number) {
  try {
    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {}
  return null;
}

const DEFAULT_HOURS: SalonOpeningHours = {
  monday: { open: true, startTime: '10:00', endTime: '20:00' },
  tuesday: { open: true, startTime: '10:00', endTime: '20:00' },
  wednesday: { open: true, startTime: '10:00', endTime: '20:00' },
  thursday: { open: true, startTime: '10:00', endTime: '20:00' },
  friday: { open: true, startTime: '10:00', endTime: '21:00' },
  saturday: { open: true, startTime: '10:00', endTime: '21:00' },
  sunday: { open: false, startTime: '10:00', endTime: '18:00' },
};

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu and Kashmir','Ladakh','Puducherry','Chandigarh',
];

// Capitalize first letter
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

export default function StepLocation({ data, setData, onNext, onPrev, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error' | 'searching'>('idle');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  const markerObj = useRef<L.Marker | null>(null);
  const previewMap = useRef<L.Map | null>(null);
  const previewMarker = useRef<L.Marker | null>(null);

  const address: SalonAddress = data.address || {
    fullAddress: '', shopNumber: '', area: '', city: '', state: '', pinCode: '', landmark: '',
  };
  const hours = data.openingHours || DEFAULT_HOURS;

  // Build address string for forward geocoding
  const buildAddressQuery = () => {
    const parts: string[] = [];
    if (address.shopNumber) parts.push(address.shopNumber);
    if (address.landmark) parts.push(address.landmark);
    if (address.area) parts.push(address.area);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pinCode) parts.push(address.pinCode);
    return parts.join(', ');
  };

  // ====== Forward geocode: Address → Map Pin ======
  const handleFindOnMap = useCallback(async () => {
    const query = buildAddressQuery();
    if (!query.trim()) {
      setLocationStatus('error');
      setTimeout(() => setLocationStatus('idle'), 2000);
      return;
    }
    setGeocoding(true);
    setLocationStatus('searching');
    
    const result = await geocodeAddress(query);
    if (result) {
      const lat = Number(result.lat.toFixed(6));
      const lng = Number(result.lng.toFixed(6));
      
      // Save coordinates
      setData(prev => ({
        ...prev,
        address: {
          ...(prev.address || { shopNumber: '', area: '', city: '', state: '', pinCode: '' }),
          latitude: lat,
          longitude: lng,
        } as SalonAddress,
      }));
      
      // Move map + marker
      if (mapObj.current && markerObj.current) {
        markerObj.current.setLatLng([result.lat, result.lng]);
        mapObj.current.setView([result.lat, result.lng], 16);
        setTimeout(() => mapObj.current?.invalidateSize(), 100);
      }
      if (previewMap.current && previewMarker.current) {
        previewMarker.current.setLatLng([result.lat, result.lng]);
        previewMap.current.setView([result.lat, result.lng], 16);
        setTimeout(() => previewMap.current?.invalidateSize(), 100);
      }
      
      setLocationStatus('success');
      onSave?.('Location found from address');
    } else {
      setLocationStatus('error');
    }
    setGeocoding(false);
    setTimeout(() => setLocationStatus(s => s === 'searching' ? 'idle' : s), 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.shopNumber, address.area, address.city, address.state, address.pinCode, address.landmark]);

  // ====== Reverse geocode: Map Pin → Address ======
  const fillAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    const result = await reverseGeocode(lat, lng);
    if (!result || !result.address) return;
    
    const a = result.address;
    const fullParts: string[] = [];
    if (a.house_number) fullParts.push(a.house_number);
    if (a.road) fullParts.push(a.road);
    if (a.suburb || a.neighbourhood || a.quarter) fullParts.push(a.suburb || a.neighbourhood || a.quarter);
    if (a.city || a.town || a.village) fullParts.push(a.city || a.town || a.village);
    if (a.state_district) fullParts.push(a.state_district);
    if (a.state) fullParts.push(a.state);
    if (a.postcode) fullParts.push(a.postcode);
    const fullAddress = fullParts.join(', ');

    const newData = {
      ...(data.address || { shopNumber: '', area: '', city: '', state: '', pinCode: '' }),
      fullAddress: fullAddress || data.address?.fullAddress || '',
      shopNumber: a.house_number || data.address?.shopNumber || '',
      area: cap(a.suburb || a.neighbourhood || a.quarter || '') || data.address?.area || '',
      city: cap(a.city || a.town || a.village || '') || data.address?.city || '',
      state: a.state || data.address?.state || '',
      pinCode: a.postcode || data.address?.pinCode || '',
      latitude: lat,
      longitude: lng,
    } as SalonAddress;

    setData(prev => ({ ...prev, address: newData }));
    setLocationStatus('success');
    onSave?.('Address found from map');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== Use device GPS ======
  const handleUseGPS = useCallback(() => {
    setIsLocating(true);
    setLocationStatus('searching');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const lat6 = Number(lat.toFixed(6));
          const lng6 = Number(lng.toFixed(6));
          
          setData(prev => ({
            ...prev,
            address: {
              ...(prev.address || { shopNumber: '', area: '', city: '', state: '', pinCode: '' }),
              latitude: lat6,
              longitude: lng6,
            } as SalonAddress,
          }));
          
          if (mapObj.current && markerObj.current) {
            markerObj.current.setLatLng([lat, lng]);
            mapObj.current.setView([lat, lng], 16);
            setTimeout(() => mapObj.current?.invalidateSize(), 100);
          }
          if (previewMap.current && previewMarker.current) {
            previewMarker.current.setLatLng([lat, lng]);
            previewMap.current.setView([lat, lng], 16);
            setTimeout(() => previewMap.current?.invalidateSize(), 100);
          }
          
          // Reverse geocode to fill address
          await fillAddressFromCoords(lat, lng);
          setLocationStatus('success');
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          setLocationStatus('error');
          setTimeout(() => setLocationStatus('idle'), 3000);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
      setIsLocating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== Manual address update ======
  const updateAddress = (fields: Partial<SalonAddress>) => {
    const updated = { ...address, ...fields } as SalonAddress;
    setData(prev => ({ ...prev, address: updated }));
    onSave?.('Address updated');
  };

  const updateDayHours = (day: keyof SalonOpeningHours, fields: Partial<DaySchedule>) => {
    const updated = { ...hours, [day]: { ...hours[day], ...fields } };
    setData(prev => ({ ...prev, openingHours: updated }));
    onSave?.('Hours updated');
  };

  const copyMondayToAll = () => {
    const mon = hours.monday;
    const updated: SalonOpeningHours = {
      monday: { ...mon }, tuesday: { ...mon }, wednesday: { ...mon },
      thursday: { ...mon }, friday: { ...mon }, saturday: { ...mon },
      sunday: { ...mon },
    };
    setData(prev => ({ ...prev, openingHours: updated }));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
    onSave?.('Copied Monday schedule');
  };

  // ====== Init MAIN map ======
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;
    
    const startLat = address.latitude || 26.9124;
    const startLng = address.longitude || 75.7873;
    
    const map = L.map(mapRef.current, { zoomControl: true }).setView([startLat, startLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap',
    }).addTo(map);

    const pinkIcon = L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;background:#ac0053;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;">
        <div style="width:12px;height:12px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div>
      </div>`,
      iconSize: [36, 36], iconAnchor: [18, 36],
    });

    const marker = L.marker([startLat, startLng], { icon: pinkIcon, draggable: true }).addTo(map);
    markerObj.current = marker;

    // Click on map → move pin + reverse geocode
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      fillAddressFromCoords(e.latlng.lat, e.latlng.lng);
    });

    // Drag pin → reverse geocode
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      fillAddressFromCoords(p.lat, p.lng);
    });

    mapObj.current = map;
    setTimeout(() => map.invalidateSize(), 300);
    
    return () => { if (map) map.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ====== Init PREVIEW map ======
  useEffect(() => {
    if (!previewContainerRef.current || previewMap.current || activeTab !== 'edit') return;
    
    const lat = address.latitude || 26.9124;
    const lng = address.longitude || 75.7873;
    
    const map = L.map(previewContainerRef.current, {
      zoomControl: false, dragging: false, scrollWheelZoom: false,
    }).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const pinkIcon = L.divIcon({
      className: '',
      html: `<div style="width:30px;height:30px;background:#ac0053;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;">
        <div style="width:10px;height:10px;background:#fff;border-radius:50%;transform:rotate(45deg);"></div>
      </div>`,
      iconSize: [30, 30], iconAnchor: [15, 30],
    });

    const marker = L.marker([lat, lng], { icon: pinkIcon }).addTo(map);
    previewMarker.current = marker;
    previewMap.current = map;
    setTimeout(() => map.invalidateSize(), 300);

    return () => { if (map) map.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ====== Sync marker when lat/lng change ======
  useEffect(() => {
    if (address.latitude && address.longitude) {
      const pos: [number, number] = [address.latitude, address.longitude];
      if (mapObj.current && markerObj.current) {
        markerObj.current.setLatLng(pos);
        mapObj.current.setView(pos, 15);
      }
      if (previewMap.current && previewMarker.current) {
        previewMarker.current.setLatLng(pos);
        previewMap.current.setView(pos, 15);
      }
    }
  }, [address.latitude, address.longitude]);

  const hasPin = !!(address.latitude && address.longitude);
  const coordsLabel = hasPin ? `${address.latitude!.toFixed(6)}, ${address.longitude!.toFixed(6)}` : '';
  
  const daysList: { key: keyof SalonOpeningHours; label: string }[] = [
    { key: 'monday', label: 'Monday' }, { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' }, { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' }, { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#f9f9f9]">
      {/* Mobile tab switcher */}
      <div className="md:hidden flex border-b border-gray-200 bg-white sticky top-0 z-20">
        <button onClick={() => setActiveTab('edit')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 ${activeTab === 'edit' ? 'border-[#ac0053] text-[#ac0053]' : 'border-transparent text-gray-500'}`}>
          Edit Location & Hours
        </button>
        <button onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 ${activeTab === 'preview' ? 'border-[#ac0053] text-[#ac0053]' : 'border-transparent text-gray-500'}`}>
          <Eye className="w-3.5 h-3.5" /> Live Preview
        </button>
      </div>

      {/* LEFT: Form (55%) */}
      <div className={`w-full md:w-[55%] h-full overflow-y-auto px-4 md:px-10 py-8 flex flex-col space-y-8 ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ac0053]">
            <MapPin className="w-4 h-4" /> STEP 08 • LOCATION & OPENING HOURS
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1c1c]">Where is your salon?</h1>
          <p className="text-sm text-[#5f5e5e]">
            Fill your business address — pin appears automatically on map. Or click the map to set pin.
          </p>
        </div>

        {/* ====== BUSINESS ADDRESS SECTION ====== */}
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#1a1c1c] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#ac0053]" /> Business Address
            </h2>
          </div>

          {/* Full Address — auto-filled, editable */}
          <div>
            <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Full Address</label>
            <textarea
              value={address.fullAddress}
              onChange={e => updateAddress({ fullAddress: e.target.value })}
              placeholder="Auto-filled when you set the pin, or type manually"
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#1a1c1c] focus:border-[#ac0053] focus:ring-2 focus:ring-[#ffd9e1] focus:bg-white outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Shop No + Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Shop / Flat No.</label>
              <input type="text" value={address.shopNumber || ''}
                onChange={e => updateAddress({ shopNumber: e.target.value })}
                placeholder="e.g. Shop 118"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Area / Locality</label>
              <input type="text" value={address.area}
                onChange={e => updateAddress({ area: e.target.value })}
                placeholder="e.g. Bandra West"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none" />
            </div>
          </div>

          {/* City + State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">City</label>
              <input type="text" value={address.city}
                onChange={e => updateAddress({ city: e.target.value })}
                placeholder="e.g. Jaipur"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">State</label>
              <select value={address.state}
                onChange={e => updateAddress({ state: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Pincode + Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#1a1c1c]">PIN Code (6 digits)</label>
                {address.pinCode && (
                  <span className={`text-[10px] font-bold ${/^\d{6}$/.test(address.pinCode) ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {/^\d{6}$/.test(address.pinCode) ? '✓ Valid' : 'Enter 6 digits'}
                  </span>
                )}
              </div>
              <input type="text" maxLength={6} value={address.pinCode || ''}
                onChange={e => updateAddress({ pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="302021"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none tracking-widest font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Landmark (Optional)</label>
              <input type="text" value={address.landmark || ''}
                onChange={e => updateAddress({ landmark: e.target.value })}
                placeholder="e.g. Near Shani Mandir"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none" />
            </div>
          </div>

          {/* ====== ACTION BUTTONS ====== */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            {/* Find on Map — address → pin */}
            <button
              onClick={handleFindOnMap}
              disabled={geocoding || !buildAddressQuery().trim()}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#ac0053] text-white hover:bg-[#ba005b] disabled:opacity-50 transition-colors"
            >
              {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              {geocoding ? 'Finding...' : 'Find on Map'}
            </button>
            
            {/* Use GPS — device → pin */}
            <button
              onClick={handleUseGPS}
              disabled={isLocating}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#ac0053] bg-[#ffd9e1]/40 hover:bg-[#ffd9e1]/70 border border-[#ffd9e1] disabled:opacity-50 transition-colors"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Locating...' : 'Use My GPS'}
            </button>
          </div>

          {/* Status message */}
          {locationStatus === 'success' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-4 h-4" /> Location set successfully
            </div>
          )}
          {locationStatus === 'searching' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Finding location...
            </div>
          )}
          {locationStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <MapPin className="w-4 h-4" /> Location not found — try different address or click on map
            </div>
          )}

          {/* Coordinates display */}
          {hasPin && (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-gray-600">📍 {coordsLabel}</span>
              <button onClick={() => { navigator.clipboard.writeText(coordsLabel); setCopiedSuccess(true); setTimeout(() => setCopiedSuccess(false), 1500); }}
                className="text-[10px] font-bold text-[#ac0053] flex items-center gap-1">
                {copiedSuccess ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          )}
        </div>

        {/* ====== MAP ====== */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Map Preview</h3>
          <div ref={mapRef} className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner" />
          <p className="text-[11px] text-gray-400">Click anywhere on map or drag pin to adjust. Address auto-fills from pin.</p>
        </div>

        {/* ====== OPENING HOURS ====== */}
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs mb-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
            <h2 className="text-lg font-bold text-[#1a1c1c] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#ac0053]" /> Opening Hours
            </h2>
            <button onClick={copyMondayToAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffd9e1]/50 text-[#ac0053] text-xs font-semibold hover:bg-[#ffd9e1] transition-colors border border-[#ffd9e1]">
              {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSuccess ? 'Copied!' : 'Copy Monday to all'}
            </button>
          </div>

          <div className="space-y-2">
            {daysList.map(({ key, label }) => {
              const day = hours[key];
              return (
                <div key={key} className={`flex items-center justify-between p-3 rounded-xl border ${day.open ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={day.open}
                      onChange={e => updateDayHours(key, { open: e.target.checked })}
                      className="accent-[#ac0053] w-4 h-4 rounded" />
                    <span className={`text-sm font-semibold ${day.open ? 'text-[#1a1c1c]' : 'text-gray-400'}`}>{label}</span>
                  </label>
                  {day.open ? (
                    <div className="flex items-center gap-2">
                      <input type="time" value={day.startTime}
                        onChange={e => updateDayHours(key, { startTime: e.target.value })}
                        className="w-28 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-[#ac0053]" />
                      <span className="text-gray-400 text-xs">to</span>
                      <input type="time" value={day.endTime}
                        onChange={e => updateDayHours(key, { endTime: e.target.value })}
                        className="w-28 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-[#ac0053]" />
                    </div>
                  ) : <span className="text-xs font-semibold text-gray-400 italic">Closed</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Live Preview (45%) */}
      <div className={`w-full md:w-[45%] h-full sticky top-0 ${activeTab === 'edit' ? 'hidden md:block' : 'block'}`}>
        <PreviewPane data={data} step={7} />
      </div>
    </div>
  );
}
