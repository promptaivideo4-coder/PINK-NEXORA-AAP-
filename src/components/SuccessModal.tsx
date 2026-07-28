import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-sm w-full shadow-2xl space-y-4 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
            >
              <Check className="w-8 h-8" />
            </motion.div>
            
            <h3 className="text-lg font-bold text-on-surface">Password Updated Successfully</h3>
            <p className="text-sm text-on-surface-variant">Your account password has been changed successfully.</p>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-115 transition-all shadow-sm"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
