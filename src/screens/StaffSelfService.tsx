import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Home,
  IndianRupee,
  LogIn,
  LogOut,
  MessageSquare,
  Moon,
  Phone,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Star,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';
import {
  fetchMyShop,
  listStaff,
  ShopStaff,
} from '../lib/shopRepository';

/* ───── Types ───── */

type TabKey = 'home' | 'schedule' | 'earnings' | 'leave' | 'profile';
type BookingStatus = 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
type ShiftSwapStatus = 'Pending' | 'Approved' | 'Rejected';

type TodayBooking = {
  id: string;
  customerName: string;
  serviceName: string;
  time: string;
  duration: string;
  status: BookingStatus;
};

type ShiftSlot = {
  day: string;
  shift: string;
  breaks: string;
  status: 'active' | 'off' | 'break';
};

type EarningLine = {
  label: string;
  amount: number;
  date?: string;
};

type LeaveRecord = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
};

type ShiftSwapRequest = {
  id: string;
  date: string;
  shift: string;
  replacement: string;
  reason: string;
  status: ShiftSwapStatus;
  createdAt: string;
};

type ProfileData = {
  name: string;
  role: string;
  phone: string;
  email: string;
  skills: string[];
  assignedServices: string[];
  avatar?: string;
};

/* ───── Constants ───── */

const CLOCK_KEY = 'nexora_staff_clock_state';
const LEAVE_KEY = 'nexora_staff_leave_requests';
const SWAP_KEY = 'nexora_staff_swap_requests';

const CARD_CLASS =
  'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';

const INPUT_CLASS =
  'w-full rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

const AVATAR_ELENA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBgK4i87T9zaSWtTpAX8ftOSq5DsvdiLIMBIFtrdKRgquoy229sj4FWpkPoFbDtGT0hQkuA7BxlkH7BBMbGJVV2G2P5B8GPGRRsGpdUnXHEXv80SvpFM2Tvtb-Vl0c404jrR3FnqXOIJ8rxqBRAYFwJSWoMuZ_7dleFJcNF4HPqNuvcZOt2UNuCCs1MtCHRYsr-m8nYSAnK7kGo5LODQoilthjYlH0wE-E7gY--ZupoRur1T2oWS4o1';

/* ───── Helpers ───── */

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
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

function uid() {
  return `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function safeInitials(name: string) {
  return name.trim().split(/\s+/).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'ST';
}

function statusColor(status: BookingStatus | LeaveStatus | ShiftSwapStatus) {
  if (status === 'Confirmed' || status === 'Approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'In Progress' || status === 'Pending') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'Completed') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'Cancelled' || status === 'Rejected') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-[#e8e8e8] bg-[#fdf8f8] text-on-surface-variant';
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ───── Demo Data ───── */

function demoProfile(): ProfileData {
  return {
    name: 'Elena Rodriguez',
    role: 'Senior Stylist',
    phone: '+91 98765 43210',
    email: 'elena@nexora.com',
    skills: ['Coloring', 'Balayage', 'Extensions', 'Bridal Makeup'],
    assignedServices: ['Hair Coloring', 'Balayage', 'Haircut', 'Keratin Treatment', 'Bridal Makeup', 'Facial'],
    avatar: AVATAR_ELENA,
  };
}

function demoTodayBookings(): TodayBooking[] {
  return [
    { id: 'bk-1', customerName: 'Priya Sharma', serviceName: 'Balayage', time: '10:00 AM', duration: '2h', status: 'Confirmed' },
    { id: 'bk-2', customerName: 'Ananya Gupta', serviceName: 'Hair Coloring', time: '12:30 PM', duration: '1.5h', status: 'In Progress' },
    { id: 'bk-3', customerName: 'Meera Patel', serviceName: 'Bridal Makeup', time: '3:00 PM', duration: '3h', status: 'Confirmed' },
    { id: 'bk-4', customerName: 'Riya Singh', serviceName: 'Haircut', time: '5:30 PM', duration: '45m', status: 'Confirmed' },
  ];
}

function demoSchedule(): ShiftSlot[] {
  return [
    { day: 'Monday', shift: '9:00 AM – 6:00 PM', breaks: '1:00 PM – 2:00 PM', status: 'active' },
    { day: 'Tuesday', shift: '9:00 AM – 6:00 PM', breaks: '1:00 PM – 2:00 PM', status: 'active' },
    { day: 'Wednesday', shift: '9:00 AM – 6:00 PM', breaks: '1:00 PM – 2:00 PM', status: 'active' },
    { day: 'Thursday', shift: '10:00 AM – 7:00 PM', breaks: '1:30 PM – 2:30 PM', status: 'active' },
    { day: 'Friday', shift: '10:00 AM – 7:00 PM', breaks: '1:30 PM – 2:30 PM', status: 'active' },
    { day: 'Saturday', shift: '9:00 AM – 4:00 PM', breaks: '12:30 PM – 1:00 PM', status: 'active' },
    { day: 'Sunday', shift: 'Off', breaks: '—', status: 'off' },
  ];
}

function demoEarnings(): { commission: EarningLine[]; bonuses: EarningLine[]; upcomingPayout: number; statements: { label: string; amount: string; date: string }[] } {
  return {
    commission: [
      { label: 'Balayage — Priya Sharma', amount: 3000, date: '09 Aug 2026' },
      { label: 'Hair Coloring — Ananya Gupta', amount: 2250, date: '09 Aug 2026' },
      { label: 'Bridal Makeup — Meera Patel', amount: 2000, date: '08 Aug 2026' },
      { label: 'Haircut — Riya Singh', amount: 1200, date: '08 Aug 2026' },
      { label: 'Keratin — Neha Verma', amount: 3750, date: '07 Aug 2026' },
    ],
    bonuses: [
      { label: 'Performance Bonus', amount: 3000 },
      { label: 'Sales Incentive', amount: 1500 },
    ],
    upcomingPayout: 18450,
    statements: [
      { label: 'July 2026', amount: '₹68,200', date: '01 Aug 2026' },
      { label: 'June 2026', amount: '₹64,800', date: '01 Jul 2026' },
    ],
  };
}

function demoLeave(): { balance: { total: number; used: number; pending: number }; records: LeaveRecord[] } {
  return {
    balance: { total: 24, used: 8, pending: 2 },
    records: [
      { id: 'lv-1', type: 'Casual Leave', startDate: '15 Aug 2026', endDate: '16 Aug 2026', days: 2, reason: 'Family event', status: 'Pending' },
      { id: 'lv-2', type: 'Sick Leave', startDate: '01 Aug 2026', endDate: '01 Aug 2026', days: 1, reason: 'Fever', status: 'Approved' },
      { id: 'lv-3', type: 'Casual Leave', startDate: '20 Jul 2026', endDate: '22 Jul 2026', days: 3, reason: 'Travel', status: 'Approved' },
      { id: 'lv-4', type: 'Personal Leave', startDate: '10 Jul 2026', endDate: '10 Jul 2026', days: 1, reason: 'Personal', status: 'Rejected' },
    ],
  };
}

function demoStaffList(): { id: string; name: string; role: string }[] {
  return [
    { id: 's1', name: 'Marcus Chen', role: 'Master Barber' },
    { id: 's2', name: 'Sanya Rao', role: 'Color Specialist' },
    { id: 's3', name: 'Aditi Mehra', role: 'Nail Artist' },
  ];
}

/* ───── Main Component ───── */

export default function StaffSelfService({ navigate }: NavigationProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [profile] = useState<ProfileData>(demoProfile);
  const [todayBookings] = useState<TodayBooking[]>(demoTodayBookings);
  const [schedule] = useState<ShiftSlot[]>(demoSchedule);
  const [earnings] = useState(demoEarnings);
  const [leaveData, setLeaveData] = useState(demoLeave);
  const [staffList] = useState(demoStaffList);

  // Clock state
  const [clockState, setClockState] = useState<{ clockedIn: boolean; clockInTime: string | null; clockOutTime: string | null }>(() =>
    readJson(CLOCK_KEY, { clockedIn: false, clockInTime: null, clockOutTime: null }),
  );

  // Modal states
  const [showClockInConfirm, setShowClockInConfirm] = useState(false);
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>(() =>
    readJson(SWAP_KEY, []),
  );

  // Leave form
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Swap form
  const [swapDate, setSwapDate] = useState('');
  const [swapShift, setSwapShift] = useState('');
  const [swapReplacement, setSwapReplacement] = useState('');
  const [swapReason, setSwapReason] = useState('');

  const [toast, setToast] = useState<string | null>(null);

  // Persist clock state
  useEffect(() => {
    window.localStorage.setItem(CLOCK_KEY, JSON.stringify(clockState));
  }, [clockState]);

  // Persist swap requests
  useEffect(() => {
    window.localStorage.setItem(SWAP_KEY, JSON.stringify(swapRequests));
  }, [swapRequests]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Clock In ── */
  const handleClockIn = useCallback(() => {
    if (clockState.clockedIn) {
      showToast('Already clocked in');
      return;
    }
    setClockState({ clockedIn: true, clockInTime: nowHHMM(), clockOutTime: null });
    setShowClockInConfirm(false);
    showToast('Clocked in successfully');
  }, [clockState, showToast]);

  /* ── Clock Out ── */
  const handleClockOut = useCallback(() => {
    if (!clockState.clockedIn) {
      showToast('Clock in first before clocking out');
      return;
    }
    setClockState({ ...clockState, clockedIn: false, clockOutTime: nowHHMM() });
    setShowClockOutConfirm(false);
    showToast('Clocked out successfully');
  }, [clockState, showToast]);

  /* ── Submit Leave Request ── */
  const submitLeave = useCallback(() => {
    if (!leaveStartDate || !leaveEndDate || !leaveReason.trim()) {
      showToast('Please fill all fields');
      return;
    }
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const newRecord: LeaveRecord = {
      id: uid(),
      type: leaveType,
      startDate: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      endDate: end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      days,
      reason: leaveReason.trim(),
      status: 'Pending',
    };
    setLeaveData((prev) => ({
      ...prev,
      balance: { ...prev.balance, pending: prev.balance.pending + days },
      records: [newRecord, ...prev.records],
    }));
    setShowLeaveForm(false);
    setLeaveType('Casual Leave');
    setLeaveStartDate('');
    setLeaveEndDate('');
    setLeaveReason('');
    showToast('Leave request submitted');
  }, [leaveType, leaveStartDate, leaveEndDate, leaveReason, showToast]);

  /* ── Submit Shift Swap ── */
  const submitSwap = useCallback(() => {
    if (!swapDate || !swapShift || !swapReplacement || !swapReason.trim()) {
      showToast('Please fill all fields');
      return;
    }
    const newSwap: ShiftSwapRequest = {
      id: uid(),
      date: swapDate,
      shift: swapShift,
      replacement: staffList.find((s) => s.id === swapReplacement)?.name || swapReplacement,
      reason: swapReason.trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setSwapRequests((prev) => [newSwap, ...prev]);
    setShowSwapForm(false);
    setSwapDate('');
    setSwapShift('');
    setSwapReplacement('');
    setSwapReason('');
    showToast('Shift swap request submitted');
  }, [swapDate, swapShift, swapReplacement, swapReason, staffList, showToast]);

  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayShift = schedule.find((s) => s.day === todayDay);

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-[#fde7f3] shadow-sm">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#ffd9e2] to-[#b90064] text-xs font-bold text-[#8e004b]">
                {safeInitials(profile.name)}
              </div>
              {profile.avatar && (
                <img src={profile.avatar} alt={profile.name} className="relative z-10 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Welcome Back</p>
              <h1 className="text-base font-bold leading-tight text-primary">{profile.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${clockState.clockedIn ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[#e8e8e8] bg-[#fdf8f8] text-on-surface-variant'}`}>
              {clockState.clockedIn ? 'Clocked In' : 'Off Duty'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fde7f3] text-primary">
              <Bell className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-20 sm:px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <HomeTab
                profile={profile}
                todayBookings={todayBookings}
                todayShift={todayShift || null}
                clockState={clockState}
                onClockIn={() => setShowClockInConfirm(true)}
                onClockOut={() => setShowClockOutConfirm(true)}
                onRequestLeave={() => { setActiveTab('leave'); setShowLeaveForm(true); }}
                onRequestSwap={() => setShowSwapForm(true)}
              />
            </motion.div>
          )}
          {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <ScheduleTab schedule={schedule} todayBookings={todayBookings} />
            </motion.div>
          )}
          {activeTab === 'earnings' && (
            <motion.div key="earnings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <EarningsTab earnings={earnings} />
            </motion.div>
          )}
          {activeTab === 'leave' && (
            <motion.div key="leave" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <LeaveTab
                leaveData={leaveData}
                onRequestLeave={() => setShowLeaveForm(true)}
              />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <ProfileTab profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 z-40 flex h-[72px] w-full items-center justify-around border-t border-[#e8e8e8] bg-white px-1 pb-safe">
        {([
          { key: 'home' as TabKey, icon: Home, label: 'Home' },
          { key: 'schedule' as TabKey, icon: CalendarDays, label: 'Schedule' },
          { key: 'earnings' as TabKey, icon: IndianRupee, label: 'Earnings' },
          { key: 'leave' as TabKey, icon: Calendar, label: 'Leave' },
          { key: 'profile' as TabKey, icon: User, label: 'Profile' },
        ]).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-all ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? 'bg-[#fde7f3]' : ''}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-primary font-bold' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Clock In Confirmation ── */}
      <AnimatePresence>
        {showClockInConfirm && (
          <Modal onClose={() => setShowClockInConfirm(false)}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <LogIn className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-on-background">Clock In?</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Your shift starts at <b>{todayShift?.shift || '9:00 AM – 6:00 PM'}</b>. Clock in time will be recorded as <b>{nowHHMM()}</b>.
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setShowClockInConfirm(false)} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button>
              <button type="button" onClick={handleClockIn} className="flex-1 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white">Confirm Clock In</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Clock Out Confirmation ── */}
      <AnimatePresence>
        {showClockOutConfirm && (
          <Modal onClose={() => setShowClockOutConfirm(false)}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <LogOut className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-on-background">Clock Out?</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Clocked in at <b>{clockState.clockInTime}</b>. Clock out time will be recorded as <b>{nowHHMM()}</b>.
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setShowClockOutConfirm(false)} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button>
              <button type="button" onClick={handleClockOut} className="flex-1 rounded-xl bg-blue-600 px-3 py-3 text-xs font-bold text-white">Confirm Clock Out</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Leave Request Form ── */}
      <AnimatePresence>
        {showLeaveForm && (
          <Modal onClose={() => setShowLeaveForm(false)}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde7f3] text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-background">Request Leave</h3>
                <p className="text-xs text-on-surface-variant">Manager approval required.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                Leave Type
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className={`${INPUT_CLASS} appearance-none`}>
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Personal Leave</option>
                  <option>Earned Leave</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                  Start Date
                  <input type="date" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} className={INPUT_CLASS} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                  End Date
                  <input type="date" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} className={INPUT_CLASS} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                Reason
                <textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Brief reason for leave..." rows={3} className={`${INPUT_CLASS} resize-none`} />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setShowLeaveForm(false)} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button>
              <button type="button" onClick={submitLeave} className="flex-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white">Submit Request</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Shift Swap Form ── */}
      <AnimatePresence>
        {showSwapForm && (
          <Modal onClose={() => setShowSwapForm(false)}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde7f3] text-primary">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-background">Request Shift Swap</h3>
                <p className="text-xs text-on-surface-variant">Manager approval required.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                Date
                <input type="date" value={swapDate} onChange={(e) => setSwapDate(e.target.value)} className={INPUT_CLASS} />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                Shift
                <select value={swapShift} onChange={(e) => setSwapShift(e.target.value)} className={`${INPUT_CLASS} appearance-none`}>
                  <option value="">Select shift...</option>
                  <option>Morning (9:00 AM – 1:00 PM)</option>
                  <option>Afternoon (1:00 PM – 6:00 PM)</option>
                  <option>Full Day (9:00 AM – 6:00 PM)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                Replacement Staff
                <select value={swapReplacement} onChange={(e) => setSwapReplacement(e.target.value)} className={`${INPUT_CLASS} appearance-none`}>
                  <option value="">Select staff...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                Reason
                <textarea value={swapReason} onChange={(e) => setSwapReason(e.target.value)} placeholder="Why do you need this swap?" rows={3} className={`${INPUT_CLASS} resize-none`} />
              </label>
            </div>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-700">
              Manager approval required. Your swap request will be reviewed before confirmation.
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setShowSwapForm(false)} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button>
              <button type="button" onClick={submitSwap} className="flex-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white">Submit Request</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 10 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl"
          >
            <Check className="h-4 w-4 text-emerald-300" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: HOME
   ═══════════════════════════════════════════════════════ */

function HomeTab({
  profile,
  todayBookings,
  todayShift,
  clockState,
  onClockIn,
  onClockOut,
  onRequestLeave,
  onRequestSwap,
}: {
  profile: ProfileData;
  todayBookings: TodayBooking[];
  todayShift: ShiftSlot | null;
  clockState: { clockedIn: boolean; clockInTime: string | null; clockOutTime: string | null };
  onClockIn: () => void;
  onClockOut: () => void;
  onRequestLeave: () => void;
  onRequestSwap: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Greeting + Status */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight text-on-background">
          Welcome Back, {profile.name.split(' ')[0]}
        </h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant">
          <Shield className="h-4 w-4 text-primary" />
          {profile.role} · {clockState.clockedIn ? (
            <span className="font-semibold text-emerald-600">On Duty since {clockState.clockInTime}</span>
          ) : (
            <span className="font-semibold text-on-surface-variant">Off Duty</span>
          )}
        </p>
      </section>

      {/* Today's Shift */}
      {todayShift && (
        <section className={`${CARD_CLASS} border-primary/20 bg-[#fde7f3]`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Today&apos;s Shift</p>
              <p className="mt-1 text-base font-black text-on-background">{todayShift.shift}</p>
              <p className="text-xs text-on-surface-variant">Break: {todayShift.breaks}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-on-background">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton icon={LogIn} label="Clock In" onClick={onClockIn} disabled={clockState.clockedIn} color="text-emerald-600 bg-emerald-50" />
          <ActionButton icon={LogOut} label="Clock Out" onClick={onClockOut} disabled={!clockState.clockedIn} color="text-blue-600 bg-blue-50" />
          <ActionButton icon={Calendar} label="Request Leave" onClick={onRequestLeave} color="text-amber-600 bg-amber-50" />
          <ActionButton icon={RefreshCw} label="Request Shift Swap" onClick={onRequestSwap} color="text-purple-600 bg-purple-50" />
        </div>
      </section>

      {/* Today's Bookings */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-on-background">
          Today&apos;s Bookings <span className="text-on-surface-variant">({todayBookings.length})</span>
        </h3>
        {todayBookings.length === 0 ? (
          <div className={`${CARD_CLASS} py-10 text-center`}>
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-on-surface-variant/50" />
            <p className="text-sm font-semibold text-on-surface-variant">No bookings today</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayBookings.map((booking) => (
              <div key={booking.id} className={`${CARD_CLASS} flex items-center gap-3`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fde7f3] text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-on-background">{booking.customerName}</p>
                  <p className="text-[11px] text-on-surface-variant">{booking.serviceName} · {booking.duration}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-on-background">{booking.time}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: SCHEDULE
   ═══════════════════════════════════════════════════════ */

function ScheduleTab({ schedule, todayBookings }: { schedule: ShiftSlot[]; todayBookings: TodayBooking[] }) {
  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-on-background">My Schedule</h2>

      {/* Today Highlight */}
      {schedule.find((s) => s.day === todayDay) && (
        <section className={`${CARD_CLASS} border-primary/20 bg-[#fde7f3]`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Today</p>
          <p className="mt-1 text-lg font-black text-on-background">{schedule.find((s) => s.day === todayDay)?.shift}</p>
          <p className="text-xs text-on-surface-variant">Break: {schedule.find((s) => s.day === todayDay)?.breaks}</p>
        </section>
      )}

      {/* Weekly Schedule */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-on-background">Weekly Schedule</h3>
        <div className="flex flex-col gap-1.5">
          {schedule.map((slot) => {
            const isToday = slot.day === todayDay;
            return (
              <div
                key={slot.day}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  isToday ? 'border border-primary/20 bg-[#fde7f3]' : slot.status === 'off' ? 'bg-[#f0edec]' : 'bg-[#fdf8f8]'
                }`}
              >
                <div className={`w-16 text-xs font-bold ${isToday ? 'text-primary' : 'text-on-background'}`}>
                  {slot.day.slice(0, 3)}
                </div>
                <div className="flex-1 text-xs font-semibold text-on-background">
                  {slot.status === 'off' ? (
                    <span className="text-on-surface-variant">Off</span>
                  ) : (
                    slot.shift
                  )}
                </div>
                <div className="text-[11px] text-on-surface-variant">
                  {slot.status !== 'off' && (
                    <span className="flex items-center gap-1">
                      <Coffee className="h-3 w-3" /> {slot.breaks}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Assigned Bookings Today */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-on-background">
          Assigned Bookings <span className="text-on-surface-variant">({todayBookings.length})</span>
        </h3>
        <div className="flex flex-col gap-2">
          {todayBookings.map((b) => (
            <div key={b.id} className={`${CARD_CLASS} flex items-center gap-3`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fde7f3] text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-on-background">{b.customerName}</p>
                <p className="text-[11px] text-on-surface-variant">{b.serviceName}</p>
              </div>
              <span className="text-xs font-bold text-on-background">{b.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: EARNINGS (STAFF-ONLY — NO OTHER STAFF DATA)
   ═══════════════════════════════════════════════════════ */

function EarningsTab({ earnings }: { earnings: { commission: EarningLine[]; bonuses: EarningLine[]; upcomingPayout: number; statements: { label: string; amount: string; date: string }[] } }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-on-background">My Earnings</h2>

      {/* Upcoming Payout */}
      <section className={`${CARD_CLASS} border-primary/20 bg-[#fde7f3]`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Upcoming Payout</p>
        <p className="mt-2 text-3xl font-black text-primary">{money(earnings.upcomingPayout)}</p>
        <p className="mt-1 text-xs text-on-surface-variant">August 2026 cycle</p>
      </section>

      {/* Commission */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-on-background">
          <IndianRupee className="h-4 w-4 text-primary" /> Commission Earned
        </h3>
        <div className="flex flex-col gap-1.5">
          {earnings.commission.map((line, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-[#fdf8f8] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-on-background">{line.label}</p>
                {line.date && <p className="text-[10px] text-on-surface-variant">{line.date}</p>}
              </div>
              <span className="text-xs font-bold text-emerald-600">{money(line.amount)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bonuses */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-on-background">
          <Star className="h-4 w-4 text-amber-500" /> Bonuses
        </h3>
        <div className="flex flex-col gap-1.5">
          {earnings.bonuses.map((line, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-[#fdf8f8] px-3 py-2.5">
              <span className="text-xs font-semibold text-on-background">{line.label}</span>
              <span className="text-xs font-bold text-amber-600">{money(line.amount)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Statements */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-on-background">Recent Statements</h3>
        <div className="flex flex-col gap-1.5">
          {earnings.statements.map((stmt, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-[#fdf8f8] px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-on-background">{stmt.label}</p>
                <p className="text-[10px] text-on-surface-variant">Paid on {stmt.date}</p>
              </div>
              <span className="text-xs font-bold text-on-background">{stmt.amount}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: LEAVE
   ═══════════════════════════════════════════════════════ */

function LeaveTab({ leaveData, onRequestLeave }: { leaveData: { balance: { total: number; used: number; pending: number }; records: LeaveRecord[] }; onRequestLeave: () => void }) {
  const available = leaveData.balance.total - leaveData.balance.used - leaveData.balance.pending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-on-background">My Leave</h2>
        <button
          type="button"
          onClick={onRequestLeave}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Request Leave
        </button>
      </div>

      {/* Leave Balance */}
      <section className="grid grid-cols-3 gap-3">
        <div className={`${CARD_CLASS} text-center`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total</p>
          <p className="mt-1 text-2xl font-black text-on-background">{leaveData.balance.total}</p>
          <p className="text-[10px] text-on-surface-variant">days</p>
        </div>
        <div className={`${CARD_CLASS} text-center`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Used</p>
          <p className="mt-1 text-2xl font-black text-red-600">{leaveData.balance.used}</p>
          <p className="text-[10px] text-on-surface-variant">days</p>
        </div>
        <div className={`${CARD_CLASS} text-center`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Available</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{available}</p>
          <p className="text-[10px] text-on-surface-variant">days</p>
        </div>
      </section>

      {/* Pending Requests */}
      {leaveData.records.filter((r) => r.status === 'Pending').length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-amber-700">Pending Requests</h3>
          <div className="flex flex-col gap-2">
            {leaveData.records.filter((r) => r.status === 'Pending').map((rec) => (
              <LeaveCard key={rec.id} record={rec} />
            ))}
          </div>
        </section>
      )}

      {/* Approved Requests */}
      {leaveData.records.filter((r) => r.status === 'Approved').length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-emerald-700">Approved</h3>
          <div className="flex flex-col gap-2">
            {leaveData.records.filter((r) => r.status === 'Approved').map((rec) => (
              <LeaveCard key={rec.id} record={rec} />
            ))}
          </div>
        </section>
      )}

      {/* Rejected Requests */}
      {leaveData.records.filter((r) => r.status === 'Rejected').length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-red-700">Rejected</h3>
          <div className="flex flex-col gap-2">
            {leaveData.records.filter((r) => r.status === 'Rejected').map((rec) => (
              <LeaveCard key={rec.id} record={rec} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LeaveCard({ record }: { record: LeaveRecord }) {
  return (
    <div className={`${CARD_CLASS} flex items-center gap-3`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fde7f3] text-primary">
        <Calendar className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-on-background">{record.type}</p>
        <p className="text-[11px] text-on-surface-variant">{record.startDate} – {record.endDate} · {record.days} day{record.days > 1 ? 's' : ''}</p>
        <p className="text-[11px] text-on-surface-variant">{record.reason}</p>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusColor(record.status)}`}>
        {record.status}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB: PROFILE
   ═══════════════════════════════════════════════════════ */

function ProfileTab({ profile }: { profile: ProfileData }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-on-background">My Profile</h2>

      {/* Profile Header */}
      <section className={`${CARD_CLASS} flex items-center gap-4`}>
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-[#fde7f3] shadow-sm">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#ffd9e2] to-[#b90064] text-lg font-bold text-[#8e004b]">
            {safeInitials(profile.name)}
          </div>
          {profile.avatar && (
            <img src={profile.avatar} alt={profile.name} className="relative z-10 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-on-background">{profile.name}</h3>
          <p className="text-sm font-semibold text-on-surface-variant">{profile.role}</p>
          <span className="mt-1 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Active</span>
        </div>
      </section>

      {/* Contact */}
      <section className={CARD_CLASS}>
        <h3 className="mb-3 text-sm font-bold text-on-background">Contact Information</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-xl bg-[#fdf8f8] px-3 py-2.5">
            <Phone className="h-4 w-4 text-on-surface-variant" />
            <span className="text-xs font-semibold text-on-background">{profile.phone}</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#fdf8f8] px-3 py-2.5">
            <MessageSquare className="h-4 w-4 text-on-surface-variant" />
            <span className="text-xs font-semibold text-on-background">{profile.email}</span>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className={CARD_CLASS}>
        <h3 className="mb-3 text-sm font-bold text-on-background">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span key={skill} className="rounded-full border border-[#e0bec6] bg-[#fdf8f8] px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant">
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Assigned Services */}
      <section className={CARD_CLASS}>
        <h3 className="mb-3 text-sm font-bold text-on-background">Assigned Services</h3>
        <div className="flex flex-col gap-1.5">
          {profile.assignedServices.map((svc) => (
            <div key={svc} className="flex items-center gap-2 rounded-lg bg-[#fdf8f8] px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-on-background">{svc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Notification Settings */}
      <section className={CARD_CLASS}>
        <h3 className="mb-3 text-sm font-bold text-on-background">Notification Settings</h3>
        <div className="flex flex-col gap-2">
          {['Booking reminders', 'Schedule changes', 'Leave updates', 'Payout notifications'].map((item) => (
            <label key={item} className="flex items-center justify-between rounded-xl bg-[#fdf8f8] px-3 py-2.5">
              <span className="text-xs font-semibold text-on-background">{item}</span>
              <div className="relative h-5 w-9">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-[#e0bec6] peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════ */

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
      >
        {children}
      </motion.div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  color,
}: {
  icon: typeof Clock;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 rounded-2xl border border-[#e8e8e8] p-3.5 text-left transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-[#f0edec]' : 'bg-white hover:bg-[#fdf8f8] active:scale-[0.98]'}`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-bold text-on-background">{label}</span>
    </button>
  );
}

function Coffee(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" x2="6" y1="2" y2="4" /><line x1="10" x2="10" y1="2" y2="4" /><line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}
