import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Info,
  MoreVertical,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';

 type RequestStatus = 'Pending' | 'Approved' | 'Rejected';
type TabId = 'pending' | 'approved' | 'rejected' | 'calendar';
type LeaveType = 'Casual' | 'Sick' | 'Emergency' | 'Personal' | 'Other';
type Request = LeaveRequest | ShiftSwapRequest;

type Staff = { id: string; name: string; role: string; photo?: string };
type LeaveRequest = {
  id: string;
  kind: 'leave';
  staffId: string;
  staffName: string;
  staffPhoto?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  requestDate: string;
  status: RequestStatus;
  rejectionReason?: string;
};
type ShiftSwapRequest = {
  id: string;
  kind: 'swap';
  requestingStaffId: string;
  requestingStaff: string;
  replacementStaffId: string;
  replacementStaff: string;
  date: string;
  originalShift: string;
  requestedShift: string;
  reason: string;
  status: RequestStatus;
  rejectionReason?: string;
};
type ShiftBlock = { id: string; staffId: string; date: string; start: string; end: string; breakStart?: string; breakEnd?: string; type?: string };
type ScheduleEvent = { id: string; type: string; staffId: string; date: string; start: string; end: string; customer?: string; service?: string; reason?: string };

const LEAVE_KEY = 'nexora_staff_leave_requests';
const SWAP_KEY = 'nexora_staff_shift_swaps';
const SCHEDULE_KEY = 'nexora_staff_schedule_shifts';
const EVENTS_KEY = 'nexora_staff_schedule_events';
const AUDIT_KEY = 'nexora_staff_audit_log';
const AVAILABILITY_KEY = 'nexora_staff_availability_overrides';
const PUBLIC_SLOTS_KEY = 'nexora_public_booking_slots';
const CARD_CLASS = 'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';
const INPUT_CLASS = 'w-full rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';
const AVATAR_FALLBACK = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgK4i87T9zaSWtTpAX8ftOSq5DsvdiLIMBIFtrdKRgquoy229sj4FWpkPoFbDtGT0hQkuA7BxlkH7BBMbGJVV2G2P5B8GPGRRsGpdUnXHEXv80SvpFM2Tvtb-Vl0c404jrR3FnqXOIJ8rxqBRAYFwJSWoMuZ_7dleFJcNF4HPqNuvcZOt2UNuCCs1MtCHRYsr-m8nYSAnK7kGo5LODQoilthjYlH0wE-E7gY--ZupoRur1T2oWS4o1';

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
  return new Date(`${value}T12:00:00`);
}

function formatDate(value: string) {
  const date = parseDate(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function dateRange(start: string, end: string) {
  const result: string[] = [];
  let cursor = parseDate(start);
  const last = parseDate(end);
  while (cursor <= last && result.length < 90) {
    result.push(isoDate(cursor));
    cursor = addDays(cursor, 1);
  }
  return result;
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.floor((parseDate(end).getTime() - parseDate(start).getTime()) / 86400000) + 1);
}

function minutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return (hour * 60) + minute;
}

function parseShift(value: string) {
  const matches = value.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  return matches ? { start: matches[1], end: matches[2] } : { start: '09:00', end: '18:00' };
}

function fallbackStaff(): Staff[] {
  const directory = readJson<any[]>('nexora_staff_directory_demo', []);
  if (directory.length) return directory.slice(0, 8).map((staff) => ({ id: staff.id, name: staff.name, role: staff.role || 'Stylist', photo: staff.avatar }));
  const legacy = readJson<any[]>('nexora_staff_list', []);
  if (legacy.length) return legacy.slice(0, 8).map((staff) => ({ id: staff.id, name: staff.name, role: staff.role || 'Stylist', photo: staff.avatar }));
  return [
    { id: 'demo-elena', name: 'Elena Rodriguez', role: 'Senior Stylist', photo: AVATAR_FALLBACK },
    { id: 'demo-marcus', name: 'Marcus Chen', role: 'Master Barber' },
    { id: 'demo-sanya', name: 'Sanya Rao', role: 'Color Specialist' },
    { id: 'demo-adi', name: 'Aditi Mehra', role: 'Nail Artist' },
  ];
}

function demoLeaves(staff: Staff[]): LeaveRequest[] {
  const today = new Date();
  const first: Staff = staff[0] || { id: 'demo-elena', name: 'Elena Rodriguez', role: 'Senior Stylist' };
  const second: Staff = staff[1] || { id: 'demo-marcus', name: 'Marcus Chen', role: 'Master Barber' };
  const third: Staff = staff[2] || { id: 'demo-sanya', name: 'Sanya Rao', role: 'Color Specialist' };
  const pendingStart = isoDate(addDays(today, 5));
  const pendingEnd = isoDate(addDays(today, 6));
  const approvedStart = isoDate(addDays(today, 12));
  const approvedEnd = isoDate(addDays(today, 13));
  return [
    { id: 'leave-demo-1', kind: 'leave', staffId: first.id, staffName: first.name, staffPhoto: first.photo, leaveType: 'Casual', startDate: pendingStart, endDate: pendingEnd, totalDays: 2, reason: 'Family function outside Jaipur', requestDate: isoDate(addDays(today, -1)), status: 'Pending' },
    { id: 'leave-demo-2', kind: 'leave', staffId: second.id, staffName: second.name, staffPhoto: second.photo, leaveType: 'Sick', startDate: approvedStart, endDate: approvedEnd, totalDays: 2, reason: 'Medical rest recommended', requestDate: isoDate(addDays(today, -4)), status: 'Approved' },
    { id: 'leave-demo-3', kind: 'leave', staffId: third.id, staffName: third.name, staffPhoto: third.photo, leaveType: 'Personal', startDate: isoDate(addDays(today, -9)), endDate: isoDate(addDays(today, -8)), totalDays: 2, reason: 'Personal appointment', requestDate: isoDate(addDays(today, -12)), status: 'Rejected', rejectionReason: 'Peak weekend coverage already full.' },
  ];
}

function demoSwaps(staff: Staff[]): ShiftSwapRequest[] {
  const today = new Date();
  const first = staff[0] || { id: 'demo-elena', name: 'Elena Rodriguez' };
  const second = staff[1] || { id: 'demo-marcus', name: 'Marcus Chen' };
  const third = staff[2] || { id: 'demo-sanya', name: 'Sanya Rao' };
  return [
    { id: 'swap-demo-1', kind: 'swap', requestingStaffId: second.id, requestingStaff: second.name, replacementStaffId: first.id, replacementStaff: first.name, date: isoDate(addDays(today, 8)), originalShift: '10:00 – 19:00', requestedShift: '09:00 – 18:00', reason: 'Doctor appointment in the morning', status: 'Pending' },
    { id: 'swap-demo-2', kind: 'swap', requestingStaffId: third.id, requestingStaff: third.name, replacementStaffId: second.id, replacementStaff: second.name, date: isoDate(addDays(today, 14)), originalShift: '09:00 – 17:00', requestedShift: '10:00 – 19:00', reason: 'Family commitment', status: 'Pending' },
  ];
}

function statusClass(status: RequestStatus) {
  if (status === 'Approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Rejected') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function photoOrInitials(staff: { name: string; photo?: string }) {
  return staff.photo ? <img src={staff.photo} alt={staff.name} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">{staff.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>;
}

export default function LeaveShiftSwap({ navigate }: NavigationProps) {
  const staff = useMemo(() => fallbackStaff(), []);
  const staffById = useMemo(() => new Map(staff.map((member) => [member.id, member])), [staff]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    const stored = readJson<LeaveRequest[]>(LEAVE_KEY, []);
    return stored.length ? stored : demoLeaves(fallbackStaff());
  });
  const [swaps, setSwaps] = useState<ShiftSwapRequest[]>(() => {
    const stored = readJson<ShiftSwapRequest[]>(SWAP_KEY, []);
    return stored.length ? stored.map((item) => ({ ...item, kind: 'swap' as const, status: item.status === 'Approved' ? 'Approved' : item.status === 'Rejected' || (item as any).status === 'Declined' ? 'Rejected' : 'Pending' })) : demoSwaps(fallbackStaff());
  });
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [rejectionRequest, setRejectionRequest] = useState<LeaveRequest | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [conflict, setConflict] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const pendingCount = leaves.filter((request) => request.status === 'Pending').length + swaps.filter((request) => request.status === 'Pending').length;
  const filteredRequests = useMemo<Request[]>(() => {
    if (activeTab === 'pending') return [...leaves.filter((request) => request.status === 'Pending'), ...swaps.filter((request) => request.status === 'Pending')];
    if (activeTab === 'approved') return [...leaves.filter((request) => request.status === 'Approved'), ...swaps.filter((request) => request.status === 'Approved')];
    return [...leaves.filter((request) => request.status === 'Rejected'), ...swaps.filter((request) => request.status === 'Rejected')];
  }, [activeTab, leaves, swaps]);

  const approvedLeaves = leaves.filter((request) => request.status === 'Approved');
  const calendarCells = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const offset = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const count = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const cells: Array<string | null> = Array(offset).fill(null);
    for (let day = 1; day <= count; day += 1) cells.push(isoDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth]);

  const selectedDayLeaves = selectedCalendarDate ? approvedLeaves.filter((request) => dateRange(request.startDate, request.endDate).includes(selectedCalendarDate)) : [];

  const persist = (nextLeaves: LeaveRequest[], nextSwaps: ShiftSwapRequest[]) => {
    window.localStorage.setItem(LEAVE_KEY, JSON.stringify(nextLeaves));
    window.localStorage.setItem(SWAP_KEY, JSON.stringify(nextSwaps));
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const appendAudit = (staffId: string, action: string, before?: string, after?: string) => {
    const all = readJson<Record<string, any[]>>(AUDIT_KEY, {});
    all[staffId] = [{ id: uid('audit'), action, timestamp: new Date().toISOString(), changedBy: 'You', before, after }, ...(all[staffId] || [])];
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(all));
  };

  const applyApprovedLeave = (request: LeaveRequest) => {
    const dates = dateRange(request.startDate, request.endDate);
    const events = readJson<ScheduleEvent[]> (EVENTS_KEY, []);
    const nextEvents = events.filter((event) => !(event.staffId === request.staffId && dates.includes(event.date) && event.type === 'leave'));
    dates.forEach((date) => nextEvents.push({ id: `leave-${request.id}-${date}`, type: 'leave', staffId: request.staffId, date, start: '08:00', end: '20:00', reason: `${request.leaveType} leave` }));
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(nextEvents));

    const overrides = readJson<Record<string, any>>(AVAILABILITY_KEY, {});
    overrides[request.staffId] = [...new Set([...(overrides[request.staffId] || []), ...dates])];
    window.localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(overrides));

    const publicSlots = readJson<any[]>(PUBLIC_SLOTS_KEY, []);
    window.localStorage.setItem(PUBLIC_SLOTS_KEY, JSON.stringify(publicSlots.filter((slot) => !(slot.staffId === request.staffId && dates.includes(slot.date)))));
  };

  const approveLeave = (request: LeaveRequest) => {
    setLoadingAction(request.id);
    const nextLeaves = leaves.map((item) => item.id === request.id ? { ...item, status: 'Approved' as const } : item);
    setLeaves(nextLeaves);
    persist(nextLeaves, swaps);
    applyApprovedLeave(request);
    appendAudit(request.staffId, 'Leave approved', `${request.leaveType} · ${request.startDate}–${request.endDate}`, 'Approved · staff unavailable and public slots removed');
    setLoadingAction(null);
    showToast(`${request.staffName}'s leave approved`);
  };

  const rejectLeave = () => {
    if (!rejectionRequest || !rejectionNote.trim()) return;
    const nextLeaves = leaves.map((item) => item.id === rejectionRequest.id ? { ...item, status: 'Rejected' as const, rejectionReason: rejectionNote.trim() } : item);
    setLeaves(nextLeaves);
    persist(nextLeaves, swaps);
    appendAudit(rejectionRequest.staffId, 'Leave rejected', rejectionRequest.reason, rejectionNote.trim());
    setRejectionRequest(null);
    setRejectionNote('');
    showToast('Leave request rejected');
  };

  const validateSwap = (request: ShiftSwapRequest) => {
    const requested = parseShift(request.requestedShift);
    const original = parseShift(request.originalShift);
    const dates = dateRange(request.date, request.date);
    const approvedLeave = leaves.some((leave) => leave.status === 'Approved' && leave.staffId === request.replacementStaffId && dateRange(leave.startDate, leave.endDate).some((date) => dates.includes(date)));
    const events = readJson<ScheduleEvent[]>(EVENTS_KEY, []);
    const replacementEvents = events.filter((event) => event.staffId === request.replacementStaffId && event.date === request.date);
    const replacementBookings = replacementEvents.some((event) => event.type === 'booking' && minutes(requested.start) < minutes(event.end) && minutes(requested.end) > minutes(event.start));
    const protectedTime = replacementEvents.some((event) => ['blocked', 'leave'].includes(event.type) && minutes(requested.start) < minutes(event.end) && minutes(requested.end) > minutes(event.start));
    const shifts = readJson<ShiftBlock[]>(SCHEDULE_KEY, []);
    const replacementShifts = shifts.filter((shift) => shift.staffId === request.replacementStaffId && shift.date === request.date);
    const conflictingShift = replacementShifts.some((shift) => !(shift.start === requested.start && shift.end === requested.end) && minutes(requested.start) < minutes(shift.end) && minutes(requested.end) > minutes(shift.start));
    const workingHours = replacementShifts.find((shift) => shift.start === requested.start && shift.end === requested.end) || replacementShifts[0];
    const outsideWorkingHours = workingHours ? (minutes(requested.start) < minutes(workingHours.start) || minutes(requested.end) > minutes(workingHours.end)) : (minutes(requested.start) < 9 * 60 || minutes(requested.end) > 18 * 60);
    const requestingBooking = events.some((event) => event.staffId === request.requestingStaffId && event.date === request.date && event.type === 'booking' && minutes(original.start) < minutes(event.end) && minutes(original.end) > minutes(event.start));

    if (approvedLeave || replacementBookings || protectedTime || conflictingShift || outsideWorkingHours || requestingBooking) return 'Shift swap cannot be approved because the selected staff member is unavailable.';
    return null;
  };

  const approveSwap = (request: ShiftSwapRequest) => {
    setConflict(null);
    const issue = validateSwap(request);
    if (issue) {
      setConflict(issue);
      return;
    }
    setLoadingAction(request.id);
    const nextSwaps = swaps.map((item) => item.id === request.id ? { ...item, status: 'Approved' as const } : item);
    setSwaps(nextSwaps);
    persist(leaves, nextSwaps);
    applySwapToSchedule(request);
    appendAudit(request.requestingStaffId, 'Shift swapped', `${request.requestingStaff} · ${request.originalShift}`, `${request.replacementStaff} · ${request.requestedShift}`);
    appendAudit(request.replacementStaffId, 'Shift swapped', `${request.replacementStaff} · ${request.requestedShift}`, `${request.requestingStaff} · ${request.originalShift}`);
    setLoadingAction(null);
    showToast('Shift swap approved and schedules updated');
  };

  const applySwapToSchedule = (request: ShiftSwapRequest) => {
    const original = parseShift(request.originalShift);
    const requested = parseShift(request.requestedShift);
    const shifts = readJson<ShiftBlock[]>(SCHEDULE_KEY, []);
    const nextShifts = shifts.filter((shift) => !((shift.date === request.date && shift.staffId === request.requestingStaffId && shift.start === original.start && shift.end === original.end) || (shift.date === request.date && shift.staffId === request.replacementStaffId && shift.start === requested.start && shift.end === requested.end)));
    nextShifts.push({ id: uid('swap-shift'), staffId: request.requestingStaffId, date: request.date, start: requested.start, end: requested.end, breakStart: '13:00', breakEnd: '14:00', type: 'Custom' });
    nextShifts.push({ id: uid('swap-shift'), staffId: request.replacementStaffId, date: request.date, start: original.start, end: original.end, breakStart: '13:00', breakEnd: '14:00', type: 'Custom' });
    window.localStorage.setItem(SCHEDULE_KEY, JSON.stringify(nextShifts));

    const events = readJson<ScheduleEvent[]>(EVENTS_KEY, []);
    const nextEvents = events.map((event) => {
      if (event.date !== request.date || event.type !== 'booking') return event;
      if (event.staffId === request.requestingStaffId && minutes(original.start) <= minutes(event.start) && minutes(original.end) >= minutes(event.end)) return { ...event, staffId: request.replacementStaffId };
      if (event.staffId === request.replacementStaffId && minutes(requested.start) <= minutes(event.start) && minutes(requested.end) >= minutes(event.end)) return { ...event, staffId: request.requestingStaffId };
      return event;
    });
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(nextEvents));
  };

  const declineSwap = (request: ShiftSwapRequest) => {
    const nextSwaps = swaps.map((item) => item.id === request.id ? { ...item, status: 'Rejected' as const, rejectionReason: 'Declined by manager' } : item);
    setSwaps(nextSwaps);
    persist(leaves, nextSwaps);
    appendAudit(request.requestingStaffId, 'Shift swap declined', request.reason, 'Declined by manager');
    showToast('Shift swap declined');
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6"><button type="button" onClick={() => navigate('staff')} className="rounded-full p-2 text-primary hover:bg-[#fde7f3]" aria-label="Back to staff directory"><ArrowLeft className="h-5 w-5" /></button><div className="text-center"><h1 className="text-lg font-bold tracking-tight text-primary">Leave &amp; Shift Swap Requests</h1><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">NexoraOS · Manager workspace</p></div><button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-[#fde7f3]" aria-label="More options"><MoreVertical className="h-5 w-5" /></button></div></header>

      <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-24 sm:px-6">
        <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Approvals &amp; availability</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-on-background">Leave &amp; Shift Swap Management</h2><p className="mt-1 text-sm text-on-surface-variant">Approve only after checking the staff schedule and bookings.</p></div><div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"><span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">{pendingCount}</span> pending</div></section>

        <div className="mb-5 hide-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-[#e8e8e8] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">{([{ id: 'pending', label: 'Pending Requests' }, { id: 'approved', label: 'Approved' }, { id: 'rejected', label: 'Rejected' }, { id: 'calendar', label: 'Leave Calendar' }] as Array<{ id: TabId; label: string }>).map((tab) => <button type="button" key={tab.id} onClick={() => { setActiveTab(tab.id); setConflict(null); }} className={`relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${activeTab === tab.id ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-[#fde7f3]'}`}>{tab.label}{tab.id === 'pending' && pendingCount > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>{pendingCount}</span>}</button>)}</div>

        {conflict && <section className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><p className="font-bold">Request cannot be approved</p><p className="mt-1 text-xs font-semibold">{conflict}</p></div><button type="button" onClick={() => setConflict(null)} className="rounded-full p-1 hover:bg-red-100"><X className="h-4 w-4" /></button></section>}

        {activeTab === 'calendar' ? <LeaveCalendar cells={calendarCells} leaves={approvedLeaves} staffById={staffById} onSelectDate={setSelectedCalendarDate} month={calendarMonth} onMonthChange={setCalendarMonth} /> : <section className="flex flex-col gap-4">{filteredRequests.length === 0 ? <EmptyRequests tab={activeTab} /> : filteredRequests.map((request) => request.kind === 'leave' ? <LeaveRequestCard key={request.id} request={request} onApprove={() => approveLeave(request)} onReject={() => { setRejectionRequest(request); setRejectionNote(''); }} loading={loadingAction === request.id} /> : <ShiftSwapCard key={request.id} request={request} onApprove={() => approveSwap(request)} onDecline={() => declineSwap(request)} loading={loadingAction === request.id} />)}</section>}
      </main>

      <AnimatePresence>{rejectionRequest && <RejectionModal request={rejectionRequest} note={rejectionNote} setNote={setRejectionNote} onCancel={() => setRejectionRequest(null)} onReject={rejectLeave} />}</AnimatePresence>
      <AnimatePresence>{selectedCalendarDate && <CalendarDaySheet date={selectedCalendarDate} leaves={selectedDayLeaves} staffById={staffById} onClose={() => setSelectedCalendarDate(null)} />}</AnimatePresence>
      <AnimatePresence>{conflict && activeTab !== 'pending' && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-red-700 px-4 py-3 text-xs font-bold text-white shadow-xl"><AlertTriangle className="h-4 w-4" /> Conflict detected</motion.div>}</AnimatePresence>
    </div>
  );
}

function LeaveRequestCard({ request, onApprove, onReject, loading }: { request: LeaveRequest; onApprove: () => void; onReject: () => void; loading: boolean }) {
  return <article className={CARD_CLASS}><div className="flex items-start gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#fde7f3] shadow-sm">{photoOrInitials({ name: request.staffName, photo: request.staffPhoto })}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-sm font-bold text-on-background">{request.staffName}</h2><p className="text-[11px] text-on-surface-variant">Leave request · {request.requestDate ? `Requested ${formatDate(request.requestDate)}` : ''}</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass(request.status)}`}>{request.status}</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><InfoCell label="Leave type" value={request.leaveType} /><InfoCell label="Start date" value={formatDate(request.startDate)} /><InfoCell label="End date" value={formatDate(request.endDate)} /><InfoCell label="Total days" value={`${request.totalDays} day${request.totalDays === 1 ? '' : 's'}`} /></div><div className="mt-3 rounded-xl bg-[#fdf8f8] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Reason</p><p className="mt-1 text-xs font-semibold text-on-background">{request.reason}</p>{request.rejectionReason && <p className="mt-2 text-[11px] text-red-700"><b>Rejection note:</b> {request.rejectionReason}</p>}</div></div></div>{request.status === 'Pending' && <div className="mt-4 flex gap-2 border-t border-[#e8e8e8] pt-3"><button type="button" disabled={loading} onClick={onReject} className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-700 disabled:opacity-50"><UserX className="mr-1 inline h-4 w-4" /> Reject</button><button type="button" disabled={loading} onClick={onApprove} className="flex-1 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white disabled:opacity-50"><Check className="mr-1 inline h-4 w-4" /> {loading ? 'Updating…' : 'Approve'}</button></div>}</article>;
}

function ShiftSwapCard({ request, onApprove, onDecline, loading }: { request: ShiftSwapRequest; onApprove: () => void; onDecline: () => void; loading: boolean }) {
  return <article className={CARD_CLASS}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde7f3] text-primary"><RefreshCw className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">Shift swap request</p><h2 className="mt-1 text-sm font-bold text-on-background">{request.requestingStaff} <span className="text-primary">↔</span> {request.replacementStaff}</h2></div></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass(request.status)}`}>{request.status}</span></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><InfoCell label="Date" value={formatDate(request.date)} /><InfoCell label="Reason" value={request.reason} /><InfoCell label="Original shift" value={request.originalShift} /><InfoCell label="Requested shift" value={request.requestedShift} /></div>{request.rejectionReason && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700"><b>Note:</b> {request.rejectionReason}</p>}{request.status === 'Pending' && <div className="mt-4 flex gap-2 border-t border-[#e8e8e8] pt-3"><button type="button" disabled={loading} onClick={onDecline} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant disabled:opacity-50">Decline</button><button type="button" disabled={loading} onClick={onApprove} className="flex-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white disabled:opacity-50"><Check className="mr-1 inline h-4 w-4" /> {loading ? 'Validating…' : 'Approve Swap'}</button></div>}</article>;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-1 text-xs font-bold text-on-background">{value}</p></div>;
}

function EmptyRequests({ tab }: { tab: TabId }) {
  const label = tab === 'approved' ? 'No approved requests yet.' : tab === 'rejected' ? 'No rejected requests.' : 'No pending requests.';
  return <section className={`${CARD_CLASS} py-16 text-center`}><CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500/60" /><h2 className="text-base font-bold text-on-background">{label}</h2><p className="mt-1 text-xs text-on-surface-variant">New manager requests will appear here.</p></section>;
}

function LeaveCalendar({ cells, leaves, staffById, onSelectDate, month, onMonthChange }: { cells: Array<string | null>; leaves: LeaveRequest[]; staffById: Map<string, Staff>; onSelectDate: (date: string) => void; month: Date; onMonthChange: React.Dispatch<React.SetStateAction<Date>> }) {
  return <section className={CARD_CLASS}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Leave Calendar</h2><p className="text-xs text-on-surface-variant">Approved leave appears as unavailable.</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => onMonthChange((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="rounded-lg p-2 text-on-surface-variant hover:bg-[#fde7f3]"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-28 text-center text-xs font-bold text-on-background">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span><button type="button" onClick={() => onMonthChange((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="rounded-lg p-2 text-on-surface-variant hover:bg-[#fde7f3]"><ChevronRight className="h-4 w-4" /></button></div></div><div className="overflow-x-auto hide-scrollbar"><div className="min-w-[650px]"><div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day} className="py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-1">{cells.map((date, index) => { const dayLeaves = date ? leaves.filter((leave) => dateRange(leave.startDate, leave.endDate).includes(date)) : []; return <button type="button" disabled={!date} key={date || `empty-${index}`} onClick={() => date && onSelectDate(date)} className={`min-h-[100px] rounded-xl border p-2 text-left transition ${date ? dayLeaves.length ? 'border-purple-200 bg-purple-50 hover:border-primary' : 'border-[#e8e8e8] bg-white hover:border-primary' : 'border-transparent bg-transparent'}`}><span className="text-xs font-bold text-on-background">{date ? parseDate(date).getDate() : ''}</span>{date && <>{dayLeaves.map((leave) => <span key={leave.id} className="mt-2 block truncate rounded-md bg-yellow-100 px-1.5 py-1 text-[10px] font-bold text-yellow-900">{staffById.get(leave.staffId)?.name || leave.staffName}</span>)}{!dayLeaves.length && <span className="mt-3 block text-[10px] font-semibold text-emerald-700">Available</span>}</>}</button>; })}</div></div></div><div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />Approved leave · unavailable</div></section>;
}

function CalendarDaySheet({ date, leaves, staffById, onClose }: { date: string; leaves: LeaveRequest[]; staffById: Map<string, Staff>; onClose: () => void }) {
  return <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-black/40" /><motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 z-[70] max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"><div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#e0bec6] sm:hidden" /><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Leave calendar</span><h2 className="mt-1 text-xl font-bold text-on-background">{formatDate(date)}</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fdf1f6]"><X className="h-5 w-5" /></button></div>{leaves.length === 0 ? <div className="py-10 text-center"><CalendarDays className="mx-auto mb-3 h-9 w-9 text-emerald-500/60" /><p className="text-sm font-bold text-on-background">No approved leave</p><p className="mt-1 text-xs text-on-surface-variant">Staff availability is open for this date.</p></div> : <div className="mt-5 flex flex-col gap-2">{leaves.map((leave) => <div key={leave.id} className="rounded-xl border border-purple-200 bg-purple-50 p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-on-background">{staffById.get(leave.staffId)?.name || leave.staffName}</p><span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold text-yellow-900">Unavailable</span></div><p className="mt-2 text-xs text-on-surface-variant">{leave.leaveType} leave · {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</p><p className="mt-1 text-xs font-semibold text-on-background">{leave.reason}</p></div>)}</div>}<button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white">Done</button></motion.div></>;
}

function RejectionModal({ request, note, setNote, onCancel, onReject }: { request: LeaveRequest; note: string; setNote: (value: string) => void; onCancel: () => void; onReject: () => void }) {
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-600">Reject request</span><h2 className="mt-1 text-lg font-bold text-on-background">Reason for rejection</h2></div><button type="button" onClick={onCancel} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fdf1f6]"><X className="h-5 w-5" /></button></div><p className="mt-3 text-xs text-on-surface-variant">Add a clear reason for {request.staffName}. This note will be recorded for the manager and staff member.</p><textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Reason for rejection" className={`${INPUT_CLASS} mt-4`} /><div className="mt-5 flex gap-2"><button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button><button type="button" disabled={!note.trim()} onClick={onReject} className="flex-1 rounded-xl bg-red-600 px-3 py-3 text-xs font-bold text-white disabled:opacity-40">Reject Request</button></div></motion.div></div>;
}
