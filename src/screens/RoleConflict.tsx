import React from 'react';
import { motion } from 'motion/react';
import { 
  LogIn, 
  Mail, 
  HelpCircle, 
  Key, 
  AlertTriangle,
  UserX
} from 'lucide-react';
import { NavigationProps } from '../types';

export default function RoleConflict({ navigate }: NavigationProps) {
  // Mock data for the existing role
  const existingRole = "Customer"; 

  return (
    <div className="relative min-h-screen bg-surface-off-white overflow-hidden flex flex-col">
      {/* Subtle Ambient Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <svg 
          className="absolute top-[-10%] right-[-10%] w-[80%] opacity-20 text-primary-pink" 
          viewBox="0 0 200 200" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            fill="currentColor" 
            d="M44.7,-76.4C58.3,-69.2,70.1,-57.4,78.6,-43.3C87.1,-29.2,92.3,-12.8,91.2,3.2C90.1,19.2,82.7,34.8,72.4,48.3C62,61.8,48.7,73.1,33.5,79.5C18.3,85.9,1.1,87.4,-16.1,84.6C-33.3,81.8,-50.5,74.7,-64.1,62.8C-77.7,50.9,-87.7,34.2,-91.6,16.5C-95.5,-1.2,-93.3,-19.9,-84.9,-35.8C-76.5,-51.7,-61.9,-64.8,-45.9,-71C-29.9,-77.2,-12.5,-76.5,2.4,-80.7C17.3,-84.9,31.1,-83.6,44.7,-76.4Z" 
            transform="translate(100 100)" 
          />
        </svg>
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Visual Illustration Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-48 h-48 mb-8 flex items-center justify-center"
        >
          {/* Animated Background Pulse */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-surface-container-high rounded-full"
          />

          {/* Minimalist Conflict Illustration */}
          <div className="relative flex items-center justify-center">
            <div className="relative z-20 bg-white p-6 rounded-[22px] shadow-sm border border-outline-variant/20">
              <UserX className="w-16 h-16 text-primary" strokeWidth={1} />
            </div>
            
            {/* Floating Key/Access Indicator */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-2 bg-primary-container p-2.5 rounded-full shadow-md z-30"
            >
              <Key className="w-5 h-5 text-white" />
            </motion.div>

            {/* Warning Badge */}
            <div className="absolute -bottom-1 -left-1 bg-error-container p-2 rounded-full shadow-md z-30">
              <AlertTriangle className="w-4 h-4 text-error" />
            </div>
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col gap-3 max-w-[320px]"
        >
          <h1 className="text-xl font-bold text-on-surface">
            Role Already Assigned
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            यह email पहले से <span className="text-primary font-bold">[{existingRole}]</span> account से जुड़ी है।
          </p>
          <p className="text-sm text-on-surface-variant/80">
            एक email से केवल एक role बनाया जा सकता है। दूसरे role के लिए दूसरी email ID इस्तेमाल करें।
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col w-full gap-4 mt-10 max-w-sm"
        >
          <button 
            onClick={() => navigate('login')}
            className="w-full h-[56px] bg-primary text-white font-bold rounded-2xl active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
          >
            <LogIn className="w-5 h-5" />
            Login to Existing Account
          </button>
          
          <button 
            onClick={() => navigate('login')}
            className="w-full h-[56px] bg-secondary-pink text-primary font-bold rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
          >
            <Mail className="w-5 h-5" />
            Use Another Email
          </button>
        </motion.div>

        {/* Help Link */}
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-xs font-bold text-on-surface-variant flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <HelpCircle className="w-4 h-4" />
          Need help merging accounts?
        </motion.button>
      </main>
    </div>
  );
}
