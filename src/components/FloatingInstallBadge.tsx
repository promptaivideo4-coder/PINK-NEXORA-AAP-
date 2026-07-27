import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenName } from '../types';

interface FloatingInstallBadgeProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  isInstalled?: boolean;
}

export default function FloatingInstallBadge({ currentScreen, onNavigate, isInstalled }: FloatingInstallBadgeProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(localStorage.getItem('nexora-install-dismissed') === 'true');
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem('nexora-install-dismissed', 'true');
  };

  // Don't show if we're already on the install screen or splash screen, or installed, or dismissed
  const shouldShow = currentScreen !== 'install-app' && currentScreen !== 'splash' && !isInstalled && !isDismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ scale: 0, opacity: 0, x: -20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0, opacity: 0, x: -20 }}
          className="fixed bottom-6 left-6 z-[90] flex items-center gap-1 p-1 bg-white/90 backdrop-blur-md border border-outline-variant/30 rounded-full shadow-lg shadow-black/5 text-primary hover:bg-white transition-colors group"
        >
          <button
            onClick={() => onNavigate('install-app')}
            className="flex items-center gap-2 pl-1 pr-2 py-1"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Download size={16} />
              </div>
              <div className="absolute -inset-0.5 rounded-full border border-primary/20 animate-ping pointer-events-none" />
            </div>
            <span className="text-xs font-bold whitespace-nowrap">Download App</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors mr-1"
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
