import { motion } from 'motion/react';
import {
  Sparkles, ArrowRight, Check, Copy, ExternalLink, Calendar, Users,
  ClipboardList, Scissors, CreditCard, Share2, Settings, HelpCircle, Bell, Plus,
  Search, Filter, Trash2, CheckCircle2, AlertCircle, X, Shield, RefreshCw,
  Smartphone, Monitor, ChevronRight, Clock, Star, Phone, Mail, MapPin, Laptop,
  QrCode, DollarSign, TrendingUp, Sliders, Send, MessageSquare, Mic, Gift, Menu,
  Grid, Pencil, Download, Palette
} from 'lucide-react';
import { useOwnerDashboard } from '../OwnerDashboardContext';

/** Owner dashboard tab — screen feature module. */
export default function SettingsTab() {
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
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 max-w-4xl mx-auto"
              >
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Salon Booking Rules</h3>
                    <p className="text-xs text-gray-400">These parameters control what clients can request on your website</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Minimum Notice Period</label>
                      <input 
                        type="text" 
                        value={data.bookingRules?.minNotice || '1 hour'}
                        onChange={(e) => {
                          setData(prev => ({
                            ...prev,
                            bookingRules: { ...prev.bookingRules!, minNotice: e.target.value }
                          }));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Advance Deposit percentage (%)</label>
                      <input 
                        type="number" 
                        value={data.bookingRules?.advanceDepositPercentage || 25}
                        onChange={(e) => {
                          setData(prev => ({
                            ...prev,
                            bookingRules: { ...prev.bookingRules!, advanceDepositPercentage: Number(e.target.value) }
                          }));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Allow Staff Selection</label>
                      <select
                        value={data.bookingRules?.allowStaffSelection ? 'yes' : 'no'}
                        onChange={(e) => {
                          setData(prev => ({
                            ...prev,
                            bookingRules: { ...prev.bookingRules!, allowStaffSelection: e.target.value === 'yes' }
                          }));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      >
                        <option value="yes">Yes - let clients choose provider</option>
                        <option value="no">No - assign randomly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Landmark Address Info</label>
                      <input 
                        type="text" 
                        value={data.address?.landmark || ''}
                        onChange={(e) => {
                          setData(prev => ({
                            ...prev,
                            address: { ...prev.address!, landmark: e.target.value }
                          }));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setNotifications(prev => [{ id: `${Date.now()}`, text: 'Saved Salon Rules!', time: 'Just now', read: false }, ...prev]);
                      }}
                      className="px-6 py-2 rounded-xl bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </motion.div>
  );
}
