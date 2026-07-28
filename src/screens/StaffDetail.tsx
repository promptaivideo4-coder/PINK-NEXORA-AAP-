import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  Scissors, 
  Mail, 
  Phone, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Award,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Trash,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  phone: string;
  email: string;
  rating: number;
  reviewsCount: number;
  avatar?: string;
  initials?: string;
  status: 'Available' | 'In-Session' | 'Off-Duty';
  weeklyRev: string;
  bookingsThisWeek: number;
  statusInfo: string;
  
  // Additional Detail Fields (persisted)
  attendance?: string;
  onTimeRate?: string;
  todayBookingsCount?: number;
  todayBookingsTotal?: number;
  monthlyRevenue?: string;
  projectedRevenue?: string;
  clientRetention?: string;
  tenureYears?: number;
  commissionRate?: number;
  
  // Weekly schedule
  schedule?: {
    [day: string]: {
      active: boolean;
      start: string;
      end: string;
    }
  };
  
  // Assigned Services
  assignedServices?: {
    id: string;
    name: string;
    duration: string;
    price: string;
  }[];
}

const INITIAL_STAFF_DETAILS: Record<string, Partial<StaffMember>> = {
  'ST-01': {
    attendance: '98%',
    onTimeRate: '98%',
    todayBookingsCount: 6,
    todayBookingsTotal: 8,
    monthlyRevenue: '₹12,850',
    projectedRevenue: '₹14,200',
    clientRetention: '85%',
    tenureYears: 5,
    commissionRate: 40,
    schedule: {
      'Monday': { active: true, start: '09:00', end: '17:00' },
      'Tuesday': { active: true, start: '10:00', end: '19:00' },
      'Wednesday': { active: false, start: '09:00', end: '17:00' },
      'Thursday': { active: true, start: '09:00', end: '17:00' },
      'Friday': { active: true, start: '09:00', end: '18:00' },
      'Saturday': { active: true, start: '09:00', end: '16:00' },
      'Sunday': { active: false, start: '09:00', end: '17:00' }
    },
    assignedServices: [
      { id: 'S-01', name: 'Balayage & Tone', duration: '120 mins', price: 'From ₹14,500' },
      { id: 'S-02', name: "Women's Haircut", duration: '60 mins', price: '₹6,500' },
      { id: 'S-03', name: 'Full Foil Highlights', duration: '150 mins', price: 'From ₹16,500' },
      { id: 'S-04', name: 'Keratin Treatment', duration: '180 mins', price: '₹20,000' }
    ]
  },
  'ST-02': {
    attendance: '95%',
    onTimeRate: '93%',
    todayBookingsCount: 5,
    todayBookingsTotal: 7,
    monthlyRevenue: '₹14,500',
    projectedRevenue: '₹16,000',
    clientRetention: '89%',
    tenureYears: 3,
    commissionRate: 45,
    schedule: {
      'Monday': { active: true, start: '09:00', end: '18:00' },
      'Tuesday': { active: true, start: '09:00', end: '18:00' },
      'Wednesday': { active: true, start: '09:00', end: '18:00' },
      'Thursday': { active: true, start: '09:00', end: '18:00' },
      'Friday': { active: true, start: '09:00', end: '18:00' },
      'Saturday': { active: false, start: '09:00', end: '17:00' },
      'Sunday': { active: false, start: '09:00', end: '17:00' }
    },
    assignedServices: [
      { id: 'S-05', name: 'Vibrant Highlights', duration: '120 mins', price: '₹15,000' },
      { id: 'S-06', name: 'Creative Dyeing', duration: '150 mins', price: '₹17,500' },
      { id: 'S-07', name: 'Balayage & Tone', duration: '120 mins', price: 'From ₹14,500' }
    ]
  },
  'ST-03': {
    attendance: '91%',
    onTimeRate: '90%',
    todayBookingsCount: 3,
    todayBookingsTotal: 6,
    monthlyRevenue: '₹6,400',
    projectedRevenue: '₹8,000',
    clientRetention: '74%',
    tenureYears: 1,
    commissionRate: 35,
    schedule: {
      'Monday': { active: false, start: '09:00', end: '17:00' },
      'Tuesday': { active: true, start: '09:00', end: '17:00' },
      'Wednesday': { active: true, start: '09:00', end: '17:00' },
      'Thursday': { active: true, start: '09:00', end: '17:00' },
      'Friday': { active: true, start: '09:00', end: '17:00' },
      'Saturday': { active: true, start: '10:00', end: '15:00' },
      'Sunday': { active: false, start: '09:00', end: '17:00' }
    },
    assignedServices: [
      { id: 'S-08', name: "Men's Classic Cut", duration: '45 mins', price: '₹4,500' },
      { id: 'S-09', name: 'Blowout Special', duration: '50 mins', price: '₹5,000' },
      { id: 'S-10', name: "Women's Haircut", duration: '60 mins', price: '₹6,500' }
    ]
  }
};

const DEFAULT_SERVICES_REGISTRY = [
  { id: 'S-01', name: 'Balayage & Tone', duration: '120 mins', price: 'From ₹14,500' },
  { id: 'S-02', name: "Women's Haircut", duration: '60 mins', price: '₹6,500' },
  { id: 'S-03', name: 'Full Foil Highlights', duration: '150 mins', price: 'From ₹16,500' },
  { id: 'S-04', name: 'Keratin Treatment', duration: '180 mins', price: '₹20,000' },
  { id: 'S-05', name: 'Vibrant Highlights', duration: '120 mins', price: '₹15,000' },
  { id: 'S-06', name: 'Creative Dyeing', duration: '150 mins', price: '₹17,500' },
  { id: 'S-08', name: "Men's Classic Cut", duration: '45 mins', price: '₹4,500' },
  { id: 'S-09', name: 'Blowout Special', duration: '50 mins', price: '₹5,000' },
  { id: 'S-11', name: 'Deep Conditioning Scalp Therapy', duration: '45 mins', price: '₹6,000' },
  { id: 'S-12', name: 'Classic Pedicure', duration: '50 mins', price: '₹4,800' },
  { id: 'S-13', name: 'Swedish Massage Session', duration: '60 mins', price: '₹8,500' },
  { id: 'S-14', name: 'Gel Nails Manicure', duration: '45 mins', price: '₹4,000' }
];

export default function StaffDetail({ navigate }: NavigationProps) {
  // Load staff list & active ID
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('nexora_staff_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse nexora_staff_list', e);
      }
    }
    return [];
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    return localStorage.getItem('nexora_selected_staff_id') || 'ST-01';
  });

  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);

  // Modal / Toast states
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit fields state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCommission, setEditCommission] = useState(40);
  const [editTenure, setEditTenure] = useState(3);
  const [editAttendance, setEditAttendance] = useState('98%');
  const [editOnTimeRate, setEditOnTimeRate] = useState('98%');
  const [editClientRetention, setEditClientRetention] = useState('85%');
  const [editMonthlyRevenue, setEditMonthlyRevenue] = useState('₹12,850');
  const [editProjectedRevenue, setEditProjectedRevenue] = useState('₹14,200');
  const [editTodayBookingsCount, setEditTodayBookingsCount] = useState(6);
  const [editTodayBookingsTotal, setEditTodayBookingsTotal] = useState(8);

  // Find and fill detail fields if they don't exist
  useEffect(() => {
    let current = staffList.find(s => s.id === selectedStaffId);
    if (!current && staffList.length > 0) {
      current = staffList[0];
    }
    
    if (current) {
      // Ensure detail fields exist
      const defaultDetails = INITIAL_STAFF_DETAILS[current.id] || {
        attendance: '95%',
        onTimeRate: '95%',
        todayBookingsCount: 5,
        todayBookingsTotal: 8,
        monthlyRevenue: '₹10,000',
        projectedRevenue: '₹11,500',
        clientRetention: '80%',
        tenureYears: 3,
        commissionRate: 40,
        schedule: {
          'Monday': { active: true, start: '09:00', end: '17:00' },
          'Tuesday': { active: true, start: '09:00', end: '17:00' },
          'Wednesday': { active: true, start: '09:00', end: '17:00' },
          'Thursday': { active: true, start: '09:00', end: '17:00' },
          'Friday': { active: true, start: '09:00', end: '17:00' },
          'Saturday': { active: false, start: '09:00', end: '17:00' },
          'Sunday': { active: false, start: '09:00', end: '17:00' }
        },
        assignedServices: [
          { id: 'S-01', name: 'Balayage & Tone', duration: '120 mins', price: 'From ₹14,500' },
          { id: 'S-02', name: "Women's Haircut", duration: '60 mins', price: '₹6,500' }
        ]
      };

      const merged: StaffMember = {
        ...current,
        attendance: current.attendance || defaultDetails.attendance,
        onTimeRate: current.onTimeRate || defaultDetails.onTimeRate,
        todayBookingsCount: current.todayBookingsCount !== undefined ? current.todayBookingsCount : defaultDetails.todayBookingsCount,
        todayBookingsTotal: current.todayBookingsTotal !== undefined ? current.todayBookingsTotal : defaultDetails.todayBookingsTotal,
        monthlyRevenue: current.monthlyRevenue || defaultDetails.monthlyRevenue,
        projectedRevenue: current.projectedRevenue || defaultDetails.projectedRevenue,
        clientRetention: current.clientRetention || defaultDetails.clientRetention,
        tenureYears: current.tenureYears !== undefined ? current.tenureYears : defaultDetails.tenureYears,
        commissionRate: current.commissionRate !== undefined ? current.commissionRate : defaultDetails.commissionRate,
        schedule: current.schedule || defaultDetails.schedule,
        assignedServices: current.assignedServices || defaultDetails.assignedServices
      };

      setActiveStaff(merged);
    }
  }, [staffList, selectedStaffId]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openEditModal = () => {
    if (!activeStaff) return;
    setEditName(activeStaff.name);
    setEditRole(activeStaff.role);
    setEditSpecialty(activeStaff.specialty);
    setEditPhone(activeStaff.phone);
    setEditEmail(activeStaff.email);
    setEditCommission(activeStaff.commissionRate || 40);
    setEditTenure(activeStaff.tenureYears || 3);
    setEditAttendance(activeStaff.attendance || '95%');
    setEditOnTimeRate(activeStaff.onTimeRate || '95%');
    setEditClientRetention(activeStaff.clientRetention || '80%');
    setEditMonthlyRevenue(activeStaff.monthlyRevenue || '₹10,000');
    setEditProjectedRevenue(activeStaff.projectedRevenue || '₹11,500');
    setEditTodayBookingsCount(activeStaff.todayBookingsCount || 5);
    setEditTodayBookingsTotal(activeStaff.todayBookingsTotal || 8);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;

    const updated: StaffMember = {
      ...activeStaff,
      name: editName.trim(),
      role: editRole,
      specialty: editSpecialty.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      commissionRate: editCommission,
      tenureYears: editTenure,
      attendance: editAttendance,
      onTimeRate: editOnTimeRate,
      clientRetention: editClientRetention,
      monthlyRevenue: editMonthlyRevenue,
      projectedRevenue: editProjectedRevenue,
      todayBookingsCount: editTodayBookingsCount,
      todayBookingsTotal: editTodayBookingsTotal
    };

    const newList = staffList.map(s => s.id === updated.id ? updated : s);
    setStaffList(newList);
    localStorage.setItem('nexora_staff_list', JSON.stringify(newList));
    setActiveStaff(updated);
    setShowEditModal(false);
    triggerToast('Profile updated successfully!');
  };

  const handleDeleteService = (serviceId: string) => {
    if (!activeStaff || !activeStaff.assignedServices) return;
    const remaining = activeStaff.assignedServices.filter(s => s.id !== serviceId);
    
    const updated: StaffMember = {
      ...activeStaff,
      assignedServices: remaining
    };

    const newList = staffList.map(s => s.id === updated.id ? updated : s);
    setStaffList(newList);
    localStorage.setItem('nexora_staff_list', JSON.stringify(newList));
    setActiveStaff(updated);
    triggerToast('Assigned service removed');
  };

  const handleAssignService = (srv: typeof DEFAULT_SERVICES_REGISTRY[number]) => {
    if (!activeStaff) return;
    const currentServices = activeStaff.assignedServices || [];
    
    if (currentServices.some(s => s.id === srv.id)) {
      triggerToast('Service is already assigned');
      return;
    }

    const updatedServices = [...currentServices, srv];
    const updated: StaffMember = {
      ...activeStaff,
      assignedServices: updatedServices
    };

    const newList = staffList.map(s => s.id === updated.id ? updated : s);
    setStaffList(newList);
    localStorage.setItem('nexora_staff_list', JSON.stringify(newList));
    setActiveStaff(updated);
    setShowAssignModal(false);
    triggerToast(`${srv.name} assigned!`);
  };

  const handleToggleDay = (day: string) => {
    if (!activeStaff || !activeStaff.schedule) return;
    const currentDay = activeStaff.schedule[day];
    
    const updated: StaffMember = {
      ...activeStaff,
      schedule: {
        ...activeStaff.schedule,
        [day]: {
          ...currentDay,
          active: !currentDay.active
        }
      }
    };

    const newList = staffList.map(s => s.id === updated.id ? updated : s);
    setStaffList(newList);
    localStorage.setItem('nexora_staff_list', JSON.stringify(newList));
    setActiveStaff(updated);
    triggerToast(`${day} status updated`);
  };

  const handleAvatarUpload = (file: File) => {
    if (!activeStaff) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        const updated: StaffMember = { ...activeStaff, avatar: reader.result as string };
        const newList = staffList.map(s => s.id === updated.id ? updated : s);
        setStaffList(newList);
        localStorage.setItem('nexora_staff_list', JSON.stringify(newList));
        setActiveStaff(updated);
        triggerToast('Profile photo updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    if (!activeStaff) return;
    const updated: StaffMember = { ...activeStaff, avatar: undefined };
    const newList = staffList.map(s => s.id === updated.id ? updated : s);
    setStaffList(newList);
    localStorage.setItem('nexora_staff_list', JSON.stringify(newList));
    setActiveStaff(updated);
    triggerToast('Profile photo removed!');
  };

  const handleScheduleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    if (!activeStaff || !activeStaff.schedule) return;
    const currentDay = activeStaff.schedule[day];

    const updated: StaffMember = {
      ...activeStaff,
      schedule: {
        ...activeStaff.schedule,
        [day]: {
          ...currentDay,
          [type]: value
        }
      }
    };

    const newList = staffList.map(s => s.id === updated.id ? updated : s);
    setStaffList(newList);
    localStorage.setItem('nexora_staff_list', JSON.stringify(newList));
    setActiveStaff(updated);
  };

  if (!activeStaff) {
    return (
      <Layout navigate={navigate} currentScreen="staff-detail" hideBottomNav={true}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 text-center">
          <p className="text-on-surface-variant font-medium">Loading staff detail or no staff found...</p>
          <button 
            onClick={() => navigate('staff')}
            className="mt-4 px-6 py-2.5 bg-primary-container text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-sm"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate percentage of today's bookings filled
  const bookingsPercent = Math.min(
    100, 
    Math.round(((activeStaff.todayBookingsCount || 0) / (activeStaff.todayBookingsTotal || 1)) * 100)
  );

  return (
    <Layout 
      navigate={navigate} 
      currentScreen="staff-detail" 
      hideBottomNav={true}
      title="Staff Detail"
      showBack={true}
      onBack={() => navigate('staff')}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-on-surface text-surface text-xs font-semibold px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-6 max-w-md mx-auto w-full flex flex-col gap-6 pb-28">
        
        {/* Profile Header Card */}
        <section className="bg-white rounded-[24px] border border-outline-variant/30 p-6 md:p-8 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent pointer-events-none" />
          
          {/* Avatar Area */}
          <ProfilePhotoUploader
            avatar={activeStaff.avatar}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
            variant="circle"
          />

          {/* Profile Basic Info */}
          <div className="flex-1 text-center md:text-left z-10 flex flex-col justify-between h-full pt-1">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tight mb-1">{activeStaff.name}</h2>
                <p className="text-sm font-bold text-on-surface-variant">{activeStaff.role}</p>
                <p className="text-xs text-on-surface-variant/70 mt-0.5">{activeStaff.specialty}</p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/30 px-3 py-1 rounded-full text-xs font-bold text-on-surface-variant">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    <span>{activeStaff.rating || 5.0} ({activeStaff.reviewsCount || 1} Reviews)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/30 px-3 py-1 rounded-full text-xs font-bold text-on-surface-variant">
                    <Award className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{activeStaff.tenureYears || 3} Years at Nexora</span>
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <button 
                onClick={openEditModal}
                className="w-full md:w-auto px-5 py-2.5 rounded-xl border border-primary text-primary font-bold text-xs hover:bg-primary/5 active:scale-95 transition-all uppercase tracking-wider"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {/* Attendance */}
          <div className="bg-white rounded-[18px] border border-outline-variant/30 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-xl bg-primary-container/10 text-primary-container">
                <Clock className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold text-primary-container bg-primary-container/10 px-2 py-0.5 rounded-full">+2%</span>
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Attendance</p>
              <h3 className="text-xl md:text-2xl font-black text-on-surface">{activeStaff.attendance || '98%'}</h3>
              <p className="text-[11px] text-on-surface-variant/70 mt-1">On-time rate: {activeStaff.onTimeRate || '98%'}</p>
            </div>
          </div>

          {/* Today's Bookings */}
          <div className="bg-white rounded-[18px] border border-outline-variant/30 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10b981]" />
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-xl bg-[#10b981]/10 text-[#10b981]">
                <UserCheck className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold text-[#059669] bg-[#10b981]/10 px-2 py-0.5 rounded-full">{bookingsPercent}% fill</span>
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Today's Bookings</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-xl md:text-2xl font-black text-on-surface">{activeStaff.todayBookingsCount || 0}</h3>
                <span className="text-xs font-medium text-on-surface-variant/70">/ {activeStaff.todayBookingsTotal || 8} Slots</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div className="bg-[#10b981] h-1.5 rounded-full" style={{ width: `${bookingsPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-[18px] border border-outline-variant/30 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-xl bg-tertiary-container/10 text-tertiary">
                <DollarSign className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold text-tertiary bg-tertiary-container/10 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Monthly Revenue</p>
              <h3 className="text-xl md:text-2xl font-black text-on-surface">{activeStaff.monthlyRevenue || '₹12,850'}</h3>
              <p className="text-[11px] text-on-surface-variant/70 mt-1">Proj: {activeStaff.projectedRevenue || '₹14,200'}</p>
            </div>
          </div>

          {/* Client Retention */}
          <div className="bg-white rounded-[18px] border border-outline-variant/30 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2.5 rounded-xl bg-secondary-fixed-dim/30 text-secondary">
                <TrendingUp className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full">Top Tier</span>
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Client Retention</p>
              <h3 className="text-xl md:text-2xl font-black text-on-surface">{activeStaff.clientRetention || '85%'}</h3>
              <p className="text-[11px] text-on-surface-variant/70 mt-1">Last 90 days rolling</p>
            </div>
          </div>
        </section>

        {/* Two Column Layout: Weekly Schedule & Assigned Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          
          {/* Weekly Schedule Section */}
          <section className="bg-white rounded-[24px] border border-outline-variant/30 p-6 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-5">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
              <div>
                <h3 className="text-base font-black text-on-surface">Weekly Schedule</h3>
                <p className="text-xs text-on-surface-variant/70">Define active working shifts & times</p>
              </div>
              <span className="text-[11px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {activeStaff.commissionRate || 40}% Commission
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {Object.entries(activeStaff.schedule || {}).map(([day, val]) => {
                const value = val as { active: boolean; start: string; end: string };
                return (
                  <div 
                    key={day} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all ${
                      value.active 
                        ? 'bg-[#FAFAFA] border-outline-variant/30' 
                        : 'bg-surface-container-low/40 border-outline-variant/10 opacity-60'
                    }`}
                  >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleDay(day)}
                      className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                        value.active 
                          ? 'bg-primary-container text-white' 
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                      title={value.active ? "Click to set OFF" : "Click to set ON"}
                    >
                      {day[0]}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-on-surface">{day}</span>
                      {!value.active && (
                        <span className="text-[10px] font-semibold text-on-surface-variant/50 ml-2 italic">Scheduled Off</span>
                      )}
                    </div>
                  </div>

                  {value.active ? (
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <input 
                        type="time" 
                        value={value.start}
                        onChange={(e) => handleScheduleTimeChange(day, 'start', e.target.value)}
                        className="p-1 px-2 text-xs font-semibold rounded-lg bg-white border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                      />
                      <span className="text-xs text-on-surface-variant font-bold">—</span>
                      <input 
                        type="time" 
                        value={value.end}
                        onChange={(e) => handleScheduleTimeChange(day, 'end', e.target.value)}
                        className="p-1 px-2 text-xs font-semibold rounded-lg bg-white border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-on-surface-variant/40 italic mt-2 sm:mt-0 pr-2">Off</span>
                  )}
                </div>
                );
              })}
            </div>
          </section>

          {/* Assigned Services Section */}
          <section className="bg-white rounded-[24px] border border-outline-variant/30 p-6 shadow-[0px_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-5">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
              <div>
                <h3 className="text-base font-black text-on-surface">Assigned Services</h3>
                <p className="text-xs text-on-surface-variant/70">Services this staff member is certified for</p>
              </div>
              <button 
                onClick={() => setShowAssignModal(true)}
                className="p-2 rounded-full bg-primary-container/10 hover:bg-primary-container/25 text-primary-container transition-colors"
                title="Assign Service Certificate"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {(activeStaff.assignedServices || []).length > 0 ? (
                (activeStaff.assignedServices || []).map((srv) => (
                  <div 
                    key={srv.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAFAFA] hover:bg-surface-container-low border border-outline-variant/30 transition-all group/item"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed/20 flex items-center justify-center text-primary">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-on-surface">{srv.name}</h4>
                        <p className="text-[11px] text-on-surface-variant font-medium">{srv.duration} • {srv.price}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteService(srv.id)}
                      className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant/40 hover:text-error transition-colors md:opacity-0 group-hover/item:opacity-100"
                      title="De-authorize Service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                  <Scissors className="w-8 h-8 text-on-surface-variant/40" />
                  <p className="text-xs font-bold text-on-surface-variant">No Certified Services</p>
                  <p className="text-[11px] text-on-surface-variant/60 max-w-[200px]">Assign some services to enable client booking.</p>
                  <button 
                    onClick={() => setShowAssignModal(true)}
                    className="mt-2.5 px-3 py-1.5 bg-primary-container/10 text-primary hover:bg-primary-container/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Assign Now
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>

      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] border border-outline-variant/30 p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-5">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-extrabold text-on-surface">Edit Staff Profile</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="flex justify-center mb-4">
                  <ProfilePhotoUploader
                    avatar={activeStaff.avatar}
                    onUpload={handleAvatarUpload}
                    onRemove={handleAvatarRemove}
                    variant="circle"
                    onUploadStart={() => setIsUploading(true)}
                    onUploadEnd={() => setIsUploading(false)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Role / Position</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    >
                      <option value="Senior Stylist">Senior Stylist</option>
                      <option value="Color Specialist">Color Specialist</option>
                      <option value="Esthetician">Esthetician</option>
                      <option value="Junior Stylist">Junior Stylist</option>
                      <option value="Barber Specialist">Barber Specialist</option>
                      <option value="Massage Therapist">Massage Therapist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Specialty / Subtitle</label>
                    <input
                      type="text"
                      value={editSpecialty}
                      onChange={(e) => setEditSpecialty(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Commission Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editCommission}
                      onChange={(e) => setEditCommission(Number(e.target.value))}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Tenure (Years at Nexora)</label>
                    <input
                      type="number"
                      min="0"
                      value={editTenure}
                      onChange={(e) => setEditTenure(Number(e.target.value))}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Attendance Rate</label>
                    <input
                      type="text"
                      value={editAttendance}
                      onChange={(e) => setEditAttendance(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">On-Time Rate</label>
                    <input
                      type="text"
                      value={editOnTimeRate}
                      onChange={(e) => setEditOnTimeRate(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Client Retention Rate</label>
                    <input
                      type="text"
                      value={editClientRetention}
                      onChange={(e) => setEditClientRetention(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Monthly Revenue</label>
                    <input
                      type="text"
                      value={editMonthlyRevenue}
                      onChange={(e) => setEditMonthlyRevenue(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Projected Revenue</label>
                    <input
                      type="text"
                      value={editProjectedRevenue}
                      onChange={(e) => setEditProjectedRevenue(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Today's Bookings Count</label>
                    <input
                      type="number"
                      min="0"
                      value={editTodayBookingsCount}
                      onChange={(e) => setEditTodayBookingsCount(Number(e.target.value))}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Today's Bookings Total Slots</label>
                    <input
                      type="number"
                      min="1"
                      value={editTodayBookingsTotal}
                      onChange={(e) => setEditTodayBookingsTotal(Number(e.target.value))}
                      className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 border border-outline-variant/40 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 py-3 bg-primary-container text-white rounded-xl text-xs font-bold hover:bg-primary transition-colors shadow-md uppercase tracking-wider disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Service Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] border border-outline-variant/30 p-6 sm:p-8 w-full max-w-md shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-5">
                <div>
                  <h3 className="text-base font-black text-on-surface">Assign Service Certificate</h3>
                  <p className="text-xs text-on-surface-variant/70">Select a certified service category for {activeStaff.name}</p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {DEFAULT_SERVICES_REGISTRY.map((srv) => {
                  const isAssigned = (activeStaff.assignedServices || []).some(s => s.id === srv.id);
                  return (
                    <button
                      key={srv.id}
                      disabled={isAssigned}
                      onClick={() => handleAssignService(srv)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isAssigned 
                          ? 'bg-emerald-50/50 border-emerald-200/50 opacity-60 cursor-not-allowed' 
                          : 'bg-[#FAFAFA] border-outline-variant/30 hover:border-primary-container hover:bg-surface-container-low'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-on-surface">{srv.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{srv.duration} • {srv.price}</p>
                      </div>
                      
                      {isAssigned ? (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/60 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Assigned</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wide px-2.5 py-1 rounded-full border border-primary/20 hover:bg-primary-container hover:text-white transition-all">
                          Assign
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
