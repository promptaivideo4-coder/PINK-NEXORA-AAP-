import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { Search, Clock, Scissors, User, Sparkles, Plus, Calendar, ArrowLeft, X, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';
import BookingDetailDrawer from '../components/BookingDetailDrawer';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface BookingItem {
  id: string;
  clientName: string;
  clientAvatar?: string;
  clientInitials?: string;
  time: string;
  status: 'Confirmed' | 'In-Progress' | 'Pending';
  service: string;
  stylist: string;
  price: string;
  serviceIcon: 'scissors' | 'user' | 'sparkles';
}

const initialBookings: BookingItem[] = [
  {
    id: '#BK-7829',
    clientName: 'Ananya Sharma',
    clientAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-nP9eCkGy2wbdT05CpC-bQQVwQQMLPOBPRJEw2zBFhG1vyLqTne9C4EcMHZQUquCnDF09P9bR3c5sf2te--nBJMG85ltQzCKokwdWGm3bZrpvALaxvEQgK6Vdgp60DPCZNcHoK20HWB3apHSJGxTi0kj0lcRdISfiyzLNPYETPVegam9lBR6ucdt87pKbMUbHzPv5s_UKHwknAkWdo2_IrviELZVHqv8XjQhIhhP6-f4C6rnoevq1DayOWMthqx-CnWVeE1HNgoc',
    time: '09:00 AM - 10:30 AM',
    status: 'Confirmed',
    service: 'Balayage & Styling',
    stylist: 'Rohan V.',
    price: '₹3,500.00',
    serviceIcon: 'scissors',
  },
  {
    id: '#BK-7830',
    clientName: 'Amit Patel',
    clientInitials: 'AP',
    time: '10:45 AM - 11:30 AM',
    status: 'In-Progress',
    service: 'Beard Trim & Shape',
    stylist: 'Rohan V.',
    price: '₹1,200.00',
    serviceIcon: 'user',
  },
  {
    id: '#BK-7831',
    clientName: 'Priya Kapoor',
    clientAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNro9Tvx2mCg1vwb2oUbG_H3AMDFPVQ_r9dtXjs0XsvegF1ZbaDuEV5MPvyUlKkxAnamZSwpRbX_F378ZST4-G-lza0X03d1EZH2enioAI8HFWMK3pKsEDMoHBGKPfpRRJ2Gm83L1DWP-fxpBtiPhIvWozKi0CXHv2DXiIOz_7VMcieHpN-zsaHHee5M5CrYh2YU-oe13dPP1VLpJdTPEMJ6UCd9NzRLD1MyH_XuPuQifa-tFa4HNUrkxCpSOkX1QoAn2T5X8ES94',
    time: '01:00 PM - 02:00 PM',
    status: 'Pending',
    service: 'Deep Conditioning',
    stylist: 'Ananya S.',
    price: '₹2,500.00',
    serviceIcon: 'sparkles',
  },
];

export default function Bookings({ navigate }: NavigationProps) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<null | any>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<null | BookingItem>(null);
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [assignBooking, setAssignBooking] = useState<null | BookingItem>(null);
  const [selectedStylist, setSelectedStylist] = useState<string>('');

  const handleWhatsAppReminder = (item: BookingItem) => {
    const message = `Hello ${item.clientName}! This is a friendly reminder for your appointment at Nexora Salon.\n\nService: ${item.service}\nTime: ${item.time}\nStylist: ${item.stylist}\n\nनमस्ते! हम आपको नेक्सोरा सैलून में आपकी अपॉइंटमेंट की याद दिला रहे हैं।\n\nWe look forward to seeing you!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };


  const filters = ['All', 'Confirmed', 'In-Progress', 'Pending', 'Completed'];

  const filterLabels: Record<string, string> = {
    'All': t('all'),
    'Confirmed': t('confirmed'),
    'In-Progress': t('in_progress'),
    'Pending': t('pending'),
    'Completed': t('completed'),
  };

  const filteredBookings = initialBookings.filter(item => {
    const matchesFilter = activeFilter === 'All' || item.status === activeFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.stylist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openDrawer = (booking: BookingItem) => {
    setSelectedBooking(booking);
  };

  return (
    <Layout currentScreen="bookings" navigate={navigate} title="NEXORA SALONOS">
      <div className="px-5 md:px-10 py-8 max-w-7xl mx-auto w-full relative min-h-[calc(100vh-120px)] flex flex-col">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <h2 className="text-[28px] md:text-[32px] font-bold text-on-surface tracking-tight">{t('today_bookings')}</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')} 
              className="w-full h-12 pl-12 pr-10 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary-container focus:bg-surface transition-all text-base text-on-surface placeholder-on-surface-variant shadow-xs outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-8 -mx-5 px-5 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-6 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all active:scale-95 border ${
                activeFilter === f 
                  ? 'bg-on-surface text-surface border-on-surface shadow-md' 
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:bg-surface-variant'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        {/* Content Grid or Empty State */}
        {filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((item) => {
              const statusColorMap = {
                'Confirmed': { bar: 'bg-[#10b981]', tagBg: 'bg-[#10b981]/10', tagText: 'text-[#10b981]' },
                'In-Progress': { bar: 'bg-tertiary', tagBg: 'bg-tertiary/10', tagText: 'text-tertiary' },
                'Pending': { bar: 'bg-[#f59e0b]', tagBg: 'bg-[#f59e0b]/10', tagText: 'text-[#f59e0b]' },
              };
              const style = statusColorMap[item.status];

              return (
                <article 
                  key={item.id}
                  onClick={() => openDrawer(item)} 
                  className="bg-white/70 backdrop-blur-[10px] border border-white/50 rounded-[18px] p-5 relative overflow-hidden group hover:shadow-[0px_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bar}`}></div>
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div className="flex items-center gap-3">
                      {item.clientAvatar ? (
                        <div className="w-12 h-12 rounded-full bg-surface-variant overflow-hidden shrink-0">
                          <img src={item.clientAvatar} alt={item.clientName} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-surface-variant overflow-hidden flex items-center justify-center text-[18px] font-semibold text-on-surface-variant shrink-0">
                          {item.clientInitials}
                        </div>
                      )}
                      <div>
                        <h3 className="text-[18px] font-semibold text-on-surface">{item.clientName}</h3>
                        <p className="text-[13px] font-medium text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <Clock className="w-4 h-4" /> {item.time}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${style.tagBg} ${style.tagText}`}>
                      {filterLabels[item.status]}
                    </span>
                  </div>

                  <div className="bg-surface-container/50 rounded-xl p-4 mb-4 ml-2">
                    <div className="flex items-center gap-2 mb-2">
                      {item.serviceIcon === 'scissors' && <Scissors className="text-primary-container w-5 h-5" />}
                      {item.serviceIcon === 'user' && <User className="text-primary-container w-5 h-5" />}
                      {item.serviceIcon === 'sparkles' && <Sparkles className="text-primary-container w-5 h-5" />}
                      <span className="text-base font-medium text-on-surface">{item.service}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">{t('stylist_label')}: {item.stylist}</span>
                      <span className="font-semibold text-on-surface">{item.price}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-2">
                    {item.status === 'Confirmed' && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleWhatsAppReminder(item); }} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface hover:bg-surface-variant transition-colors flex justify-center items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp</button>
                        <button className="flex-1 py-2.5 rounded-lg bg-surface-container text-[13px] font-medium text-primary hover:bg-primary/5 transition-colors">{t('details')}</button>
                      </>
                    )}
                    {item.status === 'In-Progress' && (
                      <button onClick={(e) => { e.stopPropagation(); setCheckoutBooking(item); }} className="flex-1 py-2.5 rounded-lg bg-primary-container text-white text-[13px] font-medium hover:opacity-90 transition-colors shadow-xs">{t('checkout')}</button>
                    )}
                    {item.status === 'Pending' && (
                      <>
                        <button className="flex-1 py-2.5 rounded-lg bg-surface-container text-[13px] font-medium text-primary hover:bg-primary/5 transition-colors">{t('approve')}</button>
                        <button onClick={(e) => { e.stopPropagation(); setAssignBooking(item); }} className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface hover:bg-surface-variant transition-colors">Assign Stylist</button>
                        <button className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-error hover:bg-error/5 transition-colors">{t('decline')}</button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty State Canvas */
          <div className="flex-grow flex items-center justify-center py-12">
            <div className="flex flex-col items-center text-center bg-white rounded-[18px] border border-outline-variant/30 shadow-[0px_10px_40px_rgba(0,0,0,0.05)] p-8 md:p-12 w-full max-w-md transform transition-transform duration-300 hover:-translate-y-1">
              
              {/* Minimal Illustration Container */}
              <div className="relative w-32 h-32 mb-6 flex items-center justify-center bg-secondary-fixed/30 rounded-full">
                {/* Abstract Calendar / Booking Icon */}
                <Calendar className="w-16 h-16 text-primary stroke-[1.2]" />
                
                {/* Sparkling Accents (Glassmorphic) */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/80 rounded-full shadow-[0px_4px_10px_rgba(0,0,0,0.1)] border border-outline-variant/20 flex items-center justify-center backdrop-blur-md animate-pulse">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                
                {/* Subtle Background element */}
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-tertiary-fixed/40 rounded-full blur-xl z-[-1]" />
              </div>

              {/* Typography */}
              <h2 className="text-xl md:text-2xl font-bold text-on-surface mb-2">
                {t('no_bookings')}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-[280px] leading-relaxed mb-6">
                {t('clear_schedule')}
              </p>

              {/* CTA Buttons */}
              <div className="w-full flex flex-col gap-3">
                <button 
                  onClick={() => navigate('new-appointment')}
                  className="w-full bg-primary-container text-on-primary-container rounded-[16px] py-3.5 px-6 font-bold text-sm shadow-[0px_4px_20px_rgba(230,0,126,0.2)] hover:opacity-90 hover:shadow-[0px_6px_25px_rgba(230,0,126,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('create_booking')}</span>
                </button>

                {(activeFilter !== 'All' || searchQuery !== '') && (
                  <button
                    onClick={() => { setActiveFilter('All'); setSearchQuery(''); }}
                    className="text-xs font-semibold text-primary hover:underline py-1"
                  >
                    {t('reset_filters')}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* FAB */}
        <button 
          onClick={() => navigate('new-appointment')}
          className="fixed bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-primary-container text-white rounded-2xl shadow-[0px_10px_30px_rgba(230,0,126,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        >
          <Plus className="w-8 h-8" strokeWidth={2.5} />
        </button>

      </div>

                  {/* Assign Stylist Modal */}
      <AnimatePresence>
        {assignBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-surface-variant/40">
                <h3 className="text-xl font-bold text-on-surface">Assign Stylist</h3>
                <button
                  onClick={() => setAssignBooking(null)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-on-surface-variant mb-4">Assign a stylist for {assignBooking.clientName}'s {assignBooking.service}</p>
                <div className="space-y-2 mb-6">
                  {['Rohan V.', 'Ananya S.', 'Aditi M.'].map((stylist) => (
                    <button
                      key={stylist}
                      onClick={() => setSelectedStylist(stylist)}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-bold border transition-colors flex items-center justify-between ${
                        selectedStylist === stylist
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-surface-variant text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span>{stylist}</span>
                      {selectedStylist === stylist && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    // Simulated assignment
                    setAssignBooking(null);
                    setSelectedStylist('');
                  }}
                  disabled={!selectedStylist}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Assignment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout / Billing Modal */}
      <AnimatePresence>
        {checkoutBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-surface-variant/40 bg-surface-container-lowest">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Checkout & Billing</h3>
                  <p className="text-xs font-medium text-on-surface-variant">Process payment for {checkoutBooking.clientName}</p>
                </div>
                <button
                  onClick={() => { setCheckoutBooking(null); setIsInvoiceGenerated(false); }}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isInvoiceGenerated ? (
                <>
                  <div className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-surface-variant">
                        <div>
                          <p className="font-bold text-on-surface">{checkoutBooking.service}</p>
                          <p className="text-xs text-on-surface-variant">by {checkoutBooking.stylist}</p>
                        </div>
                        <span className="font-bold">{checkoutBooking.price}</span>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Discount Code</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="e.g. FESTIVAL10"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-variant bg-surface-bright text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button className="px-4 py-2.5 bg-surface-container text-primary font-bold text-sm rounded-xl">Apply</button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-surface-variant/40">
                        <div className="flex justify-between text-lg font-black pt-2">
                          <span className="text-on-surface">Total Payable (Inclusive of all taxes)</span>
                          <span className="text-primary">{checkoutBooking.price}</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 block">Payment Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Cash', 'UPI', 'Card/POS'].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setPaymentMode(mode as 'UPI' | 'Card' | 'Cash')}
                              className={`py-2.5 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-1 ${
                                paymentMode === mode || (mode === 'Card/POS' && paymentMode === 'Card')
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-surface-variant text-on-surface-variant hover:bg-surface-container'
                              }`}
                            >
                              {(paymentMode === mode || (mode === 'Card/POS' && paymentMode === 'Card')) && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {mode}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-on-surface-variant text-center mt-2">UPI includes GPay, PhonePe, Paytm, etc.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-surface-container-lowest border-t border-surface-variant/40 flex gap-3">
                    <button
                      onClick={() => setCheckoutBooking(null)}
                      className="flex-1 py-3 rounded-xl border border-surface-variant font-bold text-sm text-on-surface hover:bg-surface-container transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsInvoiceGenerated(true)}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      Complete Payment
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-on-surface">Payment Successful!</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Invoice has been generated for {checkoutBooking.clientName}.</p>
                  </div>
                  
                  <div className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-4 mt-4 text-left">
                    <p className="text-xs text-on-surface-variant mb-1">Transaction ID: <span className="font-bold text-on-surface">TXN-{Math.floor(Math.random() * 1000000)}</span></p>
                    <p className="text-xs text-on-surface-variant">Amount Paid: <span className="font-bold text-on-surface">{checkoutBooking.price}</span> via {paymentMode === 'Card' ? 'Card/POS' : paymentMode}</p>
                  </div>

                  <div className="flex gap-3 w-full pt-4">
                    <button className="flex-1 py-3 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" /> Share Invoice
                    </button>
                    <button
                      onClick={() => { setCheckoutBooking(null); setIsInvoiceGenerated(false); }}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedBooking && (
        <BookingDetailDrawer onClose={() => setSelectedBooking(null)} />
      )}
    </Layout>
  );
}

