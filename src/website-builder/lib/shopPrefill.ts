/**
 * Map live shop / services / staff / hours rows into the public website
 * builder's SalonData shape. Pure functions — no React, no Supabase client.
 */
import type { SalonData } from '../types';
import type { MyShop, ShopHours, ShopService, ShopStaff } from '../../lib/shopRepository';

/** Map shop status to builder publish state. */
export function mapPublishState(status: string): 'draft' | 'publishing' | 'published' {
  if (status === 'published') return 'published';
  if (status === 'pending') return 'publishing';
  return 'draft';
}

/** Map existing services from Supabase to builder Service[] format. */
export function mapServices(services: ShopService[]): SalonData['services'] {
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

/** Map existing staff from Supabase to builder TeamMember[] format. */
export function mapStaff(staff: ShopStaff[]): SalonData['team'] {
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
      status: (s.employmentStatus === 'active'
        ? 'Available'
        : s.employmentStatus === 'on_leave'
          ? 'On Leave'
          : 'Inactive') as SalonData['team'][number]['status'],
    }));
}

/** Map salon hours to builder opening hours. */
export function mapHours(hours: ShopHours[]): SalonData['openingHours'] {
  const DAY_MAP: Record<number, keyof SalonData['openingHours']> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    0: 'sunday',
  };

  const result: Partial<SalonData['openingHours']> = {};
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

  const defaultDay = { open: true, startTime: '10:00', endTime: '20:00' };
  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const) {
    if (!result[day]) result[day] = day === 'sunday' ? { ...defaultDay, open: false } : defaultDay;
  }
  return result as SalonData['openingHours'];
}

/** Derive a URL-safe website slug from a salon name. */
export function slugFromSalonName(name: string | undefined | null): string {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}
