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
import Offline from './screens/Offline';
import AppUpdate from './screens/AppUpdate';
import StaffManagement from './screens/StaffManagement';
import NewStaff from './screens/NewStaff';
import StaffDetail from './screens/StaffDetail';
import ServerError from './screens/ServerError';
import ComponentLibrary from './screens/ComponentLibrary';
import ResponsiveTables from './screens/ResponsiveTables';
import SkeletonShowcase from './screens/SkeletonShowcase';
import ResetPassword from './screens/ResetPassword';
import Marketing from './screens/Marketing';
import { ScreenName } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('splash');
  const currentScreenRef = React.useRef(currentScreen);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    // Apply theme on boot
    const savedTheme = localStorage.getItem('nexora-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

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
    };
  }, []);

  const navigate = (screen: ScreenName) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  return (
    <>
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
      {currentScreen === 'website-dashboard' && <WebsiteDashboard navigate={navigate} />}
      {currentScreen === 'website-gallery' && <WebsiteGallery navigate={navigate} />}
      {currentScreen === 'wallet' && <Wallet navigate={navigate} />}
      {currentScreen === 'transaction-detail' && <TransactionDetail navigate={navigate} />}
      {(currentScreen === 'revenue-analytics' || currentScreen === 'analytics') && <RevenueAnalytics navigate={navigate} />}
      {currentScreen === 'reviews' && <Reviews navigate={navigate} />}
      {currentScreen === 'settings' && <Settings navigate={navigate} />}
      {currentScreen === 'install-app' && <InstallApp navigate={navigate} />}
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
    </>
  );
}
