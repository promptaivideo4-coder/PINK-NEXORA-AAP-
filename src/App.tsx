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
import Offline from './screens/Offline';
import AppUpdate from './screens/AppUpdate';
import StaffManagement from './screens/StaffManagement';
import NewStaff from './screens/NewStaff';
import StaffDetail from './screens/StaffDetail';
import ServerError from './screens/ServerError';
import CancellationRefundPolicy from './screens/CancellationRefundPolicy';
import RoleConflict from './screens/RoleConflict';
import ComponentLibrary from './screens/ComponentLibrary';
import ResponsiveTables from './screens/ResponsiveTables';
import SkeletonShowcase from './screens/SkeletonShowcase';
import ResetPassword from './screens/ResetPassword';
import Marketing from './screens/Marketing';
import { ThemeProvider } from './contexts/ThemeContext';
import { ScreenName } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Download, X, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('splash');
  const currentScreenRef = React.useRef(currentScreen);
  const [session, setSession] = useState<Session | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallToast, setShowInstallToast] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
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
        const authScreens: ScreenName[] = ['splash', 'welcome', 'login', 'register-stepper', 'theme-selection'];
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
      window.removeEventListener('hashchange', handleHashRouting);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallToast(false);
    }
  };

  const dismissInstallToast = () => {
    setShowInstallToast(false);
    localStorage.setItem('nexora-install-dismissed', 'true');
  };

  const navigate = (screen: ScreenName) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  return (
    <ThemeProvider>
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
            className="fixed bottom-6 right-6 z-[110] max-w-[320px] bg-surface-container-highest border border-outline-variant rounded-2xl shadow-2xl p-5 flex flex-col gap-4"
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

      <div className={!isOnline ? 'pt-7' : ''}>
        {currentScreen === 'splash' && <Splash navigate={navigate} />}
      {currentScreen === 'welcome' && <Welcome navigate={navigate} />}
      {currentScreen === 'login' && <Login navigate={navigate} />}
      {currentScreen === 'reset-password' && <ResetPassword navigate={navigate} />}
      {currentScreen === 'register-stepper' && <RegistrationStepper navigate={navigate} />}
      {currentScreen === 'dashboard' && <Dashboard navigate={navigate} />}
      {currentScreen === 'bookings' && <Bookings navigate={navigate} />}
      {currentScreen === 'help-center' && <HelpCenter navigate={navigate} />}
      {currentScreen === 'services' && <ServicesList navigate={navigate} />}
      {currentScreen === 'service-detail' && <ServiceDetail navigate={navigate} />}
      {currentScreen === 'new-service' && <NewService navigate={navigate} />}
      {currentScreen === 'new-appointment' && <NewAppointment navigate={navigate} />}
      {currentScreen === 'profile' && <Profile navigate={navigate} />}
      {currentScreen === 'customers' && <Customers navigate={navigate} />}
      {currentScreen === 'customer-profile' && <CustomerProfile navigate={navigate} />}
      {currentScreen === 'theme-selection' && <ThemeSelection navigate={navigate} />}
      {currentScreen === 'role-conflict' && <RoleConflict navigate={navigate} />}
      {currentScreen === 'cancellation-refund-policy' && <CancellationRefundPolicy navigate={navigate} />}
      {currentScreen === 'website-dashboard' && <WebsiteDashboard navigate={navigate} />}
      {currentScreen === 'website-gallery' && <WebsiteGallery navigate={navigate} />}
      {currentScreen === 'wallet' && <Wallet navigate={navigate} />}
      {currentScreen === 'transaction-detail' && <TransactionDetail navigate={navigate} />}
      {(currentScreen === 'revenue-analytics' || currentScreen === 'analytics') && <RevenueAnalytics navigate={navigate} />}
      {currentScreen === 'reviews' && <Reviews navigate={navigate} />}
      {currentScreen === 'settings' && <Settings navigate={navigate} />}
      {currentScreen === 'install-app' && (
        <InstallApp 
          navigate={navigate} 
          onInstalled={() => setIsAppInstalled(true)} 
        />
      )}
      {currentScreen === 'offline' && <Offline navigate={navigate} />}
      {currentScreen === 'app-update' && <AppUpdate navigate={navigate} />}
      {currentScreen === 'staff' && <StaffManagement navigate={navigate} />}
      {currentScreen === 'new-staff' && <NewStaff navigate={navigate} />}
      {currentScreen === 'staff-detail' && <StaffDetail navigate={navigate} />}
      {currentScreen === 'server-error' && <ServerError navigate={navigate} />}
      {currentScreen === 'component-library' && <ComponentLibrary navigate={navigate} />}
      {currentScreen === 'responsive-tables' && <ResponsiveTables navigate={navigate} />}
      {currentScreen === 'skeleton-showcase' && <SkeletonShowcase navigate={navigate} />}
      {currentScreen === 'marketing' && <Marketing navigate={navigate} />}
      </div>

      <FloatingInstallBadge 
        currentScreen={currentScreen} 
        onNavigate={navigate} 
        isInstalled={isAppInstalled} 
      />

      <AnimatePresence>
        {showInstallToast && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:w-96"
          >
            <div className="bg-primary text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold">Unlock the full Nexora experience</h4>
                <p className="text-xs text-white/80">Install Nexora to get instant booking alerts and offline access to your schedule.</p>
              </div>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={handleInstall}
                  className="bg-white text-primary px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all"
                >
                  Install
                </button>
                <button 
                  onClick={dismissInstallToast}
                  className="text-white/60 hover:text-white px-3 py-1 rounded-lg text-[10px] font-medium transition-colors text-center"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ThemeProvider>
  );
}
