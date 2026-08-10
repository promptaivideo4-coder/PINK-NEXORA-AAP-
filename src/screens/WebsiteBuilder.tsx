/**
 * WebsiteBuilder — Bridge screen that integrates the NEW white-label website
 * onboarding/builder (from NEW-TAMPLETE-APP) into the PINK-NEXORA-AAP main app.
 *
 * Flow:
 *   Dashboard → Quick Actions → Website → this screen
 *     → Authenticated Owner? (via existing Supabase session)
 *     → Fetch existing shop/services/staff/location from Supabase
 *     → Auto-fill into the new builder (first time = onboarding, returning = dashboard)
 *
 * Rules:
 *   - No second login/signup — reuses existing Supabase session.
 *   - No duplicate tables — uses existing salons, services, staff_members, salon_hours.
 *   - Supabase persistence — not localStorage source of truth.
 *   - Existing data auto-filled.
 */

import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchMyShop,
  listServices,
  listStaff,
  listHours,
  MyShop,
  ShopService,
  ShopStaff,
  ShopHours,
} from '../lib/shopRepository';
import type { SalonData } from '../website-builder/types';
import { ArrowLeft, Loader2, Store, AlertCircle } from 'lucide-react';

// Lazy-load the heavy builder bundle so the main app stays lean.
const BuilderApp = lazy(() => import('../website-builder/BuilderApp'));

import type { NavigationProps } from '../types';

/** Map shop status to builder publish state */
function mapPublishState(status: string): 'draft' | 'publishing' | 'published' {
  if (status === 'published') return 'published';
  if (status === 'pending') return 'publishing';
  return 'draft';
}

/** Map existing services from Supabase to builder Service[] format */
function mapServices(services: ShopService[]): SalonData['services'] {
  return services
    .filter(s => !s.deletedAt && s.isActive)
    .map(s => ({
      id: s.id,
      name: s.name,
      category: 'General',
      description: s.description || '',
      price: Math.round(s.pricePaise / 100),
      duration: s.durationMinutes,
      featured: s.isBookableOnline,
    }));
}

/** Map existing staff from Supabase to builder TeamMember[] format */
function mapStaff(staff: ShopStaff[]): SalonData['team'] {
  return staff
    .filter(s => s.employmentStatus !== 'terminated')
    .map(s => ({
      id: s.id,
      name: s.name,
      role: s.role || 'Staff',
      specialties: s.specialty ? [s.specialty] : [],
      imageUrl: '',
      bio: '',
      phone: '',
      status: (s.employmentStatus === 'active' ? 'Available' : s.employmentStatus === 'on_leave' ? 'On Leave' : 'Inactive') as any,
    }));
}

/** Map salon hours to builder opening hours */
function mapHours(hours: ShopHours[]): SalonData['openingHours'] {
  const DAY_MAP: Record<number, keyof SalonData['openingHours']> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    0: 'sunday',
  };

  const result: any = {};
  for (const h of hours) {
    const key = DAY_MAP[h.dayOfWeek];
    if (key) {
      result[key] = {
        open: !h.isClosed,
        startTime: h.opensAt || '10:00',
        endTime: h.closesAt || '20:00',
      };
    }
  }

  // Fill defaults for any missing days
  const defaultDay = { open: true, startTime: '10:00', endTime: '20:00' };
  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const) {
    if (!result[day]) result[day] = day === 'sunday' ? { ...defaultDay, open: false } : defaultDay;
  }
  return result;
}

/** Determine where to start the builder based on shop state */
function getInitialStep(shop: MyShop | null): number {
  if (!shop) return 0; // No shop → full onboarding from start
  if (shop.status === 'published') return 0; // Returning published → show landing/dashboard
  if (shop.status === 'pending') return 0; // Pending → show landing/dashboard
  // Draft → resume onboarding
  return 0;
}

/** Loading skeleton */
function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f9f9f9] gap-4">
      <Loader2 className="w-10 h-10 text-[#ac0053] animate-spin" />
      <p className="text-sm font-semibold text-gray-600">Loading Website Builder…</p>
    </div>
  );
}

/** Error fallback */
function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f9f9f9] gap-4 px-6">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <h2 className="text-lg font-bold text-gray-900">Unable to load builder</h2>
      <p className="text-sm text-gray-600 text-center">{message}</p>
      <button onClick={onRetry} className="px-6 py-2.5 bg-[#ac0053] text-white rounded-xl text-sm font-bold">
        Retry
      </button>
    </div>
  );
}

export default function WebsiteBuilder({ navigate }: NavigationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefilledData, setPrefilledData] = useState<Partial<SalonData> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        navigate('login');
        return;
      }
      setIsAuthenticated(true);

      // 2. Fetch existing shop data
      const shop = await fetchMyShop(supabase);
      if (!shop) {
        // No shop yet → start fresh onboarding with user metadata
        const { data: { user } } = await supabase.auth.getUser();
        const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
        setPrefilledData({
          salonName: String(meta.business_name || meta.full_name || ''),
          phone: String(meta.contact_number || ''),
          ownerName: String(meta.full_name || ''),
          email: String(user?.email || ''),
        });
        setLoading(false);
        return;
      }

      // 3. Fetch services, staff, hours in parallel
      const [services, staff, hours] = await Promise.all([
        listServices(supabase, shop.id).catch(() => [] as ShopService[]),
        listStaff(supabase, shop.id).catch(() => [] as ShopStaff[]),
        listHours(supabase, shop.id).catch(() => [] as ShopHours[]),
      ]);

      // 4. Map everything to builder's SalonData format
      const mappedServices = mapServices(services);
      const mappedStaff = mapStaff(staff);
      const mappedHours = mapHours(hours);

      // 5. Build the prefilled data object
      const data: Partial<SalonData> = {
        salonName: shop.name || '',
        tagline: shop.description || '',
        phone: shop.phone || '',
        about: shop.description || '',
        address: {
          fullAddress: shop.address || '',
          area: shop.area || '',
          city: shop.city || '',
          state: '',
          pinCode: shop.pincode || '',
          landmark: shop.landmark || '',
        },
        openingHours: mappedHours,
        services: mappedServices, // Always provide array (empty if no services)
        team: mappedStaff, // Always provide array (empty if no staff)
        publishState: mapPublishState(shop.status),
        websiteSlug: shop.name ? shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) : undefined,
      };

      // 6. If published, set the published URL
      if (shop.status === 'published' && data.websiteSlug) {
        data.publishedUrl = `/salons/${data.websiteSlug}`;
      }

      setPrefilledData(data);
    } catch (err: any) {
      console.error('WebsiteBuilder data load failed:', err);
      setError(err?.message || 'Failed to load shop data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle back navigation from builder
  const handleNavigateBack = () => {
    navigate('dashboard');
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={loadData} />;
  if (!isAuthenticated) return <LoadingScreen />; // Will redirect to login

  return (
    <div className="h-screen flex flex-col bg-[#f9f9f9] overflow-hidden">
      {/* Thin back-navigation bar for mobile UX */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 shrink-0 z-50 md:hidden">
        <button
          onClick={handleNavigateBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#ac0053] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Builder App — full-screen embedded */}
      <Suspense fallback={<LoadingScreen />}>
        <BuilderApp prefilledData={prefilledData || undefined} onNavigateBack={handleNavigateBack} />
      </Suspense>
    </div>
  );
}
