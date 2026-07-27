import React, { useState, useEffect } from 'react';
import { NavigationProps } from '../types';
import { WifiOff, RefreshCw, Calendar, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Offline({ navigate }: NavigationProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnlineStatus, setIsOnlineStatus] = useState<boolean>(navigator.onLine);
  const [reconnectSuccess, setReconnectSuccess] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineStatus(true);
      setReconnectSuccess(true);
      setTimeout(() => {
        navigate('dashboard');
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [navigate]);

  const handleRetryConnection = () => {
    setIsRetrying(true);
    setReconnectSuccess(false);

    setTimeout(() => {
      setIsRetrying(false);
      if (navigator.onLine) {
        setIsOnlineStatus(true);
        setReconnectSuccess(true);
        setTimeout(() => {
          navigate('dashboard');
        }, 1200);
      } else {
        setIsOnlineStatus(false);
      }
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-on-surface font-sans flex items-center justify-center p-5 md:p-10 selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
      {/* Top Bar Back Button */}
      <div className="absolute top-5 left-5 z-20">
        <button
          onClick={() => navigate('dashboard')}
          className="p-2.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
      </div>

      <main className="w-full max-w-md relative z-10">
        {/* Elevated Card Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-surface-container-lowest rounded-[22px] p-8 md:p-10 shadow-[0px_10px_40px_rgba(0,0,0,0.08)] border border-outline-variant/30 text-center flex flex-col items-center gap-6 relative overflow-hidden group"
        >
          {/* Subtle background decorative elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-fixed-dim/20 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-surface-dim/40 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none" />

          {/* Success Banner when connection returns */}
          <AnimatePresence>
            {reconnectSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Connection restored! Redirecting...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Icon / Illustration Area */}
          <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-surface-container-high/50 border border-outline-variant/20 shadow-xs z-10">
            <WifiOff className="w-10 h-10 text-on-surface-variant/80" />
            
            {/* Animated pulse ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary-container/30 animate-ping opacity-75 pointer-events-none" />
          </div>

          {/* Content Area */}
          <div className="flex flex-col gap-2 z-10">
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              You're Offline
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed">
              Your data is safe and cached. Any changes you make (bookings, profile edits) will be queued and synced automatically when you're back online.
            </p>
          </div>

          {/* Action Area */}
          <div className="w-full z-10 pt-2 flex flex-col gap-3">
            <button
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="w-full bg-primary-container text-on-primary-container font-bold text-sm py-3.5 rounded-[16px] flex items-center justify-center gap-2 hover:bg-primary transition-all duration-300 active:scale-95 shadow-md shadow-primary-container/20 disabled:opacity-70"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Checking Connection...' : 'Retry Connection'}</span>
            </button>

            <button
              onClick={() => navigate('bookings')}
              className="inline-flex items-center justify-center gap-1.5 font-semibold text-xs text-primary hover:text-primary-container transition-colors py-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>View Cached Schedule</span>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
