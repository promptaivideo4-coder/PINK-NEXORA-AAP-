import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Flower2 } from 'lucide-react';
import { NavigationProps } from '../types';
import ShaderBackground from '../components/ShaderBackground';
import { useLanguage } from '../contexts/LanguageContext';

export default function Welcome({ navigate }: NavigationProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-5 md:p-10 selection:bg-primary-container selection:text-white">
      {/* Animated WebGL Shader Canvas Background */}
      <ShaderBackground opacity={0.35} />

      {/* Background Radial Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(230,0,126,0.1),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(230,0,126,0.08),transparent_35%)] pointer-events-none z-0" />

      <main className="w-full max-w-md mx-auto flex flex-col items-center flex-grow justify-center relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-12"
        >
          <div className="w-16 h-16 rounded-[18px] bg-primary-container text-on-primary-container flex items-center justify-center mb-6 shadow-lg">
            <Flower2 className="w-8 h-8" />
          </div>
          <h1 className="text-[28px] md:text-[32px] font-bold text-on-surface mb-2 tracking-tight">Nexora</h1>
          <p className="text-xl font-semibold text-on-surface-variant opacity-80">{t('elevate_business')}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col gap-4"
        >
          <button 
            onClick={() => navigate('login')}
            className="w-full h-14 bg-[#E6007E] text-white text-base font-semibold rounded-[18px] shadow-[0px_8px_24px_rgba(230,0,126,0.25)] hover:shadow-[0px_10px_30px_rgba(230,0,126,0.35)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {t('login')}
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => navigate('register-stepper')}
            className="w-full h-14 bg-transparent border border-outline-variant text-on-surface text-base font-semibold rounded-[18px] hover:bg-surface-container-low transition-colors duration-300 flex items-center justify-center"
          >
            {t('register')}
          </button>

          <div className="flex items-center w-full my-4">
            <div className="flex-grow h-px bg-surface-variant"></div>
            <span className="px-4 text-on-surface-variant text-[13px] font-medium uppercase tracking-wider opacity-60">{t('or')}</span>
            <div className="flex-grow h-px bg-surface-variant"></div>
          </div>

          <button className="w-full h-14 bg-surface-container-lowest border border-surface-variant text-on-surface text-base font-medium rounded-[18px] shadow-[0px_4px_12px_rgba(0,0,0,0.02)] hover:bg-surface-container-low transition-colors duration-300 flex items-center justify-center gap-3 relative">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoU9JRc12ciRUzv3P8QlPG0y8JYauk6BmvPOXKPBqiCUdznayXhtI7eqdRTNUvX_tMnxdcyZC8U2hr0QqbaRGiu0ZY22npuFkEaCDgwYyX9N7A_BbrMZyltuCI1AL5dmk4MXpNTc8fL26f00Q5dmpQQsN5OPk9C6WQGidt6clXKDIYapUNEEixmJjrCxbUXBlqmq7-WDnpxTHNt9rXwCKUOKnwf5jKitDJxGf-u4raeccLyMbrTIDvDk1-IpSMbB2GCUMEZa4-dpk" alt="Google" className="w-5 h-5 absolute left-6" />
            {t('continue_with_google')}
          </button>

          <button className="w-full h-14 bg-[#000000] text-white text-base font-medium rounded-[18px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:bg-[#1A1A1A] transition-colors duration-300 flex items-center justify-center gap-3 relative">
             {/* Simulating Apple Icon with standard Lucide placeholder as we don't have an apple icon in lucide */}
            <svg className="w-5 h-5 absolute left-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
              <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4z"/>
            </svg>
            {t('continue_with_apple')}
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <button 
             onClick={() => navigate('dashboard')}
             className="text-on-surface-variant hover:text-primary text-[13px] font-medium transition-colors duration-200 flex items-center gap-1 group"
          >
            {t('explore_demo')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>

          <button
            onClick={() => navigate('install-app')}
            className="px-4 py-1.5 rounded-full bg-surface-container-lowest/80 border border-outline-variant/30 text-xs font-semibold text-primary hover:bg-primary-fixed/20 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Flower2 className="w-3.5 h-3.5" />
            <span>{t('install_app')}</span>
          </button>
        </motion.div>
      </main>
    </div>
  );
}
