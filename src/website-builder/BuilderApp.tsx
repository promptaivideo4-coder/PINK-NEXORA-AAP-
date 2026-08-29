/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, Component, type ReactNode, type ErrorInfo, lazy, Suspense } from 'react';
import Landing from './screens/Landing';
import TopBar from './components/TopBar';
import { initialData, SalonData } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchMyShop } from '../lib/shopRepository';
import {
  MAX_STEP_INDEX,
  TOTAL_STEPS,
  getCurrentScreen as screenIdFor,
  isDashboardTab,
  resolveNavigateToScreen,
} from './lib/workspaceRouting';
import type { LandingTab } from './dashboard/types';

const HeroSplit = lazy(() => import('./screens/HeroSplit'));
const StepTemplate = lazy(() => import('./screens/StepTemplate'));
const StepDetails = lazy(() => import('./screens/StepDetails'));
const StepServices = lazy(() => import('./screens/StepServices'));
const StepTeam = lazy(() => import('./screens/StepTeam'));
const StepPhotos = lazy(() => import('./screens/StepPhotos'));
const StepSocials = lazy(() => import('./screens/StepSocials'));
const StepLocation = lazy(() => import('./screens/StepLocation'));
const StepContactBooking = lazy(() => import('./screens/StepContactBooking'));
const StepPublish = lazy(() => import('./screens/StepPublish'));
const StepAIContentReview = lazy(() => import('./screens/StepAIContentReview'));
const StepFullWebsitePreview = lazy(() => import('./screens/StepFullWebsitePreview'));
const StepPublishSetup = lazy(() => import('./screens/StepPublishSetup'));
const StepPublishSuccess = lazy(() => import('./screens/StepPublishSuccess'));
const BookingConfirmation = lazy(() => import('./components/BookingConfirmation'));
const StaffManagementModule = lazy(() => import('./components/StaffManagementModule'));

function BuilderFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#f9f9f9]">
      <div className="w-8 h-8 rounded-full border-2 border-[#ac0053] border-t-transparent animate-spin" />
    </div>
  );
}

/**
 * onboarding_progress.business_id links the builder row to the salon's
 * ORGANIZATION (per the table's migration comment). The old code stored the
 * user id there. Resolve the real organization id once per session.
 */
let cachedOwnerId: string | null | undefined;
async function getOwnerId(): Promise<string | null> {
  if (cachedOwnerId !== undefined) return cachedOwnerId;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    cachedOwnerId = session?.user?.id ?? null;
  } catch {
    cachedOwnerId = null;
  }
  return cachedOwnerId;
}

let cachedOrgId: string | null | undefined;
async function resolveBusinessId(): Promise<string | null> {
  if (cachedOrgId !== undefined) return cachedOrgId;
  try {
    const shop = await fetchMyShop(supabase);
    cachedOrgId = shop?.organizationId ?? null;
  } catch {
    cachedOrgId = null;
  }
  return cachedOrgId;
}

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
    // RECOVERY POLICY (final audit): a render error must NEVER silently
    // destroy the owner's draft (the old code wiped team/services/packages/
    // gallery from localStorage on ANY crash). We only clear storage when it
    // is actually unparseable (corrupted), and even then the user sees the
    // recovery UI with an explicit reset action.
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        JSON.parse(saved); // throws => genuinely corrupted
      }
    } catch (parseError) {
      console.warn('Builder onboarding state is corrupted JSON — clearing it so the wizard can restart cleanly.', parseError);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 text-center gap-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <h1 className="text-2xl font-bold">Something went wrong in the website builder</h1>
          <p className="text-sm text-gray-400 max-w-md">
            Your saved setup was NOT deleted. Reload to try again, or reset the
            setup data below if the builder keeps failing (resetting erases the
            draft and starts the onboarding over).
          </p>
          <p className="text-xs text-gray-600 font-mono max-w-md break-all">{String(this.state.error?.message || '')}</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
            <button
              onClick={() => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } window.location.reload(); }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold"
            >
              Reset setup data
            </button>
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
        if (parsed.activeModule === 'staff-management') return 'staff-management';
        // Only restore the dashboard when the builder state records a real
        // publish — stale 'dashboard' modules from the old fake-publish era
        // are redirected back into the wizard.
        if (parsed.activeModule === 'dashboard' && data.publishState === 'published') return 'dashboard';
      }
    } catch {}
    return 'wizard';
  });

  const [dashboardTab, setDashboardTab] = useState<LandingTab>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_TAB_KEY);
      if (saved === 'services' || saved === 'staff' || isDashboardTab(saved)) return saved;
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

  // CROSS-OWNER GUARD: the builder draft lives in localStorage and is shared
  // by every session on this device. If a DIFFERENT owner signs in, the
  // previous owner's draft must not leak into (or be overwritten by) the new
  // owner's workspace. Clear the stale draft and start fresh.
  useEffect(() => {
    void (async () => {
      try {
        const ownerId = await getOwnerId();
        if (!ownerId) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (parsed.ownerId && parsed.ownerId !== ownerId) {
          console.warn('Builder draft belongs to a different owner — clearing stale device-local state.');
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(DASHBOARD_TAB_KEY);
          setData({ ...initialData, services: [], team: [], packages: [], gallery: [] });
          setStep(0);
          setActiveModule('wizard');
          setDashboardTab('overview');
          setShowResumeBanner(false);
          showToast('Signed in on this device as a different owner — the previous setup draft was cleared.');
        }
      } catch {
        // Corrupt/absent state is handled by the initializers and the error
        // boundary; nothing to reconcile here.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    saveTimerRef.current = setTimeout(async () => {
      const currentData = dataRef.current;
      const lastCompletedStep = Math.max(currentData.lastCompletedStep || 0, step > 0 ? step - 1 : 0);

      // 1. INSTANT: Save to localStorage (works offline, PWA)
      try {
        const ownerId = await getOwnerId();
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ownerId,
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
            const businessId = await resolveBusinessId();
            const { error } = await supabase
              .from('onboarding_progress')
              .upsert({
                id: user.id,
                business_id: businessId,
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

  const handleSave = async () => {
    setSaveStatus('saving');
    const currentData = dataRef.current;
    try {
      const ownerId = await getOwnerId();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ownerId,
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
  const getCurrentScreen = (): number =>
    screenIdFor({
      activeModule,
      dashboardTab: isDashboardTab(dashboardTab) ? dashboardTab : 'overview',
      step,
    });

  const navigateToScreen = (screenId: number) => {
    const intent = resolveNavigateToScreen(screenId, dataRef.current.publishState);
    if (intent.kind === 'wizard') {
      setActiveModule('wizard');
      setStep(intent.step);
      setShowResumeBanner(false);
      showToast(intent.toast);
      return;
    }
    if (intent.kind === 'staff') {
      setActiveModule('staff-management');
      showToast(intent.toast);
      return;
    }
    if (intent.kind === 'publish-required') {
      setActiveModule('wizard');
      setStep(13); // Step 14 of 15: Publish
      setShowResumeBanner(false);
      showToast(intent.toast);
      return;
    }
    setActiveModule('dashboard');
    setDashboardTab(intent.tab);
    showToast(intent.toast);
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
          {/* Landing in dashboard mode with REAL publish state (the module is
              only reachable after a verified database publish) */}
          <Suspense fallback={<BuilderFallback />}>
            <Landing
              data={data}
              setData={setData}
              onNext={nextStep}
              goToStep={goToStep}
              onOpenStaffManagement={() => setActiveModule('staff-management')}
              forcedActiveTab={dashboardTab}
              onTabChange={(tab) => setDashboardTab(tab)}
            />
          </Suspense>
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
          <Suspense fallback={<BuilderFallback />}>
            <StaffManagementModule
              data={data}
              setData={setData}
              onSave={handleSave}
              onBackToWizard={() => setActiveModule('wizard')}
            />
          </Suspense>
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
        <Suspense fallback={<BuilderFallback />}>
          <Landing 
            data={data}
            setData={setData}
            onNext={nextStep} 
            goToStep={goToStep}
            onOpenStaffManagement={() => setActiveModule('staff-management')}
          />
        </Suspense>
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
        <Suspense fallback={<BuilderFallback />}>
          <HeroSplit onNext={nextStep} />
        </Suspense>
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
        <Suspense fallback={<BuilderFallback />}>
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
          {step === 14 && <StepPublishSuccess data={data} setData={setData} onNext={() => { if (dataRef.current.publishState === 'published') { setActiveModule('dashboard'); setDashboardTab('overview'); handleSave(); showToast('Website Published — Dashboard Active'); } }} onSave={handleSave} />}
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
        </Suspense>
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
