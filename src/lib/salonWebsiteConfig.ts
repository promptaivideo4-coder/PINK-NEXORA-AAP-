/**
 * Strict types for JSONB payloads stored on:
 *   - salon_setup_proposals.payload
 *   - salon_public_websites.config
 *
 * The live schema uses a single canonical column (`payload` / `config`).
 * Callers must read that column — never probe a list of candidate keys
 * (`payload` / `proposal_data` / `data` / `json` / …).
 */

import type {
  BookingRules,
  GalleryImage,
  Package,
  ReviewedContent,
  SalonAddress,
  SalonOpeningHours,
  Service,
  TeamMember,
} from '../website-builder/types';

export interface SalonWebsiteProfile {
  name?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: SalonAddress;
}

export interface SalonWebsiteTemplate {
  key?: string;
}

/** Canonical website / setup-proposal JSON snapshot. */
export interface SalonWebsiteConfig {
  profile?: SalonWebsiteProfile;
  template?: SalonWebsiteTemplate;
  services?: Service[];
  team?: TeamMember[];
  gallery?: GalleryImage[];
  packages?: Package[];
  openingHours?: SalonOpeningHours;
  bookingRules?: BookingRules;
  reviewedContent?: ReviewedContent;
}

const EMPTY_CONFIG: SalonWebsiteConfig = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function parseAddress(value: unknown): SalonAddress | undefined {
  if (!isRecord(value)) return undefined;
  return {
    fullAddress: typeof value.fullAddress === 'string' ? value.fullAddress : '',
    shopNumber: asOptionalString(value.shopNumber),
    area: typeof value.area === 'string' ? value.area : '',
    city: typeof value.city === 'string' ? value.city : '',
    state: typeof value.state === 'string' ? value.state : '',
    pinCode: typeof value.pinCode === 'string' ? value.pinCode : '',
    landmark: asOptionalString(value.landmark),
    latitude: asOptionalNumber(value.latitude),
    longitude: asOptionalNumber(value.longitude),
  };
}

function parseService(value: unknown): Service | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  return {
    id: value.id,
    name: value.name,
    category: typeof value.category === 'string' ? value.category : 'General',
    description: typeof value.description === 'string' ? value.description : '',
    price: typeof value.price === 'number' && Number.isFinite(value.price) ? value.price : 0,
    duration: typeof value.duration === 'number' && Number.isFinite(value.duration) ? value.duration : 0,
    featured: asOptionalBoolean(value.featured),
  };
}

function parsePackage(value: unknown): Package | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  return {
    id: value.id,
    name: value.name,
    description: typeof value.description === 'string' ? value.description : '',
    price: typeof value.price === 'number' && Number.isFinite(value.price) ? value.price : 0,
    duration: typeof value.duration === 'number' && Number.isFinite(value.duration) ? value.duration : 0,
  };
}

function parseTeamMember(value: unknown): TeamMember | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  const specialties = Array.isArray(value.specialties)
    ? value.specialties.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    id: value.id,
    name: value.name,
    role: typeof value.role === 'string' ? value.role : 'Staff',
    specialties,
    imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : '',
    bio: asOptionalString(value.bio),
    phone: asOptionalString(value.phone),
  };
}

function parseGalleryImage(value: unknown): GalleryImage | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.url !== 'string') return null;
  return {
    id: value.id,
    url: value.url,
    alt: asOptionalString(value.alt),
    category: asOptionalString(value.category),
  };
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function parseOpeningHours(value: unknown): SalonOpeningHours | undefined {
  if (!isRecord(value)) return undefined;
  const hours = {} as SalonOpeningHours;
  for (const day of DAY_KEYS) {
    const entry = value[day];
    if (!isRecord(entry)) {
      hours[day] = { open: day !== 'sunday', startTime: '10:00', endTime: '20:00' };
      continue;
    }
    hours[day] = {
      open: typeof entry.open === 'boolean' ? entry.open : true,
      startTime: typeof entry.startTime === 'string' ? entry.startTime : '10:00',
      endTime: typeof entry.endTime === 'string' ? entry.endTime : '20:00',
    };
  }
  return hours;
}

function parseBookingRules(value: unknown): BookingRules | undefined {
  if (!isRecord(value)) return undefined;
  return {
    minNotice: typeof value.minNotice === 'string' ? value.minNotice : '1 hour',
    maxAdvance: typeof value.maxAdvance === 'string' ? value.maxAdvance : '30 days',
    bufferTime: typeof value.bufferTime === 'string' ? value.bufferTime : 'No buffer',
    allowStaffSelection: typeof value.allowStaffSelection === 'boolean' ? value.allowStaffSelection : true,
    advanceDepositPercentage:
      typeof value.advanceDepositPercentage === 'number' && Number.isFinite(value.advanceDepositPercentage)
        ? value.advanceDepositPercentage
        : 25,
  };
}

function parseReviewedContent(value: unknown): ReviewedContent | undefined {
  if (!isRecord(value)) return undefined;
  const serviceDescriptions: Record<string, string> = {};
  if (isRecord(value.serviceDescriptions)) {
    for (const [key, desc] of Object.entries(value.serviceDescriptions)) {
      if (typeof desc === 'string') serviceDescriptions[key] = desc;
    }
  }
  return {
    heroHeadline: typeof value.heroHeadline === 'string' ? value.heroHeadline : '',
    tagline: typeof value.tagline === 'string' ? value.tagline : '',
    about: typeof value.about === 'string' ? value.about : '',
    ownerIntro: typeof value.ownerIntro === 'string' ? value.ownerIntro : '',
    serviceDescriptions,
    bookingCTA: typeof value.bookingCTA === 'string' ? value.bookingCTA : '',
  };
}

function parseList<T>(value: unknown, mapItem: (item: unknown) => T | null): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(mapItem).filter((item): item is T => item !== null);
}

/**
 * Parse an unknown JSONB value into the canonical website config.
 * Invalid or missing snapshots become `{}` — never `any`.
 */
export function parseSalonWebsiteConfig(raw: unknown): SalonWebsiteConfig {
  if (!isRecord(raw)) return EMPTY_CONFIG;
  return {
    profile: isRecord(raw.profile)
      ? {
          name: asOptionalString(raw.profile.name),
          tagline: asOptionalString(raw.profile.tagline),
          phone: asOptionalString(raw.profile.phone),
          email: asOptionalString(raw.profile.email),
          address: parseAddress(raw.profile.address),
        }
      : undefined,
    template: isRecord(raw.template)
      ? { key: asOptionalString(raw.template.key) }
      : undefined,
    services: parseList(raw.services, parseService),
    team: parseList(raw.team, parseTeamMember),
    gallery: parseList(raw.gallery, parseGalleryImage),
    packages: parseList(raw.packages, parsePackage),
    openingHours: parseOpeningHours(raw.openingHours),
    bookingRules: parseBookingRules(raw.bookingRules),
    reviewedContent: parseReviewedContent(raw.reviewedContent),
  };
}

export function salonNameFromConfig(config: SalonWebsiteConfig): string {
  const name = config.profile?.name?.trim();
  return name && name.length > 0 ? name : 'salon';
}

export function templateKeyFromConfig(config: SalonWebsiteConfig): string {
  const key = config.template?.key?.trim();
  return key && key.length > 0 ? key : 'classic-elegance';
}

export function slugFromSalonName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'salon';
}
