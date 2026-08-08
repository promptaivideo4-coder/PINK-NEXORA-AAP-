import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { fetchMyShop, updateShopLocation } from '../lib/shopRepository';
import ShopLocationPicker, { ConfirmedShopLocation } from '../components/ShopLocationPicker';
import { 
  Palette, 
  Sliders, 
  Globe, 
  Bell, 
  Shield, 
  FileText, 
  RefreshCcw,
  LogOut, 
  ChevronRight, 
  ExternalLink,
  X,
  Check,
  Moon,
  Sun,
  Laptop,
  Smartphone,
  Download,
  Users,
  AlertCircle,
  Sparkles,
  MapPin,
  Edit3,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { clearOwnerSessionData } from '../utils/storage';
import { requestNotificationPermission } from '../utils/notifications';

export default function Settings({ navigate }: NavigationProps) {
  const { language, setLanguage, t } = useLanguage();
  const { systemTheme, setSystemTheme, activeTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // ---- Shop Location section ----
  const [shopLoc, setShopLoc] = useState<{
    address: string | null;
    city: string | null;
    area: string | null;
    pincode: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<ConfirmedShopLocation | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);

  // Load owner's saved shop location (canonical) — Settings open hone par
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (!cancelled) {
          setShopLoc({
            address: shop?.address ?? null,
            city: shop?.city ?? null,
            area: shop?.area ?? null,
            pincode: shop?.pincode ?? null,
            latitude: typeof shop?.latitude === 'number' ? shop.latitude : null,
            longitude: typeof shop?.longitude === 'number' ? shop.longitude : null,
          });
        }
      } catch {
        if (!cancelled) setShopLoc(null);
      } finally {
        if (!cancelled) setLocLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const locationSet = !!shopLoc && typeof shopLoc.latitude === 'number' && typeof shopLoc.longitude === 'number' && Number.isFinite(shopLoc.latitude) && Number.isFinite(shopLoc.longitude);

  const handleEditLocation = () => {
    setPendingLocation(null);
    setConfirmOpen(false);
    setEditModalOpen(true);
  };

  const handleLocationConfirmed = (loc: ConfirmedShopLocation) => {
    // Owner ne nayi location confirm ki — ab confirmation dialog
    setPendingLocation(loc);
    setEditModalOpen(false);
    setConfirmOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!pendingLocation) return;
    setSavingLoc(true);
    try {
      const res = await updateShopLocation(supabase, {
        latitude: pendingLocation.latitude,
        longitude: pendingLocation.longitude,
        address: pendingLocation.address || null,
        city: pendingLocation.city || null,
        area: pendingLocation.area || null,
        zone: pendingLocation.zone || null,
        landmark: pendingLocation.landmark || null,
        pincode: pendingLocation.pincode || null,
      });
      if (res.ok) {
        // Immediately reflect on Settings (salon map marker/directions bhi isi se update)
        setShopLoc({
          address: pendingLocation.address || null,
          city: pendingLocation.city || null,
          area: pendingLocation.area || null,
          pincode: pendingLocation.pincode || null,
          latitude: pendingLocation.latitude,
          longitude: pendingLocation.longitude,
        });
        setConfirmOpen(false);
        setPendingLocation(null);
        showToast('Shop location updated successfully.');
      } else {
        showToast(res.error || 'Failed to update shop location');
      }
    } catch (e) {
      showToast(String((e as Error)?.message ?? e));
    } finally {
      setSavingLoc(false);
    }
  };

  React.useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);
    return () => window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
  }, []);

  React.useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      if (!isSupabaseConfigured()) {
        setIsSupabaseConnected(false);
        return;
      }
      try {
        const { error } = await supabase.from('services').select('id').limit(1);
        // A missing table means the connection is valid; any other API error is not.
        setIsSupabaseConnected(!error || error.code === '42P01');
      } catch {
        setIsSupabaseConnected(false);
      }
    };
    void checkConnection();
  }, []);

  const languages = [
    { code: 'en', name: 'English', native: 'English (US)' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setSystemTheme(newTheme);
    showToast(`App theme set to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`);
  };

  const handleToggleNotifications = async () => {
    const nextState = !notificationsEnabled;
    if (nextState) {
      const perm = await requestNotificationPermission();
      if (perm === 'denied') {
        showToast('Notification permission blocked in browser settings');
        setNotificationsEnabled(false);
        return;
      }
    }
    setNotificationsEnabled(nextState);
    showToast(nextState ? 'Push notifications enabled' : 'Push notifications disabled');
  };

  const handleSelectLanguage = (langCode: any) => {
    setLanguage(langCode);
    setIsLanguageModalOpen(false);
    const langName = languages.find(l => l.code === langCode)?.name || langCode;
    showToast(`Language changed to ${langName}`);
  };

  const selectedLanguageName = languages.find(l => l.code === language)?.name || 'English';

  return (
    <Layout currentScreen="settings" navigate={navigate} title="Nexora Salonos" showBack={false}>
      <div id="settings-container" className="px-4 py-6 max-w-md mx-auto w-full space-y-6">
        
        {/* Page Title Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">{t('settings')}</h2>
          <p className="text-xs text-on-surface-variant font-medium">{t('manage_preferences')}</p>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">

          {/* Shop Location Section — owner's canonical saved location */}
          <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest/80 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-shadow hover:shadow-[0px_8px_30px_rgba(0,0,0,0.06)] duration-300">
            <div className="p-5 border-b border-surface-container-highest/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-on-surface">Shop Location</h3>
                <p className="text-[11px] text-on-surface-variant">
                  {locLoading
                    ? 'Loading saved location...'
                    : locationSet
                      ? 'Location set'
                      : 'Location missing'}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                locLoading ? 'bg-surface-variant text-on-surface-variant'
                : locationSet ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
              }`}>
                {locLoading ? '...' : locationSet ? '📍 Location set' : '⚠️ Location missing'}
              </span>
            </div>

            {/* Current shop location details */}
            <div className="p-5 space-y-2">
              {locLoading ? (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : shopLoc ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-semibold text-on-surface-variant w-16 shrink-0">Address</span>
                    <span className="text-xs font-medium text-on-surface">{shopLoc.address || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-semibold text-on-surface-variant w-16 shrink-0">City</span>
                    <span className="text-xs font-medium text-on-surface">{shopLoc.city || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-semibold text-on-surface-variant w-16 shrink-0">Area</span>
                    <span className="text-xs font-medium text-on-surface">{shopLoc.area || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-semibold text-on-surface-variant w-16 shrink-0">Pincode</span>
                    <span className="text-xs font-medium text-on-surface">{shopLoc.pincode || '—'}</span>
                  </div>
                  {locationSet && (
                    <div className="bg-surface-container-low rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-on-surface-variant">
                      📍 {shopLoc.latitude?.toFixed(6)}, {shopLoc.longitude?.toFixed(6)}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-on-surface-variant py-1">Unable to load shop location.</p>
              )}

              {/* Edit Location */}
              <button
                onClick={handleEditLocation}
                disabled={locLoading}
                className="w-full mt-2 h-11 bg-primary/10 border border-primary/30 text-primary rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Edit3 className="w-4 h-4" /> Edit Location
              </button>
              <p className="text-[10px] text-on-surface-variant">
                Saved lat/lng is canonical — salon map marker + Get Directions isi se update honge.
              </p>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest/80 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-shadow hover:shadow-[0px_8px_30px_rgba(0,0,0,0.06)] duration-300">
            <div className="px-6 py-4 border-b border-surface-container-highest/60 bg-surface-bright/50 flex items-center gap-2.5">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">{t('appearance')}</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">{t('theme')}</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">{t('theme_desc')}</p>
                </div>

                <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/30 self-start sm:self-auto">
                  <button 
                    onClick={() => handleThemeChange('light')}
                    className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
                      systemTheme === 'light' 
                        ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>{t('light')}</span>
                  </button>

                  <button 
                    onClick={() => handleThemeChange('dark')}
                    className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
                      systemTheme === 'dark' 
                        ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>{t('dark')}</span>
                  </button>

                  <button 
                    onClick={() => handleThemeChange('system')}
                    className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
                      systemTheme === 'system' 
                        ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>{t('system')}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-container-highest/60 flex items-center justify-between group cursor-pointer" onClick={() => navigate('theme-selection')}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${activeTheme.primaryColor}15`, color: activeTheme.primaryColor }}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Brand Style & Colors</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Currently using <span className="font-bold" style={{ color: activeTheme.primaryColor }}>{activeTheme.name}</span> identity</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>
            </div>
          </section>

          {/* App Settings Group */}
          <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest/80 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-shadow hover:shadow-[0px_8px_30px_rgba(0,0,0,0.06)] duration-300">
            <div className="px-6 py-4 border-b border-surface-container-highest/60 bg-surface-bright/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-on-surface">{t('app_settings')}</h3>
              </div>
              
              {/* Connection Status Badge */}
              <div className="flex items-center gap-2">
                {isStandalone ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Installed</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => navigate('install-app')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Web Version</span>
                    <Download className="w-2.5 h-2.5 ml-0.5" />
                  </button>
                )}
                
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  isSupabaseConnected === true 
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                    : isSupabaseConnected === false 
                      ? 'bg-error/10 text-error border-error/20'
                      : 'bg-surface-container text-on-surface-variant border-outline-variant/30 animate-pulse'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isSupabaseConnected === true ? 'bg-emerald-500' : isSupabaseConnected === false ? 'bg-error' : 'bg-on-surface-variant/40'
                  }`} />
                  {isSupabaseConnected === true ? t('connected') : isSupabaseConnected === false ? t('disconnected') : t('checking')}
                </div>
              </div>
            </div>

            <div className="divide-y divide-surface-container-highest/60">
              
              {/* Language Selection */}
              <div 
                onClick={() => setIsLanguageModalOpen(true)}
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{t('language')}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{selectedLanguageName}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>

              {/* Notifications Toggle */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">{t('push_notifications')}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t('notifications_desc')}</p>
                  </div>
                </div>

                {/* Animated Switch Button */}
                <button 
                  onClick={handleToggleNotifications}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center ${
                    notificationsEnabled ? 'bg-primary-container justify-end' : 'bg-surface-container-high justify-start'
                  }`}
                >
                  <motion.div 
                    layout 
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white shadow-xs"
                  />
                </button>
              </div>

              {/* Install PWA App */}
              <div 
                onClick={() => navigate('install-app')}
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-surface-container-highest/60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary-container shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{t('install_app')}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t('install_app_desc')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>

              {/* App Update Interstitial */}
              <div 
                onClick={() => navigate('app-update')}
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-surface-container-highest/60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{t('check_updates')}</h4>
                      <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[10px] font-extrabold rounded-full">v2.5.0</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t('check_updates_desc')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>

              {/* Staff & Team Management */}
              <div 
                onClick={() => navigate('staff')}
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-surface-container-highest/60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary-container shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{t('staff_management')}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t('staff_management_desc')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>

              {/* Server Error Screen */}
              <div 
                onClick={() => navigate('server-error')}
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Server Error Interstitial</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Preview system connection error and retry state</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>

            </div>
          </section>

          {/* Legal Group */}
          <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest/80 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-shadow hover:shadow-[0px_8px_30px_rgba(0,0,0,0.06)] duration-300">
            <div className="px-6 py-4 border-b border-surface-container-highest/60 bg-surface-bright/50 flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-on-surface">Policies & Legal</h3>
            </div>

            <div className="divide-y divide-surface-container-highest/60">
              <button 
                onClick={() => navigate('cancellation-refund-policy')}
                className="w-full p-6 flex items-center justify-between group hover:bg-surface-container-low/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <RefreshCcw className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Cancellation & Refund Policy</h4>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </button>

              <button 
                onClick={() => setActiveLegalModal('privacy')}
                className="w-full p-6 flex items-center justify-between group hover:bg-surface-container-low/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <Shield className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{t('privacy_policy')}</h4>
                </div>
                <ExternalLink className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
              </button>

              <button 
                onClick={() => setActiveLegalModal('terms')}
                className="w-full p-6 flex items-center justify-between group hover:bg-surface-container-low/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <FileText className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{t('terms_of_service')}</h4>
                </div>
                <ExternalLink className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
              </button>
            </div>
          </section>

          {/* Logout Action */}
          <div className="pt-2 space-y-3">
            <button 
              onClick={async () => {
                clearOwnerSessionData();
                await supabase.auth.signOut();
                navigate('welcome');
              }}
              className="w-full py-4 rounded-2xl bg-error/10 text-error font-bold text-sm flex items-center justify-center gap-2 hover:bg-error/20 transition-colors active:scale-[0.98] duration-200 border border-error/20 shadow-xs"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('logout')}</span>
            </button>

            <p className="text-center text-xs font-semibold text-on-surface-variant/70">
              Version 2.4.1 (Build 492) • Nexora Salonos Suite
            </p>
          </div>

        </div>

      </div>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {isLanguageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>{t('select_display_lang')}</span>
                </h3>
                <button 
                  onClick={() => setIsLanguageModalOpen(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {languages.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected 
                          ? 'bg-primary-container/10 border-primary text-primary font-bold'
                          : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span>{lang.name}</span>
                        <span className="text-[11px] text-on-surface-variant/70">{lang.native}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legal Content Modal (Privacy / Terms) */}
      <AnimatePresence>
        {activeLegalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40 sticky top-0 bg-surface z-10">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  {activeLegalModal === 'privacy' ? (
                    <>
                      <Shield className="w-5 h-5 text-primary" />
                      <span>Privacy Policy</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 text-primary" />
                      <span>Terms of Service</span>
                    </>
                  )}
                </h3>
                <button 
                  onClick={() => setActiveLegalModal(null)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeLegalModal === 'privacy' ? (
                <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
                  <p className="font-bold text-on-surface text-sm">Nexora Salonos Privacy Policy</p>
                  <p>At Nexora Salonos, we prioritize the confidentiality and security of client and business data. This Privacy Policy outlines how our platform handles information collected during appointment bookings and review management.</p>
                  
                  <p className="font-bold text-on-surface pt-1">1. Data Collection & Use</p>
                  <p>We collect salon client names, service histories, and appointment logs exclusively to provide salon owners with streamlined scheduling, revenue analytics, and automated response capabilities.</p>

                  <p className="font-bold text-on-surface pt-1">2. AI Models & Data Safety</p>
                  <p>Customer reviews processed through our AI Reply Assistant are handled through encrypted server proxies without storing sensitive personal financial tokens.</p>

                  <p className="font-bold text-on-surface pt-1">3. Security Standards</p>
                  <p>All data transit uses standard TLS 1.3 encryption with strict workspace isolation protocols.</p>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
                  <p className="font-bold text-on-surface text-sm">Nexora Salonos Terms of Service</p>
                  <p>Welcome to Nexora Salonos. By accessing or using our salon management platform, you agree to comply with the terms set forth below.</p>

                  <p className="font-bold text-on-surface pt-1">1. Business Operations & Booking</p>
                  <p>Salon owners are responsible for maintaining accurate service pricing, staff availability hours, and responding respectfully to customer feedback.</p>

                  <p className="font-bold text-on-surface pt-1">2. AI Assistant Usage</p>
                  <p>The AI Suggested Reply feature assists in drafting quick responses to client reviews. Owners remain responsible for reviewing and publishing replies sent to customers.</p>

                  <p className="font-bold text-on-surface pt-1">3. Subscription & Service Availability</p>
                  <p>Nexora Salonos provides 99.9% platform availability for appointment management and revenue tracking tools.</p>
                </div>
              )}

              <div className="pt-3 border-t border-outline-variant/40 flex justify-end">
                <button 
                  onClick={() => setActiveLegalModal(null)}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-primary-container text-on-primary-container hover:bg-primary transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shop Location — Edit modal (map + device location) */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setEditModalOpen(false)}>
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-outline-variant/40 shrink-0">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Edit Shop Location
                </h3>
                <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ShopLocationPicker
                  initialLat={shopLoc?.latitude ?? null}
                  initialLng={shopLoc?.longitude ?? null}
                  confirmed={shopLoc ? {
                    latitude: typeof shopLoc.latitude === 'number' ? shopLoc.latitude : 0,
                    longitude: typeof shopLoc.longitude === 'number' ? shopLoc.longitude : 0,
                    address: shopLoc.address || '',
                    city: shopLoc.city || '',
                    area: shopLoc.area || '',
                    zone: '',
                    landmark: '',
                    pincode: shopLoc.pincode || '',
                  } : null}
                  onConfirm={handleLocationConfirmed}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm before saving */}
      <AnimatePresence>
        {confirmOpen && pendingLocation && (
          <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmOpen(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Update shop location?</h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Your new location will be used on your salon profile and map.
              </p>
              <div className="mt-3 bg-surface-container-low rounded-xl p-3 font-mono text-[10.5px] text-on-surface-variant">
                📍 {pendingLocation.latitude.toFixed(6)}, {pendingLocation.longitude.toFixed(6)}
                {pendingLocation.area && <div className="mt-1">📍 {pendingLocation.area}{pendingLocation.city ? `, ${pendingLocation.city}` : ''}</div>}
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setConfirmOpen(false); setPendingLocation(null); }}
                  disabled={savingLoc}
                  className="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold text-xs active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLocation}
                  disabled={savingLoc}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
                >
                  {savingLoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {savingLoc ? 'Saving...' : 'Confirm Location'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
