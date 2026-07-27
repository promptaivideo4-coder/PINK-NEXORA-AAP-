import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  activeTheme: Theme;
  setActiveTheme: (theme: Theme) => void;
  updateThemeSettings: (settings: Partial<Theme>) => void;
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
  const [activeTheme, setActiveTheme] = useState<Theme>(defaultTheme);

  const updateThemeSettings = (settings: Partial<Theme>) => {
    setActiveTheme(prev => ({ ...prev, ...settings }));
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme, updateThemeSettings }}>
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
