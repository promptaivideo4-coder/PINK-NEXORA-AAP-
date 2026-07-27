import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Clock, 
  DollarSign, 
  Users, 
  X, 
  Check, 
  Bell, 
  Sparkles, 
  Calendar, 
  ChevronRight,
  Layers,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ComponentLibrary({ navigate }: NavigationProps) {
  // Form element state
  const [clientName, setClientName] = useState('Jane Doe');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceType, setServiceType] = useState('Balayage & Styling');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [vipClient, setVipClient] = useState(true);

  // Interactive Feedback Toast
  const [actionToast, setActionToast] = useState('');
  const triggerToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(''), 3000);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Layout currentScreen="component-library" navigate={navigate} title="Component Library" showBack onBack={() => navigate('settings')}>
      <div className="px-4 py-6 max-w-md mx-auto w-full relative min-h-[calc(100vh-120px)] flex flex-col pb-32">
        
        {/* Page Title & Intro */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 text-primary-container text-xs font-bold mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Nexora Design System v2.4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Component Library
            </h1>
            <p className="text-sm text-on-surface-variant max-w-2xl mt-1.5 leading-relaxed font-medium">
              A curated showcase of Nexora's design system tokens in action, designed for modern salon management.
            </p>
          </div>

          <button
            onClick={() => triggerToast('Design tokens copied to clipboard')}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/50 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2 shadow-xs"
          >
            <Sliders className="w-4 h-4 text-primary" />
            <span>Inspect Token Spec</span>
          </button>
        </div>

        {/* Toast Alert */}
        <AnimatePresence>
          {actionToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-primary-container text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{actionToast}</span>
              </div>
              <button onClick={() => setActionToast('')} className="p-1 hover:bg-white/20 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid Showcase Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Column 1: Buttons & Interactive Controls */}
          <div className="md:col-span-5 flex flex-col gap-8">
            
            {/* Buttons Section */}
            <section className="bg-white/80 backdrop-blur-xl rounded-[22px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e8e8e8] transition-all duration-300 hover:shadow-[0px_10px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1">
              <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <span>Buttons</span>
                <span className="text-xs font-medium text-on-surface-variant/70">Interactive</span>
              </h3>

              <div className="space-y-6">
                {/* Primary Buttons */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Primary State</span>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => triggerToast('Primary action clicked: Book Appointment')}
                      className="bg-primary-container text-on-primary-container px-6 py-3 rounded-[16px] text-sm font-bold shadow-md shadow-primary-container/20 hover:opacity-90 active:scale-95 transition-all"
                    >
                      Book Appointment
                    </button>
                    <button 
                      disabled 
                      className="bg-primary-container text-on-primary-container px-6 py-3 rounded-[16px] text-sm font-bold opacity-50 cursor-not-allowed"
                    >
                      Disabled State
                    </button>
                  </div>
                </div>

                {/* Secondary Buttons */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Secondary State</span>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => triggerToast('Secondary action clicked: View Details')}
                      className="bg-secondary-fixed text-primary-container px-6 py-3 rounded-[16px] text-sm font-bold hover:bg-secondary-fixed-dim active:scale-95 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Ghost / Outlined Buttons */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ghost / Outlined</span>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => triggerToast('Ghost action: Cancelled')}
                      className="bg-transparent border border-surface-container-highest text-on-surface px-6 py-3 rounded-[16px] text-sm font-semibold hover:bg-surface-container-low active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Icon Buttons */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Icon Action Buttons</span>
                  <div className="flex flex-wrap gap-4 items-center">
                    <button 
                      onClick={() => triggerToast('Added new item')}
                      className="bg-primary-container text-on-primary-container w-12 h-12 rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary-container/25"
                      title="Add"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => triggerToast('Edit action selected')}
                      className="bg-surface-container-low text-on-surface w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high active:scale-95 transition-all border border-surface-variant"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => triggerToast('Delete confirmation requested')}
                      className="bg-transparent text-error w-10 h-10 rounded-full flex items-center justify-center hover:bg-error-container/20 active:scale-95 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Inputs Section */}
            <section className="bg-white/80 backdrop-blur-xl rounded-[22px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e8e8e8] transition-all duration-300 hover:shadow-[0px_10px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1">
              <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <span>Form Elements</span>
                <span className="text-xs font-medium text-on-surface-variant/70">Controls</span>
              </h3>

              <div className="space-y-5">
                {/* Text Input */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Client Name</label>
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-surface-container-low border border-surface-variant rounded-[14px] px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed transition-all placeholder:text-on-surface-variant/50 font-medium"
                  />
                </div>

                {/* Search Input */}
                <div className="relative">
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Search Input</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search appointments..." 
                      className="w-full bg-surface-container-low border border-surface-variant rounded-[14px] pl-11 pr-10 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed transition-all font-medium"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Select Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Service Type</label>
                  <select 
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-[14px] px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed transition-all font-medium cursor-pointer"
                  >
                    <option value="Balayage & Styling">Balayage & Styling</option>
                    <option value="Men's Precision Cut">Men's Precision Cut</option>
                    <option value="Color Correction">Color Correction</option>
                    <option value="Hydro Facial">Hydro Facial Spa</option>
                    <option value="Signature Gel Manicure">Signature Gel Manicure</option>
                  </select>
                </div>

                {/* Toggles and Checkboxes */}
                <div className="pt-4 border-t border-surface-variant flex flex-wrap gap-8 items-center">
                  {/* Custom Toggle Switch */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={smsAlerts}
                      onClick={() => setSmsAlerts(!smsAlerts)}
                      className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
                        smsAlerts ? 'bg-primary-container' : 'bg-surface-variant'
                      }`}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs ${
                          smsAlerts ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <label 
                      onClick={() => setSmsAlerts(!smsAlerts)} 
                      className="text-sm font-semibold text-on-surface cursor-pointer select-none"
                    >
                      SMS Alerts
                    </label>
                  </div>

                  {/* Custom Circular Checkbox */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVipClient(!vipClient)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        vipClient 
                          ? 'border-primary-container bg-primary-container text-white' 
                          : 'border-outline text-transparent hover:border-primary-container'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <label 
                      onClick={() => setVipClient(!vipClient)} 
                      className="text-sm font-semibold text-on-surface cursor-pointer select-none"
                    >
                      VIP Client
                    </label>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Column 2: Cards & Layout Structures */}
          <div className="md:col-span-7 flex flex-col gap-8">
            
            {/* Cards Showcase */}
            <section className="bg-white/80 backdrop-blur-xl rounded-[22px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e8e8e8] transition-all duration-300 hover:shadow-[0px_10px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 h-full flex flex-col justify-between">
              
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <span>Card Structures</span>
                  <span className="text-xs font-medium text-on-surface-variant/70">Layout System</span>
                </h3>

                <div className="space-y-6">
                  
                  {/* Appointment Card (Standard) */}
                  <div className="bg-surface-container-lowest border border-surface-container-highest rounded-[18px] p-5 shadow-xs relative overflow-hidden group cursor-pointer hover:border-primary-container/40 transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary-container"></div>
                    <div className="flex justify-between items-start ml-2">
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold mb-2">
                          Confirmed
                        </span>
                        <h4 className="text-base font-bold text-on-surface">Suman Gupta</h4>
                        <p className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>Today, 2:30 PM - 4:00 PM</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-base font-extrabold text-on-surface">₹145.00</span>
                        <span className="text-xs font-semibold text-on-surface-variant">Balayage</span>
                      </div>
                    </div>

                    <div className="mt-4 ml-2 pt-3 border-t border-outline-variant/20 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerToast('Reschedule requested for Suman Gupta');
                        }}
                        className="text-xs font-bold bg-secondary-fixed text-primary-container px-3.5 py-1.5 rounded-lg hover:bg-secondary-fixed-dim transition-colors"
                      >
                        Reschedule
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerToast('Opening SMS conversation...');
                        }}
                        className="text-xs font-bold border border-surface-variant px-3.5 py-1.5 rounded-lg text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Message
                      </button>
                    </div>
                  </div>

                  {/* Stats Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Elevated Stat Card */}
                    <div className="bg-surface-container-lowest rounded-[18px] p-5 shadow-[0px_10px_40px_rgba(0,0,0,0.08)] border border-surface-container-highest flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                      <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container mb-3">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <h4 className="text-2xl font-black text-on-surface tracking-tight">₹4,250</h4>
                      <p className="text-xs font-bold text-on-surface-variant mt-0.5">Revenue Today</p>
                    </div>

                    {/* Glassmorphism Stat Card */}
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[18px] p-5 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xs group hover:scale-[1.02] transition-transform">
                      {/* Decorative Background Blur */}
                      <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-primary-fixed-dim/30 rounded-full blur-2xl pointer-events-none" />
                      <div className="w-12 h-12 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary-container mb-3 relative z-10">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-2xl font-black text-on-surface tracking-tight relative z-10">12</h4>
                      <p className="text-xs font-bold text-on-surface-variant mt-0.5 relative z-10">Total Clients</p>
                    </div>

                  </div>

                </div>
              </div>

              {/* Interactive Modal Trigger Banner */}
              <div className="pt-6 mt-6 border-t border-surface-variant flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container p-4 rounded-[16px] gap-3">
                <div>
                  <h5 className="text-sm font-bold text-on-surface">Dialogs & Sheets</h5>
                  <p className="text-xs text-on-surface-variant">Trigger interactive overlay component tokens</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary-fixed-dim" />
                  <span>Open Modal</span>
                </button>
              </div>

            </section>

          </div>

        </div>

      </div>

      {/* Interactive Showcase Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-outline-variant/30"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-on-surface">Nexora Modal Token</h3>
                    <p className="text-xs text-on-surface-variant">Elevated surface overlay spec</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                <p>
                  This modal dialog exhibits our elevated container style with 28px border-radius, glassmorphic backdrop blur, and smooth spring physics transitions powered by Motion.
                </p>
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-on-surface">
                    <span>Active Theme:</span>
                    <span className="text-primary font-mono">Material You - Modern Magenta</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-on-surface">
                    <span>Base Font:</span>
                    <span className="font-mono">Inter (400 / 600 / 700)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-on-surface">
                    <span>Border Radius:</span>
                    <span className="font-mono">18px (Cards) / 28px (Dialogs)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-primary-container text-white rounded-xl text-xs font-bold hover:bg-primary transition-colors shadow-sm"
                >
                  Close Showcase
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
