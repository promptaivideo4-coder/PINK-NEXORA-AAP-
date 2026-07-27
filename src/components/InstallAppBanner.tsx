import React, { useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface InstallAppBannerProps {
  navigate: (path: string) => void;
}

export default function InstallAppBanner({ navigate }: InstallAppBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useLanguage();

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-xl shadow-md relative overflow-hidden mb-6 flex items-center justify-between group cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/app/owner/install')}>
      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <h4 className="text-lg font-bold leading-tight">{t('download_app')}</h4>
          <p className="text-sm text-blue-50 mt-1 max-w-sm">{t('download_app_desc')}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
        <button className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors whitespace-nowrap flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); navigate('/app/owner/install'); }}>
          {t('install_now')}
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          aria-label="Close advertisement"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
