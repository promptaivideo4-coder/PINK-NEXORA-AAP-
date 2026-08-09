import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  LockKeyhole,
  Minus,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';

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
};
type CommissionLine = { id: string; date: string; bookingId: string; serviceName: string; amount: number; rate: number; earned: number; rule: string };
type BonusLine = { label: string; amount: number };
type DeductionLine = { label: string; amount: number };

const PAYROLL_KEY = 'nexora_payroll_records';
const SETTLEMENT_KEY = 'nexora_payroll_settlements';
const CARD_CLASS = 'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';
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

function money(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function netPay(record: PayrollRecord) {
  return record.baseSalary + record.commissionEarned + record.bonus - record.deductions;
}

function fallbackRecords(): PayrollRecord[] {
  const values = [
    ['demo-elena', 'Elena Rodriguez', 'Senior Stylist', 65000, 32, 30, 2, 123000, 15, 18450, 5000, 2100, 'Pending'],
    ['demo-marcus', 'Marcus Chen', 'Master Barber', 52000, 28, 27, 1, 98500, 18, 17730, 3500, 1800, 'Processing'],
    ['demo-sanya', 'Sanya Rao', 'Color Specialist', 48000, 24, 22, 2, 74200, 12, 8904, 2500, 1200, 'Paid'],
  ] as const;
  return values.map(([staffId, name, role, baseSalary, completedBookings, eligibleBookings, invalidBookings, eligibleSales, commissionRate, commissionEarned, bonus, deductions, paymentStatus], index) => ({ id: `pay-${staffId || index}`, staffId, name, role, baseSalary, completedBookings, eligibleBookings, invalidBookings, eligibleSales, commissionRate, commissionEarned, bonus, deductions, paymentStatus: paymentStatus as PaymentStatus }));
}

function authorized() {
  if (typeof window === 'undefined') return true;
  const role = (window.localStorage.getItem('nexora-user-role') || window.localStorage.getItem('nexora-demo-role') || 'owner').toLowerCase();
  return ['owner', 'manager', 'admin', 'salon_owner'].some((allowed) => role.includes(allowed));
}

const BASE_LINES = [
  { date: '08 Aug 2026', bookingId: '#BK-1024', serviceName: 'Bridal Makeup', amount: 10000, rate: 20, rule: 'Bridal Makeup override · 20%' },
  { date: '08 Aug 2026', bookingId: '#BK-1021', serviceName: 'Balayage', amount: 20000, rate: 15, rule: 'Default service commission · 15%' },
  { date: '07 Aug 2026', bookingId: '#BK-1018', serviceName: 'Hair Coloring', amount: 15000, rate: 15, rule: 'Default service commission · 15%' },
  { date: '07 Aug 2026', bookingId: '#BK-1016', serviceName: 'Haircut', amount: 8000, rate: 15, rule: 'Default service commission · 15%' },
  { date: '06 Aug 2026', bookingId: '#BK-1011', serviceName: 'Keratin Treatment', amount: 25000, rate: 15, rule: 'Default service commission · 15%' },
  { date: '05 Aug 2026', bookingId: '#BK-1009', serviceName: 'Hair Extensions', amount: 40000, rate: 15, rule: 'Default service commission · 15%' },
  { date: '04 Aug 2026', bookingId: '#BK-1004', serviceName: 'Facial', amount: 5000, rate: 5, rule: 'Service override · 5%' },
];

function commissionLines(record: PayrollRecord): CommissionLine[] {
  const baseSales = BASE_LINES.reduce((sum, line) => sum + line.amount, 0);
  const factor = record.eligibleSales > 0 ? record.eligibleSales / baseSales : 0;
  let earnedSoFar = 0;
  return BASE_LINES.map((line, index) => {
    const amount = index === BASE_LINES.length - 1 ? Math.max(0, Math.round(record.eligibleSales - BASE_LINES.slice(0, -1).reduce((sum, item) => sum + Math.round(item.amount * factor), 0))) : Math.round(line.amount * factor);
    const earned = index === BASE_LINES.length - 1 ? Math.max(0, Math.round(record.commissionEarned - earnedSoFar)) : Math.round(amount * line.rate / 100);
    earnedSoFar += earned;
    return { ...line, id: `${record.id}-line-${index}`, amount, earned };
  });
}

function bonusLines(record: PayrollRecord): BonusLine[] {
  const performance = Math.round(record.bonus * 0.6);
  const sales = Math.round(record.bonus * 0.3);
  const festival = record.bonus - performance - sales;
  return [{ label: 'Performance Bonus', amount: performance }, { label: 'Sales Incentive', amount: sales }, { label: 'Festival Bonus', amount: festival }, { label: 'Other Incentive', amount: 0 }];
}

function deductionLines(record: PayrollRecord): DeductionLine[] {
  const advance = Math.round(record.deductions * 0.45);
  const tax = Math.round(record.deductions * 0.45);
  return [{ label: 'Advance', amount: advance }, { label: 'Tax / Deduction', amount: tax }, { label: 'Other deduction', amount: record.deductions - advance - tax }];
}

export default function PayrollBreakdown({ navigate }: NavigationProps) {
  const [record, setRecord] = useState<PayrollRecord | null>(() => {
    const records = readJson<PayrollRecord[]>(PAYROLL_KEY, fallbackRecords());
    const selectedId = typeof window !== 'undefined' ? window.localStorage.getItem('nexora_selected_payroll_id') : null;
    return records.find((item) => item.id === selectedId) || records[0] || null;
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [settleConfirm, setSettleConfirm] = useState(false);
  const [settledAt, setSettledAt] = useState<string | null>(() => {
    const selectedId = typeof window !== 'undefined' ? window.localStorage.getItem('nexora_selected_payroll_id') : null;
    return selectedId ? readJson<Record<string, string>>(SETTLEMENT_KEY, {})[selectedId] || null : null;
  });
  const [toast, setToast] = useState<string | null>(null);
  const isAuthorized = authorized();

  const lines = useMemo(() => record ? commissionLines(record) : [], [record]);
  const bonuses = useMemo(() => record ? bonusLines(record) : [], [record]);
  const deductions = useMemo(() => record ? deductionLines(record) : [], [record]);
  const isSettled = Boolean(record && (record.paymentStatus === 'Paid' || settledAt));

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const exportPdf = () => {
    window.print();
    showToast('Print dialog opened — choose Save as PDF');
  };

  const markSettled = () => {
    if (!record) return;
    const timestamp = new Date().toISOString();
    const records = readJson<PayrollRecord[]>(PAYROLL_KEY, fallbackRecords());
    const nextRecords = records.map((item) => item.id === record.id ? { ...item, paymentStatus: 'Paid' as PaymentStatus } : item);
    const settlements = readJson<Record<string, string>>(SETTLEMENT_KEY, {});
    settlements[record.id] = timestamp;
    window.localStorage.setItem(PAYROLL_KEY, JSON.stringify(nextRecords));
    window.localStorage.setItem(SETTLEMENT_KEY, JSON.stringify(settlements));

    // Persist to the same storage key used by Screen 7 (nexora_payroll_settlements)
    const sharedSettlements = readJson<Record<string, string>>('nexora_payroll_settlements', {});
    sharedSettlements[record.id] = timestamp;
    window.localStorage.setItem('nexora_payroll_settlements', JSON.stringify(sharedSettlements));

    // Add audit log entry
    const AUDIT_KEY = 'nexora_staff_audit_log';
    const allAudit = readJson<Record<string, any[]>>(AUDIT_KEY, {});
    const auditEntry = { id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, action: 'Payroll payment settled', timestamp, changedBy: 'You', before: record.paymentStatus, after: 'Paid' };
    allAudit[record.staffId] = [auditEntry, ...(allAudit[record.staffId] || [])];
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(allAudit));

    setRecord((current) => current ? { ...current, paymentStatus: 'Paid' } : current);
    setSettledAt(timestamp);
    setSettleConfirm(false);
    showToast('Payroll marked as settled.');
  };

  if (!isAuthorized) return <Unauthorized navigate={navigate} />;
  if (!record) return <EmptyStatement navigate={navigate} />;

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased print:bg-white">
      <header className="no-print fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6"><button type="button" onClick={() => navigate('staff-payroll')} className="rounded-full p-2 text-primary hover:bg-[#fde7f3]" aria-label="Back to payroll"><ArrowLeft className="h-5 w-5" /></button><div className="text-center"><h1 className="text-lg font-bold tracking-tight text-primary">Payroll Statement</h1><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">NexoraOS · Confidential</p></div><button type="button" onClick={exportPdf} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fde7f3]" aria-label="Export PDF"><Download className="h-5 w-5" /></button></div></header>

      <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-24 sm:px-6 print:max-w-none print:px-0 print:pt-0">
        <section className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="h-16 w-16 overflow-hidden rounded-2xl border-4 border-white bg-[#fde7f3] shadow-sm"><img src={AVATAR} alt={record.name} className="h-full w-full object-cover" /></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Payroll Statement</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-on-background">{record.name}</h2><p className="text-sm font-semibold text-on-surface-variant">{record.role}</p></div></div><div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant"><Calendar className="h-4 w-4 text-primary" /> Payroll Cycle: August 2026</div></section>

        <section className={`${CARD_CLASS} mb-5 border-primary/20 bg-[#fde7f3]`}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Net payout calculation</h2><p className="text-xs text-on-surface-variant">All values are calculated from Screen 7 payroll data.</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isSettled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{isSettled ? 'Settled' : record.paymentStatus}</span></div><div className="flex flex-col gap-2"><SummaryRow label="Base Salary" value={money(record.baseSalary)} /><SummaryRow label="Total Commission" value={money(record.commissionEarned)} plus /><SummaryRow label="Bonuses" value={money(record.bonus)} plus /><SummaryRow label="Deductions" value={money(record.deductions)} minus /><div className="border-t border-primary/20 pt-2" /><SummaryRow label="Net Payout" value={money(netPay(record))} total /></div></section>

        <section className={`${CARD_CLASS} mb-5`}><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Service Commission</h2><p className="text-xs text-on-surface-variant">{record.eligibleBookings} eligible bookings · {record.invalidBookings} cancelled/invalid excluded</p></div><ShieldCheck className="h-5 w-5 text-primary" /></div><div className="flex flex-col gap-2">{lines.map((line) => <CommissionCard key={line.id} line={line} open={expanded === line.id} onToggle={() => setExpanded((current) => current === line.id ? null : line.id)} />)}</div><div className="mt-4 rounded-xl border border-[#e0bec6] bg-[#fdf8f8] p-3 text-xs text-on-surface-variant"><b>Commission rule:</b> Only completed and eligible bookings generate commission. Cancelled or invalid bookings are not included in the earned commission.</div></section>

        <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2"><div className={CARD_CLASS}><div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h2 className="text-base font-bold text-on-background">Bonuses</h2></div><div className="flex flex-col gap-2">{bonuses.map((bonus) => <LineItem key={bonus.label} label={bonus.label} value={money(bonus.amount)} />)}</div></div><div className={CARD_CLASS}><div className="mb-3 flex items-center gap-2"><Minus className="h-5 w-5 text-red-600" /><h2 className="text-base font-bold text-on-background">Deductions</h2></div><div className="flex flex-col gap-2">{deductions.map((deduction) => <LineItem key={deduction.label} label={deduction.label} value={money(deduction.amount)} negative />)}</div></div></section>

        <section className="mb-5 rounded-2xl bg-[#313030] p-5 text-white shadow-[0_8px_28px_rgba(0,0,0,0.12)]"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Net payout</p><h2 className="mt-2 text-3xl font-black">{money(netPay(record))}</h2><p className="mt-1 text-xs text-white/65">Base + eligible commission + bonuses − deductions</p></div><Wallet className="h-9 w-9 text-[#ffb0c8]" /></div>{isSettled && settledAt && <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-200"><CheckCircle2 className="h-4 w-4" /> Payroll marked as settled · {formatDateTime(settledAt)}</div>}</section>

        <section className="no-print flex flex-col gap-2 sm:flex-row"><button type="button" onClick={exportPdf} className="flex-1 rounded-xl border border-[#e0bec6] bg-white px-4 py-3 text-xs font-bold text-primary hover:bg-[#fde7f3]"><Download className="mr-1 inline h-4 w-4" /> Export PDF Statement</button>{!isSettled && <button type="button" onClick={() => setSettleConfirm(true)} className="flex-1 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white hover:opacity-90">Mark as Settled</button>}</section>
      </main>

      <AnimatePresence>{settleConfirm && <SettleModal record={record} onCancel={() => setSettleConfirm(false)} onConfirm={markSettled} />}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 10 }} exit={{ opacity: 0, y: 10 }} className="no-print fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl"><Check className="h-4 w-4 text-emerald-300" />{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SummaryRow({ label, value, plus, minus, total }: { label: string; value: string; plus?: boolean; minus?: boolean; total?: boolean }) {
  return <div className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 ${total ? 'bg-primary text-white shadow-sm' : 'bg-white/70'}`}><span className={`text-sm ${total ? 'font-black' : 'font-semibold text-on-surface-variant'}`}>{plus ? '+ ' : minus ? '− ' : ''}{label}</span><span className={`text-sm ${total ? 'font-black' : 'font-bold text-on-background'}`}>{minus ? '− ' : ''}{value}</span></div>;
}

function CommissionCard({ line, open, onToggle }: { line: CommissionLine; open: boolean; onToggle: () => void }) {
  return <div className="overflow-hidden rounded-xl border border-[#e8e8e8] bg-[#fdf8f8]"><button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary"><FileText className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block truncate text-xs text-on-background">{line.serviceName}</b><small className="text-[11px] text-on-surface-variant">{line.date} · {line.bookingId}</small></span><span className="text-right"><b className="block text-xs text-primary">{money(line.earned)}</b><small className="text-[10px] text-on-surface-variant">{line.rate}%</small></span>{open ? <ChevronDown className="h-4 w-4 text-on-surface-variant" /> : <ChevronRight className="h-4 w-4 text-on-surface-variant" />}</button>{open && <div className="grid grid-cols-2 gap-2 border-t border-[#e8e8e8] bg-white p-3 text-xs"><InfoRow label="Booking ID" value={line.bookingId} /><InfoRow label="Date" value={line.date} /><InfoRow label="Service Name" value={line.serviceName} /><InfoRow label="Service Amount" value={money(line.amount)} /><InfoRow label="Commission Rule" value={line.rule} /><InfoRow label="Commission Rate" value={`${line.rate}%`} /><InfoRow label="Final Commission" value={money(line.earned)} highlight /><InfoRow label="Booking Status" value="Completed · Eligible" /></div>}</div>;
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className="rounded-lg bg-[#fdf8f8] p-2"><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className={`mt-1 text-xs font-bold ${highlight ? 'text-primary' : 'text-on-background'}`}>{value}</p></div>;
}

function LineItem({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg bg-[#fdf8f8] px-3 py-2.5"><span className="text-xs font-semibold text-on-surface-variant">{label}</span><span className={`text-xs font-bold ${negative ? 'text-red-700' : 'text-on-background'}`}>{negative ? '− ' : ''}{value}</span></div>;
}

function SettleModal({ record, onCancel, onConfirm }: { record: PayrollRecord; onCancel: () => void; onConfirm: () => void }) {
  const cycle = typeof window !== 'undefined' ? window.localStorage.getItem('nexora_selected_payroll_cycle') || 'August 2026' : 'August 2026';
  return <div className="no-print fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div><h2 className="text-lg font-bold text-on-background">Mark payroll as settled?</h2><div className="mt-3 space-y-2 rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3 text-xs"><div className="flex items-center justify-between"><span className="font-semibold text-on-surface-variant">Staff Name</span><span className="font-bold text-on-background">{record.name}</span></div><div className="flex items-center justify-between"><span className="font-semibold text-on-surface-variant">Payroll Cycle</span><span className="font-bold text-on-background">{cycle}</span></div><div className="flex items-center justify-between"><span className="font-semibold text-on-surface-variant">Net Payout</span><span className="font-black text-primary">{money(netPay(record))}</span></div><div className="flex items-center justify-between"><span className="font-semibold text-on-surface-variant">Current Status</span><span className="font-bold text-on-background">{record.paymentStatus}</span></div></div><p className="mt-3 text-sm leading-6 text-on-surface-variant">After confirmation the payment status will be updated to <b className="text-emerald-700">Paid/Settled</b>, a settlement timestamp will be recorded and an audit log entry will be added.</p><div className="mt-5 flex gap-2"><button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button><button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white">Confirm Settlement</button></div></motion.div></div>;
}

function Unauthorized({ navigate }: NavigationProps) {
  return <div className="min-h-screen bg-[#fcf9f8] text-on-background"><header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4"><button type="button" onClick={() => navigate('staff-payroll')} className="rounded-full p-2 text-primary hover:bg-[#fde7f3]"><ArrowLeft className="h-5 w-5" /></button><h1 className="text-lg font-bold text-primary">Payroll Statement</h1><span className="w-9" /></div></header><main className="flex min-h-screen items-center justify-center px-5 pt-16"><section className={`${CARD_CLASS} w-full max-w-md py-12 text-center`}><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700"><LockKeyhole className="h-8 w-8" /></div><h2 className="text-xl font-bold text-on-background">You don't have permission to access Payroll.</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">Payroll and earnings are visible only to authorized managers.</p><button type="button" onClick={() => navigate('staff-payroll')} className="mt-6 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white">Back to Payroll</button></section></main></div>;
}

function EmptyStatement({ navigate }: NavigationProps) {
  return <div className="min-h-screen bg-[#fcf9f8] text-on-background"><main className="flex min-h-screen items-center justify-center px-5"><section className={`${CARD_CLASS} w-full max-w-md py-12 text-center`}><FileText className="mx-auto mb-3 h-10 w-10 text-on-surface-variant/50" /><h2 className="text-base font-bold text-on-background">No payroll statement found.</h2><button type="button" onClick={() => navigate('staff-payroll')} className="mt-5 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white">Back to Payroll</button></section></main></div>;
}
