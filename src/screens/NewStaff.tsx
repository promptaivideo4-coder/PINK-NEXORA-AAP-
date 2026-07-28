import React, { useState } from 'react';
import { NavigationProps } from '../types';
import ProfilePhotoUploader from '../components/ProfilePhotoUploader';
import { 
  ArrowLeft, 
  Camera, 
  Save, 
  Check, 
  ChevronDown,
  Info
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
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
];

export default function NewStaff({ navigate }: NavigationProps) {
  // Basic Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Senior Stylist');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  
  // Shift Setup State
  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Thu', 'Fri', 'Sat']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  // Skills & Commission State
  const [commission, setCommission] = useState('40');
  const [categories, setCategories] = useState<string[]>(['Haircuts', 'Coloring']);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setWorkingDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleCategory = (cat: string) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleRandomAvatar = () => {
    const randomUrl = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    setAvatar(randomUrl);
    triggerToast('Profile photo selected!');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerToast('Please enter a full name');
      return;
    }

    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const specialtiesList = categories.join(' & ') || 'General Styling';

    const newMember: StaffMember = {
      id: `ST-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      role: role,
      specialty: specialtiesList,
      phone: phone.trim() || '+1 (310) 555-0100',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@nexorasalon.com`,
      rating: 5.0,
      reviewsCount: 1,
      avatar: avatar,
      initials: initials,
      status: 'Available',
      weeklyRev: '₹0.0k',
      bookingsThisWeek: 0,
      statusInfo: 'Ready'
    };

    // Load current staff from localStorage or defaults
    const currentSaved = localStorage.getItem('nexora_staff_list');
    let staffList: StaffMember[] = [];
    if (currentSaved) {
      try {
        staffList = JSON.parse(currentSaved);
      } catch (err) {
        console.error(err);
      }
    }

    const updatedList = [newMember, ...staffList];
    localStorage.setItem('nexora_staff_list', JSON.stringify(updatedList));

    triggerToast(`${newMember.name} added successfully!`);
    
    // Brief delay to allow the toast to show before navigating
    setTimeout(() => {
      navigate('staff');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-on-surface font-body antialiased flex flex-col pt-16 pb-32">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-on-surface text-surface text-xs font-semibold px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactional Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex justify-between items-center px-4 h-16 max-w-full">
        <button 
          onClick={() => navigate('staff')}
          className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-low transition-colors active:scale-95 duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg text-primary tracking-tight">Add Staff Member</h1>
        <div className="w-10 h-10"></div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* Section 1: Basic Profile */}
        <section className="bg-white rounded-[18px] border border-outline-variant/40 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-5">
          <h2 className="text-lg font-bold text-on-surface">Basic Profile</h2>
          
          {/* Photo Upload Area */}
          <ProfilePhotoUploader 
            avatar={avatar}
            onUpload={(file) => {
              const reader = new FileReader();
              reader.onloadend = () => setAvatar(reader.result as string);
              reader.readAsDataURL(file);
              triggerToast('Profile photo updated!');
            }}
            onRemove={() => setAvatar(undefined)}
          />

          {/* Grid Layout for Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Full Name *</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full p-3 text-sm rounded-[14px] bg-[#FAFAFA] border border-outline-variant/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/30 transition-all font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@nexorasalon.com"
                className="w-full p-3 text-sm rounded-[14px] bg-[#FAFAFA] border border-outline-variant/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/30 transition-all font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Phone Number</label>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full p-3 text-sm rounded-[14px] bg-[#FAFAFA] border border-outline-variant/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/30 transition-all font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-bold text-on-surface-variant">Role / Position</label>
              <div className="relative">
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 text-sm rounded-[14px] bg-[#FAFAFA] border border-outline-variant/50 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/30 transition-all font-semibold appearance-none pr-10"
                >
                  <option value="Senior Stylist">Senior Stylist</option>
                  <option value="Color Specialist">Color Specialist</option>
                  <option value="Esthetician">Esthetician</option>
                  <option value="Junior Stylist">Junior Stylist</option>
                </select>
                <ChevronDown className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Shift Setup */}
        <section className="bg-white rounded-[18px] border border-outline-variant/40 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-on-surface">Shift Setup</h2>
            <p className="text-xs text-on-surface-variant mt-1">Define standard working days and hours for this staff member.</p>
          </div>

          {/* Days Toggle Grid */}
          <div className="flex flex-wrap gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const isSelected = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-[14px] font-semibold text-xs transition-all border ${
                    isSelected 
                      ? 'bg-primary-container text-white border-primary-container' 
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/50 hover:bg-surface-variant/20'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Start Time</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 text-sm rounded-[14px] bg-[#FAFAFA] border border-outline-variant/50 focus:outline-none focus:border-primary-container transition-all font-semibold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">End Time</label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 text-sm rounded-[14px] bg-[#FAFAFA] border border-outline-variant/50 focus:outline-none focus:border-primary-container transition-all font-semibold"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Skills & Commission */}
        <section className="bg-white rounded-[18px] border border-outline-variant/40 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-5">
          <h2 className="text-lg font-bold text-on-surface">Skills &amp; Commission</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant">Commission Rate (%)</label>
            <div className="relative">
              <input 
                type="number" 
                min="0"
                max="100"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="40"
                className="w-full p-3 pr-10 text-sm rounded-[14px] bg-[#FAFAFA] border border-outline-variant/50 focus:outline-none focus:border-primary-container transition-all font-semibold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">%</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-bold text-on-surface-variant">Service Categories (Multi-select)</label>
            <div className="flex flex-wrap gap-2.5">
              {['Haircuts', 'Coloring', 'Extensions', 'Styling'].map((cat) => {
                const isChecked = categories.includes(cat);
                return (
                  <label 
                    key={cat}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] border cursor-pointer transition-colors text-xs font-bold ${
                      isChecked 
                        ? 'bg-secondary-fixed text-primary border-primary-container' 
                        : 'bg-surface-container-low text-on-surface border-outline-variant/50 hover:bg-surface-variant/20'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategory(cat)}
                      className="hidden"
                    />
                    {isChecked && <Check className="w-4 h-4 text-primary shrink-0" />}
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      {/* Floating Bottom Save Action Area */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0px_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-[800px] mx-auto flex justify-end">
          <button 
            onClick={handleSave}
            className="w-full md:w-auto bg-primary-container text-white font-bold text-sm px-8 py-4 rounded-full shadow-lg hover:shadow-primary-container/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <Save className="w-4 h-4" />
            <span>Save Staff Member</span>
          </button>
        </div>
      </div>
    </div>
  );
}
