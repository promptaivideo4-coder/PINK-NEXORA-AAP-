import React, { useState, useEffect } from 'react';
import { NavigationProps, Customer } from '../types';
import { 
  ArrowLeft, Edit3, Phone, Mail, MapPin, Calendar, MessageSquare, 
  User, CreditCard, ShieldAlert, Award, Star, History, Plus, 
  Trash2, PlusCircle, Check, X, Compass, DollarSign, Eye, Clock, 
  Camera, Coffee, VolumeX, Shield, Heart, HelpCircle
} from 'lucide-react';
import TopBar from '../components/TopBar';
import { motion, AnimatePresence } from 'motion/react';

// Default static Isabella Rossi profile data if none in localStorage
const ISABELLA_ROSSI: Customer = {
  id: 'isabella',
  name: 'Isabella Rossi',
  type: 'VIP',
  lastVisit: 'Aug 05',
  spend: '$4,200',
  visits: '24',
  initials: 'IR',
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSASh8fQbXRphLrWlNUiZJkDAPzXTKKOj0wxBl_dEfVg5YjX_QjzuayOuck-4bqtQuoxVVYJLL35bXm7ClOVeMELqfIMK52Fi-23S7uogMSFKDuKkOPu4GsU1AzN7H9q2fneBzJu3YUgrH2cCRAVNjuZfeNcjendo_pDd8ZyiyZnMQVB_OW8QOuX34tGDizguwOOHdahxKDbJ5ODAoRyA6dl3VzuzcgXKZECHCYTm7fG3qHg87pxhUvs30iDvRfSPSKQYDAOqZzp8',
  phone: '+1 (310) 555-0142',
  email: 'isabella.rossi@example.com',
  address: 'Beverly Hills, CA',
  notes: 'Allergic to specific brand of PPD hair dye. Ensure use of PPD-free color lines only.',
  history: [
    { id: 'h1', date: 'Aug 05, 2023', service: 'Full Highlight & Cut', provider: 'Senior Stylist Emma', price: '$320' },
    { id: 'h2', date: 'May 18, 2023', service: 'Root Touch-up & Blowout', provider: 'Stylist Sarah', price: '$150' },
  ]
};

// Extracted presets matching the HTML exactly
const DEFAULT_PREFERENCES = [
  'Prefers iced oat milk latte during long services.',
  'Likes a quiet appointment (minimal chatting).',
  'Tender-headed; use gentle detangling brush.'
];

const DEFAULT_FORMULAS = [
  {
    date: 'Aug 05, 2023 - Balayage',
    formula: 'Base: 6N (20g) + 6A (10g) + 10vol\nLightener: Clay based + 30vol\nGloss: 9V (15g) + 9T (15g) + Processing Sol.'
  }
];

const DEFAULT_PHOTOS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBExh5c5GWEUi04riKGQ3zsnG37MxeoYvZ41T6I3aZHLpl8oOAerKJsm9Z3-JsxL9biqq-OfDvTMTQOZ-t9oUNgBnRmP_x1gYVKTY24yGMwQYeDgE7T303a0_GgMputRhk3OOuiwDv_CXtDlj0Gj-91YD1XzLcURCNRHM2JhFsoho2Jpb66XK_S5Qz-a-N2J0ZGI8Aba4culLm8Oq5tv_xFb_171V_j-8nKzR14t3SeSPTdNQurCj738BTHxh6PO29de__RZcET3S0',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD1aGwil-V4tWg0RGfgOS8dRe0qzUUwdxBwWUD2vd3zcN8nldMNrG6Grr-sZaX5DjQhfqNV0yqjRCOaGzSGwDgIsv0EirDX1dLCWSWAqkRehMloHMEUNQ35V9Yu-3_E_uxF8WHG55bMix6J32G6HZNCsZf2EQzZIkcU4OzIfRmQ1qwqBDKzTnxzaLZ4gFDumHmUJ-RI6BWOpeFO2Ibo1a77w6mI_m0DCVnFfUdQvYLnCH6XElkFdOH4H84o6PRF_f-al0NgP9NN1Uo'
];

type TabType = 'bookings' | 'history' | 'notes' | 'wallet';

export default function CustomerProfile({ navigate }: NavigationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [customer, setCustomer] = useState<Customer>(ISABELLA_ROSSI);
  
  // Custom states for the Isabella detail cards that aren't strictly on Customer type
  const [preferences, setPreferences] = useState<string[]>(DEFAULT_PREFERENCES);
  const [formulas, setFormulas] = useState<Array<{date: string, formula: string}>>(DEFAULT_FORMULAS);
  const [photos, setPhotos] = useState<string[]>(DEFAULT_PHOTOS);
  const [storeCredit, setStoreCredit] = useState(150.00);
  const [loyaltyPoints, setLoyaltyPoints] = useState(850);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editType, setEditType] = useState<'VIP' | 'Gold Member' | 'New' | 'Standard'>('VIP');

  // Input states for adding items
  const [newPreference, setNewPreference] = useState('');
  const [newFormulaDate, setNewFormulaDate] = useState('');
  const [newFormulaText, setNewFormulaText] = useState('');
  const [showFormulaForm, setShowFormulaForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load selected customer from localStorage if available
    const savedId = localStorage.getItem('selected_customer_id');
    const savedCustomerStr = localStorage.getItem('selected_customer_data');
    
    if (savedCustomerStr) {
      try {
        const parsed = JSON.parse(savedCustomerStr) as Customer;
        setCustomer(parsed);
        // Map types to reasonable mock metrics for other clients
        if (parsed.id !== 'isabella') {
          setStoreCredit(parsed.type === 'VIP' ? 200 : parsed.type === 'Gold Member' ? 100 : 0);
          setLoyaltyPoints(parsed.type === 'VIP' ? 1200 : parsed.type === 'Gold Member' ? 650 : 150);
          setPreferences([
            'Prefers standard salon setup.',
            'Likes to view magazine catalogs.',
            parsed.notes || 'No specific requests.'
          ]);
          setFormulas([
            { date: 'Recent Session Formula', formula: 'Standard hydration therapy + premium split-end treatment gloss.' }
          ]);
          setPhotos([]);
        } else {
          setCustomer(ISABELLA_ROSSI);
          setStoreCredit(150.00);
          setLoyaltyPoints(850);
          setPreferences(DEFAULT_PREFERENCES);
          setFormulas(DEFAULT_FORMULAS);
          setPhotos(DEFAULT_PHOTOS);
        }
      } catch (e) {
        console.error("Error parsing customer details, loading Isabella Rossi", e);
        setCustomer(ISABELLA_ROSSI);
      }
    } else {
      setCustomer(ISABELLA_ROSSI);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenEdit = () => {
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditEmail(customer.email);
    setEditAddress(customer.address);
    setEditType(customer.type);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...customer,
      name: editName,
      phone: editPhone,
      email: editEmail,
      address: editAddress,
      type: editType
    };
    setCustomer(updated);
    localStorage.setItem('selected_customer_data', JSON.stringify(updated));
    setIsEditModalOpen(false);
    triggerToast('Client profile updated successfully!');
  };

  const handleAddPreference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreference.trim()) return;
    setPreferences(prev => [...prev, newPreference.trim()]);
    setNewPreference('');
    triggerToast('Preference preference added!');
  };

  const handleDeletePreference = (index: number) => {
    setPreferences(prev => prev.filter((_, i) => i !== index));
    triggerToast('Preference removed');
  };

  const handleAddFormula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormulaDate.trim() || !newFormulaText.trim()) return;
    setFormulas(prev => [...prev, {
      date: newFormulaDate.trim(),
      formula: newFormulaText.trim()
    }]);
    setNewFormulaDate('');
    setNewFormulaText('');
    setShowFormulaForm(false);
    triggerToast('Color formula recorded!');
  };

  const handleAddPhoto = () => {
    // Mock photo addition using beautiful stock portrait
    const list = [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80'
    ];
    const randomPhoto = list[Math.floor(Math.random() * list.length)];
    setPhotos(prev => [...prev, randomPhoto]);
    triggerToast('New appointment photo added to portfolio!');
  };

  const handleTopUp = () => {
    setStoreCredit(prev => prev + 50);
    triggerToast('Credited $50.00 to store account!');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface pb-32 font-sans flex flex-col items-center">
      
      {/* Header Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-6 h-16 max-w-full">
        <button 
          onClick={() => navigate('customers')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 text-on-surface-variant"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <h1 className="font-semibold text-lg text-primary truncate px-4 max-w-[60%]">
          {customer.name}
        </h1>
        
        <button 
          onClick={handleOpenEdit}
          className="text-primary-container font-semibold text-sm hover:opacity-80 transition-opacity active:scale-95 px-2"
        >
          Edit
        </button>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[800px] mt-20 px-4 md:px-8 space-y-8 pb-[env(safe-area-inset-bottom,20px)] flex-grow">
        
        {/* Dynamic Background Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] max-w-[600px] h-[300px] bg-primary-container/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        {/* Profile Card Section */}
        <section className="flex flex-col items-center justify-center text-center gap-4 w-full relative z-10 pt-4 animate-fade-in-up">
          
          {/* Avatar frame with dynamic VIP ring */}
          <div className="relative inline-block group">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-primary-container to-secondary-container opacity-25 blur-sm group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-primary-container to-secondary-container p-[2px]">
              <div className="w-full h-full bg-surface rounded-full"></div>
            </div>
            
            {customer.image ? (
              <img 
                className="relative w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-lg border-[3px] border-surface" 
                src={customer.image} 
                alt={customer.name} 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-primary-container/10 border-[3px] border-surface flex items-center justify-center text-primary-container font-extrabold text-3xl shadow-lg">
                {customer.initials || 'CL'}
              </div>
            )}
            
            {/* VIP / Gold Badge overlay */}
            <div className="absolute bottom-0 right-0 bg-primary-container text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md border-2 border-surface transform translate-x-1/4 translate-y-1/4 uppercase tracking-widest">
              {customer.type}
            </div>
          </div>

          {/* Customer Metadata */}
          <div className="flex flex-col items-center gap-1.5">
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">{customer.name}</h2>
            <p className="text-sm text-on-surface-variant flex items-center gap-1 font-medium">
              <MapPin className="w-4 h-4 text-primary-container shrink-0" />
              <span>{customer.address || 'Address not listed'}</span>
            </p>
            <p className="text-xs text-on-surface-variant/80 mt-1 font-semibold tracking-wider uppercase">
              Client since {customer.id === 'isabella' ? 'Mar 2021' : 'Recently'}
            </p>
          </div>

          {/* Fast Contact Options */}
          <div className="flex gap-4 mt-2 w-full max-w-xs mx-auto">
            <a 
              href={`tel:${customer.phone}`} 
              className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-surface-variant/30 text-on-surface py-3.5 rounded-2xl border border-outline-variant/30 shadow-xs active:scale-95 transition-all"
            >
              <Phone className="w-5 h-5 text-primary-container" />
              <span className="text-xs font-semibold">Call</span>
            </a>
            <a 
              href={`mailto:${customer.email}`}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-surface-variant/30 text-on-surface py-3.5 rounded-2xl border border-outline-variant/30 shadow-xs active:scale-95 transition-all"
            >
              <MessageSquare className="w-5 h-5 text-primary-container" />
              <span className="text-xs font-semibold">Message</span>
            </a>
          </div>
        </section>

        {/* Bento Metrics block */}
        <section className="grid grid-cols-3 gap-3 md:gap-4 w-full">
          <div className="bg-white rounded-[20px] p-4 flex flex-col items-center justify-center text-center border border-outline-variant/20 shadow-xs hover:-translate-y-0.5 transition-transform">
            <Calendar className="w-5 h-5 text-outline-variant mb-1.5" />
            <span className="text-xl md:text-2xl font-black text-on-surface">{customer.visits || '1'}</span>
            <span className="text-[11px] font-bold text-on-surface-variant mt-0.5 uppercase tracking-wider">Total Visits</span>
          </div>

          <div className="bg-white rounded-[20px] p-4 flex flex-col items-center justify-center text-center border border-outline-variant/20 shadow-xs hover:-translate-y-0.5 transition-transform relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary-container/5 rounded-full blur-lg"></div>
            <CreditCard className="w-5 h-5 text-primary-container mb-1.5" />
            <span className="text-xl md:text-2xl font-black text-on-surface">{customer.spend || '$150'}</span>
            <span className="text-[11px] font-bold text-on-surface-variant mt-0.5 uppercase tracking-wider">Total Spend</span>
          </div>

          <div className="bg-white rounded-[20px] p-4 flex flex-col items-center justify-center text-center border border-outline-variant/20 shadow-xs hover:-translate-y-0.5 transition-transform">
            <Star className="w-5 h-5 text-outline-variant mb-1.5" />
            <span className="text-xl md:text-2xl font-black text-on-surface">{loyaltyPoints}</span>
            <span className="text-[11px] font-bold text-on-surface-variant mt-0.5 uppercase tracking-wider">Loyalty Pts</span>
          </div>
        </section>

        {/* Custom Nav Tab Bar */}
        <section className="w-full">
          <div className="flex overflow-x-auto no-scrollbar gap-5 pb-1 mb-6 border-b border-outline-variant/20 sticky top-16 z-40 bg-background/90 backdrop-blur-md pt-2">
            {[
              { id: 'bookings', label: 'Bookings' },
              { id: 'history', label: 'History & Photos' },
              { id: 'notes', label: 'Notes & Formulas' },
              { id: 'wallet', label: 'Wallet & Billing' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`pb-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-primary-container border-primary-container scale-102'
                    : 'text-on-surface-variant hover:text-on-surface border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENTS */}

          {/* 1. Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-[16px] font-bold text-on-surface tracking-tight">Upcoming Appointments</h3>
              
              {/* Upcoming Appointment card */}
              <div className="bg-white rounded-[22px] p-5 flex flex-col sm:flex-row gap-5 border border-outline-variant/20 shadow-xs border-l-4 border-l-primary-container relative overflow-hidden group">
                <div className="shrink-0 flex flex-col items-center justify-center bg-surface-container-low rounded-2xl p-4 min-w-[90px]">
                  <span className="text-[11px] font-black text-primary-container uppercase tracking-widest">OCT</span>
                  <span className="text-3xl font-black text-on-surface mt-0.5">12</span>
                  <span className="text-[11px] font-bold text-on-surface-variant/80 mt-1">10:00 AM</span>
                </div>

                <div className="flex flex-col justify-center flex-grow space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-on-surface">Balayage &amp; Tone</h4>
                      <p className="text-sm font-medium text-on-surface-variant">With Senior Stylist Emma</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Confirmed
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-xl text-xs font-medium text-on-surface-variant">
                      <Clock className="w-3.5 h-3.5 text-primary-container" /> 
                      <span>150 min</span>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-xl text-xs font-medium text-on-surface-variant">
                      <CreditCard className="w-3.5 h-3.5 text-primary-container" /> 
                      <span>$285</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Past History listing */}
              <h3 className="text-[16px] font-bold text-on-surface tracking-tight pt-2">Past Appointments</h3>
              
              <div className="space-y-3">
                {customer.history && customer.history.length > 0 ? (
                  customer.history.map((hist) => (
                    <div key={hist.id} className="bg-white/70 rounded-[18px] p-4 flex items-center gap-4 border border-outline-variant/20 shadow-xs">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                        <History className="w-5 h-5 text-on-surface-variant/70" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm text-on-surface">{hist.service}</h4>
                        <p className="text-xs text-on-surface-variant">With {hist.provider} • {hist.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-on-surface">{hist.price}</span>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Paid</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant italic">No previous appointment records available.</p>
                )}
              </div>
            </div>
          )}

          {/* 2. History & Photos Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-on-surface tracking-tight">Styling Portfolio &amp; History</h3>
                  <p className="text-xs text-on-surface-variant">Visual records of cuts, color treatments, and styles</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-3 py-1.5 bg-primary-container/10 text-primary-container text-xs font-bold rounded-full hover:bg-primary-container/20 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>

              {/* Dynamic Photo Gallery Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group shadow-xs border border-outline-variant/20 bg-white">
                    <img 
                      src={photo} 
                      alt={`Customer styling photo ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <span className="text-white font-bold text-xs">Aug 05, 2023</span>
                      <span className="text-white/80 text-[10px]">Balayage &amp; Tone Styling</span>
                    </div>
                  </div>
                ))}
                
                {/* Upload Action placeholder */}
                <div 
                  onClick={handleAddPhoto}
                  className="relative aspect-square rounded-2xl bg-surface-container-low border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary-container hover:text-primary-container hover:bg-white transition-all cursor-pointer group"
                >
                  <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform text-outline-variant" />
                  <span className="text-xs font-bold text-center px-4 leading-snug">Add Styling Photo</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Notes & Formulas Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Preferences Section */}
              <div className="bg-white rounded-[22px] p-5 border border-outline-variant/20 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                    <h4 className="font-bold text-sm text-on-surface uppercase tracking-wider">Preferences</h4>
                  </div>
                </div>

                <ul className="space-y-3">
                  {preferences.map((pref, index) => (
                    <li key={index} className="flex items-start justify-between gap-3 text-sm font-medium text-on-surface-variant group bg-surface-container-low/50 p-2.5 rounded-xl">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pref}</span>
                      </div>
                      <button 
                        onClick={() => handleDeletePreference(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-red-500 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Add Preference Input form */}
                <form onSubmit={handleAddPreference} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value)}
                    placeholder="e.g., Prefers specific stylist, iced coffee, quiet appointment..."
                    className="flex-grow rounded-xl text-xs px-3 py-2 border border-outline-variant/40 bg-surface focus:border-primary outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-container text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shrink-0"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Technical Color Formulas section */}
              <div className="bg-white rounded-[22px] p-5 border border-outline-variant/20 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-bold text-sm text-on-surface uppercase tracking-wider">Technical Color Formulas</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormulaForm(!showFormulaForm)}
                    className="text-xs font-bold text-primary-container flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Formula</span>
                  </button>
                </div>

                {showFormulaForm && (
                  <form onSubmit={handleAddFormula} className="bg-surface-container-low/50 p-4 rounded-xl space-y-3 border border-outline-variant/30">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface mb-1">Session Date &amp; Service</label>
                      <input
                        type="text"
                        required
                        value={newFormulaDate}
                        onChange={(e) => setNewFormulaDate(e.target.value)}
                        placeholder="e.g. Oct 12, 2026 - Balayage & Highlight"
                        className="w-full text-xs p-2 bg-white border border-outline-variant/40 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface mb-1">Chemical / Color Formula Ingredients</label>
                      <textarea
                        required
                        rows={3}
                        value={newFormulaText}
                        onChange={(e) => setNewFormulaText(e.target.value)}
                        placeholder="e.g. Base: 6N (20g) + 6A (10g) + 10vol..."
                        className="w-full text-xs p-2 bg-white border border-outline-variant/40 rounded-lg outline-none resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFormulaForm(false)}
                        className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-primary-container text-white rounded-lg text-xs font-bold"
                      >
                        Save Formula
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {formulas.map((f, index) => (
                    <div key={index} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                      <p className="font-bold text-xs text-on-surface mb-1.5">{f.date}</p>
                      <p className="font-mono text-[12px] text-on-surface-variant/90 leading-relaxed whitespace-pre-line">{f.formula}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medical Warnings/Allergies Alerts */}
              <div className="bg-error-container/20 rounded-[22px] p-5 border border-error/20 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-error">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <h4 className="font-bold text-sm uppercase tracking-wider">Medical / Allergies Info</h4>
                </div>
                <p className="text-xs sm:text-sm text-error/90 font-medium leading-relaxed">
                  {customer.notes || 'No registered allergic reactions or medical alerts listed for this client.'}
                </p>
              </div>
            </div>
          )}

          {/* 4. Wallet & Billing Tab */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* VIP Store credit wallet */}
              <div className="relative overflow-hidden rounded-[24px] p-6 text-white shadow-xl">
                {/* Visual Glassmorphism style gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-secondary-container opacity-90 z-0"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 z-0"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/4 z-0"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Store Credit</span>
                      <span className="text-4xl font-black mt-1">${storeCredit.toFixed(2)}</span>
                    </div>
                    <CreditCard className="w-8 h-8 opacity-80" />
                  </div>
                  
                  <div className="flex justify-between items-end pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-white/70">Membership tier</span>
                      <span className="font-bold text-base">VIP Platinum Account</span>
                    </div>
                    <button 
                      onClick={handleTopUp}
                      className="bg-white text-primary-container hover:bg-white/90 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      Top Up $50
                    </button>
                  </div>
                </div>
              </div>

              {/* Saved cards listing */}
              <h3 className="text-[16px] font-bold text-on-surface tracking-tight">Saved Payment Methods</h3>
              
              <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-outline-variant/20 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-surface-container rounded-lg flex items-center justify-center border border-outline-variant/10">
                    <CreditCard className="w-5 h-5 text-on-surface-variant/70" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-on-surface">•••• 4242</span>
                    <span className="text-xs text-on-surface-variant">Expires 12/25</span>
                  </div>
                </div>
                <span className="bg-primary/5 text-primary-container text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Default
                </span>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom Booking Action */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background via-background/90 to-transparent z-40 pb-6">
        <button 
          onClick={() => {
            // Save client information to auto-select in Booking
            localStorage.setItem('booking_auto_client_id', customer.id);
            localStorage.setItem('booking_auto_client_name', customer.name);
            navigate('new-appointment');
          }}
          className="w-full max-w-[800px] mx-auto block bg-primary-container text-white font-bold text-sm py-4 rounded-full shadow-[0px_10px_40px_rgba(230,0,126,0.25)] hover:shadow-[0px_10px_40px_rgba(230,0,126,0.4)] hover:-translate-y-0.5 active:scale-98 transition-all tracking-wide text-center uppercase"
        >
          Book New Appointment
        </button>
      </div>

      {/* SUCCESS TOAST MESSAGE */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-24 bg-on-surface text-surface text-xs font-semibold px-4 py-3 rounded-full shadow-lg z-50 flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] shadow-2xl p-6 sm:p-8 w-full max-w-md border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-on-surface">Edit Profile</h3>
                    <p className="text-xs text-on-surface-variant">Update client contact metadata</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 overflow-y-auto pr-1 no-scrollbar flex-1">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Location / City</label>
                  <input
                    type="text"
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Membership Status</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  >
                    <option value="VIP">VIP</option>
                    <option value="Gold Member">Gold Member</option>
                    <option value="Standard">Standard</option>
                    <option value="New">New Client</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 border border-outline-variant/40 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-container text-white rounded-xl text-xs font-bold hover:bg-primary transition-colors shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
