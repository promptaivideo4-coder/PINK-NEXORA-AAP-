import { describe, expect, it } from 'vitest';
import type { ShopHours, ShopService, ShopStaff } from '../../lib/shopRepository';
import { mapHours, mapPublishState, mapServices, mapStaff, slugFromSalonName } from './shopPrefill';

const service = (over: Partial<ShopService> = {}): ShopService => ({
  id: 'svc-1',
  salonId: 'salon-1',
  name: 'Haircut',
  description: 'Classic cut',
  durationMinutes: 30,
  pricePaise: 35000,
  isActive: true,
  isBookableOnline: true,
  deletedAt: null,
  ...over,
});

describe('public website shop prefill', () => {
  it('maps salon status onto builder publish state', () => {
    expect(mapPublishState('published')).toBe('published');
    expect(mapPublishState('pending')).toBe('publishing');
    expect(mapPublishState('draft')).toBe('draft');
  });

  it('converts live services into public website catalog items', () => {
    const mapped = mapServices([
      service(),
      service({ id: 'svc-2', isActive: false, name: 'Hidden' }),
      service({ id: 'svc-3', deletedAt: '2026-01-01', name: 'Removed' }),
    ]);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      id: 'svc-1',
      name: 'Haircut',
      price: 350,
      duration: 30,
      featured: true,
    });
  });

  it('drops terminated staff and maps employment onto public roster status', () => {
    const staff: ShopStaff[] = [
      { id: 'st-1', salonId: 'salon-1', name: 'Asha', role: 'Stylist', specialty: 'Color', employmentStatus: 'active' },
      { id: 'st-2', salonId: 'salon-1', name: 'Gone', role: 'Stylist', specialty: null, employmentStatus: 'terminated' },
      { id: 'st-3', salonId: 'salon-1', name: 'Ravi', role: null, specialty: null, employmentStatus: 'on_leave' },
    ];
    const mapped = mapStaff(staff);
    expect(mapped.map(m => m.id)).toEqual(['st-1', 'st-3']);
    expect(mapped[0]).toMatchObject({
      name: 'Asha',
      role: 'Stylist',
      specialties: ['Color'],
      status: 'Available',
    });
    expect(mapped[1].status).toBe('On Leave');
  });

  it('fills a full week of opening hours for the public site', () => {
    const hours: ShopHours[] = [
      { id: 'h-1', salonId: 'salon-1', dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00', isClosed: false },
      { id: 'h-0', salonId: 'salon-1', dayOfWeek: 0, opensAt: '10:00', closesAt: '14:00', isClosed: true },
    ];
    const mapped = mapHours(hours);
    expect(mapped.monday).toEqual({ open: true, startTime: '09:00', endTime: '18:00' });
    expect(mapped.sunday.open).toBe(false);
    expect(mapped.tuesday.open).toBe(true);
  });

  it('builds a URL-safe website slug from the salon name', () => {
    expect(slugFromSalonName('Royal Hair & Beauty Studio')).toBe('royal-hair-beauty-studio');
    expect(slugFromSalonName('')).toBe('');
  });
});
