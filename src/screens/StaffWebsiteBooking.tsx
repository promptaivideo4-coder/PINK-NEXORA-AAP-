import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Info,
  LockKeyhole,
  MapPin,
  Phone,
  Settings,
  Shield,
  ShieldAlert,
  Star,
  ToggleLeft,
  ToggleRight,
  User,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';
import { fetchMyShop } from '../lib/shopRepository';
import {
  fetchStaffList,
  fetchStaffServices,
  fetchStaffSkills,
  fetchServices,
  fetchSkills,
  getAvailableSlots,
  type StaffRow,
} from '../lib/staffRepository';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

type ViewMode = 'manager' | 'customer';

type VisibilitySettings = {
  showStaffOnWebsite: boolean;
  showProfilePhoto: boolean;
  showRatings: boolean;
  showExperience: boolean;
  showSkills: boolean;
  showServices: boolean;
  allowStaffSelection: boolean;
  showPhoneNumber: boolean;
};

type StaffMember = {
  id: string;
  name: string;
  title: string;
  experience: string;
  rating: number;
  bio: string;
  skills: string[];
  services: { name: string; price: number; duration: string }[];
  avatar?: string;
  phone?: string;
};

type TimeSlot = {
  time: string;
  available: boolean;
  reason?: string;
};

type BookingStep = 'service' | 'staff' | 'date' | 'time' | 'summary';

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */

const VISIBILITY_KEY = 'nexora_website_staff_visibility';
const BOOKING_KEY = 'nexora_public_booking_state';

const CARD_CLASS =
  'rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:p-5';

const AVATAR_ELENA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBgK4i87T9zaSWtTpAX8ftOSq5DsvdiLIMBIFtrdKRgquoy229sj4FWpkPoFbDtGT0hQkuA7BxlkH7BBMbGJVV2G2P5B8GPGRRsGpdUnXHEXv80SvpFM2Tvtb-Vl0c404jrR3FnqXOIJ8rxqBRAYFwJSWoMuZ_7dleFJcNF4HPqNuvcZOt2UNuCCs1MtCHRYsr-m8nYSAnK7kGo5LODQoilthjYlH0wE-E7gY--ZupoRur1T2oWS4o1';
const AVATAR_MARCUS =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBcjDud8ipDaq3L_FuF5pK08jOkmyhGMdjKJQmJLuiF4U7zsZOL45tonoY185_wyzCGro0RCfsu64ENZzYqxYRHr1C1FC0os9uaTZNy5zusD7HiMJbgOJ8XSuzxyXYvpaFyTHgYNrhUrTaZHO2UA5neNkz-JYdQAoyhDwnx6wwkFzMdHJgnq3xn7TdAQcdGuSEuXGXQSqV0H7Gw0XvfXTMV5BYuI-mFKWD80THGvA-w0_79v7eR4yC_';

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

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

function safeInitials(name: string) {
  return name.trim().split(/\s+/).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'ST';
}

function isManager() {
  if (typeof window === 'undefined') return true;
  const role = (window.localStorage.getItem('nexora-user-role') || window.localStorage.getItem('nexora-demo-role') || 'owner').toLowerCase();
  return ['owner', 'manager', 'admin', 'salon_owner'].some((allowed) => role.includes(allowed));
}

/* ═══════════════════════════════════════════════════════
   DEMO DATA
   ═══════════════════════════════════════════════════════ */

const DEFAULT_VISIBILITY: VisibilitySettings = {
  showStaffOnWebsite: true,
  showProfilePhoto: true,
  showRatings: true,
  showExperience: true,
  showSkills: true,
  showServices: true,
  allowStaffSelection: true,
  showPhoneNumber: false,
};

function demoStaff(): StaffMember[] {
  return [
    {
      id: 's1',
      name: 'Rahul Sharma',
      title: 'Senior Stylist',
      experience: '8+ Years Experience',
      rating: 4.9,
      bio: 'Award-winning stylist specializing in modern cuts, coloring, and bridal styling. Trained at Vidal Sassoon Academy, London.',
      skills: ['Hair Coloring', 'Balayage', 'Bridal Styling', 'Haircuts', 'Keratin Treatment'],
      services: [
        { name: 'Haircut & Styling', price: 800, duration: '45 min' },
        { name: 'Hair Coloring', price: 2500, duration: '1.5 hrs' },
        { name: 'Balayage', price: 4500, duration: '2.5 hrs' },
        { name: 'Bridal Makeup', price: 12000, duration: '3 hrs' },
        { name: 'Keratin Treatment', price: 5000, duration: '2 hrs' },
      ],
      avatar: AVATAR_MARCUS,
      phone: '+91 98765 43210',
    },
    {
      id: 's2',
      name: 'Priya Kapoor',
      title: 'Color Specialist',
      experience: '6+ Years Experience',
      rating: 4.8,
      bio: 'International color expert with certifications from Wella and L\'Oréal. Passionate about creating personalized color transformations.',
      skills: ['Color Correction', 'Highlights', 'Global Color', 'Balayage', 'Ombre'],
      services: [
        { name: 'Global Hair Color', price: 3000, duration: '2 hrs' },
        { name: 'Highlights', price: 3500, duration: '2 hrs' },
        { name: 'Color Correction', price: 5000, duration: '3 hrs' },
        { name: 'Balayage', price: 4500, duration: '2.5 hrs' },
      ],
      avatar: AVATAR_ELENA,
      phone: '+91 98765 43211',
    },
    {
      id: 's3',
      name: 'Amit Patel',
      title: 'Master Barber',
      experience: '10+ Years Experience',
      rating: 4.7,
      bio: 'Veteran barber known for precision fades, beard sculpting, and classic gentleman\'s grooming. Featured in GQ India.',
      skills: ['Fades', 'Beard Trim', 'Classic Cuts', 'Hot Towel Shave', 'Scalp Treatment'],
      services: [
        { name: 'Classic Haircut', price: 500, duration: '30 min' },
        { name: 'Premium Fade', price: 800, duration: '45 min' },
        { name: 'Beard Sculpting', price: 400, duration: '30 min' },
        { name: 'Hot Towel Shave', price: 600, duration: '45 min' },
        { name: 'Grooming Package', price: 1200, duration: '1.5 hrs' },
      ],
      avatar: undefined,
      phone: '+91 98765 43212',
    },
    {
      id: 's4',
      name: 'Sanya Reddy',
      title: 'Nail Artist',
      experience: '5+ Years Experience',
      rating: 4.9,
      bio: 'Creative nail artist specializing in gel extensions, nail art, and luxury manicures. Winner of India Nail Art Championship 2024.',
      skills: ['Gel Nails', 'Nail Art', 'Manicure', 'Pedicure', 'Nail Extensions'],
      services: [
        { name: 'Classic Manicure', price: 600, duration: '45 min' },
        { name: 'Gel Nails', price: 1500, duration: '1 hr' },
        { name: 'Nail Art (per nail)', price: 200, duration: '15 min' },
        { name: 'Luxury Pedicure', price: 1200, duration: '1 hr' },
      ],
      avatar: undefined,
      phone: '+91 98765 43213',
    },
  ];
}

function generateDemoTimeSlots(staffId: string, date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 9;
  const endHour = 18;
  const breakStart = 13;
  const breakEnd = 14;
  const seed = (date + staffId).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bookedSlots = new Set<number>();
  for (let i = 0; i < 3; i++) {
    bookedSlots.add(((seed * (i + 1) * 7) % (endHour - startHour)) + startHour);
  }
  for (let h = startHour; h < endHour; h++) {
    const hh = String(h).padStart(2, '0');
    const time = `${hh}:00`;
    const isBreak = h >= breakStart && h < breakEnd;
    const isBooked = bookedSlots.has(h);
    if (isBreak) {
      slots.push({ time, available: false, reason: 'Break' });
    } else if (isBooked) {
      slots.push({ time, available: false, reason: 'Already booked' });
    } else {
      slots.push({ time, available: true });
    }
  }
  return slots;
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function StaffWebsiteBooking({ navigate }: NavigationProps) {
  const isMgr = isManager();
  const [viewMode, setViewMode] = useState<ViewMode>(isMgr ? 'manager' : 'customer');
  const [visibility, setVisibility] = useState<VisibilitySettings>(() =>
    readJson(VISIBILITY_KEY, DEFAULT_VISIBILITY),
  );
  const [staffList, setStaffList] = useState<StaffMember[]>(demoStaff);

  // Load real public staff data from Supabase
  useEffect(() => {
    let cancelled = false;
    const loadPublicStaff = async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (!shop || cancelled) return;
        const staffRows = await fetchStaffList(supabase, shop.id);
        const publicStaff = staffRows.filter((s) => s.is_public && s.is_active && !s.deleted_at);
        if (!publicStaff.length || cancelled) return;
        const enriched = await Promise.all(
          publicStaff.map(async (row) => {
            const [staffServices, staffSkills, allServices, allSkills] = await Promise.all([
              fetchStaffServices(supabase, row.id).catch(() => []),
              fetchStaffSkills(supabase, row.id).catch(() => []),
              fetchServices(supabase, shop.id).catch(() => []),
              fetchSkills(supabase, shop.id).catch(() => []),
            ]);
            const svcMap = new Map((allServices as any[]).map((s: any) => [s.id, s]));
            const skillMap = new Map((allSkills as any[]).map((s: any) => [s.id, s.name]));
            const services = staffServices
              .filter((ss: any) => ss.is_active)
              .map((ss: any) => {
                const svc = svcMap.get(ss.service_id);
                return svc
                  ? { name: svc.name, price: Math.round((ss.custom_price_paise || svc.price_paise) / 100), duration: `${ss.custom_duration_minutes || svc.duration_minutes} min` }
                  : null;
              })
              .filter(Boolean) as { name: string; price: number; duration: string }[];
            const skills = staffSkills.map((ss: any) => skillMap.get(ss.skill_id) || 'Skill');
            return {
              id: row.id,
              name: row.full_name || row.name,
              title: row.role_title || row.primary_role || 'Stylist',
              experience: `${row.experience_years || 0}+ Years Experience`,
              rating: Number(row.rating_average) || 0,
              bio: row.bio || `Professional ${row.role_title || 'stylist'} at our salon.`,
              skills: skills.length ? skills : ['General Styling'],
              services: services.length ? services : [],
              avatar: row.profile_photo_url || row.avatar_path || undefined,
              phone: visibility.showPhoneNumber ? (row.phone || undefined) : undefined,
            } as StaffMember;
          }),
        );
        if (!cancelled && enriched.length) {
          setStaffList(enriched);
        }
      } catch {
        // Keep demo data as fallback
      }
    };
    void loadPublicStaff();
    return () => { cancelled = true; };
  }, [visibility.showPhoneNumber]);
  const [toast, setToast] = useState<string | null>(null);

  // Customer booking flow
  const [bookingStep, setBookingStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<StaffMember | null>(null);
  const [showBookingConfirmed, setShowBookingConfirmed] = useState(false);

  // Persist visibility
  useEffect(() => {
    window.localStorage.setItem(VISIBILITY_KEY, JSON.stringify(visibility));
  }, [visibility]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId) || null,
    [staffList, selectedStaffId],
  );

  const allServices = useMemo(() => {
    const map = new Map<string, { name: string; price: number; duration: string }>();
    for (const staff of staffList) {
      for (const svc of staff.services) {
        if (!map.has(svc.name)) map.set(svc.name, svc);
      }
    }
    return Array.from(map.values());
  }, [staffList]);

  const staffForService = useMemo(() => {
    if (!selectedService) return staffList;
    return staffList.filter((s) => s.services.some((svc) => svc.name === selectedService));
  }, [staffList, selectedService]);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const selectedServiceData = useMemo(
    () => allServices.find((s) => s.name === selectedService) || null,
    [allServices, selectedService],
  );

  // Load real available slots from Supabase RPC
  useEffect(() => {
    if (!selectedStaffId || !selectedDate) {
      setTimeSlots([]);
      return;
    }
    let cancelled = false;
    const loadSlots = async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (!shop || cancelled) return;
        const service = selectedServiceData || allServices[0];
        if (!service || cancelled) return;
        const allSvc = await fetchServices(supabase, shop.id);
        const serviceRow = (allSvc as any[]).find((s: any) => s.name === service.name);
        if (!serviceRow || cancelled) return;
        const slots = await getAvailableSlots(supabase, shop.id, selectedStaffId, serviceRow.id, selectedDate);
        if (cancelled) return;
        if (slots.length) {
          const hourMap = new Map<string, boolean>();
          for (const slot of slots) {
            const hour = slot.slot_start.split('T')[1]?.slice(0, 5) || slot.slot_start.slice(11, 16);
            hourMap.set(hour.slice(0, 2) + ':00', true);
          }
          const allHours: TimeSlot[] = [];
          for (let h = 9; h < 18; h++) {
            const hh = String(h).padStart(2, '0') + ':00';
            allHours.push({ time: hh, available: hourMap.has(hh), reason: hourMap.has(hh) ? undefined : 'Unavailable' });
          }
          setTimeSlots(allHours);
        } else {
          setTimeSlots(generateDemoTimeSlots(selectedStaffId, selectedDate));
        }
      } catch {
        if (!cancelled) setTimeSlots(generateDemoTimeSlots(selectedStaffId, selectedDate));
      }
    };
    void loadSlots();
    return () => { cancelled = true; };
  }, [selectedStaffId, selectedDate, selectedServiceData]);

  const availableSlots = useMemo(() => timeSlots.filter((s) => s.available), [timeSlots]);

  const toggleVisibility = useCallback((key: keyof VisibilitySettings) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const confirmBooking = useCallback(() => {
    setShowBookingConfirmed(true);
    showToast('Appointment booked successfully!');
  }, [showToast]);

  const resetBooking = useCallback(() => {
    setBookingStep('service');
    setSelectedService(null);
    setSelectedStaffId(null);
    setSelectedDate('');
    setSelectedTime(null);
    setShowBookingConfirmed(false);
  }, []);

  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-on-background antialiased">
      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e8e8e8] bg-[#fcf9f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={() => navigate('staff')} className="rounded-full p-2 text-primary hover:bg-[#fde7f3]" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight text-primary">Staff &amp; Booking</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">NexoraOS · Website</p>
          </div>
          {/* View toggle (manager only) */}
          {isMgr ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode('manager')}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${viewMode === 'manager' ? 'bg-primary text-white' : 'bg-[#fde7f3] text-primary'}`}
              >
                <Settings className="inline h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('customer')}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${viewMode === 'customer' ? 'bg-primary text-white' : 'bg-[#fde7f3] text-primary'}`}
              >
                <Globe className="inline h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-20 sm:px-6">
        <AnimatePresence mode="wait">
          {viewMode === 'manager' && (
            <motion.div key="manager" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <ManagerVisibility visibility={visibility} onToggle={toggleVisibility} />
            </motion.div>
          )}
          {viewMode === 'customer' && (
            <motion.div key="customer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <CustomerExperience
                visibility={visibility}
                staffList={staffList}
                allServices={allServices}
                staffForService={staffForService}
                bookingStep={bookingStep}
                setBookingStep={setBookingStep}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
                selectedStaffId={selectedStaffId}
                setSelectedStaffId={setSelectedStaffId}
                selectedStaff={selectedStaff}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                timeSlots={timeSlots}
                availableSlots={availableSlots}
                selectedServiceData={selectedServiceData}
                showProfileModal={showProfileModal}
                setShowProfileModal={setShowProfileModal}
                showBookingConfirmed={showBookingConfirmed}
                onConfirmBooking={confirmBooking}
                onResetBooking={resetBooking}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 10 }} exit={{ opacity: 0, y: 10 }} className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#313030] px-4 py-3 text-xs font-semibold text-white shadow-xl">
            <Check className="h-4 w-4 text-emerald-300" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PART 1 — MANAGER VISIBILITY SETTINGS
   ═══════════════════════════════════════════════════════ */

function ManagerVisibility({
  visibility,
  onToggle,
}: {
  visibility: VisibilitySettings;
  onToggle: (key: keyof VisibilitySettings) => void;
}) {
  const toggles: { key: keyof VisibilitySettings; label: string; description: string; sensitive?: boolean }[] = [
    { key: 'showStaffOnWebsite', label: 'Show Staff on Website', description: 'Display staff directory on your public website.' },
    { key: 'showProfilePhoto', label: 'Show Profile Photo', description: 'Show staff profile photos on public cards.' },
    { key: 'showRatings', label: 'Show Ratings', description: 'Display average customer ratings.' },
    { key: 'showExperience', label: 'Show Experience', description: 'Show years of experience.' },
    { key: 'showSkills', label: 'Show Skills', description: 'Display specialization and skills.' },
    { key: 'showServices', label: 'Show Services', description: 'List services offered by each staff member.' },
    { key: 'allowStaffSelection', label: 'Allow Customers to Select Staff', description: 'Let customers choose their preferred staff during booking.' },
    { key: 'showPhoneNumber', label: 'Show Phone Number', description: 'Display staff phone number publicly.', sensitive: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Website Settings</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-on-background">Staff Visibility Controls</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Control what staff information appears on your public website.</p>
      </section>

      {/* Privacy Warning */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Private Information — Never Public</h3>
            <p className="mt-1 text-xs leading-relaxed text-red-700">
              The following are <b>never</b> exposed on the public website regardless of settings:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['Salary', 'Commission', 'Payroll', 'Emergency Contact', 'Private Documents', 'Internal Notes', 'Permissions', 'Bank/UPI Details'].map((item) => (
                <span key={item} className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Toggle Settings */}
      <section className="flex flex-col gap-2">
        {toggles.map((item) => (
          <div
            key={item.key}
            className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors ${
              item.sensitive && visibility[item.key]
                ? 'border-amber-200 bg-amber-50'
                : 'border-[#e8e8e8] bg-white'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-on-background">{item.label}</p>
                {item.sensitive && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">Sensitive</span>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant">{item.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onToggle(item.key)}
              aria-label={`Toggle ${item.label}`}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                visibility[item.key] ? 'bg-primary' : 'bg-[#e0bec6]'
              }`}
            >
              <motion.div
                layout
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm"
                style={{ left: visibility[item.key] ? 'calc(100% - 26px)' : '2px' }}
              />
            </button>
          </div>
        ))}
      </section>

      {/* Preview CTA */}
      <section>
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e0bec6] bg-white px-4 py-3 text-xs font-bold text-primary">
          <Eye className="h-4 w-4" /> Toggle the Globe icon in the header to preview the customer view
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PART 2 — CUSTOMER-FACING EXPERIENCE
   ═══════════════════════════════════════════════════════ */

function CustomerExperience({
  visibility,
  staffList,
  allServices,
  staffForService,
  bookingStep,
  setBookingStep,
  selectedService,
  setSelectedService,
  selectedStaffId,
  setSelectedStaffId,
  selectedStaff,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  timeSlots,
  availableSlots,
  selectedServiceData,
  showProfileModal,
  setShowProfileModal,
  showBookingConfirmed,
  onConfirmBooking,
  onResetBooking,
}: {
  visibility: VisibilitySettings;
  staffList: StaffMember[];
  allServices: { name: string; price: number; duration: string }[];
  staffForService: StaffMember[];
  bookingStep: BookingStep;
  setBookingStep: (step: BookingStep) => void;
  selectedService: string | null;
  setSelectedService: (s: string | null) => void;
  selectedStaffId: string | null;
  setSelectedStaffId: (id: string | null) => void;
  selectedStaff: StaffMember | null;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedTime: string | null;
  setSelectedTime: (t: string | null) => void;
  timeSlots: TimeSlot[];
  availableSlots: TimeSlot[];
  selectedServiceData: { name: string; price: number; duration: string } | null;
  showProfileModal: StaffMember | null;
  setShowProfileModal: (s: StaffMember | null) => void;
  showBookingConfirmed: boolean;
  onConfirmBooking: () => void;
  onResetBooking: () => void;
}) {
  if (!visibility.showStaffOnWebsite) {
    return (
      <section className={`${CARD_CLASS} py-16 text-center`}>
        <Globe className="mx-auto mb-3 h-10 w-10 text-on-surface-variant/50" />
        <h2 className="text-base font-bold text-on-background">Staff section is currently hidden.</h2>
        <p className="mt-1 text-xs text-on-surface-variant">Enable &ldquo;Show Staff on Website&rdquo; in manager settings.</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Section Header */}
      <section className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Our Team</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-on-background">Meet Our Salon Experts</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
          Book your appointment with our talented professionals. Each team member is certified and experienced.
        </p>
      </section>

      {/* Booking Progress */}
      <section className="flex items-center justify-center gap-2">
        {(['service', 'staff', 'date', 'time', 'summary'] as BookingStep[]).map((step, i) => {
          const stepIndex = ['service', 'staff', 'date', 'time', 'summary'].indexOf(bookingStep);
          const isActive = i <= stepIndex;
          return (
            <React.Fragment key={step}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? 'bg-primary text-white' : 'bg-[#f0edec] text-on-surface-variant'}`}>
                {i + 1}
              </div>
              {i < 4 && <div className={`h-0.5 w-6 ${isActive ? 'bg-primary' : 'bg-[#e8e8e8]'}`} />}
            </React.Fragment>
          );
        })}
      </section>

      {/* ── STEP 1: Select Service ── */}
      {bookingStep === 'service' && (
        <section>
          <h3 className="mb-3 text-base font-bold text-on-background">Select a Service</h3>
          <div className="flex flex-col gap-2">
            {allServices.map((svc) => {
              const isSelected = selectedService === svc.name;
              return (
                <button
                  key={svc.name}
                  type="button"
                  onClick={() => {
                    setSelectedService(svc.name);
                    setSelectedStaffId(null);
                    setSelectedTime(null);
                    setBookingStep('staff');
                  }}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-[#fde7f3] shadow-sm'
                      : 'border-[#e8e8e8] bg-white hover:bg-[#fdf8f8]'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-on-background'}`}>{svc.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{svc.duration}</p>
                  </div>
                  <span className={`text-sm font-black ${isSelected ? 'text-primary' : 'text-on-background'}`}>{money(svc.price)}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── STEP 2: Select Staff ── */}
      {bookingStep === 'staff' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-on-background">Choose Your Stylist</h3>
            <button type="button" onClick={() => setBookingStep('service')} className="text-xs font-bold text-primary">← Back</button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {staffForService.map((staff) => {
              const isSelected = selectedStaffId === staff.id;
              return (
                <div
                  key={staff.id}
                  className={`overflow-hidden rounded-2xl border transition-all ${
                    isSelected ? 'border-primary shadow-md' : 'border-[#e8e8e8]'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Photo */}
                      {visibility.showProfilePhoto && (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-[#fde7f3] shadow-sm">
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#ffd9e2] to-[#b90064] text-sm font-bold text-[#8e004b]">
                            {safeInitials(staff.name)}
                          </div>
                          {staff.avatar && (
                            <img src={staff.avatar} alt={staff.name} className="relative z-10 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-on-background">{staff.name}</h4>
                        <p className="text-xs font-semibold text-on-surface-variant">{staff.title}</p>
                        {visibility.showExperience && (
                          <p className="mt-0.5 text-[11px] font-semibold text-primary">{staff.experience}</p>
                        )}
                        {visibility.showRatings && (
                          <div className="mt-1 flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-on-background">{staff.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {visibility.showSkills && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {staff.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-full bg-[#fde7f3] px-2.5 py-0.5 text-[10px] font-semibold text-primary">{skill}</span>
                        ))}
                      </div>
                    )}

                    {/* Services */}
                    {visibility.showServices && (
                      <div className="mt-3 border-t border-[#e8e8e8] pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Services</p>
                        <div className="mt-1.5 flex flex-col gap-1">
                          {staff.services.slice(0, 3).map((svc) => (
                            <div key={svc.name} className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-on-background">{svc.name}</span>
                              <span className="text-on-surface-variant">{money(svc.price)} · {svc.duration}</span>
                            </div>
                          ))}
                          {staff.services.length > 3 && (
                            <span className="text-[10px] text-primary">+{staff.services.length - 3} more services</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Phone (only if enabled) */}
                    {visibility.showPhoneNumber && staff.phone && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                        <Phone className="h-3.5 w-3.5" /> {staff.phone}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 border-t border-[#e8e8e8] p-3">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(staff)}
                      className="flex-1 rounded-xl border border-[#e0bec6] px-3 py-2.5 text-[11px] font-bold text-on-surface-variant hover:bg-[#fde7f3]"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaffId(staff.id);
                        setSelectedTime(null);
                        setBookingStep('date');
                      }}
                      className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-[11px] font-bold text-white"
                    >
                      Book with {staff.name.split(' ')[0]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── STEP 3: Select Date ── */}
      {bookingStep === 'date' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-on-background">Select Date</h3>
            <button type="button" onClick={() => setBookingStep('staff')} className="text-xs font-bold text-primary">← Back</button>
          </div>
          <div className={`${CARD_CLASS}`}>
            <p className="mb-2 text-xs font-semibold text-on-surface-variant">
              For: <b className="text-on-background">{selectedStaff?.name}</b>
            </p>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime(null);
                if (e.target.value) setBookingStep('time');
              }}
              className="w-full rounded-xl border border-[#e0bec6] bg-[#fdf8f8] px-3 py-3 text-sm font-medium text-on-background outline-none focus:border-primary"
            />
          </div>
        </section>
      )}

      {/* ── STEP 4: Select Time ── */}
      {bookingStep === 'time' && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-on-background">Select Time</h3>
            <button type="button" onClick={() => setBookingStep('date')} className="text-xs font-bold text-primary">← Back</button>
          </div>
          <div className={`${CARD_CLASS} mb-4`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-on-surface-variant">
                {selectedStaff?.name} · {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="font-bold text-primary">{availableSlots.length} slots available</span>
            </div>
          </div>

          {availableSlots.length === 0 ? (
            <div className={`${CARD_CLASS} py-12 text-center`}>
              <Calendar className="mx-auto mb-3 h-10 w-10 text-on-surface-variant/50" />
              <h3 className="text-base font-bold text-on-background">No available appointments for this date.</h3>
              <p className="mt-1 text-xs text-on-surface-variant">Try selecting another date.</p>
              <button
                type="button"
                onClick={() => setBookingStep('date')}
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white"
              >
                Choose Another Date
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => {
                    setSelectedTime(slot.time);
                    setBookingStep('summary');
                  }}
                  className={`rounded-xl border px-3 py-3 text-center text-xs font-bold transition-all ${
                    slot.available
                      ? selectedTime === slot.time
                        ? 'border-primary bg-primary text-white'
                        : 'border-[#e8e8e8] bg-white text-on-background hover:bg-[#fde7f3]'
                      : 'cursor-not-allowed border-[#f0edec] bg-[#f0edec] text-on-surface-variant/50'
                  }`}
                >
                  {slot.time}
                  {!slot.available && (
                    <span className="mt-0.5 block text-[9px] font-normal">{slot.reason}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── STEP 5: Summary ── */}
      {bookingStep === 'summary' && !showBookingConfirmed && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-on-background">Booking Summary</h3>
            <button type="button" onClick={() => setBookingStep('time')} className="text-xs font-bold text-primary">← Back</button>
          </div>
          <div className={`${CARD_CLASS} border-primary/20 bg-[#fde7f3]`}>
            <div className="flex flex-col gap-3">
              <SummaryRow label="Staff" value={selectedStaff?.name || '—'} />
              <SummaryRow label="Service" value={selectedService || '—'} />
              <SummaryRow label="Date" value={selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
              <SummaryRow label="Time" value={selectedTime || '—'} />
              <SummaryRow label="Price" value={selectedServiceData ? money(selectedServiceData.price) : '—'} highlight />
            </div>
          </div>
          <button
            type="button"
            onClick={onConfirmBooking}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.99]"
          >
            Confirm &amp; Proceed to Booking
          </button>
        </section>
      )}

      {/* ── Booking Confirmed ── */}
      {showBookingConfirmed && (
        <section className={`${CARD_CLASS} py-12 text-center`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-on-background">Appointment Booked!</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Your appointment with <b>{selectedStaff?.name}</b> for <b>{selectedService}</b> on{' '}
            <b>{selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</b> at <b>{selectedTime}</b> has been confirmed.
          </p>
          <button
            type="button"
            onClick={onResetBooking}
            className="mt-6 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white"
          >
            Book Another Appointment
          </button>
        </section>
      )}

      {/* ── Staff Profile Modal ── */}
      <AnimatePresence>
        {showProfileModal && (
          <StaffProfileModal
            staff={showProfileModal}
            onClose={() => setShowProfileModal(null)}
            onBook={() => {
              setSelectedService(showProfileModal.services[0]?.name || null);
              setSelectedStaffId(showProfileModal.id);
              setSelectedTime(null);
              setShowProfileModal(null);
              setBookingStep('date');
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Staff Cards Grid (always visible) ── */}
      {bookingStep === 'service' && (
        <section>
          <h3 className="mb-3 text-base font-bold text-on-background">Our Experts</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {staffList.map((staff) => (
              <div key={staff.id} className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                {/* Photo */}
                {visibility.showProfilePhoto && (
                  <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#ffd9e2] to-[#fde7f3]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#ffd9e2] to-[#b90064] text-2xl font-bold text-white shadow-lg">
                        {safeInitials(staff.name)}
                      </div>
                    </div>
                    {staff.avatar && (
                      <img src={staff.avatar} alt={staff.name} className="relative z-10 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    {visibility.showRatings && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-on-background">{staff.rating}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4">
                  <h4 className="text-lg font-bold text-on-background">{staff.name}</h4>
                  <p className="text-xs font-semibold text-on-surface-variant">{staff.title}</p>
                  {visibility.showExperience && (
                    <p className="mt-1 text-[11px] font-semibold text-primary">{staff.experience}</p>
                  )}

                  {visibility.showSkills && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {staff.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-full bg-[#fde7f3] px-2.5 py-0.5 text-[10px] font-semibold text-primary">{skill}</span>
                      ))}
                    </div>
                  )}

                  {visibility.showServices && (
                    <div className="mt-3 border-t border-[#e8e8e8] pt-3">
                      {staff.services.slice(0, 2).map((svc) => (
                        <div key={svc.name} className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-on-background">{svc.name}</span>
                          <span className="text-on-surface-variant">from {money(svc.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#e8e8e8] p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(staff.services[0]?.name || null);
                      setSelectedStaffId(staff.id);
                      setSelectedTime(null);
                      setBookingStep('date');
                    }}
                    className="w-full rounded-xl bg-primary px-3 py-2.5 text-[11px] font-bold text-white hover:opacity-90"
                  >
                    Book Appointment with {staff.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAFF PROFILE MODAL
   ═══════════════════════════════════════════════════════ */

function StaffProfileModal({
  staff,
  onClose,
  onBook,
}: {
  staff: StaffMember;
  onClose: () => void;
  onBook: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-[#fde7f3] shadow-sm">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#ffd9e2] to-[#b90064] text-lg font-bold text-[#8e004b]">
                {safeInitials(staff.name)}
              </div>
              {staff.avatar && (
                <img src={staff.avatar} alt={staff.name} className="relative z-10 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-background">{staff.name}</h2>
              <p className="text-sm font-semibold text-on-surface-variant">{staff.title}</p>
              <p className="text-xs font-semibold text-primary">{staff.experience}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant hover:bg-[#f7f2f2]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Rating */}
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="text-lg font-black text-on-background">{staff.rating}</span>
          <span className="text-xs text-on-surface-variant">Average Customer Rating</span>
        </div>

        {/* Bio */}
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-bold text-on-background">About</h3>
          <p className="text-sm leading-relaxed text-on-surface-variant">{staff.bio}</p>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-bold text-on-background">Skills &amp; Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {staff.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-[#fde7f3] px-3 py-1 text-[11px] font-semibold text-primary">{skill}</span>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-bold text-on-background">Services &amp; Pricing</h3>
          <div className="flex flex-col gap-1.5">
            {staff.services.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between rounded-xl bg-[#fdf8f8] px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold text-on-background">{svc.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{svc.duration}</p>
                </div>
                <span className="text-xs font-bold text-primary">{money(svc.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onBook}
          className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-90"
        >
          Book Appointment
        </button>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════ */

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2.5">
      <span className="text-xs font-semibold text-on-surface-variant">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-primary font-black' : 'text-on-background'}`}>{value}</span>
    </div>
  );
}
