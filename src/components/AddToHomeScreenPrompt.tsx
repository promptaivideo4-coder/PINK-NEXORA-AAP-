import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Download, 
  X, 
  Smartphone, 
  Sparkles, 
  Share, 
  PlusSquare, 
  Check, 
  Zap, 
  WifiOff, 
  Bell,
  Camera
} from 'lucide-react';
import { triggerCelebration } from '../utils/celebration';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface AddToHomeScreenPromptProps {
  variant?: 'banner' | 'modal' | 'card';
  deferredPrompt?: BeforeInstallPromptEvent | any;
  onInstalled?: () => void;
  onDismiss?: () => void;
  autoShowDelayMs?: number;
}

export default function AddToHomeScreenPrompt({
  variant = 'banner',
  deferredPrompt: deferredPromptProp,
  onInstalled,
  onDismiss,
  autoShowDelayMs = 2000,
}: AddToHomeScreenPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return deferredPromptProp || (window as any).deferredInstallPrompt || null;
  });

  useEffect(() => {
    if (deferredPromptProp) {
      setDeferredPrompt(deferredPromptProp);
    }
  }, [deferredPromptProp]);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [manualModalWidth, setManualModalWidth] = useState<number>(360);
  const manualModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showIOSInstructions || !manualModalRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setManualModalWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(manualModalRef.current);
    return () => observer.disconnect();
  }, [showIOSInstructions]);

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      localStorage.getItem('nexora-app-installed') === 'true';

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      (window as any).deferredInstallPrompt = installEvent;
      setDeferredPrompt(installEvent);
    };

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.setItem('nexora-app-installed', 'true');
      setInstalledSuccess(true);
      triggerCelebration();
      if (onInstalled) onInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Auto-display logic after delay if not dismissed recently
    const isDismissedRecently = localStorage.getItem('nexora-a2hs-dismissed-time');
    const now = Date.now();
    const shouldSuppress = isDismissedRecently && now - parseInt(isDismissedRecently, 10) < 24 * 60 * 60 * 1000;

    let timer: NodeJS.Timeout;
    if (!shouldSuppress && !isStandalone) {
      timer = setTimeout(() => {
        setIsVisible(true);
      }, autoShowDelayMs);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (timer) clearTimeout(timer);
    };
  }, [autoShowDelayMs, onInstalled]);

  const handleInstallClick = async () => {
    // If iOS Safari, show step-by-step guidance
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // Grab deferred prompt from state or global window reference
    const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt;

    if (!promptEvent) {
      // Fallback: If event hasn't fired yet or browser doesn't support automatic prompt
      setShowIOSInstructions(true);
      return;
    }

    try {
      setIsInstalling(true);
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setInstalledSuccess(true);
        localStorage.setItem('nexora-app-installed', 'true');
        (window as any).deferredInstallPrompt = null;
        setDeferredPrompt(null);
        triggerCelebration();
        if (onInstalled) onInstalled();
      } else {
        console.log('User dismissed the A2HS install prompt');
      }
    } catch (err) {
      console.error('Error triggering PWA install prompt:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Nexora App',
      text: 'Install Nexora for salon management, online booking, and staff scheduling!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('nexora-a2hs-dismissed-time', Date.now().toString());
    if (onDismiss) onDismiss();
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  // Success Confirmation State
  if (installedSuccess) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[120] bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">Nexora Added to Home Screen!</h4>
            <p className="text-xs text-emerald-100">Launch from your home screen for instant access.</p>
          </div>
          <button
            onClick={() => setInstalledSuccess(false)}
            className="p-1 text-emerald-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // iOS / Manual Instructions Drawer/Modal
  if (showIOSInstructions) {
    const computedPromptQrSize = Math.max(96, Math.min(manualModalWidth - 64, showQrCode ? 150 : 96));

    return (
      <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2.5 sm:p-4">
        <motion.div
          ref={manualModalRef}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          className="manual-installation-modal w-full max-w-md max-h-[95vh] sm:max-h-[85vh] flex flex-col bg-surface border border-outline-variant rounded-3xl p-3 sm:p-6 shadow-2xl space-y-2 sm:space-y-4 overflow-y-auto"
        >
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-on-surface leading-tight">Add Nexora to Home Screen</h3>
                <p className="text-[11px] sm:text-xs text-on-surface-variant">Follow these simple steps on your browser</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* QR Code Container dynamically calculated based on modal width */}
          <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-center space-y-1 sm:space-y-2 shrink-0 min-h-0">
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-on-surface">Scan QR Code to Open</span>
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                {showQrCode ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {showQrCode && (
              <div
                style={{ width: `${computedPromptQrSize}px`, height: `${computedPromptQrSize}px` }}
                className="mx-auto flex items-center justify-center transition-all duration-300 overflow-hidden relative rounded-xl bg-white p-2 shadow-sm border border-outline-variant/20 shrink-0"
              >
                <QRCodeCanvas
                  value={window.location.href}
                  size={computedPromptQrSize - 16}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
            <p className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium flex items-center justify-center gap-1 mt-1">
              <Camera className="w-3 h-3 text-primary shrink-0" />
              <span>Scan to open installation page</span>
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3 bg-surface-container-low p-3 sm:p-4 rounded-2xl border border-outline-variant/30 text-xs flex-grow overflow-y-auto">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0">1</span>
              <div>
                <p className="font-semibold text-on-surface leading-snug">Tap the Share button</p>
                <p className="text-on-surface-variant text-[11px] flex items-center gap-1 mt-0.5">
                  Look for <Share className="w-3.5 h-3.5 text-primary inline shrink-0" /> in Safari navigation bar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="font-semibold text-on-surface leading-snug">Select 'Add to Home Screen'</p>
                <p className="text-on-surface-variant text-[11px] flex items-center gap-1 mt-0.5">
                  Scroll down and choose <PlusSquare className="w-3.5 h-3.5 text-primary inline shrink-0" /> Add to Home Screen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <p className="font-semibold text-on-surface leading-snug">Tap 'Add' to confirm</p>
                <p className="text-on-surface-variant text-[11px] mt-0.5">
                  Nexora will appear on your device's home screen.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0 pt-2">
            <button
              onClick={handleShareApp}
              className={`flex-1 font-semibold py-2.5 sm:py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all border ${
                shareCopied
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
              }`}
              title="Share app link via native share dialog"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share className="w-3.5 h-3.5 text-primary" />
                  <span>Share Link</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="flex-1 bg-primary text-white font-bold py-2.5 sm:py-3 rounded-2xl text-xs shadow-lg active:scale-95 transition-all"
            >
              Got it, thanks!
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Modal Variant
  if (variant === 'modal') {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-surface border border-outline-variant rounded-3xl p-6 shadow-2xl relative space-y-4"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-xl shadow-primary/20 mb-1">
                <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center text-primary">
                  <Smartphone className="w-8 h-8" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-on-surface">Install Nexora App</h3>
              <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                Add Nexora to your home screen for quick access, offline availability, and smooth performance.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20 text-center">
                <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
                <span className="text-[10px] font-semibold text-on-surface block">Fast Load</span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20 text-center">
                <WifiOff className="w-4 h-4 text-primary mx-auto mb-1" />
                <span className="text-[10px] font-semibold text-on-surface block">Offline</span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20 text-center">
                <Bell className="w-4 h-4 text-primary mx-auto mb-1" />
                <span className="text-[10px] font-semibold text-on-surface block">Alerts</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all"
              >
                Not Now
              </button>
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'Installing...' : 'Add to Home'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Default Bottom Banner / Toast Variant
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,16px))] left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-[110]"
      >
        <div className="bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant/40 rounded-2xl p-4 shadow-2xl flex items-center gap-3.5 relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary-container p-0.5 shrink-0 shadow-lg shadow-primary/20">
            <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-bold text-on-surface truncate">Add Nexora to Home Screen</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">PWA</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-tight truncate">
              Install for instant access, alerts, and offline schedule sync.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstalling ? '...' : 'Install'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export const PWAInstallPrompt = AddToHomeScreenPrompt;
