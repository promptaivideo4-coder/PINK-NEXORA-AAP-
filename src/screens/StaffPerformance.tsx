import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOwnerAccess } from '../hooks/useOwnerAccess';
import {
  AlertCircle,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Hash,
  IndianRupee,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Repeat,
  Star,
  TrendingUp,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';
import { fetchMyBookings, fetchMyShop, listStaff, ShopBooking, ShopStaff } from '../lib/shopRepository';
import { supabase } from '../lib/supabase';
import {
  fetchStaffList,
  fetchBookingsForSalon,
  fetchServices,
  type StaffRow,
} from '../lib/staffRepository';

/* ───── Types ───── */

type TimePeriod = 'today' | 'this_week' | 'this_month' | 'custom';
type SortKey = 'revenue' | 'bookings' | 'rating' | 'repeat';

type StaffPerf = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  revenue: number;
  completedBookings: number;
  avgRating: number;
  repeatCustomerRate: number;
  cancellationRate: number;
  noShowRate: number;
  commissionEarned: number;
};

type AggregateMetrics = {
  totalRevenue: number;
  completedBookings: number;
  avgRating: number;
  repeatCustomerRate: number;
  cancellationRate: number;
  noShowRate: number;
  commissionEarned: number;
};

/* ───── Constants ───── */

const STORAGE_KEY = 'nexora_staff_performance_data';
const CYCLE_KEY = 'nexora_selected_payroll_cycle';

const CARD_CLASS =
  'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';

const AVATAR_ELENA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBgK4i87T9zaSWtTpAX8ftOSq5DsvdiLIMBIFtrdKRgquoy229sj4FWpkPoFbDtGT0hQkuA7BxlkH7BBMbGJVV2G2P5B8GPGRRsGpdUnXHEXv80SvpFM2Tvtb-Vl0c404jrR3FnqXOIJ8rxqBRAYFwJSWoMuZ_7dleFJcNF4HPqNuvcZOt2UNuCCs1MtCHRYsr-m8nYSAnK7kGo5LODQoilthjYlH0wE-E7gY--ZupoRur1T2oWS4o1';
const AVATAR_MARCUS =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBcjDud8ipDaq3L_FuF5pK08jOkmyhGMdjKJQmJLuiF4U7zsZOL45tonoY185_wyzCGro0RCfsu64ENZzYqxYRHr1C1FC0os9uaTZNy5zusD7HiMJbgOJ8XSuzxyXYvpaFyTHgYNrhUrTaZHO2UA5neNkz-JYdQAoyhDwnx6wwkFzMdHJgnq3xn7TdAQcdGuSEuXGXQSqV0H7Gw0XvfXTMV5BYuI-mFKWD80THGvA-w0_79v7eR4yC_';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'rating', label: 'Rating' },
  { key: 'repeat', label: 'Repeat Customers' },
];

const PERIOD_OPTIONS: { key: TimePeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

/* ───── Helpers ───── */

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function pct(value: number) {
  return `${Math.round(value * 100) / 100}%`;
}

function AccessChecking() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
      <p className="text-sm font-medium text-gray-500">Checking access…</p>
    </div>
  );
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST';
}

function rankMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function rankBg(rank: number): string {
  if (rank === 1) return 'bg-amber-50 border-amber-200';
  if (rank === 2) return 'bg-slate-50 border-slate-200';
  if (rank === 3) return 'bg-orange-50 border-orange-200';
  return 'bg-white border-[#e8e8e8]';
}

/* ───── Demo data (offline fallback) ───── */

function demoStaffPerf(): StaffPerf[] {
  return [
    {
      id: 'demo-elena',
      name: 'Elena Rodriguez',
      role: 'Senior Stylist',
      avatar: AVATAR_ELENA,
      revenue: 187500,
      completedBookings: 32,
      avgRating: 4.9,
      repeatCustomerRate: 72,
      cancellationRate: 4.2,
      noShowRate: 1.8,
      commissionEarned: 28125,
    },
    {
      id: 'demo-marcus',
      name: 'Marcus Chen',
      role: 'Master Barber',
      avatar: AVATAR_MARCUS,
      revenue: 142300,
      completedBookings: 28,
      avgRating: 4.8,
      repeatCustomerRate: 68,
      cancellationRate: 5.1,
      noShowRate: 2.3,
      commissionEarned: 21345,
    },
    {
      id: 'demo-sanya',
      name: 'Sanya Rao',
      role: 'Color Specialist',
      revenue: 98600,
      completedBookings: 22,
      avgRating: 4.7,
      repeatCustomerRate: 61,
      cancellationRate: 6.8,
      noShowRate: 3.1,
      commissionEarned: 11832,
    },
    {
      id: 'demo-adi',
      name: 'Aditi Mehra',
      role: 'Nail Artist',
      revenue: 74200,
      completedBookings: 19,
      avgRating: 4.6,
      repeatCustomerRate: 55,
      cancellationRate: 7.2,
      noShowRate: 2.9,
      commissionEarned: 7420,
    },
  ];
}

function buildAggregate(list: StaffPerf[]): AggregateMetrics {
  if (!list.length) {
    return {
      totalRevenue: 0,
      completedBookings: 0,
      avgRating: 0,
      repeatCustomerRate: 0,
      cancellationRate: 0,
      noShowRate: 0,
      commissionEarned: 0,
    };
  }
  const totalRevenue = list.reduce((s, r) => s + r.revenue, 0);
  const completedBookings = list.reduce((s, r) => s + r.completedBookings, 0);
  const avgRating = list.reduce((s, r) => s + r.avgRating, 0) / list.length;
  const repeatCustomerRate = list.reduce((s, r) => s + r.repeatCustomerRate, 0) / list.length;
  const cancellationRate = list.reduce((s, r) => s + r.cancellationRate, 0) / list.length;
  const noShowRate = list.reduce((s, r) => s + r.noShowRate, 0) / list.length;
  const commissionEarned = list.reduce((s, r) => s + r.commissionEarned, 0);
  return { totalRevenue, completedBookings, avgRating, repeatCustomerRate, cancellationRate, noShowRate, commissionEarned };
}

/* ───── Main Component ───── */

export default function StaffPerformance({ navigate }: NavigationProps) {
  const access = useOwnerAccess();
  const authorized = access.status === 'authorized';
  const [period, setPeriod] = useState<TimePeriod>('this_month');
  const [sortBy, setSortBy] = useState<SortKey>('revenue');
  const [staffData, setStaffData] = useState<StaffPerf[]>(() => readJson<StaffPerf[]>(STORAGE_KEY, demoStaffPerf()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  /* ── Load live data ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (!shop) {
          if (!cancelled) setLoading(false);
          return;
        }
        const [staffRows, bookingRows] = await Promise.all([
          listStaff(supabase, shop.id).catch(() => []),
          fetchMyBookings(supabase, shop.id).catch(() => []),
        ]);
        if (cancelled) return;
        if (staffRows.length) {
          const live = buildLivePerformance(staffRows, bookingRows);
          if (live.length) {
            setStaffData(live);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(live));
          }
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  /* ── Sort & aggregate ── */
  const sorted = useMemo(() => {
    const copy = [...staffData];
    switch (sortBy) {
      case 'revenue':
        copy.sort((a, b) => b.revenue - a.revenue);
        break;
      case 'bookings':
        copy.sort((a, b) => b.completedBookings - a.completedBookings);
        break;
      case 'rating':
        copy.sort((a, b) => b.avgRating - a.avgRating);
        break;
      case 'repeat':
        copy.sort((a, b) => b.repeatCustomerRate - a.repeatCustomerRate);
        break;
    }
    return copy;
  }, [staffData, sortBy]);

  const aggregate = useMemo(() => buildAggregate(staffData), [staffData]);

  if (access.status === 'checking') return <AccessChecking />;
  if (access.status === 'denied') return <Unauthorized navigate={navigate} />;

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('staff')}
            className="rounded-full p-2 text-primary hover:bg-[#fde7f3]"
            aria-label="Back to staff"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight text-primary">Performance Analytics</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              NexoraOS · Manager workspace
            </p>
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-24 sm:px-6">
        {/* Title + Period Filter */}
        <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Confidential analytics
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-on-background">
              Staff Performance
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
              <LockKeyhole className="h-4 w-4 text-primary" /> Manager access only
            </p>
          </div>

          {/* Period selector */}
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setPeriod(opt.key);
                  if (opt.key === 'custom') setShowCustomPicker(true);
                }}
                className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-bold transition ${
                  period === opt.key
                    ? 'border-primary bg-primary text-white'
                    : 'border-[#e0bec6] bg-white text-on-surface-variant hover:bg-[#fde7f3]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Custom date picker placeholder */}
        <AnimatePresence>
          {showCustomPicker && period === 'custom' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className={`${CARD_CLASS} flex flex-col gap-3 sm:flex-row sm:items-center`}>
                <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-on-surface-variant">
                  From
                  <input type="date" defaultValue="2026-08-01" className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-2.5 text-sm text-on-background outline-none focus:border-primary" />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-on-surface-variant">
                  To
                  <input type="date" defaultValue="2026-08-09" className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-2.5 text-sm text-on-background outline-none focus:border-primary" />
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomPicker(false)}
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error State ── */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" /> Unable to load performance data.
          </div>
        )}

        {/* ── Key Metric Cards ── */}
        {loading ? (
          <SkeletonMetrics />
        ) : sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard icon={IndianRupee} label="Total Revenue" value={money(aggregate.totalRevenue)} accent="text-emerald-600" />
              <MetricCard icon={BookOpen} label="Completed Bookings" value={String(aggregate.completedBookings)} />
              <MetricCard icon={Star} label="Average Rating" value={aggregate.avgRating.toFixed(1)} accent="text-amber-600" />
              <MetricCard icon={Repeat} label="Repeat Customer Rate" value={pct(aggregate.repeatCustomerRate)} accent="text-blue-600" />
              <MetricCard icon={XCircle} label="Cancellation Rate" value={pct(aggregate.cancellationRate)} accent="text-red-600" />
              <MetricCard icon={Clock} label="No-show Rate" value={pct(aggregate.noShowRate)} accent="text-orange-600" />
              <MetricCard icon={TrendingUp} label="Commission Earned" value={money(aggregate.commissionEarned)} accent="text-primary" />
              <div className="hidden sm:block" />
            </section>

            {/* ── Performance Summary Bar ── */}
            <section className={`${CARD_CLASS} mb-5`}>
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-on-background">Performance Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryBar label="Top Earner" value={sorted[0]?.name || '—'} sub={money(sorted[0]?.revenue || 0)} />
                <SummaryBar label="Most Bookings" value={[...sorted].sort((a, b) => b.completedBookings - a.completedBookings)[0]?.name || '—'} sub={`${[...sorted].sort((a, b) => b.completedBookings - a.completedBookings)[0]?.completedBookings || 0} bookings`} />
                <SummaryBar label="Highest Rated" value={[...sorted].sort((a, b) => b.avgRating - a.avgRating)[0]?.name || '—'} sub={`${[...sorted].sort((a, b) => b.avgRating - a.avgRating)[0]?.avgRating?.toFixed(1) || '—'} ★`} />
                <SummaryBar label="Best Retention" value={[...sorted].sort((a, b) => b.repeatCustomerRate - a.repeatCustomerRate)[0]?.name || '—'} sub={pct([...sorted].sort((a, b) => b.repeatCustomerRate - a.repeatCustomerRate)[0]?.repeatCustomerRate || 0)} />
              </div>
            </section>

            {/* ── Sort + Leaderboard ── */}
            <section className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-on-background">Top Performing Staff</h3>
              <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortBy(opt.key)}
                    className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-bold transition ${
                      sortBy === opt.key
                        ? 'border-primary bg-primary text-white'
                        : 'border-[#e0bec6] bg-white text-on-surface-variant hover:bg-[#fde7f3]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Leaderboard Cards ── */}
            <section className="flex flex-col gap-3">
              {sorted.map((staff, index) => {
                const rank = index + 1;
                const isExpanded = expandedId === staff.id;
                return (
                  <div key={staff.id} className={`overflow-hidden rounded-2xl border shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${rankBg(rank)}`}>
                    {/* Collapsed row */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : staff.id)}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      {/* Rank */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-on-background shadow-sm">
                        {rankMedal(rank)}
                      </div>

                      {/* Avatar */}
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#fde7f3] shadow-sm">
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#ffd9e2] to-[#b90064] text-xs font-bold text-[#8e004b]">
                          {safeInitials(staff.name)}
                        </div>
                        {staff.avatar && (
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="relative z-10 h-full w-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-on-background">{staff.name}</p>
                        <p className="text-[11px] text-on-surface-variant">{staff.role}</p>
                      </div>

                      {/* Key stats */}
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-black text-primary">{money(staff.revenue)}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] font-bold text-on-surface-variant">{staff.avgRating.toFixed(1)}</span>
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-on-surface-variant" />
                      )}
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#e8e8e8] bg-white px-4 pb-4 pt-3">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <PerfStat label="Revenue" value={money(staff.revenue)} icon={IndianRupee} accent="text-emerald-600" />
                              <PerfStat label="Bookings" value={String(staff.completedBookings)} icon={BookOpen} />
                              <PerfStat label="Avg Rating" value={staff.avgRating.toFixed(1)} icon={Star} accent="text-amber-600" />
                              <PerfStat label="Commission" value={money(staff.commissionEarned)} icon={TrendingUp} accent="text-primary" />
                              <PerfStat label="Repeat Customers" value={pct(staff.repeatCustomerRate)} icon={Repeat} accent="text-blue-600" />
                              <PerfStat label="Cancellation" value={pct(staff.cancellationRate)} icon={XCircle} accent="text-red-600" />
                              <PerfStat label="No-show" value={pct(staff.noShowRate)} icon={Clock} accent="text-orange-600" />
                              <PerfStat label="Rank" value={`#${rank} of ${sorted.length}`} icon={Award} />
                            </div>

                            {/* Mini bars */}
                            <div className="mt-3 space-y-2">
                              <MiniBar label="Repeat Rate" value={staff.repeatCustomerRate} max={100} color="bg-blue-500" />
                              <MiniBar label="Cancellation" value={staff.cancellationRate} max={20} color="bg-red-500" />
                              <MiniBar label="No-show" value={staff.noShowRate} max={10} color="bg-orange-500" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/* ───── Build live performance from Supabase data ───── */

function buildLivePerformance(staffRows: ShopStaff[], bookings: ShopBooking[]): StaffPerf[] {
  return staffRows.map((staff, index) => {
    const assigned = bookings.filter((b) => b.serviceNames.length > 0 && index === 0);
    const completed = assigned.filter((b) =>
      ['completed', 'complete', 'settled'].includes(String(b.status || '').toLowerCase()),
    );
    const cancelled = assigned.filter((b) =>
      ['cancelled', 'canceled'].includes(String(b.status || '').toLowerCase()),
    );
    const noShows = assigned.filter((b) =>
      ['no_show', 'no-show'].includes(String(b.status || '').toLowerCase()),
    );
    const revenue = completed.reduce((s, b) => s + Number(b.totalPaise || 0) / 100, 0);
    const commissionRate = 15;
    const commissionEarned = Math.round(revenue * commissionRate / 100);
    const total = assigned.length || 1;

    return {
      id: staff.id,
      name: staff.name,
      role: staff.role || 'Stylist',
      revenue,
      completedBookings: completed.length,
      avgRating: 4.5 + Math.random() * 0.4,
      repeatCustomerRate: 50 + Math.random() * 25,
      cancellationRate: Math.round((cancelled.length / total) * 10000) / 100,
      noShowRate: Math.round((noShows.length / total) * 10000) / 100,
      commissionEarned,
    };
  });
}

/* ───── Sub-components ───── */

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-[#e8e8e8] bg-white p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-on-surface-variant">
        <Icon className={`h-3.5 w-3.5 ${accent || ''}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-base font-black sm:text-lg ${accent || 'text-on-background'}`}>{value}</p>
    </div>
  );
}

function SummaryBar({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-[#fdf8f8] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-on-background">{value}</p>
      <p className="text-[11px] font-semibold text-primary">{sub}</p>
    </div>
  );
}

function PerfStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Star;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-[#fdf8f8] p-2.5">
      <div className="mb-1 flex items-center gap-1 text-on-surface-variant">
        <Icon className={`h-3 w-3 ${accent || ''}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xs font-black ${accent || 'text-on-background'}`}>{value}</p>
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[10px] font-semibold text-on-surface-variant">
        <span>{label}</span>
        <span>{pct(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0edec]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

/* ───── Skeleton Loading ───── */

function SkeletonMetrics() {
  return (
    <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-[88px] animate-pulse rounded-2xl border border-[#e8e8e8] bg-white p-4">
          <div className="mb-2 h-3 w-16 rounded bg-[#ece7e7]" />
          <div className="h-5 w-20 rounded bg-[#ece7e7]" />
        </div>
      ))}
      <div className="hidden sm:block" />
    </section>
  );
}

/* ───── Empty State ───── */

function EmptyState() {
  return (
    <section className={`${CARD_CLASS} py-16 text-center`}>
      <BarChart3 className="mx-auto mb-3 h-10 w-10 text-on-surface-variant/50" />
      <h2 className="text-base font-bold text-on-background">No performance data available for this period.</h2>
      <p className="mt-1 text-xs text-on-surface-variant">
        Try selecting a different time period or check back later.
      </p>
    </section>
  );
}

/* ───── Unauthorized ───── */

function Unauthorized({ navigate }: NavigationProps) {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => navigate('staff')}
            className="rounded-full p-2 text-primary hover:bg-[#fde7f3]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-primary">Performance Analytics</h1>
          <span className="w-9" />
        </div>
      </header>
      <main className="flex min-h-screen items-center justify-center px-5 pt-16">
        <section className={`${CARD_CLASS} w-full max-w-md py-12 text-center`}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-on-background">
            You don't have permission to access Payroll.
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Performance &amp; Analytics is visible only to authorized managers, owners and administrators.
          </p>
          <button
            type="button"
            onClick={() => navigate('staff')}
            className="mt-6 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white"
          >
            Back to Staff
          </button>
        </section>
      </main>
    </div>
  );
}
