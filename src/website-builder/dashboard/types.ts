import type { Dispatch, SetStateAction } from 'react';
import type { SalonData } from '../types';

export type LandingTab =
  | 'overview'
  | 'website'
  | 'services'
  | 'bookings'
  | 'staff'
  | 'payments'
  | 'share'
  | 'settings'
  | 'referral'
  | 'branding';

export interface Appointment {
  id: string;
  time: string;
  customerName: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  depositPaid: number;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
}

export interface LandingProps {
  data: SalonData;
  setData: Dispatch<SetStateAction<SalonData>>;
  onNext: () => void;
  goToStep: (target: number) => void;
  onOpenStaffManagement: () => void;
  forcedActiveTab?: LandingTab;
  onTabChange?: (tab: LandingTab) => void;
}
