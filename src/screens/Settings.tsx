import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
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
  WifiOff,
  Download,
  Users,
  AlertCircle,
  Layers,
  Table,
  Sparkles
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
      try {
        const { data, error } = await supabase.from('services').select('id').limit(1);
        if (error) throw error;
        setIsSupabaseConnected(true);
      } catch (err) {
        // Fallback check if services table doesn't exist yet
        const { data: { session } } = await supabase.auth.getSession();
        setIsSupabaseConnected(!!session || !import.meta.env.VITE_SUPABASE_URL?.includes('placeholder'));
      }
    };
    checkConnection();
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
      <div id="settings-container" className="px-4 sm:px-6 md:px-10 py-6 max-w-[900px] mx-auto w-full space-y-6">
        
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

              {/* Offline Mode Status Screen */}
              <div 
                onClick={() => navigate('offline')}
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-surface-container-highest/60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary-container shrink-0">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{t('offline_status')}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t('offline_status_desc')}</p>
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
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-surface-container-highest/60"
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

              {/* Component Library */}
              <div 
                onClick={() => navigate('component-library')}
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-surface-container-highest/60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">UI Component Library</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Showcase of buttons, form elements, card tokens, and dialogs</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>

              {/* Data Overview Responsive Tables */}
              <div 
                onClick={() => navigate('responsive-tables')}
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors border-b border-surface-container-highest/60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary-container shrink-0">
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Data Overview & Tables</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Responsive client directory & transaction records table layout</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>

              {/* Skeletons & Loading States */}
              <div 
                onClick={() => navigate('skeleton-showcase')}
                className="p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">System Loading & Skeletons</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Visual shimmer placeholders and data retrieval simulation</p>
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

    </Layout>
  );
}
