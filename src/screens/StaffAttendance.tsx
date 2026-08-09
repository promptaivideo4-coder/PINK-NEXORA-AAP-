import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  FileSpreadsheet,
  LogIn,
  LogOut,
  MoreVertical,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';
import { fetchMyShop, listStaff, ShopStaff } from '../lib/shopRepository';
import { supabase } from '../lib/supabase';

type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Half Day' | 'Approved Leave';
type ModalType = 'check-in' | 'check-out' | 'edit' | null;

type StaffMember = {
  id: string;
  name: string;
  role: string;
  photo?: string;
};

type AttendanceRecord = {
  id: string;
  staffId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  managerNote: string;
};

type EditForm = {
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  managerNote: string;
};

const RECORDS_KEY = 'nexora_attendance_records';
const TODAY = new Date();
const TODAY_ISO = isoDate(TODAY);
const INPUT_CLASS = 'w-full rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';
const CARD_CLASS = 'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';
const STATUS_STYLES: Record<AttendanceStatus, string> = {
  Present: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Late: 'border-amber-200 bg-amber-50 text-amber-800',
  Absent: 'border-red-200 bg-red-50 text-red-700',
  'Half Day': 'border-blue-200 bg-blue-50 text-blue-700',
  'Approved Leave': 'border-purple-200 bg-purple-50 text-purple-700',
};
const STATUS_DOTS: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-500',
  Late: 'bg-amber-500',
  Absent: 'bg-red-500',
  'Half Day': 'bg-blue-500',
  'Approved Leave': 'bg-purple-500',
};

function isoDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatDate(value: string) {
  const date = parseDate(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMonth(date: Date) {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function minutes(value: string) {
  if (!value) return 0;
  const [hour, minute] = value.split(':').map(Number);
  return (hour * 60) + minute;
}

function hoursBetween(start: string, end: string) {
  if (!start || !end || minutes(end) < minutes(start)) return '—';
  const total = minutes(end) - minutes(start);
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`;
}

function nowTime() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function uid() {
  return `attendance-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getFallbackStaff(): StaffMember[] {
  const directory = readJson<any[]>('nexora_staff_directory_demo', []);
  if (directory.length) return directory.slice(0, 8).map((staff) => ({ id: staff.id, name: staff.name, role: staff.role || 'Stylist', photo: staff.avatar }));
  const legacy = readJson<any[]>('nexora_staff_list', []);
  if (legacy.length) return legacy.slice(0, 8).map((staff) => ({ id: staff.id, name: staff.name, role: staff.role || 'Stylist', photo: staff.avatar }));
  return [
    { id: 'demo-elena', name: 'Elena Rodriguez', role: 'Senior Stylist', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgK4i87T9zaSWtTpAX8ftOSq5DsvdiLIMBIFtrdKRgquoy229sj4FWpkPoFbDtGT0hQkuA7BxlkH7BBMbGJVV2G2P5B8GPGRRsGpdUnXHEXv80SvpFM2Tvtb-Vl0c404jrR3FnqXOIJ8rxqBRAYFwJSWoMuZ_7dleFJcNF4HPqNuvcZOt2UNuCCs1MtCHRYsr-m8nYSAnK7kGo5LODQoilthjYlH0wE-E7gY--ZupoRur1T2oWS4o1' },
    { id: 'demo-marcus', name: 'Marcus Chen', role: 'Master Barber', photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcjDud8ipDaq3L_FuF5pK08jOkmyhGMdjKJQmJLuiF4U7zsZOL45tonoY185_wyzCGro0RCfsu64ENZzYqxYRHr1C1FC0os9uaTZNy5zusD7HiMJbgOJ8XSuzxyXYvpaFyTHgYNrhUrTaZHO2UA5neNkz-JYdQAoyhDwnx6wwkFzMdHJgnq3xn7TdAQcdGuSEuXGXQSqV0H7Gw0XvfXTMV5BYuI-mFKWD80THGvA-w0_79v7eR4yC_' },
    { id: 'demo-sanya', name: 'Sanya Rao', role: 'Color Specialist' },
    { id: 'demo-adi', name: 'Aditi Mehra', role: 'Nail Artist' },
  ];
}

function demoRecords(staff: StaffMember[]): AttendanceRecord[] {
  const previous = isoDate(addDays(TODAY, -1));
  const twoDaysAgo = isoDate(addDays(TODAY, -2));
  return [
    { id: `demo-${staff[0]?.id || 'elena'}-today`, staffId: staff[0]?.id || 'demo-elena', date: TODAY_ISO, checkIn: '09:03', checkOut: '17:45', status: 'Present', managerNote: '' },
    { id: `demo-${staff[1]?.id || 'marcus'}-today`, staffId: staff[1]?.id || 'demo-marcus', date: TODAY_ISO, checkIn: '10:12', checkOut: '', status: 'Late', managerNote: 'Traffic delay reported' },
    { id: `demo-${staff[2]?.id || 'sanya'}-today`, staffId: staff[2]?.id || 'demo-sanya', date: TODAY_ISO, checkIn: '', checkOut: '', status: 'Absent', managerNote: 'No check-in recorded' },
    { id: `demo-${staff[3]?.id || 'adi'}-today`, staffId: staff[3]?.id || 'demo-adi', date: TODAY_ISO, checkIn: '', checkOut: '', status: 'Approved Leave', managerNote: 'Personal leave approved' },
    { id: `demo-${staff[0]?.id || 'elena'}-previous`, staffId: staff[0]?.id || 'demo-elena', date: previous, checkIn: '09:00', checkOut: '18:00', status: 'Present', managerNote: '' },
    { id: `demo-${staff[1]?.id || 'marcus'}-previous`, staffId: staff[1]?.id || 'demo-marcus', date: previous, checkIn: '10:02', checkOut: '14:00', status: 'Half Day', managerNote: 'Left early with manager approval' },
    { id: `demo-${staff[0]?.id || 'elena'}-two-days`, staffId: staff[0]?.id || 'demo-elena', date: twoDaysAgo, checkIn: '09:05', checkOut: '18:10', status: 'Late', managerNote: 'Late arrival recorded' },
  ];
}

function statusLabel(status: AttendanceStatus) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[status]}`}><span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status]}`} />{status}</span>;
}

export default function StaffAttendance({ navigate }: NavigationProps) {
  const [staff, setStaff] = useState<StaffMember[]>(getFallbackStaff);
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const fallback = getFallbackStaff();
    return readJson<AttendanceRecord[]>(RECORDS_KEY, demoRecords(fallback));
  });
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO);
  const [calendarMonth, setCalendarMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [staffFilter, setStaffFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalType>(null);
  const [actionStaffId, setActionStaffId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ checkIn: '', checkOut: '', status: 'Present', managerNote: '' });
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    let cancelled = false;
    const loadLiveStaff = async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (!shop) return;
        const rows = await listStaff(supabase, shop.id);
        if (!cancelled && rows.length) setStaff(rows.map((row: ShopStaff) => ({ id: row.id, name: row.name, role: row.role || 'Stylist' })));
      } catch {
        if (!cancelled && staff.length === 0) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadLiveStaff();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (staff.length) setLoading(false);
  }, [staff.length]);

  const staffById = useMemo(() => new Map(staff.map((member) => [member.id, member])), [staff]);
  const dateRecords = useMemo(() => records.filter((record) => record.date === selectedDate), [records, selectedDate]);
  const visibleStaff = useMemo(() => staff.filter((member) => {
    const matchesFilter = staffFilter === 'all' || member.id === staffFilter;
    const query = search.trim().toLowerCase();
    return matchesFilter && (!query || member.name.toLowerCase().includes(query) || member.role.toLowerCase().includes(query));
  }), [search, staff, staffFilter]);

  const summary = useMemo(() => ({
    present: dateRecords.filter((record) => record.status === 'Present').length,
    late: dateRecords.filter((record) => record.status === 'Late').length,
    absent: dateRecords.filter((record) => record.status === 'Absent').length,
    leave: dateRecords.filter((record) => record.status === 'Approved Leave').length,
  }), [dateRecords]);

  const getRecord = (staffId: string, date = selectedDate) => records.find((record) => record.staffId === staffId && record.date === date);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const openCheckIn = (staffId: string) => {
    setActionStaffId(staffId);
    setError(null);
    setModal('check-in');
  };

  const openCheckOut = (staffId: string) => {
    setActionStaffId(staffId);
    setError(null);
    setModal('check-out');
  };

  const openEditHours = (staffId: string) => {
    const record = getRecord(staffId);
    if (!record) {
      setError('No attendance record found for this staff member today.');
      return;
    }
    setActionStaffId(staffId);
    setEditForm({ checkIn: record.checkIn, checkOut: record.checkOut, status: record.status, managerNote: record.managerNote });
    setError(null);
    setModal('edit');
  };

  const confirmCheckIn = () => {
    if (!actionStaffId) return;
    const existing = getRecord(actionStaffId);
    if (existing?.checkIn) {
      setError('Duplicate check-in is not allowed. This staff member is already checked in.');
      return;
    }
    const current = nowTime();
    setRecords((currentRecords) => {
      const remaining = currentRecords.filter((record) => !(record.staffId === actionStaffId && record.date === selectedDate));
      return [...remaining, { id: existing?.id || uid(), staffId: actionStaffId, date: selectedDate, checkIn: current, checkOut: existing?.checkOut || '', status: existing?.status === 'Approved Leave' ? 'Present' : current > '09:15' ? 'Late' : 'Present', managerNote: existing?.managerNote || 'Manual check-in by manager' }];
    });
    setModal(null);
    showToast('Manual check-in recorded');
  };

  const confirmCheckOut = () => {
    if (!actionStaffId) return;
    const existing = getRecord(actionStaffId);
    if (!existing?.checkIn) {
      setError('Cannot check out before check-in. Record a check-in first.');
      return;
    }
    if (existing.checkOut) {
      setError('Duplicate check-out is not allowed. This staff member is already checked out.');
      return;
    }
    const current = nowTime();
    if (minutes(current) < minutes(existing.checkIn)) {
      setError('Cannot check out before check-in.');
      return;
    }
    setRecords((currentRecords) => currentRecords.map((record) => record.id === existing.id ? { ...record, checkOut: current, managerNote: record.managerNote || 'Manual check-out by manager' } : record));
    setModal(null);
    showToast('Manual check-out recorded');
  };

  const saveEditedHours = () => {
    if (!actionStaffId) return;
    if (!editForm.managerNote.trim()) {
      setError('A reason is required when editing attendance hours.');
      return;
    }
    if (editForm.checkIn && editForm.checkOut && minutes(editForm.checkOut) < minutes(editForm.checkIn)) {
      setError('Check-out cannot be before check-in.');
      return;
    }
    const existing = getRecord(actionStaffId);
    if (!existing) {
      setError('No attendance record found to edit.');
      return;
    }
    setRecords((currentRecords) => currentRecords.map((record) => record.id === existing.id ? { ...record, checkIn: editForm.checkIn, checkOut: editForm.checkOut, status: editForm.status, managerNote: editForm.managerNote.trim() } : record));
    setModal(null);
    showToast('Attendance hours updated');
  };

  const selectDay = (date: string) => {
    setSelectedDate(date);
    setSelectedDay(date);
  };

  const exportCsv = () => {
    const rows = [['Date', 'Staff Member', 'Check-in', 'Check-out', 'Total Hours', 'Status', 'Manager Note']];
    records.forEach((record) => rows.push([record.date, staffById.get(record.staffId)?.name || 'Staff', record.checkIn || '', record.checkOut || '', hoursBetween(record.checkIn, record.checkOut), record.status, record.managerNote]));
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nexora-attendance.csv';
    link.click();
    URL.revokeObjectURL(url);
    setExported(true);
    showToast('Attendance CSV downloaded');
  };

  const monthCells = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const offset = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const count = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const cells: Array<string | null> = Array(offset).fill(null);
    for (let day = 1; day <= count; day += 1) cells.push(isoDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth]);

  const dayDetails = selectedDay ? records.filter((record) => record.date === selectedDay) : [];

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6"><button type="button" onClick={() => navigate('staff')} className="rounded-full p-2 text-primary hover:bg-[#fde7f3]" aria-label="Back to staff directory"><ArrowLeft className="h-5 w-5" /></button><div className="text-center"><h1 className="text-lg font-bold tracking-tight text-primary">Attendance</h1><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">NexoraOS · Staff Management</p></div><button type="button" onClick={exportCsv} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fde7f3]" aria-label="Download attendance CSV"><Download className="h-5 w-5" /></button></div></header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-24 sm:px-6">
        <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Daily operations</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-on-background">Attendance</h2><p className="mt-1 text-sm text-on-surface-variant">{formatDate(selectedDate)} · record attendance and correct hours.</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => { setSelectedDate(TODAY_ISO); setCalendarMonth(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)); }} className="rounded-xl border border-[#e0bec6] bg-white px-3 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-[#fde7f3]">Today</button><label className="relative"><Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className={`${INPUT_CLASS} w-auto pl-9`} /></label></div></section>

        {loadError && <section className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" /><div className="flex-1"><b>Unable to load attendance. Try again.</b><p className="mt-1 text-xs">Your saved local attendance records are still safe.</p></div><button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-white px-3 py-2 text-xs font-bold">Retry</button></section>}

        <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><SummaryCard label="Present Today" value={summary.present} tone="emerald" icon={<CheckCircle2 className="h-5 w-5" />} /><SummaryCard label="Late Arrivals" value={summary.late} tone="amber" icon={<Clock className="h-5 w-5" />} /><SummaryCard label="Absent" value={summary.absent} tone="red" icon={<UserX className="h-5 w-5" />} /><SummaryCard label="On Leave" value={summary.leave} tone="purple" icon={<CalendarDays className="h-5 w-5" />} /></section>

        <section className="mb-4 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff" className={`${INPUT_CLASS} pl-10`} /></label><div className="relative sm:w-64"><UserCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><select value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} className={`${INPUT_CLASS} appearance-none pl-10 pr-9`}><option value="all">All staff members</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></section>

        <section className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Live Attendance List</h2><p className="text-xs text-on-surface-variant">Manager controls update today’s record instantly.</p></div><button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-[#e0bec6] bg-white px-3 py-2.5 text-xs font-bold text-primary hover:bg-[#fde7f3]"><Download className="h-4 w-4" /> Download CSV</button></section>

        {exported && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700"><FileSpreadsheet className="h-4 w-4" /> Attendance CSV exported successfully.</div>}

        {loading ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><LoadingCard /><LoadingCard /></div> : visibleStaff.length === 0 ? <section className={`${CARD_CLASS} py-14 text-center`}><UserX className="mx-auto mb-3 h-10 w-10 text-on-surface-variant/50" /><h2 className="text-base font-bold text-on-background">No attendance records found.</h2><p className="mt-1 text-xs text-on-surface-variant">Try another staff filter or date.</p></section> : <section className="grid grid-cols-1 gap-3 md:grid-cols-2">{visibleStaff.map((member) => { const record = getRecord(member.id); return <AttendanceCard key={member.id} staff={member} record={record} onCheckIn={() => openCheckIn(member.id)} onCheckOut={() => openCheckOut(member.id)} onEdit={() => openEditHours(member.id)} />; })}</section>}

        <section className="mt-6"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Monthly Attendance</h2><p className="text-xs text-on-surface-variant">Tap any date for staff-by-staff details.</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="rounded-lg p-2 text-on-surface-variant hover:bg-[#fde7f3]" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-28 text-center text-xs font-bold text-on-background">{formatMonth(calendarMonth)}</span><button type="button" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="rounded-lg p-2 text-on-surface-variant hover:bg-[#fde7f3]" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button></div></div><AttendanceCalendar cells={monthCells} records={records} staffById={staffById} onSelectDay={selectDay} /></section>
      </main>

      <AnimatePresence>{modal && <AttendanceModal type={modal} staff={staff} staffId={actionStaffId} record={actionStaffId ? getRecord(actionStaffId) : undefined} editForm={editForm} setEditForm={setEditForm} error={error} setError={setError} onClose={() => { setModal(null); setError(null); }} onConfirm={modal === 'check-in' ? confirmCheckIn : modal === 'check-out' ? confirmCheckOut : saveEditedHours} />}</AnimatePresence>
      <AnimatePresence>{selectedDay && <DayDetailSheet date={selectedDay} records={dayDetails} staffById={staffById} onClose={() => setSelectedDay(null)} />}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl"><Check className="h-4 w-4 text-emerald-300" />{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function SummaryCard({ label, value, tone, icon }: { label: string; value: number; tone: 'emerald' | 'amber' | 'red' | 'purple'; icon: React.ReactNode }) {
  const toneClass = tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-purple-50 text-purple-700';
  return <div className={CARD_CLASS}><span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>{icon}</span><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-1 text-2xl font-black text-on-background">{value}</p></div>;
}

function AttendanceCard({ staff, record, onCheckIn, onCheckOut, onEdit }: { staff: StaffMember; record?: AttendanceRecord; onCheckIn: () => void; onCheckOut: () => void; onEdit: () => void }) {
  const status = record?.status || 'Absent';
  return <article className={`${CARD_CLASS} relative overflow-hidden`}><div className={`absolute inset-y-0 left-0 w-1 ${STATUS_DOTS[status]}`} /><div className="flex items-start gap-3 pl-1"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#fde7f3] shadow-sm">{staff.photo ? <img src={staff.photo} alt={staff.name} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">{staff.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="truncate text-sm font-bold text-on-background">{staff.name}</h3><p className="text-[11px] text-on-surface-variant">{staff.role}</p></div>{statusLabel(status)}</div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#e8e8e8] pt-3"><AttendanceMetric label="Check-in" value={record?.checkIn ? time12(record.checkIn) : '—'} /><AttendanceMetric label="Check-out" value={record?.checkOut ? time12(record.checkOut) : '—'} /><AttendanceMetric label="Worked" value={hoursBetween(record?.checkIn || '', record?.checkOut || '')} /></div></div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8e8e8] pt-3"><button type="button" onClick={onCheckIn} disabled={Boolean(record?.checkIn)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#fde7f3] px-2 py-2 text-[11px] font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40"><LogIn className="h-3.5 w-3.5" /> Manual Check-In</button><button type="button" onClick={onCheckOut} disabled={!record?.checkIn || Boolean(record?.checkOut)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f7f2f2] px-2 py-2 text-[11px] font-bold text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"><LogOut className="h-3.5 w-3.5" /> Check-Out</button><button type="button" onClick={onEdit} disabled={!record} className="rounded-lg border border-[#e0bec6] px-3 py-2 text-[11px] font-bold text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40"><Edit3 className="mr-1 inline h-3.5 w-3.5" /> Edit Hours</button></div>{record?.managerNote && <p className="mt-3 rounded-lg bg-[#fdf8f8] px-3 py-2 text-[11px] text-on-surface-variant"><b>Manager note:</b> {record.managerNote}</p>}</article>;
}

function AttendanceMetric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-1 text-xs font-bold text-on-background">{value}</p></div>;
}

function time12(value: string) {
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function AttendanceCalendar({ cells, records, staffById, onSelectDay }: { cells: Array<string | null>; records: AttendanceRecord[]; staffById: Map<string, StaffMember>; onSelectDay: (date: string) => void }) {
  return <div className={`${CARD_CLASS} overflow-hidden`}><div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day} className="py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-1">{cells.map((date, index) => { const dayRecords = date ? records.filter((record) => record.date === date) : []; const statuses = Array.from(new Set(dayRecords.map((record) => record.status))); return <button type="button" key={date || `empty-${index}`} disabled={!date} onClick={() => date && onSelectDay(date)} className={`min-h-[78px] rounded-xl border p-2 text-left transition ${date ? 'border-[#e8e8e8] bg-white hover:border-primary hover:bg-[#fdf8f8]' : 'border-transparent bg-transparent'}`}><span className="text-xs font-bold text-on-background">{date ? parseDate(date).getDate() : ''}</span>{date && <><div className="mt-2 flex flex-wrap gap-1">{statuses.map((status) => <span key={status} className={`h-2 w-2 rounded-full ${STATUS_DOTS[status]}`} title={status} />)}</div><p className="mt-2 truncate text-[10px] font-semibold text-on-surface-variant">{dayRecords.length ? `${dayRecords.length} record${dayRecords.length > 1 ? 's' : ''}` : 'No record'}</p></>}</button>; })}</div><div className="mt-4 flex flex-wrap gap-3 border-t border-[#e8e8e8] pt-3 text-[10px] font-semibold text-on-surface-variant">{(['Present', 'Late', 'Absent', 'Half Day', 'Approved Leave'] as AttendanceStatus[]).map((status) => <span key={status}><i className={`mr-1 inline-block h-2 w-2 rounded-full ${STATUS_DOTS[status]}`} />{status}</span>)}</div></div>;
}

function AttendanceModal({ type, staff, staffId, record, editForm, setEditForm, error, setError, onClose, onConfirm }: { type: Exclude<ModalType, null>; staff: StaffMember[]; staffId: string | null; record?: AttendanceRecord; editForm: EditForm; setEditForm: React.Dispatch<React.SetStateAction<EditForm>>; error: string | null; setError: (value: string | null) => void; onClose: () => void; onConfirm: () => void }) {
  const member = staff.find((item) => item.id === staffId);
  const current = nowTime();
  const isEdit = type === 'edit';
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"><motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"><div className="mb-5 flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Manager action</span><h2 className="mt-1 text-lg font-bold text-on-background">{type === 'check-in' ? 'Manual Check-In' : type === 'check-out' ? 'Manual Check-Out' : 'Edit Hours'}</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fdf1f6]"><X className="h-5 w-5" /></button></div>{error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"><AlertCircle className="mr-1 inline h-4 w-4" />{error}</div>}{type === 'check-in' && <div className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] p-4"><p className="text-xs text-on-surface-variant">Confirm attendance for</p><p className="mt-1 text-base font-bold text-on-background">{member?.name}</p><div className="mt-3 grid grid-cols-2 gap-3"><AttendanceMetric label="Current date" value={formatDate(TODAY_ISO)} /><AttendanceMetric label="Current time" value={time12(current)} /></div></div>}{type === 'check-out' && <div className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] p-4"><p className="text-xs font-bold text-on-surface-variant">{member?.name}</p><div className="mt-3 grid grid-cols-3 gap-2"><AttendanceMetric label="Check-in" value={record?.checkIn ? time12(record.checkIn) : '—'} /><AttendanceMetric label="Check-out" value={time12(current)} /><AttendanceMetric label="Total hours" value={record?.checkIn ? hoursBetween(record.checkIn, current) : '—'} /></div></div>}{isEdit && <div className="flex flex-col gap-4"><div className="grid grid-cols-2 gap-3"><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Check-in<input type="time" value={editForm.checkIn} onChange={(event) => { setError(null); setEditForm((current) => ({ ...current, checkIn: event.target.value })); }} className={INPUT_CLASS} /></label><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Check-out<input type="time" value={editForm.checkOut} onChange={(event) => { setError(null); setEditForm((current) => ({ ...current, checkOut: event.target.value })); }} className={INPUT_CLASS} /></label></div><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Status<select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as AttendanceStatus }))} className={`${INPUT_CLASS} appearance-none`}><option>Present</option><option>Late</option><option>Absent</option><option>Half Day</option><option>Approved Leave</option></select></label><label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">Reason / manager note *<textarea value={editForm.managerNote} onChange={(event) => { setError(null); setEditForm((current) => ({ ...current, managerNote: event.target.value })); }} rows={3} placeholder="Why are these hours being corrected?" className={INPUT_CLASS} /></label><div className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] p-3 text-xs text-on-surface-variant">Automatically calculated total: <b className="text-on-background">{hoursBetween(editForm.checkIn, editForm.checkOut)}</b></div></div>}{!isEdit && <p className="mt-4 text-xs leading-5 text-on-surface-variant">This manager action will be recorded with the current date and time. Duplicate check-ins and check-outs are blocked.</p>}<div className="mt-5 flex gap-2 border-t border-[#e8e8e8] pt-4"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button><button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white">{type === 'check-in' ? 'Confirm Check-In' : type === 'check-out' ? 'Confirm Check-Out' : 'Save Hours'}</button></div></motion.div></div>;
}

function DayDetailSheet({ date, records, staffById, onClose }: { date: string; records: AttendanceRecord[]; staffById: Map<string, StaffMember>; onClose: () => void }) {
  return <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-black/40" /><motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 z-[70] max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"><div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#e0bec6] sm:hidden" /><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Attendance detail</span><h2 className="mt-1 text-xl font-bold text-on-background">{formatDate(date)}</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fdf1f6]"><X className="h-5 w-5" /></button></div>{records.length === 0 ? <div className="py-12 text-center"><CalendarDays className="mx-auto mb-3 h-9 w-9 text-on-surface-variant/50" /><h3 className="text-sm font-bold text-on-background">No attendance records found.</h3><p className="mt-1 text-xs text-on-surface-variant">No check-in or leave record exists for this date.</p></div> : <div className="mt-5 flex flex-col gap-3">{records.map((record) => { const member = staffById.get(record.staffId); return <div key={record.id} className="rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-4"><div className="flex items-center justify-between gap-2"><div><p className="text-sm font-bold text-on-background">{member?.name || 'Staff member'}</p><p className="text-[11px] text-on-surface-variant">{member?.role || 'Team member'}</p></div>{statusLabel(record.status)}</div><div className="mt-3 grid grid-cols-3 gap-3"><AttendanceMetric label="Check-in" value={record.checkIn ? time12(record.checkIn) : '—'} /><AttendanceMetric label="Check-out" value={record.checkOut ? time12(record.checkOut) : '—'} /><AttendanceMetric label="Total hours" value={hoursBetween(record.checkIn, record.checkOut)} /></div><p className="mt-3 rounded-lg bg-white px-3 py-2 text-[11px] text-on-surface-variant"><b>Manager note:</b> {record.managerNote || 'No manager note'}</p></div>; })}</div>}<button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white">Done</button></motion.div></>;
}

function LoadingCard() {
  return <div className="h-64 animate-pulse rounded-2xl border border-[#e8e8e8] bg-white p-5"><div className="flex gap-3"><div className="h-12 w-12 rounded-full bg-[#ece7e7]" /><div className="flex-1"><div className="h-4 w-2/3 rounded bg-[#ece7e7]" /><div className="mt-2 h-3 w-1/2 rounded bg-[#ece7e7]" /></div></div><div className="mt-8 grid grid-cols-3 gap-2"><div className="h-10 rounded bg-[#ece7e7]" /><div className="h-10 rounded bg-[#ece7e7]" /><div className="h-10 rounded bg-[#ece7e7]" /></div></div>;
}
