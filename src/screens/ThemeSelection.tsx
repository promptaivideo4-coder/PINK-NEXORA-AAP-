import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Eye, Star, X, Laptop, Smartphone, Tablet, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationProps, Theme } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SALON_THEMES } from '../lib/siteTemplates';
import ThemePreview from '../components/ThemePreview';

export default function ThemeSelection({ navigate }: NavigationProps) {
  const { activeTheme, updateThemeSettings } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTab, setPreviewTab] = useState<'home' | 'services' | 'gallery' | 'booking'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const themes: Theme[] = SALON_THEMES;

  const handleSelectTheme = (theme: Theme) => {
    updateThemeSettings(theme);
    setToastMessage(`"${theme.name}" theme applied successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
    const handleApplyFromPreview = () => {
    if (previewTheme) {
      handleSelectTheme(previewTheme);
      setPreviewTheme(null);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-sans antialiased pb-24 md:pb-0 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg border border-emerald-400/30 flex items-center gap-3 text-sm font-semibold"
          >
            <CheckCircle className="w-5 h-5 text-white shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top App Bar */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-outline-variant fixed top-0 w-full flex justify-between items-center px-5 md:px-10 h-16 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('website-dashboard')}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:opacity-80 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[24px] font-semibold tracking-tight text-primary">Choose a Theme</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('website-dashboard')}
            className="text-primary hover:opacity-80 transition-opacity text-[15px] md:text-[18px] font-semibold px-4 py-2"
          >
            Done
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-24 px-4 max-w-md mx-auto w-full">
        <div className="mb-8 text-center md:text-left max-w-2xl">
          <h2 className="text-[28px] md:text-[32px] font-bold text-on-surface mb-2 tracking-tight">Elevate Your Brand</h2>
          <p className="text-[16px] text-on-surface-variant">Select a starting theme for your salon website. All themes are fully customizable and designed to convert visitors into clients.</p>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-12">
          {themes.map((theme) => {
            const isSelected = activeTheme.id === theme.id;
            
            return (
              <div 
                key={theme.id}
                className={`group bg-surface-container-lowest rounded-2xl flex flex-col overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isSelected 
                    ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20' 
                    : 'border border-outline-variant/60 shadow-sm'
                }`}
              >
                {theme.recommended && (
                  <div className="absolute top-4 left-4 z-10 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Star className="w-3.5 h-3.5 fill-white" /> Recommended
                  </div>
                )}
                
                <div className="relative aspect-[4/5] bg-surface-container-low w-full overflow-hidden">
                  <img 
                    src={theme.image} 
                    alt={theme.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Actions (Always visible on mobile, hover on desktop) */}
                  <div className="absolute inset-x-0 bottom-0 p-4 flex justify-between gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transform translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-300">
                    <button 
                      onClick={() => setPreviewTheme(theme)}
                      className="flex-1 bg-white/95 text-on-surface text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 hover:bg-white transition-all shadow-md active:scale-95"
                    >
                      <Eye className="w-4 h-4 text-primary" /> 
                      <span>Preview</span>
                    </button>

                    <button 
                      onClick={() => handleSelectTheme(theme)}
                      className={`flex-1 text-[13px] font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                        isSelected 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-primary-container text-white hover:opacity-90'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Select</span>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[18px] font-bold text-on-surface">{theme.name}</h3>
                    {isSelected && (
                      <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
                        <CheckCircle className="w-4 h-4 fill-primary text-white" />
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-on-surface-variant font-medium">{theme.description}</p>
                  
                  <div className="pt-2 border-t border-surface-variant flex flex-wrap gap-1.5">
                    {theme.features.slice(0, 3).map((feat, i) => (
                      <span key={i} className="text-[11px] font-medium bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-md">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* FULL INTERACTIVE THEME PREVIEW MODAL */}
      <AnimatePresence>
        {previewTheme && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col overflow-hidden">
            
            {/* Modal Header Bar */}
            <div className="bg-surface/95 border-b border-outline-variant px-3 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-md">
              <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPreviewTheme(null)}
                    className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-on-surface flex items-center gap-2">
                      <span className="truncate max-w-[140px] sm:max-w-none">{previewTheme.name}</span>
                      {previewTheme.recommended && (
                        <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/20">
                          Recommended
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                {/* Apply Theme Action for Mobile top bar */}
                <div className="flex sm:hidden items-center">
                  <button
                    onClick={handleApplyFromPreview}
                    className="bg-primary text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                </div>
              </div>

              {/* Viewport Device Toggle */}
              <div className="flex items-center bg-surface-container-high rounded-xl p-1 border border-outline-variant overflow-x-auto max-w-full">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                    deviceView === 'desktop' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  onClick={() => setDeviceView('tablet')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                    deviceView === 'tablet' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" /> Tablet
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                    deviceView === 'mobile' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>

              {/* Apply Theme Action for Desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={handleApplyFromPreview}
                  className="bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Apply Theme</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Device Stage Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-8 flex justify-center items-center bg-slate-900/70 custom-scrollbar w-full">
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border border-white/20 flex flex-col mx-auto max-w-full ${
                  deviceView === 'desktop' ? 'w-full max-w-[1100px] min-h-[700px]' :
                  deviceView === 'tablet' ? 'w-full max-w-[768px] min-h-[650px]' :
                  'w-full max-w-[360px] min-h-[580px]'
                }`}
              >
                <ThemePreview theme={previewTheme} />
              </motion.div>
            </div>

            {/* Modal Bottom Action Footer */}
            <div className="bg-surface/95 border-t border-outline-variant px-6 py-4 flex justify-between items-center shrink-0">
              <div className="text-xs font-medium text-on-surface-variant">
                Theme: <strong className="text-on-surface">{previewTheme.name}</strong>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewTheme(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-surface-container-high text-on-surface hover:bg-surface-variant"
                >
                  Close Preview
                </button>
                <button
                  onClick={handleApplyFromPreview}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Theme</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

