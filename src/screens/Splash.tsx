import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Flower2 } from 'lucide-react';
import { NavigationProps } from '../types';
import ShaderBackground from '../components/ShaderBackground';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Splash({ navigate }: NavigationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSupabaseConfigured()) {
        navigate('welcome');
        return;
      }
      supabase.auth.getSession()
        .then(({ data: { session } }) => navigate(session ? 'dashboard' : 'welcome'))
        .catch(() => navigate('welcome'));
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden selection:bg-primary-container selection:text-white pt-safe pb-safe">
      {/* Animated Shader Background */}
      <ShaderBackground opacity={0.65} />

      <div className="z-10 flex flex-col items-center justify-center flex-1 w-full px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-24 h-24 md:w-32 md:h-32 mb-8 text-[#e6007e]"
        >
          <Flower2 className="w-full h-full" strokeWidth={1} />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl md:text-4xl font-bold text-white tracking-[0.3em] uppercase mb-4 text-center drop-shadow-2xl"
        >
          Nexora
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-base text-white/60 tracking-wider font-light text-center max-w-sm"
        >
          Elevating the Art of Salon Management
        </motion.p>
      </div>

      {/* Loading Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative w-full z-10 h-10 flex items-center justify-center"
      >
        <motion.div
          className="h-[2px] bg-gradient-to-r from-transparent via-[#e6007e] to-transparent shadow-[0_0_10px_rgba(230,0,126,0.5)] rounded-full"
          animate={{ width: ['0px', '150px', '0px'], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="z-10 absolute bottom-8 w-full text-center"
      >
        <span className="text-white/30 uppercase tracking-widest text-[10px] font-medium">
          Version 2.4.0
        </span>
      </motion.div>
    </div>
  );
}
