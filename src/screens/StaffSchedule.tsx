import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Filter,
  LockKeyhole,
  MoreVertical,
  Plus,
  Search,
  Scissors,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';
import {
  fetchMyBookings,
  fetchMyShop,
  listStaff,
  ShopBooking,
  ShopStaff,
} from '../lib/shopRepository';

type CalendarView = 'day' | 'week' | 'month';
type EventType = 'booking' | 'break' | 'blocked' | 'leave' | 'overtime';
type ModalType = 'shift' | 'blocked' | 'booking' | null;

type Staff = { id: string; name: string; role: string; color: string; phone?: string };
type ScheduleEvent = {
  id: string;
  type: EventType;
  staffId: string;
  date: string;
  start: string;
  end: string;
  customer?: string;
  service?: string;
  serviceCategory?: string;
  reason?: string;
  status?: string;
};
type ShiftBlock = {
  id: string;
  staffId: string;
  date: string;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
  type: 'Regular' | 'Custom' | 'Overtime';
};
type SwapRequest = {
  id: string;
  staffA: string;
  staffB: string;
  date: string;
  shift: string;
  status: 'Pending' | 'Approved' | 'Declined';
};

type FormState = {
  staffId: string;
  date: string;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
  shiftType: 'Regular' | 'Custom' | 'Overtime';
  reason: string;
  customer: string;
  service: string;
  serviceCategory: string;
};

const EVENTS_KEY = 'nexora_staff_schedule_events';
const SHIFTS_KEY = 'nexora_staff_schedule_shifts';
const SWAPS_KEY = 'nexora_staff_shift_swaps';
const HOUR_START = 8;
const HOUR_END = 20;
const MINUTE_RANGE = (HOUR_END - HOUR_START) * 60;
const COLORS = {
  booking: 'border-blue-200 bg-blue-100 text-blue-800',
  break: 'border-gray-200 bg-gray-100 text-gray-600',
  blocked: 'border-red-200 bg-red-100 text-red-800',
  leave: 'border-yellow-200 bg-yellow-100 text-yellow-900',
  overtime: 'border-emerald-200 bg-emerald-100 text-emerald-800',
};

const inputClass = 'w-full rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';
const cardClass = 'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';
const staffColors = ['#b90064', '#2563eb', '#7c3aed', '#059669', '#d97706'];
const services = ['Haircut', 'Beard Styling', 'Hair Coloring', 'Balayage', 'Bridal Makeup', 'Facial', 'Nail Art', 'Spa', 'Keratin Treatment'];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isoDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parseDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const difference = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + difference);
  return next;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function shortDate(date: Date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function timeMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function timeLabel(value: string) {
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function eventTitle(event: ScheduleEvent) {
  if (event.type === 'booking') return event.customer || 'Booking';
  if (event.type === 'break') return 'Break';
  if (event.type === 'blocked') return event.reason || 'Blocked time';
  if (event.type === 'leave') return 'Approved leave';
  return 'Overtime';
}

function eventSubtitle(event: ScheduleEvent) {
  if (event.type === 'booking') return event.service || 'Service';
  if (event.type === 'leave') return event.reason || 'Leave';
  return `${timeLabel(event.start)} – ${timeLabel(event.end)}`;
}

function getDemoStaff(): Staff[] {
  const directory = readJson<any[]>('nexora_staff_directory_demo', []);
  if (directory.length) return directory.slice(0, 8).map((staff, index) => ({ id: staff.id, name: staff.name, role: staff.role || 'Stylist', color: staffColors[index % staffColors.length], phone: staff.phone }));
  const legacy = readJson<any[]>('nexora_staff_list', []);
  if (legacy.length) return legacy.slice(0, 8).map((staff, index) => ({ id: staff.id, name: staff.name, role: staff.role || 'Stylist', color: staffColors[index % staffColors.length], phone: staff.phone }));
  return [
    { id: 'demo-elena', name: 'Elena Rodriguez', role: 'Senior Stylist', color: staffColors[0], phone: '+91 98765 43210' },
    { id: 'demo-marcus', name: 'Marcus Chen', role: 'Master Barber', color: staffColors[1], phone: '+91 98765 43211' },
    { id: 'demo-sanya', name: 'Sanya Rao', role: 'Color Specialist', color: staffColors[2], phone: '+91 98765 43212' },
  ];
}

function demoEvents(staff: Staff[], date: string): ScheduleEvent[] {
  const first = staff[0]?.id || 'demo-elena';
  const second = staff[1]?.id || first;
  const third = staff[2]?.id || second;
  return [
    { id: 'demo-booking-1', type: 'booking', staffId: first, date, start: '09:30', end: '10:45', customer: 'Aarav Mehta', service: 'Balayage', serviceCategory: 'Hair', status: 'Confirmed' },
    { id: 'demo-break-1', type: 'break', staffId: first, date, start: '13:00', end: '14:00', reason: 'Lunch break' },
    { id: 'demo-booking-2', type: 'booking', staffId: first, date, start: '14:00', end: '15:00', customer: 'Nisha Kapoor', service: 'Haircut', serviceCategory: 'Hair', status: 'Confirmed' },
    { id: 'demo-overtime-1', type: 'overtime', staffId: first, date, start: '18:00', end: '19:30', reason: 'Festival rush coverage' },
    { id: 'demo-booking-3', type: 'booking', staffId: second, date, start: '10:00', end: '11:00', customer: 'Riya Sharma', service: 'Beard Styling', serviceCategory: 'Grooming', status: 'Confirmed' },
    { id: 'demo-blocked-1', type: 'blocked', staffId: second, date, start: '12:00', end: '13:00', reason: 'Team meeting' },
    { id: 'demo-booking-4', type: 'booking', staffId: second, date, start: '15:30', end: '16:30', customer: 'Kabir Singh', service: 'Classic Cut', serviceCategory: 'Grooming', status: 'Pending' },
    { id: 'demo-leave-1', type: 'leave', staffId: third, date: isoDate(addDays(parseDate(date), 1)), start: '08:00', end: '20:00', reason: 'Approved personal leave' },
    { id: 'demo-booking-5', type: 'booking', staffId: third, date: isoDate(addDays(parseDate(date), 2)), start: '11:00', end: '12:30', customer: 'Meera Joshi', service: 'Bridal Makeup', serviceCategory: 'Makeup', status: 'Confirmed' },
  ];
}

function getStoredShifts(staff: Staff[], date: string): ShiftBlock[] {
  const stored = readJson<ShiftBlock[]>(SHIFTS_KEY, []);
  if (stored.length) return stored;
  return staff.map((member) => ({ id: `demo-shift-${member.id}`, staffId: member.id, date, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00', type: 'Regular' }));
}

function getStoredSwaps(): SwapRequest[] {
  const stored = readJson<SwapRequest[]>(SWAPS_KEY, []);
  return stored.length ? stored : [
    { id: 'swap-1', staffA: 'Elena Rodriguez', staffB: 'Marcus Chen', date: '14 Aug 2026', shift: '09:00 – 18:00', status: 'Pending' },
    { id: 'swap-2', staffA: 'Sanya Rao', staffB: 'Elena Rodriguez', date: '21 Aug 2026', shift: '10:00 – 19:00', status: 'Pending' },
  ];
}

function normalizeLiveBooking(booking: ShopBooking, staffId: string): ScheduleEvent | null {
  if (!booking.appointmentStart) return null;
  const startDate = new Date(booking.appointmentStart);
  if (Number.isNaN(startDate.getTime())) return null;
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const start = startDate.toTimeString().slice(0, 5);
  const end = endDate.toTimeString().slice(0, 5);
  return { id: `live-${booking.id}`, type: 'booking', staffId, date: isoDate(startDate), start, end, customer: 'Guest', service: booking.serviceNames.join(', ') || 'Booking', serviceCategory: booking.serviceNames[0] || 'Service', status: booking.status || 'Confirmed' };
}

export default function StaffSchedule({ navigate }: NavigationProps) {
  const today = isoDate(new Date());
  const [staff, setStaff] = useState<Staff[]>(getDemoStaff);
  const [events, setEvents] = useState<ScheduleEvent[]>(() => demoEvents(getDemoStaff(), today));
  const [shifts, setShifts] = useState<ShiftBlock[]>(() => getStoredShifts(getDemoStaff(), today));
  const [swaps, setSwaps] = useState<SwapRequest[]>(getStoredSwaps);
  const [view, setView] = useState<CalendarView>('day');
  const [selectedDate, setSelectedDate] = useState(today);
  const [staffFilter, setStaffFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [form, setForm] = useState<FormState>({ staffId: getDemoStaff()[0]?.id || 'demo-elena', date: today, start: '10:00', end: '11:00', breakStart: '13:00', breakEnd: '14:00', shiftType: 'Regular', reason: '', customer: '', service: 'Haircut', serviceCategory: 'Hair' });

  useEffect(() => {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    window.localStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    window.localStorage.setItem(SWAPS_KEY, JSON.stringify(swaps));
  }, [swaps]);

  useEffect(() => {
    let cancelled = false;
    const loadLive = async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (!shop) return;
        const [staffRows, bookingRows] = await Promise.all([listStaff(supabase, shop.id).catch(() => []), fetchMyBookings(supabase, shop.id).catch(() => [])]);
        if (cancelled) return;
        if (staffRows.length) {
          const nextStaff = staffRows.map((row: ShopStaff, index) => ({ id: row.id, name: row.name, role: row.role || 'Stylist', color: staffColors[index % staffColors.length] }));
          setStaff(nextStaff);
          setForm((current) => ({ ...current, staffId: current.staffId || nextStaff[0].id }));
          const liveEvents = (bookingRows as ShopBooking[]).map((booking) => normalizeLiveBooking(booking, nextStaff[0].id)).filter(Boolean) as ScheduleEvent[];
          if (liveEvents.length) setEvents((current) => [...current.filter((event) => !event.id.startsWith('demo-')), ...liveEvents]);
        }
      } finally {
        if (!cancelled) setLiveLoading(false);
      }
    };
    void loadLive();
    return () => { cancelled = true; };
  }, []);

  const visibleStaff = useMemo(() => staff.filter((member) => {
    const matchesFilter = staffFilter === 'all' || member.id === staffFilter;
    const query = search.trim().toLowerCase();
    return matchesFilter && (!query || member.name.toLowerCase().includes(query) || member.role.toLowerCase().includes(query));
  }), [search, staff, staffFilter]);

  const eventMatches = (event: ScheduleEvent) => {
    const staffMatch = staffFilter === 'all' || event.staffId === staffFilter;
    const serviceMatch = serviceFilter === 'all' || event.serviceCategory === serviceFilter || event.service === serviceFilter;
    return staffMatch && serviceMatch;
  };

  const eventsForDate = (date: string) => events.filter((event) => event.date === date && eventMatches(event));
  const selectedWeek = useMemo(() => Array.from({ length: 7 }, (_, index) => isoDate(addDays(startOfWeek(parseDate(selectedDate)), index))), [selectedDate]);
  const monthCells = useMemo(() => {
    const first = parseDate(`${selectedDate.slice(0, 7)}-01`);
    const firstDay = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: Array<string | null> = Array(firstDay).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(isoDate(new Date(first.getFullYear(), first.getMonth(), day)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [selectedDate]);

  const filteredEvents = useMemo(() => events.filter(eventMatches), [events, staffFilter, serviceFilter]);
  const bookingCount = filteredEvents.filter((event) => event.type === 'booking').length;
  const capacityPercent = Math.min(100, Math.round((bookingCount / Math.max(1, visibleStaff.length * 8)) * 100));
  const serviceCategories = Array.from(new Set(events.map((event) => event.serviceCategory).filter(Boolean))) as string[];

  const getShiftFor = (staffId: string, date: string) => shifts.find((shift) => shift.staffId === staffId && shift.date === date) || shifts.find((shift) => shift.staffId === staffId);

  const detectBookingConflict = (candidate: Pick<ScheduleEvent, 'staffId' | 'date' | 'start' | 'end'>) => {
    const start = timeMinutes(candidate.start);
    const end = timeMinutes(candidate.end);
    if (!candidate.start || !candidate.end || end <= start) return 'Enter a valid start and end time.';
    const shift = getShiftFor(candidate.staffId, candidate.date);
    if (shift && (start < timeMinutes(shift.start) || end > timeMinutes(shift.end))) return 'Booking outside working hours.';
    if (shift && shift.breakStart && shift.breakEnd && start < timeMinutes(shift.breakEnd) && end > timeMinutes(shift.breakStart)) return 'Booking during break.';
    const staffEvents = events.filter((event) => event.staffId === candidate.staffId && event.date === candidate.date && event.type !== 'overtime');
    const conflictEvent = staffEvents.find((event) => start < timeMinutes(event.end) && end > timeMinutes(event.start));
    if (conflictEvent) {
      if (conflictEvent.type === 'booking') return 'booking';
      if (conflictEvent.type === 'leave') return 'Booking during approved leave.';
      if (conflictEvent.type === 'blocked') return 'Booking during blocked time.';
      if (conflictEvent.type === 'break') return 'Booking during break.';
    }
    return null;
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const openModal = (type: ModalType) => {
    setConflict(null);
    setForm((current) => ({ ...current, staffId: staffFilter !== 'all' ? staffFilter : staff[0]?.id || current.staffId, date: selectedDate, reason: '', customer: '' }));
    setModal(type);
  };

  const addShift = () => {
    const start = timeMinutes(form.start);
    const end = timeMinutes(form.end);
    const breakStart = timeMinutes(form.breakStart);
    const breakEnd = timeMinutes(form.breakEnd);
    if (end <= start) { setConflict('End time must be after start time.'); return; }
    if (form.breakStart && form.breakEnd && (breakEnd <= breakStart || breakStart < start || breakEnd > end)) { setConflict('Break must be inside working hours.'); return; }
    const nextShift: ShiftBlock = { id: uid('shift'), staffId: form.staffId, date: form.date, start: form.start, end: form.end, breakStart: form.breakStart, breakEnd: form.breakEnd, type: form.shiftType };
    setShifts((current) => [...current.filter((shift) => !(shift.staffId === nextShift.staffId && shift.date === nextShift.date && shift.type === nextShift.type)), nextShift]);
    const generated: ScheduleEvent[] = [];
    if (form.breakStart && form.breakEnd) generated.push({ id: uid('break'), type: 'break', staffId: form.staffId, date: form.date, start: form.breakStart, end: form.breakEnd, reason: 'Scheduled break' });
    if (form.shiftType === 'Overtime') generated.push({ id: uid('overtime'), type: 'overtime', staffId: form.staffId, date: form.date, start: form.start, end: form.end, reason: 'Overtime shift' });
    setEvents((current) => [...current.filter((event) => !(event.staffId === form.staffId && event.date === form.date && (event.type === 'break' || event.type === 'overtime') && event.reason === 'Scheduled break')), ...generated]);
    setModal(null);
    showToast('Shift added to staff calendar');
  };

  const addBlockedTime = () => {
    if (timeMinutes(form.end) <= timeMinutes(form.start)) { setConflict('End time must be after start time.'); return; }
    setEvents((current) => [...current, { id: uid('blocked'), type: 'blocked', staffId: form.staffId, date: form.date, start: form.start, end: form.end, reason: form.reason || 'Blocked time' }]);
    setModal(null);
    showToast('Blocked time added');
  };

  const addBooking = () => {
    if (!form.customer.trim()) { setConflict('Customer name is required.'); return; }
    const result = detectBookingConflict({ staffId: form.staffId, date: form.date, start: form.start, end: form.end });
    if (result) {
      const selectedStaff = staff.find((member) => member.id === form.staffId);
      setConflict(result === 'booking' ? `${selectedStaff?.name || 'This staff member'} already has another booking during this time.` : result);
      return;
    }
    setEvents((current) => [...current, { id: uid('booking'), type: 'booking', staffId: form.staffId, date: form.date, start: form.start, end: form.end, customer: form.customer.trim(), service: form.service, serviceCategory: form.serviceCategory || 'Service', status: 'Confirmed' }]);
    setModal(null);
    showToast('Booking assigned successfully');
  };

  const shiftSwap = (request: SwapRequest, status: 'Approved' | 'Declined') => {
    setSwaps((current) => current.map((item) => item.id === request.id ? { ...item, status } : item));
    showToast(`Shift swap ${status.toLowerCase()}`);
  };

  const shiftByDate = (staffId: string, date: string) => getShiftFor(staffId, date);

  const moveDate = (amount: number) => {
    const base = parseDate(selectedDate);
    const next = view === 'month' ? new Date(base.getFullYear(), base.getMonth() + amount, 1) : addDays(base, view === 'week' ? amount * 7 : amount);
    setSelectedDate(isoDate(next));
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"><button type="button" onClick={() => navigate('staff')} className="rounded-full p-2 text-primary hover:bg-[#fde7f3]" aria-label="Back to staff directory"><ArrowLeft className="h-5 w-5" /></button><div className="text-center"><h1 className="text-lg font-bold tracking-tight text-primary">Staff Schedule</h1><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">NexoraOS · Calendar</p></div><button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-[#fde7f3]" aria-label="More schedule options"><MoreVertical className="h-5 w-5" /></button></div></header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-24 sm:px-6">
        <section className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Team planning</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-on-background">Staff Schedule</h2><p className="mt-1 text-sm text-on-surface-variant">See availability, bookings and protected time in one place.</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setSelectedDate(today)} className="rounded-xl border border-[#e0bec6] bg-white px-3 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-[#fde7f3]">Today</button><button type="button" onClick={() => moveDate(-1)} className="rounded-xl border border-[#e0bec6] bg-white p-2.5 text-on-surface-variant hover:bg-[#fde7f3]" aria-label="Previous date"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => moveDate(1)} className="rounded-xl border border-[#e0bec6] bg-white p-2.5 text-on-surface-variant hover:bg-[#fde7f3]" aria-label="Next date"><ChevronRight className="h-4 w-4" /></button></div></section>

        <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto]"><div className="flex rounded-xl border border-[#e0bec6] bg-white p-1">{(['day', 'week', 'month'] as CalendarView[]).map((item) => <button type="button" key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${view === item ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-[#fde7f3]'}`}>{item}</button>)}</div><label className="relative"><Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className={`${inputClass} pl-10`} /></label><div className="rounded-xl border border-[#e0bec6] bg-white px-3 py-2 text-center text-xs font-bold text-on-surface-variant">{view === 'month' ? monthLabel(parseDate(selectedDate)) : view === 'week' ? `${shortDate(parseDate(selectedWeek[0]))} – ${shortDate(parseDate(selectedWeek[6]))}` : parseDate(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div></section>

        <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff" className={`${inputClass} pl-10`} /></label><div className="relative"><Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><select value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} className={`${inputClass} appearance-none pl-10 pr-9`}><option value="all">All staff members</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div><div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className={`${inputClass} appearance-none pl-10 pr-9`}><option value="all">All service categories</option>{serviceCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></section>

        <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><CapacityCard label="Team capacity" value={`${capacityPercent}%`} detail={`${bookingCount} bookings · ${visibleStaff.length * 8} daily slots`} progress={capacityPercent} /><CapacityCard label="Available staff" value={String(visibleStaff.length)} detail="Based on selected filters" progress={Math.min(100, visibleStaff.length * 25)} /><CapacityCard label="Protected time" value={String(filteredEvents.filter((event) => ['break', 'blocked', 'leave'].includes(event.type)).length)} detail="Breaks, leave & blocks" progress={42} /><CapacityCard label="Live status" value={liveLoading ? 'Syncing' : 'Ready'} detail="Calendar data" progress={liveLoading ? 50 : 100} /></section>

        <section className="mb-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar"><button type="button" onClick={() => openModal('shift')} className="shrink-0 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-sm"><Plus className="mr-1 inline h-4 w-4" /> Add Shift</button><button type="button" onClick={() => openModal('blocked')} className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700"><Ban className="mr-1 inline h-4 w-4" /> Block Time</button><button type="button" onClick={() => openModal('booking')} className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700"><Scissors className="mr-1 inline h-4 w-4" /> Manual Booking Assignment</button></section>

        <section className="mb-4 rounded-2xl border border-[#e0bec6] bg-[#fdf1f6] p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-on-background">Pending Shift Swaps</h2><p className="text-xs text-on-surface-variant">Review requests before schedules change.</p></div><RefreshIcon /></div><div className="hide-scrollbar flex gap-3 overflow-x-auto">{swaps.filter((request) => request.status === 'Pending').map((request) => <div key={request.id} className="min-w-[270px] rounded-xl border border-white bg-white p-3 shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-on-background">{request.staffA} <span className="text-primary">↔</span> {request.staffB}</p><span className="rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-bold text-yellow-800">{request.status}</span></div><p className="mt-2 text-[11px] text-on-surface-variant">{request.date} · {request.shift}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => shiftSwap(request, 'Approved')} className="flex-1 rounded-lg bg-emerald-600 px-2 py-2 text-[11px] font-bold text-white">Approve</button><button type="button" onClick={() => shiftSwap(request, 'Declined')} className="flex-1 rounded-lg border border-[#e0bec6] px-2 py-2 text-[11px] font-bold text-on-surface-variant">Decline</button></div></div>)}{!swaps.some((request) => request.status === 'Pending') && <p className="text-xs font-semibold text-on-surface-variant">No pending shift swap requests.</p>}</div></section>

        {view === 'day' && <DayView date={selectedDate} staff={visibleStaff} events={eventsForDate(selectedDate)} shifts={shifts} onSelectEvent={setSelectedEvent} getShiftFor={getShiftFor} />}
        {view === 'week' && <WeekView dates={selectedWeek} staff={visibleStaff} events={filteredEvents} shifts={shifts} onSelectEvent={setSelectedEvent} getShiftFor={getShiftFor} />}
        {view === 'month' && <MonthView cells={monthCells} staff={visibleStaff} events={filteredEvents} onSelectDate={setSelectedDate} onSelectEvent={setSelectedEvent} />}
      </main>

      <AnimatePresence>{selectedEvent && <EventSheet event={selectedEvent} staff={staff} onClose={() => setSelectedEvent(null)} />}</AnimatePresence>
      <AnimatePresence>{modal && <ScheduleModal modal={modal} staff={staff} form={form} setForm={setForm} conflict={conflict} setConflict={setConflict} onClose={() => setModal(null)} onSubmit={modal === 'shift' ? addShift : modal === 'blocked' ? addBlockedTime : addBooking} />}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl"><Check className="h-4 w-4 text-emerald-300" />{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function getEventPosition(event: ScheduleEvent) {
  const start = Math.max(HOUR_START * 60, timeMinutes(event.start));
  const end = Math.min(HOUR_END * 60, timeMinutes(event.end));
  return { left: ((start - HOUR_START * 60) / MINUTE_RANGE) * 100, width: Math.max(4, ((end - start) / MINUTE_RANGE) * 100) };
}

function DayView({ date, staff, events, shifts, onSelectEvent, getShiftFor }: { date: string; staff: Staff[]; events: ScheduleEvent[]; shifts: ShiftBlock[]; onSelectEvent: (event: ScheduleEvent) => void; getShiftFor: (staffId: string, date: string) => ShiftBlock | undefined }) {
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, index) => HOUR_START + index);
  return <section className="rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]"><div className="border-b border-[#e8e8e8] p-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Day timeline</h2><p className="text-xs text-on-surface-variant">{parseDate(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div><Legend /></div></div><div className="overflow-x-auto hide-scrollbar"><div className="min-w-[820px]"><div className="flex border-b border-[#e8e8e8] bg-[#fdf8f8]"><div className="w-36 shrink-0 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Staff</div><div className="relative h-10 flex-1">{hours.map((hour) => <span key={hour} className="absolute top-3 -translate-x-1/2 text-[10px] font-semibold text-on-surface-variant" style={{ left: `${((hour - HOUR_START) / (HOUR_END - HOUR_START)) * 100}%` }}>{hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'p' : 'a'}</span>)}</div></div>{staff.map((member) => { const shift = getShiftFor(member.id, date); const memberEvents = events.filter((event) => event.staffId === member.id); return <div key={member.id} className="flex border-b border-[#e8e8e8] last:border-b-0"><div className="flex w-36 shrink-0 flex-col justify-center gap-1 px-4 py-4"><span className="truncate text-sm font-bold text-on-background">{member.name}</span><span className="truncate text-[10px] text-on-surface-variant">{member.role}</span><CapacityBar bookingCount={memberEvents.filter((event) => event.type === 'booking').length} /></div><div className="relative min-h-[124px] flex-1 bg-[linear-gradient(to_right,#f0edec_1px,transparent_1px)] bg-[size:8.3333%_100%]"><div className="absolute inset-y-3 rounded-lg bg-emerald-50/30" style={shift ? { left: `${((timeMinutes(shift.start) - HOUR_START * 60) / MINUTE_RANGE) * 100}%`, width: `${((timeMinutes(shift.end) - timeMinutes(shift.start)) / MINUTE_RANGE) * 100}%` } : { left: '8.333%', width: '75%' }} />{memberEvents.map((event) => { const position = getEventPosition(event); return <button type="button" key={event.id} onClick={() => onSelectEvent(event)} className={`absolute z-10 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-sm transition hover:z-20 hover:shadow-md ${COLORS[event.type]}`} style={{ left: `${position.left}%`, width: `${position.width}%`, top: event.type === 'break' ? '72px' : event.type === 'overtime' ? '8px' : '30px', minHeight: event.type === 'leave' ? '82px' : '44px' }}><span className="block truncate text-[11px] font-bold">{eventTitle(event)}</span><span className="block truncate text-[10px] font-semibold opacity-80">{eventSubtitle(event)}</span></button>; })}</div></div>; })}</div></div></section>;
}

function WeekView({ dates, staff, events, shifts, onSelectEvent, getShiftFor }: { dates: string[]; staff: Staff[]; events: ScheduleEvent[]; shifts: ShiftBlock[]; onSelectEvent: (event: ScheduleEvent) => void; getShiftFor: (staffId: string, date: string) => ShiftBlock | undefined }) {
  return <section className="rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]"><div className="border-b border-[#e8e8e8] p-4"><h2 className="text-base font-bold text-on-background">Weekly staff schedule</h2><p className="text-xs text-on-surface-variant">Scroll horizontally to see all working days.</p></div><div className="overflow-x-auto hide-scrollbar"><div className="min-w-[950px]"><div className="grid grid-cols-[160px_repeat(7,minmax(112px,1fr))] border-b border-[#e8e8e8] bg-[#fdf8f8]"><div className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Staff</div>{dates.map((date) => <div key={date} className="border-l border-[#e8e8e8] px-3 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{parseDate(date).toLocaleDateString('en-IN', { weekday: 'short' })}</p><p className="mt-1 text-sm font-bold text-on-background">{parseDate(date).getDate()}</p></div>)}</div>{staff.map((member) => <div key={member.id} className="grid grid-cols-[160px_repeat(7,minmax(112px,1fr))] border-b border-[#e8e8e8] last:border-b-0"><div className="flex flex-col justify-center px-3 py-3"><span className="truncate text-sm font-bold text-on-background">{member.name}</span><span className="truncate text-[10px] text-on-surface-variant">{member.role}</span></div>{dates.map((date) => { const dayEvents = events.filter((event) => event.staffId === member.id && event.date === date); const shift = getShiftFor(member.id, date); return <div key={`${member.id}-${date}`} className="min-h-[108px] border-l border-[#e8e8e8] bg-emerald-50/20 p-2">{shift && <p className="mb-1 text-[10px] font-semibold text-emerald-700">{shift.start}–{shift.end}</p>}{dayEvents.length ? <div className="flex flex-col gap-1">{dayEvents.slice(0, 3).map((event) => <button key={event.id} type="button" onClick={() => onSelectEvent(event)} className={`truncate rounded-md border px-1.5 py-1 text-left text-[10px] font-bold ${COLORS[event.type]}`}>{event.type === 'booking' ? `${event.start} · ${event.customer}` : eventTitle(event)}</button>)}{dayEvents.length > 3 && <span className="text-[10px] font-bold text-on-surface-variant">+{dayEvents.length - 3} more</span>}</div> : <span className="text-[10px] font-semibold text-emerald-700/70">Available</span>}</div>; })}</div>)}</div></div></section>;
}

function MonthView({ cells, staff, events, onSelectDate, onSelectEvent }: { cells: Array<string | null>; staff: Staff[]; events: ScheduleEvent[]; onSelectDate: (date: string) => void; onSelectEvent: (event: ScheduleEvent) => void }) {
  return <section className="rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]"><div className="border-b border-[#e8e8e8] p-4"><h2 className="text-base font-bold text-on-background">Monthly availability</h2><p className="text-xs text-on-surface-variant">Booking, leave and availability indicators.</p></div><div className="overflow-x-auto hide-scrollbar p-3"><div className="min-w-[760px]"><div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day} className="py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-1">{cells.map((date, index) => { const dayEvents = date ? events.filter((event) => event.date === date) : []; const bookingCount = dayEvents.filter((event) => event.type === 'booking').length; const leave = dayEvents.some((event) => event.type === 'leave'); const blocked = dayEvents.some((event) => event.type === 'blocked'); return <button type="button" key={date || `empty-${index}`} disabled={!date} onClick={() => date && onSelectDate(date)} className={`min-h-[100px] rounded-xl border p-2 text-left transition ${date ? 'border-[#e8e8e8] bg-white hover:border-primary hover:bg-[#fdf8f8]' : 'border-transparent bg-transparent'}`}><span className="text-xs font-bold text-on-background">{date ? parseDate(date).getDate() : ''}</span>{date && <><div className="mt-3 flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${bookingCount ? 'bg-blue-500' : 'bg-emerald-500'}`} /><span className="text-[10px] font-semibold text-on-surface-variant">{bookingCount ? `${bookingCount} booking${bookingCount > 1 ? 's' : ''}` : 'Available'}</span></div><div className="mt-2 flex flex-wrap gap-1">{leave && <span className="h-2 w-2 rounded-full bg-yellow-400" title="Leave" />}{blocked && <span className="h-2 w-2 rounded-full bg-red-500" title="Blocked" />}{dayEvents.some((event) => event.type === 'overtime') && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Overtime" />}</div><p className="mt-2 text-[10px] font-semibold text-on-surface-variant">{staff.length} staff</p></>}</button>; })}</div></div></div></section>;
}

function EventSheet({ event, staff, onClose }: { event: ScheduleEvent; staff: Staff[]; onClose: () => void }) {
  const staffMember = staff.find((member) => member.id === event.staffId);
  return <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-black/40" /><motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 z-[70] w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"><div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#e0bec6] sm:hidden" /><div className="flex items-start justify-between gap-3"><div><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${COLORS[event.type]}`}>{event.type}</span><h2 className="mt-2 text-xl font-bold text-on-background">{eventTitle(event)}</h2><p className="mt-1 text-sm text-on-surface-variant">{eventSubtitle(event)}</p></div><button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fdf1f6]"><X className="h-5 w-5" /></button></div><div className="mt-5 flex flex-col gap-3 rounded-xl bg-[#fdf8f8] p-4 text-xs"><p><b>Staff member:</b> {staffMember?.name || 'Staff'}</p><p><b>Date:</b> {parseDate(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><p><b>Time:</b> {timeLabel(event.start)} – {timeLabel(event.end)}</p>{event.customer && <p><b>Customer:</b> {event.customer}</p>}{event.service && <p><b>Service:</b> {event.service}</p>}{event.reason && <p><b>Reason:</b> {event.reason}</p>}</div><button type="button" onClick={onClose} className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white">Done</button></motion.div></>;
}

function ScheduleModal({ modal, staff, form, setForm, conflict, setConflict, onClose, onSubmit }: { modal: Exclude<ModalType, null>; staff: Staff[]; form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; conflict: string | null; setConflict: (value: string | null) => void; onClose: () => void; onSubmit: () => void }) {
  const titles = { shift: 'Add Shift', blocked: 'Block Time', booking: 'Manual Booking Assignment' };
  const isBooking = modal === 'booking';
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"><motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold text-on-background">{titles[modal]}</h2><p className="text-xs text-on-surface-variant">Protect working time and prevent double bookings.</p></div><button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fdf1f6]"><X className="h-5 w-5" /></button></div>{conflict && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"><p className="font-bold">{isBooking && conflict.includes('already') ? 'Booking conflict' : 'Schedule conflict'}</p><p className="mt-1">{isBooking && conflict.includes('already') ? conflict : conflict}</p></div>}<div className="flex flex-col gap-4"><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Staff member<div className="relative"><select value={form.staffId} onChange={(event) => { setConflict(null); setForm((current) => ({ ...current, staffId: event.target.value })); }} className={`${inputClass} appearance-none pr-9`}>{staff.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.role}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></label><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Date<input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className={inputClass} /></label><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Start<input type="time" value={form.start} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} className={inputClass} /></label><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">End<input type="time" value={form.end} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} className={inputClass} /></label></div>{modal === 'shift' && <><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Break start<input type="time" value={form.breakStart} onChange={(event) => setForm((current) => ({ ...current, breakStart: event.target.value }))} className={inputClass} /></label><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Break end<input type="time" value={form.breakEnd} onChange={(event) => setForm((current) => ({ ...current, breakEnd: event.target.value }))} className={inputClass} /></label><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Shift type<div className="relative"><select value={form.shiftType} onChange={(event) => setForm((current) => ({ ...current, shiftType: event.target.value as FormState['shiftType'] }))} className={`${inputClass} appearance-none pr-9`}><option>Regular</option><option>Custom</option><option>Overtime</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></label></div></>}{modal === 'blocked' && <label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Reason<input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Team meeting, maintenance..." className={inputClass} /></label>}{isBooking && <><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Customer name<input value={form.customer} onChange={(event) => { setConflict(null); setForm((current) => ({ ...current, customer: event.target.value })); }} placeholder="Customer name" className={inputClass} /></label><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Service<div className="relative"><select value={form.service} onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))} className={`${inputClass} appearance-none pr-9`}>{services.map((service) => <option key={service}>{service}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></label><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Category<input value={form.serviceCategory} onChange={(event) => setForm((current) => ({ ...current, serviceCategory: event.target.value }))} className={inputClass} /></label></div></>}</div><div className="mt-5 flex gap-2 border-t border-[#e8e8e8] pt-4"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button><button type="button" onClick={onSubmit} className="flex-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white">{modal === 'shift' ? 'Add Shift' : modal === 'blocked' ? 'Block Time' : 'Assign Booking'}</button></div></motion.div></div>;
}

function CapacityCard({ label, value, detail, progress }: { label: string; value: string; detail: string; progress: number }) {
  return <div className="rounded-2xl border border-[#e8e8e8] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-1 text-xl font-black text-on-background">{value}</p><p className="mt-1 truncate text-[10px] text-on-surface-variant">{detail}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ece7e7]"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.min(100, progress))}%` }} /></div></div>;
}

function CapacityBar({ bookingCount }: { bookingCount: number }) {
  return <span className="flex items-center gap-1"><span className="h-1.5 w-14 overflow-hidden rounded-full bg-[#ece7e7]"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, bookingCount * 12.5)}%` }} /></span><span className="text-[9px] font-bold text-on-surface-variant">{bookingCount}/8</span></span>;
}

function Legend() {
  return <div className="flex flex-wrap justify-end gap-2 text-[10px] font-semibold text-on-surface-variant"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />Booking</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-gray-400" />Break</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />Blocked</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-yellow-400" />Leave</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Overtime</span></div>;
}

function RefreshIcon() {
  return <RefreshCw className="h-5 w-5 text-primary" />;
}
