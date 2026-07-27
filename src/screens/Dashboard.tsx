import React from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Calendar, Users, Wallet, Star, PlusCircle, UserPlus, Scissors, CalendarCheck, CreditCard } from 'lucide-react';
import InstallAppBanner from '../components/InstallAppBanner';
import { formatPrice } from '../utils/currency';
import { useLanguage } from '../contexts/LanguageContext';

export default function Dashboard({ navigate }: NavigationProps) {
  const { t } = useLanguage();

  return (
    <Layout currentScreen="dashboard" navigate={navigate} title="NEXORA SALONOS">
      <div className="px-5 md:px-10 py-8 flex flex-col gap-8">
        
        {/* Welcome Section */}
        <section className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">{t('welcome_greeting')}</h2>
          <p className="text-base text-on-surface-variant">{t('nexora_today')}</p>
        </section>

        <InstallAppBanner navigate={navigate} />

        {/* Top Metrics Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Revenue */}
          <div 
            onClick={() => navigate('revenue-analytics')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] md:col-span-6 lg:col-span-5 p-4 flex flex-col justify-between min-h-[160px] relative overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <div className="flex justify-between items-start z-10">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider">{t('today_revenue')}</span>
                <span className="text-[32px] font-bold text-on-surface mt-1 tracking-tight">{formatPrice(45800, true)}</span>
              </div>
              <div className="bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 text-[12px] font-bold shadow-xs">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+12.4%</span>
              </div>
            </div>
            {/* Sparkline Abstract */}
            <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-primary/10 to-transparent z-0">
              <svg className="w-full h-full text-primary opacity-50 stroke-current" fill="none" preserveAspectRatio="none" strokeWidth="2" viewBox="0 0 100 30">
                <path d="M0,30 L10,25 L20,28 L30,15 L40,18 L50,10 L60,15 L70,5 L80,12 L90,2 L100,8" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
          </div>

          {/* Bookings */}
          <div 
            onClick={() => navigate('bookings')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] md:col-span-3 lg:col-span-3 p-4 flex flex-col justify-between min-h-[160px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider group-hover:text-primary transition-colors">{t('bookings')}</span>
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/20 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                  +8.2%
                </span>
                <div className="w-8 h-8 rounded-full bg-primary-fixed/20 text-primary flex items-center justify-center">
                  <Calendar className="w-[18px] h-[18px]" />
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-[32px] font-bold text-on-surface tracking-tight">24</span>
              <span className="text-[13px] font-medium text-on-surface-variant">/ 30 {t('slots')}</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>

          {/* Customers */}
          <div 
            onClick={() => navigate('customers')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] md:col-span-3 lg:col-span-4 p-4 flex flex-col justify-between min-h-[160px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider group-hover:text-primary transition-colors">{t('customers')}</span>
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/20 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                  +15.0%
                </span>
                <div className="w-8 h-8 rounded-full bg-secondary-container/10 text-secondary flex items-center justify-center">
                  <Users className="w-[18px] h-[18px]" />
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-[32px] font-bold text-on-surface tracking-tight">18</span>
              <span className="text-[13px] font-medium text-on-surface-variant">{t('today')}</span>
            </div>
            <div className="flex -space-x-2 mt-3">
              <div className="w-7 h-7 rounded-full border-2 border-surface bg-surface-container overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYG0onpGrDXlddDiuJ77QRSHPqafY8Daa2yNC5U3qQuztvTobITdITlYUyMk7aH_cDniIezIS3JY9O7FKHTCBm09gCtNbEWGEEXnbSy7YJMV-aEjGJu387KVNUoiCgWPI8ZMI48_H58xjYDdNlBBHRdBXRJzQS5NqkHClZgQmzQIBVvVLG8FRaKEHBs4KsmyGDT7dPARu_6pZzm-Ozymd6NXcovpMmJ6J4B5xpd6pqKd4zPhmS8ezPwEUL85j0pdG0CBOowYWMvJ8" alt="Client" className="w-full h-full object-cover" />
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-surface bg-surface-container overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG8V6yP4itEjnM47GgoHTChYxqWCZN-RvRfUT9egL3pJ8hgO9gIZRFQXJiQyfsv4Zz2a3edbANgHYLntuvZP1xdhEzkxvDW3RbcwBrwQNhQsoYi4LjEOIu2KcUIJPrBIXLJkGZqb8XdCCtf9KAcidFCd7b1Q-jMdI5xiHCcNYuWJDCFIWEZf_Nr3I6JrmD8mpkIlarLGyj_gt61XnNkYiz8Gfa8_CwNPsC9uOvZOBEZODZlG5K0rtLhk4q73VLGaxKAZmbKtXKd94" alt="Client" className="w-full h-full object-cover" />
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-surface bg-surface-container flex items-center justify-center text-[10px] font-medium text-on-surface-variant">
                +16
              </div>
            </div>
          </div>
        </section>

        {/* Secondary Widgets Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Wallet Balance */}
          <div 
            onClick={() => navigate('wallet')}
            className="bg-gradient-to-br from-surface to-surface-container-low border border-surface-variant rounded-[18px] p-4 relative overflow-hidden group shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-fixed/20 rounded-full blur-3xl group-hover:bg-primary-fixed/30 transition-colors duration-500"></div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-primary fill-primary/20" />
                <span className="text-[18px] font-semibold text-on-surface">{t('wallet')}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); navigate('wallet'); }} className="text-primary text-[13px] font-medium hover:underline">{t('withdraw')}</button>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-on-surface-variant">{t('available_balance')}</span>
                <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/20 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                  +18.4% MoM
                </span>
              </div>
              <span className="text-[32px] font-bold text-on-surface tracking-tight">{formatPrice(345000, true)}</span>
            </div>
          </div>

          {/* Ratings Widget */}
          <div 
            onClick={() => navigate('reviews')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] p-4 flex items-center justify-between shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-semibold text-on-surface group-hover:text-primary transition-colors">{t('salon_rating')}</span>
                <span className="bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-500/20 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                  +0.2
                </span>
              </div>
              <span className="text-[13px] font-medium text-on-surface-variant group-hover:underline">{t('based_on_reviews')}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[32px] font-bold text-on-surface tracking-tight">4.9</span>
                <span className="text-[18px] font-semibold text-on-surface-variant">/5</span>
              </div>
              <div className="flex text-primary">
                 <Star className="w-[18px] h-[18px] fill-primary" />
                 <Star className="w-[18px] h-[18px] fill-primary" />
                 <Star className="w-[18px] h-[18px] fill-primary" />
                 <Star className="w-[18px] h-[18px] fill-primary" />
                 <Star className="w-[18px] h-[18px] fill-primary/50" />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-on-surface">{t('quick_actions')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <button 
              onClick={() => navigate('new-appointment')}
              className="bg-primary-container text-white rounded-[16px] p-3 flex flex-col items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              <PlusCircle className="w-6 h-6" />
              <span className="text-[13px] font-semibold">{t('new_booking')}</span>
            </button>
            <button onClick={() => navigate('customers')} className="bg-[#FDE7F3] text-primary rounded-[16px] p-3 flex flex-col items-center justify-center gap-2 hover:bg-primary-fixed/80 active:scale-95 transition-all">
              <Users className="w-6 h-6" />
              <span className="text-[13px] font-semibold">{t('customers')}</span>
            </button>
            <button 
               onClick={() => navigate('new-service')}
               className="bg-surface border border-outline-variant text-on-surface rounded-[16px] p-3 flex flex-col items-center justify-center gap-2 hover:bg-surface-container active:scale-95 transition-all shadow-sm"
            >
              <Scissors className="w-6 h-6" />
              <span className="text-[13px] font-semibold">{t('new_service')}</span>
            </button>
            <button 
               onClick={() => navigate('website-dashboard')}
               className="bg-surface border border-outline-variant text-on-surface rounded-[16px] p-3 flex flex-col items-center justify-center gap-2 hover:bg-surface-container active:scale-95 transition-all shadow-sm"
            >
              <Star className="w-6 h-6 text-on-surface-variant" />
              <span className="text-[13px] font-semibold">{t('website')}</span>
            </button>
          </div>
        </section>

        {/* Recent Activity Feed */}
        <section className="flex flex-col gap-2 mb-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-on-surface">{t('recent_activity')}</h3>
            <button className="text-primary text-[13px] font-medium hover:underline">{t('view_all')}</button>
          </div>
          
          <div className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] flex flex-col divide-y divide-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
            {/* Activity 1 */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col flex-grow">
                <span className="text-base text-on-surface"><span className="font-semibold">Priya S.</span> {t('booked_label')} Full Balayage</span>
                <span className="text-[13px] font-medium text-on-surface-variant">{t('today_at')} 2:30 PM</span>
              </div>
              <div className="text-[13px] font-medium text-primary bg-primary-fixed/20 px-2 py-1 rounded-md">{t('new_label')}</div>
            </div>
            
            {/* Activity 2 */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex flex-col flex-grow">
                <span className="text-base text-on-surface">{t('payment_received_from')} <span className="font-semibold">Rohan V.</span></span>
                <span className="text-[13px] font-medium text-on-surface-variant">2 {t('hours_ago')}</span>
              </div>
              <div className="text-base font-semibold text-on-surface">+{formatPrice(2500, true)}</div>
            </div>

            {/* Activity 3 */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-outline">
                <Star className="w-5 h-5" />
              </div>
              <div className="flex flex-col flex-grow">
                <span className="text-base text-on-surface"><span className="font-semibold">Ananya S.</span> {t('left_review')}</span>
                <span className="text-[13px] font-medium text-on-surface-variant">{t('yesterday')}</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}

