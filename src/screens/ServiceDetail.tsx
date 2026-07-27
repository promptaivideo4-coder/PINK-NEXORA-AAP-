import React, { useState } from 'react';
import TopBar from '../components/TopBar';
import { NavigationProps } from '../types';
import { DollarSign, Calendar, TrendingUp, Edit2, UserPlus, X, Check, Users, Clock, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice } from '../utils/currency';

interface Staff {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials?: string;
}

const allStaff: Staff[] = [
  {
    id: 'ST-04',
    name: 'Meera Nair',
    role: 'Master Colorist',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX9suc42r4KQVBjor4uu3jJIjFJcZRrOCVvv8RhYm1kL2rV2MasRrGbVMah3hODWqh09JGdO60LZAMOWe6pvW1KvBhpy_paW2bWvuMGjrjQo5NEfa4YWolfMjaUoGstTVMtac0jKcArGI6fLkZXEVvfQVBq4yIV6s-dRLdnscIEgEgfhJORY00od30mkxeLrkK6ZLbVmED47Y4upYguL-lHwj92m8jvQ5Ai90GRJp1CnHwEMkneTdG0ZsmArqSKYiPPCxYT17F_O0'
  },
  {
    id: 'ST-01',
    name: 'Rohan Verma',
    role: 'Senior Stylist',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyf4VcLUMaEM0m6PadDcit1jUUggKlqYDpqfkdKIYX9DjNKpIQduN3rhMMxkxZcHLJrZyPtmC3xyJ-L_bKDGwbKqOJsD9ji-Yj16EqwvlmpSS26tgrIxd8LS244zFlgOiSsK4WaarpND8yETT5PA-SBlLzEdtrGlt4ExJYHmtp59EVR1cEX6coGxMR_gVY2ao1dmjveaYRQM-YaFbEd_SJOT2oYZ1Sc4nSmlqze5c4wMjyVHudJx6kMRWvVgtBMWYAHJVc7FQupUw'
  },
  {
    id: 'ST-02',
    name: 'Amit Patel',
    role: 'Barber Specialist',
    initials: 'AP'
  },
  {
    id: 'ST-03',
    name: 'Ananya Sharma',
    role: 'Hair Care & Treatment Specialist',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNro9Tvx2mCg1vwb2oUbG_H3AMDFPVQ_r9dtXjs0XsvegF1ZbaDuEV5MPvyUlKkxAnamZSwpRbX_F378ZST4-G-lza0X03d1EZH2enioAI8HFWMK3pKsEDMoHBGKPfpRRJ2Gm83L1DWP-fxpBtiPhIvWozKi0CXHv2DXiIOz_7VMcieHpN-zsaHHee5M5CrYh2YU-oe13dPP1VLpJdTPEMJ6UCd9NzRLD1MyH_XuPuQifa-tFa4HNUrkxCpSOkX1QoAn2T5X8ES94'
  }
];

const presetTemplates = [
  {
    name: 'Balayage & Blowdry',
    category: 'Premium Service',
    duration: 180,
    price: 240,
    description: 'A customized, hand-painted highlighting technique creating a soft, natural gradation of lightness towards the ends. Includes professional gloss toner, deep conditioning, and a signature blowout styling.'
  },
  {
    name: 'Haircut & Styling',
    category: 'Hair Styling',
    duration: 60,
    price: 75,
    description: 'A personalized consultation followed by a professional relaxing hair wash, a bespoke haircut tailored to your face structure, and a premium salon blow-dry styling.'
  },
  {
    name: 'Hydra Facial',
    category: 'Facial & Skincare',
    duration: 75,
    price: 120,
    description: 'An advanced multi-step skin treatment that combines cleansing, exfoliation, extraction, hydration, and antioxidant protection simultaneously, resulting in clearer, more beautiful skin with no discomfort or downtime.'
  },
  {
    name: 'Keratin Treatment',
    category: 'Hair Treatment',
    duration: 150,
    price: 180,
    description: 'A professional-grade deep-conditioning treatment designed to rebuild, strengthen, and smooth frizzy hair. Delivers silky, straight-looking results that last up to 12 weeks.'
  },
  {
    name: 'Bridal Makeup',
    category: 'Makeup',
    duration: 120,
    price: 350,
    description: 'Complete HD luxury bridal makeup, including skin prep, contouring, lash application, hairstyle setup, and drape assistance to ensure a gorgeous, long-lasting look for your special day.'
  },
  {
    name: 'Manicure & Pedicure',
    category: 'Nails & Spa',
    duration: 90,
    price: 65,
    description: 'A luxurious nail spa treatment involving deep cleansing, skin exfoliation, mask therapy, gentle massage, nail shaping, cuticle care, and a flawless gel polish application.'
  },
  {
    name: 'Beard Trim & Styling',
    category: 'Hair Styling',
    duration: 30,
    price: 30,
    description: 'Bespoke beard trimming and hot towel edge-shaping using premium oils and balms to condition and style your facial hair to perfection.'
  }
];

export default function ServiceDetail({ navigate }: NavigationProps) {
  const [servicesList, setServicesList] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexora_services');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse nexora_services', e);
      }
    }
    return [];
  });

  const selectedId = localStorage.getItem('nexora_selected_service_id') || 'SRV-01';
  const serviceItem = servicesList.find((s: any) => s.id === selectedId) || servicesList[0] || {
    id: 'SRV-01',
    name: 'Balayage & Styling',
    category: 'Hair',
    description: 'A customized, hand-painted highlighting technique that creates a soft, natural gradation of lightness towards the ends.',
    duration: 120,
    price: 240,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw9naRZ0loBzUpQG7MWjsnG_zY_PI1ow606HO1hgOtQCN7eS4F9SNU82vaAlJuI9nP_pA0lqH-3gDIl6BedEJ2KMYBqnjLPx81IRT1u-5ZNCXvIV96G4Of2THK_tGUJkjAF49lnh5VyTsaPI3VJQphCIO6fflhrL6Ti0deu6eq955lQwvQeJMhwk4SF5FbCjnmV9Y9Trz0r3lSW_Q3EebSRGkhUrv5A2V-0u9qwXA2pdms4WzmRAD_jB30b5KUn6FaIv6bVeXayw0'
  };

  const [serviceName, setServiceName] = useState(serviceItem.name);
  const [price, setPrice] = useState(serviceItem.price);
  const [duration, setDuration] = useState(serviceItem.duration);
  const [category, setCategory] = useState(serviceItem.category);
  const [description, setDescription] = useState(serviceItem.description);
  
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>(['ST-04', 'ST-01']);
  
  // Modals Visibility
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  
  // Temp states for forms
  const [tempName, setTempName] = useState(serviceName);
  const [tempPrice, setTempPrice] = useState(price);
  const [tempDuration, setTempDuration] = useState(duration);
  const [tempCategory, setTempCategory] = useState(category);
  const [tempDescription, setTempDescription] = useState(description);
  const [tempSelectedPreset, setTempSelectedPreset] = useState<string | null>(null);

  const applyEditTemplate = (tpl: typeof presetTemplates[0]) => {
    setTempName(tpl.name);
    setTempCategory(tpl.category);
    setTempDuration(tpl.duration);
    setTempPrice(tpl.price);
    setTempDescription(tpl.description);
    setTempSelectedPreset(tpl.name);
  };
  
  const [tempStaffIds, setTempStaffIds] = useState<string[]>(assignedStaffIds);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = ['Hair', 'Nails', 'Spa', 'Aesthetic', 'Premium Service', 'Hair Styling', 'Hair Treatment', 'Facial & Skincare', 'Makeup', 'Nails & Spa'];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEdit = () => {
    setTempName(serviceName);
    setTempPrice(price);
    setTempDuration(duration);
    setTempCategory(category);
    setTempDescription(description);
    setTempSelectedPreset(null);
    setIsEditModalOpen(true);
  };

  const handleOpenStaff = () => {
    setTempStaffIds([...assignedStaffIds]);
    setIsStaffModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setServiceName(tempName);
    setPrice(Number(tempPrice));
    setDuration(Number(tempDuration));
    setCategory(tempCategory);
    setDescription(tempDescription);

    const updatedList = servicesList.map((s: any) => {
      if (s.id === selectedId) {
        return {
          ...s,
          name: tempName,
          price: Number(tempPrice),
          duration: Number(tempDuration),
          category: tempCategory,
          description: tempDescription
        };
      }
      return s;
    });
    setServicesList(updatedList);
    localStorage.setItem('nexora_services', JSON.stringify(updatedList));

    setIsEditModalOpen(false);
    triggerToast('Service details updated successfully!');
  };

  const handleSaveStaff = () => {
    setAssignedStaffIds([...tempStaffIds]);
    setIsStaffModalOpen(false);
    triggerToast('Staff assignments updated successfully!');
  };

  const toggleStaffTempSelection = (id: string) => {
    if (tempStaffIds.includes(id)) {
      setTempStaffIds(tempStaffIds.filter(sid => sid !== id));
    } else {
      setTempStaffIds([...tempStaffIds, id]);
    }
  };
  return (
    <Layout currentScreen="services" navigate={navigate} title={serviceName} showBack onBack={() => navigate('services')} showSettings transparentTopBar>
      <div className="px-4 py-4 max-w-md mx-auto space-y-8 w-full pb-32">
        
        {/* Hero Section */}
        <section className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden bg-white/90 backdrop-blur-[20px] border border-[#E8E8E8] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] -mt-16">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCf4_wDszNUueHpEVtoXtWKYdLhlC8vTOP4X6fG1pdqegiQsUSLMxoBvLdqibbymJCyngUsiGTsB5nVlFUDIzWhQK6mvjs8XgPcu-MgSFjr-TKbBPBQ-eNXytAunBac67aSzzLO1l0jPUwyeCIoI2I84-hBky3y5hoMgDnemWfQhO-0E044aPGEAB6AL2EA5QvnIN9b9Q2_TxIUh0KabM8IxwxgBXFH1GyKe7CegdSioO4rQMPef4ThFB6ei1vDk3vmotX25UJNB74')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 p-5 md:p-8 w-full">
            <span className="inline-block bg-primary-container text-white text-[13px] font-medium px-3 py-1 rounded-full mb-2 bg-opacity-90 backdrop-blur-sm">{category}</span>
            <h2 className="text-[32px] md:text-5xl font-bold text-white tracking-tight">{serviceName}</h2>
            <p className="text-base text-white/90 mt-1">Starting at {formatPrice(price)} • {duration} Min</p>
          </div>
        </section>

        {/* Bento Grid for Stats & Info */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenue Widget */}
          <div className="bg-white/90 backdrop-blur-[20px] border border-[#E8E8E8] rounded-[18px] p-5 flex flex-col justify-center items-center text-center shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed text-primary flex items-center justify-center mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider">Monthly Revenue</p>
            <p className="text-[32px] font-bold text-on-surface mt-1 tracking-tight">{formatPrice(Math.round((price * 45) * 0.8))}</p>
            <div className="flex items-center text-sm text-green-600 mt-2 font-medium">
              <TrendingUp className="w-4 h-4 mr-1" /> +8.4% vs last month
            </div>
          </div>

          {/* Booking Frequency Widget */}
          <div className="bg-white/90 backdrop-blur-[20px] border border-[#E8E8E8] rounded-[18px] p-5 flex flex-col justify-center items-center text-center shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
            <div className="w-12 h-12 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-[13px] font-medium text-on-surface-variant uppercase tracking-wider">Booking Frequency</p>
            <p className="text-[32px] font-bold text-on-surface mt-1 tracking-tight">45 / mo</p>
            <div className="flex items-center text-sm text-green-600 mt-2 font-medium">
              <TrendingUp className="w-4 h-4 mr-1" /> +12% vs last month
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/90 backdrop-blur-[20px] border border-[#E8E8E8] rounded-[18px] p-5 flex flex-col justify-center shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
            <h3 className="text-[18px] font-semibold text-on-surface mb-2">Service Details</h3>
            <p className="text-base text-on-surface-variant leading-relaxed line-clamp-4">{description}</p>
          </div>
        </section>

        {/* Assigned Staff */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-on-surface">Assigned Specialists</h3>
            <button onClick={handleOpenStaff} className="text-primary font-medium hover:underline text-sm">Manage Staff</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allStaff.filter(s => assignedStaffIds.includes(s.id)).map(staff => (
              <div key={staff.id} className="bg-white/90 backdrop-blur-[20px] border border-[#E8E8E8] rounded-[14px] p-4 flex items-center space-x-4 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
                {staff.avatar ? (
                  <img src={staff.avatar} alt={staff.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm border border-primary/10 shrink-0">
                    {staff.initials || staff.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div>
                  <p className="text-[16px] font-semibold text-on-surface">{staff.name}</p>
                  <p className="text-[13px] font-medium text-on-surface-variant">{staff.role}</p>
                </div>
              </div>
            ))}
            {assignedStaffIds.length === 0 && (
              <div className="col-span-full py-8 text-center text-on-surface-variant text-sm font-medium bg-white/50 border border-dashed border-[#E8E8E8] rounded-[14px]">
                No specialists assigned. Click "Manage Staff Assignment" below to assign.
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex flex-col sm:flex-row gap-4 mt-8">
          <button 
            onClick={handleOpenEdit}
            className="flex-1 bg-primary-container text-white py-3 px-6 rounded-[16px] font-semibold flex items-center justify-center space-x-2 active:scale-95 transition-transform shadow-md hover:opacity-90"
          >
            <Edit2 className="w-5 h-5" />
            <span>Edit Service Details</span>
          </button>
          <button 
            onClick={handleOpenStaff}
            className="flex-1 bg-secondary-fixed text-primary py-3 px-6 rounded-[16px] font-medium flex items-center justify-center space-x-2 active:scale-95 transition-transform hover:bg-secondary-fixed-dim"
          >
            <UserPlus className="w-5 h-5" />
            <span>Manage Staff Assignment</span>
          </button>
        </section>

      </div>

      {/* Edit Service Details Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#E8E8E8] z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-[#F0F0F0]">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Edit Service Details</h3>
                  <p className="text-xs font-medium text-on-surface-variant mt-0.5">Modify core service configurations</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F5F5] text-on-surface hover:bg-surface-variant flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Modal Form */}
              <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Smart Preset Templates */}
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span>Smart Preset Templates</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {presetTemplates.map((tpl) => {
                      const isSelected = tempSelectedPreset === tpl.name;
                      return (
                        <button
                          key={tpl.name}
                          type="button"
                          onClick={() => applyEditTemplate(tpl)}
                          className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 border flex items-center gap-1 active:scale-95 ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-white text-on-surface border-[#E8E8E8] hover:border-primary/45 hover:bg-primary/5'
                          }`}
                        >
                          <span>{tpl.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Service Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Service Name</label>
                  <input 
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => {
                      setTempName(e.target.value);
                      setTempSelectedPreset(null);
                    }}
                    placeholder="e.g. Balayage & Styling"
                    className="w-full h-12 px-4 bg-[#F8F9FA] border border-[#E8E8E8] rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Category</label>
                  <select
                    value={tempCategory}
                    onChange={(e) => {
                      setTempCategory(e.target.value);
                      setTempSelectedPreset(null);
                    }}
                    className="w-full h-12 px-4 bg-[#F8F9FA] border border-[#E8E8E8] rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Price & Duration Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Price ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">$</span>
                      <input 
                        type="number"
                        required
                        min="0"
                        value={tempPrice}
                        onChange={(e) => {
                          setTempPrice(Number(e.target.value));
                          setTempSelectedPreset(null);
                        }}
                        placeholder="240"
                        className="w-full h-12 pl-8 pr-4 bg-[#F8F9FA] border border-[#E8E8E8] rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Duration (Mins)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        required
                        min="1"
                        value={tempDuration}
                        onChange={(e) => {
                          setTempDuration(Number(e.target.value));
                          setTempSelectedPreset(null);
                        }}
                        placeholder="180"
                        className="w-full h-12 pl-4 pr-12 bg-[#F8F9FA] border border-[#E8E8E8] rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">min</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">Description</label>
                  <textarea 
                    rows={4}
                    required
                    value={tempDescription}
                    onChange={(e) => {
                      setTempDescription(e.target.value);
                      setTempSelectedPreset(null);
                    }}
                    placeholder="Provide a compelling description of this service..."
                    className="w-full p-4 bg-[#F8F9FA] border border-[#E8E8E8] rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-[#F0F0F0]">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 h-12 rounded-xl text-sm font-semibold border border-[#E8E8E8] text-on-surface-variant hover:bg-[#F8F9FA] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 rounded-xl text-sm font-semibold bg-primary text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Staff Assignment Drawer/Modal */}
      <AnimatePresence>
        {isStaffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStaffModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E8E8E8] z-10 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-[#F0F0F0]">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Manage Staff</h3>
                  <p className="text-xs font-medium text-on-surface-variant mt-0.5">Assign stylists to this service</p>
                </div>
                <button 
                  onClick={() => setIsStaffModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F5F5] text-on-surface hover:bg-surface-variant flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Specialists List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Available Specialists</div>
                
                <div className="space-y-2.5">
                  {allStaff.map((staff) => {
                    const isSelected = tempStaffIds.includes(staff.id);
                    return (
                      <div 
                        key={staff.id}
                        onClick={() => toggleStaffTempSelection(staff.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                          isSelected 
                            ? 'bg-primary/5 border-primary/30 shadow-xs' 
                            : 'bg-white border-[#E8E8E8] hover:bg-[#F8F9FA]'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          {/* Avatar */}
                          {staff.avatar ? (
                            <img src={staff.avatar} alt={staff.name} className="w-11 h-11 rounded-full object-cover shadow-xs shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/10">
                              {staff.initials}
                            </div>
                          )}
                          
                          {/* Name & Role */}
                          <div>
                            <h4 className="text-sm font-bold text-on-surface">{staff.name}</h4>
                            <p className="text-xs text-on-surface-variant font-medium mt-0.5">{staff.role}</p>
                          </div>
                        </div>
                        
                        {/* Checkbox / Toggle */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-primary border-primary text-white' 
                            : 'border-[#CCCCCC] bg-transparent'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-[#F0F0F0] bg-[#FDFDFD] flex gap-3">
                <button
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 h-12 rounded-xl text-sm font-semibold border border-[#E8E8E8] text-on-surface-variant bg-white hover:bg-[#F8F9FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStaff}
                  className="flex-1 h-12 rounded-xl text-sm font-semibold bg-primary text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Changes</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-sm font-semibold px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-xl border border-neutral-800"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-neutral-900 shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3px]" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
