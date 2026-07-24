import React from 'react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { ScreenName, NavigationProps } from '../types';

interface LayoutProps extends NavigationProps {
  children: React.ReactNode;
  currentScreen: ScreenName;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSettings?: boolean;
  showMore?: boolean;
  hideBottomNav?: boolean;
  transparentTopBar?: boolean;
}

export default function Layout({ 
  children, 
  currentScreen, 
  navigate, 
  title, 
  showBack, 
  onBack,
  showSettings,
  showMore,
  hideBottomNav = false,
  transparentTopBar = false
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col pb-24 md:pb-0">
      <TopBar 
        title={title} 
        showBack={showBack} 
        onBack={onBack}
        navigate={navigate}
        showSettings={showSettings}
        showMore={showMore}
        transparent={transparentTopBar}
      />
      
      <main className="flex-1 w-full max-w-[1200px] mx-auto w-full flex flex-col">
        {children}
      </main>

      {!hideBottomNav && (
        <BottomNav currentScreen={currentScreen} navigate={navigate} />
      )}
    </div>
  );
}
