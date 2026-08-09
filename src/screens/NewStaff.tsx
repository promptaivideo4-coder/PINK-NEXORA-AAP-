import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Info,
  LockKeyhole,
  Mail,
  Minus,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';
import {
  createStaff as createStaffRow,
  fetchMyShop,
  updateStaff as updateStaffRow,
} from '../lib/shopRepository';

type EmploymentStatus = 'Active' | 'Probation' | 'Inactive' | 'Terminated';
type AppAccessRole = 'Manager' | 'Service Provider' | 'Receptionist' | 'Custom';
type PermissionName = 'View' | 'Create' | 'Edit' | 'Delete' | 'Approve';
type CommissionStructure = 'Percentage' | 'Fixed Amount' | 'Tiered Commission';
type SalaryType = 'Monthly' | 'Daily' | 'Hourly';
type PaymentCycle = 'Monthly' | 'Bi-weekly' | 'Weekly';
type InvitationStatus = 'Not Sent' | 'Sent' | 'Accepted' | 'Expired';
type BonusType = 'Performance Bonus' | 'Sales Incentive' | 'Festival Bonus' | 'Custom Bonus';
type ShiftKind = 'Regular' | 'Custom' | 'Overtime';
type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

type PermissionSet = Record<PermissionName, boolean>;
type PermissionMatrix = Record<string, PermissionSet>;

type Shift = {
  id: string;
  kind: ShiftKind;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

type DaySchedule = {
  working: boolean;
  shifts: Shift[];
};

type BlockedTime = {
  id: string;
  day: DayName;
  start: string;
  end: string;
  reason: string;
};

type BonusRule = {
  id: string;
  type: BonusType;
  value: string;
  note: string;
};

type Tier = {
  id: string;
  minimum: string;
  maximum: string;
  value: string;
};

type StaffDocument = {
  id: string;
  category: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  dataUrl?: string;
};

type StaffFormData = {
  profilePhoto: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  joiningDate: string;
  employmentStatus: EmploymentStatus;
  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyMobileNumber: string;
  hidePhone: boolean;
  primaryRole: string;
  appAccessRole: AppAccessRole;
  permissions: PermissionMatrix;
  selectedServices: string[];
  serviceOverrides: Record<string, string>;
  commissionStructure: CommissionStructure;
  commissionPercent: string;
  fixedCommission: string;
  tiers: Tier[];
  bonusRules: BonusRule[];
  schedule: Record<DayName, DaySchedule>;
  blockedTimes: BlockedTime[];
  selectedSkills: string[];
  customSkill: string;
  salaryType: SalaryType;
  baseSalary: string;
  paymentCycle: PaymentCycle;
  bankAccount: string;
  upi: string;
  documents: StaffDocument[];
  enableSelfService: boolean;
  inviteBySms: boolean;
  inviteByEmail: boolean;
  invitationStatus: InvitationStatus;
};

const STEPS = [
  'Basic Info',
  'Role & Access',
  'Services',
  'Commission',
  'Schedule',
  'Skills',
  'Payroll',
  'Documents',
  'Review',
];

const DAYS: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PERMISSIONS: PermissionName[] = ['View', 'Create', 'Edit', 'Delete', 'Approve'];
const MODULES = ['Dashboard', 'Bookings', 'Customers', 'Services', 'Staff', 'Website', 'Marketing', 'Payroll', 'Wallet', 'Analytics', 'Settings'];
const SENSITIVE_MODULES = ['Payroll', 'Wallet', 'Settings'];

const ROLE_OPTIONS = [
  'Senior Stylist',
  'Junior Stylist',
  'Hair Dresser',
  'Makeup Artist',
  'Nail Artist',
  'Spa Therapist',
  'Salon Manager',
  'Receptionist',
];

const ACCESS_ROLES: AppAccessRole[] = ['Manager', 'Service Provider', 'Receptionist', 'Custom'];

const SERVICES = [
  { id: 'haircut', name: 'Haircut', defaultCommission: 15 },
  { id: 'beard-styling', name: 'Beard Styling', defaultCommission: 15 },
  { id: 'hair-coloring', name: 'Hair Coloring', defaultCommission: 15 },
  { id: 'balayage', name: 'Balayage', defaultCommission: 15 },
  { id: 'bridal-makeup', name: 'Bridal Makeup', defaultCommission: 15 },
  { id: 'bridal-hair', name: 'Bridal Hair', defaultCommission: 15 },
  { id: 'facial', name: 'Facial', defaultCommission: 15 },
  { id: 'nail-art', name: 'Nail Art', defaultCommission: 15 },
  { id: 'hair-extensions', name: 'Hair Extensions', defaultCommission: 15 },
  { id: 'threading-waxing', name: 'Threading & Waxing', defaultCommission: 15 },
  { id: 'deep-tissue-massage', name: 'Deep Tissue Massage', defaultCommission: 15 },
  { id: 'keratin-treatment', name: 'Keratin Treatment', defaultCommission: 15 },
  { id: 'spa', name: 'Spa', defaultCommission: 15 },
];

const SKILLS = [
  'Hair Coloring',
  'Balayage',
  'Bridal Makeup',
  'Bridal Hair',
  'Deep Tissue',
  'Nail Art',
  'Facial Treatments',
  'Hair Extensions',
  'Threading & Waxing',
  'Beard Sculpting',
  'Keratin Treatment',
];

const DOCUMENT_TYPES = [
  'Government ID Proof',
  'Address Proof',
  'Employment Contract',
  'Skill Certificates',
  'Other Documents',
];

const BONUS_TYPES: BonusType[] = ['Performance Bonus', 'Sales Incentive', 'Festival Bonus', 'Custom Bonus'];
const FORM_STORAGE_PREFIX = 'nexora-new-staff-form';
const PROFILE_STORAGE_KEY = 'nexora_staff_profiles';
const DIRECTORY_STORAGE_KEY = 'nexora_staff_directory_demo';
const LEGACY_STAFF_STORAGE_KEY = 'nexora_staff_list';
const EDIT_ID_STORAGE_KEY = 'nexora_staff_edit_id';

const inputClass = 'w-full rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3.5 py-3 text-sm font-medium text-on-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';
const selectClass = `${inputClass} appearance-none pr-10`;
const labelClass = 'text-xs font-bold text-on-surface-variant';
const cardClass = 'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';
const softButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-[#e0bec6] bg-white px-3 py-2.5 text-xs font-bold text-on-surface-variant transition hover:bg-[#fdf1f6] active:scale-[0.98]';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyPermissionSet(): PermissionSet {
  return { View: false, Create: false, Edit: false, Delete: false, Approve: false };
}

function defaultPermissions(): PermissionMatrix {
  return MODULES.reduce<PermissionMatrix>((result, module) => {
    result[module] = emptyPermissionSet();
    return result;
  }, {});
}

function defaultShift(kind: ShiftKind = 'Regular'): Shift {
  return { id: uid('shift'), kind, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' };
}

function defaultSchedule(): Record<DayName, DaySchedule> {
  return DAYS.reduce<Record<DayName, DaySchedule>>((result, day) => {
    result[day] = { working: day !== 'Sunday', shifts: [defaultShift()] };
    return result;
  }, {} as Record<DayName, DaySchedule>);
}

function makeDefaultForm(): StaffFormData {
  return {
    profilePhoto: '',
    fullName: '',
    mobileNumber: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    joiningDate: '',
    employmentStatus: 'Active',
    emergencyContactName: '',
    emergencyRelationship: '',
    emergencyMobileNumber: '',
    hidePhone: true,
    primaryRole: 'Senior Stylist',
    appAccessRole: 'Service Provider',
    permissions: defaultPermissions(),
    selectedServices: [],
    serviceOverrides: {},
    commissionStructure: 'Percentage',
    commissionPercent: '15',
    fixedCommission: '',
    tiers: [{ id: uid('tier'), minimum: '0', maximum: '50000', value: '15' }],
    bonusRules: [],
    schedule: defaultSchedule(),
    blockedTimes: [],
    selectedSkills: [],
    customSkill: '',
    salaryType: 'Monthly',
    baseSalary: '',
    paymentCycle: 'Monthly',
    bankAccount: '',
    upi: '',
    documents: [],
    enableSelfService: false,
    inviteBySms: false,
    inviteByEmail: false,
    invitationStatus: 'Not Sent',
  };
}

function mergeSavedForm(saved: Partial<StaffFormData>, base = makeDefaultForm()): StaffFormData {
  return {
    ...base,
    ...saved,
    permissions: {
      ...base.permissions,
      ...(saved.permissions || {}),
    },
    schedule: {
      ...base.schedule,
      ...(saved.schedule || {}),
    },
    invitationStatus: saved.invitationStatus || base.invitationStatus,
  } as StaffFormData;
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

function normalizePhone(value: string) {
  return value.replace(/\D/g, '');
}

function minutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function formatMoney(value: string) {
  if (!value) return '—';
  const number = Number(value);
  return Number.isFinite(number) ? `₹${number.toLocaleString('en-IN')}` : value;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getLegacyStaff(editId: string | null) {
  if (!editId) return null;
  const directory = readJson<any[]>(DIRECTORY_STORAGE_KEY, []);
  const directoryStaff = directory.find((staff) => staff.id === editId);
  if (directoryStaff) return directoryStaff;
  const legacy = readJson<any[]>(LEGACY_STAFF_STORAGE_KEY, []);
  return legacy.find((staff) => staff.id === editId) || null;
}

function getInitialForm(editId: string | null, storageKey: string) {
  const base = makeDefaultForm();
  const savedDraft = readJson<Partial<StaffFormData> | null>(storageKey, null);
  if (savedDraft) return mergeSavedForm(savedDraft, base);

  const savedProfiles = readJson<Record<string, Partial<StaffFormData>>>(PROFILE_STORAGE_KEY, {});
  if (editId && savedProfiles[editId]) return mergeSavedForm(savedProfiles[editId], base);

  const staff = getLegacyStaff(editId);
  if (!staff) return base;
  const status: EmploymentStatus = staff.status === 'Inactive' || staff.status === 'Off-Duty' ? 'Inactive' : 'Active';
  const skillText = Array.isArray(staff.skills) ? staff.skills : String(staff.specialty || '').split(/,|&/).map((skill: string) => skill.trim()).filter(Boolean);
  return {
    ...base,
    profilePhoto: staff.avatar || '',
    fullName: staff.name || '',
    mobileNumber: staff.phone || '',
    email: staff.email || '',
    primaryRole: staff.role || 'Senior Stylist',
    employmentStatus: status,
    selectedSkills: skillText,
    selectedServices: [],
  };
}

function cloneShifts(shifts: Shift[]) {
  return shifts.map((shift) => ({ ...shift, id: uid('shift') }));
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-[#d9d2d2]'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}{required ? ' *' : ''}</span>
      {children}
      {hint && <span className="text-[11px] leading-4 text-on-surface-variant/75">{hint}</span>}
    </label>
  );
}

function ErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className="mb-4 flex flex-col gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700">
      {errors.map((error) => <div key={error} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span></div>)}
    </div>
  );
}

export default function NewStaff({ navigate }: NavigationProps) {
  const [editId] = useState<string | null>(() => (typeof window !== 'undefined' ? window.localStorage.getItem(EDIT_ID_STORAGE_KEY) : null));
  const isEditMode = Boolean(editId);
  const storageKey = `${FORM_STORAGE_PREFIX}-${editId || 'new'}`;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<StaffFormData>(() => getInitialForm(editId, storageKey));
  const [errors, setErrors] = useState<string[]>([]);
  const [searchServices, setSearchServices] = useState('');
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [showFinancials, setShowFinancials] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const patchForm = (updater: (current: StaffFormData) => StaffFormData) => {
    setForm(updater);
    setIsDirty(true);
  };

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form, storageKey]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [isDirty]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const attemptLeave = () => {
    if (!isDirty || window.confirm('You have unsaved changes. Leave without saving?')) {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(EDIT_ID_STORAGE_KEY);
      navigate('staff');
    }
  };

  const updateField = <K extends keyof StaffFormData>(field: K, value: StaffFormData[K]) => {
    patchForm((current) => ({ ...current, [field]: value }));
  };

  const validateStep = (targetStep: number) => {
    const nextErrors: string[] = [];
    const digits = normalizePhone(form.mobileNumber);
    const today = todayIso();

    if (targetStep === 1) {
      if (!form.fullName.trim()) nextErrors.push('Full Name is required.');
      if (!form.mobileNumber.trim()) nextErrors.push('Mobile Number is required.');
      if (digits.length < 10 || digits.length > 15) nextErrors.push('Enter a valid mobile number with 10–15 digits.');
      const localPhones = [
        ...readJson<any[]>(DIRECTORY_STORAGE_KEY, []),
        ...readJson<any[]>(LEGACY_STAFF_STORAGE_KEY, []),
      ]
        .filter((staff) => staff.id !== editId)
        .map((staff) => normalizePhone(String(staff.phone || '')))
        .filter(Boolean);
      if (digits && localPhones.includes(digits)) nextErrors.push('This mobile number is already assigned to another staff member.');
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.push('Enter a valid email address.');
      if (form.emergencyMobileNumber && !/^\+?[0-9\s().-]{10,18}$/.test(form.emergencyMobileNumber)) nextErrors.push('Enter a valid emergency mobile number.');
      if (form.dateOfBirth && form.dateOfBirth > today) nextErrors.push('Date of Birth cannot be in the future.');
      if (!form.joiningDate) nextErrors.push('Joining Date is required.');
      if (form.joiningDate && form.joiningDate > today) nextErrors.push('Joining Date cannot be in the future.');
      if (form.dateOfBirth && form.joiningDate && form.dateOfBirth > form.joiningDate) nextErrors.push('Joining Date must be after Date of Birth.');
    }

    if (targetStep === 2) {
      if (!form.primaryRole) nextErrors.push('Select a Primary Role.');
      if (!form.appAccessRole) nextErrors.push('Select an App Access Role.');
    }

    if (targetStep === 4) {
      if (form.commissionStructure === 'Percentage') {
        const value = Number(form.commissionPercent);
        if (!Number.isFinite(value) || value < 0 || value > 100) nextErrors.push('Commission percentage must be between 0 and 100.');
      }
      if (form.commissionStructure === 'Fixed Amount' && (!form.fixedCommission || Number(form.fixedCommission) < 0)) nextErrors.push('Enter a valid fixed commission amount.');
      if (form.commissionStructure === 'Tiered Commission') {
        if (!form.tiers.length) nextErrors.push('Add at least one commission tier.');
        form.tiers.forEach((tier, index) => {
          if (!tier.minimum || !tier.maximum || !tier.value) nextErrors.push(`Complete commission tier ${index + 1}.`);
          if (tier.minimum && tier.maximum && Number(tier.maximum) <= Number(tier.minimum)) nextErrors.push(`Tier ${index + 1} maximum must be greater than minimum.`);
          if (tier.value && (Number(tier.value) < 0 || Number(tier.value) > 100)) nextErrors.push(`Tier ${index + 1} commission must be between 0 and 100.`);
        });
      }
    }

    if (targetStep === 5) {
      const scheduleErrors = validateSchedule(form.schedule);
      nextErrors.push(...scheduleErrors);
    }

    if (targetStep === 7) {
      if (!form.baseSalary || Number(form.baseSalary) < 0) nextErrors.push('Enter a valid base salary.');
      if (!form.paymentCycle) nextErrors.push('Select a payment cycle.');
    }

    if (targetStep === 9 && form.enableSelfService && !form.inviteBySms && !form.inviteByEmail) {
      nextErrors.push('Select Send SMS Invite or Send Email Link for staff self-service access.');
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setErrors([]);
    setStep((current) => Math.min(9, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setErrors([]);
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePermission = (module: string, permission: PermissionName) => {
    patchForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [module]: { ...current.permissions[module], [permission]: !current.permissions[module][permission] },
      },
    }));
  };

  const sensitivePermissionEnabled = SENSITIVE_MODULES.some((module) => Object.values(form.permissions[module] || {}).some(Boolean));

  const filteredServices = useMemo(() => {
    const query = searchServices.trim().toLowerCase();
    return SERVICES.filter((service) => !query || service.name.toLowerCase().includes(query));
  }, [searchServices]);

  const toggleService = (serviceId: string) => {
    patchForm((current) => ({
      ...current,
      selectedServices: current.selectedServices.includes(serviceId)
        ? current.selectedServices.filter((id) => id !== serviceId)
        : [...current.selectedServices, serviceId],
    }));
  };

  const updateScheduleDay = (day: DayName, patch: Partial<DaySchedule>) => {
    patchForm((current) => ({ ...current, schedule: { ...current.schedule, [day]: { ...current.schedule[day], ...patch } } }));
  };

  const updateShift = (day: DayName, shiftId: string, patch: Partial<Shift>) => {
    patchForm((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        [day]: { ...current.schedule[day], shifts: current.schedule[day].shifts.map((shift) => shift.id === shiftId ? { ...shift, ...patch } : shift) },
      },
    }));
  };

  const addShift = (day: DayName) => {
    patchForm((current) => ({
      ...current,
      schedule: { ...current.schedule, [day]: { ...current.schedule[day], shifts: [...current.schedule[day].shifts, defaultShift('Custom')] } },
    }));
  };

  const removeShift = (day: DayName, shiftId: string) => {
    patchForm((current) => ({
      ...current,
      schedule: { ...current.schedule, [day]: { ...current.schedule[day], shifts: current.schedule[day].shifts.filter((shift) => shift.id !== shiftId) } },
    }));
  };

  const copyMondayToAll = () => {
    patchForm((current) => {
      const monday = current.schedule.Monday;
      const schedule = DAYS.reduce<Record<DayName, DaySchedule>>((result, day) => {
        result[day] = day === 'Monday' ? monday : { ...monday, shifts: cloneShifts(monday.shifts) };
        return result;
      }, {} as Record<DayName, DaySchedule>);
      return { ...current, schedule };
    });
    showToast('Monday schedule copied to all days');
  };

  const copyPreviousSchedule = () => {
    patchForm((current) => {
      const schedule = { ...current.schedule };
      DAYS.slice(1).forEach((day, index) => {
        const previous = schedule[DAYS[index]];
        schedule[day] = { ...previous, shifts: cloneShifts(previous.shifts) };
      });
      return { ...current, schedule };
    });
    showToast('Previous schedule copied forward');
  };

  const addBlockedTime = () => {
    patchForm((current) => ({
      ...current,
      blockedTimes: [...current.blockedTimes, { id: uid('blocked'), day: 'Monday', start: '18:00', end: '19:00', reason: 'Blocked time' }],
    }));
  };

  const updateBlockedTime = (id: string, patch: Partial<BlockedTime>) => {
    patchForm((current) => ({ ...current, blockedTimes: current.blockedTimes.map((blocked) => blocked.id === id ? { ...blocked, ...patch } : blocked) }));
  };

  const addBonusRule = () => {
    patchForm((current) => ({ ...current, bonusRules: [...current.bonusRules, { id: uid('bonus'), type: 'Custom Bonus', value: '5', note: '' }] }));
  };

  const addTier = () => {
    patchForm((current) => ({ ...current, tiers: [...current.tiers, { id: uid('tier'), minimum: '', maximum: '', value: '' }] }));
  };

  const updateTier = (id: string, patch: Partial<Tier>) => {
    patchForm((current) => ({ ...current, tiers: current.tiers.map((tier) => tier.id === id ? { ...tier, ...patch } : tier) }));
  };

  const addCustomSkill = () => {
    const skill = form.customSkill.trim();
    if (!skill) return;
    if (!form.selectedSkills.includes(skill)) patchForm((current) => ({ ...current, selectedSkills: [...current.selectedSkills, skill], customSkill: '' }));
  };

  const handleProfilePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField('profilePhoto', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const document: StaffDocument = {
          id: uid('document'),
          category: documentType,
          name: file.name,
          type: file.type || 'file',
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl: String(reader.result || ''),
        };
        patchForm((current) => ({ ...current, documents: [...current.documents, document] }));
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeDocument = (documentId: string) => {
    patchForm((current) => ({ ...current, documents: current.documents.filter((document) => document.id !== documentId) }));
  };

  const openDocument = (document: StaffDocument) => {
    if (document.dataUrl) window.open(document.dataUrl, '_blank', 'noopener,noreferrer');
  };

  const saveStaff = async () => {
    if (!validateStep(9)) return;
    setIsSaving(true);
    const specialty = [...form.selectedSkills, ...form.selectedServices.map((id) => SERVICES.find((service) => service.id === id)?.name || '')].filter(Boolean).join(', ') || 'General Styling';
    const directoryStatus = form.employmentStatus === 'Inactive' || form.employmentStatus === 'Terminated' ? 'Inactive' : 'Available';
    const legacyStatus = directoryStatus === 'Inactive' ? 'Off-Duty' : 'Available';
    let savedId = editId || `demo-${Date.now()}`;

    try {
      const shop = await fetchMyShop(supabase).catch(() => null);
      if (shop && (!editId || !editId.startsWith('demo-'))) {
        if (editId) {
          await updateStaffRow(supabase, editId, {
            name: form.fullName.trim(),
            role: form.primaryRole,
            specialty,
            employment_status: form.employmentStatus.toLowerCase(),
          });
        } else {
          const created = await createStaffRow(supabase, shop.id, { name: form.fullName.trim(), role: form.primaryRole, specialty });
          savedId = created.id;
          if (form.employmentStatus !== 'Active') await updateStaffRow(supabase, created.id, { employment_status: form.employmentStatus.toLowerCase() });
        }
      }

      const profiles = readJson<Record<string, StaffFormData>>(PROFILE_STORAGE_KEY, {});
      profiles[savedId] = form;
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));

      const directory = readJson<any[]>(DIRECTORY_STORAGE_KEY, []);
      const existingDirectory = directory.find((staff) => staff.id === savedId) || {};
      const directoryStaff = {
        ...existingDirectory,
        id: savedId,
        name: form.fullName.trim(),
        role: form.primaryRole,
        skills: [...form.selectedSkills, ...form.selectedServices.map((id) => SERVICES.find((service) => service.id === id)?.name || '')].filter(Boolean),
        phone: form.mobileNumber.trim(),
        email: form.email.trim(),
        rating: existingDirectory.rating || 0,
        status: directoryStatus,
        shift: form.schedule.Monday.shifts[0] ? `${form.schedule.Monday.shifts[0].start} - ${form.schedule.Monday.shifts[0].end}` : 'Not scheduled',
        bookingsToday: existingDirectory.bookingsToday || 0,
        assignedServices: form.selectedServices.length,
        avatar: form.profilePhoto || existingDirectory.avatar,
      };
      const nextDirectory = directory.filter((staff) => staff.id !== savedId);
      window.localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify([directoryStaff, ...nextDirectory]));

      const legacy = readJson<any[]>(LEGACY_STAFF_STORAGE_KEY, []);
      const legacyStaff = {
        ...legacy.find((staff) => staff.id === savedId),
        id: savedId,
        name: form.fullName.trim(),
        role: form.primaryRole,
        specialty,
        phone: form.mobileNumber.trim(),
        email: form.email.trim(),
        rating: 0,
        reviewsCount: 0,
        avatar: form.profilePhoto || undefined,
        status: legacyStatus,
        weeklyRev: '₹0',
        bookingsThisWeek: 0,
        statusInfo: form.employmentStatus,
      };
      window.localStorage.setItem(LEGACY_STAFF_STORAGE_KEY, JSON.stringify([legacyStaff, ...legacy.filter((staff) => staff.id !== savedId)]));
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(EDIT_ID_STORAGE_KEY);
      setIsDirty(false);
      showToast(isEditMode ? 'Staff member updated successfully' : 'Staff member added successfully');
      window.setTimeout(() => navigate('staff'), 650);
    } catch (error: any) {
      showToast(error?.message || 'Could not save staff member');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepOne = () => (
    <div className="flex flex-col gap-4">
      <section className={cardClass}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fde7f3] text-primary"><UserPlus className="h-5 w-5" /></div>
          <div><h2 className="text-base font-bold text-on-background">Basic &amp; Employment Info</h2><p className="text-xs text-on-surface-variant">Create a secure profile for this team member.</p></div>
        </div>
        <div className="mb-5 flex flex-col items-center gap-2">
          <label htmlFor="profile-photo" className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#fde7f3] text-primary shadow-md">
            {form.profilePhoto ? <img src={form.profilePhoto} alt="Staff profile" className="h-full w-full object-cover" /> : <Camera className="h-8 w-8" />}
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white"><Plus className="h-4 w-4" /></span>
          </label>
          <input id="profile-photo" type="file" accept="image/*" onChange={handleProfilePhoto} className="hidden" />
          <p className="text-[11px] font-semibold text-on-surface-variant">Profile Photo · optional</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" required><input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="e.g. Elena Rodriguez" className={inputClass} /></Field>
          <Field label="Mobile Number" required><input value={form.mobileNumber} onChange={(event) => updateField('mobileNumber', event.target.value)} type="tel" placeholder="+91 98765 43210" className={inputClass} /></Field>
          <Field label="Email"><input value={form.email} onChange={(event) => updateField('email', event.target.value)} type="email" placeholder="name@nexora.com" className={inputClass} /></Field>
          <Field label="Gender"><div className="relative"><select value={form.gender} onChange={(event) => updateField('gender', event.target.value)} className={selectClass}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></Field>
          <Field label="Date of Birth"><input max={todayIso()} value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} type="date" className={inputClass} /></Field>
          <Field label="Joining Date" required><input max={todayIso()} value={form.joiningDate} onChange={(event) => updateField('joiningDate', event.target.value)} type="date" className={inputClass} /></Field>
          <Field label="Employment Status" required><div className="relative"><select value={form.employmentStatus} onChange={(event) => updateField('employmentStatus', event.target.value as EmploymentStatus)} className={selectClass}><option>Active</option><option>Probation</option><option>Inactive</option><option>Terminated</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></Field>
        </div>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /><div><h2 className="text-base font-bold text-on-background">Emergency Contact</h2><p className="text-xs text-on-surface-variant">Used only when urgent assistance is needed.</p></div></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Contact Name"><input value={form.emergencyContactName} onChange={(event) => updateField('emergencyContactName', event.target.value)} placeholder="Full name" className={inputClass} /></Field>
          <Field label="Relationship"><input value={form.emergencyRelationship} onChange={(event) => updateField('emergencyRelationship', event.target.value)} placeholder="Parent, spouse..." className={inputClass} /></Field>
          <Field label="Mobile Number"><input value={form.emergencyMobileNumber} onChange={(event) => updateField('emergencyMobileNumber', event.target.value)} type="tel" placeholder="+91..." className={inputClass} /></Field>
        </div>
      </section>

      <section className={`${cardClass} flex items-center justify-between gap-4`}>
        <div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="text-sm font-bold text-on-background">Hide phone number from public staff list and customers</h2><p className="mt-1 text-xs leading-4 text-on-surface-variant">Managers can still view the private phone number.</p></div></div>
        <Toggle checked={form.hidePhone} onChange={() => updateField('hidePhone', !form.hidePhone)} label="Hide phone number" />
      </section>
    </div>
  );

  const renderStepTwo = () => (
    <div className="flex flex-col gap-4">
      <section className={cardClass}>
        <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><div><h2 className="text-base font-bold text-on-background">Role &amp; App Access</h2><p className="text-xs text-on-surface-variant">Assign responsibilities and limit access by module.</p></div></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Primary Role" required><div className="relative"><select value={form.primaryRole} onChange={(event) => updateField('primaryRole', event.target.value)} className={selectClass}>{ROLE_OPTIONS.map((role) => <option key={role}>{role}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></Field>
          <Field label="App Access Role" required><div className="relative"><select value={form.appAccessRole} onChange={(event) => updateField('appAccessRole', event.target.value as AppAccessRole)} className={selectClass}>{ACCESS_ROLES.map((role) => <option key={role}>{role}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></Field>
        </div>
        <div className="mt-5 rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3 text-xs text-on-surface-variant"><Info className="mr-1 inline h-4 w-4 text-primary" /> Choose <b>Custom</b> to control every permission individually. Role presets are still editable.</div>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Granular Permissions</h2><p className="text-xs text-on-surface-variant">Tap a permission to enable or disable it.</p></div><span className="rounded-full bg-[#fde7f3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{form.appAccessRole}</span></div>
        <div className="hide-scrollbar overflow-x-auto rounded-xl border border-[#e8e8e8]">
          <table className="min-w-[690px] w-full border-collapse text-left text-xs">
            <thead className="bg-[#f7f2f2] text-[10px] uppercase tracking-wider text-on-surface-variant"><tr><th className="px-3 py-3 font-bold">Module</th>{PERMISSIONS.map((permission) => <th key={permission} className="px-2 py-3 text-center font-bold">{permission}</th>)}</tr></thead>
            <tbody>{MODULES.map((module) => <tr key={module} className="border-t border-[#e8e8e8]"><td className="whitespace-nowrap px-3 py-3 font-semibold text-on-background">{module}{SENSITIVE_MODULES.includes(module) && <span className="ml-1 text-primary">•</span>}</td>{PERMISSIONS.map((permission) => { const enabled = Boolean(form.permissions[module]?.[permission]); return <td key={permission} className="px-2 py-2 text-center"><button type="button" role="checkbox" aria-checked={enabled} aria-label={`${module} ${permission}`} onClick={() => togglePermission(module, permission)} className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg border transition ${enabled ? 'border-primary bg-primary text-white' : 'border-[#e0bec6] bg-white text-transparent hover:border-primary'}`}><Check className="h-4 w-4" /></button></td>; })}</tr>)}</tbody>
          </table>
        </div>
        {sensitivePermissionEnabled && <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Payroll, Wallet or Settings access can expose sensitive business data. Confirm these permissions with an authorized manager.</div>}
      </section>
    </div>
  );

  const renderStepThree = () => {
    const selectedRows = SERVICES.filter((service) => form.selectedServices.includes(service.id));
    return (
      <div className="flex flex-col gap-4">
        <section className={cardClass}>
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Assigned Services</h2><p className="text-xs text-on-surface-variant">Select what this team member can perform.</p></div><span className="rounded-full bg-[#fde7f3] px-2.5 py-1 text-xs font-bold text-primary">{form.selectedServices.length} selected</span></div>
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /><input value={searchServices} onChange={(event) => setSearchServices(event.target.value)} placeholder="Search services" className={`${inputClass} pl-10`} /></div>
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => updateField('selectedServices', SERVICES.map((service) => service.id))} className={softButtonClass}>Select All</button><button type="button" onClick={() => updateField('selectedServices', [])} className={softButtonClass}>Clear All</button></div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{filteredServices.map((service) => { const selected = form.selectedServices.includes(service.id); return <button key={service.id} type="button" onClick={() => toggleService(service.id)} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${selected ? 'border-primary bg-[#fde7f3]' : 'border-[#e8e8e8] bg-white hover:bg-[#fdf8f8]'}`}><span className="flex items-center gap-2 text-sm font-semibold text-on-background"><span className={`flex h-5 w-5 items-center justify-center rounded-md border ${selected ? 'border-primary bg-primary text-white' : 'border-[#d6c8cc] text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>{service.name}</span><span className="text-[11px] font-semibold text-on-surface-variant">Default {service.defaultCommission}%</span></button>; })}</div>
        </section>

        {selectedRows.length > 0 && <section className={cardClass}><div className="mb-4"><h2 className="text-base font-bold text-on-background">Service Commission Override</h2><p className="text-xs text-on-surface-variant">Leave Override blank to use the default commission.</p></div><div className="hide-scrollbar overflow-x-auto rounded-xl border border-[#e8e8e8]"><table className="min-w-[620px] w-full border-collapse text-left text-xs"><thead className="bg-[#f7f2f2] text-[10px] uppercase tracking-wider text-on-surface-variant"><tr><th className="px-3 py-3">Service</th><th className="px-3 py-3">Default Commission</th><th className="px-3 py-3">Override</th><th className="px-3 py-3">Final Commission</th></tr></thead><tbody>{selectedRows.map((service) => { const override = form.serviceOverrides[service.id] || ''; const finalValue = override || String(service.defaultCommission); return <tr key={service.id} className="border-t border-[#e8e8e8]"><td className="px-3 py-3 font-semibold text-on-background">{service.name}</td><td className="px-3 py-3 text-on-surface-variant">{service.defaultCommission}%</td><td className="px-3 py-2"><div className="relative w-24"><input value={override} onChange={(event) => patchForm((current) => ({ ...current, serviceOverrides: { ...current.serviceOverrides, [service.id]: event.target.value } }))} type="number" min="0" max="100" placeholder="—" className="w-full rounded-lg border border-[#e0bec6] bg-white px-2 py-2 pr-6 text-xs outline-none focus:border-primary" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant">%</span></div></td><td className="px-3 py-3 font-bold text-primary">{finalValue}%</td></tr>; })}</tbody></table></div></section>}
      </div>
    );
  };

  const renderStepFour = () => (
    <div className="flex flex-col gap-4">
      <section className={cardClass}><div className="mb-4"><h2 className="text-base font-bold text-on-background">Commission Structure</h2><p className="text-xs text-on-surface-variant">Set how this staff member earns on eligible services.</p></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{(['Percentage', 'Fixed Amount', 'Tiered Commission'] as CommissionStructure[]).map((structure) => <button key={structure} type="button" onClick={() => updateField('commissionStructure', structure)} className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${form.commissionStructure === structure ? 'border-primary bg-[#fde7f3] text-primary' : 'border-[#e0bec6] bg-white text-on-surface-variant hover:bg-[#fdf8f8]'}`}>{structure}</button>)}</div>{form.commissionStructure === 'Percentage' && <div className="mt-4 max-w-xs"><Field label="Commission %"><div className="relative"><input value={form.commissionPercent} onChange={(event) => updateField('commissionPercent', event.target.value)} type="number" min="0" max="100" className={`${inputClass} pr-8`} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">%</span></div></Field></div>}{form.commissionStructure === 'Fixed Amount' && <div className="mt-4 max-w-xs"><Field label="Fixed Commission Amount"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">₹</span><input value={form.fixedCommission} onChange={(event) => updateField('fixedCommission', event.target.value)} type="number" min="0" className={`${inputClass} pl-8`} placeholder="500" /></div></Field></div>}{form.commissionStructure === 'Tiered Commission' && <div className="mt-4 flex flex-col gap-2">{form.tiers.map((tier, index) => <div key={tier.id} className="grid grid-cols-[1fr_1fr_0.8fr_auto] items-end gap-2 rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3"><Field label={index === 0 ? 'From ₹' : ''}><input value={tier.minimum} onChange={(event) => updateTier(tier.id, { minimum: event.target.value })} type="number" min="0" className={inputClass} /></Field><Field label={index === 0 ? 'To ₹' : ''}><input value={tier.maximum} onChange={(event) => updateTier(tier.id, { maximum: event.target.value })} type="number" min="0" className={inputClass} /></Field><Field label={index === 0 ? 'Commission %' : ''}><input value={tier.value} onChange={(event) => updateTier(tier.id, { value: event.target.value })} type="number" min="0" max="100" className={inputClass} /></Field><button type="button" onClick={() => patchForm((current) => ({ ...current, tiers: current.tiers.filter((item) => item.id !== tier.id) }))} disabled={form.tiers.length === 1} className="mb-1 rounded-lg p-2 text-on-surface-variant hover:bg-white disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>)}<button type="button" onClick={addTier} className={`${softButtonClass} self-start`}><Plus className="h-4 w-4" /> Add Tier</button></div>}</section>
      <section className={cardClass}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Bonus Settings</h2><p className="text-xs text-on-surface-variant">Add optional bonus rules for this staff member.</p></div><button type="button" onClick={addBonusRule} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Add Bonus Rule</button></div>{form.bonusRules.length === 0 ? <div className="rounded-xl border border-dashed border-[#e0bec6] p-5 text-center text-xs text-on-surface-variant">No bonus rules added yet.</div> : <div className="flex flex-col gap-2">{form.bonusRules.map((bonus) => <div key={bonus.id} className="grid grid-cols-1 gap-2 rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3 sm:grid-cols-[1fr_0.5fr_1fr_auto]"><Field label="Bonus Type"><select value={bonus.type} onChange={(event) => patchForm((current) => ({ ...current, bonusRules: current.bonusRules.map((item) => item.id === bonus.id ? { ...item, type: event.target.value as BonusType } : item) }))} className={selectClass}>{BONUS_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Value"><input value={bonus.value} onChange={(event) => patchForm((current) => ({ ...current, bonusRules: current.bonusRules.map((item) => item.id === bonus.id ? { ...item, value: event.target.value } : item) }))} className={inputClass} /></Field><Field label="Note"><input value={bonus.note} onChange={(event) => patchForm((current) => ({ ...current, bonusRules: current.bonusRules.map((item) => item.id === bonus.id ? { ...item, note: event.target.value } : item) }))} placeholder="Optional condition" className={inputClass} /></Field><button type="button" onClick={() => patchForm((current) => ({ ...current, bonusRules: current.bonusRules.filter((item) => item.id !== bonus.id) }))} className="self-end rounded-lg p-3 text-on-surface-variant hover:bg-white"><Trash2 className="h-4 w-4" /></button></div>)}</div>}</section>
    </div>
  );

  const renderStepFive = () => (
    <div className="flex flex-col gap-4">
      <section className={cardClass}><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Working Schedule &amp; Availability</h2><p className="text-xs text-on-surface-variant">Define regular, custom and overtime shifts.</p></div><Clock3 className="h-5 w-5 text-primary" /></div><div className="mb-4 flex flex-wrap gap-2"><button type="button" onClick={copyMondayToAll} className={softButtonClass}><Copy className="h-4 w-4" /> Copy Monday to all</button><button type="button" onClick={copyPreviousSchedule} className={softButtonClass}><Copy className="h-4 w-4" /> Copy previous schedule</button></div><div className="flex flex-col gap-3">{DAYS.map((day) => { const daySchedule = form.schedule[day]; return <div key={day} className={`rounded-xl border p-3 transition ${daySchedule.working ? 'border-[#e0bec6] bg-[#fdf8f8]' : 'border-[#e8e8e8] bg-white'}`}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Toggle checked={daySchedule.working} onChange={() => updateScheduleDay(day, { working: !daySchedule.working })} label={`${day} working`} /><div><p className="text-sm font-bold text-on-background">{day}</p><p className="text-[11px] text-on-surface-variant">{daySchedule.working ? `${daySchedule.shifts.length} shift${daySchedule.shifts.length > 1 ? 's' : ''}` : 'Day off'}</p></div></div>{daySchedule.working && <button type="button" onClick={() => addShift(day)} className="rounded-lg p-2 text-primary hover:bg-white" title="Add shift"><Plus className="h-4 w-4" /></button>}</div>{daySchedule.working && <div className="mt-3 flex flex-col gap-2">{daySchedule.shifts.map((shift, index) => <div key={shift.id} className="rounded-xl border border-[#e8e8e8] bg-white p-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Shift {index + 1}</span><div className="flex items-center gap-1"><select value={shift.kind} onChange={(event) => updateShift(day, shift.id, { kind: event.target.value as ShiftKind })} className="rounded-lg border border-[#e0bec6] bg-[#fdf8f8] px-2 py-1.5 text-[11px] font-semibold outline-none"><option>Regular</option><option>Custom</option><option>Overtime</option></select>{daySchedule.shifts.length > 1 && <button type="button" onClick={() => removeShift(day, shift.id)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}</div></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Field label="Start"><input value={shift.start} onChange={(event) => updateShift(day, shift.id, { start: event.target.value })} type="time" className={inputClass} /></Field><Field label="End"><input value={shift.end} onChange={(event) => updateShift(day, shift.id, { end: event.target.value })} type="time" className={inputClass} /></Field><Field label="Break start"><input value={shift.breakStart} onChange={(event) => updateShift(day, shift.id, { breakStart: event.target.value })} type="time" className={inputClass} /></Field><Field label="Break end"><input value={shift.breakEnd} onChange={(event) => updateShift(day, shift.id, { breakEnd: event.target.value })} type="time" className={inputClass} /></Field></div></div>)}</div>}</div>; })}</div></section>
      <section className={cardClass}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Blocked Time</h2><p className="text-xs text-on-surface-variant">Block breaks, training, meetings or personal time.</p></div><button type="button" onClick={addBlockedTime} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Block time</button></div>{form.blockedTimes.length === 0 ? <p className="rounded-xl border border-dashed border-[#e0bec6] p-4 text-center text-xs text-on-surface-variant">No blocked time added.</p> : <div className="flex flex-col gap-2">{form.blockedTimes.map((blocked) => <div key={blocked.id} className="grid grid-cols-2 gap-2 rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3 sm:grid-cols-5"><Field label="Day"><select value={blocked.day} onChange={(event) => updateBlockedTime(blocked.id, { day: event.target.value as DayName })} className={selectClass}>{DAYS.map((day) => <option key={day}>{day}</option>)}</select></Field><Field label="Start"><input type="time" value={blocked.start} onChange={(event) => updateBlockedTime(blocked.id, { start: event.target.value })} className={inputClass} /></Field><Field label="End"><input type="time" value={blocked.end} onChange={(event) => updateBlockedTime(blocked.id, { end: event.target.value })} className={inputClass} /></Field><Field label="Reason"><input value={blocked.reason} onChange={(event) => updateBlockedTime(blocked.id, { reason: event.target.value })} className={inputClass} /></Field><button type="button" onClick={() => patchForm((current) => ({ ...current, blockedTimes: current.blockedTimes.filter((item) => item.id !== blocked.id) }))} className="self-end rounded-lg p-3 text-on-surface-variant hover:bg-white"><Trash2 className="h-4 w-4" /></button></div>)}</div>}</section>
    </div>
  );

  const renderStepSix = () => (
    <div className="flex flex-col gap-4"><section className={cardClass}><div className="mb-4"><h2 className="text-base font-bold text-on-background">Skills &amp; Specialization</h2><p className="text-xs text-on-surface-variant">Select skills that appear in internal search and assignments.</p></div><div className="flex flex-wrap gap-2">{SKILLS.map((skill) => { const selected = form.selectedSkills.includes(skill); return <button key={skill} type="button" onClick={() => patchForm((current) => ({ ...current, selectedSkills: selected ? current.selectedSkills.filter((item) => item !== skill) : [...current.selectedSkills, skill] }))} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${selected ? 'border-primary bg-[#fde7f3] text-primary' : 'border-[#e0bec6] bg-white text-on-surface-variant hover:bg-[#fdf8f8]'}`}>{selected && <Check className="mr-1 inline h-3.5 w-3.5" />}{skill}</button>; })}</div></section><section className={cardClass}><h2 className="mb-3 text-base font-bold text-on-background">Add Custom Skill</h2><div className="flex flex-col gap-2 sm:flex-row"><input value={form.customSkill} onChange={(event) => updateField('customSkill', event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomSkill(); } }} placeholder="e.g. Creative Color Correction" className={`${inputClass} flex-1`} /><button type="button" onClick={addCustomSkill} className="rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white"><Plus className="mr-1 inline h-4 w-4" /> Add Skill</button></div>{form.selectedSkills.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{form.selectedSkills.map((skill) => <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-[#ece7e7] px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant">{skill}<button type="button" onClick={() => patchForm((current) => ({ ...current, selectedSkills: current.selectedSkills.filter((item) => item !== skill) }))}><X className="h-3.5 w-3.5" /></button></span>)}</div>}</section></div>
  );

  const renderStepSeven = () => (
    <div className="flex flex-col gap-4"><section className={cardClass}><div className="mb-4 flex items-center gap-2"><WalletIcon /><div><h2 className="text-base font-bold text-on-background">Payroll &amp; Payment</h2><p className="text-xs text-on-surface-variant">Keep compensation details private and manager-controlled.</p></div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Field label="Salary Type"><div className="relative"><select value={form.salaryType} onChange={(event) => updateField('salaryType', event.target.value as SalaryType)} className={selectClass}><option>Monthly</option><option>Daily</option><option>Hourly</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></Field><Field label="Base Salary"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">₹</span><input type="number" min="0" value={form.baseSalary} onChange={(event) => updateField('baseSalary', event.target.value)} placeholder="50,000" className={`${inputClass} pl-8`} /></div></Field><Field label="Payment Cycle"><div className="relative"><select value={form.paymentCycle} onChange={(event) => updateField('paymentCycle', event.target.value as PaymentCycle)} className={selectClass}><option>Monthly</option><option>Bi-weekly</option><option>Weekly</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div></Field></div></section><section className={cardClass}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Payment Details</h2><p className="text-xs text-on-surface-variant">Payment information is private and visible only to authorized managers.</p></div><button type="button" onClick={() => setShowFinancials((current) => !current)} className="rounded-full p-2 text-on-surface-variant hover:bg-[#fdf1f6]" aria-label={showFinancials ? 'Hide financial fields' : 'Show financial fields'}>{showFinancials ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Bank Account"><input type={showFinancials ? 'text' : 'password'} value={form.bankAccount} onChange={(event) => updateField('bankAccount', event.target.value)} placeholder="Account number" className={inputClass} /></Field><Field label="UPI"><input type={showFinancials ? 'text' : 'password'} value={form.upi} onChange={(event) => updateField('upi', event.target.value)} placeholder="name@upi" className={inputClass} /></Field></div><div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e0bec6] bg-[#fdf8f8] p-3 text-xs text-on-surface-variant"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Payment information is private and visible only to authorized managers.</div></section></div>
  );

  const renderStepEight = () => (
    <div className="flex flex-col gap-4"><section className={cardClass}><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-primary" /><div><h2 className="text-base font-bold text-on-background">Private Documents</h2><p className="text-xs text-on-surface-variant">Secure staff records with manager-only access.</p></div></div><span className="rounded-full bg-[#313030] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Private — Manager Access Only</span></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]"><div className="relative"><select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className={selectClass}>{DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white"><Upload className="h-4 w-4" /> Upload Document<input type="file" onChange={handleDocumentUpload} className="hidden" /></label></div><p className="mt-2 text-[11px] text-on-surface-variant">Supported files are stored locally for this preview. Connect private storage before production use.</p></section><section className={cardClass}><h2 className="mb-3 text-base font-bold text-on-background">Uploaded Documents ({form.documents.length})</h2>{form.documents.length === 0 ? <div className="rounded-xl border border-dashed border-[#e0bec6] p-7 text-center"><FileText className="mx-auto mb-2 h-8 w-8 text-on-surface-variant/60" /><p className="text-xs font-semibold text-on-surface-variant">No private documents uploaded.</p></div> : <div className="flex flex-col gap-2">{form.documents.map((document) => <div key={document.id} className="flex items-center gap-3 rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary"><FileText className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-on-background">{document.name}</p><p className="text-[11px] text-on-surface-variant">{document.category} · {document.type || 'file'} · {formatFileSize(document.size)} · {new Date(document.uploadedAt).toLocaleDateString()}</p></div><button type="button" onClick={() => openDocument(document)} className="rounded-lg p-2 text-on-surface-variant hover:bg-white" title="Preview"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => removeDocument(document.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button></div>)}</div>}</section></div>
  );

  const renderStepNine = () => {
    const selectedServiceNames = form.selectedServices.map((id) => SERVICES.find((service) => service.id === id)?.name).filter(Boolean).join(', ');
    const workingDays = DAYS.filter((day) => form.schedule[day].working).join(', ');
    return (
      <div className="flex flex-col gap-4"><section className={cardClass}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-on-background">Staff App Invitation</h2><p className="text-xs text-on-surface-variant">Invite this staff member to manage their own schedule and bookings.</p></div><Toggle checked={form.enableSelfService} onChange={() => updateField('enableSelfService', !form.enableSelfService)} label="Enable Staff Self-Service Access" /></div>{form.enableSelfService ? <div className="flex flex-col gap-3"><div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><button type="button" onClick={() => updateField('inviteBySms', !form.inviteBySms)} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${form.inviteBySms ? 'border-primary bg-[#fde7f3]' : 'border-[#e0bec6] bg-white'}`}><Phone className="h-5 w-5 text-primary" /><span><b className="block text-xs text-on-background">Send SMS Invite</b><small className="text-[11px] text-on-surface-variant">Send to mobile number</small></span><span className={`ml-auto h-5 w-5 rounded-md border ${form.inviteBySms ? 'border-primary bg-primary' : 'border-[#d6c8cc]'}`}>{form.inviteBySms && <Check className="h-4 w-4 text-white" />}</span></button><button type="button" onClick={() => updateField('inviteByEmail', !form.inviteByEmail)} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${form.inviteByEmail ? 'border-primary bg-[#fde7f3]' : 'border-[#e0bec6] bg-white'}`}><Mail className="h-5 w-5 text-primary" /><span><b className="block text-xs text-on-background">Send Email Link</b><small className="text-[11px] text-on-surface-variant">Send secure sign-in link</small></span><span className={`ml-auto h-5 w-5 rounded-md border ${form.inviteByEmail ? 'border-primary bg-primary' : 'border-[#d6c8cc]'}`}>{form.inviteByEmail && <Check className="h-4 w-4 text-white" />}</span></button></div><div className="flex items-center gap-3 rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3"><Info className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-xs font-bold text-on-background">Invitation status</p><p className="text-[11px] text-on-surface-variant">Status is updated after the invite is sent.</p></div><select value={form.invitationStatus} onChange={(event) => updateField('invitationStatus', event.target.value as InvitationStatus)} className="rounded-lg border border-[#e0bec6] bg-white px-2 py-2 text-xs font-semibold outline-none"><option>Not Sent</option><option>Sent</option><option>Accepted</option><option>Expired</option></select></div><button type="button" onClick={() => { if (form.inviteBySms || form.inviteByEmail) { updateField('invitationStatus', 'Sent'); showToast('Invitation marked as sent'); } else showToast('Select an invite channel first'); }} className={softButtonClass}>Send invitation now</button></div> : <div className="rounded-xl border border-dashed border-[#e0bec6] p-5 text-center text-xs text-on-surface-variant">Self-service access is disabled. You can enable it later from the staff profile.</div>}</section><section className={cardClass}><div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /><div><h2 className="text-base font-bold text-on-background">Final Review</h2><p className="text-xs text-on-surface-variant">Review all information before saving.</p></div></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{[['Basic & Employment', `${form.fullName || '—'} · ${form.mobileNumber || 'No mobile'} · ${form.employmentStatus}`], ['Role & Access', `${form.primaryRole} · ${form.appAccessRole}`], ['Assigned Services', selectedServiceNames || 'None selected'], ['Commission', form.commissionStructure === 'Percentage' ? `${form.commissionPercent || '0'}%` : form.commissionStructure], ['Working Days', workingDays || 'No working days'], ['Skills', form.selectedSkills.join(', ') || 'None selected'], ['Payroll', `${form.salaryType} · ${formatMoney(form.baseSalary)}`], ['Private Documents', `${form.documents.length} uploaded`], ['Invitation', form.enableSelfService ? `${form.invitationStatus} · ${form.inviteBySms ? 'SMS ' : ''}${form.inviteByEmail ? 'Email' : ''}` : 'Disabled']].map(([title, value]) => <div key={title} className="rounded-xl border border-[#e8e8e8] bg-[#fdf8f8] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{title}</p><p className="mt-1 text-xs font-semibold text-on-background">{value}</p></div>)}</div><div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Confirm the details above before saving this staff member.</div></section></div>
    );
  };

  const renderStep = () => {
    if (step === 1) return renderStepOne();
    if (step === 2) return renderStepTwo();
    if (step === 3) return renderStepThree();
    if (step === 4) return renderStepFour();
    if (step === 5) return renderStepFive();
    if (step === 6) return renderStepSix();
    if (step === 7) return renderStepSeven();
    if (step === 8) return renderStepEight();
    return renderStepNine();
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={attemptLeave} aria-label="Back to staff directory" className="rounded-full p-2 text-primary transition hover:bg-[#fde7f3]"><ArrowLeft className="h-5 w-5" /></button>
          <div className="text-center"><h1 className="text-lg font-bold tracking-tight text-primary">{isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}</h1><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">NexoraOS · Staff Management</p></div>
          <span className="w-9" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-36 pt-24 sm:px-6">
        <section className="mb-5 rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Staff onboarding</p><h2 className="mt-1 text-xl font-bold text-on-background">Step {step} of 9</h2></div><span className="text-xs font-bold text-on-surface-variant">{Math.round((step / 9) * 100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#ece7e7]"><motion.div initial={false} animate={{ width: `${(step / 9) * 100}%` }} className="h-full rounded-full bg-primary transition-all" /></div><div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">{STEPS.map((stepName, index) => { const number = index + 1; const active = number === step; const complete = number < step; return <button type="button" key={stepName} onClick={() => { if (number < step) { setErrors([]); setStep(number); } }} className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold transition ${active ? 'bg-primary text-white' : complete ? 'bg-[#fde7f3] text-primary' : 'bg-[#f7f2f2] text-on-surface-variant'}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? 'bg-white/20' : complete ? 'bg-primary text-white' : 'bg-white'}`}>{complete ? <Check className="h-3 w-3" /> : number}</span><span>{stepName}</span></button>; })}</div></section>
        <ErrorList errors={errors} />
        {renderStep()}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e8e8] bg-[#fcf9f8]/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6"><div className="mx-auto flex w-full max-w-3xl items-center gap-2"><button type="button" onClick={attemptLeave} className="flex-1 rounded-xl border border-[#e0bec6] bg-white px-3 py-3 text-xs font-bold text-on-surface-variant transition hover:bg-[#fdf1f6]">Cancel</button>{step > 1 && <button type="button" onClick={goBack} className="flex-1 rounded-xl border border-[#e0bec6] bg-white px-3 py-3 text-xs font-bold text-on-surface-variant transition hover:bg-[#fdf1f6]"><ChevronLeft className="mr-1 inline h-4 w-4" /> Back</button>}{step < 9 ? <button type="button" onClick={goNext} className="flex-[1.4] rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99]">Next <ArrowRight className="ml-1 inline h-4 w-4" /></button> : <button type="button" disabled={isSaving} onClick={() => void saveStaff()} className="flex-[1.5] rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50">{isSaving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Save & Add Staff'}</button>}</div></div>

      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl"><Check className="h-4 w-4 text-emerald-300" />{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function validateSchedule(schedule: Record<DayName, DaySchedule>) {
  const errors: string[] = [];
  DAYS.forEach((day) => {
    const daySchedule = schedule[day];
    if (!daySchedule.working) return;
    if (!daySchedule.shifts.length) {
      errors.push(`${day} needs at least one shift or should be marked as a day off.`);
      return;
    }
    const intervals: Array<[number, number]> = [];
    daySchedule.shifts.forEach((shift, index) => {
      const start = minutes(shift.start);
      const end = minutes(shift.end);
      if (end <= start) errors.push(`${day} Shift ${index + 1}: End time must be after start time.`);
      if ((shift.breakStart && !shift.breakEnd) || (!shift.breakStart && shift.breakEnd)) errors.push(`${day} Shift ${index + 1}: Add both break start and break end.`);
      if (shift.breakStart && shift.breakEnd) {
        const breakStart = minutes(shift.breakStart);
        const breakEnd = minutes(shift.breakEnd);
        if (breakEnd <= breakStart || breakStart < start || breakEnd > end) errors.push(`${day} Shift ${index + 1}: Break must be inside working hours.`);
      }
      intervals.push([start, end]);
    });
    intervals.sort((a, b) => a[0] - b[0]);
    intervals.slice(1).forEach((interval, index) => {
      if (interval[0] < intervals[index][1]) errors.push(`${day}: Shifts cannot overlap.`);
    });
  });
  return Array.from(new Set(errors));
}

function WalletIcon() {
  return <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fde7f3] text-primary"><span className="text-lg font-black">₹</span></span>;
}
