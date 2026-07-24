import React from 'react';
import { LayoutDashboard, Calendar, Wallet, BarChart2, Menu } from 'lucide-react';
import { ScreenName } from '../types';

interface BottomNavProps {
  currentScreen: ScreenName;
  navigate: (screen: ScreenName) => void;
}

export default function BottomNav({ currentScreen, navigate }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'revenue-analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'help-center', icon: Menu, label: 'More' },
  ];

  return (
    <nav className="md:hidden bg-surface/90 backdrop-blur-2xl fixed bottom-0 w-full z-40 rounded-t-xl shadow-[0px_-4px_20px_rgba(0,0,0,0.03)] flex justify-around items-center px-2 py-3 pb-[env(safe-area-inset-bottom,20px)] border-t border-surface-container-highest/50">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id as ScreenName)}
            className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-150 p-2 rounded-xl w-16 ${
              isActive
                ? 'text-primary font-semibold bg-primary/5'
                : 'text-on-surface-variant hover:bg-primary-fixed/10'
            }`}
          >
            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-primary/20' : ''}`} />
            <span className="text-[11px] font-medium leading-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
