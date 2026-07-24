import React from 'react';
import { Bell, ArrowLeft, Settings, MoreVertical, Megaphone } from 'lucide-react';
import { ScreenName } from '../types';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
  showMore?: boolean;
  onBack?: () => void;
  navigate: (screen: ScreenName) => void;
  transparent?: boolean;
}

export default function TopBar({ 
  title = 'NEXORA SALONOS', 
  showBack = false, 
  showSettings = false,
  showMore = false,
  onBack,
  navigate,
  transparent = false
}: TopBarProps) {
  return (
    <header className={`sticky top-0 w-full z-50 border-b flex justify-between items-center px-5 h-16 transition-colors ${
      transparent 
        ? 'bg-transparent border-transparent' 
        : 'bg-surface/80 backdrop-blur-xl border-surface-container-highest'
    }`}>
      <div className="flex items-center gap-3">
        {showBack ? (
          <button onClick={onBack} className="text-primary hover:opacity-80 transition-opacity active:scale-95 p-1 -ml-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
        ) : (
          <button onClick={() => navigate('profile')} className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-surface-container shrink-0">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqgvGNG39kGIBgw1Oz3QIWte4icOiprO-WoXM9uFOtvqYe5LvvjgWPpCb_nwz3R7azRQVDECwN6oKp-5KV9u4TdiZOLQ8D0_vdd5lUHA7c5BzEn7bTM8ekQHbTaHvSlfHcAEGlfayEVy2AEoY4IXBgNM46M5EXNE6w3_8Uwy1U7K-rQpcNpkTj9Megb4bgdWwwAXfUDy6U8onZdBSX_v6YO1dWqr11-6DTM8PF5QgXsI1K2jpJmWMPYb20yvFig7ApTWtw2P5iBn0" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </button>
        )}
        <h1 className={`text-xl font-semibold tracking-tight ${showBack ? 'text-primary' : 'text-primary'}`}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {!showBack && (
          <button 
            onClick={() => navigate('marketing')} 
            className="flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all md:hidden cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Marketing</span>
          </button>
        )}

        {showSettings ? (
          <button onClick={() => navigate('settings')} className="text-on-surface-variant hover:opacity-80 transition-opacity p-1">
            <Settings className="w-6 h-6" />
          </button>
        ) : showMore ? (
          <button className="text-on-surface-variant hover:opacity-80 transition-opacity p-1">
             <MoreVertical className="w-6 h-6" />
          </button>
        ) : (
          <button className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full border border-surface"></span>
          </button>
        )}
        
        {/* Desktop Nav Links (Hidden on mobile) */}
        {!showBack && (
          <div className="hidden md:flex gap-8 items-center ml-4">
            <button onClick={() => navigate('dashboard')} className="text-on-surface-variant hover:opacity-80 text-sm font-medium cursor-pointer">Dashboard</button>
            <button onClick={() => navigate('bookings')} className="text-on-surface-variant hover:opacity-80 text-sm font-medium cursor-pointer">Bookings</button>
            <button onClick={() => navigate('services')} className="text-on-surface-variant hover:opacity-80 text-sm font-medium cursor-pointer">Services</button>
            <button 
              onClick={() => navigate('marketing')} 
              className="text-primary hover:opacity-85 text-sm font-bold flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full transition-all cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>Marketing</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
