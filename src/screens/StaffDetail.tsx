import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  Briefcase,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ClipboardList,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  MoreVertical,
  Phone,
  RefreshCw,
  Scissors,
  ShieldCheck,
  Star,
  Trash2,
  User,
  UserCheck,
  UserX,
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';
import { fetchMyShop, listStaff, updateStaff as updateStaffRow } from '../lib/shopRepository';
import {
  fetchStaffById,
  fetchStaffSchedules,
  fetchStaffServices,
  fetchStaffSkills,
  fetchServices,
  fetchSkills,
  fetchAttendanceForStaff,
  fetchLeaveBalances,
  fetchLeaveRequests,
  fetchPayrollRecordForStaff,
  fetchCommissions,
  fetchDocuments,
  fetchEmergencyContacts,
  fetchAuditLogs,
  type StaffRow,
} from '../lib/staffRepository';

type StaffStatus = 'Active' | 'Probation' | 'Inactive' | 'Terminated';
type TabId = 'overview' | 'schedule' | 'attendance' | 'earnings' | 'documents' | 'activity';

type Shift = {
  id?: string;
  kind?: string;
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
};

type ScheduleDay = {
  working?: boolean;
  active?: boolean;
  shifts?: Shift[];
  start?: string;
  end?: string;
};

type AuditEntry = {
  id: string;
  action: string;
  timestamp: string;
  changedBy: string;
  before?: string;
  after?: string;
};

type StaffProfile = {
  id: string;
  name: string;
  role: string;
  photo?: string;
  status: StaffStatus;
  rating: number;
  joiningDate: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  accessRole: string;
  services: string[];
  skills: string[];
  hidePhone: boolean;
  gender?: string;
  dateOfBirth?: string;
  schedule: Record<string, ScheduleDay>;
  blockedTimes: Array<{ day: string; start: string; end: string; reason: string }>;
  availability: string;
  overbookingLimit: number;
  attendance: { present: number; late: number; absent: number; approvedLeave: number; leaveBalance: number };
  payroll: { salaryType: string; baseSalary: string; commission: string; bonuses: string; deductions: string; netPayout: string; statements: Array<{ period: string; amount: string; status: string }> };
  documents: Array<{ id: string; category: string; name: string; type: string; uploadedAt: string; dataUrl?: string }>;
  appAccessRevoked?: boolean;
  audit: AuditEntry[];
};

const SELECTED_STAFF_KEY = 'nexora_selected_staff_id';
const EDIT_ID_KEY = 'nexora_staff_edit_id';
const PROFILE_KEY = 'nexora_staff_profiles';
const DIRECTORY_KEY = 'nexora_staff_directory_demo';
const LEGACY_KEY = 'nexora_staff_list';
const AUDIT_KEY = 'nexora_staff_audit_log';

const AVATAR_FALLBACK = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgK4i87T9zaSWtTpAX8ftOSq5DsvdiLIMBIFtrdKRgquoy229sj4FWpkPoFbDtGT0hQkuA7BxlkH7BBMbGJVV2G2P5B8GPGRRsGpdUnXHEXv80SvpFM2Tvtb-Vl0c404jrR3FnqXOIJ8rxqBRAYFwJSWoMuZ_7dleFJcNF4HPqNuvcZOt2UNuCCs1MtCHRYsr-m8nYSAnK7kGo5LODQoilthjYlH0wE-E7gY--ZupoRur1T2oWS4o1';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'schedule', label: 'Schedule & Availability', icon: CalendarDays },
  { id: 'attendance', label: 'Attendance & Leave', icon: UserCheck },
  { id: 'earnings', label: 'Earnings & Payroll', icon: Wallet },
  { id: 'documents', label: 'Secure Documents', icon: Lock },
  { id: 'activity', label: 'Activity & Audit Log', icon: Activity },
];

const cardClass = 'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';
const mutedText = 'text-on-surface-variant';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function safeId() {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function statusFromValue(value: unknown): StaffStatus {
  const status = String(value || '').toLowerCase();
  if (status.includes('inactive') || status.includes('off-duty') || status.includes('terminated')) return 'Inactive';
  if (status.includes('probation')) return 'Probation';
  return 'Active';
}

function statusBadge(status: StaffStatus) {
  if (status === 'Active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Probation') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'Terminated') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-gray-200 bg-gray-100 text-gray-600';
}

function cloneScheduleFromProfile(profile: any): Record<string, ScheduleDay> {
  const saved = profile?.schedule || {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.reduce<Record<string, ScheduleDay>>((result, day, index) => {
    const value = saved[day];
    if (value) {
      result[day] = {
        working: value.working ?? value.active ?? true,
        active: value.active ?? value.working ?? true,
        shifts: value.shifts?.length ? value.shifts : [{ start: value.start || '09:00', end: value.end || '18:00', breakStart: '13:00', breakEnd: '14:00' }],
      };
    } else {
      result[day] = { working: index < 6, active: index < 6, shifts: [{ start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' }] };
    }
    return result;
  }, {});
}

function defaultAudit(): AuditEntry[] {
  return [
    { id: 'a-1', action: 'Staff profile created', timestamp: '2026-08-05T10:30:00.000Z', changedBy: 'Priya Sharma' },
    { id: 'a-2', action: 'Service assigned', timestamp: '2026-08-05T10:42:00.000Z', changedBy: 'Priya Sharma', after: 'Haircut, Hair Coloring, Balayage' },
    { id: 'a-3', action: 'Permission changed', timestamp: '2026-08-06T09:15:00.000Z', changedBy: 'Arjun Mehta', before: 'Bookings: View', after: 'Bookings: View, Create, Edit' },
    { id: 'a-4', action: 'Schedule changed', timestamp: '2026-08-07T16:20:00.000Z', changedBy: 'Priya Sharma', before: 'Saturday off', after: 'Saturday 09:00–16:00' },
    { id: 'a-5', action: 'Leave approved', timestamp: '2026-08-08T11:05:00.000Z', changedBy: 'Priya Sharma', after: '18 Aug 2026 – 19 Aug 2026' },
  ];
}

function profileFromLocal(selectedId: string | null): StaffProfile {
  const fallback: StaffProfile = {
    id: selectedId || 'demo-elena',
    name: 'Elena Rodriguez',
    role: 'Senior Stylist',
    photo: AVATAR_FALLBACK,
    status: 'Active',
    rating: 4.9,
    joiningDate: '12 Mar 2021',
    phone: '+91 98765 43210',
    email: 'elena@nexora.com',
    address: 'Nexora Salon, C-Scheme, Jaipur, Rajasthan',
    emergencyContact: 'Carlos Rodriguez · Brother · +91 98765 43110',
    accessRole: 'Service Provider',
    services: ['Haircut', 'Hair Coloring', 'Balayage', 'Keratin Treatment'],
    skills: ['Hair Coloring', 'Balayage', 'Bridal Hair', 'Hair Extensions'],
    hidePhone: true,
    schedule: cloneScheduleFromProfile(null),
    blockedTimes: [{ day: 'Friday', start: '13:00', end: '14:00', reason: 'Team meeting' }],
    availability: 'Available today · Next booking 2:00 PM',
    overbookingLimit: 1,
    attendance: { present: 21, late: 2, absent: 1, approvedLeave: 2, leaveBalance: 10 },
    payroll: { salaryType: 'Monthly', baseSalary: '65000', commission: '₹18,450', bonuses: '₹5,000', deductions: '₹2,100', netPayout: '₹86,350', statements: [{ period: 'July 2026', amount: '₹82,100', status: 'Paid' }, { period: 'June 2026', amount: '₹79,850', status: 'Paid' }, { period: 'May 2026', amount: '₹77,400', status: 'Paid' }] },
    documents: [
      { id: 'doc-1', category: 'Government ID Proof', name: 'elena-government-id.pdf', type: 'application/pdf', uploadedAt: '2026-08-05T10:35:00.000Z' },
      { id: 'doc-2', category: 'Skill Certificates', name: 'advanced-coloring-certificate.pdf', type: 'application/pdf', uploadedAt: '2026-08-05T10:36:00.000Z' },
    ],
    audit: defaultAudit(),
  };

  const directory = readJson<any[]>(DIRECTORY_KEY, []);
  const legacy = readJson<any[]>(LEGACY_KEY, []);
  const storedProfile = readJson<Record<string, any>>(PROFILE_KEY, {})[selectedId || ''];
  const directoryStaff = directory.find((staff) => staff.id === selectedId);
  const legacyStaff = legacy.find((staff) => staff.id === selectedId);
  const localStaff = directoryStaff || legacyStaff;

  if (!localStaff && !storedProfile) return fallback;

  const selectedServices = storedProfile?.selectedServices?.map((id: string) => ({
    haircut: 'Haircut',
    'beard-styling': 'Beard Styling',
    'hair-coloring': 'Hair Coloring',
    balayage: 'Balayage',
    'bridal-makeup': 'Bridal Makeup',
    'bridal-hair': 'Bridal Hair',
    facial: 'Facial',
    'nail-art': 'Nail Art',
    'hair-extensions': 'Hair Extensions',
    'threading-waxing': 'Threading & Waxing',
    'deep-tissue-massage': 'Deep Tissue Massage',
    'keratin-treatment': 'Keratin Treatment',
    spa: 'Spa',
  }[id] || id)) || localStaff?.skills || localStaff?.specialty?.split(/,|&/).map((item: string) => item.trim()).filter(Boolean) || fallback.services;
  const selectedSkills = storedProfile?.selectedSkills || localStaff?.skills || [];
  const storedDocs = storedProfile?.documents || [];
  const savedAudit = readJson<Record<string, AuditEntry[]>>(AUDIT_KEY, {})[selectedId || ''];

  return {
    ...fallback,
    id: selectedId || localStaff?.id || fallback.id,
    name: storedProfile?.fullName || localStaff?.name || fallback.name,
    role: storedProfile?.primaryRole || localStaff?.role || fallback.role,
    photo: storedProfile?.profilePhoto || localStaff?.avatar || fallback.photo,
    status: statusFromValue(storedProfile?.employmentStatus || localStaff?.status),
    rating: localStaff?.rating || fallback.rating,
    joiningDate: storedProfile?.joiningDate || localStaff?.joiningDate || fallback.joiningDate,
    phone: storedProfile?.mobileNumber || localStaff?.phone || fallback.phone,
    email: storedProfile?.email || localStaff?.email || fallback.email,
    address: storedProfile?.address || fallback.address,
    emergencyContact: storedProfile?.emergencyContactName ? `${storedProfile.emergencyContactName} · ${storedProfile.emergencyRelationship || 'Contact'} · ${storedProfile.emergencyMobileNumber || ''}` : fallback.emergencyContact,
    accessRole: storedProfile?.appAccessRole || fallback.accessRole,
    services: selectedServices.length ? selectedServices : fallback.services,
    skills: selectedSkills.length ? selectedSkills : fallback.skills,
    hidePhone: storedProfile?.hidePhone ?? fallback.hidePhone,
    gender: storedProfile?.gender,
    dateOfBirth: storedProfile?.dateOfBirth,
    schedule: cloneScheduleFromProfile(storedProfile),
    blockedTimes: storedProfile?.blockedTimes?.length ? storedProfile.blockedTimes : fallback.blockedTimes,
    availability: statusFromValue(storedProfile?.employmentStatus || localStaff?.status) === 'Active' ? fallback.availability : 'Not available for new bookings',
    overbookingLimit: storedProfile?.overbookingLimit ?? fallback.overbookingLimit,
    attendance: storedProfile?.attendance || fallback.attendance,
    payroll: {
      ...fallback.payroll,
      salaryType: storedProfile?.salaryType || fallback.payroll.salaryType,
      baseSalary: storedProfile?.baseSalary || fallback.payroll.baseSalary,
      commission: storedProfile?.commissionPercent ? `${storedProfile.commissionPercent}%` : fallback.payroll.commission,
    },
    documents: storedDocs.length ? storedDocs : fallback.documents,
    appAccessRevoked: Boolean(storedProfile?.appAccessRevoked),
    audit: savedAudit?.length ? savedAudit : fallback.audit,
  };
}

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function displayMoney(value: string, visible: boolean) {
  return visible ? (value.startsWith('₹') ? value : `₹${Number(value || 0).toLocaleString('en-IN')}`) : '••••••';
}

export default function StaffDetail({ navigate }: NavigationProps) {
  const selectedId = typeof window !== 'undefined' ? window.localStorage.getItem(SELECTED_STAFF_KEY) : null;
  const [staff, setStaff] = useState<StaffProfile>(() => profileFromLocal(selectedId));
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showActions, setShowActions] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadLiveStaff = async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (!shop || !selectedId || selectedId.startsWith('demo-')) return;

        // Load from Phase 1-5 tables
        const row = await fetchStaffById(supabase, selectedId);
        if (!row || cancelled) return;

        const [
          schedules, staffServices, staffSkills, allServices, allSkills,
          attendance, leaveBalances, leaveRequests, payrollRecords,
          documents, emergencyContacts, auditLogs,
        ] = await Promise.all([
          fetchStaffSchedules(supabase, row.id).catch(() => []),
          fetchStaffServices(supabase, row.id).catch(() => []),
          fetchStaffSkills(supabase, row.id).catch(() => []),
          fetchServices(supabase, shop.id).catch(() => []),
          fetchSkills(supabase, shop.id).catch(() => []),
          fetchAttendanceForStaff(supabase, row.id).catch(() => []),
          fetchLeaveBalances(supabase, row.id, new Date().getFullYear()).catch(() => []),
          fetchLeaveRequests(supabase, row.id).catch(() => []),
          fetchPayrollRecordForStaff(supabase, row.id).catch(() => []),
          fetchDocuments(supabase, row.id).catch(() => []),
          fetchEmergencyContacts(supabase, row.id).catch(() => []),
          fetchAuditLogs(supabase, shop.id, row.id).catch(() => []),
        ]);

        if (cancelled) return;

        // Map services
        const serviceNameMap = new Map((allServices as any[]).map((s: any) => [s.id, s.name]));
        const skillNameMap = new Map((allSkills as any[]).map((s: any) => [s.id, s.name]));
        const assignedServices: string[] = (staffServices as any[])
          .filter((ss: any) => ss.is_active)
          .map((ss: any) => serviceNameMap.get(ss.service_id) || 'Service');
        const assignedSkills: string[] = (staffSkills as any[])
          .map((ss: any) => skillNameMap.get(ss.skill_id) || 'Skill');

        // Map schedule
        const scheduleMap: Record<string, ScheduleDay> = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (const s of schedules) {
          const day = dayNames[s.day_of_week] || `Day ${s.day_of_week}`;
          scheduleMap[day] = {
            working: s.is_working,
            active: s.is_working,
            shifts: s.start_time && s.end_time
              ? [{ start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5), breakStart: '13:00', breakEnd: '14:00' }]
              : [],
          };
        }

        // Attendance stats
        const present = attendance.filter((a: any) => a.status === 'present').length;
        const late = attendance.filter((a: any) => a.status === 'late').length;
        const absent = attendance.filter((a: any) => a.status === 'absent').length;
        const approvedLeave = attendance.filter((a: any) => a.status === 'leave').length;
        const leaveBalanceTotal = (leaveBalances as any[]).reduce((sum: number, b: any) => sum + Number(b.remaining_days || 0), 0);

        // Payroll
        const payrollArr = payrollRecords as any[];
        const latestPayroll = payrollArr[0];
        const totalCommission = payrollArr.reduce((sum: number, r: any) => sum + Number(r.total_commission || 0), 0);
        const totalBonus = payrollArr.reduce((sum: number, r: any) => sum + Number(r.total_bonus || 0), 0);
        const totalDeductions = payrollArr.reduce((sum: number, r: any) => sum + Number(r.total_deductions || 0), 0);

        // Documents
        const docTypeLabels: Record<string, string> = {
          government_id: 'Government ID Proof',
          address_proof: 'Address Proof',
          employment_contract: 'Employment Contract',
          skill_certificate: 'Skill Certificates',
          other: 'Other',
        };
        const mappedDocs = documents.map((d: any) => ({
          id: d.id,
          category: docTypeLabels[d.document_type] || d.document_type,
          name: d.file_name,
          type: d.mime_type || 'file',
          uploadedAt: d.created_at,
        }));

        // Emergency contact
        const ec = emergencyContacts[0];
        const ecText = ec ? `${ec.name} · ${ec.relationship} · ${ec.phone}` : 'Not provided';

        // Audit log
        const mappedAudit = auditLogs.map((a: any) => ({
          id: a.id,
          action: a.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          timestamp: a.performed_at,
          changedBy: 'Manager',
          before: a.old_value ? JSON.stringify(a.old_value) : undefined,
          after: a.note || (a.new_value ? JSON.stringify(a.new_value) : undefined),
        }));

        setStaff((current) => ({
          ...current,
          id: row.id,
          name: row.full_name || row.name,
          role: row.role_title || row.primary_role || current.role,
          photo: row.profile_photo_url || row.avatar_path || current.photo,
          status: statusFromValue(row.employment_status),
          rating: Number(row.rating_average) || current.rating,
          joiningDate: row.joining_date ? formatDate(row.joining_date) : current.joiningDate,
          phone: row.phone || current.phone,
          email: row.email || current.email,
          gender: row.gender || current.gender,
          dateOfBirth: row.date_of_birth || current.dateOfBirth,
          emergencyContact: ecText,
          services: assignedServices.length ? assignedServices : current.services,
          skills: assignedSkills.length ? assignedSkills : current.skills,
          schedule: Object.keys(scheduleMap).length ? scheduleMap : current.schedule,
          attendance: { present, late, absent, approvedLeave, leaveBalance: leaveBalanceTotal || current.attendance.leaveBalance },
          payroll: {
            ...current.payroll,
            baseSalary: latestPayroll ? String(latestPayroll.base_salary) : current.payroll.baseSalary,
            commission: `₹${Math.round(totalCommission).toLocaleString('en-IN')}`,
            bonuses: `₹${Math.round(totalBonus).toLocaleString('en-IN')}`,
            deductions: `₹${Math.round(totalDeductions).toLocaleString('en-IN')}`,
            netPayout: latestPayroll ? `₹${Math.round(Number(latestPayroll.net_payable)).toLocaleString('en-IN')}` : current.payroll.netPayout,
          },
          documents: mappedDocs.length ? mappedDocs : current.documents,
          audit: mappedAudit.length ? mappedAudit : current.audit,
        }));
      } catch {
        // The local profile remains the offline fallback.
      }
    };
    void loadLiveStaff();
    return () => { cancelled = true; };
  }, [selectedId]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const appendAudit = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const nextEntry: AuditEntry = { ...entry, id: safeId(), timestamp: new Date().toISOString() };
    const all = readJson<Record<string, AuditEntry[]>>(AUDIT_KEY, {});
    const next = [nextEntry, ...(all[staff.id] || staff.audit)];
    all[staff.id] = next;
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(all));
    setStaff((current) => ({ ...current, audit: next }));
  };

  const persistStatus = (status: StaffStatus) => {
    const directory = readJson<any[]>(DIRECTORY_KEY, []);
    window.localStorage.setItem(DIRECTORY_KEY, JSON.stringify(directory.map((item) => item.id === staff.id ? { ...item, status } : item)));
    const legacy = readJson<any[]>(LEGACY_KEY, []);
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy.map((item) => item.id === staff.id ? { ...item, status: status === 'Inactive' ? 'Off-Duty' : 'Available', statusInfo: status } : item)));
    const profiles = readJson<Record<string, any>>(PROFILE_KEY, {});
    if (profiles[staff.id]) {
      profiles[staff.id] = { ...profiles[staff.id], employmentStatus: status };
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
    }
  };

  const handleDeactivate = async () => {
    setIsWorking(true);
    try {
      if (!staff.id.startsWith('demo-')) {
        await updateStaffRow(supabase, staff.id, { employment_status: 'inactive' }).catch(() => undefined);
      }
      persistStatus('Inactive');
      appendAudit({ action: 'Staff deactivated', changedBy: 'You', before: staff.status, after: 'Inactive' });
      setStaff((current) => ({ ...current, status: 'Inactive', availability: 'Not available for new bookings' }));
      setShowDeactivateModal(false);
      showToast('Staff member deactivated');
    } finally {
      setIsWorking(false);
    }
  };

  const handleRevokeAccess = () => {
    const profiles = readJson<Record<string, any>>(PROFILE_KEY, {});
    profiles[staff.id] = { ...(profiles[staff.id] || {}), appAccessRevoked: true };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
    setStaff((current) => ({ ...current, appAccessRevoked: true }));
    appendAudit({ action: 'App access revoked', changedBy: 'You', before: staff.accessRole, after: 'Revoked' });
    setShowRevokeModal(false);
    showToast('Staff app access revoked');
  };

  const handleApproveSwap = () => {
    appendAudit({ action: 'Shift swap approved', changedBy: 'You', after: 'Friday shift swapped with Marcus Chen' });
    setShowSwapModal(false);
    showToast('Shift swap approved');
  };

  const handleEdit = () => {
    window.localStorage.setItem(EDIT_ID_KEY, staff.id);
    window.localStorage.setItem(SELECTED_STAFF_KEY, staff.id);
    navigate('new-staff');
  };

  const handleReassign = () => {
    window.localStorage.setItem('booking_auto_staff_id', staff.id);
    window.localStorage.setItem('booking_auto_staff_name', staff.name);
    navigate('new-appointment');
  };

  const actions = [
    { label: 'Edit Profile', icon: Edit3, onClick: handleEdit },
    { label: 'Reassign Bookings', icon: RefreshCw, onClick: handleReassign },
    { label: 'Approve Shift Swap', icon: CheckCircle2, onClick: () => setShowSwapModal(true) },
    { label: 'Deactivate', icon: UserX, onClick: () => setShowDeactivateModal(true), danger: true },
    { label: 'Revoke App Access', icon: Ban, onClick: () => setShowRevokeModal(true), danger: true },
  ];

  const actionButtons = useMemo(() => actions, [staff.id]);

  const renderOverview = () => (
    <div className="flex flex-col gap-4">
      <section className={cardClass}>
        <div className="mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary" /><div><h2 className="text-base font-bold text-on-background">Personal &amp; Employment Details</h2><p className="text-xs text-on-surface-variant">Private information visible to managers.</p></div></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Detail label="Mobile" value={staff.hidePhone ? '••••••••••' : staff.phone} privateValue={staff.hidePhone} />
          <Detail label="Email" value={staff.email} />
          <Detail label="Address" value={staff.address} wide />
          <Detail label="Emergency Contact" value={staff.emergencyContact} wide />
          <Detail label="Joining Date" value={staff.joiningDate} />
          <Detail label="Employment Status" value={staff.status} badge={statusBadge(staff.status)} />
          <Detail label="App Access Role" value={staff.appAccessRevoked ? 'Revoked' : staff.accessRole} />
          <Detail label="Privacy Setting" value={staff.hidePhone ? 'Phone hidden from customers' : 'Phone visible to customers'} />
        </div>
      </section>
      <section className={cardClass}><div className="mb-3 flex items-center gap-2"><Scissors className="h-5 w-5 text-primary" /><h2 className="text-base font-bold text-on-background">Assigned Services</h2></div><div className="flex flex-wrap gap-2">{staff.services.map((service) => <span key={service} className="rounded-lg bg-[#ece7e7] px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant">{service}</span>)}</div></section>
      <section className={cardClass}><div className="mb-3 flex items-center gap-2"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /><h2 className="text-base font-bold text-on-background">Skills &amp; Specialization</h2></div><div className="flex flex-wrap gap-2">{staff.skills.map((skill) => <span key={skill} className="rounded-full border border-[#e0bec6] bg-[#fde7f3] px-3 py-1.5 text-xs font-semibold text-primary">{skill}</span>)}</div></section>
      <section className="flex items-start gap-3 rounded-2xl border border-[#e0bec6] bg-[#fdf1f6] p-4"><Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="text-sm font-bold text-on-background">Privacy settings</h2><p className="mt-1 text-xs leading-5 text-on-surface-variant">{staff.hidePhone ? 'Phone number is hidden from the public staff list and customers.' : 'Phone number is visible to customers according to the staff profile settings.'}</p><p className="mt-2 text-[11px] font-semibold text-primary">Manager access only · changes are recorded in the audit log.</p></div></section>
    </div>
  );

  const renderSchedule = () => (
    <div className="flex flex-col gap-4">
      <section className={cardClass}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Weekly Working Schedule</h2><p className="text-xs text-on-surface-variant">Working hours, breaks and custom shifts.</p></div><Clock className="h-5 w-5 text-primary" /></div><div className="flex flex-col gap-2">{Object.entries(staff.schedule).map(([day, schedule]) => { const value = schedule as ScheduleDay; const shifts = value.shifts || [{ start: value.start || '09:00', end: value.end || '18:00', breakStart: '13:00', breakEnd: '14:00' }]; return <div key={day} className={`rounded-xl border p-3 ${value.working ?? value.active ? 'border-[#e0bec6] bg-[#fdf8f8]' : 'border-[#e8e8e8] bg-white opacity-70'}`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-on-background">{day}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${value.working ?? value.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{value.working ?? value.active ? 'Working' : 'Day off'}</span></div>{(value.working ?? value.active) && <div className="mt-2 flex flex-col gap-2">{shifts.map((shift, index) => <div key={`${day}-${index}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant"><span className="font-bold text-on-background">Shift {index + 1}</span><span>{shift.start} – {shift.end}</span><span>Break {shift.breakStart || '—'} – {shift.breakEnd || '—'}</span><span className="rounded bg-white px-2 py-1 font-semibold">{shift.kind || 'Regular'}</span></div>)}</div>}</div>; })}</div></section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><MetricCard label="Availability" value={staff.availability} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" /><MetricCard label="Overbooking Limit" value={`${staff.overbookingLimit} booking${staff.overbookingLimit === 1 ? '' : 's'}`} icon={<Calendar className="h-5 w-5" />} tone="primary" /><MetricCard label="Next Leave" value="18–19 Aug 2026" icon={<CalendarDays className="h-5 w-5" />} tone="purple" /></div>
      <section className={cardClass}><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Blocked Time</h2><p className="text-xs text-on-surface-variant">Time not available for new bookings.</p></div><Ban className="h-5 w-5 text-primary" /></div>{staff.blockedTimes.length ? <div className="flex flex-col gap-2">{staff.blockedTimes.map((blocked, index) => <div key={`${blocked.day}-${index}`} className="flex items-center gap-3 rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3"><Clock className="h-4 w-4 text-primary" /><div><p className="text-xs font-bold text-on-background">{blocked.day} · {blocked.start} – {blocked.end}</p><p className="text-[11px] text-on-surface-variant">{blocked.reason}</p></div></div>)}</div> : <p className="text-xs text-on-surface-variant">No blocked time.</p>}</section>
      <section className={`${cardClass} border-purple-200 bg-purple-50/40`}><div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" /><div><h2 className="text-sm font-bold text-on-background">Approved Leave</h2><p className="mt-1 text-xs text-on-surface-variant">18 Aug 2026 – 19 Aug 2026 · Personal leave</p><p className="mt-2 text-[11px] font-semibold text-purple-700">Availability will automatically pause during approved leave.</p></div></div></section>
    </div>
  );

  const renderAttendance = () => (
    <div className="flex flex-col gap-4"><section className="grid grid-cols-2 gap-3 sm:grid-cols-5"><MetricCard label="Present Days" value={String(staff.attendance.present)} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" /><MetricCard label="Late Arrivals" value={String(staff.attendance.late)} icon={<Clock className="h-5 w-5" />} tone="amber" /><MetricCard label="Absences" value={String(staff.attendance.absent)} icon={<UserX className="h-5 w-5" />} tone="red" /><MetricCard label="Approved Leave" value={String(staff.attendance.approvedLeave)} icon={<CalendarDays className="h-5 w-5" />} tone="purple" /><MetricCard label="Leave Balance" value={`${staff.attendance.leaveBalance} days`} icon={<RefreshCw className="h-5 w-5" />} tone="primary" /></section><section className={cardClass}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Attendance &amp; Leave History</h2><p className="text-xs text-on-surface-variant">Recent manager-approved attendance events.</p></div><button className="rounded-xl border border-[#e0bec6] bg-white px-3 py-2 text-xs font-bold text-primary">View full history</button></div><div className="flex flex-col divide-y divide-[#e8e8e8]">{[['08 Aug 2026', 'Present', 'Clocked in 08:56 AM', 'emerald'], ['07 Aug 2026', 'Present', 'Clocked in 09:02 AM · 2 min late', 'amber'], ['06 Aug 2026', 'Approved Leave', 'Personal leave', 'purple'], ['05 Aug 2026', 'Present', 'Clocked in 08:59 AM', 'emerald']].map(([date, status, note, tone]) => <div key={date} className="flex items-center gap-3 py-3"><span className={`h-2.5 w-2.5 rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-purple-500'}`} /><div className="flex-1"><p className="text-xs font-bold text-on-background">{date} · {status}</p><p className="text-[11px] text-on-surface-variant">{note}</p></div><span className="text-[11px] font-semibold text-on-surface-variant">Manager verified</span></div>)}</div></section><section className={`${cardClass} flex items-start gap-3`}><ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="text-sm font-bold text-on-background">Leave policy</h2><p className="mt-1 text-xs leading-5 text-on-surface-variant">Leave balances and approvals are visible to managers. Approved leave automatically updates staff availability and booking capacity.</p></div></section></div>
  );

  const renderEarnings = () => (
    <div className="flex flex-col gap-4"><section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="text-sm font-bold text-amber-900">Manager Access Only</h2><p className="mt-1 text-xs leading-5 text-amber-800">Sensitive financial information is visible only to authorized managers. This view is not shown to customers or staff members.</p></div><button type="button" onClick={() => setShowPayroll((current) => !current)} className="ml-auto rounded-lg p-2 text-amber-800 hover:bg-amber-100" aria-label="Toggle payroll visibility">{showPayroll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></section><section className="grid grid-cols-2 gap-3 sm:grid-cols-5"><MetricCard label="Base Salary" value={displayMoney(staff.payroll.baseSalary, showPayroll)} icon={<Wallet className="h-5 w-5" />} tone="primary" /><MetricCard label="Commission Earned" value={displayMoney(staff.payroll.commission, showPayroll)} icon={<Scissors className="h-5 w-5" />} tone="emerald" /><MetricCard label="Bonuses" value={displayMoney(staff.payroll.bonuses, showPayroll)} icon={<Star className="h-5 w-5" />} tone="purple" /><MetricCard label="Deductions" value={displayMoney(staff.payroll.deductions, showPayroll)} icon={<Minus className="h-5 w-5" />} tone="red" /><MetricCard label="Net Payout" value={displayMoney(staff.payroll.netPayout, showPayroll)} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" /></section><section className={cardClass}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Recent Payroll Statements</h2><p className="text-xs text-on-surface-variant">{staff.payroll.salaryType} salary · authorized managers only</p></div><button className="rounded-xl border border-[#e0bec6] bg-white px-3 py-2 text-xs font-bold text-primary">Export</button></div><div className="flex flex-col divide-y divide-[#e8e8e8]">{staff.payroll.statements.map((statement) => <div key={statement.period} className="flex items-center gap-3 py-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fde7f3] text-primary"><FileText className="h-4 w-4" /></div><div className="flex-1"><p className="text-xs font-bold text-on-background">{statement.period}</p><p className="text-[11px] text-on-surface-variant">Payroll statement</p></div><span className="text-sm font-bold text-on-background">{showPayroll ? statement.amount : '••••••'}</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{statement.status}</span></div>)}</div></section></div>
  );

  const renderDocuments = () => (
    <div className="flex flex-col gap-4"><section className="flex items-center gap-3 rounded-2xl bg-[#313030] p-4 text-white"><Lock className="h-6 w-6 shrink-0 text-[#ffb0c8]" /><div><h2 className="text-sm font-bold">Manager Access Only</h2><p className="mt-1 text-xs text-white/70">These documents are private and are never displayed on the public staff profile.</p></div></section><section className={cardClass}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Secure Documents</h2><p className="text-xs text-on-surface-variant">Government ID, address proof, contracts and certificates.</p></div><ShieldCheck className="h-5 w-5 text-primary" /></div>{staff.documents.length ? <div className="flex flex-col gap-2">{staff.documents.map((document) => <div key={document.id} className="flex items-center gap-3 rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary"><FileText className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-on-background">{document.name}</p><p className="text-[11px] text-on-surface-variant">{document.category} · {document.type || 'File'} · Uploaded {formatDate(document.uploadedAt)}</p></div><button type="button" onClick={() => document.dataUrl && window.open(document.dataUrl, '_blank', 'noopener,noreferrer')} className="rounded-lg p-2 text-on-surface-variant hover:bg-white" title="Preview"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => { setStaff((current) => ({ ...current, documents: current.documents.filter((item) => item.id !== document.id) })); showToast('Document removed from this profile'); }} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button></div>)}</div> : <div className="rounded-xl border border-dashed border-[#e0bec6] p-8 text-center"><FileText className="mx-auto mb-2 h-8 w-8 text-on-surface-variant/50" /><p className="text-xs font-semibold text-on-surface-variant">No private documents uploaded.</p></div>}</section></div>
  );

  const renderActivity = () => (
    <section className={cardClass}><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Activity &amp; Audit Log</h2><p className="text-xs text-on-surface-variant">Every sensitive change is timestamped and attributed.</p></div><Activity className="h-5 w-5 text-primary" /></div><div className="relative ml-2 border-l border-[#e0bec6]">{staff.audit.map((entry) => <div key={entry.id} className="relative pb-6 pl-6 last:pb-0"><span className="absolute -left-[7px] top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-primary ring-1 ring-[#e0bec6]" /><div className="rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-bold text-on-background">{entry.action}</p><span className="text-[10px] font-semibold text-on-surface-variant">{formatDateTime(entry.timestamp)}</span></div><p className="mt-1 text-[11px] text-on-surface-variant">Changed by <b className="text-on-background">{entry.changedBy}</b></p>{(entry.before || entry.after) && <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">{entry.before && <div className="rounded-lg bg-red-50 p-2 text-red-700"><span className="block font-bold uppercase tracking-wider">Before</span>{entry.before}</div>}{entry.after && <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><span className="block font-bold uppercase tracking-wider">After</span>{entry.after}</div>}</div>}</div></div>)}</div></section>
  );

  const tabContent = activeTab === 'overview' ? renderOverview() : activeTab === 'schedule' ? renderSchedule() : activeTab === 'attendance' ? renderAttendance() : activeTab === 'earnings' ? renderEarnings() : activeTab === 'documents' ? renderDocuments() : renderActivity();

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6"><button type="button" onClick={() => navigate('staff')} aria-label="Back to staff directory" className="rounded-full p-2 text-primary transition hover:bg-[#fde7f3]"><ArrowLeft className="h-5 w-5" /></button><div className="text-center"><h1 className="text-lg font-bold tracking-tight text-primary">Staff Profile Detail</h1><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">Manager workspace</p></div><button type="button" onClick={() => setShowActions(true)} aria-label="Open manager actions" className="rounded-full p-2 text-on-surface-variant hover:bg-[#fde7f3]"><MoreVertical className="h-5 w-5" /></button></div></header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-24 sm:px-6">
        <section className={`${cardClass} mb-4 overflow-hidden`}><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-[#fde7f3] shadow-md sm:h-28 sm:w-28"><img src={staff.photo || AVATAR_FALLBACK} alt={staff.name} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = AVATAR_FALLBACK; }} /><span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${staff.status === 'Active' ? 'bg-emerald-500' : staff.status === 'Probation' ? 'bg-amber-500' : 'bg-gray-400'}`} /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold tracking-tight text-on-background">{staff.name}</h2><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadge(staff.status)}`}>{staff.status}</span></div><p className="mt-1 text-sm font-semibold text-on-surface-variant">{staff.role}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-on-surface-variant"><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {staff.rating.toFixed(1)} rating</span><span className="flex items-center gap-1"><CalendarDays className="h-4 w-4 text-primary" /> Joined {staff.joiningDate}</span></div></div></div><div className="hidden flex-wrap gap-2 sm:flex">{actionButtons.slice(0, 3).map((action) => { const Icon = action.icon; return <button key={action.label} type="button" onClick={action.onClick} className="inline-flex items-center gap-1.5 rounded-xl border border-[#e0bec6] bg-white px-3 py-2.5 text-xs font-bold text-on-surface-variant transition hover:bg-[#fde7f3] hover:text-primary"><Icon className="h-4 w-4" />{action.label}</button>; })}</div></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#e8e8e8] pt-4"><a href={`tel:${staff.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl bg-[#fde7f3] px-3 py-2.5 text-xs font-bold text-primary"><Phone className="h-4 w-4" /> Call</a><a href={`sms:${staff.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl bg-[#f7f2f2] px-3 py-2.5 text-xs font-bold text-on-surface-variant"><MessageCircle className="h-4 w-4" /> Message</a><a href={`mailto:${staff.email}`} className="flex items-center justify-center gap-1.5 rounded-xl bg-[#f7f2f2] px-3 py-2.5 text-xs font-bold text-on-surface-variant"><Mail className="h-4 w-4" /> Email</a></div></section>

        <div className="mb-4 hide-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-[#e8e8e8] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">{TABS.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-[#fdf1f6]'}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}</div>
        {tabContent}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e8e8] bg-[#fcf9f8]/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:hidden"><button type="button" onClick={() => setShowActions(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white"><MoreVertical className="h-4 w-4" /> Manager Actions</button></div>

      <AnimatePresence>{showActions && <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowActions(false)} className="fixed inset-0 z-[60] bg-black/40" /><motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 z-[70] max-h-[85vh] w-full rounded-t-2xl bg-white p-4 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"><div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#e0bec6] sm:hidden" /><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-on-background">Manager Actions</h2><p className="text-xs text-on-surface-variant">{staff.name}</p></div><button type="button" onClick={() => setShowActions(false)} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fdf1f6]"><X className="h-5 w-5" /></button></div><div className="flex flex-col gap-1">{actionButtons.map((action) => { const Icon = action.icon; return <button key={action.label} type="button" onClick={() => { setShowActions(false); action.onClick(); }} className={`flex items-center gap-3 rounded-xl p-3 text-left text-sm font-semibold transition hover:bg-[#fdf1f6] ${action.danger ? 'text-red-600' : 'text-on-background'}`}><Icon className={`h-5 w-5 ${action.danger ? 'text-red-600' : 'text-primary'}`} />{action.label}</button>; })}</div></motion.div></>}</AnimatePresence>

      <ConfirmModal open={showDeactivateModal} title="Deactivate staff member?" description="Inactive staff cannot receive new bookings or access the Nexora staff app. Existing records and payroll history will be retained." confirmLabel="Deactivate Staff" danger busy={isWorking} onCancel={() => setShowDeactivateModal(false)} onConfirm={() => void handleDeactivate()} />
      <ConfirmModal open={showRevokeModal} title="Revoke app access?" description="This immediately prevents the staff member from signing in to the Nexora staff app. Their profile and booking history will remain available to managers." confirmLabel="Revoke Access" danger onCancel={() => setShowRevokeModal(false)} onConfirm={handleRevokeAccess} />
      <ConfirmModal open={showSwapModal} title="Approve shift swap?" description="Approve the requested Friday shift swap with Marcus Chen. The schedule and audit log will be updated." confirmLabel="Approve Shift Swap" onCancel={() => setShowSwapModal(false)} onConfirm={handleApproveSwap} />

      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl"><Check className="h-4 w-4 text-emerald-300" />{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function Detail({ label, value, privateValue, wide, badge }: { label: string; value: string; privateValue?: boolean; wide?: boolean; badge?: string }) {
  return <div className={`${wide ? 'sm:col-span-2' : ''} rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3`}><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className={`mt-1 text-xs font-semibold ${badge ? `inline-flex rounded-full border px-2 py-1 ${badge}` : 'text-on-background'}`}>{value}{privateValue && <Lock className="ml-1 inline h-3 w-3 text-primary" />}</p></div>;
}

function MetricCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'emerald' | 'amber' | 'red' | 'purple' | 'primary' }) {
  const styles = tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'red' ? 'bg-red-50 text-red-700' : tone === 'purple' ? 'bg-purple-50 text-purple-700' : 'bg-[#fde7f3] text-primary';
  return <div className="rounded-2xl border border-[#e8e8e8] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"><span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${styles}`}>{icon}</span><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-1 text-base font-black leading-5 text-on-background">{value}</p></div>;
}

function ConfirmModal({ open, title, description, confirmLabel, danger, busy, onCancel, onConfirm }: { open: boolean; title: string; description: string; confirmLabel: string; danger?: boolean; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"><motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${danger ? 'bg-red-50 text-red-600' : 'bg-[#fde7f3] text-primary'}`}>{danger ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</div><h2 className="text-lg font-bold text-on-background">{title}</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p><div className="mt-5 flex gap-2"><button type="button" onClick={onCancel} disabled={busy} className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-3 text-xs font-bold text-on-surface-variant">Cancel</button><button type="button" onClick={onConfirm} disabled={busy} className={`flex-1 rounded-xl px-3 py-3 text-xs font-bold text-white disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-90'}`}>{busy ? 'Working…' : confirmLabel}</button></div></motion.div></div>;
}
