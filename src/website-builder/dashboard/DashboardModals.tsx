import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, ArrowRight, Check, Copy, ExternalLink, Calendar, Users,
  ClipboardList, Scissors, CreditCard, Share2, Settings, HelpCircle, Bell, Plus,
  Search, Filter, Trash2, CheckCircle2, AlertCircle, X, Shield, RefreshCw,
  Smartphone, Monitor, ChevronRight, Clock, Star, Phone, Mail, MapPin, Laptop,
  QrCode, DollarSign, TrendingUp, Sliders, Send, MessageSquare, Mic, Gift, Menu,
  Grid, Pencil, Download, Palette
} from 'lucide-react';
import TemplateRenderer from '../components/TemplateRenderer';
import { useOwnerDashboard } from './OwnerDashboardContext';

export default function DashboardModals() {
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
    <>
      {/* MODAL: NEW APPOINTMENT CREATOR */}
      <AnimatePresence>
        {showNewAppointmentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.form 
              onSubmit={handleCreateAppointment}
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100"
            >
              <button 
                type="button"
                onClick={() => setShowNewAppointmentModal(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-gray-900 text-base mb-1">Add Salon Booking</h3>
              <p className="text-xs text-gray-400 mb-6">Manually record a client appointment walk-in or phone call</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Customer Name *</label>
                  <input 
                    type="text" 
                    required
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    placeholder="e.g. Neha Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Contact Phone</label>
                  <input 
                    type="tel" 
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    placeholder="e.g. +91 99000 11000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Service</label>
                    <select 
                      value={newSelectedService}
                      onChange={e => setNewSelectedService(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                    >
                      {data.services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - ₹{s.price}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Stylist</label>
                    <select 
                      value={newSelectedStaff}
                      onChange={e => setNewSelectedStaff(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                    >
                      {data.team.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Planned Time slot</label>
                  <select 
                    value={newSelectedTime}
                    onChange={e => setNewSelectedTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowNewAppointmentModal(false)}
                  className="w-1/2 border border-gray-200 text-gray-500 font-bold text-xs py-3 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl"
                >
                  Confirm Booking
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRAWER: SERVICE SLIDE-OUT FROM RIGHT */}
      <AnimatePresence>
        {showServiceDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowServiceDrawer(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            />

            {/* Slide out Panel */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white border-l border-gray-100 flex flex-col shadow-2xl relative"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">{editingService ? 'Edit Service Details' : 'Add Treatment Catalog'}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Customize service pricing, timing and tags</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowServiceDrawer(false)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSaveService} className="flex-grow overflow-y-auto p-6 space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Service Name *</label>
                    <input 
                      type="text" 
                      required
                      value={newServiceName}
                      onChange={e => setNewServiceName(e.target.value)}
                      placeholder="e.g. Balayage & Hair Spa Combo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                      <select 
                        value={newServiceCategory}
                        onChange={e => setNewServiceCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none focus:border-[#ac0053]"
                      >
                        <option value="Haircut">Haircut</option>
                        <option value="Hair Styling">Hair Styling</option>
                        <option value="Treatment">Treatment</option>
                        <option value="Hair Coloring">Hair Coloring</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Wellness">Wellness</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Duration (mins)</label>
                      <input 
                        type="number" 
                        required
                        value={newServiceDuration}
                        onChange={e => setNewServiceDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Treatment Fee (INR ₹) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-gray-400 text-xs font-bold">₹</span>
                      <input 
                        type="number" 
                        required
                        value={newServicePrice}
                        onChange={e => setNewServicePrice(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-extrabold text-gray-900 focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Service Description</label>
                      <button
                        type="button"
                        disabled={isImprovingWithAI || !newServiceName}
                        onClick={handleImproveDescriptionWithAI}
                        className="text-[10px] font-bold text-[#ac0053] hover:text-[#ba005b] flex items-center gap-1 bg-[#ffd9e1]/25 hover:bg-[#ffd9e1]/50 px-2 py-0.5 rounded-md border border-[#ffd9e1]/40 disabled:opacity-55"
                      >
                        <Sparkles className="w-3 h-3 text-[#ac0053]" />
                        {isImprovingWithAI ? 'AI Improving...' : 'Gemini Auto-Draft'}
                      </button>
                    </div>
                    <textarea 
                      value={newServiceDesc}
                      onChange={e => setNewServiceDesc(e.target.value)}
                      placeholder="e.g. Clarifying hair wash with deep nourishing mask..."
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-150">
                    <input 
                      type="checkbox"
                      id="drawerFeatured"
                      checked={newServiceFeatured}
                      onChange={e => setNewServiceFeatured(e.target.checked)}
                      className="rounded border-gray-300 text-[#ac0053] focus:ring-[#ac0053] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="drawerFeatured" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                      Star feature this treatment on website banner
                    </label>
                  </div>

                  {/* Calculations Info Box */}
                  <div className="p-3.5 bg-[#ffd9e1]/10 rounded-xl border border-[#ffd9e1]/30 space-y-1">
                    <p className="text-[10px] font-extrabold text-[#ac0053] uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> ONLINE CLIENT CALCULATOR (25% DEPOSIT)
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                      Clients pay an online booking deposit of <strong className="text-gray-800">₹{Math.round((newServicePrice || 0) * 0.25)}</strong> at checkout. Remaining <strong className="text-gray-800">₹{Math.round((newServicePrice || 0) * 0.75)}</strong> collected in-salon.
                    </p>
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-6 border-t border-gray-100 flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowServiceDrawer(false)}
                      className="w-1/3 border border-gray-200 text-gray-500 font-bold text-xs py-3 rounded-xl hover:bg-gray-50 active:scale-98 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="w-2/3 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-[#ac0053]/15 active:scale-98 transition-all"
                    >
                      {editingService ? 'Save Service Updates' : 'Add to Treatment Catalog'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAWER: PACKAGE SLIDE-OUT FROM RIGHT */}
      <AnimatePresence>
        {showPackageDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPackageDrawer(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white border-l border-gray-100 flex flex-col shadow-2xl relative"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">{editingPackage ? 'Edit Package Combo' : 'Create Package Combo'}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Bundle multiple treatments for a dynamic discount</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowPackageDrawer(false)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSavePackage} className="flex-grow overflow-y-auto p-6 space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Package Combo Name *</label>
                    <input 
                      type="text" 
                      required
                      value={newPackageName}
                      onChange={e => setNewPackageName(e.target.value)}
                      placeholder="e.g. Bridal Glow & Styling Bundle"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Total Duration (mins)</label>
                      <input 
                        type="number" 
                        required
                        value={newPackageDuration}
                        onChange={e => setNewPackageDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Combo Fee (INR ₹) *</label>
                      <input 
                        type="number" 
                        required
                        value={newPackagePrice}
                        onChange={e => setNewPackagePrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-extrabold text-gray-900 focus:border-[#ac0053]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Package Items / Details</label>
                      <button
                        type="button"
                        disabled={isImprovingWithAI || !newPackageName}
                        onClick={handleImprovePackageDescWithAI}
                        className="text-[10px] font-bold text-[#ac0053] hover:text-[#ba005b] flex items-center gap-1 bg-[#ffd9e1]/25 hover:bg-[#ffd9e1]/50 px-2 py-0.5 rounded-md border border-[#ffd9e1]/40 disabled:opacity-55"
                      >
                        <Sparkles className="w-3 h-3 text-[#ac0053]" />
                        {isImprovingWithAI ? 'AI Designing...' : 'Gemini Combo Draft'}
                      </button>
                    </div>
                    <textarea 
                      value={newPackageDesc}
                      onChange={e => setNewPackageDesc(e.target.value)}
                      placeholder="e.g. Includes Global Hair Color, Precision Haircut, Hydra Facial & Scalp Massage..."
                      rows={5}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none resize-none"
                    />
                  </div>

                  {/* Calculations Info Box */}
                  <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1">
                    <p className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" /> High-Value Bundling Strategy
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                      Combo pricing allows salon operators to capture higher cart volumes. We recommend packaging popular services with a <strong className="text-gray-800">15-20% discount</strong> compared to standalone prices.
                    </p>
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-6 border-t border-gray-100 flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowPackageDrawer(false)}
                      className="w-1/3 border border-gray-200 text-gray-500 font-bold text-xs py-3 rounded-xl hover:bg-gray-50 active:scale-98 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="w-2/3 bg-slate-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl active:scale-98 transition-all"
                    >
                      {editingPackage ? 'Save Package Updates' : 'Add Package to Catalog'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: VOICE QUICK-ADD ASSISTANT */}
      <AnimatePresence>
        {showVoiceModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 overflow-hidden"
            >
              <button 
                type="button"
                onClick={() => setShowVoiceModal(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-[#ffd9e1]/45 text-[#ac0053] relative">
                  {isVoiceListening && (
                    <span className="absolute inset-0 rounded-full border-2 border-[#ac0053] animate-ping opacity-75"></span>
                  )}
                  <Mic className="w-8 h-8 text-[#ac0053]" />
                </div>

                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Voice Catalog Command</h3>
                  <p className="text-[11px] text-gray-400 mt-1 font-semibold">Speak or paste a natural language statement to quickly register treatments</p>
                </div>

                {/* Animated Soundwave */}
                {isVoiceListening ? (
                  <div className="flex justify-center items-center gap-1 h-8">
                    {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                      <motion.span 
                        key={i} 
                        animate={{ height: [8, h * 6, 8] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.05 }}
                        className="w-1 bg-[#ac0053] rounded-full"
                        style={{ height: '8px' }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-8 flex items-center justify-center text-xs text-gray-400 font-semibold">
                    Microphone is sleeping. Tap to talk!
                  </div>
                )}

                <div className="space-y-3 text-left">
                  <div className="relative">
                    <textarea 
                      value={voiceInputText}
                      onChange={e => setVoiceInputText(e.target.value)}
                      placeholder="e.g. Add service Deluxe Spa Pedicure for 1200 rupees lasting 45 minutes"
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] resize-none outline-none"
                    />
                  </div>

                  {/* Predefined Clickable Commands Fallback */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or Click Preset Prompt to Try:</span>
                    <div className="space-y-1">
                      {[
                        'Add service Deluxe Spa Pedicure for 1200 rupees lasting 45 minutes',
                        'Create package Bridal Glow Combo with a price of 4500 rupees lasting 150 minutes',
                        'Add service Beard Trim for 250 rupees lasting 15 minutes'
                      ].map((cmd, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setVoiceInputText(cmd);
                            setIsVoiceListening(true);
                            setTimeout(() => {
                              setIsVoiceListening(false);
                            }, 1000);
                          }}
                          className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-150 text-[10px] font-semibold text-gray-600 truncate transition-colors cursor-pointer"
                        >
                          📢 {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsVoiceListening(!isVoiceListening);
                      if (!isVoiceListening) {
                        setTimeout(() => {
                          setVoiceInputText('Add service Deep Nourishing Hair Spa for 850 rupees lasting 60 minutes');
                          setIsVoiceListening(false);
                        }, 2500);
                      }
                    }}
                    className={`w-1/2 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                      isVoiceListening 
                        ? 'bg-[#ffd9e1]/20 border-[#ac0053] text-[#ac0053]' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {isVoiceListening ? 'Stop Mic Listening' : 'Toggle Mic'}
                  </button>
                  <button 
                    type="button"
                    disabled={!voiceInputText.trim()}
                    onClick={handleParseVoiceCommand}
                    className="w-1/2 bg-[#ac0053] hover:bg-[#ba005b] disabled:opacity-55 text-white font-bold text-xs py-2.5 rounded-xl shadow"
                  >
                    Parse & Add Service
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: AI SUGGEST IDEAS WIZARD */}
      <AnimatePresence>
        {showAiSuggestModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border border-gray-100 overflow-hidden"
            >
              <button 
                type="button"
                onClick={() => {
                  setShowAiSuggestModal(false);
                  setGeneratedSuggestions([]);
                  setSelectedSuggestionIds([]);
                }}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                    <Sparkles className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">AI Treatment Suggestion Engine</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-semibold">Generate high-converting treatments optimized for your specific archetype</p>
                  </div>
                </div>

                {generatedSuggestions.length === 0 ? (
                  /* STEP 1: Select Archetype & Generate */
                  <div className="space-y-5">
                    {isGeneratingSuggestions ? (
                      /* Live loading steps */
                      <div className="py-12 text-center space-y-4">
                        <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900 animate-pulse">🤖 Consulting Gemini AI Engine...</p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Calculating optimal treatment price metrics</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Select Salon Archetype Idea Kit</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'luxury', title: 'Luxury Chic', icon: '👑', desc: 'Premium colors, high price hair sculptures, complex glazes.' },
                            { id: 'barber', title: 'Barber Shop', icon: '💈', desc: 'Detail beard trims, razor lineups, facial packs, tonics.' },
                            { id: 'spa', title: 'Wellness Spa', icon: '🌸', desc: 'Aromatherapy body massages, salt scrubs, skincare.' },
                            { id: 'beauty', title: 'Nail & Beauty', icon: '💅', desc: 'Gel manicures, acrylic overlays, maps, brow mappings.' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setAiSuggestArchetype(item.id as any)}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                aiSuggestArchetype === item.id 
                                  ? 'border-amber-400 bg-amber-50/20 shadow-2xs' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-xs font-bold text-gray-900">{item.title}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1 font-semibold leading-relaxed">{item.desc}</p>
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTriggerSuggestions(aiSuggestArchetype)}
                          className="w-full mt-2 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl transition-all shadow"
                        >
                          Generate AI Catalog Ideas
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* STEP 2: Selection Catalog Matrix */
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs text-gray-500 font-bold">
                      <span>Select treatments to import into your catalog:</span>
                      <button 
                        type="button"
                        onClick={() => {
                          if (selectedSuggestionIds.length === generatedSuggestions.length) {
                            setSelectedSuggestionIds([]);
                          } else {
                            setSelectedSuggestionIds(generatedSuggestions.map(s => s.id));
                          }
                        }}
                        className="text-[#ac0053] hover:underline"
                      >
                        {selectedSuggestionIds.length === generatedSuggestions.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {generatedSuggestions.map((sug) => {
                        const isChecked = selectedSuggestionIds.includes(sug.id);
                        return (
                          <div 
                            key={sug.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedSuggestionIds(prev => prev.filter(id => id !== sug.id));
                              } else {
                                setSelectedSuggestionIds(prev => [...prev, sug.id]);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                              isChecked ? 'border-amber-300 bg-amber-50/10' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 mt-0.5"
                            />
                            <div className="flex-grow">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-900">{sug.name}</span>
                                <span className="text-xs font-extrabold text-gray-900">₹{sug.price}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-semibold line-clamp-1">{sug.description}</p>
                              <div className="mt-1 flex gap-2 text-[9px] text-gray-400 font-bold uppercase">
                                <span>{sug.category}</span>
                                <span>•</span>
                                <span>{sug.duration} mins</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setGeneratedSuggestions([]);
                          setSelectedSuggestionIds([]);
                        }}
                        className="w-1/3 border border-gray-200 text-gray-500 font-bold text-xs py-3 rounded-xl hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button 
                        type="button"
                        onClick={handleAddSuggestionsToCatalog}
                        className="w-2/3 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl shadow-md"
                      >
                        Import Selected ({selectedSuggestionIds.length}) to Catalog
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: LIVE SITE IFRAME/PREVIEW SCREEN OVERLAY */}
      <AnimatePresence>
        {showLiveSiteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 md:p-8 z-50 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden relative border border-gray-100 shadow-2xl"
            >
              <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-gray-500 tracking-wide uppercase">Live client website preview</span>
                </div>
                
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  <button 
                    onClick={() => setMode('desktop')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold ${mode === 'desktop' ? 'bg-white shadow-3xs text-gray-800' : 'text-gray-400'}`}
                  >
                    Desktop
                  </button>
                  <button 
                    onClick={() => setMode('mobile')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold ${mode === 'mobile' ? 'bg-white shadow-3xs text-gray-800' : 'text-gray-400'}`}
                  >
                    Mobile
                  </button>
                </div>

                <button 
                  onClick={() => setShowLiveSiteModal(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden relative bg-gray-50 flex items-center justify-center">
                <TemplateRenderer data={data} mode={mode} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: HELP CENTER */}
      <AnimatePresence>
        {showHelpCenter && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100"
            >
              <button 
                onClick={() => setShowHelpCenter(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-gray-900 text-base mb-1">Help &amp; FAQ Center</h3>
              <p className="text-xs text-gray-400 mb-6 font-semibold">Everything you need to master your new Nexora platform</p>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-1 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                  <h4 className="font-bold text-gray-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> How do advance payments work?
                  </h4>
                  <p className="text-gray-500 leading-relaxed font-semibold">
                    Nexora automatically asks clients to complete a percentage deposit before booking (defined in Salon Rules). You can confirm or cancel these manually.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                  <h4 className="font-bold text-gray-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Can I update my template styling later?
                  </h4>
                  <p className="text-gray-500 leading-relaxed font-semibold">
                    Yes! You can re-run the Onboarding wizard or jump to Step 10 Template Appearance at any time via the sidebar control.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                  <h4 className="font-bold text-gray-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> How do clients scan my QR code?
                  </h4>
                  <p className="text-gray-500 leading-relaxed font-semibold">
                    Go to 'Share &amp; Marketing' tab, scan the dynamic QR with any mobile phone, or copy/download the QR to print for your shop desk!
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowHelpCenter(false)}
                className="w-full mt-6 bg-gray-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition-colors"
              >
                Close Help Center
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
