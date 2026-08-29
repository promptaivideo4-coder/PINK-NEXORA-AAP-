import { motion } from 'motion/react';
import {
  Sparkles, ArrowRight, Check, Copy, ExternalLink, Calendar, Users,
  ClipboardList, Scissors, CreditCard, Share2, Settings, HelpCircle, Bell, Plus,
  Search, Filter, Trash2, CheckCircle2, AlertCircle, X, Shield, RefreshCw,
  Smartphone, Monitor, ChevronRight, Clock, Star, Phone, Mail, MapPin, Laptop,
  QrCode, DollarSign, TrendingUp, Sliders, Send, MessageSquare, Mic, Gift, Menu,
  Grid, Pencil, Download, Palette
} from 'lucide-react';
import DefaultStaffAvatar, { getAvatarByIndex } from '../../components/DefaultStaffAvatars';
import { useOwnerDashboard } from '../OwnerDashboardContext';

/** Owner dashboard tab — screen feature module. */
export default function OverviewTab() {
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

              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 max-w-6xl mx-auto"
              >
                {/* Live Banner card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 className="font-bold text-gray-900 text-sm">Your website is online & active!</h3>
                    </div>
                    <p className="text-xs font-bold text-[#ac0053] font-mono select-all break-all">{liveUrl}</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto z-10 shrink-0">
                    <button 
                      onClick={handleCopyLink}
                      className="flex-1 md:flex-none px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? 'Copied URL!' : 'Copy Link'}
                    </button>
                    <button 
                      onClick={() => setActiveTab('website')}
                      className="flex-1 md:flex-none px-4 py-2 bg-[#ac0053] text-white font-bold text-xs hover:bg-[#ba005b] rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      View Layout
                    </button>
                  </div>
                  <div className="absolute right-0 top-0 w-32 h-32 bg-[#ac0053]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                </div>

                {/* Dashboard statistics blocks */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <span className="p-2 rounded-xl bg-[#ffd9e1]/40 text-[#ac0053]">
                        <Calendar className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's Bookings</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{todayActiveBookings}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <span className="p-2 rounded-xl bg-[#ffd9e1]/40 text-[#ac0053]">
                        <DollarSign className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">+12%</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Month Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalBookingsValue.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <span className="p-2 rounded-xl bg-[#ffd9e1]/40 text-[#ac0053]">
                        <Scissors className="w-5 h-5" />
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Services</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {activeServicesCount} <span className="text-xs font-medium text-gray-400">Live</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <span className="p-2 rounded-xl bg-[#ffd9e1]/40 text-[#ac0053]">
                        <Users className="w-5 h-5" />
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Staff Roster</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {staffTeamCount} <span className="text-xs font-medium text-emerald-600">Sync'd</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Bento content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left panel: Today's active appointments */}
                  <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">Today's Appointments</h3>
                        <p className="text-[11px] text-gray-400">Manage statuses, cancellations and payment advances</p>
                      </div>
                      <button 
                        onClick={() => setShowNewAppointmentModal(true)}
                        className="text-xs font-bold text-[#ac0053] bg-[#ffd9e1]/30 hover:bg-[#ffd9e1]/50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Book Client
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/30">
                            <th className="py-3 px-6">Time</th>
                            <th className="py-3 px-6">Customer</th>
                            <th className="py-3 px-6">Treatment & Stylist</th>
                            <th className="py-3 px-6">Price</th>
                            <th className="py-3 px-6">Advance Paid</th>
                            <th className="py-3 px-6 text-right">Actions / Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map(appt => (
                            <tr key={appt.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                              <td className="py-4 px-6 text-xs font-semibold text-gray-500 whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#ac0053]" />
                                  {appt.time}
                                </span>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="text-xs font-bold text-gray-900">{appt.customerName}</div>
                                <div className="text-[10px] text-gray-400 font-medium">{appt.phone}</div>
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <div className="text-xs font-semibold text-gray-800">{appt.serviceName}</div>
                                <div className="text-[10px] text-[#ac0053] font-bold">with {appt.staffName}</div>
                              </td>
                              <td className="py-4 px-6 text-xs font-bold text-gray-900 whitespace-nowrap">
                                ₹{appt.price}
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                {appt.depositPaid > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                    ₹{appt.depositPaid} (25%)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-gray-400">Pending</span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  {appt.status === 'Pending' ? (
                                    <button 
                                      onClick={() => handleUpdateApptStatus(appt.id, 'Confirmed')}
                                      className="text-[10px] font-bold bg-amber-50 hover:bg-emerald-50 border border-amber-200 hover:border-emerald-200 text-amber-700 hover:text-emerald-700 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      Confirm Booking
                                    </button>
                                  ) : (
                                    <select 
                                      value={appt.status}
                                      onChange={(e) => handleUpdateApptStatus(appt.id, e.target.value as any)}
                                      className="text-[10px] font-bold border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 outline-none"
                                    >
                                      <option value="Confirmed">Confirmed</option>
                                      <option value="Completed">Completed</option>
                                      <option value="Cancelled">Cancelled</option>
                                    </select>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteAppt(appt.id)}
                                    className="p-1 text-gray-300 hover:text-rose-600 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right bento panel: Quick Actions + Revenue summary */}
                  <div className="lg:col-span-4 space-y-6 flex flex-col">
                    
                    {/* Quick Actions Panel */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
                      <h3 className="font-bold text-gray-900 text-sm mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setShowAddServiceModal(true)}
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-[#ffd9e1]/10 rounded-2xl border border-gray-200 hover:border-[#ac0053]/40 transition-all group text-center"
                        >
                          <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#ac0053] mb-2" />
                          <span className="text-[11px] font-bold text-gray-700 group-hover:text-[#ac0053]">Add Service</span>
                        </button>

                        <button 
                          onClick={onOpenStaffManagement}
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-[#ffd9e1]/10 rounded-2xl border border-gray-200 hover:border-[#ac0053]/40 transition-all group text-center"
                        >
                          <Users className="w-5 h-5 text-gray-400 group-hover:text-[#ac0053] mb-2" />
                          <span className="text-[11px] font-bold text-gray-700 group-hover:text-[#ac0053]">Add Staff</span>
                        </button>

                        <button 
                          onClick={() => { goToStep(6) }}
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-[#ffd9e1]/10 rounded-2xl border border-gray-200 hover:border-[#ac0053]/40 transition-all group text-center"
                        >
                          <Sparkles className="w-5 h-5 text-gray-400 group-hover:text-[#ac0053] mb-2" />
                          <span className="text-[11px] font-bold text-gray-700 group-hover:text-[#ac0053]">Manage Gallery</span>
                        </button>

                        <button 
                          onClick={() => setActiveTab('website')}
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-[#ffd9e1]/10 rounded-2xl border border-gray-200 hover:border-[#ac0053]/40 transition-all group text-center"
                        >
                          <Laptop className="w-5 h-5 text-gray-400 group-hover:text-[#ac0053] mb-2" />
                          <span className="text-[11px] font-bold text-gray-700 group-hover:text-[#ac0053]">Edit Website</span>
                        </button>
                      </div>
                    </div>

                    {/* Revenue summary Ledger card */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
                      <h3 className="font-bold text-gray-900 text-sm mb-4">Financial Ledger Summary</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end pb-3 border-b border-gray-100">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Booking Value</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">₹{totalBookingsValue.toLocaleString()}</p>
                          </div>
                          <TrendingUp className="w-5 h-5 text-emerald-500 mb-1" />
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold py-1">
                          <span className="text-gray-400">Advance Collected</span>
                          <span className="text-gray-900">₹{totalAdvanceCollected.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold py-1">
                          <span className="text-gray-400">Remaining at Salon</span>
                          <span className="text-[#ac0053]">₹{totalRemainingAtSalon.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Staff availability quick glance */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
                      <h3 className="font-bold text-gray-900 text-sm mb-4">Live Staff Status</h3>
                      <div className="space-y-2">
                        {data.team.map((member, idx) => {
                          const isAvailable = member.status === 'Available';
                          const isBusy = member.status === 'Busy';
                          return (
                            <div 
                              key={member.id} 
                              onClick={() => handleToggleStaffStatus(member.id)}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                  {member.imageUrl ? (
                                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <DefaultStaffAvatar variant={member.avatarVariant || getAvatarByIndex(idx)} size={28} />
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-800">{member.name}</div>
                                  <div className="text-[9px] text-gray-400 font-semibold">{member.role}</div>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                                isAvailable 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : isBusy 
                                    ? 'bg-amber-50 text-amber-700' 
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                {member.status || 'Available'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
  );
}
