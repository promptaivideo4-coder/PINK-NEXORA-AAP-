import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  ArrowLeft, 
  Scissors, 
  Sparkles, 
  Phone, 
  Mail, 
  Plus, 
  X, 
  Check, 
  Star,
  BookOpen,
  Filter,
  SlidersHorizontal,
  MoreVertical,
  Trash2,
  Calendar,
  AlertCircle
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
  statusInfo: string; // e.g. "Next: 2:00 PM", "Ends: 1:15 PM", "Back: Tomorrow"
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'ST-01',
    name: 'Sanya Rao',
    role: 'Senior Stylist',
    specialty: 'Balayage & Color Correction',
    phone: '+1 (310) 555-0145',
    email: 'elena.rostova@nexora.com',
    rating: 4.9,
    reviewsCount: 124,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzw-FINsqOVvcGQdzJ6FpXYOgm1eruw1ADnOEIGIePBqAv1Sj0fqUjb4tp-x5F-uPmfj0ee_vU0G-_P1-d29WZYQz5xkPwi8AHhcUT7D87_K2VL8c4zdqu2clG_YALpB6GnrHr5lzMuYu-GDQP5tDmI90XnsGKwiW0MIOfp9ARCuSHPEQ7oErLvv20Z4VnxVGa_tu0kmmGiB5TGJ9kh9Yce6UwwMB4MX_EFrvOmyKtczXXiaPnVA9HoG1IQbvDLPfG4IWjPUc10_s',
    status: 'Available',
    weeklyRev: '₹2.4L',
    bookingsThisWeek: 28,
    statusInfo: 'Next: 2:00 PM'
  },
  {
    id: 'ST-02',
    name: 'Kiran Kumar',
    role: 'Color Specialist',
    specialty: 'Vibrant Colors & Highlights',
    phone: '+1 (310) 555-0198',
    email: 'marcus.chen@nexora.com',
    rating: 4.8,
    reviewsCount: 98,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyga_-IhTVr5NSAbjqjeCoJ1Bu_jl7CY9jLf86be5WQUJqFUT5Axn0Ewctks2h-7-E3S7QfErHnkeFbyI5E5WeoT3e8CrYMtLMgjWVa7DHhSUBdlbuZU-yRK4iULK_XKNSdLf19idGyjyeU96aNDbnSZVFnMrA-TYIVAOqlRc0Kbv7dzC7RzsJN7xZMT9Jj_NlK3v_sNA7Zcz27dIVucRiBYT2vUQNNFHzwo37biqHLLPGyn8TOfEadCHQIqt6ZZSEjukdEbjWwYQ',
    status: 'In-Session',
    weeklyRev: '₹3.1L',
    bookingsThisWeek: 22,
    statusInfo: 'Ends: 1:15 PM'
  },
  {
    id: 'ST-03',
    name: 'Suman Gupta',
    role: 'Junior Stylist',
    specialty: 'Modern Cuts & Blowouts',
    phone: '+1 (310) 555-0123',
    email: 'sarah.j@nexora.com',
    rating: 4.6,
    reviewsCount: 45,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqnBO6_8zyof5TquhFt61wmjfRvHWi2mmdCuJ25FU1h5bfnEdrhcBMLDsihOIeHQHZy0amhhVqh301sqwb1Kj2JMsw4NmoQgRkUccRmTQjq6H3RLgx45gB61IojoxkbKRmFF32-yDT4LU1D-84iw9fJuEctaeycEQSh18PhPLVuou3ANKAPP2QNMBhRinOkG9H0kK_-DNSWXM1Z60touK72oYpSJWgovXxPfC8zlS3fOYQNHV6Arawl-wkUeHuPHGt-29tkIxUJNs',
    status: 'Off-Duty',
    weeklyRev: '₹1.2L',
    bookingsThisWeek: 14,
    statusInfo: 'Back: Tomorrow'
  }
];

type FilterType = 'All' | 'Available' | 'In-Session' | 'Off-Duty';

export default function StaffManagement({ navigate }: NavigationProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('nexora_staff_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse nexora_staff_list', e);
      }
    }
    return INITIAL_STAFF;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New staff form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Stylist');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [initialStatus, setInitialStatus] = useState<'Available' | 'In-Session' | 'Off-Duty'>('Available');

  useEffect(() => {
    localStorage.setItem('nexora_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newMember: StaffMember = {
      id: `ST-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      role,
      specialty: specialty.trim() || 'General Styling',
      phone: phone.trim() || '+1 (310) 555-0100',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@nexora.com`,
      rating: 5.0,
      reviewsCount: 1,
      initials,
      status: initialStatus,
      weeklyRev: '₹0.0L',
      bookingsThisWeek: 0,
      statusInfo: initialStatus === 'Available' ? 'Ready' : initialStatus === 'In-Session' ? 'In service' : 'Away'
    };

    setStaffList(prev => [newMember, ...prev]);
    setShowAddModal(false);
    
    // Reset fields
    setName('');
    setSpecialty('');
    setPhone('');
    setEmail('');
    setInitialStatus('Available');
    triggerToast(`${newMember.name} added to the team!`);
  };

  const handleDeleteStaff = (id: string) => {
    const staff = staffList.find(s => s.id === id);
    setStaffList(prev => prev.filter(s => s.id !== id));
    setActiveMenuId(null);
    if (staff) {
      triggerToast(`${staff.name} removed from staff list`);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: 'Available' | 'In-Session' | 'Off-Duty') => {
    setStaffList(prev => prev.map(s => {
      if (s.id === id) {
        let info = s.statusInfo;
        if (newStatus === 'Available') info = 'Next: 2:00 PM';
        else if (newStatus === 'In-Session') info = 'Ends: 1:15 PM';
        else info = 'Back: Tomorrow';
        return { ...s, status: newStatus, statusInfo: info };
      }
      return s;
    }));
    setActiveMenuId(null);
    triggerToast('Staff status updated successfully');
  };

  const handleClearAll = () => {
    setStaffList([]);
    triggerToast('All staff cleared (simulated empty state)');
  };

  const handleRestoreDefaults = () => {
    setStaffList(INITIAL_STAFF);
    triggerToast('Demo staff team restored');
  };

  const filteredStaff = staffList.filter(s => {
    const matchesFilter = activeFilter === 'All' || s.status === activeFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Layout navigate={navigate} currentScreen="staff">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-on-surface text-surface text-xs font-semibold px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 md:px-8 py-6 max-w-[1200px] mx-auto w-full relative min-h-[calc(100vh-140px)] flex flex-col gap-6">
        
        {/* Header Section */}
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('dashboard')}
                className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant md:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-large-title text-large-title-mobile md:text-large-title text-on-surface">Staff Members</h1>
            </div>
            <p className="font-body text-sm text-on-surface-variant mt-1">Manage your team and view performance metrics.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
            {/* Search input */}
            <div className="relative flex-grow sm:flex-initial sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-[14px] font-body text-body text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-all text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter icon button / Simulation buttons */}
            <div className="flex gap-1.5 items-center">
              {staffList.length > 0 ? (
                <button
                  onClick={handleClearAll}
                  className="h-[42px] px-3.5 rounded-[14px] border border-outline-variant bg-surface-container-lowest text-[11px] font-bold text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 whitespace-nowrap"
                  title="Simulate empty state"
                >
                  Clear Staff
                </button>
              ) : (
                <button
                  onClick={handleRestoreDefaults}
                  className="h-[42px] px-3.5 rounded-[14px] border border-primary-container/30 bg-surface-container-lowest text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors active:scale-95 whitespace-nowrap"
                >
                  Restore Defaults
                </button>
              )}

              <button 
                onClick={() => setShowLearnModal(true)}
                className="h-[42px] px-3 rounded-[14px] border border-outline-variant bg-surface-container-lowest text-on-surface flex items-center justify-center hover:bg-surface-container-low transition-colors active:scale-95"
                title="Learn Team Management"
              >
                <BookOpen className="w-5 h-5 text-on-surface-variant" />
              </button>

              <button 
                onClick={() => navigate('new-staff')}
                className="h-[42px] px-4 rounded-[14px] bg-primary-container text-white font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Staff</span>
              </button>
            </div>
          </div>
        </section>

        {/* Filter Chips */}
        <section className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
          {(['All', 'Available', 'In-Session', 'Off-Duty'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-caption text-xs transition-all ${
                activeFilter === filter 
                  ? 'bg-primary-container text-white font-semibold shadow-xs'
                  : 'border border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant/20'
              }`}
            >
              {filter}
            </button>
          ))}
        </section>

        {/* Staff List Grid or Empty State */}
        {filteredStaff.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            {filteredStaff.map((staff) => {
              // Custom border & badge highlights matching the design spec
              const borderClass = staff.status === 'Available'
                ? 'border-l-4 border-l-[#10B981]'
                : staff.status === 'In-Session'
                ? 'border-l-4 border-l-[#F59E0B]'
                : 'border-l-4 border-l-surface-variant opacity-80 hover:opacity-100';

              const statusBadge = staff.status === 'Available' ? (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#059669] border border-[#10B981]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5 animate-pulse"></span>
                  <span className="font-caption text-[11px] font-semibold tracking-wide uppercase">Available</span>
                </div>
              ) : staff.status === 'In-Session' ? (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/20">
                  <Scissors className="w-3 h-3 text-[#D97706] mr-1.5 shrink-0" />
                  <span className="font-caption text-[11px] font-semibold tracking-wide uppercase">In-Session</span>
                </div>
              ) : (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-variant/30 text-on-surface-variant border border-surface-variant/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 mr-1.5"></span>
                  <span className="font-caption text-[11px] font-semibold tracking-wide uppercase">Off-Duty</span>
                </div>
              );

              return (
                <article 
                  key={staff.id}
                  onClick={() => {
                    localStorage.setItem('nexora_selected_staff_id', staff.id);
                    navigate('staff-detail');
                  }}
                  className={`cursor-pointer bg-surface-container-lowest rounded-[18px] border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0px_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative flex flex-col group ${borderClass}`}
                >
                  <div className="p-5 flex flex-col h-full gap-4">
                    
                    {/* Top Row: Avatar & Basic Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-surface-container shadow-sm relative group-hover:scale-105 transition-transform">
                        {staff.avatar ? (
                          <img 
                            className="w-full h-full object-cover" 
                            src={staff.avatar} 
                            alt={staff.name} 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary-container/10 flex items-center justify-center font-bold text-primary-container text-lg">
                            {staff.initials || 'ST'}
                          </div>
                        )}
                        
                        {/* Little dot indicator */}
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-surface-container-lowest rounded-full z-10 ${
                          staff.status === 'Available' ? 'bg-[#10B981]' : staff.status === 'In-Session' ? 'bg-[#F59E0B]' : 'bg-surface-variant'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center pt-1 relative">
                        <div className="flex justify-between items-start">
                          <h3 className="font-card-title text-sm font-bold text-on-surface truncate pr-6">{staff.name}</h3>
                          
                          {/* Options Menu Toggle */}
                          <div className="absolute right-0 top-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === staff.id ? null : staff.id);
                              }}
                              className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-low"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown menu */}
                            <AnimatePresence>
                              {activeMenuId === staff.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    className="absolute right-0 mt-1 w-40 bg-white border border-outline-variant/30 rounded-xl shadow-lg z-20 overflow-hidden text-xs py-1"
                                  >
                                    <p className="px-3 py-1 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">Change Status</p>
                                    <button 
                                      onClick={() => handleUpdateStatus(staff.id, 'Available')}
                                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-1.5 font-medium"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                                      Available
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateStatus(staff.id, 'In-Session')}
                                      className="w-full text-left px-3 py-2 hover:bg-amber-50 text-amber-700 flex items-center gap-1.5 font-medium"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                                      In-Session
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateStatus(staff.id, 'Off-Duty')}
                                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-on-surface-variant flex items-center gap-1.5 font-medium"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-surface-variant" />
                                      Off-Duty
                                    </button>
                                    
                                    <div className="border-t border-outline-variant/20 my-1" />
                                    
                                    <button 
                                      onClick={() => handleDeleteStaff(staff.id)}
                                      className="w-full text-left px-3 py-2 text-error hover:bg-red-50 flex items-center gap-1.5 font-semibold"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete Staff
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <p className="font-caption text-xs text-on-surface-variant truncate font-medium mt-0.5">{staff.role}</p>
                        
                        <div className="flex items-center gap-1 mt-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          <span className="font-caption text-xs text-on-surface font-bold">{staff.rating}</span>
                          <span className="font-caption text-xs text-on-surface-variant/70 text-[11px]">({staff.reviewsCount})</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col">
                        <span className="font-caption text-on-surface-variant text-[10px] uppercase tracking-wider font-bold">Weekly Rev</span>
                        <span className="font-body text-sm font-black text-on-surface mt-0.5">{staff.weeklyRev}</span>
                      </div>
                      <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col">
                        <span className="font-caption text-on-surface-variant text-[10px] uppercase tracking-wider font-bold">Bookings</span>
                        <span className="font-body text-sm font-black text-on-surface mt-0.5">
                          {staff.bookingsThisWeek} <span className="text-on-surface-variant/70 font-normal text-[11px]">this wk</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Status */}
                    <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center text-xs">
                      {statusBadge}
                      <span className="font-caption text-on-surface-variant text-[12px] font-medium">{staff.statusInfo}</span>
                    </div>

                    {/* Actions Row */}
                    <div className="flex gap-2 pt-1 border-t border-outline-variant/10">
                      <a 
                        href={`tel:${staff.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 flex-1 flex justify-center rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors"
                        title={staff.phone}
                      >
                        <Phone className="w-3.5 h-3.5 text-on-surface-variant" />
                      </a>
                      <a 
                        href={`mailto:${staff.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 flex-1 flex justify-center rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors"
                        title={staff.email}
                      >
                        <Mail className="w-3.5 h-3.5 text-on-surface-variant" />
                      </a>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem('booking_auto_staff_id', staff.id);
                          localStorage.setItem('booking_auto_staff_name', staff.name);
                          navigate('new-appointment');
                        }}
                        className="px-3 py-2 rounded-lg bg-primary-container/10 hover:bg-primary-container/20 text-primary font-bold text-[11px] uppercase tracking-wider transition-colors shrink-0"
                      >
                        Assign Booking
                      </button>
                    </div>

                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          /* NO STAFF - EXACT MINIMAL WORKSTATION DESIGN SPECIFICATION */
          <div className="flex-grow flex items-center justify-center my-auto py-10">
            <div className="w-full max-w-md mx-auto relative z-10">
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-fixed-dim/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-tertiary-fixed-dim/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-surface-container-lowest/90 backdrop-blur-2xl rounded-[24px] p-8 w-full flex flex-col items-center text-center border border-outline-variant/30 shadow-[0px_10px_40px_rgba(0,0,0,0.06)] relative z-10"
              >
                <div className="w-32 h-32 mb-8 relative rounded-full bg-surface-container flex items-center justify-center shadow-xs overflow-hidden border border-outline-variant/20">
                  <img 
                    className="w-full h-full object-cover rounded-full opacity-80" 
                    alt="Refined workstation digital layout illustration"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuALHy8DqJ-APLwbvls2-zK7kuuMOZhMEGXwCZ4GkaHsVZenGZX-fmRLi6MUMv7n0GolEzKyR8nwcjQxbPMYAkjdZmINbvx1V4EfGMu5wGl3Luji9hpIAQgGsaKZKsL1KLC0QZJdpipTiV98REchtGpC2N7NDLfIL43ODVyLZeneliUbLmSr4spuVTC-C72OP_vssrbRyoyGTghNgPvFfP3zcbJzhrgo6zSJD5aga7Yn73kXbo62Ne10iRZ3iLDcgyvlTvLeVW00IBg" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-md border border-outline-variant/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary fill-primary/10" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-on-surface mb-2">No Staff Members</h2>
                <p className="text-xs text-on-surface-variant/80 mb-6 max-w-[280px] leading-relaxed">
                  Start building your dream team to manage more appointments.
                </p>

                <button 
                  onClick={() => navigate('new-staff')}
                  className="w-full bg-primary-container text-white font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-primary-container/20 text-xs uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Staff</span>
                </button>

                <button 
                  onClick={() => setShowLearnModal(true)}
                  className="mt-2.5 w-full bg-transparent border border-outline-variant/40 text-on-surface-variant font-bold text-[11px] py-2.5 rounded-xl hover:bg-surface-container-low transition-colors duration-200 uppercase tracking-wider"
                >
                  Learn Team Management
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] border border-outline-variant/30 p-6 sm:p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-on-surface">Add Staff Member</h3>
                    <p className="text-xs text-on-surface-variant">Configure team role & specializations</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sanya Rao"
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Role / Designation</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  >
                    <option value="Senior Stylist">Senior Stylist</option>
                    <option value="Color Specialist">Color Specialist</option>
                    <option value="Junior Stylist">Junior Stylist</option>
                    <option value="Barber">Barber Specialist</option>
                    <option value="Nail Artist">Nail Artist</option>
                    <option value="Massage Therapist">Massage Therapist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Specialty / Skillset</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Balayage & Keratin Treatments"
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (310) 555-0100"
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="elena@nexora.com"
                    className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary-container font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Initial Duty Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Available', 'In-Session', 'Off-Duty'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setInitialStatus(status)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          initialStatus === status
                            ? 'bg-primary-container/10 border-primary-container text-primary'
                            : 'border-outline-variant/40 hover:bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-outline-variant/40 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-container text-white rounded-xl text-xs font-bold hover:bg-primary transition-colors shadow-md uppercase tracking-wider"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Learn About Team Management Modal */}
      <AnimatePresence>
        {showLearnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-md" onClick={() => setShowLearnModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] border border-outline-variant/30 p-6 sm:p-8 w-full max-w-md shadow-2xl relative text-left"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-extrabold text-on-surface">Team Management</h3>
                </div>
                <button
                  onClick={() => setShowLearnModal(false)}
                  className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4 text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                <p>
                  Adding staff members lets you assign individual appointments, track individual revenue performance, and manage custom working hours.
                </p>
                <div className="bg-surface-container-low/60 p-4 rounded-xl flex flex-col gap-2 border border-outline-variant/20">
                  <div className="flex items-center gap-2 font-bold text-on-surface text-xs">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Auto-Routing Bookings</span>
                  </div>
                  <p className="text-xs text-on-surface-variant/80 pl-6">Clients can select their preferred stylist during online booking or receptionist flow.</p>
                </div>

                <div className="bg-surface-container-low/60 p-4 rounded-xl flex flex-col gap-2 border border-outline-variant/20">
                  <div className="flex items-center gap-2 font-bold text-on-surface text-xs">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Commission & Payout Tracking</span>
                  </div>
                  <p className="text-xs text-on-surface-variant/80 pl-6">Monitor sales breakdowns per stylist automatically in Analytics & Daily Reports.</p>
                </div>
              </div>

              <button
                onClick={() => setShowLearnModal(false)}
                className="w-full py-3 bg-primary-container text-white text-xs font-bold rounded-xl shadow-md uppercase tracking-wider"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
