import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import PasswordField from '../components/PasswordField';
import OtpVerificationModal from '../components/OtpVerificationModal';
import SuccessModal from '../components/SuccessModal';
import { NavigationProps } from '../types';
import { supabase } from '../lib/supabase';
import { fetchMyShop, updateShopProfile, MyShop } from '../lib/shopRepository';
import { 
  Building2, 
  User, 
  MapPin, 
  Clock, 
  Edit2, 
  Camera, 
  Check, 
  Save, 
  Mail, 
  Phone, 
  Bell, 
  Moon, 
  Sun,
  Globe, 
  Shield, 
  LogOut, 
  ChevronRight,
  Sparkles,
  FileText,
  Download,
  Lock,
  RefreshCw,
  X,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

import { queueAction } from '../lib/sync-manager';

export default function Profile({ navigate }: NavigationProps) {
  const [activeTab, setActiveTab] = useState<'business' | 'personal'>('business');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hidden file inputs
  const businessLogoInputRef = useRef<HTMLInputElement>(null);
  const personalAvatarInputRef = useRef<HTMLInputElement>(null);

  // Business Profile Form State
  const [shopId, setShopId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState(() => localStorage.getItem('nexora_business_name') || 'Nexora Beauty Studio');
  const [businessCategory, setBusinessCategory] = useState(() => localStorage.getItem('nexora_business_category') || 'hair');
  const [businessPhone, setBusinessPhone] = useState(() => localStorage.getItem('nexora_business_phone') || '');
  const [description, setDescription] = useState(() => localStorage.getItem('nexora_business_desc') || '');
  const [gstNumber, setGstNumber] = useState(() => localStorage.getItem('nexora_gst_number') || '29GGGGG1314R9Z6');
  const [address, setAddress] = useState(() => localStorage.getItem('nexora_address') || '124 Connaught Place, New Delhi');
  const [city, setCity] = useState(() => localStorage.getItem('nexora_city') || 'Metropolis');
  const [area, setArea] = useState(() => localStorage.getItem('nexora_area') || '');
  const [zone, setZone] = useState(() => localStorage.getItem('nexora_zone') || '');
  const [landmark, setLandmark] = useState(() => localStorage.getItem('nexora_landmark') || '');
  const [postalCode, setPostalCode] = useState(() => localStorage.getItem('nexora_postal_code') || '50001');

  // Business Logo & Personal Avatar State
  const [businessLogo, setBusinessLogo] = useState(() => 
    localStorage.getItem('nexora_business_logo') || 
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDXlmvM_30Uj5YtZpTn690LItFahReO2j7Rit39KLjtXVnnC_lGikQ3S2M2LbYMmlyK6RXYCdsOeiauyiwIjeGyqmQKeSvwqKKxqdCufCH3PA5rNQxn5Il2GmxR_NMqjjCtSnY4BjpRPUbumLb-f3nenQQ48WUX_UJcKCyynvQDYmTGs3eCShA-wxUnTCMhQwx-GXiC--7UIBq-hQaYHH9gglqGjYqQzRliTRkjD4TO9CArfmjeM8IOARKV2KFFORel1dBCok7IxVw'
  );
  const [personalAvatar, setPersonalAvatar] = useState(() => 
    localStorage.getItem('nexora_personal_avatar') || 
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBqgvGNG39kGIBgw1Oz3QIWte4icOiprO-WoXM9uFOtvqYe5LvvjgWPpCb_nwz3R7azRQVDECwN6oKp-5KV9u4TdiZOLQ8D0_vdd5lUHA7c5BzEn7bTM8ekQHbTaHvSlfHcAEGlfayEVy2AEoY4IXBgNM46M5EXNE6w3_8Uwy1U7K-rQpcNpkTj9Megb4bgdWwwAXfUDy6U8onZdBSX_v6YO1dWqr11-6DTM8PF5QgXsI1K2jpJmWMPYb20yvFig7ApTWtw2P5iBn0'
  );

  // Settings Toggles State
  const [autoConfirmBookings, setAutoConfirmBookings] = useState(() => {
    const saved = localStorage.getItem('nexora_auto_confirm');
    return saved ? saved === 'true' : true;
  });
  const [smsNotifications, setSmsNotifications] = useState(() => {
    const saved = localStorage.getItem('nexora_sms_notifications');
    return saved ? saved === 'true' : true;
  });
  const [marketingReminders, setMarketingReminders] = useState(() => {
    const saved = localStorage.getItem('nexora_marketing_reminders');
    return saved ? saved === 'true' : false;
  });
  const [businessHoursEnabled, setBusinessHoursEnabled] = useState(() => {
    const saved = localStorage.getItem('nexora_business_hours_enabled');
    return saved ? saved === 'true' : true;
  });

  // Operating Hours State
  const [schedules, setSchedules] = useState<DaySchedule[]>(() => {
    const saved = localStorage.getItem('nexora_schedules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse nexora_schedules', e);
      }
    }
    return [
      { day: 'Mon', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM' },
      { day: 'Tue', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM' },
      { day: 'Wed', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM' },
      { day: 'Thu', isOpen: true, openTime: '09:00 AM', closeTime: '08:00 PM' },
      { day: 'Fri', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
      { day: 'Sat', isOpen: true, openTime: '10:00 AM', closeTime: '06:00 PM' },
      { day: 'Sun', isOpen: false, openTime: '10:00 AM', closeTime: '05:00 PM' },
    ];
  });

  // Personal Profile State
  const [fullName, setFullName] = useState(() => localStorage.getItem('nexora_full_name') || 'Suman Gupta');
  const [email, setEmail] = useState(() => localStorage.getItem('nexora_email') || 'suman.g@nexora.app');
  const [phone, setPhone] = useState(() => localStorage.getItem('nexora_phone') || '+91 98765 43210');
  const [ownerRole, setOwnerRole] = useState(() => localStorage.getItem('nexora_owner_role') || 'Owner & Lead Stylist');

  // Load live data from Supabase on mount
  useEffect(() => {
    async function loadLiveProfile() {
      try {
        const shop = await fetchMyShop(supabase);
        if (shop) {
          setShopId(shop.id);
          if (shop.name) { setBusinessName(shop.name); localStorage.setItem('nexora_business_name', shop.name); }
          if (shop.businessCategory) { setBusinessCategory(shop.businessCategory); localStorage.setItem('nexora_business_category', shop.businessCategory); }
          if (shop.phone) { setBusinessPhone(shop.phone); localStorage.setItem('nexora_business_phone', shop.phone); }
          if (shop.description) { setDescription(shop.description); localStorage.setItem('nexora_business_desc', shop.description); }
          if (shop.address) { setAddress(shop.address); localStorage.setItem('nexora_address', shop.address); }
          if (shop.city) { setCity(shop.city); localStorage.setItem('nexora_city', shop.city); }
          if (shop.area) { setArea(shop.area); localStorage.setItem('nexora_area', shop.area); }
          if (shop.zone) { setZone(shop.zone); localStorage.setItem('nexora_zone', shop.zone); }
          if (shop.landmark) { setLandmark(shop.landmark); localStorage.setItem('nexora_landmark', shop.landmark); }
          if (shop.pincode) { setPostalCode(shop.pincode); localStorage.setItem('nexora_postal_code', shop.pincode); }
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.email) setEmail(user.email);
          const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
          if (profile) {
            if (profile.full_name) { setFullName(profile.full_name); localStorage.setItem('nexora_full_name', profile.full_name); }
            if (profile.phone) { setPhone(profile.phone); localStorage.setItem('nexora_phone', profile.phone); }
          }
        }
      } catch (err) {
        console.warn('Profile load from Supabase:', err);
      }
    }
    void loadLiveProfile();
  }, []);

  // Modals state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSwitchAccountOpen, setIsSwitchAccountOpen] = useState(false);

  // App Preference Modals State
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Preferences Values State
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState(() => {
    const saved = localStorage.getItem('nexora_push_alerts');
    return saved ? saved === 'true' : true;
  });
  const [emailSummariesEnabled, setEmailSummariesEnabled] = useState(() => {
    const saved = localStorage.getItem('nexora_email_summaries');
    return saved ? saved === 'true' : true;
  });
  const [themeSelected, setThemeSelected] = useState<'light' | 'dark' | 'vibrant-pink'>(() => {
    return (localStorage.getItem('nexora_theme') as any) || 'vibrant-pink';
  });
  const [localeLanguage, setLocaleLanguage] = useState(() => {
    return localStorage.getItem('nexora_language') || 'English';
  });
  const [localeCurrency, setLocaleCurrency] = useState(() => {
    return localStorage.getItem('nexora_currency') || 'INR';
  });
  const [biometricLockEnabled, setBiometricLockEnabled] = useState(() => {
    const saved = localStorage.getItem('nexora_biometric_lock');
    return saved ? saved === 'true' : false;
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    const saved = localStorage.getItem('nexora_2fa');
    return saved ? saved === 'true' : false;
  });
  const [staffPermission, setStaffPermission] = useState(() => {
    return localStorage.getItem('nexora_staff_permissions') || 'Full Access';
  });

  // Dynamically apply theme changes on mount or state change
  React.useEffect(() => {
    if (themeSelected === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (themeSelected === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      // Vibrant Pink (System/Default Theme)
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nexora_theme', themeSelected);
  }, [themeSelected]);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [passwordChangeStep, setPasswordChangeStep] = useState<'form' | 'otp' | 'success'>('form');

  const timeOptions = [
    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
    '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleDay = (index: number) => {
    setSchedules(prev => prev.map((s, i) => i === index ? { ...s, isOpen: !s.isOpen } : s));
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    setSchedules(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSaveBusiness = async () => {
    // 1. Save to localStorage for immediate local feedback
    localStorage.setItem('nexora_business_name', businessName);
    localStorage.setItem('nexora_business_category', businessCategory);
    localStorage.setItem('nexora_business_phone', businessPhone);
    localStorage.setItem('nexora_business_desc', description);
    localStorage.setItem('nexora_gst_number', gstNumber);
    localStorage.setItem('nexora_address', address);
    localStorage.setItem('nexora_city', city);
    localStorage.setItem('nexora_area', area);
    localStorage.setItem('nexora_zone', zone);
    localStorage.setItem('nexora_landmark', landmark);
    localStorage.setItem('nexora_postal_code', postalCode);
    localStorage.setItem('nexora_schedules', JSON.stringify(schedules));
    localStorage.setItem('nexora_business_logo', businessLogo);
    localStorage.setItem('nexora_business_hours_enabled', String(businessHoursEnabled));
    localStorage.setItem('nexora_auto_confirm', String(autoConfirmBookings));
    localStorage.setItem('nexora_sms_notifications', String(smsNotifications));
    localStorage.setItem('nexora_marketing_reminders', String(marketingReminders));

    // 2. Persist to real Supabase database
    try {
      let currentShopId = shopId;
      if (!currentShopId) {
        const fresh = await fetchMyShop(supabase);
        if (fresh) {
          currentShopId = fresh.id;
          setShopId(fresh.id);
        }
      }

      if (currentShopId) {
        const res = await updateShopProfile(supabase, currentShopId, {
          name: businessName,
          businessCategory: businessCategory || null,
          phone: businessPhone || null,
          description: description || null,
          address: address || null,
          city: city || null,
          area: area || null,
          zone: zone || null,
          landmark: landmark || null,
          pincode: postalCode || null,
        });

        if (res.ok) {
          triggerToast('Business profile saved and synced with Supabase!');
        } else {
          triggerToast(`Saved locally. (Database note: ${res.error})`);
        }
      } else {
        triggerToast('Business profile saved locally.');
      }
    } catch (err: any) {
      console.error('Failed to sync business update to Supabase', err);
      triggerToast('Business profile saved locally.');
    }
  };

  const handleSavePersonal = async () => {
    // 1. Save to localStorage
    localStorage.setItem('nexora_full_name', fullName);
    localStorage.setItem('nexora_email', email);
    localStorage.setItem('nexora_phone', phone);
    localStorage.setItem('nexora_personal_avatar', personalAvatar);
    localStorage.setItem('nexora_owner_role', ownerRole);

    // 2. Persist to Supabase profiles
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: phone.trim() || null,
          })
          .eq('id', user.id);
        triggerToast('Personal details saved and synced with Supabase!');
      } else {
        triggerToast('Personal details saved locally.');
      }
    } catch (err) {
      console.error('Failed to sync personal update to Supabase', err);
      triggerToast('Personal details saved locally.');
    }
  };

  // Image upload triggers
  const handleBusinessLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setBusinessLogo(reader.result);
          localStorage.setItem('nexora_business_logo', reader.result);
          triggerToast('Business logo updated successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePersonalAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPersonalAvatar(reader.result);
          localStorage.setItem('nexora_personal_avatar', reader.result);
          triggerToast('Personal avatar updated successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Export Data Logic
  const handleExportData = () => {
    const salonData = {
      exportedAt: new Date().toISOString(),
      businessProfile: {
        businessName,
        gstNumber,
        address,
        city,
        postalCode,
        operatingHours: schedules,
        automation: {
          businessHoursEnabled,
          autoConfirmBookings,
          smsNotifications,
          marketingReminders
        }
      },
      personalAccount: {
        fullName,
        email,
        phone,
        ownerRole
      },
      services: (() => {
        const saved = localStorage.getItem('nexora_services');
        if (saved) {
          try { return JSON.parse(saved); } catch (e) { return []; }
        }
        return [];
      })()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(salonData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexora_salon_backup_${businessName.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    triggerToast('Salon configuration and data exported successfully!');
  };

  // Password confirmation submission
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    // Simulate current password verification
    if (currentPassword !== 'password123') {
        setPasswordError('Current password is incorrect.');
        return;
    }

    setPasswordError('');
    setIsOtpOpen(true);
    setPasswordChangeStep('otp');
    triggerToast('Verification code has been sent to your registered email.');
  };

  // Switch account user list
  const accounts = [
    {
      name: 'Suman Gupta',
      role: 'Owner & Lead Stylist',
      email: 'suman.g@nexora.app',
      phone: '+91 98765 43210',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqgvGNG39kGIBgw1Oz3QIWte4icOiprO-WoXM9uFOtvqYe5LvvjgWPpCb_nwz3R7azRQVDECwN6oKp-5KV9u4TdiZOLQ8D0_vdd5lUHA7c5BzEn7bTM8ekQHbTaHvSlfHcAEGlfayEVy2AEoY4IXBgNM46M5EXNE6w3_8Uwy1U7K-rQpcNpkTj9Megb4bgdWwwAXfUDy6U8onZdBSX_v6YO1dWqr11-6DTM8PF5QgXsI1K2jpJmWMPYb20yvFig7ApTWtw2P5iBn0'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Master Colorist',
      email: 'elena.r@nexora.app',
      phone: '+91 88888 77777',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX9suc42r4KQVBjor4uu3jJIjFJcZRrOCVvv8RhYm1kL2rV2MasRrGbVMah3hODWqh09JGdO60LZAMOWe6pvW1KvBhpy_paW2bWvuMGjrjQo5NEfa4YWolfMjaUoGstTVMtac0jKcArGI6fLkZXEVvfQVBq4yIV6s-dRLdnscIEgEgfhJORY00od30mkxeLrkK6ZLbVmED47Y4upYguL-lHwj92m8jvQ5Ai90GRJp1CnHwEMkneTdG0ZsmArqSKYiPPCxYT17F_O0'
    },
    {
      name: 'Marcus Chen',
      role: 'Senior Stylist',
      email: 'marcus.c@nexora.app',
      phone: '+91 77777 66666',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaRjmhCnzthmFuqTHPH3iZH3GI7peDf4lz5A9utpERzswvmBKXyjCXLwL7b54taUHvtSZ8JArbJLV28NxO-rv55J-S3o9trEqO9LrXbc7T8agWS5xZWn0J8NnTC35CnqVv_P8xow9EAF-YrYfvf_DrUwa6xrDbmVvE-b4KH2_gIzJO_P5w048hK06pDRR_djNvNcZMeAUoVDFkPGgAv_It7PYY9ktSFaaiAk0aTzSTRSOpYUyM7LXCd0X-KrnqZIRA6VRdtNY6ONs'
    }
  ];

  const handleSwitchAccount = (acc: typeof accounts[0]) => {
    setFullName(acc.name);
    setEmail(acc.email);
    setPhone(acc.phone);
    setOwnerRole(acc.role);
    setPersonalAvatar(acc.avatar);

    localStorage.setItem('nexora_full_name', acc.name);
    localStorage.setItem('nexora_email', acc.email);
    localStorage.setItem('nexora_phone', acc.phone);
    localStorage.setItem('nexora_owner_role', acc.role);
    localStorage.setItem('nexora_personal_avatar', acc.avatar);

    setIsSwitchAccountOpen(false);
    triggerToast(`Successfully switched to ${acc.name}!`);
  };

  return (
    <Layout currentScreen="profile" navigate={navigate} title="Business Profile" showSettings={true}>
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={businessLogoInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleBusinessLogoUpload} 
      />
      <input 
        type="file" 
        ref={personalAvatarInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handlePersonalAvatarUpload} 
      />

      <div id="profile-container" className="px-4 py-6 max-w-md mx-auto w-full space-y-6">
        
        {/* Header Title & Tab Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Business Profile & Settings</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Manage your public-facing salon information, location, and account preferences.</p>
          </div>

          <div className="flex bg-surface-container-high/80 p-1 rounded-full border border-outline-variant/40 self-start sm:self-auto">
            <button
              onClick={() => {
                setActiveTab('business');
                triggerToast('Switched to Business Profile details');
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'business'
                  ? 'bg-primary-container text-on-primary-container shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Business Profile</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('personal');
                triggerToast('Switched to Personal Account details');
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                activeTab === 'personal'
                  ? 'bg-primary-container text-on-primary-container shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal Account</span>
            </button>
          </div>
        </div>

        {/* Dynamic Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-md fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-sm"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: BUSINESS PROFILE */}
        {activeTab === 'business' && (
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Column: Logo & Location */}
            <div className="flex-1 space-y-6">
              
              {/* Logo & Brand Info Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center gap-6">
                <div 
                  className="relative group cursor-pointer" 
                  onClick={() => businessLogoInputRef.current?.click()}
                  title="Click to upload a new business logo"
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-outline-variant/50 bg-surface-container-low flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-[1.02] group-hover:brightness-95">
                    <img 
                      src={businessLogo} 
                      alt="Business Logo" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-lg hover:bg-primary transition-colors border-2 border-surface-container-lowest">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Business Name</label>
                    <input 
                      type="text" 
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Nexora Beauty Studio"
                      className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant">Business Category</label>
                      <select 
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-3 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      >
                        <option value="hair">Hair Salon</option>
                        <option value="nails">Nail Studio</option>
                        <option value="spa">Spa & Wellness</option>
                        <option value="barber">Barbershop</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant">Shop Contact Phone</label>
                      <input 
                        type="tel" 
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">About / Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Describe your salon, services, and specialty..."
                      className="w-full bg-surface border border-outline-variant/60 rounded-xl p-3 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">GST / Tax Identification Number</label>
                    <div className="relative">
                      <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                      <input 
                        type="text" 
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        placeholder="e.g. 29GGGGG1314R9Z6"
                        className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl pl-9 pr-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/40">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-on-surface">Location Details</h2>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Street Address</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 124 Connaught Place, New Delhi"
                    className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">City</label>
                    <input 
                      type="text" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Jaipur"
                      className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Area / Locality</label>
                    <input 
                      type="text" 
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Malviya Nagar"
                      className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Zone</label>
                    <input 
                      type="text" 
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      placeholder="e.g. South Jaipur"
                      className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Landmark</label>
                    <input 
                      type="text" 
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near GT Central"
                      className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Pincode</label>
                    <input 
                      type="text" 
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 302017"
                      className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl px-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Set Shop Location — canonical location (map + device location) */}
                <button
                  onClick={() => navigate('shop-location')}
                  className="w-full h-12 bg-primary/10 border border-primary/30 text-primary rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-primary/20 active:scale-[0.98] transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  Set Shop Location
                </button>
                <p className="text-[10px] text-on-surface-variant">
                  Exact map location, lat/lng, address, area — yahi salon ki canonical location hai
                  (users ko map marker + Get Directions isi se milta hai).
                </p>
              </div>

            </div>

            {/* Right Column: Operating Hours, Preferences, & Save Actions */}
            <div className="w-full lg:w-[420px] space-y-6">
              
              {/* Preferences & Automation Switches */}
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/40">
                  <Sliders className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-on-surface">Preferences & Automation</h2>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Business Hours Enforce */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-on-surface">Restrict to Business Hours</h4>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">Require customer bookings to fall within the open operating times</p>
                    </div>
                    <button 
                      onClick={() => {
                        const next = !businessHoursEnabled;
                        setBusinessHoursEnabled(next);
                        triggerToast(next ? 'Business hours rule activated' : 'Business hours rule bypassed');
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                        businessHoursEnabled ? 'bg-primary-container justify-end' : 'bg-surface-container-high justify-start'
                      }`}
                    >
                      <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* Auto Confirm Bookings */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-on-surface">Auto-confirm Bookings</h4>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">Instantly approve and lock in incoming client slot requests</p>
                    </div>
                    <button 
                      onClick={() => {
                        const next = !autoConfirmBookings;
                        setAutoConfirmBookings(next);
                        triggerToast(next ? 'Auto-confirm activated' : 'Manual verification required');
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                        autoConfirmBookings ? 'bg-primary-container justify-end' : 'bg-surface-container-high justify-start'
                      }`}
                    >
                      <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-on-surface">SMS Notifications</h4>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">Send instant SMS updates and confirmations to client phones</p>
                    </div>
                    <button 
                      onClick={() => {
                        const next = !smsNotifications;
                        setSmsNotifications(next);
                        triggerToast(next ? 'Client SMS notifications enabled' : 'Client SMS notifications muted');
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                        smsNotifications ? 'bg-primary-container justify-end' : 'bg-surface-container-high justify-start'
                      }`}
                    >
                      <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* Marketing Reminders */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-on-surface">Marketing Reminders</h4>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">Broadcast seasonal beauty/hair packages and custom deals</p>
                    </div>
                    <button 
                      onClick={() => {
                        const next = !marketingReminders;
                        setMarketingReminders(next);
                        triggerToast(next ? 'Seasonal promotional reminders enabled' : 'Seasonal promos turned off');
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                        marketingReminders ? 'bg-primary-container justify-end' : 'bg-surface-container-high justify-start'
                      }`}
                    >
                      <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Operating Hours Scheduler */}
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <h2 className="text-base font-bold text-on-surface">Operating Hours</h2>
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant">Weekly Schedule</span>
                </div>

                <div className="space-y-3.5 pt-1">
                  {schedules.map((schedule, idx) => (
                    <div key={schedule.day} className={`flex flex-wrap items-center justify-between gap-y-3 p-3 rounded-xl transition-colors ${schedule.isOpen ? 'bg-surface-container-low/50' : 'bg-surface-container-low/20 opacity-70'}`}>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={schedule.isOpen} 
                            onChange={() => {
                              handleToggleDay(idx);
                              triggerToast(`${schedule.day} schedule is now ${!schedule.isOpen ? 'Open' : 'Closed'}`);
                            }}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container"></div>
                        </label>
                        <span className="font-bold text-xs text-on-surface w-8">{schedule.day}</span>
                      </div>

                      {schedule.isOpen ? (
                        <div className="flex items-center gap-2 grow justify-end min-w-[200px]">
                          <select 
                            value={schedule.openTime}
                            onChange={(e) => {
                              handleTimeChange(idx, 'openTime', e.target.value);
                              triggerToast(`Updated ${schedule.day} opening time to ${e.target.value}`);
                            }}
                            className="bg-surface border border-outline-variant/60 text-on-surface font-semibold text-[11px] rounded-lg py-1 px-2 focus:ring-1 focus:ring-primary outline-none flex-1 min-w-[80px]"
                          >
                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-on-surface-variant text-xs shrink-0">-</span>
                          <select 
                            value={schedule.closeTime}
                            onChange={(e) => {
                              handleTimeChange(idx, 'closeTime', e.target.value);
                              triggerToast(`Updated ${schedule.day} closing time to ${e.target.value}`);
                            }}
                            className="bg-surface border border-outline-variant/60 text-on-surface font-semibold text-[11px] rounded-lg py-1 px-2 focus:ring-1 focus:ring-primary outline-none flex-1 min-w-[80px]"
                          >
                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-on-surface-variant/70 px-4 py-1 bg-surface-container-high rounded-lg grow text-center">
                          Closed
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Save Buttons */}
                <div className="pt-4 border-t border-outline-variant/40 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button 
                    onClick={() => navigate('dashboard')}
                    className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-xs font-semibold hover:bg-surface-variant transition-colors w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveBusiness}
                    className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 w-full sm:w-auto"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PERSONAL ACCOUNT */}
        {activeTab === 'personal' && (
          <div className="max-w-[800px] mx-auto w-full space-y-6">
            
            {/* Personal Avatar Header */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center gap-4 text-center">
              <div 
                className="relative group cursor-pointer"
                onClick={() => personalAvatarInputRef.current?.click()}
                title="Click to select a new personal profile picture"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-outline-variant/60 shadow-md bg-surface-container-high transition-all duration-300 group-hover:scale-102 group-hover:brightness-95">
                  <img 
                    src={personalAvatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center hover:scale-105 transition-transform shadow-md border-2 border-white">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">{fullName}</h2>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">{ownerRole}, Nexora Salonos</p>
              </div>
            </div>

            {/* Personal Details Form */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <h3 className="text-sm font-bold text-on-surface pb-2 border-b border-outline-variant/40">Contact Information</h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Suman Gupta"
                    className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl pl-9 pr-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="suman.g@nexora.app"
                    className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl pl-9 pr-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant">Phone Number (with country code)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-11 bg-surface border border-outline-variant/60 rounded-xl pl-9 pr-4 text-xs font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={handleSavePersonal}
                className="mt-2 w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-bold text-xs hover:bg-primary transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Personal Details</span>
              </button>
            </div>

            {/* Account preferences & Modal Actions */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <h3 className="text-sm font-bold text-on-surface pb-2 border-b border-outline-variant/40">Account Actions</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Change Password Button */}
                <button 
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="flex items-center justify-between p-4 bg-surface border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/5 text-primary flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-surface">Change Password</div>
                      <div className="text-[10px] text-on-surface-variant">Secure your owner account credentials</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                </button>

                {/* Switch Account Button */}
                <button 
                  onClick={() => setIsSwitchAccountOpen(true)}
                  className="flex items-center justify-between p-4 bg-surface border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary-container/10 text-secondary flex items-center justify-center shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-surface">Switch Account</div>
                      <div className="text-[10px] text-on-surface-variant">Log in as a different staff role</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                </button>

                {/* Export Data Button */}
                <button 
                  onClick={handleExportData}
                  className="flex items-center justify-between p-4 bg-surface border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition-colors text-left md:col-span-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-surface">Export Business Data</div>
                      <div className="text-[10px] text-on-surface-variant">Download full salon details, operational profiles, & presets as .JSON</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
            </div>

            {/* App Preferences Section - Fully Interactive */}
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] space-y-3">
              <h3 className="text-sm font-bold text-on-surface pb-2 border-b border-outline-variant/40">App Preferences</h3>

              <div className="space-y-1">
                {[
                  { 
                    icon: Bell, 
                    title: 'Push Alerts & Reminders', 
                    desc: `${pushAlertsEnabled ? 'Active' : 'Muted'} • Email summaries ${emailSummariesEnabled ? 'On' : 'Off'}`,
                    action: () => setIsNotificationsModalOpen(true)
                  },
                  { 
                    icon: Moon, 
                    title: 'Appearance & Theme', 
                    desc: `Theme: ${themeSelected === 'vibrant-pink' ? 'Vibrant Pink' : themeSelected === 'dark' ? 'Dark' : 'Light'}`,
                    action: () => setIsThemeModalOpen(true)
                  },
                  { 
                    icon: Globe, 
                    title: 'Language & Locale', 
                    desc: `${localeLanguage} • Currency: ${localeCurrency === 'INR' ? 'Indian Rupee (₹)' : 'US Dollar ($)'}`,
                    action: () => setIsLocaleModalOpen(true)
                  },
                  { 
                    icon: Shield, 
                    title: 'Security Safeguards', 
                    desc: `Biometric: ${biometricLockEnabled ? 'On' : 'Off'} • 2FA: ${twoFactorEnabled ? 'On' : 'Off'} • ${staffPermission}`,
                    action: () => setIsSecurityModalOpen(true)
                  },
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/20 hover:border-primary/30 hover:bg-primary/[0.02] transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all duration-300">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{item.title}</div>
                        <div className="text-[11px] text-on-surface-variant">{item.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Logout */}
            <button 
              onClick={async () => {
                triggerToast('Logging out...');
                await supabase.auth.signOut();
                setTimeout(() => navigate('welcome'), 800);
              }}
              className="w-full bg-error/10 text-error border border-error/20 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-error/20 transition-colors active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out / Switch User Role</span>
            </button>

          </div>
        )}

      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangePasswordOpen && passwordChangeStep === 'form' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <span>Change Account Password</span>
                </h3>
                <button 
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setPasswordError('');
                    setPasswordChangeStep('form');
                  }}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {passwordError && (
                  <div className="p-2.5 bg-error/10 border border-error/30 text-error text-[11px] font-bold rounded-lg">
                    {passwordError}
                  </div>
                )}

                <PasswordField 
                    label="Current Password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                />
                
                <PasswordField 
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    showStrength
                />

                <PasswordField 
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      setPasswordError('');
                      setPasswordChangeStep('form');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface text-xs font-semibold hover:bg-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-115 transition-all shadow-sm disabled:bg-surface-container-high disabled:text-on-surface-variant"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <OtpVerificationModal 
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        email="user@example.com"
        onVerify={(otp) => {
          if (otp === '123456') { // Mock verification
            setPasswordChangeStep('success');
            setIsOtpOpen(false);
          } else {
            setPasswordError('Invalid verification code.');
          }
        }}
      />

      <SuccessModal 
        isOpen={passwordChangeStep === 'success'}
        onClose={() => {
            setIsChangePasswordOpen(false);
            setPasswordChangeStep('form');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }}
      />

      {/* Switch Account Modal */}
      <AnimatePresence>
        {isSwitchAccountOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  <span>Switch User Role</span>
                </h3>
                <button 
                  onClick={() => setIsSwitchAccountOpen(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-on-surface-variant">Switching will dynamically load that team member's customized layout, assigned duties, and security permissions.</p>

              <div className="space-y-2 pt-1">
                {accounts.map((acc) => {
                  const isActive = fullName === acc.name;
                  return (
                    <button
                      key={acc.name}
                      onClick={() => handleSwitchAccount(acc)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                        isActive 
                          ? 'bg-primary-container/10 border-primary text-primary font-bold'
                          : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={acc.avatar} 
                          alt={acc.name} 
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 shrink-0" 
                        />
                        <div>
                          <div className="text-xs font-bold text-on-surface">{acc.name}</div>
                          <div className="text-[10px] text-on-surface-variant font-medium">{acc.role}</div>
                          <div className="text-[9px] text-on-surface-variant/70 font-normal mt-0.5">{acc.email}</div>
                        </div>
                      </div>
                      {isActive ? (
                        <span className="px-2.5 py-1 bg-primary text-white text-[9px] font-extrabold rounded-full">
                          Current
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Settings Modal */}
      <AnimatePresence>
        {isNotificationsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <span>Notification Settings</span>
                </h3>
                <button 
                  onClick={() => setIsNotificationsModalOpen(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Push Alerts Toggle */}
                <div className="flex items-center justify-between gap-4 p-3 bg-surface-container-low rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Push Alerts & Reminders</h4>
                    <p className="text-[10px] text-on-surface-variant">Instant booking and calendar desk alerts</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const next = !pushAlertsEnabled;
                      setPushAlertsEnabled(next);
                      localStorage.setItem('nexora_push_alerts', String(next));
                      triggerToast(next ? 'Push alerts enabled!' : 'Push alerts muted');
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                      pushAlertsEnabled ? 'bg-primary justify-end' : 'bg-surface-container-high justify-start'
                    }`}
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Email Summaries Toggle */}
                <div className="flex items-center justify-between gap-4 p-3 bg-surface-container-low rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Email Summaries</h4>
                    <p className="text-[10px] text-on-surface-variant">Receive weekly metrics and appointment reports</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const next = !emailSummariesEnabled;
                      setEmailSummariesEnabled(next);
                      localStorage.setItem('nexora_email_summaries', String(next));
                      triggerToast(next ? 'Email summaries enabled!' : 'Email summaries disabled');
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                      emailSummariesEnabled ? 'bg-primary justify-end' : 'bg-surface-container-high justify-start'
                    }`}
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsModalOpen(false);
                    triggerToast('Notification preferences saved');
                  }}
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-115 transition-all shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Theme Selector Modal */}
      <AnimatePresence>
        {isThemeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Moon className="w-5 h-5 text-primary" />
                  <span>Appearance & Theme</span>
                </h3>
                <button 
                  onClick={() => setIsThemeModalOpen(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-on-surface-variant">Switch theme mode dynamically across the salon workspace.</p>

              <div className="space-y-2 pt-1">
                {[
                  { value: 'vibrant-pink', label: 'Vibrant Pink (Default)', desc: 'Elegant high-fashion pink branding', icon: Sparkles },
                  { value: 'light', label: 'Light Mode', desc: 'Sleek, high-contrast crisp display', icon: Sun },
                  { value: 'dark', label: 'Dark Mode', desc: 'Relaxing eye-safe dark twilight theme', icon: Moon }
                ].map((t) => {
                  const isActive = themeSelected === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setThemeSelected(t.value as any);
                        triggerToast(`App theme set to ${t.label}`);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-primary-container/10 border-primary text-primary font-bold shadow-2xs'
                          : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          <t.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{t.label}</div>
                          <div className="text-[10px] text-on-surface-variant">{t.desc}</div>
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-115 transition-all shadow-sm cursor-pointer"
                >
                  Save Theme
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Locale Selection Modal */}
      <AnimatePresence>
        {isLocaleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>Language & Locale</span>
                </h3>
                <button 
                  onClick={() => setIsLocaleModalOpen(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-on-surface-variant">Update the language and currency formats. Selecting INR will automatically convert and display salon service prices in Indian Rupees (₹).</p>

              <div className="space-y-4 pt-1">
                {/* Language Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Language Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { code: 'English', label: 'English (US)' },
                      { code: 'Hindi', label: 'Hindi (हिन्दी)' },
                      { code: 'Spanish', label: 'Spanish (Español)' },
                      { code: 'French', label: 'French (Français)' }
                    ].map((lang) => {
                      const isSel = localeLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLocaleLanguage(lang.code);
                            localStorage.setItem('nexora_language', lang.code);
                            triggerToast(`Language changed to ${lang.label}`);
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                            isSel 
                              ? 'bg-primary-container/10 border-primary text-primary font-bold'
                              : 'bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container-low'
                          }`}
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Currency format selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Currency & Price Formats</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { code: 'INR', label: 'Indian Rupee (₹)', desc: 'INR (en-IN) format' }
                    ].map((curr) => {
                      const isSel = localeCurrency === curr.code;
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => {
                            setLocaleCurrency(curr.code);
                            localStorage.setItem('nexora_currency', curr.code);
                            triggerToast(`Currency set to ${curr.label}. Prices updated across services.`);
                            // Trigger dynamic storage update event so other tabs/components hear it if they listen
                            window.dispatchEvent(new Event('storage'));
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSel 
                              ? 'bg-primary-container/10 border-primary text-primary font-bold'
                              : 'bg-surface border-outline-variant/40 text-on-surface hover:bg-surface-container-low'
                          }`}
                        >
                          <span>{curr.label}</span>
                          <span className="text-[10px] font-normal opacity-70 mt-0.5">{curr.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsLocaleModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-115 transition-all shadow-sm cursor-pointer"
                >
                  Apply Locale Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security & Privacy Safeguards Modal */}
      <AnimatePresence>
        {isSecurityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Security & Safeguards</span>
                </h3>
                <button 
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-on-surface-variant">Protect customer databases, payment schedules, and staff permission rosters.</p>

              <div className="space-y-3 pt-1">
                {/* Biometric lock toggle */}
                <div className="flex items-center justify-between gap-4 p-3.5 bg-surface-container-low rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Biometric Lock</h4>
                    <p className="text-[10px] text-on-surface-variant">FaceID or TouchID before viewing customer files</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const next = !biometricLockEnabled;
                      setBiometricLockEnabled(next);
                      localStorage.setItem('nexora_biometric_lock', String(next));
                      triggerToast(next ? 'Biometric security activated!' : 'Biometric security deactivated');
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                      biometricLockEnabled ? 'bg-primary justify-end' : 'bg-surface-container-high justify-start'
                    }`}
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Two-Factor Auth toggle */}
                <div className="flex items-center justify-between gap-4 p-3.5 bg-surface-container-low rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Two-Factor Auth (2FA)</h4>
                    <p className="text-[10px] text-on-surface-variant">Require phone SMS token code at login</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const next = !twoFactorEnabled;
                      setTwoFactorEnabled(next);
                      localStorage.setItem('nexora_2fa', String(next));
                      triggerToast(next ? 'Two-Factor Auth (2FA) enabled!' : 'Two-Factor Auth disabled');
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                      twoFactorEnabled ? 'bg-primary justify-end' : 'bg-surface-container-high justify-start'
                    }`}
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Staff Access permissions dropdown */}
                <div className="space-y-1 p-3 bg-surface-container-low rounded-xl">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Staff Access Permissions</label>
                  <p className="text-[9px] text-on-surface-variant mb-2">Controls what team members can see or change</p>
                  <select
                    value={staffPermission}
                    onChange={(e) => {
                      setStaffPermission(e.target.value);
                      localStorage.setItem('nexora_staff_permissions', e.target.value);
                      triggerToast(`Staff access level restricted to: ${e.target.value}`);
                    }}
                    className="w-full bg-surface border border-outline-variant/60 text-on-surface text-xs font-semibold rounded-lg h-9 px-2 focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Full Access">Full Access (All stylists see stats)</option>
                    <option value="Restricted Access">Restricted Access (Personal bookings only)</option>
                    <option value="Admin Only">Admin Only (Only owner sees revenue)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSecurityModalOpen(false);
                    triggerToast('Security safeguards locked');
                  }}
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-115 transition-all shadow-sm cursor-pointer"
                >
                  Lock & Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Layout>
  );
}


