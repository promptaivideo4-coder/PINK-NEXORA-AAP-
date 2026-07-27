import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Theme } from '../types';

export type SystemTheme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  activeTheme: Theme;
  systemTheme: SystemTheme;
  setSystemTheme: (theme: SystemTheme) => void;
  updateThemeSettings: (settings: Partial<Theme>) => void;
  resetToDefault: () => void;
}

const defaultTheme: Theme = {
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
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('nexora-active-theme');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse active theme', e);
      }
    }
    return defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<SystemTheme>(() => {
    const saved = localStorage.getItem('nexora-theme') as SystemTheme;
    return saved || 'light';
  });

  React.useEffect(() => {
    localStorage.setItem('nexora-active-theme', JSON.stringify(activeTheme));
    localStorage.setItem('nexora-theme', systemTheme);
    
    const root = document.documentElement;
    
    // Handle Light/Dark Class
    const isDark = systemTheme === 'dark' || (systemTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Apply branded primary and accent colors to the Material Design variables used in index.css
    root.style.setProperty('--md-sys-color-primary', activeTheme.primaryColor);
    root.style.setProperty('--md-sys-color-on-primary', '#FFFFFF');
    root.style.setProperty('--md-sys-color-primary-container', `${activeTheme.primaryColor}20`);
    
    // Secondary/Accent
    root.style.setProperty('--md-sys-color-secondary', activeTheme.accentColor);
    
    // Set custom theme variables
    root.style.setProperty('--theme-primary', activeTheme.primaryColor);
    root.style.setProperty('--theme-accent', activeTheme.accentColor);
  }, [activeTheme, systemTheme]);

  const updateThemeSettings = (settings: Partial<Theme>) => {
    setActiveTheme(prev => ({ ...prev, ...settings }));
  };

  const resetToDefault = () => {
    setActiveTheme(defaultTheme);
    setSystemTheme('light');
  };

  return (
    <ThemeContext.Provider value={{ 
      activeTheme, 
      systemTheme, 
      setSystemTheme, 
      updateThemeSettings, 
      resetToDefault 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
