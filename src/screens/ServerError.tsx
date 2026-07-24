import React, { useState } from 'react';
import { NavigationProps } from '../types';
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function ServerError({ navigate }: NavigationProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      navigate('dashboard');
    }, 1200);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans p-6">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-fixed-dim/20 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-fixed/30 blur-[120px]" />
      </div>

      {/* Top Back Navigation */}
      <button 
        onClick={() => navigate('dashboard')}
        className="absolute top-6 left-6 z-20 p-2.5 rounded-full bg-white/80 backdrop-blur-md border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-all shadow-xs flex items-center gap-2 text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Dashboard</span>
      </button>

      {/* Error Content Container */}
      <main className="w-full max-w-md z-10 flex flex-col items-center text-center">
        {/* Illustration Area */}
        <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-container-high rounded-full opacity-50 blur-xl animate-pulse" />
          {/* High-end Fractured Glass Sphere Illustration */}
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAPpsflvlquINS5SNigoeb1giL0l_LhY1ULcgykPz4E4k3wwnPFn9g8YRzpymClf-z4fM02ON_CBFBh8devb_T2vmzD6iKwm2u8wfeLv0IYDzUt2w1v8OF4zG5f1MsNzg3I38F5bpCi5dejrTwzi1viAWnpOYEc2xek4423KMnhTjPrQHrJtYxBdrSppcnJQF73hbnPBzcvuzlATVKsM7H4MQgPuazHnoYUZaDpQ6p0x6uX6Fb34q1MpotDVFNPgtXD1mV4tXN0vU" 
            alt="Server Error Illustration" 
            className="w-full h-full object-contain relative z-10 drop-shadow-2xl" 
          />
        </div>

        {/* Typography */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-3 tracking-tight">
          Something Went Wrong
        </h1>
        <p className="text-sm text-on-surface-variant max-w-[320px] mx-auto mb-8 leading-relaxed font-medium">
          We're experiencing a temporary server issue. Please try again in a few moments.
        </p>

        {/* CTA Button */}
        <button 
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full sm:w-auto min-w-[200px] bg-primary-container text-on-primary-container font-bold text-sm py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2.5 group disabled:opacity-80"
        >
          <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          <span>{isRetrying ? 'Reconnecting...' : 'Retry Connection'}</span>
        </button>

        {/* Secondary Action */}
        <button 
          onClick={() => navigate('dashboard')}
          className="mt-6 text-xs font-bold text-primary hover:text-primary-container transition-colors inline-block border-b border-transparent hover:border-primary-container pb-0.5"
        >
          Return to Dashboard
        </button>
      </main>
    </div>
  );
}
