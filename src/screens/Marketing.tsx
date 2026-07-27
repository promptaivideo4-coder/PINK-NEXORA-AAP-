import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps, Offer, FestivalTemplate } from '../types';
import PosterCreator from '../components/marketing/PosterCreator';
import FestivalTemplates from '../components/marketing/FestivalTemplates';
import WhatsAppCampaign from '../components/marketing/WhatsAppCampaign';
import AutoReminder from '../components/marketing/AutoReminder';
import CampaignHistory from '../components/marketing/CampaignHistory';
import { 
  Megaphone, 
  Tag, 
  Sparkles, 
  PartyPopper, 
  Palette, 
  MessageSquare, 
  Clock, 
  History, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  MoreVertical,
  Calendar,
  Scissors,
  Plus,
  Eye,
  Share2,
  Ticket,
  Trash2,
  X,
  PlusCircle,
  Percent,
  Star,
  Type as TypeIcon,
  QrCode,
  Layout as LayoutIcon,
  Maximize2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Download,
  Save,
  Diamond
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice } from '../utils/currency';
import { useLanguage } from '../contexts/LanguageContext';

export default function Marketing({ navigate }: NavigationProps) {
  const { t } = useLanguage();
  const [selectedSubModule, setSelectedSubModule] = useState<string | null>(null);

  // Offers module specific states
  const [offers, setOffers] = useState<Offer[]>([
    {
      id: '1',
      title: 'Seasonal Glow',
      discount: '20% Off',
      code: 'GLOW20',
      status: 'Active',
      startDate: 'Dec 1',
      endDate: 'Dec 31',
      category: 'All Facials',
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop',
      views: 1200,
      shares: 85,
      redeemed: 42
    },
    {
      id: '2',
      title: 'Membership Special',
      discount: 'Buy 5 Get 1 Free',
      code: 'MEMBERSHIP',
      status: 'Scheduled',
      startDate: 'Jan 1',
      endDate: 'Jan 31',
      category: 'Haircuts',
      imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=600&auto=format&fit=crop',
      views: 540,
      shares: 20,
      redeemed: 12
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'All' | 'Active' | 'Scheduled' | 'Draft' | 'Expired'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // New Offer Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newStatus, setNewStatus] = useState<'Active' | 'Scheduled' | 'Draft' | 'Expired'>('Active');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newCategory, setNewCategory] = useState('Haircuts');
  const [newImageUrl, setNewImageUrl] = useState('');

  // AI Offer Creator Specific States
  const [campaignGoal, setCampaignGoal] = useState('Increase bookings');
  const [customerType, setCustomerType] = useState('All');
  const [occasion, setOccasion] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>(['Haircut']);
  const [discountPreference, setDiscountPreference] = useState('Percentage');
  const [validity, setValidity] = useState('This week');
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('Premium');

  const [aiLoading, setAiLoading] = useState(false);
  const [generatedOffer, setGeneratedOffer] = useState<{
    title: string;
    shortPromoText: string;
    whatsappMessage: string;
    suggestedCouponCode: string;
    termsAndConditions: string;
  } | null>(null);

  const [copiedText, setCopiedText] = useState(false);

  const availableServices = ["Haircut", "Facial & Spa", "Manicure & Nails", "Makeup Lounge", "Massage"];

  const handleGenerateOffer = async () => {
    setAiLoading(true);
    setGeneratedOffer(null);
    try {
      const response = await fetch('/api/generate-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignGoal,
          customerType,
          occasion,
          services: selectedServices,
          discountPreference,
          validity,
          language,
          tone,
        }),
      });
      const data = await response.json();
      setGeneratedOffer({
        title: data.title || '',
        shortPromoText: data.shortPromoText || '',
        whatsappMessage: data.whatsappMessage || '',
        suggestedCouponCode: data.suggestedCouponCode || '',
        termsAndConditions: data.termsAndConditions || '',
      });
    } catch (error) {
      console.error("Error calling generate offer:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePublishGeneratedOffer = (status: 'Active' | 'Draft') => {
    if (!generatedOffer) return;
    
    let coverUrl = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop';
    if (selectedServices.includes("Facial & Spa")) {
      coverUrl = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop';
    } else if (selectedServices.includes("Haircut")) {
      coverUrl = 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=600&auto=format&fit=crop';
    } else if (selectedServices.includes("Manicure & Nails")) {
      coverUrl = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop';
    } else if (selectedServices.includes("Makeup Lounge")) {
      coverUrl = 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=600&auto=format&fit=crop';
    }

    const newOffer: Offer = {
      id: String(Date.now()),
      title: generatedOffer.title,
      discount: discountPreference === 'Percentage' ? '20% Off' : discountPreference === 'Fixed' ? '₹500 Off' : 'BOGO',
      code: generatedOffer.suggestedCouponCode.toUpperCase().replace(/\s+/g, ''),
      status: status,
      startDate: 'Today',
      endDate: validity || 'End of Month',
      category: selectedServices.join(', ') || 'General',
      imageUrl: coverUrl,
      views: 0,
      shares: 0,
      redeemed: 0
    };

    setOffers([newOffer, ...offers]);
    setGeneratedOffer(null);
    setSelectedSubModule('offers'); // Redirect to offers list
  };

  // Built-in presets for gorgeous image suggestions matching salon beauty aesthetic
  const imagePresets = [
    { name: 'Facial & Spa', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop' },
    { name: 'Haircut Premium', url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=600&auto=format&fit=crop' },
    { name: 'Manicure & Nails', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop' },
    { name: 'Makeup Lounge', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=600&auto=format&fit=crop' },
  ];

  // Marketing Campaign Blueprint items from user request
  const marketingModules = [
    {
      id: 'offers',
      title: t('offers_discounts'),
      desc: t('offers_management_desc'),
      icon: Tag,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badge: t('active_campaigns')
    },
    {
      id: 'ai-offer-creator',
      title: t('ai_offer_creator'),
      desc: t('ai_offer_creator_desc'),
      icon: Sparkles,
      color: 'bg-primary/10 text-primary border-primary/20',
      badge: t('powered_by_ai')
    },
    {
      id: 'festival-templates',
      title: t('festival_templates'),
      desc: t('festival_templates_desc'),
      icon: PartyPopper,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badge: t('seasonal')
    },
    {
      id: 'poster-creator',
      title: t('poster_creator'),
      desc: t('poster_creator_desc'),
      icon: Palette,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      badge: t('custom_canvas')
    },
    {
      id: 'whatsapp-campaign',
      title: t('whatsapp_campaign'),
      desc: t('whatsapp_campaign_desc'),
      icon: MessageSquare,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badge: t('direct_connect')
    },
    {
      id: 'auto-reminder',
      title: t('auto_reminder'),
      desc: t('auto_reminder_desc'),
      icon: Clock,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      badge: t('smart_trigger')
    },
    {
      id: 'campaign-history',
      title: t('campaign_history'),
      desc: t('campaign_history_desc'),
      icon: History,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      badge: t('analytics')
    }
  ];

  // Filtered offers list based on search and selected tab status
  const filteredOffers = offers.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatusTab === 'All' || o.status === selectedStatusTab;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDiscount || !newCode) return;

    const newOffer: Offer = {
      id: String(Date.now()),
      title: newTitle,
      discount: newDiscount,
      code: newCode.toUpperCase().replace(/\s+/g, ''),
      status: newStatus,
      startDate: newStartDate || 'Dec 1',
      endDate: newEndDate || 'Dec 31',
      category: newCategory,
      imageUrl: newImageUrl || imagePresets[0].url,
      views: 0,
      shares: 0,
      redeemed: 0
    };

    setOffers([newOffer, ...offers]);
    
    // Reset Form
    setNewTitle('');
    setNewDiscount('');
    setNewCode('');
    setNewStatus('Active');
    setNewStartDate('');
    setNewEndDate('');
    setNewCategory('Haircuts');
    setNewImageUrl('');
    setIsCreateModalOpen(false);
  };

  const handleDeleteOffer = (id: string) => {
    setOffers(offers.filter(o => o.id !== id));
    setActiveMenuId(null);
  };

  return (
    <Layout currentScreen="marketing" navigate={navigate} title={selectedSubModule === 'offers' ? t('offers_discounts') : t('marketing_studio')}>
      
      {selectedSubModule === 'offers' ? (
        /* Full Offers SubModule Screen mapped beautifully from standard HTML blueprint */
        <div className="p-4 space-y-6 pb-28 max-w-md mx-auto w-full">
          
          {/* Header Bar within submodule */}
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedSubModule(null)} 
                className="p-2 rounded-xl text-primary hover:bg-primary/5 border border-primary/10 transition-colors"
                title={t('back_to_marketing')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-on-surface tracking-tight">{t('offers_management')}</h2>
                <p className="text-xs text-on-surface-variant">{t('offers_management_desc')}</p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('create_offer')}</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-5 h-5" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search offers by name, code or category..."
                className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl font-body text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/50 hover:text-on-surface"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button className="flex-shrink-0 h-12 w-12 bg-surface-container-lowest border border-outline-variant/30 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Status Tabs */}
          <div className="overflow-x-auto hide-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
            <div className="flex gap-2 min-w-max pb-1">
              {(['All', 'Active', 'Scheduled', 'Draft', 'Expired'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedStatusTab(tab)}
                  className={`px-5 py-2 rounded-full font-body text-xs font-bold transition-all border cursor-pointer ${
                    selectedStatusTab === tab 
                      ? 'bg-primary text-white border-primary shadow-sm' 
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-low'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Offers List Grid */}
          {filteredOffers.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl space-y-3.5">
              <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center mx-auto text-on-surface-variant/40">
                <Tag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-on-surface">No Offers Found</h4>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto">Try matching another search query or create a fresh coupon using the action above.</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="text-primary text-xs font-bold hover:underline inline-flex items-center gap-1"
              >
                Create Coupon Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOffers.map((offer) => (
                <div 
                  key={offer.id} 
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 relative group"
                >
                  {/* Top Image & Badge Section */}
                  <div className="h-44 w-full relative overflow-hidden bg-surface-container">
                    <img 
                      src={offer.imageUrl} 
                      alt={offer.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Status badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-black/5 flex items-center gap-1.5 shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        offer.status === 'Active' ? 'bg-emerald-500' :
                        offer.status === 'Scheduled' ? 'bg-amber-500' :
                        offer.status === 'Draft' ? 'bg-slate-400' : 'bg-rose-500'
                      }`} />
                      <span className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wider">{offer.status}</span>
                    </div>

                    {/* Quick Menu Toggle */}
                    <div className="absolute top-3 right-3">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === offer.id ? null : offer.id)}
                        className="w-8 h-8 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center text-slate-700 hover:text-black transition-colors shadow-sm cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown overlay */}
                      <AnimatePresence>
                        {activeMenuId === offer.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute right-0 mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg py-1.5 min-w-[120px] z-25 text-left"
                          >
                            <button
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Offer</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-grow flex flex-col space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-base font-bold text-on-surface line-clamp-1">{offer.title}</h3>
                        <span className="text-xs text-on-surface-variant font-medium">{offer.category}</span>
                      </div>
                      <span className="text-base font-extrabold text-primary shrink-0">{offer.discount}</span>
                    </div>

                    <div className="bg-primary/5 border border-primary/15 rounded-lg px-3.5 py-2 w-fit">
                      <span className="text-xs font-extrabold text-primary tracking-widest uppercase">CODE: {offer.code}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                        <Calendar className="w-4 h-4 text-on-surface-variant/70" />
                        <span>Validity: {offer.startDate} - {offer.endDate}</span>
                      </div>
                    </div>

                    {/* Stats Section with native dividers */}
                    <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center text-center">
                      <div className="flex-1 flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{offer.views.toLocaleString()}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Views</span>
                      </div>
                      <div className="w-px h-8 bg-outline-variant/30" />
                      <div className="flex-1 flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{offer.shares.toLocaleString()}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Shares</span>
                      </div>
                      <div className="w-px h-8 bg-outline-variant/30" />
                      <div className="flex-1 flex flex-col">
                        <span className="text-sm font-bold text-primary">{offer.redeemed.toLocaleString()}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Redeemed</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Floating Action button to trigger screen creation */}
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 z-40 md:right-10 md:bottom-10 cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Create Offer Modal Form */}
          <AnimatePresence>
            {isCreateModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                <motion.form 
                  onSubmit={handleCreateOffer}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-surface rounded-2xl border border-outline-variant p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                    <h3 className="text-base font-bold text-on-surface">Add New Promotional Offer</h3>
                    <button 
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    
                    {/* Offer Title */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-on-surface">Offer Name / Title</label>
                      <input 
                        type="text" 
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Diwali Splendor, Festive Glow"
                        className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Discount Label */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface">Discount Tag</label>
                        <input 
                          type="text" 
                          required
                          value={newDiscount}
                          onChange={(e) => setNewDiscount(e.target.value)}
                          placeholder="e.g. 20% Off, Buy 1 Get 1"
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                        />
                      </div>

                      {/* Promo Code */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface">Promo Code</label>
                        <input 
                          type="text" 
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="e.g. FESTIVE20"
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface">Start Validity</label>
                        <input 
                          type="text" 
                          value={newStartDate}
                          onChange={(e) => setNewStartDate(e.target.value)}
                          placeholder="e.g. Dec 1"
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                        />
                      </div>

                      {/* End Date */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface">End Validity</label>
                        <input 
                          type="text" 
                          value={newEndDate}
                          onChange={(e) => setNewEndDate(e.target.value)}
                          placeholder="e.g. Dec 31"
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface">Service Scope Category</label>
                        <select 
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                        >
                          <option value="Haircuts">Haircuts & Trim</option>
                          <option value="All Facials">All Facials</option>
                          <option value="Manicure">Manicure & Nails</option>
                          <option value="Salon Package">Full Salon Package</option>
                        </select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface">Campaign Status</label>
                        <select 
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as any)}
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                        >
                          <option value="Active">Active</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Draft">Draft</option>
                          <option value="Expired">Expired</option>
                        </select>
                      </div>
                    </div>

                    {/* Image Suggestions / Presets */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-on-surface">Choose Promo Cover Art</label>
                      <div className="grid grid-cols-4 gap-2">
                        {imagePresets.map((preset, pidx) => (
                          <button
                            key={pidx}
                            type="button"
                            onClick={() => setNewImageUrl(preset.url)}
                            className={`relative rounded-lg overflow-hidden h-12 border-2 transition-all ${
                              newImageUrl === preset.url ? 'border-primary scale-98 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                              <span className="text-[8px] text-white font-extrabold text-center leading-tight">{preset.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-variant transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
                    >
                      Save Campaign
                    </button>
                  </div>
                </motion.form>
              </div>
            )}
          </AnimatePresence>

        </div>
      ) : selectedSubModule === 'ai-offer-creator' ? (
        /* Full AI Offer Creator Screen mapped from user HTML layout */
        <div className="p-4 space-y-6 pb-28 max-w-md mx-auto w-full">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setSelectedSubModule(null);
                  setGeneratedOffer(null);
                }} 
                className="p-2 rounded-xl text-primary hover:bg-primary/5 border border-primary/10 transition-colors"
                title="Back to Marketing Studio"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-on-surface tracking-tight">AI Offer Creator</h2>
                <p className="text-xs text-on-surface-variant">Generate high-converting salon offers with Google Gemini</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 space-y-5 shadow-xs">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 pb-2 border-b border-outline-variant/20">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Campaign Settings
              </h3>

              {/* Goal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Campaign Goal</label>
                <select 
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option>Increase bookings</option>
                  <option>Bring back inactive customers</option>
                  <option>Promote a new service</option>
                  <option>Fill empty slots</option>
                  <option>Festival promotion</option>
                  <option>Increase repeat visits</option>
                  <option>Increase weekday bookings</option>
                </select>
              </div>

              {/* Customer Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Target Customer Type</label>
                <select 
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="All">Everyone (All Clients)</option>
                  <option value="New">First-Time Visitors</option>
                  <option value="Repeat">Regular / Repeat Clients</option>
                  <option value="Inactive">Inactive / Lapsed Clients</option>
                  <option value="VIP">VIP Clients</option>
                  <option value="Birthday">Birthday Celebrants</option>
                </select>
              </div>

              {/* Festival or Occasion */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Festival or Occasion (Optional)</label>
                <input 
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="e.g. Diwali, Valentine's Day, Summer"
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Services to Promote */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Services to Promote</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableServices.map((service) => {
                    const isSelected = selectedServices.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedServices(selectedServices.filter(s => s !== service));
                          } else {
                            setSelectedServices([...selectedServices, service]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          isSelected 
                            ? 'bg-primary text-white border-primary shadow-xs' 
                            : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                        }`}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discount Preference */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Discount Preference</label>
                <select 
                  value={discountPreference}
                  onChange={(e) => setDiscountPreference(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="Percentage">Percentage Discount (e.g. 20% Off)</option>
                  <option value="Fixed">Fixed Amount Off (e.g. ₹500 Off)</option>
                  <option value="BOGO">BOGO (Buy One Get One)</option>
                </select>
              </div>

              {/* Validity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Offer Validity</label>
                <input 
                  type="text"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  placeholder="e.g. Valid until Friday, Dec 1 - Dec 31"
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Communication Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Hinglish</option>
                </select>
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">Brand Tone</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Professional", "Friendly", "Premium", "Urgent"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`h-9 rounded-lg text-xs font-bold border transition-all ${
                        tone === t 
                          ? 'bg-primary text-white border-primary shadow-xs' 
                          : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateOffer}
                disabled={aiLoading}
                className="w-full h-12 bg-primary text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md hover:brightness-105 active:scale-98 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{aiLoading ? 'Generating...' : 'Generate Offer'}</span>
              </button>
            </div>

            {/* Result Column */}
            <div className="lg:col-span-7 space-y-6">
              {aiLoading ? (
                /* Shimmer Loading State */
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 space-y-6 shadow-xs flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center animate-spin">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <h4 className="text-sm font-bold text-on-surface">Writing Your Offer...</h4>
                    <p className="text-xs text-on-surface-variant">Our Google Gemini model is crafting a high-end luxury promotion.</p>
                  </div>
                  <div className="w-full space-y-4 pt-4">
                    <div className="h-44 bg-surface-container-low rounded-xl animate-pulse w-full"></div>
                    <div className="h-8 bg-surface-container-low rounded-lg animate-pulse w-3/4"></div>
                    <div className="h-16 bg-surface-container-low rounded-lg animate-pulse w-full"></div>
                    <div className="h-24 bg-surface-container-low rounded-lg animate-pulse w-full"></div>
                  </div>
                </div>
              ) : generatedOffer ? (
                /* Rich Interactive Result Preview */
                <div className="space-y-6">
                  {/* AI Generated Preview badge */}
                  <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full w-fit mx-auto border border-primary/25">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">AI-Generated Preview</span>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 space-y-5 shadow-xs">
                    {/* Live Header Image Banner Card */}
                    <div className="relative h-44 rounded-xl overflow-hidden bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
                      <img 
                        src={
                          selectedServices.includes("Facial & Spa") ? 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop' :
                          selectedServices.includes("Haircut") ? 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1200&auto=format&fit=crop' :
                          selectedServices.includes("Manicure & Nails") ? 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200&auto=format&fit=crop' :
                          selectedServices.includes("Makeup Lounge") ? 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1200&auto=format&fit=crop' :
                          'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop'
                        } 
                        alt="Salon Promo banner background" 
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/55 backdrop-blur-[0.5px]"></div>
                      <div className="relative text-center px-4 space-y-2 z-10">
                        <span className="text-[10px] font-extrabold text-white bg-primary/40 border border-primary/30 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                          {discountPreference === 'Percentage' ? '20% OFF' : discountPreference === 'Fixed' ? '₹500 OFF' : 'BOGO'}
                        </span>
                        <h4 className="text-lg font-bold text-white tracking-tight line-clamp-2 max-w-md mx-auto">
                          {generatedOffer.title}
                        </h4>
                      </div>
                    </div>

                    {/* Inputs Section */}
                    <div className="space-y-4">
                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-on-surface-variant">Offer Title</label>
                        <input 
                          type="text" 
                          value={generatedOffer.title}
                          onChange={(e) => setGeneratedOffer({ ...generatedOffer, title: e.target.value })}
                          className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Promo Text */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-on-surface-variant">Short Promotional Text</label>
                        <textarea 
                          rows={2}
                          value={generatedOffer.shortPromoText}
                          onChange={(e) => setGeneratedOffer({ ...generatedOffer, shortPromoText: e.target.value })}
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
                        />
                      </div>

                      {/* WhatsApp text with Copy functionality */}
                      <div className="space-y-1 relative">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-bold text-on-surface-variant">WhatsApp Message</label>
                          <button 
                            onClick={() => handleCopyText(generatedOffer.whatsappMessage)}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedText ? 'Copied!' : 'Copy Template'}
                          </button>
                        </div>
                        <textarea 
                          rows={4}
                          value={generatedOffer.whatsappMessage}
                          onChange={(e) => setGeneratedOffer({ ...generatedOffer, whatsappMessage: e.target.value })}
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Coupon Code & Terms */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Suggested Coupon Code</label>
                          <div className="flex items-center bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 w-fit">
                            <span className="text-xs font-extrabold text-primary tracking-widest uppercase">{generatedOffer.suggestedCouponCode}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-on-surface-variant">Terms &amp; Conditions</label>
                          <textarea 
                            rows={2}
                            value={generatedOffer.termsAndConditions}
                            onChange={(e) => setGeneratedOffer({ ...generatedOffer, termsAndConditions: e.target.value })}
                            className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[11px] text-on-surface focus:outline-none focus:border-primary resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons inside the result card */}
                    <div className="pt-4 border-t border-outline-variant/20 flex gap-3">
                      <button 
                        onClick={handleGenerateOffer}
                        className="flex-1 py-2.5 bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Generate Again
                      </button>
                    </div>
                  </div>

                  {/* Sticky/Fixed bottom action bar for result preview */}
                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-md flex gap-3">
                    <button 
                      onClick={() => handlePublishGeneratedOffer('Draft')}
                      className="flex-1 py-3 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button 
                      onClick={() => handleCopyText(generatedOffer.whatsappMessage)}
                      className="flex-1 py-3 bg-secondary text-white hover:brightness-110 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{copiedText ? 'Copied!' : 'Copy & Share'}</span>
                    </button>
                    <button 
                      onClick={() => handlePublishGeneratedOffer('Active')}
                      className="flex-1 py-3 bg-primary text-white hover:brightness-110 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      Publish Campaign
                    </button>
                  </div>
                </div>
              ) : (
                /* Unclicked Empty State */
                <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl space-y-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-on-surface">Gemini AI Ready</h4>
                    <p className="text-xs text-on-surface-variant max-w-sm mx-auto">Fill in the campaign configurations on the left side, then click **Generate Offer** to see the magic happen!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : selectedSubModule === 'festival-templates' ? (
        <FestivalTemplates 
          onBack={() => setSelectedSubModule(null)}
          onUseTemplate={(template) => {
            setSelectedSubModule('offers');
            setNewTitle(`${template.title} Special`);
            setNewDiscount(template.discount);
            setNewImageUrl(template.imageUrl);
            setIsCreateModalOpen(true);
          }}
        />
      ) : selectedSubModule === 'poster-creator' ? (
        <PosterCreator onBack={() => setSelectedSubModule(null)} />
      ) : selectedSubModule === 'whatsapp-campaign' ? (
        <WhatsAppCampaign onBack={() => setSelectedSubModule(null)} />
      ) : selectedSubModule === 'auto-reminder' ? (
        <AutoReminder onBack={() => setSelectedSubModule(null)} />
      ) : selectedSubModule === 'campaign-history' ? (
        <CampaignHistory onBack={() => setSelectedSubModule(null)} />
      ) : (
        /* Regular Marketing Hub Screen */
        <div className="p-5 space-y-6 pb-28">
          {/* Hub Header Card */}
          <div className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 shadow-sm">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 relative">
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Blueprint Suite
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight mt-1.5">
                  Salon Marketing Studio
                </h2>
                <p className="text-xs text-on-surface-variant max-w-xl">
                  Engage your clientele, design beautiful promo assets, launch custom WhatsApp messages, and auto-remind your regular visitors using modern campaigns.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0 bg-primary/5 border border-primary/10 rounded-xl p-3">
                <div className="text-right">
                  <span className="block text-[10px] text-on-surface-variant uppercase font-bold">Total Reach</span>
                  <span className="block text-lg font-bold text-primary">1,420 Clients</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Performance Metrics */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { label: 'Active Offers', value: `${offers.filter(o => o.status === 'Active').length} Promo Codes`, icon: Tag, change: '+12% this week' },
              { label: 'WhatsApp Sent', value: '840 Msg', icon: MessageSquare, change: '98.5% Delivered' },
              { label: 'Conversion', value: '18.4%', icon: TrendingUp, change: '14 New bookings' }
            ].map((metric, idx) => (
              <div key={idx} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-on-surface-variant font-medium leading-none">{metric.label}</span>
                  <metric.icon className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                </div>
                <div className="text-base font-bold text-on-surface tracking-tight pt-1">{metric.value}</div>
                <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 leading-none">{metric.change}</div>
              </div>
            ))}
          </div>

          {/* Blueprint Modules List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                Campaign Blueprint Tools
              </h3>
              <span className="text-[10px] font-bold text-primary">7 Modules Configured</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketingModules.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubModule(item.id);
                    }}
                    className="w-full text-left bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 rounded-xl p-4.5 flex gap-4 transition-all duration-300 hover:shadow-md cursor-pointer group"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${item.color} group-hover:scale-105 transition-transform duration-300`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-on-surface group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-on-surface-variant/70 bg-surface-container px-1.5 py-0.5 rounded-sm shrink-0">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-on-surface-variant group-hover:text-on-surface transition-colors line-clamp-2">
                        {item.desc}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-primary font-bold pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Open Blueprint Screen</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blueprint Detail Modal for other placeholder screens */}
          <AnimatePresence>
            {selectedSubModule && 
             selectedSubModule !== 'offers' && 
             selectedSubModule !== 'ai-offer-creator' && 
             selectedSubModule !== 'festival-templates' && 
             selectedSubModule !== 'poster-creator' &&
             selectedSubModule !== 'whatsapp-campaign' &&
             selectedSubModule !== 'auto-reminder' &&
             selectedSubModule !== 'campaign-history' && (() => {
              const mod = marketingModules.find(m => m.id === selectedSubModule);
              if (!mod) return null;
              const ModIcon = mod.icon;

              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface rounded-2xl border border-outline-variant p-6 max-w-md w-full shadow-2xl space-y-4"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${mod.color}`}>
                          <ModIcon className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-bold text-on-surface">{mod.title}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedSubModule(null)}
                        className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                      >
                        <span className="text-lg font-bold">✕</span>
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      <p className="text-xs leading-relaxed text-on-surface-variant">
                        This screen module is currently mapped according to your customized application blueprint:
                      </p>
                      
                      <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Blueprint Node:</span>
                        <div className="text-xs font-bold text-on-surface">
                          Marketing → {mod.title}
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">
                          Ready to load customized code or dynamic integration once standard campaign code is uploaded.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Available Actions</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => {
                              setSelectedSubModule(null);
                            }}
                            className="p-2.5 bg-surface-container border border-outline-variant/40 rounded-xl text-[11px] font-bold text-on-surface hover:bg-surface-variant transition-colors"
                          >
                            Configure Rules
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedSubModule(null);
                            }}
                            className="p-2.5 bg-primary text-white rounded-xl text-[11px] font-bold hover:brightness-110 transition-all"
                          >
                            Launch Builder
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubModule(null)}
                        className="w-full py-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-variant transition-all cursor-pointer"
                      >
                        Back to Marketing Hub
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </AnimatePresence>

        </div>
      )}

    </Layout>
  );
}
