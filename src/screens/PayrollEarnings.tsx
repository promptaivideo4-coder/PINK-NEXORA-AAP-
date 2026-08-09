import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  LockKeyhole,
  MoreVertical,
  Search,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';
import { fetchMyBookings, fetchMyShop, listStaff, ShopBooking, ShopStaff } from '../lib/shopRepository';
import { supabase } from '../lib/supabase';

type PaymentStatus = 'Paid' | 'Pending' | 'Processing';
type PayrollRecord = {
  id: string;
  staffId: string;
  name: string;
  role: string;
  baseSalary: number;
  completedBookings: number;
  eligibleBookings: number;
  invalidBookings: number;
  eligibleSales: number;
  commissionRate: number;
  commissionEarned: number;
  bonus: number;
  deductions: number;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
};

type BreakdownRecord = PayrollRecord;

const PAYROLL_KEY = 'nexora_payroll_records';
const AUDIT_KEY = 'nexora_staff_audit_log';
const CYCLES = ['August 2026', 'July 2026', 'June 2026', 'May 2026'];
const CARD_CLASS = 'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';
const INPUT_CLASS = 'w-full rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';
const AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgK4i87T9zaSWtTpAX8ftOSq5DsvdiLIMBIFtrdKRgquoy229sj4FWpkPoFbDtGT0hQkuA7BxlkH7BBMbGJVV2G2P5B8GPGRRsGpdUnXHEXv80SvpFM2Tvtb-Vl0c404jrR3FnqXOIJ8rxqBRAYFwJSWoMuZ_7dleFJcNF4HPqNuvcZOt2UNuCCs1MtCHRYsr-m8nYSAnK7kGo5LODQoilthjYlH0wE-E7gY--ZupoRur1T2oWS4o1';

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
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function fallbackStaff(): Array<{ id: string; name: string; role: string }> {
  const directory = readJson<any[]>('nexora_staff_directory_demo', []);
  if (directory.length) return directory.slice(0, 8).map((staff) => ({ id: staff.id, name: staff.name, role: staff.role || 'Stylist' }));
  const legacy = readJson<any[]>('nexora_staff_list', []);
  if (legacy.length) return legacy.slice(0, 8).map((staff) => ({ id: staff.id, name: staff.name, role: staff.role || 'Stylist' }));
  return [
    { id: 'demo-elena', name: 'Elena Rodriguez', role: 'Senior Stylist' },
    { id: 'demo-marcus', name: 'Marcus Chen', role: 'Master Barber' },
    { id: 'demo-sanya', name: 'Sanya Rao', role: 'Color Specialist' },
    { id: 'demo-adi', name: 'Aditi Mehra', role: 'Nail Artist' },
  ];
}

function fallbackPayroll(staff: Array<{ id: string; name: string; role: string }>): PayrollRecord[] {
  const defaults = [
    { baseSalary: 65000, completedBookings: 32, eligibleBookings: 30, invalidBookings: 2, eligibleSales: 123000, commissionRate: 15, bonus: 5000, deductions: 2100, paymentStatus: 'Pending' as PaymentStatus },
    { baseSalary: 52000, completedBookings: 28, eligibleBookings: 27, invalidBookings: 1, eligibleSales: 98500, commissionRate: 18, bonus: 3500, deductions: 1800, paymentStatus: 'Processing' as PaymentStatus },
    { baseSalary: 48000, completedBookings: 24, eligibleBookings: 22, invalidBookings: 2, eligibleSales: 74200, commissionRate: 12, bonus: 2500, deductions: 1200, paymentStatus: 'Paid' as PaymentStatus },
    { baseSalary: 42000, completedBookings: 19, eligibleBookings: 18, invalidBookings: 1, eligibleSales: 55800, commissionRate: 10, bonus: 1800, deductions: 900, paymentStatus: 'Pending' as PaymentStatus },
  ];
  return staff.map((member, index) => {
    const value = defaults[index % defaults.length];
    const commissionEarned = Math.round(value.eligibleSales * value.commissionRate / 100);
    return { id: `pay-${member.id}`, staffId: member.id, name: member.name, role: member.role, ...value, commissionEarned };
  });
}

function statusClass(status: PaymentStatus) {
  if (status === 'Paid') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Processing') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function currentRole() {
  if (typeof window === 'undefined') return 'owner';
  return (window.localStorage.getItem('nexora-user-role') || window.localStorage.getItem('nexora-demo-role') || 'owner').toLowerCase();
}

function isAuthorizedRole(role: string) {
  return ['owner', 'manager', 'admin', 'salon_owner'].some((allowed) => role.includes(allowed));
}

export default function PayrollEarnings({ navigate }: NavigationProps) {
  const [authorized] = useState(() => isAuthorizedRole(currentRole()));
  const [cycle, setCycle] = useState(CYCLES[0]);
  const [records, setRecords] = useState<PayrollRecord[]>(() => readJson<PayrollRecord[]>(PAYROLL_KEY, fallbackPayroll(fallbackStaff())));
  const [filter, setFilter] = useState<'All' | PaymentStatus>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [breakdown, setBreakdown] = useState<BreakdownRecord | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<PayrollRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(PAYROLL_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    let cancelled = false;
    const loadLive = async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (!shop) return;
        const [staffRows, bookingRows] = await Promise.all([listStaff(supabase, shop.id).catch(() => []), fetchMyBookings(supabase, shop.id).catch(() => [])]);
        if (cancelled || !staffRows.length) return;
        const liveRecords = buildLivePayroll(staffRows, bookingRows);
        if (liveRecords.length) setRecords((current) => mergePaymentStatuses(liveRecords, current));
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadLive();
    return () => { cancelled = true; };
  }, []);

  const cycleRecords = cycle === CYCLES[0] ? records : [];
  const filteredRecords = useMemo(() => cycleRecords.filter((record) => {
    const matchesStatus = filter === 'All' || record.paymentStatus === filter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || record.name.toLowerCase().includes(query) || record.role.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  }), [cycleRecords, filter, search]);

  const totals = useMemo(() => filteredRecords.reduce((result, record) => ({
    baseSalary: result.baseSalary + record.baseSalary,
    commission: result.commission + record.commissionEarned,
    bonus: result.bonus + record.bonus,
    deductions: result.deductions + record.deductions,
    net: result.net + netPay(record),
  }), { baseSalary: 0, commission: 0, bonus: 0, deductions: 0, net: 0 }), [filteredRecords]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const openBreakdown = (record: PayrollRecord) => {
    window.localStorage.setItem('nexora_selected_payroll_id', record.id);
    window.localStorage.setItem('nexora_selected_payroll_cycle', cycle);
    navigate('staff-payroll-breakdown');
  };

  const processPayment = () => {
    if (!paymentRecord) return;
    setRecords((current) => current.map((record) => record.id === paymentRecord.id ? { ...record, paymentStatus: 'Processing', paymentReference: `PAY-${Date.now()}` } : record));
    appendAudit(paymentRecord.staffId, 'Payroll payment processing started', paymentRecord.paymentStatus, 'Processing');
    setPaymentRecord(null);
    showToast(`${paymentRecord.name}'s payment is now Processing`);
  };

  const settlePayment = (record: PayrollRecord) => {
    const timestamp = new Date().toISOString();
    setRecords((current) => current.map((item) => item.id === record.id ? { ...item, paymentStatus: 'Paid' } : item));
    const settlements = readJson<Record<string, string>>('nexora_payroll_settlements', {});
    settlements[record.id] = timestamp;
    window.localStorage.setItem('nexora_payroll_settlements', JSON.stringify(settlements));
    appendAudit(record.staffId, 'Payroll payment settled', 'Processing', 'Paid');
    showToast(`${record.name}'s payment marked Paid`);
  };

  const appendAudit = (staffId: string, action: string, before?: string, after?: string) => {
    const all = readJson<Record<string, any[]>>('nexora_staff_audit_log', {});
    all[staffId] = [{ id: uid(), action, timestamp: new Date().toISOString(), changedBy: 'You', before, after }, ...(all[staffId] || [])];
    window.localStorage.setItem('nexora_staff_audit_log', JSON.stringify(all));
  };

  const downloadStatement = (record: PayrollRecord) => {
    const lines = [
      ['NexoraOS Payroll Statement', cycle],
      ['Staff Member', record.name],
      ['Role', record.role],
      ['Base Salary', money(record.baseSalary)],
      ['Completed Bookings', String(record.completedBookings)],
      ['Eligible Bookings', String(record.eligibleBookings)],
      ['Invalid/Cancelled Bookings', String(record.invalidBookings)],
      ['Eligible Sales', money(record.eligibleSales)],
      ['Commission Rate', `${record.commissionRate}%`],
      ['Commission Earned', money(record.commissionEarned)],
      ['Bonuses', money(record.bonus)],
      ['Deductions', money(record.deductions)],
      ['Net Payable', money(netPay(record))],
      ['Payment Status', record.paymentStatus],
    ];
    const csv = lines.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.name.replace(/\s+/g, '-').toLowerCase()}-${cycle.replace(/\s+/g, '-')}-payroll.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExported(true);
    showToast('Payroll statement downloaded');
  };

  if (!authorized) return <UnauthorizedPayroll navigate={navigate} />;

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"><button type="button" onClick={() => navigate('staff')} className="rounded-full p-2 text-primary hover:bg-[#fde7f3]" aria-label="Back to staff directory"><ArrowLeft className="h-5 w-5" /></button><div className="text-center"><h1 className="text-lg font-bold tracking-tight text-primary">Payroll &amp; Earnings</h1><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">NexoraOS · Manager workspace</p></div><button type="button" onClick={() => setExported(false)} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fde7f3]" aria-label="Payroll options"><MoreVertical className="h-5 w-5" /></button></div></header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-24 sm:px-6">
        <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Confidential finance</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-on-background">Payroll &amp; Earnings</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant"><LockKeyhole className="h-4 w-4 text-primary" /> Manager access only · ₹ currency</p></div><label className="relative sm:w-48"><CalendarIcon /><select value={cycle} onChange={(event) => setCycle(event.target.value)} className={`${INPUT_CLASS} appearance-none pr-8`}>{CYCLES.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></label></section>

        {loadError && <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"><AlertCircle className="h-4 w-4" /> Unable to load live payroll data. Showing saved manager records.</div>}
        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5"><SummaryCard label="Total Base Salary" value={money(totals.baseSalary)} /><SummaryCard label="Total Commission" value={money(totals.commission)} /><SummaryCard label="Performance Bonuses" value={money(totals.bonus)} /><SummaryCard label="Total Deductions" value={money(totals.deductions)} /><SummaryCard label="Net Payout" value={money(totals.net)} highlight /></section>

        <section className="mb-4 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff..." className={`${INPUT_CLASS} pl-10`} /></label><div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">{(['All', 'Pending', 'Processing', 'Paid'] as Array<'All' | PaymentStatus>).map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition ${filter === item ? 'border-primary bg-primary text-white' : 'border-[#e0bec6] bg-white text-on-surface-variant hover:bg-[#fde7f3]'}`}>{item}</button>)}</div></section>

        {exported && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Payroll statement exported successfully.</div>}
        <section className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Staff Payroll</h2><p className="text-xs text-on-surface-variant">Only completed and eligible bookings generate commission.</p></div><button type="button" onClick={() => filteredRecords.forEach(downloadStatement)} className="inline-flex items-center gap-2 rounded-xl border border-[#e0bec6] bg-white px-3 py-2.5 text-xs font-bold text-primary hover:bg-[#fde7f3]"><Download className="h-4 w-4" /> Download All</button></section>

        {loading ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><LoadingCard /><LoadingCard /></div> : filteredRecords.length === 0 ? <section className={`${CARD_CLASS} py-16 text-center`}><Wallet className="mx-auto mb-3 h-10 w-10 text-on-surface-variant/50" /><h2 className="text-base font-bold text-on-background">No payroll records for this cycle.</h2><p className="mt-1 text-xs text-on-surface-variant">Choose another payroll cycle or clear your filters.</p></section> : <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">{filteredRecords.map((record) => <PayrollCard key={record.id} record={record} onBreakdown={() => openBreakdown(record)} onProcess={() => setPaymentRecord(record)} onSettle={() => settlePayment(record)} onDownload={() => downloadStatement(record)} />)}</section>}
      </main>

      <AnimatePresence>{breakdown && <BreakdownSheet record={breakdown} cycle={cycle} onClose={() => setBreakdown(null)} />}</AnimatePresence>
      <AnimatePresence>{paymentRecord && <ProcessModal record={paymentRecord} onCancel={() => setPaymentRecord(null)} onConfirm={processPayment} />}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 10 }} exit={{ opacity: 0, y: 10 }} className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl"><Check className="h-4 w-4 text-emerald-300" />{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function buildLivePayroll(staffRows: ShopStaff[], bookings: ShopBooking[]): PayrollRecord[] {
  return staffRows.map((staff, index) => {
    const assigned = bookings.filter((booking) => booking.serviceNames.length > 0 && index === 0);
    const eligible = assigned.filter((booking) => ['completed', 'complete', 'settled'].includes(String(booking.status || '').toLowerCase()) && !['cancelled', 'canceled', 'no_show', 'invalid'].includes(String(booking.status || '').toLowerCase()));
    const invalid = assigned.filter((booking) => ['cancelled', 'canceled', 'no_show', 'invalid'].includes(String(booking.status || '').toLowerCase()));
    const eligibleSales = eligible.reduce((sum, booking) => sum + Number(booking.totalPaise || 0) / 100, 0);
    const commissionRate = 15;
    const commissionEarned = Math.round(eligibleSales * commissionRate / 100);
    return { id: `pay-${staff.id}`, staffId: staff.id, name: staff.name, role: staff.role || 'Stylist', baseSalary: 0, completedBookings: eligible.length, eligibleBookings: eligible.length, invalidBookings: invalid.length, eligibleSales, commissionRate, commissionEarned, bonus: 0, deductions: 0, paymentStatus: 'Pending' };
  });
}

function mergePaymentStatuses(next: PayrollRecord[], current: PayrollRecord[]) {
  return next.map((record) => { const existing = current.find((item) => item.staffId === record.staffId); return existing ? { ...record, baseSalary: existing.baseSalary || record.baseSalary, bonus: existing.bonus, deductions: existing.deductions, paymentStatus: existing.paymentStatus, paymentReference: existing.paymentReference } : record; });
}

function netPay(record: PayrollRecord) {
  return record.baseSalary + record.commissionEarned + record.bonus - record.deductions;
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`${CARD_CLASS} ${highlight ? 'border-primary/20 bg-[#fde7f3]' : ''}`}><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className={`mt-2 text-lg font-black ${highlight ? 'text-primary' : 'text-on-background'}`}>{value}</p></div>;
}

function PayrollCard({ record, onBreakdown, onProcess, onSettle, onDownload }: { record: PayrollRecord; onBreakdown: () => void; onProcess: () => void; onSettle: () => void; onDownload: () => void }) {
  const net = netPay(record);
  return <article className={CARD_CLASS}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#fde7f3] shadow-sm"><img src={AVATAR} alt={record.name} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /></div><div className="min-w-0"><h3 className="truncate text-sm font-bold text-on-background">{record.name}</h3><p className="text-[11px] text-on-surface-variant">{record.role}</p></div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass(record.paymentStatus)}`}>{record.paymentStatus}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e8e8e8] pt-3 sm:grid-cols-4"><PayrollMetric label="Base Salary" value={money(record.baseSalary)} /><PayrollMetric label="Completed Bookings" value={`${record.completedBookings}`} /><PayrollMetric label="Commission Rate" value={`${record.commissionRate}%`} /><PayrollMetric label="Commission Earned" value={money(record.commissionEarned)} /></div><div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#fdf8f8] p-3"><PayrollMetric label="Bonus / Incentive" value={money(record.bonus)} /><PayrollMetric label="Deductions" value={money(record.deductions)} /><PayrollMetric label="Net Payable" value={money(net)} highlight /></div><div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8e8e8] pt-3"><button type="button" onClick={onBreakdown} className="flex-1 rounded-lg border border-[#e0bec6] px-2 py-2.5 text-[11px] font-bold text-on-surface-variant hover:bg-[#fde7f3]">View Breakdown</button>{record.paymentStatus === 'Pending' && <button type="button" onClick={onProcess} className="flex-1 rounded-lg bg-primary px-2 py-2.5 text-[11px] font-bold text-white">Process Payment</button>}{record.paymentStatus === 'Processing' && <button type="button" onClick={onSettle} className="flex-1 rounded-lg bg-emerald-600 px-2 py-2.5 text-[11px] font-bold text-white">Mark Paid</button>}<button type="button" onClick={onDownload} className="rounded-lg bg-[#f7f2f2] p-2.5 text-on-surface-variant hover:bg-[#fde7f3]" title="Download Payroll Statement"><Download className="h-4 w-4" /></button></div><p className="mt-3 text-[11px] text-on-surface-variant">Eligible sales: <b className="text-on-background">{money(record.eligibleSales)}</b> · Invalid/cancelled excluded: <b className="text-on-background">{record.invalidBookings}</b></p></article>;
}

function PayrollMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className={`mt-1 text-xs font-black ${highlight ? 'text-primary' : 'text-on-background'}`}>{value}</p></div>;
}

function BreakdownSheet({ record, cycle, onClose }: { record: PayrollRecord; cycle: string; onClose: () => void }) {
  return <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-black/40" /><motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 z-[70] max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"><div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#e0bec6] sm:hidden" /><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Payroll breakdown</span><h2 className="mt-1 text-xl font-bold text-on-background">{record.name}</h2><p className="text-xs text-on-surface-variant">{cycle} · Manager access only</p></div><button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fde7f3]"><X className="h-5 w-5" /></button></div><div className="mt-5 flex flex-col gap-2"><FormulaRow label="Base Salary" value={money(record.baseSalary)} /><FormulaRow label={`Eligible Commission (${record.eligibleSales ? money(record.eligibleSales) : '₹0'} × ${record.commissionRate}%)`} value={money(record.commissionEarned)} plus /><FormulaRow label="Bonuses" value={money(record.bonus)} plus /><FormulaRow label="Deductions" value={money(record.deductions)} minus /><div className="my-2 border-t border-[#e0bec6]" /><FormulaRow label="Net Payout" value={money(netPay(record))} total /></div><div className="mt-5 rounded-xl border border-[#e0bec6] bg-[#fdf8f8] p-3 text-xs text-on-surface-variant"><p><b>Commission rule:</b> Only completed and eligible bookings generate commission.</p><p className="mt-1"><b>Excluded:</b> {record.invalidBookings} cancelled or invalid booking{record.invalidBookings === 1 ? '' : 's'}.</p></div><button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white">Done</button></motion.div></>;
}

function FormulaRow({ label, value, plus, minus, total }: { label: string; value: string; plus?: boolean; minus?: boolean; total?: boolean }) {
  return <div className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 ${total ? 'bg-[#fde7f3]' : 'bg-[#fdf8f8]'}`}><span className={`text-xs ${total ? 'font-black text-primary' : 'font-semibold text-on-surface-variant'}`}>{plus ? '+ ' : minus ? '− ' : ''}{label}</span><span className={`text-sm ${total ? 'font-black text-primary' : 'font-bold text-on-background'}`}>{minus ? '− ' : ''}{value}</span></div>;
}

function ProcessModal({ record, onCancel, onConfirm }: { record: PayrollRecord; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fde7f3] text-primary"><ShieldCheck className="h-5 w-5" /></div><h2 className="text-lg font-bold text-on-background">Process payment?</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">You are initiating a payroll payment of <b className="text-on-background">{money(netPay(record))}</b> for {record.name}. The status will become Processing until settlement is confirmed.</p><div className="mt-5 flex gap-2"><button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button><button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white">Process Payment</button></div></motion.div></div>;
}

function UnauthorizedPayroll({ navigate }: NavigationProps) {
  return <div className="min-h-screen bg-[#fcf9f8] text-on-background"><header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4"><button type="button" onClick={() => navigate('staff')} className="rounded-full p-2 text-primary hover:bg-[#fde7f3]"><ArrowLeft className="h-5 w-5" /></button><h1 className="text-lg font-bold text-primary">Payroll &amp; Earnings</h1><span className="w-9" /></div></header><main className="flex min-h-screen items-center justify-center px-5 pt-16"><section className={`${CARD_CLASS} w-full max-w-md py-12 text-center`}><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700"><LockKeyhole className="h-8 w-8" /></div><h2 className="text-xl font-bold text-on-background">You don't have permission to access Payroll.</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">Payroll and earnings are visible only to authorized owners, managers and administrators.</p><button type="button" onClick={() => navigate('staff')} className="mt-6 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white">Back to Staff</button></section></main></div>;
}

function CalendarIcon() {
  return <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-primary" />;
}

function LoadingCard() {
  return <div className="h-72 animate-pulse rounded-2xl border border-[#e8e8e8] bg-white p-5"><div className="flex gap-3"><div className="h-12 w-12 rounded-full bg-[#ece7e7]" /><div className="flex-1"><div className="h-4 w-2/3 rounded bg-[#ece7e7]" /><div className="mt-2 h-3 w-1/2 rounded bg-[#ece7e7]" /></div></div><div className="mt-8 grid grid-cols-4 gap-2"><div className="h-10 rounded bg-[#ece7e7]" /><div className="h-10 rounded bg-[#ece7e7]" /><div className="h-10 rounded bg-[#ece7e7]" /><div className="h-10 rounded bg-[#ece7e7]" /></div></div>;
}
