/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback, Component, type ReactNode, type ErrorInfo } from 'react';
import Landing from './screens/Landing';
import HeroSplit from './screens/HeroSplit';
import StepTemplate from './screens/StepTemplate';
import StepDetails from './screens/StepDetails';
import StepServices from './screens/StepServices';
import StepTeam from './screens/StepTeam';
import StepPhotos from './screens/StepPhotos';
import StepSocials from './screens/StepSocials';
import StepLocation from './screens/StepLocation';
import StepContactBooking from './screens/StepContactBooking';
import StepPublish from './screens/StepPublish';
import StepAIContentReview from './screens/StepAIContentReview';
import StepFullWebsitePreview from './screens/StepFullWebsitePreview';
import StepPublishSetup from './screens/StepPublishSetup';
import StepPublishSuccess from './screens/StepPublishSuccess';
import BookingConfirmation from './components/BookingConfirmation';
import StaffManagementModule from './components/StaffManagementModule';
import TopBar from './components/TopBar';
import { initialData, SalonData } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ArrowRight, ArrowLeft, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* -------------------------------------------------------------------------- */
/*  ERROR BOUNDARY — catches any render crash and shows a recovery UI          */
/* -------------------------------------------------------------------------- */

interface EBProps { children: ReactNode; onReset?: () => void; }
interface EBState { hasError: boolean; error: Error | null; }

class BuilderErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): EBState { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { 
    console.error('BuilderErrorBoundary caught:', error, info);
    // Auto-recovery: Try to fix corrupted localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Remove potentially corrupted team data
        if (parsed.data) {
          parsed.data.team = [];
          parsed.data.services = [];
          parsed.data.packages = [];
          parsed.data.gallery = [];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          console.log('✅ Auto-recovery: Cleared corrupted data, reloading...');
          // Auto-reload after fixing data
          setTimeout(() => window.location.reload(), 500);
        }
      }
    } catch (e) {
      console.error('Auto-recovery failed:', e);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 text-center gap-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <h1 className="text-2xl font-bold">Recovering from error...</h1>
          <p className="text-sm text-gray-400 max-w-md">
            Fixing data automatically. App will reload in a moment.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Please wait...</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Props accepted from the parent PINK-NEXORA-AAP screen wrapper */
export interface BuilderAppProps {
  /** Pre-populated data from Supabase (shop/services/staff/location) */
  prefilledData?: Partial<SalonData>;
  /** Called when user presses the back button from the builder landing */
  onNavigateBack?: () => void;
}

const STORAGE_KEY = 'nexora_onboarding_state';
const DASHBOARD_TAB_KEY = 'nexora_dashboard_tab';
const TOTAL_STEPS = 16;
const MAX_STEP_INDEX = 15; // 0-based: 0..15 => 1..16

// Dashboard tab mapping for screens 18-25
type DashboardTab = 'overview' | 'website' | 'bookings' | 'payments' | 'share' | 'settings' | 'referral' | 'branding';
const DASHBOARD_TABS: DashboardTab[] = ['overview', 'website', 'bookings', 'payments', 'share', 'settings', 'referral', 'branding'];

function BuilderApp({ prefilledData, onNavigateBack }: BuilderAppProps = {}) {
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.step === 'number' && parsed.step >= 0 && parsed.step <= MAX_STEP_INDEX) {
          return parsed.step;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved onboarding state', e);
    }
    return 0;
  });

  const [data, setData] = useState<SalonData>(() => {
    // Priority: localStorage saved state > prefilled from Supabase > defaults
    let merged: SalonData;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          // Merge prefilled on top only if no saved data (first load)
          merged = { ...initialData, ...parsed.data };
        }
      }
    } catch (e) {
      console.error('Failed to parse saved onboarding state', e);
    }
    if (!merged) {
      // Use prefilled data from Supabase if available (first-time onboarding with existing shop)
      if (prefilledData) {
        merged = { ...initialData, ...prefilledData };
      } else {
        merged = { ...initialData };
      }
    }
    // SAFETY: ensure critical arrays are never undefined (prevents .length crashes)
    merged.services = merged.services || [];
    merged.team = merged.team || [];
    merged.packages = merged.packages || [];
    merged.gallery = merged.gallery || [];
    return merged;
  });

  const [activeModule, setActiveModule] = useState<'wizard' | 'staff-management' | 'dashboard'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeModule === 'staff-management' || parsed.activeModule === 'dashboard') return parsed.activeModule;
      }
      const dashboardTab = localStorage.getItem(DASHBOARD_TAB_KEY);
      if (dashboardTab && data.publishState === 'published') return 'dashboard';
    } catch {}
    return 'wizard';
  });

  const [dashboardTab, setDashboardTab] = useState<DashboardTab>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_TAB_KEY) as DashboardTab | null;
      if (saved && DASHBOARD_TABS.includes(saved)) return saved;
    } catch {}
    return 'overview';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return typeof parsed.step === 'number' && parsed.step > 0;
      }
    } catch (e) {
      // fallback
    }
    return false;
  });

  const isInitialMount = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Online/offline detection for PWA
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Persist dashboard tab
  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_TAB_KEY, dashboardTab);
    } catch {}
  }, [dashboardTab]);

  // UNIVERSAL AUTO-SAVE: localStorage (instant) + Supabase (background)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // On first mount, sync from localStorage to avoid losing data
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setLastSavedAt(Date.now());
          setSaveStatus('saved');
        }
      } catch {}
      return;
    }

    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const currentData = dataRef.current;
      const lastCompletedStep = Math.max(currentData.lastCompletedStep || 0, step > 0 ? step - 1 : 0);

      // 1. INSTANT: Save to localStorage (works offline, PWA)
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            step,
            data: { ...currentData, lastCompletedStep },
            activeModule,
            dashboardTab,
            lastSaved: new Date().toISOString(),
            onboarding_progress: `Step ${step + 1} of ${TOTAL_STEPS}`,
            lastCompletedStep,
            selectedTemplate: currentData.templateId,
            websiteAppearance: currentData.websiteAppearance,
            reviewedContent: currentData.reviewedContent,
            publishState: currentData.publishState,
            currentStep: step + 1
          })
        );
        setLastSavedAt(Date.now());
        setSaveStatus('saved');
      } catch (e) {
        console.error('LocalStorage save failed:', e);
        setSaveStatus('error');
      }

      // 2. BACKGROUND: Save to Supabase (when online + authenticated)
      if (isOnline) {
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabase
              .from('onboarding_progress')
              .upsert({
                id: user.id,
                business_id: user.id,
                current_step: step + 1,
                last_completed_step: lastCompletedStep,
                status: currentData.publishState === 'published' ? 'completed' : 'in_progress',
                draft: currentData,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id' });
            if (error) {
              console.warn('Supabase save skipped:', error.message);
            }
          } catch (err) {
            console.warn('Supabase save failed (non-fatal):', err);
          }
        })();
      }
    }, 200);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [step, data, activeModule, dashboardTab, isOnline]);

  const nextStep = () => setStep(s => {
    const next = Math.min(MAX_STEP_INDEX, s + 1);
    setData(prev => ({ ...prev, lastCompletedStep: Math.max(prev.lastCompletedStep || 0, s) }));
    return next;
  });
  const prevStep = () => setStep(s => Math.max(0, s - 1));

  const goToStep = (target: number) => setStep(Math.min(MAX_STEP_INDEX, Math.max(0, target)));

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    setSaveStatus('saving');
    const currentData = dataRef.current;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step,
          data: currentData,
          activeModule,
          dashboardTab,
          lastSaved: new Date().toISOString(),
          onboarding_progress: `Step ${step + 1} of ${TOTAL_STEPS}`,
          lastCompletedStep: currentData.lastCompletedStep,
          selectedTemplate: currentData.templateId,
          websiteAppearance: currentData.websiteAppearance,
          reviewedContent: currentData.reviewedContent,
          publishState: currentData.publishState,
          currentStep: step + 1
        })
      );
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      setSaveStatus('saved');
      showToast('Changes Saved');
    }, 200);
  };

  // Universal 25-screen navigator
  const getCurrentScreen = (): number => {
    if (activeModule === 'staff-management') return 17;
    if (activeModule === 'dashboard') {
      const tabIndex = DASHBOARD_TABS.indexOf(dashboardTab);
      return 18 + tabIndex;
    }
    // wizard
    return step + 1; // step 0 => screen 1, step 15 => screen 16
  };

  const navigateToScreen = (screenId: number) => {
    if (screenId >= 1 && screenId <= 16) {
      setActiveModule('wizard');
      setStep(screenId - 1);
      setShowResumeBanner(false);
      showToast(`Navigated to Screen ${String(screenId).padStart(2, '0')}`);
    } else if (screenId === 17) {
      setActiveModule('staff-management');
      showToast('Opened Staff Management Module (Screen 17)');
    } else if (screenId >= 18 && screenId <= 25) {
      // Ensure published state for dashboard
      if (data.publishState !== 'published') {
        setData(prev => ({ ...prev, publishState: 'published', publishedUrl: prev.publishedUrl || `https://nexora.site/${prev.websiteSlug || 'royal-hair-studio'}`, websiteSlug: prev.websiteSlug || 'royal-hair-studio' }));
      }
      setActiveModule('dashboard');
      const tabIndex = screenId - 18;
      const tab = DASHBOARD_TABS[tabIndex] || 'overview';
      setDashboardTab(tab as DashboardTab);
      // For dashboard, ensure step is 0 to render Landing dashboard mode, but keep step for persistence
      // We don't change step to avoid losing wizard progress; dashboard is separate module
      showToast(`Opened Dashboard — ${tab} (Screen ${String(screenId).padStart(2, '0')})`);
    }
  };

  const handleDashboard = () => {
    setStep(0);
    setShowResumeBanner(false);
  };

  // Compute current screen for TopBar
  const currentScreen = getCurrentScreen();

  // Special handling: Landing preview for dashboard needs to be rendered via Landing component's dashboard mode
  // If activeModule is dashboard, we render Landing with forced tab
  if (activeModule === 'dashboard') {
    return (
      <div className="h-screen bg-[#f9f9f9] flex flex-col font-sans text-gray-900 overflow-hidden relative">
        <TopBar
          step={step}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          saveStatus={saveStatus}
          currentScreen={currentScreen}
          onNavigate={navigateToScreen}
        />
        <main className="flex-1 flex overflow-hidden">
          {/* Force Landing into dashboard mode by ensuring published and passing forcedActiveTab */}
          <Landing
            data={{ ...data, publishState: 'published', publishedUrl: data.publishedUrl || `https://nexora.site/${data.websiteSlug || 'royal-hair-studio'}` }}
            setData={setData}
            onNext={nextStep}
            goToStep={goToStep}
            onOpenStaffManagement={() => setActiveModule('staff-management')}
            forcedActiveTab={dashboardTab as any}
            onTabChange={(tab: any) => setDashboardTab(tab)}
          />
        </main>
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-8 right-8 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (activeModule === 'staff-management') {
    return (
      <div className="h-screen bg-[#f9f9f9] flex flex-col font-sans text-gray-900 overflow-hidden relative">
        <TopBar
          step={step}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          saveStatus={saveStatus}
          currentScreen={currentScreen}
          onNavigate={navigateToScreen}
        />
        <main className="flex-1 flex overflow-hidden">
          <StaffManagementModule
            data={data}
            setData={setData}
            onSave={handleSave}
            onBackToWizard={() => setActiveModule('wizard')}
          />
        </main>
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-8 right-8 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Wizard module rendering
  if (step === 0) return (
    <div className="h-screen bg-[#f9f9f9] flex flex-col font-sans text-gray-900 overflow-hidden relative">
      <TopBar
        step={step}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        saveStatus={saveStatus}
        currentScreen={currentScreen}
        onNavigate={navigateToScreen}
      />
      <div className="flex-1 overflow-auto">
        <Landing 
          data={data}
          setData={setData}
          onNext={nextStep} 
          goToStep={goToStep}
          onOpenStaffManagement={() => setActiveModule('staff-management')}
        />
      </div>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-8 right-8 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (step === 1) return (
    <div className="h-screen bg-[#f9f9f9] flex flex-col font-sans text-gray-900 overflow-hidden relative">
      <TopBar
        step={step}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        saveStatus={saveStatus}
        currentScreen={currentScreen}
        onNavigate={navigateToScreen}
      />
      <div className="flex-1 overflow-auto">
        <HeroSplit onNext={nextStep} />
      </div>
      <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
        <button onClick={prevStep} className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold">Back</button>
        <button onClick={nextStep} className="px-6 py-2 bg-[#ac0053] text-white rounded-xl text-xs font-semibold">Continue to Template Selection</button>
      </div>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-8 right-8 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // For wizard steps 2..15, TopBar is always visible now (universal)
  return (
    <div className="h-screen bg-[#f9f9f9] flex flex-col font-sans text-gray-900 overflow-hidden relative">
      <TopBar 
        step={step} 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        saveStatus={saveStatus}
        currentScreen={currentScreen}
        onNavigate={navigateToScreen}
      />

      {/* Resume Welcome Back Banner - Fixed to show correct step and actually render correct screen below */}
      <AnimatePresence>
        {showResumeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#3f001a] text-white px-6 py-3 border-b border-[#ac0053]/40 flex items-center justify-between gap-4 z-40 shrink-0 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold bg-[#ffd9e1] text-[#ac0053] px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
                Welcome back
              </span>
              <span>Your website setup is saved. Resuming from Step {step + 1} of {TOTAL_STEPS}.</span>
            </div>
            <button
              onClick={() => setShowResumeBanner(false)}
              className="bg-[#ac0053] hover:bg-[#ba005b] text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 shrink-0 transition-colors"
            >
              Continue Setup <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="flex-1 flex overflow-hidden">
        <>
          {step === 2 && <StepTemplate data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
          {step === 3 && <StepDetails data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
          {step === 4 && <StepServices data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
          {step === 5 && (
            <StepTeam 
              data={data} 
              setData={setData} 
              onNext={nextStep} 
              onPrev={prevStep} 
              onSave={handleSave} 
              onOpenStaffManagement={() => setActiveModule('staff-management')}
            />
          )}
          {step === 6 && (
            <StepPhotos
              data={data}
              setData={setData}
              onNext={nextStep}
              onPrev={prevStep}
              onSave={handleSave}
            />
          )}
          {step === 7 && (
            <StepSocials
              data={data}
              setData={setData}
              onNext={nextStep}
              onPrev={prevStep}
              onSave={handleSave}
            />
          )}
          {step === 8 && (
            <StepLocation
              data={data}
              setData={setData}
              onNext={nextStep}
              onPrev={prevStep}
              onSave={handleSave}
            />
          )}
          {step === 9 && (
            <StepContactBooking
              data={data}
              setData={setData}
              onNext={nextStep}
              onPrev={prevStep}
              onSave={handleSave}
            />
          )}
          {/* Step 11 of 15 (index 10) - Template Appearance */}
          {step === 10 && <StepPublish data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
          
          {/* FIXED STEPS 12-15 - Previously not rendering */}
          {step === 11 && <StepAIContentReview data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
          {step === 12 && <StepFullWebsitePreview data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
          {step === 13 && <StepPublishSetup data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
          {step === 14 && <StepPublishSuccess data={data} setData={setData} onNext={() => { setData(prev => ({ ...prev, publishState: 'published' })); setActiveModule('dashboard'); setDashboardTab('overview'); handleSave(); showToast('Website Published — Dashboard Active'); }} onSave={handleSave} />}
          {step === 15 && (
            <BookingConfirmation 
              bookingId="NX-10482"
              service="Hair Spa"
              date="10 Aug 2026"
              time="05:00 PM"
              staff="Priya Sharma"
              customer="Neha Verma"
              price={1200}
              advancePaid={300}
            />
          )}

          {/* Fallback safety - should never hit if switch logic is correct, but prevent blank screen */}
          {step > 15 && (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Step out of range — redirecting to resume point</h2>
                <p className="text-sm text-gray-500">Current step {step} is beyond {MAX_STEP_INDEX}</p>
                <button onClick={() => goToStep(11)} className="px-6 py-2 bg-[#ac0053] text-white rounded-lg text-sm">Go to Step 12 AI Review</button>
              </div>
            </div>
          )}
        </>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-8 right-8 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Migration: Fix old/corrupted localStorage data automatically
 * Ye function app start hone pe chalta hai aur purane data ko fix karta hai
 * bina user ko kuch kiye
 */
function migrateLocalStorageData(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (!parsed.data) return;

    let changed = false;

    // Fix services array
    if (Array.isArray(parsed.data.services)) {
      parsed.data.services = parsed.data.services.filter(s => s && typeof s.name === 'string');
    } else {
      parsed.data.services = [];
      changed = true;
    }

    // Fix team array — ensure all members have valid data
    if (Array.isArray(parsed.data.team)) {
      parsed.data.team = parsed.data.team.map((member: any) => {
        if (!member) return null;
        
        // Fix avatarVariant — agar invalid hai toh remove karo
        const validVariants = ['female-1', 'female-2', 'female-3', 'male-1', 'male-2', 'male-3'];
        if (member.avatarVariant && !validVariants.includes(member.avatarVariant)) {
          delete member.avatarVariant;
          changed = true;
        }

        // Fix imageUrl — agar URL hai toh theek hai, warna empty string
        if (member.imageUrl && typeof member.imageUrl !== 'string') {
          member.imageUrl = '';
          changed = true;
        }

        return member;
      }).filter(m => m !== null);
    } else {
      parsed.data.team = [];
      changed = true;
    }

    // Fix packages array
    if (Array.isArray(parsed.data.packages)) {
      parsed.data.packages = parsed.data.packages.filter(p => p && typeof p.name === 'string');
    } else {
      parsed.data.packages = [];
      changed = true;
    }

    // Fix gallery array
    if (Array.isArray(parsed.data.gallery)) {
      parsed.data.gallery = parsed.data.gallery.filter(g => g && typeof g.url === 'string');
    } else {
      parsed.data.gallery = [];
      changed = true;
    }

    // Agar kuch change hua, toh save karo
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      console.log('✅ Auto-migrated localStorage data');
    }
  } catch (err) {
    console.warn('Migration failed:', err);
  }
}

// Run migration immediately when module loads
migrateLocalStorageData();

/** Wrapped export — catches any render crash and shows a recovery UI */
export default function App(props: BuilderAppProps) {
  return (
    <BuilderErrorBoundary onReset={() => { try { localStorage.removeItem(STORAGE_KEY); } catch {} }}>
      <BuilderApp {...props} />
    </BuilderErrorBoundary>
  );
}
