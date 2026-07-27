import React from 'react';
import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenName } from '../types';

interface FloatingInstallBadgeProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  isInstalled?: boolean;
}

export default function FloatingInstallBadge({ currentScreen, onNavigate, isInstalled }: FloatingInstallBadgeProps) {
  // Don't show if we're already on the install screen or splash screen
  const shouldShow = currentScreen !== 'install-app' && currentScreen !== 'splash' && !isInstalled;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.button
          initial={{ scale: 0, opacity: 0, x: -20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0, opacity: 0, x: -20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('install-app')}
          className="fixed bottom-6 left-6 z-[90] flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md border border-outline-variant/30 rounded-full shadow-lg shadow-black/5 text-primary hover:bg-white transition-colors group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Download size={16} />
            </div>
            <div className="absolute -inset-0.5 rounded-full border border-primary/20 animate-ping pointer-events-none" />
          </div>
          <span className="text-xs font-bold whitespace-nowrap">Download App</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
