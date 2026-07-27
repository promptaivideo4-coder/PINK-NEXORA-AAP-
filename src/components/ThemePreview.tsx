import React from 'react';
import { Theme } from '../types';

interface ThemePreviewProps {
  theme: Theme;
}

export default function ThemePreview({ theme }: ThemePreviewProps) {
  return (
    <div 
      className="w-full h-full overflow-hidden transition-all duration-300 flex flex-col mx-auto"
      style={{
        backgroundColor: theme.bgColor,
        color: theme.textColor,
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
          {theme.id}.luxesalon.com
        </div>
      </div>

      {/* Simulated Website Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 md:p-10 space-y-6 sm:space-y-8">
        
        {/* Demo Navigation Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pb-3 border-b border-black/15">
          <span className={`text-base sm:text-lg md:text-xl font-bold tracking-wider uppercase whitespace-nowrap ${theme.fontStyle}`} style={{ color: theme.primaryColor }}>
            Luxe Salon
          </span>
          <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-sm font-medium opacity-90 flex-wrap justify-center">
            <button>Home</button>
            <button>Services</button>
            <button>Gallery</button>
            <button 
              className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Book
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
          <div className="space-y-3">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-black/5 inline-block">
              Welcome to Luxe
            </span>
            <h1 className={`text-2xl sm:text-3xl md:text-5xl font-bold leading-tight ${theme.fontStyle}`}>
              Redefining Hair & Elegance
            </h1>
            <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
              {theme.tagline}. Experience master artistry in a sanctuary designed for pure relaxation.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button 
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md hover:opacity-95"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Explore Services
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg border border-black/10">
            <img 
              src={theme.image} 
              alt="Salon Hero" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
