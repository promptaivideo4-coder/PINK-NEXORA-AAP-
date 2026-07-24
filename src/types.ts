export type ScreenName = 
  | 'splash' 
  | 'welcome' 
  | 'login' 
  | 'register-stepper' 
  | 'dashboard' 
  | 'bookings' 
  | 'new-appointment' 
  | 'services' 
  | 'service-detail' 
  | 'new-service' 
  | 'help-center'
  | 'profile'
  | 'settings'
  | 'customers'
  | 'customer-profile'
  | 'theme-selection'
  | 'website-dashboard'
  | 'website-gallery'
  | 'wallet'
  | 'transaction-detail'
  | 'revenue-analytics'
  | 'analytics'
  | 'reviews'
  | 'install-app'
  | 'offline'
  | 'app-update'
  | 'staff'
  | 'new-staff'
  | 'staff-detail'
  | 'server-error'
  | 'component-library'
  | 'responsive-tables'
  | 'skeleton-showcase'
  | 'marketing';

export interface NavigationProps {
  navigate: (screen: ScreenName) => void;
}

export type CustomerHistory = {
  id: string;
  date: string;
  service: string;
  provider: string;
  price: string;
};

export type Customer = {
  id: string;
  name: string;
  type: 'VIP' | 'Gold Member' | 'New' | 'Standard';
  lastVisit?: string;
  upcomingVisit?: string;
  spend?: string;
  visits?: string;
  image?: string;
  initials?: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  history: CustomerHistory[];
};

export interface Offer {
  id: string;
  title: string;
  discount: string;
  code: string;
  status: 'Active' | 'Scheduled' | 'Draft' | 'Expired';
  startDate: string;
  endDate: string;
  category: string;
  imageUrl: string;
  views: number;
  shares: number;
  redeemed: number;
}

export interface FestivalTemplate {
  id: string;
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  category: 'Religious' | 'Seasonal' | 'Global' | 'Upcoming' | string;
  seasons: ('Spring' | 'Summer' | 'Monsoon' | 'Winter')[];
  discount: string;
  isPremium?: boolean;
  suggestedMessage: string;
  targetServices: string[];
}
