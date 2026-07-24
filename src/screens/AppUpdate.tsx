import React, { useState } from 'react';
import { NavigationProps } from '../types';
import { Download, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AppUpdate({ navigate }: NavigationProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setIsCompleted(true);
      setTimeout(() => {
        navigate('dashboard');
      }, 1500);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-on-surface font-sans flex items-center justify-center p-5 md:p-10 selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/10 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />

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
        {/* Glassmorphic Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-surface-container-lowest/80 backdrop-blur-2xl rounded-[22px] p-8 md:p-10 border border-outline-variant/40 shadow-[0px_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Toast / Status Alert when update finishes */}
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nexora updated to v2.5.0! Restarting...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse Ring Visual Icon */}
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary-container rounded-full opacity-15 animate-ping" />
            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center shadow-lg shadow-primary-container/25 z-10">
              <Download className="w-8 h-8 text-on-primary-container stroke-[2.2]" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mb-2">
            New Version Available
          </h1>

          {/* Version Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container-high/80 border border-outline-variant/50 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="text-xs font-bold text-on-surface-variant">Version 2.5.0</span>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-on-surface-variant mb-8 max-w-[290px] leading-relaxed">
            We've added new features and performance improvements to make your salon management even smoother.
          </p>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating || isCompleted}
              className="w-full py-3.5 rounded-[16px] bg-primary-container hover:bg-primary text-on-primary-container font-bold text-sm shadow-md shadow-primary-container/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Installing Update...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Complete!</span>
                </>
              ) : (
                <>
                  <span>Update Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={() => navigate('dashboard')}
              disabled={isUpdating}
              className="w-full py-3 rounded-[16px] bg-transparent text-on-surface-variant hover:text-on-surface font-semibold text-xs sm:text-sm hover:bg-surface-container-low transition-all duration-200"
            >
              Later
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
