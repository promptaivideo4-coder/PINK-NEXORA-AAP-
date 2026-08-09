import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import InstallAppBanner from '../components/InstallAppBanner';
import { NavigationProps } from '../types';
import { TrendingUp, Calendar, Users, Wallet, Star, PlusCircle, UserPlus, Scissors, CalendarCheck, CreditCard, Store, Rocket, FileCheck, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import {
  bootstrapMyShop, fetchMyShop, fetchMyBookings, listServices, listStaff, fetchWalletOverview,
  fetchOwnerProposals, reviewOwnerProposal, MyShop, ShopBooking, OwnerProposalItem,
} from '../lib/shopRepository';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  published: 'Published',
};

export default function Dashboard({ navigate }: NavigationProps) {
  const { t } = useLanguage();

  const [shop, setShop] = useState<MyShop | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [bookings, setBookings] = useState<ShopBooking[]>([]);
  const [proposals, setProposals] = useState<OwnerProposalItem[]>([]);
  const [reviewingProposal, setReviewingProposal] = useState(false);
  const [proposalToast, setProposalToast] = useState<string | null>(null);
  const [serviceCount, setServiceCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [walletBalancePaise, setWalletBalancePaise] = useState(0);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  const load = useCallback(async () => {
    try {
      const myShop = await fetchMyShop(supabase);
      setShop(myShop);
      if (myShop) {
        const [bookingsData, servicesData, staffData, proposalsData] = await Promise.all([
          fetchMyBookings(supabase, myShop.id).catch(() => []),
          listServices(supabase, myShop.id).catch(() => []),
          listStaff(supabase, myShop.id).catch(() => []),
          fetchOwnerProposals(supabase).catch(() => []),
        ]);
        setBookings(bookingsData);
        setServiceCount(servicesData.length);
        setStaffCount(staffData.length);
        setProposals(proposalsData);
        const wallet = await fetchWalletOverview(supabase).catch(() => null);
        if (wallet) setWalletBalancePaise(wallet.balancePaise + wallet.pendingPaise);
      }
    } catch (err) {
      console.warn('Dashboard live data unavailable:', err);
    } finally {
      setShopLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleProposalAction = async (proposalId: string, action: 'approve' | 'request_changes' | 'reject' | 'publish', notes?: string) => {
    setReviewingProposal(true);
    try {
      const res = await reviewOwnerProposal(supabase, { proposalId, action, notes });
      if (res.ok) {
        setProposalToast(`Proposal successfully updated: ${res.nextStatus || action}`);
        setTimeout(() => setProposalToast(null), 4000);
        await load();
      } else {
        alert(`Action failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Action error: ${err?.message || err}`);
    } finally {
      setReviewingProposal(false);
    }
  };

  const handleCreateWorkspace = async () => {
    setCreatingWorkspace(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
      await bootstrapMyShop(supabase, {
        businessName: String(meta.business_name || meta.full_name || 'My Salon'),
        businessCategory: String(meta.business_category || 'Salon'),
        contactNumber: String(meta.contact_number || '') || null,
      });
      await load();
    } catch (err: any) {
      alert(err?.message || 'Could not create the shop workspace.');
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const customerCount = new Set(bookings.map((b) => b.createdBy).filter(Boolean)).size;
  const todayBookings = bookings.filter((b) => {
    if (!b.appointmentStart) return false;
    const d = new Date(b.appointmentStart);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const recentBookings = bookings.slice(0, 3);

  return (
    <Layout currentScreen="dashboard" navigate={navigate} title="NEXORA SALONOS">
      <div className="px-5 md:px-10 py-8 flex flex-col gap-8">

        {/* PWA Install Banner — hamesha dikhta hai (jab tak installed nahi) */}
        <InstallAppBanner navigate={navigate as (path: string) => void} />

        {/* Welcome Section — live shop + publish status */}
        <section className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">
            {shop ? shop.name : t('welcome_greeting')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base text-on-surface-variant">{t('nexora_today')}</p>
            {shop && (
              <span
                className={`px-3 py-1 rounded-full text-[12px] font-bold border ${
                  shop.status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                    : shop.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                      : 'bg-surface-variant text-on-surface-variant border-outline-variant/40'
                }`}
              >
                {STATUS_LABEL[shop.status] ?? shop.status}
              </span>
            )}
          </div>
          {!shopLoading && !shop && (
            <button
              onClick={() => void handleCreateWorkspace()}
              disabled={creatingWorkspace}
              className="mt-2 inline-flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              <Store className="w-4 h-4" />
              {creatingWorkspace ? 'Creating workspace…' : 'Create your shop workspace (draft)'}
            </button>
          )}
        </section>

        {/* Proposal Toast */}
        {proposalToast && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{proposalToast}</span>
          </div>
        )}

        {/* Growth Partner Setup Proposal Review Section */}
        {proposals.length > 0 && proposals[0].status !== 'published' && (
          <section className="bg-gradient-to-r from-primary/5 via-pink-500/5 to-primary/10 border border-primary/20 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Growth Partner Website Setup Proposal</h3>
                  <p className="text-xs text-on-surface-variant">
                    Version {proposals[0].version} · Status: <span className="font-bold uppercase text-primary">{proposals[0].status}</span>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your Growth Partner prepared a digital storefront and website setup for your review. Review the details below and approve or publish live.
            </p>

            {proposals[0].ownerNotes && (
              <div className="bg-surface p-3 rounded-xl border border-outline-variant/50 text-xs">
                <span className="font-bold text-on-surface-variant block mb-0.5">Previous Owner Note:</span>
                <span className="text-on-surface">{proposals[0].ownerNotes}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => navigate('website-dashboard')}
                className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Preview Setup
              </button>
              
              {proposals[0].status === 'submitted' && (
                <button
                  disabled={reviewingProposal}
                  onClick={() => handleProposalAction(proposals[0].id, 'approve')}
                  className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  Approve
                </button>
              )}

              {['submitted', 'approved'].includes(proposals[0].status) && (
                <button
                  disabled={reviewingProposal}
                  onClick={() => {
                    const notes = prompt('Enter change request notes for your Growth Partner:');
                    if (notes && notes.trim()) {
                      void handleProposalAction(proposals[0].id, 'request_changes', notes.trim());
                    }
                  }}
                  className="px-4 py-2 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  Request Changes
                </button>
              )}

              {['submitted', 'approved'].includes(proposals[0].status) && (
                <button
                  disabled={reviewingProposal}
                  onClick={() => void handleProposalAction(proposals[0].id, 'publish')}
                  className="px-5 py-2 bg-primary text-white hover:bg-primary/90 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 ml-auto"
                >
                  {reviewingProposal ? 'Publishing…' : 'Approve & Publish Live'}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Top Metrics Bento Grid — live values, no fake numbers */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Wallet balance */}
          <div
            onClick={() => navigate('wallet')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] md:col-span-6 lg:col-span-5 p-4 flex flex-col justify-between min-h-[160px] relative overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <div className="flex justify-between items-start z-10">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider">{t('wallet')}</span>
                <span className="text-[32px] font-bold text-on-surface mt-1 tracking-tight">{formatPrice(walletBalancePaise, true)}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-fixed/20 text-primary flex items-center justify-center">
                <Wallet className="w-[20px] h-[20px]" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-primary/10 to-transparent z-0" />
          </div>

          {/* Bookings */}
          <div
            onClick={() => navigate('bookings')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] md:col-span-3 lg:col-span-3 p-4 flex flex-col justify-between min-h-[160px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider group-hover:text-primary transition-colors">{t('bookings')}</span>
              <div className="w-8 h-8 rounded-full bg-primary-fixed/20 text-primary flex items-center justify-center">
                <Calendar className="w-[18px] h-[18px]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-[32px] font-bold text-on-surface tracking-tight">{bookings.length}</span>
              <span className="text-[13px] font-medium text-on-surface-variant">{todayBookings} {t('today')}</span>
            </div>
          </div>

          {/* Customers (distinct bookers) */}
          <div
            onClick={() => navigate('customers')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] md:col-span-3 lg:col-span-4 p-4 flex flex-col justify-between min-h-[160px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider group-hover:text-primary transition-colors">{t('customers')}</span>
              <div className="w-8 h-8 rounded-full bg-secondary-container/10 text-secondary flex items-center justify-center">
                <Users className="w-[18px] h-[18px]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-[32px] font-bold text-on-surface tracking-tight">{customerCount}</span>
              <span className="text-[13px] font-medium text-on-surface-variant">{t('today')}</span>
            </div>
          </div>

          {/* Rating (live from salons.rating_average) */}
          <div
            onClick={() => navigate('reviews')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] md:col-span-4 lg:col-span-4 p-4 flex flex-col justify-between min-h-[150px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider">Rating</span>
            <div className="flex items-center gap-1">
              <span className="text-[32px] font-bold text-on-surface tracking-tight">
                {shop && shop.ratingAverage > 0 ? shop.ratingAverage.toFixed(1) : '—'}
              </span>
              <span className="text-[18px] font-semibold text-on-surface-variant">/5</span>
              <div className="flex ml-2 text-primary">
                <Star className="w-[18px] h-[18px] fill-primary" />
                <Star className="w-[18px] h-[18px] fill-primary" />
                <Star className="w-[18px] h-[18px] fill-primary" />
                <Star className="w-[18px] h-[18px] fill-primary" />
                <Star className="w-[18px] h-[18px] fill-primary/50" />
              </div>
            </div>
          </div>

          {/* Services count */}
          <div
            onClick={() => navigate('services')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] md:col-span-4 lg:col-span-4 p-4 flex flex-col justify-between min-h-[150px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider">Services</span>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-[32px] font-bold text-on-surface tracking-tight">{serviceCount}</span>
              <span className="text-[13px] font-medium text-on-surface-variant">Live</span>
            </div>
          </div>

          {/* Staff count */}
          <div
            onClick={() => navigate('staff')}
            className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] md:col-span-4 lg:col-span-4 p-4 flex flex-col justify-between min-h-[150px] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-transform cursor-pointer group"
          >
            <span className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider">Staff</span>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-[32px] font-bold text-on-surface tracking-tight">{staffCount}</span>
              <span className="text-[13px] font-medium text-on-surface-variant">Live</span>
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
              <UserPlus className="w-6 h-6" />
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
              <Rocket className="w-6 h-6 text-on-surface-variant" />
              <span className="text-[13px] font-semibold">{t('website')}</span>
            </button>
          </div>
        </section>

        {/* Recent Activity — real bookings from the owner's own salon */}
        <section className="flex flex-col gap-2 mb-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-on-surface">{t('recent_activity')}</h3>
            <button onClick={() => navigate('bookings')} className="text-primary text-[13px] font-medium hover:underline">{t('view_all')}</button>
          </div>

          <div className="bg-white/85 backdrop-blur-[20px] border border-surface-variant rounded-[18px] flex flex-col divide-y divide-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
            {recentBookings.length === 0 && (
              <div className="p-4 text-[13px] text-on-surface-variant">
                No bookings yet{shop && !shop.verified ? ' — shop is in draft. Bookings open after the shop is published.' : '.'}
              </div>
            )}
            {recentBookings.map((b) => (
              <div key={b.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 text-primary">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col flex-grow">
                  <span className="text-base text-on-surface">
                    <span className="font-semibold">{b.serviceNames.join(', ') || 'Booking'}</span> · {b.status}
                  </span>
                  <span className="text-[13px] font-medium text-on-surface-variant">
                    {b.appointmentStart ? new Date(b.appointmentStart).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                {b.totalPaise != null && b.totalPaise > 0 && (
                  <div className="text-[13px] font-semibold text-on-surface">+{formatPrice(b.totalPaise, true)}</div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}
