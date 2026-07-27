import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Eye, Star, X, Laptop, Smartphone, Tablet, Sparkles, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationProps } from '../types';

interface Theme {
  id: string;
  name: string;
  description: string;
  image: string;
  recommended: boolean;
  tagline: string;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontStyle: string;
  features: string[];
}

export default function ThemeSelection({ navigate }: NavigationProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('classic-elegance');
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTab, setPreviewTab] = useState<'home' | 'services' | 'gallery' | 'booking'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const themes: Theme[] = [
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean, airy, and focused on your work.',
      tagline: 'Luminous & Free-spirited style for natural beauty',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvyCJ7cKwxcz80EPFX3_SsAiZI7j5BG8scu-eroiZOeA97VyqVD9R2y8TYR4yDsFrNjGmRREO2ZboLA-b83HfsaAlbSUwkrNW0uUrXXIY2tiW8Nve3whlWtcVG4sVfQCbFsGgmVABmXESQ2tlP_NGestX1dfHr-YB7bcsi3A6n_eVx-XCxxPHAttVorxQIj76QlsM1cZYBJcyUOJ8QOfPw2uHJmQ-rw4YSec0rnTKcZG24WjFzm9Dnvq3Q9Bn136eC68N1q7gv5dg',
      recommended: false,
      primaryColor: '#2D2A26',
      bgColor: '#FAF8F5',
      textColor: '#1A1816',
      accentColor: '#C5A059',
      fontStyle: 'font-sans',
      features: ['Spacious Layout', 'Soft Warm Tones', 'High Contrast Cards', 'Minimal Navigation']
    },
    {
      id: 'classic-elegance',
      name: 'Classic Elegance',
      description: 'Timeless sophistication for luxury salons.',
      tagline: 'Opulent & Refined luxury cuts for a statement look',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYjwetOJmL1oAyY1bVaI8WrK4Z4pNN4nMwEyWkeENyXoMif0X96hmpiT-Whp01-QojPyt-ofEQaiC7cK1GQdRjzvK3T9aNVFsO3c0bAA8Eb2IHmznvRcU4yeUx9HNmlnoz7TWIyqfTcGEvyMKRlTYkIoq7XggHYHytrmiSC1_m93UtbdcR0j0MYsv8NNORH9gBeNMvjk1ig6mOp5uK_Y9dOsm2VggPtJMswa4bQ_35hCnLC8FnwiFTpTdegVAyChsM6eY-_k8hUkk',
      recommended: true,
      primaryColor: '#b90064',
      bgColor: '#fcf9f8',
      textColor: '#1c1b1b',
      accentColor: '#db227b',
      fontStyle: 'font-serif',
      features: ['Gold & Rose Accents', 'Serif Display Fonts', 'Marble Aesthetic', 'Hero Video/Carousel Ready']
    },
    {
      id: 'bold-luxury',
      name: 'Bold Luxury',
      description: 'Make a statement with high-contrast design.',
      tagline: 'Avant-Garde Hair Artistry & High Energy Atmosphere',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkoIlcVMX0FoA7CDC8KPZ9CPiTvnPq9ag69qyMdFykSMR_lZxMyitgySGdMh_-D-MgKp0tTRPxtEh-c_Y8WbFkf_aymNlBZ9JShAogAnn6OGLQEQ2NLinqmzqvJXv0x6ngEQFWLTzOc7AQP9O_kzuLPO8IPMQ8tSO9zfU4aZvg1JSTb00uZSkBxIVznyzgnprU9ptdyF8kwkkgliSX9qNbtfwgaGDlpU0wxQEfaxTAnBt8hegTqQa_uz4AzRiK_1WcI4lpXT1VjAg',
      recommended: false,
      primaryColor: '#FF007A',
      bgColor: '#0F0F12',
      textColor: '#F3F0EF',
      accentColor: '#00F0FF',
      fontStyle: 'font-sans',
      features: ['Dark Mode Aesthetic', 'Neon Glowing Buttons', 'Bold Typography', 'Edge-to-edge Gallery']
    },
  ];

  const handleSelectTheme = (id: string, name: string) => {
    setSelectedTheme(id);
    setToastMessage(`"${name}" theme applied successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyFromPreview = () => {
    if (previewTheme) {
      handleSelectTheme(previewTheme.id, previewTheme.name);
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
      <main className="flex-grow pt-24 px-5 md:px-10 max-w-[1200px] mx-auto w-full">
        <div className="mb-8 text-center md:text-left max-w-2xl">
          <h2 className="text-[28px] md:text-[32px] font-bold text-on-surface mb-2 tracking-tight">Elevate Your Brand</h2>
          <p className="text-[16px] text-on-surface-variant">Select a starting theme for your salon website. All themes are fully customizable and designed to convert visitors into clients.</p>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-12">
          {themes.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            
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
                      onClick={() => handleSelectTheme(theme.id, theme.name)}
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
                style={{
                  backgroundColor: previewTheme.bgColor,
                  color: previewTheme.textColor,
                }}
              >
                {/* Simulated Browser Header */}
                <div className="h-9 bg-black/10 border-b border-black/10 flex items-center px-3 gap-2 shrink-0">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                  </div>
                  <div className="mx-auto bg-black/5 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 truncate max-w-[180px]">
                    {previewTheme.id}.luxesalon.com
                  </div>
                </div>

                {/* Simulated Website Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 md:p-10 space-y-6 sm:space-y-8 custom-scrollbar">
                  
                  {/* Demo Navigation Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pb-3 border-b border-black/15">
                    <span className={`text-base sm:text-lg md:text-xl font-bold tracking-wider uppercase whitespace-nowrap ${previewTheme.fontStyle}`} style={{ color: previewTheme.primaryColor }}>
                      Luxe Salon
                    </span>
                    <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-sm font-medium opacity-90 flex-wrap justify-center">
                      <button onClick={() => setPreviewTab('home')} className={previewTab === 'home' ? 'font-bold underline' : ''}>Home</button>
                      <button onClick={() => setPreviewTab('services')} className={previewTab === 'services' ? 'font-bold underline' : ''}>Services</button>
                      <button onClick={() => setPreviewTab('gallery')} className={previewTab === 'gallery' ? 'font-bold underline' : ''}>Gallery</button>
                      <button 
                        onClick={() => setPreviewTab('booking')}
                        className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: previewTheme.primaryColor }}
                      >
                        Book
                      </button>
                    </div>
                  </div>

                  {/* TAB CONTENT: HOME */}
                  {previewTab === 'home' && (
                    <div className="space-y-6 sm:space-y-10">
                      {/* Hero Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                        <div className="space-y-3">
                          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-black/5 inline-block">
                            Welcome to Luxe
                          </span>
                          <h1 className={`text-2xl sm:text-3xl md:text-5xl font-bold leading-tight ${previewTheme.fontStyle}`}>
                            Redefining Hair & Elegance
                          </h1>
                          <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                            {previewTheme.tagline}. Experience master artistry in a sanctuary designed for pure relaxation.
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button 
                              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md hover:opacity-95"
                              style={{ backgroundColor: previewTheme.primaryColor }}
                            >
                              Explore Services
                            </button>
                            <button className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm border border-black/20 hover:bg-black/5">
                              Our Story
                            </button>
                          </div>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg border border-black/10">
                          <img 
                            src={previewTheme.image} 
                            alt="Salon Hero" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Featured Services Grid */}
                      <div className="pt-6 border-t border-black/10">
                        <div className="text-center max-w-md mx-auto mb-6">
                          <h2 className="text-xl sm:text-2xl font-bold mb-1">Signature Treatments</h2>
                          <p className="text-[11px] sm:text-xs opacity-70">Crafted with premium organic formulas</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { name: 'Balayage & Glossing', price: '₹14,500+', desc: 'Custom hand-painted highlights' },
                            { name: 'Hydra-Gloss Facial', price: '₹8,500', desc: 'Deep hydration treatment' },
                            { name: 'Signature Blowout', price: '₹3,500', desc: 'Sleek & voluminous styling' },
                          ].map((s, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-black/5 hover:bg-black/10 transition-colors border border-black/5">
                              <h3 className="font-bold text-sm sm:text-base">{s.name}</h3>
                              <p className="text-[11px] sm:text-xs opacity-70 my-1.5">{s.desc}</p>
                              <span className="font-bold text-xs sm:text-sm" style={{ color: previewTheme.primaryColor }}>{s.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB CONTENT: SERVICES */}
                  {previewTab === 'services' && (
                    <div className="space-y-6 pt-2">
                      <h2 className="text-3xl font-bold text-center">Our Full Service Menu</h2>
                      <div className="max-w-2xl mx-auto space-y-4">
                        {[
                          { title: 'Haircuts & Styling', items: ['Master Haircut - ₹85', 'Blowout & Style - ₹60', 'Bridal Styling - ₹150'] },
                          { title: 'Coloring Services', items: ['Full Balayage - ₹220', 'Root Touch-up - ₹95', 'Gloss & Toner - ₹70'] },
                          { title: 'Nail & Spa Treatments', items: ['Luxury Gel Manicure - ₹55', 'Aromatherapy Pedicure - ₹75', 'Facial Glow Therapy - ₹120'] }
                        ].map((cat, i) => (
                          <div key={i} className="p-6 rounded-2xl bg-black/5 space-y-3">
                            <h3 className="font-bold text-lg" style={{ color: previewTheme.primaryColor }}>{cat.title}</h3>
                            <ul className="space-y-2 text-sm opacity-80">
                              {cat.items.map((it, j) => (
                                <li key={j} className="flex justify-between border-b border-black/5 pb-1">
                                  <span>{it.split(' - ')[0]}</span>
                                  <span className="font-bold">{it.split(' - ')[1]}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB CONTENT: GALLERY */}
                  {previewTab === 'gallery' && (
                    <div className="space-y-6 pt-2">
                      <h2 className="text-3xl font-bold text-center">Lookbook & Client Results</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <img src={previewTheme.image} className="w-full aspect-square object-cover rounded-xl" alt="Gallery 1" />
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCS1TSh0xAT-CaIARm8ZMOh8lkKgSpOKyr6uUhzigGX4Btksym-kT8sd7bBrnIG6ZL-Vf6osifrQdhPwOr7LuZBkuQ2fAgLcW8qdq-aJLwosgJCPvd_um3VMGqeUt4itxYlgOJKFSmBjrf3PQAl6MZlgCQjRSPcepRPexIOpeohFakeqHln1V90P66YBuW280jctHCr_nw6sPtJdM2vbcBhVOTG-vC0dfcrV4rtgunzGCsnUzVrkrOi7tKytY_9xhQdUIl0vAJyl48" className="w-full aspect-square object-cover rounded-xl" alt="Gallery 2" />
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6GxQrpGuWsf_jIb5LWWLw-SDCi3yNhBVu7NUInT1dcXNhUM8VWWnP9YfiF68otcLuEhLeptYybaFKHIIJOczC5nZh9HXvefD3bqyMeBkIRvd2CD7iR6WVBCFDvCdUYWuz26gR4AehSysjd_V18UqfacnDp47zojjbpITxS0csac6Bb9laGqNGOmeQcR6t0TM5uViysjGv4AE9-gdzsEQ0w4OEqyKuehkAQHoGpNUZN6W-49v0yZAtfroDFnBsEHReS-_JwtVcoM4" className="w-full aspect-square object-cover rounded-xl" alt="Gallery 3" />
                      </div>
                    </div>
                  )}

                  {/* TAB CONTENT: BOOKING */}
                  {previewTab === 'booking' && (
                    <div className="max-w-md mx-auto p-8 rounded-2xl bg-black/5 space-y-4 text-center">
                      <h2 className="text-2xl font-bold">Book Your Appointment</h2>
                      <p className="text-xs opacity-70">Select date & service below</p>
                      <input type="text" placeholder="Your Name" className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm bg-white text-black" />
                      <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm bg-white text-black" />
                      <button 
                        className="w-full py-3 rounded-xl font-bold text-white text-sm shadow-md"
                        style={{ backgroundColor: previewTheme.primaryColor }}
                      >
                        Confirm Booking
                      </button>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-center text-xs opacity-60 gap-2">
                    <p>© 2026 Luxe Salon. Powered by Nexora.</p>
                    <p>123 Beauty Blvd, Suite 100 • (555) 019-2834</p>
                  </div>

                </div>
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

