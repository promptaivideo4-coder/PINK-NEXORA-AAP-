import React, { useState, useEffect } from 'react';
import Splash from './screens/Splash';
import Welcome from './screens/Welcome';
import Login from './screens/Login';
import RegistrationStepper from './screens/RegistrationStepper';
import Dashboard from './screens/Dashboard';
import Bookings from './screens/Bookings';
import HelpCenter from './screens/HelpCenter';
import ServicesList from './screens/ServicesList';
import ServiceDetail from './screens/ServiceDetail';
import NewService from './screens/NewService';
import NewAppointment from './screens/NewAppointment';
import Profile from './screens/Profile';
import Customers from './screens/Customers';
import CustomerProfile from './screens/CustomerProfile';
import ThemeSelection from './screens/ThemeSelection';
import WebsiteDashboard from './screens/WebsiteDashboard';
import WebsiteGallery from './screens/WebsiteGallery';
import Wallet from './screens/Wallet';
import TransactionDetail from './screens/TransactionDetail';
import RevenueAnalytics from './screens/RevenueAnalytics';
import Reviews from './screens/Reviews';
import Settings from './screens/Settings';
import InstallApp from './screens/InstallApp';
import FloatingInstallBadge from './components/FloatingInstallBadge';
import { triggerCelebration } from './utils/celebration';
import AppUpdate from './screens/AppUpdate';
import StaffManagement from './screens/StaffManagement';
import NewStaff from './screens/NewStaff';
import StaffDetail from './screens/StaffDetail';
import StaffSchedule from './screens/StaffSchedule';
import StaffAttendance from './screens/StaffAttendance';
import ServerError from './screens/ServerError';
import CancellationRefundPolicy from './screens/CancellationRefundPolicy';
import RoleConflict from './screens/RoleConflict';
import ResetPassword from './screens/ResetPassword';
import Marketing from './screens/Marketing';
import NearbySalons from './screens/NearbySalons';
import ShopLocation from './screens/ShopLocation';
import { ThemeProvider } from './contexts/ThemeContext';
import { OfflineSyncProvider } from './contexts/OfflineSyncContext';
import AddToHomeScreenPrompt from './components/AddToHomeScreenPrompt';
import { ScreenName } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Download, X, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLocation } from './contexts/LocationContext';

export default function App() {
  const { requestLocation } = useLocation();
  const locationAutoAskedRef = React.useRef(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(() => {
    // Handy direct preview routes for the owner workspace while screens are being integrated.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const previewScreen = params.get('screen');
      if (previewScreen === 'dashboard') return 'dashboard';
      if (previewScreen === 'new-staff') return 'new-staff';
      if (previewScreen === 'staff-detail') return 'staff-detail';
      if (previewScreen === 'staff-schedule') return 'staff-schedule';
      if (previewScreen === 'staff-attendance') return 'staff-attendance';
      const isStaffPreview = previewScreen === 'staff'
        || window.location.hash === '#staff'
        || window.location.hash === '#/staff';
      if (isStaffPreview) return 'staff';
    }
    return 'splash';
  });
  const currentScreenRef = React.useRef(currentScreen);
  const [session, setSession] = useState<Session | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallToast, setShowInstallToast] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // PWA Update handling
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered');
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const closeUpdatePrompt = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone || localStorage.getItem('nexora-app-installed') === 'true') {
      setIsAppInstalled(true);
    }
  }, []);

  const handleApplyUpdate = () => {
    // Check for unsaved form data before reloading
    const hasUnsavedNewAppointment = !!localStorage.getItem('nexora-new-appointment-form');
    const hasUnsavedNewService = !!localStorage.getItem('nexora-new-service-form');

    if (hasUnsavedNewAppointment || hasUnsavedNewService) {
      const confirmReload = window.confirm(
        'You have unsaved form data. Updating now will refresh the page. Continue updating?'
      );
      if (!confirmReload) return;
    }

    updateServiceWorker(true);
  };

  // Send Supabase config to SW removed as it's better handled by standard Workbox strategies
  // or explicitly if needed.

  // Visit tracking logic
  useEffect(() => {
    if (currentScreen === 'dashboard') {
      const visitCount = parseInt(localStorage.getItem('nexora-dashboard-visits') || '0', 10);
      const newVisitCount = visitCount + 1;
      localStorage.setItem('nexora-dashboard-visits', newVisitCount.toString());

      // Show install toast if we have a prompt, not dismissed, and at least 3 visits
      if (deferredPrompt && !localStorage.getItem('nexora-install-dismissed') && newVisitCount >= 3) {
        setShowInstallToast(true);
      }
    }
  }, [currentScreen, deferredPrompt]);

  // Timed auto-hide for install toast
  useEffect(() => {
    if (showInstallToast) {
      const timer = setTimeout(() => {
        setShowInstallToast(false);
      }, 12000); // Auto-hide after 12 seconds
      return () => clearTimeout(timer);
    }
  }, [showInstallToast]);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setDeferredPrompt(e);
      
      // Check visits if already on dashboard
      if (currentScreenRef.current === 'dashboard') {
        const visits = parseInt(localStorage.getItem('nexora-dashboard-visits') || '0', 10);
        if (!localStorage.getItem('nexora-install-dismissed') && visits >= 3) {
          setShowInstallToast(true);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalledGlobal = () => {
      localStorage.setItem('nexora-app-installed', 'true');
      setShowInstallToast(false);
      triggerCelebration();
    };
    window.addEventListener('appinstalled', handleAppInstalledGlobal);

    // Initial session check — already-logged-in user reload par bhi location auto-maango
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && !locationAutoAskedRef.current) {
        locationAutoAskedRef.current = true;
        setTimeout(() => requestLocation(), 800);
      }
    });

    // 🔹 LOGIN KE TURANT BAAD LOCATION AUTO-REQUEST (requirement: login hote hi location)
    // Jab bhi login hota hai (SIGNED_IN), ek baar (per browser session) location permission
    // maang lo → browser ka prompt turant aata hai.
    const unsubscribeAuth = supabase.auth.onAuthStateChange((_event, s) => {
      if (s && !locationAutoAskedRef.current) {
        locationAutoAskedRef.current = true;
        // Thoda sa delay taaki dashboard render ho jaye, phir permission prompt
        setTimeout(() => requestLocation(), 800);
      }
    });

    // Handle initial hash routing and hash changes
    const handleHashRouting = () => {
      const hash = window.location.hash;
      
      // Handle Supabase recovery flow (password reset)
      // Usually format is #access_token=...&type=recovery
      if (hash.includes('type=recovery') || hash.includes('error_description=Email+link+is+invalid+or+has+expired')) {
        setCurrentScreen('reset-password');
        return;
      }

      // Direct screen preview links used during screen integration.
      const params = new URLSearchParams(window.location.search);
      if (params.get('screen') === 'dashboard') {
        setCurrentScreen('dashboard');
        return;
      }
      if (params.get('screen') === 'new-staff') {
        setCurrentScreen('new-staff');
        return;
      }
      if (params.get('screen') === 'staff-detail') {
        setCurrentScreen('staff-detail');
        return;
      }
      if (params.get('screen') === 'staff-schedule') {
        setCurrentScreen('staff-schedule');
        return;
      }
      if (params.get('screen') === 'staff-attendance') {
        setCurrentScreen('staff-attendance');
        return;
      }
      if (params.get('screen') === 'staff' || hash === '#staff' || hash === '#/staff') {
        setCurrentScreen('staff');
        return;
      }

      // Handle custom owner paths
      if (hash.includes('/app/owner/login')) {
        setCurrentScreen('login');
      } else if (hash.includes('/app/owner/reset-password')) {
        setCurrentScreen('reset-password');
      }
    };

    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const activeScreen = currentScreenRef.current;
      
      if (!session) {
        // Only force welcome if we are on a protected screen
        const authScreens: ScreenName[] = ['splash', 'welcome', 'login', 'register-stepper', 'theme-selection', 'dashboard', 'staff', 'new-staff', 'staff-detail', 'staff-schedule', 'staff-attendance'];
        if (!authScreens.includes(activeScreen)) {
          setCurrentScreen('welcome');
        }
      } else if (['splash', 'welcome', 'login'].includes(activeScreen)) {
        // Automatically go to dashboard if logged in from these entry screens
        setCurrentScreen('dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeAuth.data.subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashRouting);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalledGlobal);
    };
  }, [requestLocation]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallToast(false);
      localStorage.setItem('nexora-app-installed', 'true');
      triggerCelebration();
    }
  };

  const dismissInstallToast = () => {
    setShowInstallToast(false);
    localStorage.setItem('nexora-install-dismissed', 'true');
  };

  const navigate = React.useCallback((screen: ScreenName) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <Splash navigate={navigate} />;
      case 'welcome':
        return <Welcome navigate={navigate} />;
      case 'login':
        return <Login navigate={navigate} />;
      case 'reset-password':
        return <ResetPassword navigate={navigate} />;
      case 'register-stepper':
        return <RegistrationStepper navigate={navigate} />;
      case 'dashboard':
        return <Dashboard navigate={navigate} />;
      case 'bookings':
        return <Bookings navigate={navigate} />;
      case 'help-center':
        return <HelpCenter navigate={navigate} />;
      case 'services':
        return <ServicesList navigate={navigate} />;
      case 'service-detail':
        return <ServiceDetail navigate={navigate} />;
      case 'new-service':
        return <NewService navigate={navigate} />;
      case 'new-appointment':
        return <NewAppointment navigate={navigate} />;
      case 'profile':
        return <Profile navigate={navigate} />;
      case 'customers':
        return <Customers navigate={navigate} />;
      case 'customer-profile':
        return <CustomerProfile navigate={navigate} />;
      case 'theme-selection':
        return <ThemeSelection navigate={navigate} />;
      case 'role-conflict':
        return <RoleConflict navigate={navigate} />;
      case 'cancellation-refund-policy':
        return <CancellationRefundPolicy navigate={navigate} />;
      case 'website-dashboard':
        return <WebsiteDashboard navigate={navigate} />;
      case 'website-gallery':
        return <WebsiteGallery navigate={navigate} />;
      case 'wallet':
        return <Wallet navigate={navigate} />;
      case 'transaction-detail':
        return <TransactionDetail navigate={navigate} />;
      case 'revenue-analytics':
      case 'analytics':
        return <RevenueAnalytics navigate={navigate} />;
      case 'reviews':
        return <Reviews navigate={navigate} />;
      case 'settings':
        return <Settings navigate={navigate} />;
      case 'install-app':
        return (
          <InstallApp 
            navigate={navigate} 
            onInstalled={() => setIsAppInstalled(true)} 
          />
        );
      case 'app-update':
        return <AppUpdate navigate={navigate} />;
      case 'staff':
        return <StaffManagement navigate={navigate} />;
      case 'new-staff':
        return <NewStaff navigate={navigate} />;
      case 'staff-detail':
        return <StaffDetail navigate={navigate} />;
      case 'staff-schedule':
        return <StaffSchedule navigate={navigate} />;
      case 'staff-attendance':
        return <StaffAttendance navigate={navigate} />;
      case 'server-error':
        return <ServerError navigate={navigate} />;
      case 'marketing':
        return <Marketing navigate={navigate} />;
      case 'nearby-salons':
        return <NearbySalons navigate={navigate} />;
      case 'shop-location':
        return <ShopLocation navigate={navigate} />;
      default:
        return <Dashboard navigate={navigate} />;
    }
  };

  return (
    <ThemeProvider>
      <OfflineSyncProvider isOnline={isOnline} isSyncing={isSyncing} setIsSyncing={setIsSyncing}>
        {/* Offline Status Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-0 left-0 w-full z-[100] bg-error text-white text-[11px] font-bold py-1.5 px-4 flex items-center justify-center gap-2 shadow-md overflow-hidden"
          >
            <WifiOff className="w-3 h-3" />
            <span>You are currently offline. Some features may be unavailable.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Update / Offline Ready Prompt */}
      <AnimatePresence>
        {(offlineReady || needRefresh) && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,16px))] right-6 z-[110] max-w-[320px] bg-surface-container-highest border border-outline-variant rounded-2xl shadow-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-on-surface">
                  {needRefresh ? 'Update Available' : 'Ready for Offline'}
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {needRefresh 
                    ? 'A new version of Nexora is available. Update now to get the latest features.' 
                    : 'Nexora is ready to work offline. You can access your schedule anytime.'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {needRefresh && (
                <button 
                  onClick={handleApplyUpdate}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"
                >
                  Update Now
                </button>
              )}
              <button 
                onClick={closeUpdatePrompt}
                className="flex-1 bg-surface-container-low text-on-surface-variant py-2.5 rounded-xl text-xs font-bold hover:bg-surface-container-high transition-all"
              >
                {needRefresh ? 'Later' : 'Got it'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`w-full h-screen relative shadow-2xl bg-surface overflow-x-hidden overflow-y-auto ${!isOnline ? 'pt-7' : ''}`}>
        {renderScreen()}
      </div>

      <FloatingInstallBadge 
        currentScreen={currentScreen} 
        onNavigate={navigate} 
        isInstalled={isAppInstalled} 
      />

      <AddToHomeScreenPrompt 
        variant="banner" 
        deferredPrompt={deferredPrompt}
        onInstalled={() => setIsAppInstalled(true)} 
      />
      </OfflineSyncProvider>
    </ThemeProvider>
  );
}
