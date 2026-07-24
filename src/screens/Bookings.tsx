import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { Search, Clock, Scissors, User, Sparkles, Plus, Calendar, ArrowLeft, X } from 'lucide-react';
import BookingDetailDrawer from '../components/BookingDetailDrawer';

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
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<null | any>(null);

  const filters = ['All', 'Confirmed', 'In-Progress', 'Pending', 'Completed'];

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
          <h2 className="text-[28px] md:text-[32px] font-bold text-on-surface tracking-tight">Today's Bookings</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, service, or stylist..." 
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
              {f}
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
                      {item.status}
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
                      <span className="text-on-surface-variant">Stylist: {item.stylist}</span>
                      <span className="font-semibold text-on-surface">{item.price}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-2">
                    {item.status === 'Confirmed' && (
                      <>
                        <button className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-on-surface hover:bg-surface-variant transition-colors">Reschedule</button>
                        <button className="flex-1 py-2.5 rounded-lg bg-surface-container text-[13px] font-medium text-primary hover:bg-primary/5 transition-colors">Details</button>
                      </>
                    )}
                    {item.status === 'In-Progress' && (
                      <button className="flex-1 py-2.5 rounded-lg bg-primary-container text-white text-[13px] font-medium hover:opacity-90 transition-colors shadow-xs">Checkout</button>
                    )}
                    {item.status === 'Pending' && (
                      <>
                        <button className="flex-1 py-2.5 rounded-lg bg-surface-container text-[13px] font-medium text-primary hover:bg-primary/5 transition-colors">Approve</button>
                        <button className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[13px] font-medium text-error hover:bg-error/5 transition-colors">Decline</button>
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
                No Bookings Yet
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-[280px] leading-relaxed mb-6">
                Your schedule is clear. New appointments will appear here once booked.
              </p>

              {/* CTA Buttons */}
              <div className="w-full flex flex-col gap-3">
                <button 
                  onClick={() => navigate('new-appointment')}
                  className="w-full bg-primary-container text-on-primary-container rounded-[16px] py-3.5 px-6 font-bold text-sm shadow-[0px_4px_20px_rgba(230,0,126,0.2)] hover:opacity-90 hover:shadow-[0px_6px_25px_rgba(230,0,126,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Booking</span>
                </button>

                {(activeFilter !== 'All' || searchQuery !== '') && (
                  <button
                    onClick={() => { setActiveFilter('All'); setSearchQuery(''); }}
                    className="text-xs font-semibold text-primary hover:underline py-1"
                  >
                    Reset Filters
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

      {selectedBooking && (
        <BookingDetailDrawer onClose={() => setSelectedBooking(null)} />
      )}
    </Layout>
  );
}

