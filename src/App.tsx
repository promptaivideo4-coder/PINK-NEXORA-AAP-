import React, { useState, useEffect, lazy, Suspense } from 'react';
import Splash from './screens/Splash';
import Welcome from './screens/Welcome';
import Login from './screens/Login';
import FloatingInstallBadge from './components/FloatingInstallBadge';
import { triggerCelebration } from './utils/celebration';

const RegistrationStepper = lazy(() => import('./screens/RegistrationStepper'));
const Dashboard = lazy(() => import('./screens/Dashboard'));
const Bookings = lazy(() => import('./screens/Bookings'));
const HelpCenter = lazy(() => import('./screens/HelpCenter'));
const ServicesList = lazy(() => import('./screens/ServicesList'));
const ServiceDetail = lazy(() => import('./screens/ServiceDetail'));
const NewService = lazy(() => import('./screens/NewService'));
const NewAppointment = lazy(() => import('./screens/NewAppointment'));
const Profile = lazy(() => import('./screens/Profile'));
const Customers = lazy(() => import('./screens/Customers'));
const CustomerProfile = lazy(() => import('./screens/CustomerProfile'));
const WebsiteBuilder = lazy(() => import('./screens/WebsiteBuilder'));
const Wallet = lazy(() => import('./screens/Wallet'));
const TransactionDetail = lazy(() => import('./screens/TransactionDetail'));
const RevenueAnalytics = lazy(() => import('./screens/RevenueAnalytics'));
const Reviews = lazy(() => import('./screens/Reviews'));
const Settings = lazy(() => import('./screens/Settings'));
const InstallApp = lazy(() => import('./screens/InstallApp'));
const AppUpdate = lazy(() => import('./screens/AppUpdate'));
const StaffManagement = lazy(() => import('./screens/StaffManagement'));
const NewStaff = lazy(() => import('./screens/NewStaff'));
const StaffDetail = lazy(() => import('./screens/StaffDetail'));
const StaffSchedule = lazy(() => import('./screens/StaffSchedule'));
const StaffAttendance = lazy(() => import('./screens/StaffAttendance'));
const LeaveShiftSwap = lazy(() => import('./screens/LeaveShiftSwap'));
const PayrollEarnings = lazy(() => import('./screens/PayrollEarnings'));
const PayrollBreakdown = lazy(() => import('./screens/PayrollBreakdown'));
const RolesAccessControl = lazy(() => import('./screens/RolesAccessControl'));
const StaffPerformance = lazy(() => import('./screens/StaffPerformance'));
const StaffSelfService = lazy(() => import('./screens/StaffSelfService'));
const StaffWebsiteBooking = lazy(() => import('./screens/StaffWebsiteBooking'));
const ServerError = lazy(() => import('./screens/ServerError'));
const CancellationRefundPolicy = lazy(() => import('./screens/CancellationRefundPolicy'));
const RoleConflict = lazy(() => import('./screens/RoleConflict'));
const ResetPassword = lazy(() => import('./screens/ResetPassword'));
const Marketing = lazy(() => import('./screens/Marketing'));
const NearbySalons = lazy(() => import('./screens/NearbySalons'));
const ShopLocation = lazy(() => import('./screens/ShopLocation'));
import { ThemeProvider } from './contexts/ThemeContext';
import { OfflineSyncProvider } from './contexts/OfflineSyncContext';
import AddToHomeScreenPrompt from './components/AddToHomeScreenPrompt';
import { ScreenName } from './types';
import { supabase } from './lib/supabase';
import { clearOwnerSessionData } from './utils/storage';
import { useLocationSync } from './hooks/useLocationSync';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Download, X, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLocation } from './contexts/LocationContext';
import {
  isOnMainWebsiteAuthRoute,
  redirectToMainWebsiteAuth,
} from './lib/authRoutes';
import { PUBLIC_SCREENS, resolveInitialScreen } from './lib/workspaceScreens';

function ScreenFallback() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-surface">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

}

export default function App() {
  const { requestLocation } = useLocation();
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(resolveInitialScreen);
  const currentScreenRef = React.useRef(currentScreen);
  const [session, setSession] = useState<Session | null>(null);
  /** True once the Supabase client has reported its initial session state. */
  const sessionResolvedRef = React.useRef(false);
  /** True while a SIGNED_OUT cleanup/redirect is already in flight. */
  const signOutHandledRef = React.useRef(false);
  /** True once Supabase has reported the initial session (restored or absent).
   *  Route guards must only fire after this — otherwise a returning user with
   *  a valid stored session would flash the Login screen on every refresh. */
  const [sessionResolved, setSessionResolved] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallToast, setShowInstallToast] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  /**
   * Tracking entry point handed to the live-location sync hook. Keep the
   * existing LocationContext permission/status flow, but start immediately so
   * logout cannot leave a delayed orphaned GPS request behind.
   */
  const requestLocationDeferred = React.useCallback(
    () => {
      void requestLocation();
    },
    [requestLocation],
  );

  // Live location sync — armed ONLY once a valid session exists, and it drives
  // the existing centralized GPS watcher (no second watcher is created).
  useLocationSync({
    enabled: !!session,
    userId: session?.user?.id ?? null,
    startTracking: requestLocationDeferred,
  });

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

    // NOTE: session bootstrapping and auth-event handling live in the single
    // `supabase.auth.onAuthStateChange` subscription below — this effect must
    // not open a second one.

    // Handle initial hash routing and hash changes
    const handleHashRouting = () => {
      const hash = window.location.hash;
      
      // Handle Supabase recovery flow (password reset)
      // Usually format is #access_token=...&type=recovery
      if (hash.includes('type=recovery') || hash.includes('error_description=Email+link+is+invalid+or+has+expired')) {
        setCurrentScreen('reset-password');
        return;
      }

      // Main Website auth route (path based: /auth/login, plus the legacy
      // #/app/owner/login hash) always resolves to the app's login screen.
      if (isOnMainWebsiteAuthRoute()) {
        setCurrentScreen('login');
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
      if (params.get('screen') === 'leave-swap') {
        setCurrentScreen('leave-swap');
        return;
      }
      if (params.get('screen') === 'staff-payroll') {
        setCurrentScreen('staff-payroll');
        return;
      }
      if (params.get('screen') === 'staff-payroll-detail') {
        setCurrentScreen('staff-payroll-detail');
        return;
      }
      if (params.get('screen') === 'staff-payroll-breakdown') {
        setCurrentScreen('staff-payroll-breakdown');
        return;
      }
      if (params.get('screen') === 'staff-roles-access') {
        setCurrentScreen('staff-roles-access');
        return;
      }
      if (params.get('screen') === 'staff-performance') {
        setCurrentScreen('staff-performance');
        return;
      }
      if (params.get('screen') === 'staff-self-service') {
        setCurrentScreen('staff-self-service');
        return;
      }
      if (params.get('screen') === 'staff-website-booking') {
        setCurrentScreen('staff-website-booking');
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

    return () => {
      window.removeEventListener('hashchange', handleHashRouting);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalledGlobal);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // THE one and only auth-state subscription for this application.
  //
  // Every auth concern (session state, protected-state cleanup, entry routing,
  // sign-out redirect, and — through the `session` state — starting/stopping
  // live location sync) flows from this single subscription. Do not add a
  // second `onAuthStateChange` listener anywhere else in the app.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    /** Session is valid → initialize authenticated application state. */
    const handleAuthenticated = (event: AuthChangeEvent, nextSession: Session) => {
      signOutHandledRef.current = false;
      setSession(nextSession);
      // Live location sync is armed automatically by `useLocationSync` once
      // this state flips to a valid session — nothing to start here.
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        const activeScreen = currentScreenRef.current;
        if (['splash', 'welcome', 'login'].includes(activeScreen)) {
          // Signed in from an entry screen → straight into the workspace.
          setCurrentScreen('dashboard');
        }
      }
    };

    /** Session became invalid → clean up protected state and leave the app. */
    const handleSignedOut = () => {
      if (signOutHandledRef.current) return; // never run the redirect twice
      signOutHandledRef.current = true;
      setSession(null); // also disarms live location sync (see useLocationSync)
      clearOwnerSessionData();

      // Deferred so an explicit `navigate('welcome')` from a logout button
      // (Settings / Profile) cannot land after this and leave the URL on
      // /auth/login while the UI shows something else.
      window.setTimeout(() => {
        redirectToMainWebsiteAuth();
        // Signed-out users never remain inside a protected screen.
        setCurrentScreen('login');
      }, 0);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      sessionResolvedRef.current = true;
      setSessionResolved(true);

      switch (event) {
        case 'INITIAL_SESSION':
          // Restored (or absent) session on load. An absent session here means
          // a fresh visitor — they keep the splash/welcome entry flow, so no
          // redirect happens (that is what prevents a redirect loop).
          if (nextSession) handleAuthenticated(event, nextSession);
          else setSession(null);
          break;

        case 'SIGNED_IN':
        case 'USER_UPDATED':
          if (nextSession) handleAuthenticated(event, nextSession);
          break;

        case 'TOKEN_REFRESHED':
          if (nextSession) handleAuthenticated(event, nextSession);
          else handleSignedOut();
          break;

        case 'PASSWORD_RECOVERY':
          // PKCE recovery links arrive as `?code=` and are exchanged by the
          // client; land the user on the existing reset-password screen.
          setSession(nextSession);
          setCurrentScreen('reset-password');
          break;

        case 'SIGNED_OUT':
          handleSignedOut();
          break;

        default:
          setSession(nextSession);
      }
    });

    // Belt and braces: if the INITIAL_SESSION event was emitted before this
    // component subscribed (very early hydration), read the session once.
    // This is a one-shot read, not a second subscription.
    if (!sessionResolvedRef.current) {
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (sessionResolvedRef.current) return;
        sessionResolvedRef.current = true;
        setSessionResolved(true);
        if (currentSession) handleAuthenticated('INITIAL_SESSION', currentSession);
      });
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  // ---------------------------------------------------------------------------
  // PROTECTED-ROUTE GUARD
  //
  // Every screen except the public entry flow requires a valid Supabase
  // session. Previously nothing enforced this: `?screen=dashboard` (and the
  // staff-preview URLs) rendered protected screens for logged-out visitors,
  // and the `default:` case rendered the Dashboard for any unknown screen.
  // The guard fires only after the initial session has been resolved so a
  // returning user with a stored session never sees a login flash on refresh.
  // ---------------------------------------------------------------------------
  const isPublicScreen = PUBLIC_SCREENS.has(currentScreen);

  const renderScreen = () => {
    if (sessionResolved && !session && !isPublicScreen) {
      return <Login navigate={navigate} />;
    }
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
      case 'role-conflict':
        return <RoleConflict navigate={navigate} />;
      case 'cancellation-refund-policy':
        return <CancellationRefundPolicy navigate={navigate} />;
      case 'website-builder':
        return <WebsiteBuilder navigate={navigate} />;
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
      case 'leave-swap':
        return <LeaveShiftSwap navigate={navigate} />;
      case 'staff-payroll':
        return <PayrollEarnings navigate={navigate} />;
      case 'staff-payroll-detail':
        return <PayrollBreakdown navigate={navigate} />;
      case 'staff-payroll-breakdown':
        return <PayrollBreakdown navigate={navigate} />;
      case 'staff-roles-access':
        return <RolesAccessControl navigate={navigate} />;
      case 'staff-performance':
        return <StaffPerformance navigate={navigate} />;
      case 'staff-self-service':
        return <StaffSelfService navigate={navigate} />;
      case 'staff-website-booking':
        return <StaffWebsiteBooking navigate={navigate} />;
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
        <Suspense fallback={<ScreenFallback />}>
          {renderScreen()}
        </Suspense>
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
