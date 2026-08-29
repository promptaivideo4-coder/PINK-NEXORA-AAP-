import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Sparkles, ArrowRight, Check, Copy, ExternalLink, Calendar, Users,
  ClipboardList, Scissors, CreditCard, Share2, Settings, HelpCircle, Bell, Plus,
  Search, Filter, Trash2, CheckCircle2, AlertCircle, X, Shield, RefreshCw,
  Smartphone, Monitor, ChevronRight, Clock, Star, Phone, Mail, MapPin, Laptop,
  QrCode, DollarSign, TrendingUp, Sliders, Send, MessageSquare, Mic, Gift, Menu,
  Grid, Pencil, Download, Palette
} from 'lucide-react';
import DefaultOwnerPhoto from '../components/DefaultOwnerPhoto';
import { OwnerDashboardProvider, useOwnerDashboard } from './OwnerDashboardContext';
import { useOwnerDashboardState } from './useOwnerDashboardState';
import DashboardModals from './DashboardModals';
import type { LandingProps } from './types';

const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const WebsiteTab = lazy(() => import('./tabs/WebsiteTab'));
const ServicesTab = lazy(() => import('./tabs/ServicesTab'));
const BookingsTab = lazy(() => import('./tabs/BookingsTab'));
const StaffTab = lazy(() => import('./tabs/StaffTab'));
const PaymentsTab = lazy(() => import('./tabs/PaymentsTab'));
const ShareTab = lazy(() => import('./tabs/ShareTab'));
const SettingsTab = lazy(() => import('./tabs/SettingsTab'));
const ReferralTab = lazy(() => import('./tabs/ReferralTab'));
const BrandingTab = lazy(() => import('./tabs/BrandingTab'));

function TabFallback() {
  return (
    <div className="w-full py-24 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#ac0053] border-t-transparent animate-spin" />
    </div>
  );
}

function OwnerDashboardShell() {
  const {
    data, setData, goToStep, onOpenStaffManagement,
    activeTab, setActiveTab, mode, setMode, copied,
    appointments, setAppointments,
    showNewAppointmentModal, setShowNewAppointmentModal,
    showAddServiceModal, setShowAddServiceModal,
    showNotifications, setShowNotifications,
    showHelpCenter, setShowHelpCenter,
    showLiveSiteModal, setShowLiveSiteModal,
    newCustName, setNewCustName,
    newCustPhone, setNewCustPhone,
    newSelectedService, setNewSelectedService,
    newSelectedStaff, setNewSelectedStaff,
    newSelectedTime, setNewSelectedTime,
    newServiceName, setNewServiceName,
    newServiceCategory, setNewServiceCategory,
    newServicePrice, setNewServicePrice,
    newServiceDuration, setNewServiceDuration,
    newServiceDesc, setNewServiceDesc,
    newServiceFeatured, setNewServiceFeatured,
    servicesSubTab, setServicesSubTab,
    servicesSearchQuery, setServicesSearchQuery,
    servicesSelectedCategory, setServicesSelectedCategory,
    servicesViewLayout, setServicesViewLayout,
    editingService, setEditingService,
    editingPackage, setEditingPackage,
    showServiceDrawer, setShowServiceDrawer,
    showPackageDrawer, setShowPackageDrawer,
    isImprovingWithAI,
    newPackageName, setNewPackageName,
    newPackagePrice, setNewPackagePrice,
    newPackageDuration, setNewPackageDuration,
    newPackageDesc, setNewPackageDesc,
    showVoiceModal, setShowVoiceModal,
    voiceInputText, setVoiceInputText,
    isVoiceListening, setIsVoiceListening,
    showAiSuggestModal, setShowAiSuggestModal,
    aiSuggestArchetype, setAiSuggestArchetype,
    isGeneratingSuggestions, setIsGeneratingSuggestions,
    generatedSuggestions, setGeneratedSuggestions,
    selectedSuggestionIds, setSelectedSuggestionIds,
    notifications, setNotifications,
    paymentsFilter, setPaymentsFilter,
    paymentsSearch, setPaymentsSearch,
    selectedPaymentId, setSelectedPaymentId,
    liveUrl,
    polishingField, polishingStatus, handlePolishText,
    handleCopyLink, handleCreateAppointment,
    handleSaveService, handleDuplicateService, handleDeleteService,
    handleSavePackage, handleDuplicatePackage, handleDeletePackage,
    handleImproveDescriptionWithAI, handleImprovePackageDescWithAI,
    handleParseVoiceCommand, handleTriggerSuggestions, handleAddSuggestionsToCatalog,
    handleToggleStaffStatus, handleUpdateApptStatus, handleDeleteAppt,
    totalBookingsValue, totalAdvanceCollected, totalRemainingAtSalon,
    activeServicesCount, staffTeamCount, todayActiveBookings
  } = useOwnerDashboard();

  return (
    <div className="h-screen bg-[#f9f8f6] flex flex-col md:flex-row font-sans text-gray-900 overflow-hidden relative">
      
      {/* LEFT SIDEBAR: Premium Docked Menu */}
      <nav className="hidden md:flex flex-col h-screen w-64 shrink-0 bg-white border-r border-gray-200 py-6 z-30 select-none shadow-xs justify-between">
        <div>
          <div className="px-6 mb-6">
            <div className="flex items-center gap-2 text-[#ac0053] mb-1">
              <Sparkles className="w-5 h-5" />
              <span className="font-extrabold text-lg tracking-tight">Nexora Salon</span>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Premium Dashboard
            </p>
          </div>

          <div className="px-4 mb-6">
            <button 
              onClick={() => setShowNewAppointmentModal(true)}
              className="w-full bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-[#ac0053]/20"
            >
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          </div>

          <ul className="flex flex-col gap-1 px-3">
            <li>
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'overview' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ClipboardList className="w-4.5 h-4.5" />
                <span>Overview</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('website')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'website' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Laptop className="w-4.5 h-4.5" />
                <span>My Live Website</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'services' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Scissors className="w-4.5 h-4.5" />
                <span>Services & Catalog</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'bookings' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4.5 h-4.5" />
                <span>Daily Planner</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'staff' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>Staff Roster</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('payments')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'payments' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CreditCard className="w-4.5 h-4.5" />
                <span>Payments Ledgers</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('share')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'share' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Share2 className="w-4.5 h-4.5" />
                <span>Share & Marketing</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'settings' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4.5 h-4.5" />
                <span>Salon Rules</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('referral')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'referral' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Gift className="w-4.5 h-4.5" />
                <span>Refer & Earn</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('branding')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'branding' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Palette className="w-4.5 h-4.5" />
                <span>Branding</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="px-4">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Onboarding Wizard</p>
            <button 
              onClick={() => goToStep(2)} 
              className="text-[#ac0053] hover:underline text-[11px] font-bold block mx-auto"
            >
              Re-run Onboarding
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT: Top navbar + scrollable dynamic center viewport */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        
        {/* TOP BAR GREETING & VIEW SITE BUTTON */}
        <header className="h-16 bg-white border-b border-gray-200 shrink-0 flex items-center justify-between px-6 z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-700" onClick={() => setActiveTab('overview')}>
              <Sparkles className="w-6 h-6 text-[#ac0053]" />
            </button>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 md:text-base tracking-tight flex items-center gap-1.5">
                Good morning, {data.ownerName || 'Partner'}
                <span className="animate-bounce inline-block">👋</span>
              </h2>
              <p className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-wider">{data.salonName || 'Your Salon'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowLiveSiteModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 border border-[#ac0053]/20 rounded-xl text-xs font-bold text-[#ac0053] hover:bg-[#ffd9e1]/20 transition-all shadow-3xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Live Website
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {/* Notifications dropdown menu */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 text-xs"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-2">
                      <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
                      <button 
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-xs text-[#ac0053] hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-2 rounded-xl border ${n.read ? 'bg-white border-gray-100' : 'bg-[#ffd9e1]/10 border-[#ac0053]/20'}`}>
                          <p className={`text-gray-800 ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.text}</p>
                          <span className="text-[10px] text-gray-400 font-semibold">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowHelpCenter(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              {data.ownerPhotoUrl ? (
                <img src={data.ownerPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <DefaultOwnerPhoto size={32} />
              )}
            </div>
          </div>
        </header>

        {/* VIEWPORT CONTENT CONTAINER */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 pb-20">
          
          {/* MOBILE NAVIGATION PILLS */}
          <div className="flex md:hidden bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto gap-1 mb-4 shrink-0 no-scrollbar">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'overview' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('website')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'website' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Live Website
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'services' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Services
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'bookings' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Planner
            </button>
            <button 
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'staff' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Staff
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'payments' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Payments
            </button>
            <button 
              onClick={() => setActiveTab('share')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'share' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Share
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'settings' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Settings
            </button>
            <button 
              onClick={() => setActiveTab('referral')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'referral' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Refer & Earn
            </button>
            <button 
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'branding' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Branding
            </button>
          </div>

          <AnimatePresence mode="wait">
            
            <Suspense fallback={<TabFallback />}>
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'website' && <WebsiteTab />}
              {activeTab === 'services' && <ServicesTab />}
              {activeTab === 'bookings' && <BookingsTab />}
              {activeTab === 'staff' && <StaffTab />}
              {activeTab === 'payments' && <PaymentsTab />}
              {activeTab === 'share' && <ShareTab />}
              {activeTab === 'settings' && <SettingsTab />}
              {activeTab === 'referral' && <ReferralTab />}
              {activeTab === 'branding' && <BrandingTab />}
            </Suspense>
          </AnimatePresence>
        </div>
      </div>

      <DashboardModals />
    </div>
  );
}

/** Published-owner dashboard (screens 18–25 + services/staff tabs). */
export default function OwnerDashboard(props: LandingProps) {
  const api = useOwnerDashboardState(props);
  return (
    <OwnerDashboardProvider value={api}>
      <OwnerDashboardShell />
    </OwnerDashboardProvider>
  );
}
