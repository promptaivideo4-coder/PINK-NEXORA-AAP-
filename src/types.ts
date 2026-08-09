export type ScreenName = 
  | 'splash' 
  | 'welcome' 
  | 'login' 
  | 'reset-password'
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
  | 'cancellation-refund-policy'
  | 'role-conflict'
  | 'website-dashboard'
  | 'website-gallery'
  | 'wallet'
  | 'transaction-detail'
  | 'revenue-analytics'
  | 'analytics'
  | 'reviews'
  | 'install-app'
  | 'app-update'
  | 'staff'
  | 'new-staff'
  | 'staff-detail'
  | 'staff-schedule'
  | 'staff-attendance'
  | 'leave-swap'
  | 'staff-payroll'
  | 'staff-payroll-detail'
  | 'staff-payroll-breakdown'
  | 'staff-roles-access'
  | 'server-error'
  | 'marketing'
  | 'nearby-salons'
  | 'shop-location';

export const VALID_SCREENS: ScreenName[] = [
  'splash', 'welcome', 'login', 'reset-password', 'register-stepper', 'dashboard',
  'bookings', 'new-appointment', 'services', 'service-detail', 'new-service',
  'help-center', 'profile', 'settings', 'customers', 'customer-profile',
  'theme-selection', 'cancellation-refund-policy', 'role-conflict',
  'website-dashboard', 'website-gallery', 'wallet', 'transaction-detail',
  'revenue-analytics', 'analytics', 'reviews', 'install-app',
  'app-update', 'staff', 'new-staff', 'staff-detail', 'staff-schedule', 'staff-attendance', 'leave-swap', 'staff-payroll', 'staff-payroll-detail', 'staff-payroll-breakdown', 'staff-roles-access', 'server-error',
  'marketing', 'nearby-salons', 'shop-location'
];

export interface Theme {
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
  fontSizeBase?: number;
  fontSizeHeading?: number;
  features: string[];
}

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
  whatsappNumber?: string;
  email: string;
  address: string;
  city?: string;
  joinDate?: string;
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

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
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

export interface Service {
  id: string;
  name: string;
  price: string;
  duration: string;
  category: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
}

export interface WebsiteConfig {
  businessName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroCtaText: string;
  heroCtaLink: string;
  services: Service[];
  reviews: Review[];
  contact: {
    address: string;
    phone: string;
    socialLinks: { instagram: string; facebook: string; tiktok: string; };
    openingHours: string;
    locationMap: string;
  };
  theme: {
    primaryColor: string;
    accentColor: string;
    textColor: string;
    backgroundColor: string;
    fontStyle: string;
    fontSizeBase: number;
    fontSizeHeading: number;
  };
  layoutToggles: {
    showHero: boolean;
    showServices: boolean;
    showReviews: boolean;
    showContact: boolean;
    showGallery: boolean;
    showFooter: boolean;
  };
}
