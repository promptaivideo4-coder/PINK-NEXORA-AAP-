import React, { useState } from 'react';
import TopBar from '../components/TopBar';
import { NavigationProps, Customer } from '../types';
import CustomerDetailModal from '../components/CustomerDetailModal';
import { Search, Plus, X, UserPlus, User, RotateCcw, Upload, Check, Mail, Phone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InstallAppBanner from '../components/InstallAppBanner';
import { useLanguage } from '../contexts/LanguageContext';

type FilterType = 'All' | 'VIP' | 'Members' | 'New';

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'isabella',
    name: 'Neha Gupta',
    type: 'VIP',
    lastVisit: 'Aug 05',
    spend: '₹42,000',
    visits: '24',
    initials: 'NG',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSASh8fQbXRphLrWlNUiZJkDAPzXTKKOj0wxBl_dEfVg5YjX_QjzuayOuck-4bqtQuoxVVYJLL35bXm7ClOVeMELqfIMK52Fi-23S7uogMSFKDuKkOPu4GsU1AzN7H9q2fneBzJu3YUgrH2cCRAVNjuZfeNcjendo_pDd8ZyiyZnMQVB_OW8QOuX34tGDizguwOOHdahxKDbJ5ODAoRyA6dl3VzuzcgXKZECHCYTm7fG3qHg87pxhUvs30iDvRfSPSKQYDAOqZzp8',
    phone: '+91 98765 11223',
    email: 'neha.gupta@example.com',
    address: 'Vasant Vihar, New Delhi',
    notes: 'Allergic to specific brand of PPD hair dye. Ensure use of PPD-free color lines only.',
    history: [
      { id: 'h1', date: 'Aug 05, 2026', service: 'Full Highlight & Cut', provider: 'Senior Stylist Aditi', price: '₹8,500' },
      { id: 'h2', date: 'May 18, 2026', service: 'Root Touch-up & Blowout', provider: 'Stylist Suman', price: '₹3,500' },
    ]
  },
  {
    id: '1',
    name: 'Ananya Sharma',
    type: 'VIP',
    lastVisit: 'Oct 12',
    spend: '₹1,25,000',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCt-PXhrzr1JwegXd4yq3Q-tOn-Y6DVNyA-dibhf_9y43Rv1G4vJGXWLGDaKPe25-EoJ9_GW-kQugV8F5X3LuB0mc2esYdTv3yerLaGI8E8K5Jx0dgyG_mRyiWBdsMbasm2_bo3TEC29iDoCiyWuofLHUaJoNEhlfClsnJUrENyongZGvk4WFRz5Od7hjNG9rvh_1PqxWstK0j49Z82TDa2RudlUlAZiyjYBrVKxyI2dTLjfs742Atdy6s0Y4QE-Fw_A1LO-s33uNc',
    phone: '+91 98765 43210',
    email: 'ananya.sharma@example.com',
    address: 'Bandra West, Mumbai, MH 400050',
    notes: 'Prefers quiet sessions. Always books with Rohan. Allergic to lavender products.',
    history: [
      { id: 'h1', date: 'Oct 12, 2026', service: 'Balayage & Cut', provider: 'Rohan', price: '₹12,500' },
      { id: 'h2', date: 'Aug 24, 2026', service: 'Root Touch-up & Gloss', provider: 'Rohan', price: '₹6,500' },
      { id: 'h3', date: 'Jul 05, 2026', service: 'Full Highlights', provider: 'Rohan', price: '₹14,000' },
    ]
  },
  {
    id: '2',
    name: 'Priya Kapoor',
    type: 'Gold Member',
    lastVisit: 'Sep 28',
    visits: '14',
    initials: 'PK',
    phone: '+91 98765 87654',
    email: 'priya.kapoor@example.com',
    address: 'Connaught Place, New Delhi, DL 110001',
    notes: 'Likes to chat during appointments. Prefers morning slots.',
    history: [
      { id: 'h4', date: 'Sep 28, 2026', service: 'Women\'s Haircut', provider: 'Ananya', price: '₹3,500' },
      { id: 'h5', date: 'Aug 15, 2026', service: 'Blowout', provider: 'Ananya', price: '₹2,200' },
    ]
  },
  {
    id: '3',
    name: 'Rohan Verma',
    type: 'Standard',
    lastVisit: 'Oct 20',
    spend: '₹34,000',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXmxb3-cgY68I-Np8VynFSUirxUNp3pSC92c02DpaH20RR7TkS2aNc2eBU28yMr2mvF4ta7pMOlY0VsthN-E0_Nru9VFxYExGswOvPTezXWTYjl2tx7mQIuFUSS39PcdOSb7IcY6NCdVlQlhVNIGbL24TMNycSHwZ55k22K_IwoGyYfxhAeh74HXJiHziItTCLCLb4_MNooy-XIxXXBPCIgNiOFFSNoFcpWolBWfwThWlwRIVFxh7CnY3vhGh228vaddwAWIilJiQ',
    phone: '+91 98765 32109',
    email: 'rohan.verma@example.com',
    address: 'Koramangala, Bengaluru, KA 560034',
    notes: 'Usually books last minute.',
    history: [
      { id: 'h6', date: 'Oct 20, 2026', service: 'Color Correction', provider: 'Amit', price: '₹8,500' },
      { id: 'h7', date: 'Feb 14, 2026', service: 'Event Styling', provider: 'Ananya', price: '₹4,500' },
    ]
  },
  {
    id: '4',
    name: 'Amit Patel',
    type: 'New',
    upcomingVisit: 'Oct 25',
    initials: 'AP',
    phone: '+91 98765 65432',
    email: 'amit.patel@example.com',
    address: 'Jubilee Hills, Hyderabad, TS 500033',
    notes: 'First time client. Referred by Priya Kapoor.',
    history: []
  }
];

export default function Customers({ navigate }: NavigationProps) {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Invite Customer Form state
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteType, setInviteType] = useState<Customer['type']>('New');
  const [successToast, setSuccessToast] = useState('');

  const filters: FilterType[] = ['All', 'VIP', 'Members', 'New'];

  const filteredCustomers = customers.filter(customer => {
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'VIP' && customer.type === 'VIP') ||
      (activeFilter === 'Members' && customer.type === 'Gold Member') ||
      (activeFilter === 'New' && customer.type === 'New');

    const matchesSearch =
      searchQuery.trim() === '' ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleClearAll = () => {
    setCustomers([]);
  };

  const handleRestore = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setSearchQuery('');
    setActiveFilter('All');
  };

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;

    const initials = inviteName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'CL';

    const newCust: Customer = {
      id: Date.now().toString(),
      name: inviteName.trim(),
      type: inviteType,
      upcomingVisit: 'Pending',
      initials,
      phone: invitePhone || '+91 99999 99999',
      email: inviteEmail || `${inviteName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      address: 'Client Address',
      notes: 'Invited via Nexora Client Portal',
      history: []
    };

    setCustomers(prev => [newCust, ...prev]);
    setShowInviteModal(false);
    setInviteName('');
    setInvitePhone('');
    setInviteEmail('');
    
    setSuccessToast(`Invitation sent to ${newCust.name}!`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleImportContacts = () => {
    const importedSample: Customer = {
      id: Date.now().toString(),
      name: 'Kareena Kapoor',
      type: 'VIP',
      lastVisit: 'Just now',
      spend: '₹75,000',
      initials: 'KK',
      phone: '+91 99887 76655',
      email: 'kareena.k@example.com',
      address: 'Juhu Beach, Mumbai, MH',
      notes: 'Imported from Device Contacts',
      history: []
    };
    setCustomers(prev => [importedSample, ...prev]);
    setSuccessToast('Imported Kareena Kapoor from Contacts!');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col pb-24 md:pb-0 relative overflow-hidden">
      <TopBar showBack onBack={() => navigate('dashboard')} navigate={navigate} title={t('customers')} />

      <main className="w-full max-w-[800px] mx-auto px-5 md:px-10 pt-6 pb-12 flex-grow space-y-6 flex flex-col">
        
        <InstallAppBanner navigate={navigate} />

        {/* Top Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">{t('client_directory')}</h1>
            <p className="text-xs text-on-surface-variant">{t('client_directory_desc')}</p>
          </div>
          <div className="flex items-center gap-2">
            {customers.length > 0 ? (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant border border-outline-variant/40 hover:text-error hover:border-error/40 rounded-full transition-colors"
              >
                {t('clear_directory')}
              </button>
            ) : (
              <button
                onClick={handleRestore}
                className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary-fixed/20 rounded-full transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('restore_directory')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Filters (Only show if customers exist or searching) */}
        {(customers.length > 0 || searchQuery !== '') && (
          <div className="space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder_customers')} 
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-[14px] py-3 pl-12 pr-10 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-base placeholder:text-on-surface-variant/60 shadow-xs"
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

            {/* Filter Chips */}
            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full font-medium text-[13px] transition-colors border ${
                    activeFilter === filter
                      ? 'bg-primary-container text-white border-primary-container shadow-xs'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:bg-surface-variant'
                  }`}
                >
                  {filter === 'All' ? t('all_label') : filter === 'VIP' ? t('vip_label') : filter === 'Members' ? t('members_label') : t('new_label')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Success Toast */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customer List or Empty State */}
        {filteredCustomers.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredCustomers.map((customer) => (
              <div 
                key={customer.id}
                onClick={() => {
                  localStorage.setItem('selected_customer_id', customer.id);
                  localStorage.setItem('selected_customer_data', JSON.stringify(customer));
                  navigate('customer-profile');
                }}
                className="bg-white/95 backdrop-blur-[20px] border border-surface-variant rounded-[18px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-4 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md relative overflow-hidden"
              >
                {customer.type === 'VIP' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container"></div>
                )}
                <div className="flex items-center gap-4 pl-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant/30 overflow-hidden shrink-0 ${customer.image ? 'bg-surface-variant' : 'bg-surface-container-highest text-[18px] font-semibold text-on-surface-variant'}`}>
                    {customer.image ? (
                      <img 
                        src={customer.image} 
                        alt={customer.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      customer.initials
                    )}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-on-surface">{customer.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {customer.type !== 'Standard' && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                          customer.type === 'VIP' ? 'bg-primary-container/10 text-primary-container' :
                          customer.type === 'Gold Member' ? 'bg-[#0052da]/10 text-[#0052da]' :
                          'bg-secondary-container/10 text-secondary-container'
                        }`}>
                          {customer.type}
                        </span>
                      )}
                      <span className="text-on-surface-variant/70 text-xs font-medium">
                        {customer.lastVisit ? `${t('last_visit')}: ${customer.lastVisit}` : `${t('upcoming')}: ${customer.upcomingVisit}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-semibold text-on-surface">
                    {customer.spend || customer.visits || '--'}
                  </div>
                  <div className="text-xs font-medium text-on-surface-variant/70">
                    {customer.spend ? t('ytd_spend') : customer.visits ? t('visits_label') : t('first_visit')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* NO CUSTOMERS FOUND - EXACT DESIGN MATCH */
          <div className="flex-1 flex flex-col justify-center items-center py-8">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-[24px] border border-outline-variant/30 shadow-[0px_10px_40px_rgba(0,0,0,0.08)] p-8 md:p-12 text-center flex flex-col items-center gap-6 relative overflow-hidden group">
              
              {/* Abstract background graphic */}
              <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-container/20 via-transparent to-transparent"></div>

              {/* Illustration Area */}
              <div className="relative w-48 h-48 flex items-center justify-center mb-2 transition-transform duration-500 ease-out group-hover:scale-105">
                {/* Soft Glow */}
                <div className="absolute inset-0 bg-primary-container/10 rounded-full blur-2xl"></div>

                {/* Floating Elements */}
                <div className="absolute w-16 h-16 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xs rotate-[-12deg] -left-4 top-8 flex items-center justify-center backdrop-blur-sm z-10 animate-bounce [animation-duration:6s]">
                  <User className="text-outline-variant w-8 h-8" />
                </div>

                <div className="absolute w-24 h-32 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-md z-20 flex flex-col items-center p-3 animate-bounce [animation-duration:5s] [animation-delay:0.5s]">
                  <div className="w-12 h-12 rounded-full bg-surface-variant mb-2 flex items-center justify-center text-on-surface-variant/40">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="w-16 h-2 rounded-full bg-surface-variant mb-1.5"></div>
                  <div className="w-10 h-2 rounded-full bg-surface-container-highest"></div>
                </div>

                <div className="absolute w-14 h-14 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xs rotate-[15deg] -right-2 bottom-6 flex items-center justify-center backdrop-blur-sm z-10 animate-bounce [animation-duration:7s] [animation-delay:1s]">
                  <UserPlus className="text-outline-variant w-6 h-6" />
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-3 relative z-10">
                <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                  {t('no_customers_found')}
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-[280px] mx-auto leading-relaxed">
                  Your client list is empty. Start adding customers to track their history.
                </p>
              </div>

              {/* Actions */}
              <div className="w-full space-y-3 relative z-10">
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="w-full bg-primary-container text-on-primary-container font-bold text-sm py-4 px-8 rounded-2xl hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md flex items-center justify-center gap-2 group"
                >
                  <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>{t('invite_customer')}</span>
                </button>

                <button 
                  onClick={handleImportContacts}
                  className="w-full bg-transparent text-on-surface-variant font-semibold text-xs py-3 px-8 rounded-2xl border border-outline-variant/50 hover:bg-surface-container-low active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-primary" />
                  <span>{t('import_from_contacts')}</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FAB */}
      <button 
        onClick={() => setShowInviteModal(true)}
        className="fixed right-4 bottom-24 md:bottom-8 w-14 h-14 bg-primary-container text-white rounded-2xl flex items-center justify-center shadow-[0px_10px_40px_rgba(230,0,126,0.3)] hover:scale-105 active:scale-95 transition-all z-40"
        title="Invite / Add Customer"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Customer Detail Overlay */}
      <CustomerDetailModal 
        customer={selectedCustomer} 
        onClose={() => setSelectedCustomer(null)} 
      />

      {/* Invite Customer Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInviteModal(false)}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] shadow-2xl p-6 sm:p-8 w-full max-w-md border border-outline-variant/30"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-on-surface">{t('invite_customer')}</h3>
                    <p className="text-xs text-on-surface-variant">Send a Nexora booking invitation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">{t('full_name')} *</label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Meera Nair"
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">{t('phone_number')}</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-on-surface-variant/50 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      placeholder="+91 99999 99999"
                      className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">{t('email_address')}</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-on-surface-variant/50 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">{t('client_tier')}</label>
                  <select
                    value={inviteType}
                    onChange={(e) => setInviteType(e.target.value as Customer['type'])}
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container"
                  >
                    <option value="New">{t('new_label')}</option>
                    <option value="Standard">Standard</option>
                    <option value="Gold Member">Gold Member</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 border border-outline-variant/40 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-container text-white rounded-xl text-xs font-bold hover:bg-primary transition-colors shadow-md shadow-primary-container/20"
                  >
                    {t('send_invitation')}
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

