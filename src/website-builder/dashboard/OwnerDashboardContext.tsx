import { createContext, useContext, type ReactNode } from 'react';
import type { OwnerDashboardApi } from './useOwnerDashboardState';

const OwnerDashboardContext = createContext<OwnerDashboardApi | null>(null);

export function OwnerDashboardProvider({
  value,
  children,
}: {
  value: OwnerDashboardApi;
  children: ReactNode;
}) {
  return (
    <OwnerDashboardContext.Provider value={value}>
      {children}
    </OwnerDashboardContext.Provider>
  );
}

export function useOwnerDashboard(): OwnerDashboardApi {
  const ctx = useContext(OwnerDashboardContext);
  if (!ctx) {
    throw new Error('useOwnerDashboard must be used inside OwnerDashboardProvider');
  }
  return ctx;
}
