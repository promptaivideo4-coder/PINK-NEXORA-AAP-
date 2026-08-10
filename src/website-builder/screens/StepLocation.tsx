/**
 * StepLocation.tsx — Interactive Map with Leaflet + OpenStreetMap
 * NO API KEY NEEDED — 100% free
 *
 * Features:
 *  - Click on map to set pin location
 *  - Drag pin to adjust
 *  - Browser Geolocation (free, no API) to center map
 *  - Lat/Lng auto-saved
 *  - Manual address fields (no geocoding API)
 *  - Preview pane shows same map
 */

import React, { useState, useEffect, useRef } from 'react';
import { SalonData, SalonAddress, SalonOpeningHours, DaySchedule } from '../types';
import PreviewPane from '../components/PreviewPane';
import {
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Eye,
  Navigation,
  CheckCircle2,
  Crosshair,
  Copy,
  Check,
  Building2,
} from 'lucide-react';

// Import Leaflet (no API key needed)
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  data: SalonData;
  setData: React.Dispatch<React.SetStateAction<SalonData>>;
  onNext: () => void;
  onPrev: () => void;
  onSave?: (msg?: string) => void;
}

// India center coordinates (default)
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const JAIPUR_CENTER: [number, number] = [26.9124, 75.7873];

// All Indian states
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const DEFAULT_HOURS: SalonOpeningHours = {
  monday: { open: true, startTime: '10:00', endTime: '20:00' },
  tuesday: { open: true, startTime: '10:00', endTime: '20:00' },
  wednesday: { open: true, startTime: '10:00', endTime: '20:00' },
  thursday: { open: true, startTime: '10:00', endTime: '20:00' },
  friday: { open: true, startTime: '10:00', endTime: '21:00' },
  saturday: { open: true, startTime: '10:00', endTime: '21:00' },
  sunday: { open: false, startTime: '10:00', endTime: '18:00' },
};

export default function StepLocation({ data, setData, onNext, onPrev, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Leaflet map refs
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const previewMapRef = useRef<L.Map | null>(null);
  const previewMarkerRef = useRef<L.Marker | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const address: SalonAddress = data.address || {
    fullAddress: '',
    area: '',
    city: '',
    state: '',
    pinCode: '',
    landmark: '',
  };

  const hours: SalonOpeningHours = data.openingHours || DEFAULT_HOURS;

  // Current lat/lng from address (or default)
  const currentLatLng: [number, number] = (address.latitude && address.longitude)
    ? [address.latitude, address.longitude]
    : INDIA_CENTER;

  /* ----------------------- Map initialization (main map) ----------------------- */
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy old map if exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: currentLatLng,
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    // FREE OpenStreetMap tiles — NO API KEY
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Create a custom pink pin icon
    const pinkIcon = L.divIcon({
      className: 'custom-pin-icon',
      html: `<div style="
        width: 36px; height: 36px;
        background: #ac0053;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          width: 12px; height: 12px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    // Add draggable marker
    const marker = L.marker(currentLatLng, {
      icon: pinkIcon,
      draggable: true,
    }).addTo(map);

    // Click on map → move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateLatLang(lat, lng);
    });

    // Drag end → save new position
    marker.on('dragend', (e: L.DragEndEvent) => {
      const { lat, lng } = (e.target as L.Marker).getLatLng();
      updateLatLang(lat, lng);
    });

    markerRef.current = marker;
    mapRef.current = map;

    // Invalidate size after a short delay (for proper rendering)
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /* ----------------------- Preview map initialization ----------------------- */
  useEffect(() => {
    if (!previewContainerRef.current || activeTab !== 'edit') return;

    if (previewMapRef.current) {
      previewMapRef.current.remove();
      previewMapRef.current = null;
    }

    const map = L.map(previewContainerRef.current, {
      center: currentLatLng,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const pinkIcon = L.divIcon({
      className: 'custom-pin-icon',
      html: `<div style="
        width: 32px; height: 32px;
        background: #ac0053;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          width: 10px; height: 10px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker(currentLatLng, { icon: pinkIcon }).addTo(map);
    previewMarkerRef.current = marker;
    previewMapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, address.city, address.state]);

  // Update marker position when lat/lng changes from geolocation
  useEffect(() => {
    if (mapRef.current && markerRef.current && address.latitude && address.longitude) {
      const newLatLng: [number, number] = [address.latitude, address.longitude];
      markerRef.current.setLatLng(newLatLng);
      mapRef.current.setView(newLatLng, 14);
    }
    if (previewMapRef.current && previewMarkerRef.current && address.latitude && address.longitude) {
      const newLatLng: [number, number] = [address.latitude, address.longitude];
      previewMarkerRef.current.setLatLng(newLatLng);
      previewMapRef.current.setView(newLatLng, 14);
    }
  }, [address.latitude, address.longitude]);

  /* ----------------------- Helpers ----------------------- */
  const updateLatLang = (lat: number, lng: number) => {
    setData(prev => ({
      ...prev,
      address: { ...(prev.address || { fullAddress: '', area: '', city: '', state: '', pinCode: '' }), latitude: lat, longitude: lng } as SalonAddress,
    }));
    setLocationStatus('success');
    onSave?.('Location pin set');
    setTimeout(() => setLocationStatus('idle'), 2000);
  };

  const updateAddress = (fields: Partial<SalonAddress>) => {
    const updated = { ...address, ...fields };
    setData(prev => ({ ...prev, address: updated }));
    onSave?.('Address updated');
  };

  const updateDayHours = (day: keyof SalonOpeningHours, fields: Partial<DaySchedule>) => {
    const updated = { ...hours, [day]: { ...hours[day], ...fields } };
    setData(prev => ({ ...prev, openingHours: updated }));
    onSave?.('Hours updated');
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          updateLatLang(latitude, longitude);
          updateAddress({
            fullAddress: `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
          });
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          setLocationStatus('error');
          setTimeout(() => setLocationStatus('idle'), 3000);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const copyMondayToAll = () => {
    const mon = hours.monday;
    const updated: SalonOpeningHours = {
      monday: { ...mon },
      tuesday: { ...mon },
      wednesday: { ...mon },
      thursday: { ...mon },
      friday: { ...mon },
      saturday: { ...mon },
      sunday: { ...mon },
    };
    setData(prev => ({ ...prev, openingHours: updated }));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
    onSave?.('Copied Monday schedule');
  };

  const daysList: { key: keyof SalonOpeningHours; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const generateGoogleMapsLink = () => {
    if (address.latitude && address.longitude) {
      return `https://www.google.com/maps?q=${address.latitude},${address.longitude}`;
    }
    const addr = encodeURIComponent(address.fullAddress || `${address.area} ${address.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${addr}`;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#f9f9f9]">
      {/* Mobile tab switcher */}
      <div className="md:hidden flex border-b border-gray-200 bg-white sticky top-0 z-20">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === 'edit'
              ? 'border-[#ac0053] text-[#ac0053] bg-[#ffd9e1]/20'
              : 'border-transparent text-gray-500'
          }`}
        >
          Edit Location & Hours
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'preview'
              ? 'border-[#ac0053] text-[#ac0053] bg-[#ffd9e1]/20'
              : 'border-transparent text-gray-500'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Live Preview
        </button>
      </div>

      {/* LEFT: Form (55%) */}
      <div className={`w-full md:w-[55%] h-full overflow-y-auto px-4 md:px-10 py-8 flex flex-col space-y-8 ${
        activeTab === 'preview' ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ac0053]">
            <MapPin className="w-4 h-4" /> STEP 08 • LOCATION & OPENING HOURS
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1c1c]">Where is your salon?</h1>
          <p className="text-sm text-[#5f5e5e]">
            Click on the map to set your pin location, or use GPS. Add your address and opening hours.
          </p>
        </div>

        {/* ============ INTERACTIVE MAP SECTION ============ */}
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#1a1c1c] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#ac0053]" /> Set Pin Location
            </h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              locationStatus === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : locationStatus === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-50 text-gray-400'
            }`}>
              {locationStatus === 'success' && '✓ Location Set'}
              {locationStatus === 'error' && '✗ Location Failed'}
              {locationStatus === 'idle' && 'Click map or use GPS'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#ac0053] bg-[#ffd9e1]/40 hover:bg-[#ffd9e1]/70 font-semibold text-xs transition-colors border border-[#ffd9e1] disabled:opacity-50"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use My Current Location'}</span>
            </button>

            {address.latitude && address.longitude && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateGoogleMapsLink());
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Maps Link</span>
              </button>
            )}
          </div>

          {/* INTERACTIVE LEAFLET MAP */}
          <div
            ref={mapContainerRef}
            className="relative w-full h-72 rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner"
            style={{ zIndex: 1 }}
          />

          {/* Instructions below map */}
          <div className="bg-[#ffd9e1]/20 border border-[#ffd9e1] rounded-xl p-3 text-xs text-[#8f0044] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> How to set your location:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[#8f0044]/80">
              <li><strong>Click anywhere</strong> on the map to drop a pin</li>
              <li><strong>Drag the pin</strong> to adjust your exact location</li>
              <li><strong>Use GPS button</strong> to auto-detect your current location</li>
              <li>Lat/Lng are saved automatically with your address</li>
            </ul>
          </div>

          {/* Coordinates display */}
          {address.latitude && address.longitude && (
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-[#ac0053]" />
              <span>Lat: {address.latitude.toFixed(6)}, Lng: {address.longitude.toFixed(6)}</span>
            </div>
          )}
        </div>

        {/* ============ ADDRESS SECTION ============ */}
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#1a1c1c] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#ac0053]" /> Business Address
            </h2>
          </div>

          {/* Full address */}
          <div>
            <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Full Address</label>
            <textarea
              value={address.fullAddress}
              onChange={e => updateAddress({ fullAddress: e.target.value })}
              placeholder="e.g. Shop 8, Vaishali Nagar, Jaipur, Rajasthan 302021"
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#1a1c1c] focus:border-[#ac0053] focus:ring-2 focus:ring-[#ffd9e1] focus:bg-white outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Granular fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Shop / Flat No.</label>
              <input
                type="text"
                value={address.shopNumber || ''}
                onChange={e => updateAddress({ shopNumber: e.target.value })}
                placeholder="e.g. Shop 14, Ground Floor"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Area / Locality</label>
              <input
                type="text"
                value={address.area}
                onChange={e => updateAddress({ area: e.target.value })}
                placeholder="e.g. Vaishali Nagar"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">City</label>
              <input
                type="text"
                value={address.city}
                onChange={e => updateAddress({ city: e.target.value })}
                placeholder="e.g. Jaipur, Mumbai, Delhi"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">State</label>
              <select
                value={address.state}
                onChange={e => updateAddress({ state: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#1a1c1c]">PIN Code (6 digits)</label>
                {address.pinCode && (
                  <span className={`text-[10px] font-bold ${/^\d{6}$/.test(address.pinCode) ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {/^\d{6}$/.test(address.pinCode) ? '✓ Valid' : 'Enter 6 digits'}
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={6}
                value={address.pinCode || ''}
                onChange={e => updateAddress({ pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="302021"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none tracking-widest font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Landmark (Optional)</label>
              <input
                type="text"
                value={address.landmark || ''}
                onChange={e => updateAddress({ landmark: e.target.value })}
                placeholder="e.g. Opposite Metro Station"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* ============ OPENING HOURS ============ */}
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs mb-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
            <h2 className="text-lg font-bold text-[#1a1c1c] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#ac0053]" /> Opening Hours
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={copyMondayToAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffd9e1]/50 text-[#ac0053] text-xs font-semibold hover:bg-[#ffd9e1] transition-colors border border-[#ffd9e1]"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSuccess ? 'Copied!' : 'Copy Monday to all'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {daysList.map(({ key, label }) => {
              const day = hours[key];
              return (
                <div key={key} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  day.open ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.open}
                      onChange={e => updateDayHours(key, { open: e.target.checked })}
                      className="accent-[#ac0053] w-4 h-4 rounded"
                    />
                    <span className={`text-sm font-semibold ${day.open ? 'text-[#1a1c1c]' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </label>

                  {day.open ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={e => updateDayHours(key, { startTime: e.target.value })}
                        className="w-28 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-[#ac0053]"
                      />
                      <span className="text-gray-400 text-xs">to</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={e => updateDayHours(key, { endTime: e.target.value })}
                        className="w-28 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:border-[#ac0053]"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 italic">Closed</span>
                  )}
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

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-[#eeeeee] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 md:hidden">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-4">
          <button onClick={onPrev} className="text-xs font-bold text-[#5f5e5e] flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-gray-200">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={onNext} className="bg-[#ac0053] text-white text-xs font-bold flex items-center gap-2 px-8 py-3 rounded-xl">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
