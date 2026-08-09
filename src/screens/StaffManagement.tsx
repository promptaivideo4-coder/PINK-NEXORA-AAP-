import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Badge,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Menu,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Star,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';
import {
  createStaff as createStaffRow,
  fetchMyShop,
  listStaff as fetchStaffRows,
  ShopStaff,
  updateStaff as updateStaffRow,
} from '../lib/shopRepository';

type StaffStatus = 'Available' | 'Busy' | 'On Leave' | 'Inactive';
type StatusFilter = 'All' | StaffStatus;
type DataMode = 'demo' | 'live';

type StaffMember = {
  id: string;
  name: string;
  role: string;
  skills: string[];
  phone: string;
  email: string;
  rating: number;
  status: StaffStatus;
  shift: string;
  bookingsToday: number;
  assignedServices: number;
  avatar?: string;
};

type StaffFormState = {
  name: string;
  role: string;
  skills: string;
  phone: string;
  email: string;
  status: StaffStatus;
};

const DEMO_STORAGE_KEY = 'nexora_staff_directory_demo';
const SELECTED_STAFF_KEY = 'nexora_selected_staff_id';

const ELENA_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBgK4i87T9zaSWtTpAX8ftOSq5DsvdiLIMBIFtrdKRgquoy229sj4FWpkPoFbDtGT0hQkuA7BxlkH7BBMbGJVV2G2P5B8GPGRRsGpdUnXHEXv80SvpFM2Tvtb-Vl0c404jrR3FnqXOIJ8rxqBRAYFwJSWoMuZ_7dleFJcNF4HPqNuvcZOt2UNuCCs1MtCHRYsr-m8nYSAnK7kGo5LODQoilthjYlH0wE-E7gY--ZupoRur1T2oWS4o1';
const MARCUS_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBcjDud8ipDaq3L_FuF5pK08jOkmyhGMdjKJQmJLuiF4U7zsZOL45tonoY185_wyzCGro0RCfsu64ENZzYqxYRHr1C1FC0os9uaTZNy5zusD7HiMJbgOJ8XSuzxyXYvpaFyTHgYNrhUrTaZHO2UA5neNkz-JYdQAoyhDwnx6wwkFzMdHJgnq3xn7TdAQcdGuSEuXGXQSqV0H7Gw0XvfXTMV5BYuI-mFKWD80THGvA-w0_79v7eR4yC_';

const DEMO_STAFF: StaffMember[] = [
  {
    id: 'demo-elena',
    name: 'Elena Rodriguez',
    role: 'Senior Stylist',
    skills: ['Coloring', 'Balayage', 'Extensions'],
    phone: '+91 98765 43210',
    email: 'elena@nexora.com',
    rating: 4.9,
    status: 'Available',
    shift: '9:00 AM - 6:00 PM',
    bookingsToday: 8,
    assignedServices: 12,
    avatar: ELENA_AVATAR,
  },
  {
    id: 'demo-marcus',
    name: 'Marcus Chen',
    role: 'Master Barber',
    skills: ['Fades', 'Beard Trim'],
    phone: '+91 98765 43211',
    email: 'marcus@nexora.com',
    rating: 4.8,
    status: 'Busy',
    shift: '10:00 AM - 7:00 PM',
    bookingsToday: 5,
    assignedServices: 8,
    avatar: MARCUS_AVATAR,
  },
];

const STATUS_OPTIONS: StaffStatus[] = ['Available', 'Busy', 'On Leave', 'Inactive'];
const FILTER_OPTIONS: StatusFilter[] = ['All', ...STATUS_OPTIONS];

const DEFAULT_FORM: StaffFormState = {
  name: '',
  role: 'Senior Stylist',
  skills: '',
  phone: '',
  email: '',
  status: 'Available',
};

function safeInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST';
}

function formatShift(status: StaffStatus) {
  if (status === 'On Leave') return 'Back tomorrow';
  if (status === 'Inactive') return 'Not scheduled';
  return status === 'Busy' ? '10:00 AM - 7:00 PM' : '9:00 AM - 6:00 PM';
}

function mapEmploymentStatus(value: string | null | undefined): StaffStatus {
  const normalized = String(value || '').toLowerCase().replace(/[_-]/g, ' ');
  if (normalized.includes('inactive') || normalized.includes('deactivate')) return 'Inactive';
  if (normalized.includes('leave') || normalized.includes('vacation')) return 'On Leave';
  if (normalized.includes('busy') || normalized.includes('session')) return 'Busy';
  return 'Available';
}

function toEmploymentStatus(status: StaffStatus) {
  if (status === 'On Leave') return 'on_leave';
  if (status === 'Inactive') return 'inactive';
  if (status === 'Busy') return 'busy';
  return 'active';
}

function getStoredDemoStaff(): StaffMember[] {
  if (typeof window === 'undefined') return DEMO_STAFF;
  try {
    const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!saved) return DEMO_STAFF;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_STAFF;
  } catch {
    return DEMO_STAFF;
  }
}

function storeDemoStaff(staff: StaffMember[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(staff));
  }
}

function mapShopStaff(row: ShopStaff): StaffMember {
  const status = mapEmploymentStatus(row.employmentStatus);
  return {
    id: row.id,
    name: row.name,
    role: row.role || 'Stylist',
    skills: (row.specialty || 'General Styling')
      .split(/,|&/)
      .map((skill) => skill.trim())
      .filter(Boolean),
    phone: '',
    email: '',
    rating: 0,
    status,
    shift: formatShift(status),
    bookingsToday: 0,
    assignedServices: 0,
  };
}

function Avatar({ staff, size = 'large' }: { staff: StaffMember; size?: 'large' | 'small' }) {
  const sizeClass = size === 'large' ? 'h-14 w-14' : 'h-9 w-9';
  return (
    <div className={`relative shrink-0 ${sizeClass}`}>
      <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-surface bg-[#fde7f3]">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#ffd9e2] to-[#b90064] text-sm font-bold text-[#8e004b]">
          {safeInitials(staff.name)}
        </div>
        {staff.avatar ? (
          <img
            src={staff.avatar}
            alt={`${staff.name} profile`}
            className="relative z-10 h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
      </div>
      <span
        aria-label={`${staff.name} is ${staff.status}`}
        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
          staff.status === 'Available'
            ? 'bg-emerald-500'
            : staff.status === 'Busy'
              ? 'bg-blue-500'
              : staff.status === 'On Leave'
                ? 'bg-purple-500'
                : 'bg-gray-400'
        }`}
      />
    </div>
  );
}

function StatusDot({ status }: { status: StaffStatus }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        status === 'Available'
          ? 'bg-emerald-500'
          : status === 'Busy'
            ? 'bg-blue-500'
            : status === 'On Leave'
              ? 'bg-purple-500'
              : 'bg-gray-400'
      }`}
    />
  );
}

export default function StaffManagement({ navigate }: NavigationProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>(getStoredDemoStaff);
  const [dataMode, setDataMode] = useState<DataMode>('demo');
  const [shopId, setShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<StaffFormState>(DEFAULT_FORM);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3200);
  }, []);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const shop = await fetchMyShop(supabase);
      if (!shop) {
        setShopId(null);
        setDataMode('demo');
        setStaffList(getStoredDemoStaff());
        return;
      }

      setShopId(shop.id);
      const rows = await fetchStaffRows(supabase, shop.id);
      if (rows.length > 0) {
        setDataMode('live');
        setStaffList(rows.map(mapShopStaff));
      } else {
        // A fresh workspace still gets a useful preview until the first staff member is saved.
        setDataMode('demo');
        setStaffList(getStoredDemoStaff());
      }
    } catch (error) {
      console.warn('Staff directory live data unavailable; using offline demo data.', error);
      setShopId(null);
      setDataMode('demo');
      setStaffList(getStoredDemoStaff());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const summary = useMemo(
    () => [
      { label: 'Total Staff', value: staffList.length, icon: Users, color: 'text-on-surface-variant' },
      { label: 'Available', value: staffList.filter((staff) => staff.status === 'Available').length, dot: 'bg-emerald-500' },
      { label: 'Busy', value: staffList.filter((staff) => staff.status === 'Busy').length, dot: 'bg-blue-500' },
      { label: 'On Leave', value: staffList.filter((staff) => staff.status === 'On Leave').length, dot: 'bg-purple-500' },
      { label: 'Inactive', value: staffList.filter((staff) => staff.status === 'Inactive').length, dot: 'bg-gray-400' },
    ],
    [staffList],
  );

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return staffList.filter((staff) => {
      const matchesFilter = activeFilter === 'All' || staff.status === activeFilter;
      const searchable = [staff.name, staff.role, staff.phone, staff.email, ...staff.skills].join(' ').toLowerCase();
      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [activeFilter, searchQuery, staffList]);

  const openAddForm = () => {
    setActiveStaff(null);
    setEditingStaff(null);
    setForm({ ...DEFAULT_FORM });
    setFormMode('add');
  };

  const openEditForm = (staff: StaffMember) => {
    setActiveStaff(null);
    setEditingStaff(staff);
    setForm({
      name: staff.name,
      role: staff.role,
      skills: staff.skills.join(', '),
      phone: staff.phone,
      email: staff.email,
      status: staff.status,
    });
    setFormMode('edit');
  };

  const closeForm = () => {
    if (!isSaving) {
      setFormMode(null);
      setEditingStaff(null);
    }
  };

  const handleSaveStaff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      showToast('Please enter a staff name');
      return;
    }

    const skills = form.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    setIsSaving(true);

    try {
      if (formMode === 'edit' && editingStaff) {
        const updated: StaffMember = {
          ...editingStaff,
          name: trimmedName,
          role: form.role,
          skills: skills.length ? skills : ['General Styling'],
          phone: form.phone.trim(),
          email: form.email.trim(),
          status: form.status,
          shift: formatShift(form.status),
        };
        setStaffList((current) => current.map((staff) => (staff.id === editingStaff.id ? updated : staff)));
        if (dataMode === 'live') {
          await updateStaffRow(supabase, editingStaff.id, {
            name: updated.name,
            role: updated.role,
            specialty: updated.skills.join(', '),
            employment_status: toEmploymentStatus(updated.status),
          });
        } else {
          storeDemoStaff(staffList.map((staff) => (staff.id === editingStaff.id ? updated : staff)));
        }
        showToast(`${updated.name} updated successfully`);
      } else {
        let created: StaffMember = {
          id: `demo-${Date.now()}`,
          name: trimmedName,
          role: form.role,
          skills: skills.length ? skills : ['General Styling'],
          phone: form.phone.trim(),
          email: form.email.trim(),
          rating: 0,
          status: form.status,
          shift: formatShift(form.status),
          bookingsToday: 0,
          assignedServices: 0,
        };

        if (dataMode === 'live' && shopId) {
          const row = await createStaffRow(supabase, shopId, {
            name: created.name,
            role: created.role,
            specialty: created.skills.join(', '),
          });
          created = mapShopStaff(row);
          created.phone = form.phone.trim();
          created.email = form.email.trim();
          created.status = form.status;
          created.shift = formatShift(form.status);
        }

        const nextStaff = [created, ...staffList];
        setStaffList(nextStaff);
        if (dataMode === 'demo') storeDemoStaff(nextStaff);
        showToast(`${created.name} added successfully`);
      }
      setFormMode(null);
      setEditingStaff(null);
    } catch (error: any) {
      showToast(error?.message || 'Could not save staff member');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (staff: StaffMember, status: StaffStatus) => {
    const updated = { ...staff, status, shift: formatShift(status) };
    const nextStaff = staffList.map((item) => (item.id === staff.id ? updated : item));
    setStaffList(nextStaff);
    setActiveStaff(null);
    if (dataMode === 'live') {
      try {
        await updateStaffRow(supabase, staff.id, { employment_status: toEmploymentStatus(status) });
      } catch (error: any) {
        showToast(error?.message || 'Could not update staff status');
        void loadStaff();
        return;
      }
    } else {
      storeDemoStaff(nextStaff);
    }
    showToast(`${staff.name} is now ${status}`);
  };

  const deactivateStaff = async (staff: StaffMember) => {
    await updateStatus(staff, 'Inactive');
  };

  const openStaffDetail = (staff: StaffMember) => {
    // StaffDetail is an older, richer screen. Keep a small compatibility
    // record so the directory's demo/live rows open there as well.
    const legacyStatus = staff.status === 'Busy' ? 'In-Session' : staff.status === 'Inactive' ? 'Off-Duty' : 'Available';
    const legacyRecord = {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      specialty: staff.skills.join(', '),
      phone: staff.phone,
      email: staff.email,
      rating: staff.rating,
      reviewsCount: staff.rating ? 1 : 0,
      avatar: staff.avatar,
      status: legacyStatus,
      weeklyRev: '₹0',
      bookingsThisWeek: staff.bookingsToday,
      statusInfo: staff.status,
    };
    window.localStorage.setItem('nexora_staff_list', JSON.stringify([legacyRecord]));
    window.localStorage.setItem(SELECTED_STAFF_KEY, staff.id);
    navigate('staff-detail');
  };

  const navigateFromMenu = (screen: 'dashboard' | 'bookings' | 'settings') => {
    setMobileMenuOpen(false);
    navigate(screen);
  };

  return (
    <div className="min-h-screen bg-background text-on-background antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 md:px-10">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-full p-2 text-primary transition-colors hover:bg-[#f7f2f2] md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-6 text-primary">Staff Management</h1>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant sm:block">NexoraOS</span>
            </div>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex" aria-label="Primary navigation">
            <button onClick={() => navigateFromMenu('dashboard')} className="nav-link">
              <Users className="h-[18px] w-[18px]" /> Dashboard
            </button>
            <button className="nav-link active" aria-current="page">
              <Badge className="h-[18px] w-[18px]" /> Staff
            </button>
            <button onClick={() => navigateFromMenu('bookings')} className="nav-link">
              <CalendarDays className="h-[18px] w-[18px]" /> Schedules
            </button>
            <button onClick={() => navigateFromMenu('settings')} className="nav-link">
              <Settings className="h-[18px] w-[18px]" /> Settings
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('settings')}
              aria-label="Admin settings"
              className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-[#f7f2f2] md:block"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={openAddForm}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:bg-[#b90064] active:scale-95 sm:px-4 sm:text-[13px]"
            >
              <Plus className="hidden h-4 w-4 sm:block" />
              <span>+ Add Staff</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[#e8e8e8] bg-surface md:hidden"
            >
              <div className="flex flex-col gap-1 p-3">
                <button onClick={() => navigateFromMenu('dashboard')} className="mobile-menu-link"><Users className="h-5 w-5" /> Dashboard</button>
                <button onClick={() => setMobileMenuOpen(false)} className="mobile-menu-link active"><Badge className="h-5 w-5" /> Staff</button>
                <button onClick={() => navigateFromMenu('bookings')} className="mobile-menu-link"><CalendarDays className="h-5 w-5" /> Schedules</button>
                <button onClick={() => navigateFromMenu('settings')} className="mobile-menu-link"><Settings className="h-5 w-5" /> Settings</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-24 md:px-10">
        <section className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('dashboard')}
              aria-label="Back to dashboard"
              className="-ml-2 rounded-full p-2 text-primary transition-colors hover:bg-[#f7f2f2] md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-[28px] font-bold leading-9 tracking-[-0.02em] text-on-background md:text-[32px]">Staff Directory</h2>
          </div>
          <p className="text-base text-on-surface-variant">Manage team, schedules &amp; performance</p>
          {dataMode === 'demo' && (
            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#e0bec6] bg-[#fde7f3] px-2.5 py-1 text-[11px] font-semibold text-primary">
              <AlertCircle className="h-3.5 w-3.5" /> Preview data · changes saved on this device
            </span>
          )}
        </section>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {summary.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex min-h-[104px] flex-col justify-between rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm ${index === 0 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
                  {Icon ? <Icon className="h-4 w-4" /> : <span className={`h-2 w-2 rounded-full ${item.dot}`} />}
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em]">{item.label}</span>
                </div>
                <div className="text-[28px] font-bold leading-8 text-on-background">{item.value}</div>
              </div>
            );
          })}
        </section>

        <section className="mb-8 flex flex-col gap-4">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, role, skill, or phone..."
              className="w-full rounded-t-lg border-b border-[#e8e8e8] bg-[#f7f2f2] py-3 pl-12 pr-10 text-base text-on-background outline-none transition-colors placeholder:text-on-surface-variant/70 focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition-all ${
                    isActive
                      ? 'border-primary/20 bg-[#fde7f3] text-primary shadow-sm'
                      : 'border-[#e8e8e8] bg-white text-on-surface-variant hover:bg-[#f7f2f2]'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </section>

        {isLoading ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading staff">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-[280px] animate-pulse rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
                <div className="mb-6 flex items-center gap-4"><div className="h-14 w-14 rounded-full bg-[#f0edec]" /><div className="flex-1"><div className="mb-2 h-4 w-2/3 rounded bg-[#f0edec]" /><div className="h-3 w-1/2 rounded bg-[#f0edec]" /></div></div>
                <div className="mb-6 flex gap-2"><div className="h-7 w-20 rounded bg-[#f0edec]" /><div className="h-7 w-20 rounded bg-[#f0edec]" /></div>
                <div className="grid grid-cols-2 gap-4"><div className="h-12 rounded bg-[#f0edec]" /><div className="h-12 rounded bg-[#f0edec]" /></div>
              </div>
            ))}
          </section>
        ) : filteredStaff.length > 0 ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredStaff.map((staff) => (
              <article
                key={staff.id}
                onClick={() => openStaffDetail(staff)}
                className="group relative flex cursor-pointer flex-col gap-4 rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm transition-shadow hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar staff={staff} />
                    <div className="min-w-0">
                      <h3 className="truncate text-[18px] font-semibold leading-6 text-on-background">{staff.name}</h3>
                      <p className="truncate text-[13px] font-semibold text-on-surface-variant">{staff.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveStaff(staff);
                    }}
                    aria-label={`Actions for ${staff.name}`}
                    className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-[#f7f2f2]"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex min-h-7 flex-wrap gap-2">
                  {staff.skills.map((skill) => (
                    <span key={`${staff.id}-${skill}`} className="rounded bg-[#ece7e7] px-2 py-1 text-[11px] font-medium text-on-surface-variant">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-y-3 border-t border-[#e8e8e8] pt-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant">Rating</span>
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-on-background">
                      <Star className="h-3.5 w-3.5 fill-[#eab308] text-[#eab308]" />
                      {staff.rating ? staff.rating.toFixed(1) : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant">Shift</span>
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-on-background">
                      <Clock3 className="h-3.5 w-3.5 text-on-surface-variant sm:hidden" /> {staff.shift}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant">Bookings</span>
                    <span className="text-[13px] font-semibold text-on-background">{staff.bookingsToday} Today</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-on-surface-variant">Services</span>
                    <span className="text-[13px] font-semibold text-on-background">{staff.assignedServices} Assigned</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#e8e8e8] pt-3 text-[12px] font-semibold text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><StatusDot status={staff.status} /> {staff.status}</span>
                  <span>{staff.phone || 'Contact not added'}</span>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-[#e0bec6] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fde7f3] text-primary"><Users className="h-7 w-7" /></div>
            <h3 className="text-lg font-bold text-on-background">No staff found</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-on-surface-variant">Try another search or add a new team member to your directory.</p>
            <button onClick={openAddForm} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white active:scale-95"><Plus className="h-4 w-4" /> Add Staff</button>
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 z-40 flex h-20 w-full items-center justify-around border-t border-[#e8e8e8] bg-surface px-2 pb-safe md:hidden">
        <button onClick={() => navigate('dashboard')} className="mobile-nav-link"><Users className="h-5 w-5" /><span>Dashboard</span></button>
        <button className="mobile-nav-link active"><Badge className="h-5 w-5" /><span>Staff</span></button>
        <button onClick={() => navigate('bookings')} className="mobile-nav-link"><CalendarDays className="h-5 w-5" /><span>Schedules</span></button>
        <button onClick={() => navigate('settings')} className="mobile-nav-link"><Settings className="h-5 w-5" /><span>Settings</span></button>
      </nav>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl"
            role="status"
          >
            <Check className="h-4 w-4 text-emerald-300" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {formMode && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={closeForm}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between border-b border-[#e8e8e8] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fde7f3] text-primary"><UserPlus className="h-5 w-5" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-on-background">{formMode === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}</h3>
                    <p className="text-xs text-on-surface-variant">Keep your team profile up to date.</p>
                  </div>
                </div>
                <button onClick={closeForm} aria-label="Close form" className="rounded-full p-2 text-on-surface-variant hover:bg-[#f7f2f2]"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleSaveStaff} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                  Full name *
                  <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Aanya Sharma" className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none focus:border-primary" />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                  Role / position
                  <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="appearance-none rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none focus:border-primary">
                    <option>Senior Stylist</option>
                    <option>Master Barber</option>
                    <option>Color Specialist</option>
                    <option>Junior Stylist</option>
                    <option>Nail Artist</option>
                    <option>Massage Therapist</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                  Skills (comma separated)
                  <input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="Coloring, Balayage, Extensions" className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none focus:border-primary" />
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                    Phone
                    <input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91 98765 43210" className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none focus:border-primary" />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-on-surface-variant">
                    Email
                    <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@nexora.com" className="rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none focus:border-primary" />
                  </label>
                </div>
                <div>
                  <span className="mb-2 block text-xs font-semibold text-on-surface-variant">Current status</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {STATUS_OPTIONS.map((status) => (
                      <button key={status} type="button" onClick={() => setForm({ ...form, status })} className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition-colors ${form.status === status ? 'border-primary bg-[#fde7f3] text-primary' : 'border-[#e0bec6] text-on-surface-variant hover:bg-[#f7f2f2]'}`}>
                        <StatusDot status={status} /> {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex gap-3 border-t border-[#e8e8e8] pt-4">
                  <button type="button" onClick={closeForm} className="flex-1 rounded-xl border border-[#e0bec6] py-3 text-sm font-semibold text-on-surface-variant hover:bg-[#f7f2f2]">Cancel</button>
                  <button disabled={isSaving} type="submit" className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50">{isSaving ? 'Saving…' : formMode === 'add' ? 'Add Staff' : 'Save Changes'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeStaff && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveStaff(null)} className="fixed inset-0 z-[60] bg-black/40" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 z-[70] flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-[420px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
            >
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#e0bec6] sm:hidden" />
              <div className="flex items-center justify-between border-b border-[#e8e8e8] p-4">
                <div className="flex items-center gap-3"><Avatar staff={activeStaff} size="small" /><h3 className="text-lg font-semibold text-on-background">{activeStaff.name}</h3></div>
                <button onClick={() => setActiveStaff(null)} aria-label="Close staff actions" className="rounded-full p-2 text-on-surface-variant hover:bg-[#f7f2f2]"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto p-2 pb-8">
                <button onClick={() => openStaffDetail(activeStaff)} className="sheet-action"><User className="h-5 w-5 text-on-surface-variant" /> View Profile</button>
                <button onClick={() => openEditForm(activeStaff)} className="sheet-action"><Edit3 className="h-5 w-5 text-on-surface-variant" /> Edit Staff</button>
                <button onClick={() => { window.localStorage.setItem(SELECTED_STAFF_KEY, activeStaff.id); setActiveStaff(null); navigate('bookings'); }} className="sheet-action"><CalendarDays className="h-5 w-5 text-on-surface-variant" /> View Schedule</button>
                <button onClick={() => void deactivateStaff(activeStaff)} className="sheet-action border-t border-[#e8e8e8] text-error"><AlertCircle className="h-5 w-5" /> Deactivate</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
