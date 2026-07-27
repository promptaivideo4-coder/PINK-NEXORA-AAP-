import React, { useState, useEffect } from 'react';
import { NavigationProps } from '../types';
import ShaderBackground from '../components/ShaderBackground';
import { 
  Diamond, 
  Zap, 
  Bell, 
  WifiOff, 
  Share, 
  Check, 
  ArrowLeft,
  X,
  Info,
  Smartphone,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  MessageSquare,
  Image as ImageIcon,
  MapPin,
  Music,
  Calendar,
  Camera,
  Compass,
  Settings,
  Edit3,
  Cloud,
  Sparkles,
  Copy,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';

const CONFETTI_COLORS = [
  '#e6007e', // primary-container
  '#336df5', // tertiary-container
  '#db227b', // secondary-container
  '#ffd9e2', // primary-fixed
  '#b4c5ff', // tertiary-fixed-dim
  '#ffb0c9', // primary-fixed-dim
  '#0052da', // tertiary
];

const SIMULATED_APPS = [
  { name: 'Messages', icon: MessageSquare, color: 'from-emerald-400 to-emerald-600', x: 20, y: 40 },
  { name: 'Photos', icon: ImageIcon, color: 'from-sky-400 to-blue-500', x: 89, y: 40 },
  { name: 'Maps', icon: MapPin, color: 'from-amber-400 to-orange-500', x: 158, y: 40 },
  { name: 'Music', icon: Music, color: 'from-pink-500 to-rose-600', x: 227, y: 40 },
  { name: 'Calendar', icon: Calendar, color: 'from-red-400 to-red-600', x: 20, y: 122 },
  { name: 'Camera', icon: Camera, color: 'from-gray-500 to-zinc-700', x: 89, y: 122 },
  { name: 'App Store', icon: Compass, color: 'from-blue-400 to-indigo-600', x: 158, y: 122 },
  // Nexora Slot is at x: 227, y: 122
  { name: 'Settings', icon: Settings, color: 'from-gray-400 to-slate-600', x: 20, y: 204 },
  { name: 'Safari', icon: Compass, color: 'from-cyan-400 to-blue-500', x: 89, y: 204 },
  { name: 'Notes', icon: Edit3, color: 'from-yellow-400 to-amber-500', x: 158, y: 204 },
  { name: 'Weather', icon: Cloud, color: 'from-sky-300 to-blue-400', x: 227, y: 204 },
];

const LANDING_PARTICLES = Array.from({ length: 20 }).map((_, i) => {
  const angle = (i * 360) / 20;
  const distance = 35 + Math.random() * 45;
  const rad = (angle * Math.PI) / 180;
  return {
    id: i,
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 5,
  };
});

function ConfettiOverlay() {
  const [particles] = useState(() =>
    Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 400,
      y: -90 - Math.random() * 240,
      endY: 300 + Math.random() * 300,
      rotation: Math.random() * 720 - 360,
      scale: 0.7 + Math.random() * 0.7,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: Math.random() > 0.6 ? 'circle' : Math.random() > 0.3 ? 'square' : 'line',
      delay: Math.random() * 0.15,
      duration: 1.8 + Math.random() * 1.0,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: p.scale,
            rotate: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            x: p.x,
            y: [0, p.y, p.endY],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          style={{
            backgroundColor: p.color,
            width: p.shape === 'line' ? '12px' : p.shape === 'circle' ? '7px' : '8px',
            height: p.shape === 'line' ? '4px' : p.shape === 'circle' ? '7px' : '8px',
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
          }}
          className="absolute shadow-xs"
        />
      ))}
    </div>
  );
}

interface InstallAppProps extends NavigationProps {
  onInstalled?: () => void;
}

export default function InstallApp({ navigate, onInstalled }: InstallAppProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [qrLarge, setQrLarge] = useState(false);
  const [helpTab, setHelpTab] = useState<'ios' | 'android' | 'desktop'>('ios');

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    if (isAndroid) {
        setHelpTab('android');
    } else if (isIOS) {
        setHelpTab('ios');
    } else {
        setHelpTab('desktop');
    }
  }, []);

  // Install Animation State
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStage, setAnimationStage] = useState<'idle' | 'phone-in' | 'flying' | 'landed' | 'complete'>('idle');

  // Device Battery State
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [isCharging, setIsCharging] = useState<boolean>(true);

  useEffect(() => {
    let batteryObj: any = null;

    const handleBatteryUpdate = (b: any) => {
      setBatteryLevel(Math.round(b.level * 100));
      setIsCharging(b.charging);
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        batteryObj = b;
        handleBatteryUpdate(b);
        b.addEventListener('levelchange', () => handleBatteryUpdate(b));
        b.addEventListener('chargingchange', () => handleBatteryUpdate(b));
      }).catch(() => {
        // Fallback default retained
      });
    }

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener?.('levelchange', () => handleBatteryUpdate(batteryObj));
        batteryObj.removeEventListener?.('chargingchange', () => handleBatteryUpdate(batteryObj));
      }
    };
  }, []);

  const renderBatteryIcon = () => {
    if (isCharging) {
      return (
        <span className="relative inline-flex items-center justify-center">
          <BatteryCharging className="w-4 h-4 text-emerald-500 animate-battery-charge" />
          <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-ping opacity-40 pointer-events-none" />
        </span>
      );
    }
    if (batteryLevel >= 80) {
      return <BatteryFull className="w-4 h-4 text-emerald-600" />;
    }
    if (batteryLevel >= 40) {
      return <BatteryMedium className="w-4 h-4 text-on-surface" />;
    }
    if (batteryLevel >= 15) {
      return <BatteryLow className="w-4 h-4 text-amber-500" />;
    }
    return <BatteryWarning className="w-4 h-4 text-error" />;
  };

  useEffect(() => {
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone || localStorage.getItem('nexora-app-installed') === 'true') {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const startInstallAnimation = () => {
    setIsAnimating(true);
    setAnimationStage('phone-in');
    
    // Stage 2: start flying after 1000ms (gives time for phone to zoom in)
    setTimeout(() => {
      setAnimationStage('flying');
    }, 1000);

    // Stage 3: landed after 2200ms (1.2s flight duration)
    setTimeout(() => {
      setAnimationStage('landed');
      setShowConfetti(true);
    }, 2200);

    // Stage 4: finish phone view after 4000ms
    setTimeout(() => {
      setAnimationStage('complete');
    }, 4000);

    // Finalize: close overlay and go to dashboard
    setTimeout(() => {
      setIsAnimating(false);
      setIsInstalled(true);
      localStorage.setItem('nexora-app-installed', 'true');
      if (onInstalled) onInstalled();
      setShowToast(true);
      
      // Keep toast visible for a second before navigating
      setTimeout(() => {
        navigate('dashboard');
      }, 1500);
    }, 4600);
  };

  const handleInstallClick = async () => {
    const promptToUse = deferredPrompt || (window as any).deferredInstallPrompt;
    if (promptToUse) {
      try {
        promptToUse.prompt();
        const { outcome } = await promptToUse.userChoice;
        if (outcome === 'accepted') {
          (window as any).deferredInstallPrompt = null;
          setDeferredPrompt(null);
          startInstallAnimation();
        }
      } catch (err) {
        setShowHelp(true);
      }
    } else {
      // On iOS Safari or unsupported browser without native prompt, show Add to Home Screen instructions
      setShowHelp(true);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden font-sans text-on-surface">
      {/* Custom Styles for Battery Charging Animations */}
      <style>{`
        @keyframes batteryChargePulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 1px rgba(16, 185, 129, 0.4));
          }
          50% {
            transform: scale(1.15);
            filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.8));
          }
        }
        .animate-battery-charge {
          animation: batteryChargePulse 1.8s ease-in-out infinite;
        }
        @keyframes zapPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.25); }
        }
        .animate-zap-flash {
          animation: zapPulse 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && <ConfettiOverlay key="confetti-overlay" />}
      </AnimatePresence>

      {/* Phone Animation Overlay */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            {/* Skip button */}
            <button 
              onClick={() => {
                setIsAnimating(false);
                setIsInstalled(true);
                setShowToast(true);
                navigate('dashboard');
              }}
              className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors z-50 cursor-pointer"
            >
              Skip
            </button>

            {/* Smartphone Container */}
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={
                animationStage === 'complete' 
                  ? { scale: 0.8, y: -50, opacity: 0 } 
                  : { scale: 1, y: 0, opacity: 1 }
              }
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="w-[310px] h-[600px] bg-slate-950 rounded-[46px] border-[6px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col"
            >
              {/* Phone Wallpaper Gradients */}
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-900/60 via-purple-950 to-indigo-950/80 -z-10" />
              
              {/* Dynamic Island */}
              <div className="w-28 h-5.5 bg-black rounded-full mx-auto mt-2.5 z-30 relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 absolute right-3" />
              </div>

              {/* Status Bar */}
              <div className="w-full flex justify-between items-center px-6 pt-1 text-[10px] text-white/90 font-semibold z-20">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-2.5 border border-white/40 rounded-[3px] p-0.5 flex items-center">
                    <div className="w-full h-full bg-white rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Phone Content Grid area */}
              <div className="flex-1 px-5 pt-8 relative">
                {/* Search Bar / Dock backdrop */}
                <div className="w-full h-9 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/5 flex items-center px-4 gap-2 text-white/50 text-[11px] font-medium">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Search apps & files...</span>
                </div>

                {/* 3x4 App Grid Container */}
                <div className="relative w-full h-[320px] bg-transparent">
                  {/* Static Predefined Apps */}
                  {SIMULATED_APPS.map((app) => {
                    const AppIcon = app.icon;
                    return (
                      <div
                        key={app.name}
                        style={{ left: app.x, top: app.y }}
                        className="absolute flex flex-col items-center w-14"
                      >
                        <div className={`w-13 h-13 rounded-[13px] bg-gradient-to-tr ${app.color} flex items-center justify-center shadow-md border border-white/10`}>
                          <AppIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] text-white/70 mt-1 font-semibold truncate w-full text-center">
                          {app.name}
                        </span>
                      </div>
                    );
                  })}

                  {/* Slot 8: Nexora App Slot */}
                  <div 
                    style={{ left: 227, top: 122 }}
                    className="absolute flex flex-col items-center w-14"
                  >
                    <AnimatePresence mode="wait">
                      {(animationStage === 'phone-in' || animationStage === 'flying') ? (
                        <motion.div
                          key="placeholder-dashed"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="w-13 h-13 rounded-[13px] border-2 border-dashed border-white/30 bg-white/5 flex items-center justify-center animate-pulse"
                        >
                          <div className="w-2 h-2 rounded-full bg-white/40 animate-ping" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="nexora-active"
                          initial={{ scale: 0.3, rotate: -45 }}
                          animate={{ 
                            scale: [0.3, 1.25, 1], 
                            rotate: 0,
                            boxShadow: [
                              "0 0 0 rgba(230,0,126,0)",
                              "0 0 20px rgba(230,0,126,0.6)",
                              "0 0 8px rgba(230,0,126,0.3)"
                            ]
                          }}
                          transition={{ 
                            type: 'spring', 
                            damping: 12, 
                            stiffness: 150,
                            boxShadow: { duration: 1.5, repeat: Infinity, repeatType: 'reverse' }
                          }}
                          className="w-13 h-13 rounded-[13px] bg-primary-container flex items-center justify-center border border-primary/25 relative"
                        >
                          <Diamond className="w-7 h-7 text-on-primary-container" />
                          <div className="absolute -inset-1.5 rounded-[15px] border border-primary/40 animate-ping opacity-45" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <span className="text-[10px] text-white mt-1 font-semibold truncate w-full text-center">
                      {(animationStage === 'phone-in' || animationStage === 'flying') ? 'Installing...' : 'Nexora'}
                    </span>

                    {/* Landing Particle Pops */}
                    {animationStage === 'landed' && (
                      <div className="absolute top-6.5 left-6.5 pointer-events-none">
                        {LANDING_PARTICLES.map((p) => (
                          <motion.div
                            key={p.id}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                            animate={{ 
                              x: p.x, 
                              y: p.y, 
                              scale: [0, 1.3, 0], 
                              opacity: [1, 1, 0] 
                            }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className="absolute rounded-full shadow-xs"
                            style={{ 
                              width: p.size, 
                              height: p.size, 
                              backgroundColor: p.color 
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flying Icon */}
                  {animationStage === 'flying' && (
                    <motion.div
                      initial={{ x: 123, y: 520, scale: 0.3, rotate: 0, opacity: 0 }}
                      animate={{ 
                        x: 227, 
                        y: [520, 20, 122], // parabolic peak at y=20
                        scale: [0.3, 1.4, 1], 
                        rotate: 360, 
                        opacity: [0, 1, 1] 
                      }}
                      transition={{ 
                        duration: 1.2, 
                        ease: [0.25, 0.46, 0.45, 0.94] 
                      }}
                      className="absolute w-13 h-13 bg-primary-container rounded-[13px] flex items-center justify-center shadow-xl shadow-primary-container/30 z-50 border border-primary/10"
                    >
                      <Diamond className="w-7 h-7 text-on-primary-container" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Home Indicator bar */}
              <div className="w-32 h-1 bg-white/45 rounded-full mx-auto mb-2.5 z-20 relative" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background WebGL Shader Canvas */}
      <ShaderBackground opacity={0.6} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />

      {/* Top Bar Navigation & Battery Status */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate('dashboard')}
          className="pointer-events-auto p-2.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Battery Status Indicator */}
        <div className="pointer-events-auto px-3.5 py-2 rounded-full bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 text-on-surface shadow-sm flex items-center gap-2 text-xs font-semibold select-none">
          {renderBatteryIcon()}
          <span className="tabular-nums font-bold">{batteryLevel}%</span>
          {isCharging && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <Zap className="w-2.5 h-2.5 fill-current animate-zap-flash" />
              <span className="hidden sm:inline">Charging</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto my-auto py-8">
        {/* Installation Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: [0, -8, 0] 
          }}
          transition={{ 
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 },
            y: { 
              duration: 4, 
              repeat: Infinity, 
              repeatType: 'reverse', 
              ease: 'easeInOut' 
            } 
          }}
          className="w-full bg-surface-container-lowest/85 backdrop-blur-2xl rounded-[22px] border border-outline-variant/40 shadow-[0px_12px_45px_rgba(0,0,0,0.08)] p-6 sm:p-8 flex flex-col items-center text-center"
        >
          {/* Offline Status Header Indicator */}
          <div className="w-full -mt-2 mb-6">
            <div className={`px-4 py-2 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-500 ${
              isOnline 
                ? 'bg-surface-variant/20 border-outline-variant/10 text-on-surface-variant/60' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-700 shadow-sm'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-outline-variant' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isOnline ? 'System Online' : 'Offline Mode'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <WifiOff size={12} className={isOnline ? 'opacity-20' : 'opacity-100'} />
                <span className="text-[9px] font-bold">
                  {isOnline ? 'PWA Ready' : 'Schedule Saved Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Toast Notice */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Nexora Salonos installed successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* App Icon / Logo */}
          <div className="w-20 h-20 bg-primary-container rounded-[20px] flex items-center justify-center mb-5 shadow-lg shadow-primary-container/25 transform hover:scale-105 transition-transform duration-300">
            <Diamond className="w-10 h-10 text-on-primary-container stroke-[1.8]" />
          </div>

          {/* Header */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mb-2">
            Nexora on Your Home Screen
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
            Install the app for a faster, seamless salon management experience.
          </p>

          {/* Benefits List */}
          <div className="w-full flex flex-col gap-3 mb-6">
            {/* Benefit 1 */}
            <div className="flex items-center gap-3.5 bg-surface-container-low/60 p-3.5 rounded-[16px] border border-outline-variant/20 text-left transition-all hover:bg-surface-container-low">
              <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center shrink-0 text-secondary-container">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">Instant Access</h3>
                <p className="text-[11px] sm:text-xs text-on-surface-variant">Launch instantly without a browser.</p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-center gap-3.5 bg-surface-container-low/60 p-3.5 rounded-[16px] border border-outline-variant/20 text-left transition-all hover:bg-surface-container-low">
              <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center shrink-0 text-tertiary-container">
                <Bell className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">Real-time Alerts</h3>
                <p className="text-[11px] sm:text-xs text-on-surface-variant">Stay updated on bookings instantly.</p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-center gap-3.5 bg-surface-container-low/60 p-3.5 rounded-[16px] border border-outline-variant/20 text-left transition-all hover:bg-surface-container-low">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 text-primary-container">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">Works Offline</h3>
                <p className="text-[11px] sm:text-xs text-on-surface-variant">Access your schedule anywhere.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={handleInstallClick}
              disabled={isInstalled}
              className="w-full bg-primary-container hover:bg-primary text-on-primary-container font-bold text-sm py-3.5 rounded-[16px] transition-all active:scale-[0.98] shadow-md shadow-primary-container/25 flex items-center justify-center gap-2"
            >
              {isInstalled ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>App Already Installed</span>
                </>
              ) : (
                <span>Install Now</span>
              )}
            </button>

            <button
              onClick={() => navigate('dashboard')}
              className="w-full bg-transparent text-on-surface-variant hover:text-on-surface font-semibold text-xs sm:text-sm py-2.5 rounded-[16px] hover:bg-surface-container-low/60 transition-colors"
            >
              Maybe Later
            </button>

            {!deferredPrompt && (
              <button
                onClick={() => setShowHelp(true)}
                className="w-full mt-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-primary hover:underline transition-all"
              >
                <Info className="w-3 h-3" />
                How to Install manually?
              </button>
            )}
          </div>

          {/* Instructions fallback hint */}
          <p className="text-[11px] text-on-surface-variant/70 mt-5 flex items-center justify-center gap-1">
            Tap <Share className="w-3.5 h-3.5 mx-0.5 text-primary" /> then 'Add to Home Screen'
          </p>
        </motion.div>
      </div>

      {/* Manual Installation Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg bg-surface-container-lowest rounded-[28px] shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col manual-installation-modal relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Floating Download Badge */}
              <div className="absolute top-4 -right-12 rotate-45 z-10">
                <a 
                  href={helpTab === 'ios' ? "https://apps.apple.com" : helpTab === 'android' ? "https://play.google.com" : "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => {
                    const events = JSON.parse(localStorage.getItem('install_tracking_events') || '[]');
                    events.push({
                      event: 'direct_store_link_click',
                      platform: helpTab,
                      timestamp: new Date().toISOString()
                    });
                    localStorage.setItem('install_tracking_events', JSON.stringify(events));
                  }}
                  className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-12 py-1.5 shadow-lg flex items-center justify-center hover:brightness-110 transition-all"
                >
                  {helpTab === 'ios' ? 'App Store' : helpTab === 'android' ? 'Play Store' : 'Desktop App'}
                </a>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-on-surface">Install Instructions</h2>
                      <p className="text-xs text-on-surface-variant">Get Nexora on your home screen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setCopyToast(true);
                        setTimeout(() => setCopyToast(false), 2000);
                      }}
                      className="p-2 rounded-xl hover:bg-surface-container-high transition-all text-primary flex items-center gap-2 px-3 group min-w-[110px]"
                      title="Copy Link"
                    >
                      <motion.div
                        initial={false}
                        animate={{ rotate: copyToast ? 360 : 0, scale: copyToast ? 1.2 : 1 }}
                        className="relative w-4 h-4 flex items-center justify-center"
                      >
                        <AnimatePresence mode="wait">
                          {copyToast ? (
                            <motion.div
                              key="check"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check className="w-4 h-4 text-green-500" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                        {copyToast ? 'Copied!' : 'Copy Link'}
                      </span>
                    </button>
                    <button 
                      onClick={() => setShowHelp(false)}
                      className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                  <button
                    onClick={() => setHelpTab('ios')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                      helpTab === 'ios' 
                        ? 'bg-white shadow-sm text-primary' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    iOS
                  </button>
                  <button
                    onClick={() => setHelpTab('android')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                      helpTab === 'android' 
                        ? 'bg-white shadow-sm text-primary' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Android
                  </button>
                  <button
                    onClick={() => setHelpTab('desktop')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                      helpTab === 'desktop' 
                        ? 'bg-white shadow-sm text-primary' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Desktop
                  </button>
                </div>

                {/* QR Code */}
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0px rgba(230, 0, 126, 0)',
                      '0 0 20px rgba(230, 0, 126, 0.2)',
                      '0 0 0px rgba(230, 0, 126, 0)',
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-outline-variant/20 transition-all duration-500 ${qrLarge ? 'scale-100' : 'scale-100'}`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <p className="text-xs font-bold text-on-surface">Scan to open on mobile</p>
                    <button 
                      onClick={() => setQrLarge(!qrLarge)}
                      className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-high text-[10px] font-bold text-primary transition-all hover:bg-primary/10"
                    >
                      <span>{qrLarge ? 'Show Small' : 'Show Large'}</span>
                      <div className={`w-7 h-4 rounded-full relative transition-colors ${qrLarge ? 'bg-primary' : 'bg-outline-variant'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${qrLarge ? 'right-0.5' : 'left-0.5'}`} />
                      </div>
                    </button>
                  </div>
                  <div className={`flex items-center justify-center transition-all duration-500 overflow-hidden relative ${qrLarge ? 'w-full aspect-square' : 'w-32 h-32'}`}>
                    {/* Reactive Glow Effect */}
                    <motion.div 
                      className="absolute inset-0 -z-10 rounded-full blur-[40px] opacity-20"
                      style={{
                        background: `radial-gradient(circle, var(--md-sys-color-primary) 0%, transparent 70%)`
                      }}
                      animate={{ 
                        opacity: [0.1, 0.4, 0.1],
                        scale: [0.8, 1.1, 0.8]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <QRCodeCanvas 
                      value={window.location.href} 
                      size={qrLarge ? 512 : 128} 
                      style={{ width: '100%', height: '100%' }}
                    />
                    {/* Scanning Laser Line */}
                    <motion.div 
                      className="absolute left-0 right-0 h-0.5 bg-primary/60 shadow-[0_0_15px_rgba(230,0,126,0.8)] z-10"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                </motion.div>

                {/* Content */}
                <div className="flex flex-col gap-4">
                  <div className="aspect-video w-full rounded-2xl bg-surface-container-high overflow-hidden border border-outline-variant/10 relative">
                    {helpTab === 'ios' ? (
                      <>
                        <img 
                          src="/src/assets/images/ios_pwa_install_steps_1784952049729.jpg" 
                          alt="iOS Install Steps" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {/* Visual cue for iOS Share Button (typically bottom center) */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-[#E6007E] animate-ping opacity-75 shadow-[0_0_15px_#E6007E]"></div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-[#E6007E] flex items-center justify-center shadow-lg bg-[#E6007E]/20">
                          <Share className="w-5 h-5 text-[#E6007E] drop-shadow-md" />
                        </div>
                      </>
                    ) : helpTab === 'android' ? (
                      <>
                        <img 
                          src="/src/assets/images/android_pwa_install_steps_1784952063366.jpg" 
                          alt="Android Install Steps" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {/* Visual cue for Android Chrome Menu (typically top right) */}
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full border-4 border-[#E6007E] animate-ping opacity-75 shadow-[0_0_15px_#E6007E]"></div>
                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full border-4 border-[#E6007E] flex items-center justify-center shadow-lg bg-[#E6007E]/20">
                          <MoreVertical className="w-5 h-5 text-[#E6007E] drop-shadow-md" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-container-low text-on-surface-variant p-6 text-center">
                          <p>Open this URL in Google Chrome or Microsoft Edge on your computer. Look for the 'Install' icon in the address bar.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 px-1 overflow-y-auto max-h-[25vh]">
                    <h3 className="text-sm font-bold text-on-surface">Steps for {helpTab === 'ios' ? 'iOS Safari' : helpTab === 'android' ? 'Android Chrome' : 'Desktop Browser'}:</h3>
                    <ul className="space-y-2.5">
                      {helpTab === 'ios' ? (
                        <>
                          <li className="flex gap-3 text-xs text-on-surface-variant leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-[#E6007E]/10 text-[#E6007E] flex items-center justify-center shrink-0 font-bold text-[10px]">1/3</span>
                            <span>Open this website in the <strong className="text-on-surface">Safari browser</strong>.</span>
                          </li>
                          <li className="flex gap-3 text-xs text-on-surface-variant leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-[#E6007E]/10 text-[#E6007E] flex items-center justify-center shrink-0 font-bold text-[10px]">2/3</span>
                            <span>Tap the <strong className="text-[#E6007E]">Share button</strong> (square with upward arrow) highlighted above.</span>
                          </li>
                          <li className="flex gap-3 text-xs text-on-surface-variant leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-[#E6007E]/10 text-[#E6007E] flex items-center justify-center shrink-0 font-bold text-[10px]">3/3</span>
                            <span>Scroll down and select <strong className="text-on-surface">'Add to Home Screen'</strong>.</span>
                          </li>
                        </>
                      ) : helpTab === 'android' ? (
                        <>
                          <li className="flex gap-3 text-xs text-on-surface-variant leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-[#E6007E]/10 text-[#E6007E] flex items-center justify-center shrink-0 font-bold text-[10px]">1/3</span>
                            <span>Open this website in <strong className="text-on-surface">Google Chrome</strong>.</span>
                          </li>
                          <li className="flex gap-3 text-xs text-on-surface-variant leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-[#E6007E]/10 text-[#E6007E] flex items-center justify-center shrink-0 font-bold text-[10px]">2/3</span>
                            <span>Tap the <strong className="text-[#E6007E]">Three Dots menu</strong> highlighted in the top right.</span>
                          </li>
                          <li className="flex gap-3 text-xs text-on-surface-variant leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-[#E6007E]/10 text-[#E6007E] flex items-center justify-center shrink-0 font-bold text-[10px]">3/3</span>
                            <span>Select <strong className="text-on-surface">'Install app'</strong> or <strong className="text-on-surface">'Add to Home Screen'</strong>.</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex gap-3 text-xs text-on-surface-variant leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-[#E6007E]/10 text-[#E6007E] flex items-center justify-center shrink-0 font-bold text-[10px]">1/2</span>
                            <span>Open this website in <strong className="text-on-surface">Google Chrome</strong> or <strong className="text-on-surface">Microsoft Edge</strong>.</span>
                          </li>
                          <li className="flex gap-3 text-xs text-on-surface-variant leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-[#E6007E]/10 text-[#E6007E] flex items-center justify-center shrink-0 font-bold text-[10px]">2/2</span>
                            <span>Click the <strong className="text-[#E6007E]">Install icon</strong> (computer with down arrow) in the right side of the address bar.</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low border-t border-outline-variant/10 flex justify-between items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopyToast(true);
                    setTimeout(() => setCopyToast(false), 2000);
                  }}
                  className="px-4 py-2 bg-surface border border-outline-variant text-on-surface rounded-xl text-sm font-bold shadow-sm hover:bg-surface-container active:scale-95 transition-all flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy URL</span>
                </button>
                <button
                  onClick={() => setShowHelp(false)}
                  className="px-6 py-2 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
                >
                  Got it
                </button>
                {/* Copy Toast inside modal */}
                <AnimatePresence>
                  {copyToast && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-20 left-4 right-4 p-3 bg-emerald-500/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 z-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Link copied to clipboard</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
