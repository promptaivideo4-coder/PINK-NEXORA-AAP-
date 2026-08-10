/**
 * Service & Package Catalog — curated lists for fast website setup.
 *
 * Goal: user 30 min me website complete kar le. Typing kam, selection zyada.
 *
 * Structure:
 *  - SERVICE_CATALOG: name → category + default price/duration + description templates
 *  - PACKAGE_CATALOG: name → default price/duration + description templates
 *  - CATEGORY_DESCRIPTIONS: category → 3 description templates
 *
 * All prices in ₹ (display), durations in minutes.
 */

/* -------------------------------------------------------------------------- */
/*  SERVICE CATALOG                                                           */
/* -------------------------------------------------------------------------- */

export interface CatalogService {
  name: string;
  category: string;
  defaultPrice: number;
  defaultDuration: number;
}

export const SERVICE_CATALOG: CatalogService[] = [
  // ---- Haircut ----
  { name: 'Classic Haircut', category: 'Haircut', defaultPrice: 300, defaultDuration: 30 },
  { name: 'Layered Haircut', category: 'Haircut', defaultPrice: 500, defaultDuration: 45 },
  { name: 'Pixie Cut', category: 'Haircut', defaultPrice: 600, defaultDuration: 45 },
  { name: 'Bob Cut', category: 'Haircut', defaultPrice: 500, defaultDuration: 40 },
  { name: 'Bangs / Fringe Trim', category: 'Haircut', defaultPrice: 200, defaultDuration: 15 },
  { name: 'Kids Haircut', category: 'Haircut', defaultPrice: 250, defaultDuration: 30 },
  { name: 'Senior Haircut', category: 'Haircut', defaultPrice: 250, defaultDuration: 30 },

  // ---- Styling ----
  { name: 'Blow-Dry Styling', category: 'Styling', defaultPrice: 400, defaultDuration: 30 },
  { name: 'Curling & Iron Waves', category: 'Styling', defaultPrice: 500, defaultDuration: 45 },
  { name: 'Straightening & Smoothing', category: 'Styling', defaultPrice: 600, defaultDuration: 60 },
  { name: 'Updo & Party Styling', category: 'Styling', defaultPrice: 800, defaultDuration: 60 },
  { name: 'Bridal Hair Styling', category: 'Styling', defaultPrice: 2500, defaultDuration: 90 },
  { name: 'Hair Extensions', category: 'Styling', defaultPrice: 3000, defaultDuration: 120 },

  // ---- Color ----
  { name: 'Single Process Color', category: 'Color', defaultPrice: 1200, defaultDuration: 90 },
  { name: 'Full Highlights', category: 'Color', defaultPrice: 2500, defaultDuration: 150 },
  { name: 'Partial Highlights', category: 'Color', defaultPrice: 1500, defaultDuration: 90 },
  { name: 'Balayage', category: 'Color', defaultPrice: 3000, defaultDuration: 150 },
  { name: 'Ombre / Sombré', category: 'Color', defaultPrice: 2800, defaultDuration: 150 },
  { name: 'Root Touch-Up', category: 'Color', defaultPrice: 900, defaultDuration: 60 },
  { name: 'Global Color (Ammonia-Free)', category: 'Color', defaultPrice: 1800, defaultDuration: 90 },
  { name: 'Toner & Gloss', category: 'Color', defaultPrice: 800, defaultDuration: 45 },
  { name: 'Hair Color Correction', category: 'Color', defaultPrice: 3500, defaultDuration: 180 },

  // ---- Treatment ----
  { name: 'Keratin Treatment', category: 'Treatment', defaultPrice: 3500, defaultDuration: 120 },
  { name: 'Hair Spa', category: 'Treatment', defaultPrice: 850, defaultDuration: 45 },
  { name: 'Deep Conditioning', category: 'Treatment', defaultPrice: 700, defaultDuration: 40 },
  { name: 'Scalp Detox Treatment', category: 'Treatment', defaultPrice: 900, defaultDuration: 45 },
  { name: 'Protein Treatment', category: 'Treatment', defaultPrice: 1500, defaultDuration: 60 },
  { name: 'Botox for Hair', category: 'Treatment', defaultPrice: 2800, defaultDuration: 120 },
  { name: 'Hair Smoothing', category: 'Treatment', defaultPrice: 3200, defaultDuration: 120 },
  { name: 'Japanese Straightening', category: 'Treatment', defaultPrice: 4500, defaultDuration: 180 },
  { name: 'Split End Repair', category: 'Treatment', defaultPrice: 600, defaultDuration: 30 },
  { name: 'Anti-Dandruff Treatment', category: 'Treatment', defaultPrice: 800, defaultDuration: 45 },

  // ---- Barbering ----
  { name: 'Gentlemens Haircut', category: 'Barbering', defaultPrice: 250, defaultDuration: 30 },
  { name: 'Fade / Taper', category: 'Barbering', defaultPrice: 300, defaultDuration: 30 },
  { name: 'Undercut', category: 'Barbering', defaultPrice: 350, defaultDuration: 30 },
  { name: 'Classic Pompadour', category: 'Barbering', defaultPrice: 400, defaultDuration: 45 },
  { name: 'Kids Mens Cut', category: 'Barbering', defaultPrice: 200, defaultDuration: 20 },

  // ---- Beard ----
  { name: 'Beard Trim & Shape', category: 'Beard', defaultPrice: 150, defaultDuration: 15 },
  { name: 'Beard Grooming & Hot Towel', category: 'Beard', defaultPrice: 300, defaultDuration: 30 },
  { name: 'Clean Shave', category: 'Beard', defaultPrice: 200, defaultDuration: 20 },
  { name: 'Beard Coloring', category: 'Beard', defaultPrice: 250, defaultDuration: 30 },
  { name: 'Royal Shave Experience', category: 'Beard', defaultPrice: 500, defaultDuration: 45 },

  // ---- Facial & Skin ----
  { name: 'Classic Facial', category: 'Facial', defaultPrice: 800, defaultDuration: 60 },
  { name: 'Glow Facial', category: 'Facial', defaultPrice: 1200, defaultDuration: 60 },
  { name: 'Anti-Aging Facial', category: 'Facial', defaultPrice: 1800, defaultDuration: 75 },
  { name: 'Acne / Oil-Control Facial', category: 'Facial', defaultPrice: 1000, defaultDuration: 60 },
  { name: 'Hydrating Facial', category: 'Facial', defaultPrice: 1200, defaultDuration: 60 },
  { name: 'Gold Facial', category: 'Facial', defaultPrice: 2000, defaultDuration: 75 },
  { name: 'Diamond Facial', category: 'Facial', defaultPrice: 2500, defaultDuration: 90 },
  { name: 'Detan / De-Tan Pack', category: 'Facial', defaultPrice: 700, defaultDuration: 45 },
  { name: 'Chemical Peel', category: 'Facial', defaultPrice: 1500, defaultDuration: 45 },

  // ---- Bridal & Makeup ----
  { name: 'HD Bridal Makeup', category: 'Bridal', defaultPrice: 8000, defaultDuration: 180 },
  { name: 'Airbrush Bridal Makeup', category: 'Bridal', defaultPrice: 12000, defaultDuration: 180 },
  { name: 'Traditional Bridal Makeup', category: 'Bridal', defaultPrice: 6000, defaultDuration: 150 },
  { name: 'Party Makeup', category: 'Bridal', defaultPrice: 2500, defaultDuration: 90 },
  { name: 'Engagement Makeup', category: 'Bridal', defaultPrice: 4000, defaultDuration: 120 },
  { name: 'Saree Draping', category: 'Bridal', defaultPrice: 500, defaultDuration: 30 },
  { name: 'Hairstyling for Events', category: 'Bridal', defaultPrice: 1500, defaultDuration: 60 },

  // ---- Nail Art ----
  { name: 'Classic Manicure', category: 'Nail Art', defaultPrice: 400, defaultDuration: 30 },
  { name: 'Classic Pedicure', category: 'Nail Art', defaultPrice: 500, defaultDuration: 45 },
  { name: 'Gel Manicure', category: 'Nail Art', defaultPrice: 700, defaultDuration: 45 },
  { name: 'Gel Pedicure', category: 'Nail Art', defaultPrice: 800, defaultDuration: 60 },
  { name: 'Nail Extensions', category: 'Nail Art', defaultPrice: 1500, defaultDuration: 90 },
  { name: 'Nail Art & Design', category: 'Nail Art', defaultPrice: 500, defaultDuration: 30 },
  { name: 'Spa Manicure', category: 'Nail Art', defaultPrice: 700, defaultDuration: 45 },
  { name: 'Spa Pedicure', category: 'Nail Art', defaultPrice: 800, defaultDuration: 60 },

  // ---- Waxing ----
  { name: 'Full Arms Waxing', category: 'Waxing', defaultPrice: 200, defaultDuration: 20 },
  { name: 'Full Legs Waxing', category: 'Waxing', defaultPrice: 350, defaultDuration: 30 },
  { name: 'Full Body Waxing', category: 'Waxing', defaultPrice: 1200, defaultDuration: 90 },
  { name: 'Underarms Waxing', category: 'Waxing', defaultPrice: 100, defaultDuration: 10 },
  { name: 'Bikini Waxing', category: 'Waxing', defaultPrice: 600, defaultDuration: 30 },
  { name: 'Brazilian Waxing', category: 'Waxing', defaultPrice: 1200, defaultDuration: 45 },
  { name: 'Face Waxing (Full)', category: 'Waxing', defaultPrice: 150, defaultDuration: 15 },
  { name: 'Stomach / Back Waxing', category: 'Waxing', defaultPrice: 400, defaultDuration: 20 },

  // ---- Threading ----
  { name: 'Eyebrow Threading', category: 'Threading', defaultPrice: 50, defaultDuration: 10 },
  { name: 'Upper Lip Threading', category: 'Threading', defaultPrice: 30, defaultDuration: 5 },
  { name: 'Full Face Threading', category: 'Threading', defaultPrice: 150, defaultDuration: 20 },
  { name: 'Forehead Threading', category: 'Threading', defaultPrice: 40, defaultDuration: 5 },
  { name: 'Chin Threading', category: 'Threading', defaultPrice: 30, defaultDuration: 5 },

  // ---- Spa & Massage ----
  { name: 'Head Massage', category: 'Spa', defaultPrice: 300, defaultDuration: 30 },
  { name: 'Shoulder & Back Massage', category: 'Spa', defaultPrice: 500, defaultDuration: 30 },
  { name: 'Full Body Massage', category: 'Spa', defaultPrice: 1500, defaultDuration: 60 },
  { name: 'Aromatherapy Massage', category: 'Spa', defaultPrice: 1800, defaultDuration: 75 },
  { name: 'Swedish Massage', category: 'Spa', defaultPrice: 2000, defaultDuration: 60 },
  { name: 'Deep Tissue Massage', category: 'Spa', defaultPrice: 2200, defaultDuration: 75 },
  { name: 'Foot Reflexology', category: 'Spa', defaultPrice: 700, defaultDuration: 45 },
  { name: 'Couples Massage', category: 'Spa', defaultPrice: 3500, defaultDuration: 90 },
];

/* -------------------------------------------------------------------------- */
/*  CATEGORY → DESCRIPTION TEMPLATES (3 per category)                         */
/* -------------------------------------------------------------------------- */

export const CATEGORY_DESCRIPTIONS: Record<string, string[]> = {
  Haircut: [
    'Precision haircut tailored to your face shape, lifestyle, and personal style. Includes wash, cut, and professional finishing.',
    'Modern or classic cut crafted by expert stylists. Consultation included to ensure a look that perfectly suits you.',
    'A signature haircut combining technique and artistry. Ends with a styling touch that completes the transformation.',
  ],
  Styling: [
    'Professional styling service using premium tools and products. Perfect for events, dates, or everyday glamour.',
    'Transform your look with our expert styling — from soft waves to sleek straight. Long-lasting finish guaranteed.',
    'Salon-quality styling that lasts all day. Includes heat protection, texture control, and a flawless finish.',
  ],
  Color: [
    'Vibrant, long-lasting color applied with premium ammonia-free products. Custom shade matched to your skin tone.',
    'From subtle highlights to bold global color — our expert colorists deliver salon-quality results with healthy, shiny hair.',
    'Professional color service using top-tier brands. Includes tone consultation, application, and aftercare advice.',
  ],
  Treatment: [
    'Intensive hair treatment designed to repair damage, restore shine, and strengthen from root to tip.',
    'Deep-penetrating formula that revitalizes dull, dry hair. Leaves your locks silky, smooth, and healthy.',
    'A therapeutic hair treatment that addresses your specific concern — frizz, breakage, or lack of shine.',
  ],
  Barbering: [
    'Classic mens haircut with attention to detail. Clean lines, perfect proportions, and a polished finish.',
    'Tailored cut using traditional barbering techniques combined with modern style. Includes scalp massage.',
    'Expert mens grooming with precision fade, taper, or classic cut. Ends with hot towel refresh.',
  ],
  Beard: [
    'Precision beard shaping, trimming, and grooming to complement your jawline and personal style.',
    'Hot towel beard treatment with expert sculpting. Includes line-up, trim, and nourishing oil finish.',
    'Royal beard experience — warm towel, precise shaping, and conditioning treatment for a flawless look.',
  ],
  Facial: [
    'Luxury facial treatment customized to your skin type. Deep cleansing, exfoliation, mask, and moisturizing.',
    'Professional skincare service targeting your specific concerns — glow, anti-aging, acne, or hydration.',
    'A complete facial experience: consultation, cleanse, exfoliate, extract, mask, and finishing serum.',
  ],
  Bridal: [
    'Premium bridal makeup with HD or airbrush finish. Includes trial consultation, skin prep, and long-lasting look.',
    'Flawless bridal glam tailored to your wedding theme. Trial session, premium products, and touch-up kit included.',
    'Complete bridal transformation — makeup, hairstyling, saree draping. Designed to make you radiant on your big day.',
  ],
  'Nail Art': [
    'Expert nail service from classic care to creative designs. Uses premium polishes and long-lasting formulas.',
    'Spa-quality manicure or pedicure with attention to detail. Includes cuticle care, shaping, and polish application.',
    'Creative nail art and extensions using top-tier products. From subtle elegance to bold statement designs.',
  ],
  Waxing: [
    'Smooth, long-lasting hair removal using premium warm or strip wax. Gentle on skin, effective on hair.',
    'Professional waxing service with hygienic technique. Includes pre-wax prep and soothing aftercare.',
    'Pain-minimized waxing experience using quality products. Leaves skin soft and smooth for weeks.',
  ],
  Threading: [
    'Precision eyebrow and facial threading using traditional cotton-thread technique for clean, defined lines.',
    'Expert facial threading for a polished, natural look. Quick, precise, and gentle on sensitive skin.',
    'Traditional threading service — perfect shape, clean lines, and minimal discomfort. Includes aftercare.',
  ],
  Spa: [
    'Relaxing massage therapy using premium oils and techniques. Relieves tension and promotes deep relaxation.',
    'Therapeutic massage tailored to your needs — stress relief, pain management, or pure indulgence.',
    'A complete spa experience: warm ambiance, skilled therapist, and customized pressure for total rejuvenation.',
  ],
  General: [
    'Professional salon service delivered with care and expertise. Consultation included for best results.',
    'A premium salon experience tailored to your needs. Uses quality products and proven techniques.',
    'Expert service with attention to detail. Leaves you looking and feeling your absolute best.',
  ],
};

/* -------------------------------------------------------------------------- */
/*  PACKAGE CATALOG                                                           */
/* -------------------------------------------------------------------------- */

export interface CatalogPackage {
  name: string;
  category: string;
  defaultPrice: number;
  defaultDuration: number;
}

export const PACKAGE_CATALOG: CatalogPackage[] = [
  // ---- Bridal ----
  { name: 'Royal Bridal Package', category: 'Bridal', defaultPrice: 15000, defaultDuration: 300 },
  { name: 'HD Bridal Complete', category: 'Bridal', defaultPrice: 18000, defaultDuration: 360 },
  { name: 'Airbrush Bridal Package', category: 'Bridal', defaultPrice: 22000, defaultDuration: 360 },
  { name: 'Engagement Look Package', category: 'Bridal', defaultPrice: 6000, defaultDuration: 180 },
  { name: 'Mehendi Party Package', category: 'Bridal', defaultPrice: 4000, defaultDuration: 120 },
  { name: 'Reception Glam Package', category: 'Bridal', defaultPrice: 7000, defaultDuration: 180 },

  // ---- Groom ----
  { name: 'Groom Royal Package', category: 'Groom', defaultPrice: 3500, defaultDuration: 120 },
  { name: 'Groom Essential Package', category: 'Groom', defaultPrice: 2000, defaultDuration: 90 },
  { name: 'Groom Premium Package', category: 'Groom', defaultPrice: 5000, defaultDuration: 150 },

  // ---- Couple ----
  { name: 'Couples Spa Day', category: 'Couple', defaultPrice: 6000, defaultDuration: 180 },
  { name: 'Couples Makeover', category: 'Couple', defaultPrice: 4500, defaultDuration: 150 },
  { name: 'Pre-Wedding Couple Package', category: 'Couple', defaultPrice: 8000, defaultDuration: 240 },

  // ---- Party / Event ----
  { name: 'Party Glam Package', category: 'Party', defaultPrice: 3500, defaultDuration: 120 },
  { name: 'Birthday Glow Package', category: 'Party', defaultPrice: 2500, defaultDuration: 90 },
  { name: 'Festival Special Package', category: 'Party', defaultPrice: 2800, defaultDuration: 90 },
  { name: 'Corporate Event Package', category: 'Party', defaultPrice: 2000, defaultDuration: 60 },

  // ---- Hair Care ----
  { name: 'Complete Hair Makeover', category: 'Hair', defaultPrice: 5500, defaultDuration: 180 },
  { name: 'Color + Cut + Style Combo', category: 'Hair', defaultPrice: 2500, defaultDuration: 150 },
  { name: 'Hair Rescue Treatment Package', category: 'Hair', defaultPrice: 3200, defaultDuration: 150 },
  { name: 'Keratin + Cut + Blow-Dry', category: 'Hair', defaultPrice: 4500, defaultDuration: 180 },

  // ---- Skin & Glow ----
  { name: 'Glow Up Package', category: 'Skin', defaultPrice: 2500, defaultDuration: 120 },
  { name: 'Bridal Skin Prep Package', category: 'Skin', defaultPrice: 8000, defaultDuration: 240 },
  { name: 'Monthly Skin Maintenance', category: 'Skin', defaultPrice: 1500, defaultDuration: 90 },
  { name: 'Acne Clear Package', category: 'Skin', defaultPrice: 3000, defaultDuration: 120 },

  // ---- Spa & Wellness ----
  { name: 'Full Body Spa Package', category: 'Spa', defaultPrice: 4500, defaultDuration: 150 },
  { name: 'Head to Toe Relaxation', category: 'Spa', defaultPrice: 3500, defaultDuration: 120 },
  { name: 'Aromatherapy Escape', category: 'Spa', defaultPrice: 2800, defaultDuration: 90 },
  { name: 'Deep Detox Package', category: 'Spa', defaultPrice: 4000, defaultDuration: 120 },

  // ---- Nail ----
  { name: 'Mani-Pedi Deluxe', category: 'Nail', defaultPrice: 1200, defaultDuration: 90 },
  { name: 'Gel Mani-Pedi Combo', category: 'Nail', defaultPrice: 1500, defaultDuration: 105 },
  { name: 'Nail Art Studio Package', category: 'Nail', defaultPrice: 2000, defaultDuration: 120 },
];

/* -------------------------------------------------------------------------- */
/*  PACKAGE → DESCRIPTION TEMPLATES                                           */
/* -------------------------------------------------------------------------- */

export const PACKAGE_DESCRIPTIONS: Record<string, string[]> = {
  Bridal: [
    'Complete bridal transformation — HD/airbrush makeup, hairstyling, saree draping, and touch-up kit. Everything you need to look breathtaking on your big day.',
    'Our signature bridal package includes trial session, premium product application, and dedicated artist for a flawless, long-lasting bridal look.',
    'A luxurious all-in-one bridal experience: skin prep, makeup, hair, draping, and aftercare — crafted to make you feel like royalty.',
  ],
  Groom: [
    'Complete groom grooming — precision haircut, beard sculpting, facial, and royal shave. Walk into your wedding day looking sharp and confident.',
    'Essential groom package: classic cut, beard styling, de-tan facial, and hot towel finish. Clean, polished, and wedding-ready.',
    'Premium groom experience with haircut, beard grooming, luxury facial, head massage, and styling. Designed for the modern groom.',
  ],
  Couple: [
    'A shared spa journey for two — side-by-side massages, facials, and relaxation in our private couples suite. Perfect for pre-wedding pampering.',
    'Couples makeover package: coordinated styling, makeup consultation, and grooming for both partners. Look your best together.',
    'Pre-wedding couples package — complete grooming for both, including hair, skin, and styling. Includes photo-ready finish.',
  ],
  Party: [
    'Party-ready glam in one sitting — makeup, hairstyling, and finishing touches. Look stunning for any celebration or event.',
    'Birthday glow package: facial, blow-dry, makeup, and nail polish. Everything you need to celebrate in style.',
    'Festival special — traditional makeup, hair styling, and mehendi-friendly finish. Perfect for Navratri, Diwali, or Eid celebrations.',
    'Quick corporate event package — professional makeup and hair styling. Polished, office-appropriate, and camera-ready.',
  ],
  Hair: [
    'Complete hair transformation — consultation, cut, color/treatment, and styling. Walk out with the hair of your dreams.',
    'All-in-one hair combo: premium color application, precision cut, and professional blow-dry styling. One visit, total makeover.',
    'Intensive hair rescue package — deep treatment, damage repair, trim, and style. Restores health, shine, and manageability.',
    'Keratin smoothing plus precision cut and blow-dry. Frizz-free, silky hair that lasts for months.',
  ],
  Skin: [
    'Multi-step glow package — cleanse, exfoliate, mask, serum, and moisturizer. Leaves your skin radiant, refreshed, and camera-ready.',
    'Pre-wedding skin prep — series of facials, peels, and treatments designed over weeks for flawless bridal skin.',
    'Monthly maintenance package — facial, cleanup, and targeted treatment. Keeps your skin healthy and glowing all month.',
    'Targeted acne solution — deep cleansing facial, extraction, antibacterial mask, and aftercare routine. Clearer skin in weeks.',
  ],
  Spa: [
    'Full body spa journey — aromatherapy massage, body scrub, wrap, and facial. Total relaxation from head to toe.',
    'Head-to-toe relaxation package — head massage, back massage, foot reflexology, and facial. Melts away all stress.',
    'Aromatherapy escape — essential oil massage, steam, and calming facial. A sensory journey to deep tranquility.',
    'Deep detox package — body scrub, lymphatic massage, clay wrap, and hydrating facial. Rejuvenates body and mind.',
  ],
  Nail: [
    'Deluxe mani-pedi — cuticle care, shaping, exfoliation, mask, massage, and polish. Spa-quality care for your hands and feet.',
    'Gel mani-pedi combo — long-lasting gel polish on hands and feet. Chip-free shine for up to 3 weeks.',
    'Nail art studio package — base care plus custom nail art design. From minimalist to bold — your nails, your statement.',
  ],
  General: [
    'Curated combination of our best services at a special package price. Maximum value, minimum time.',
    'All-in-one salon experience — consultation, multiple services, and styling. Leave completely transformed.',
    'Premium package combining hair, skin, and relaxation services. The ultimate salon indulgence.',
  ],
};

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

/** Find matching catalog service (case-insensitive prefix match) */
export function matchCatalogService(name: string): CatalogService | undefined {
  if (!name.trim()) return undefined;
  const lower = name.toLowerCase();
  return SERVICE_CATALOG.find(s => s.name.toLowerCase() === lower)
    || SERVICE_CATALOG.find(s => s.name.toLowerCase().startsWith(lower))
    || SERVICE_CATALOG.find(s => s.name.toLowerCase().includes(lower));
}

export function matchCatalogPackage(name: string): CatalogPackage | undefined {
  if (!name.trim()) return undefined;
  const lower = name.toLowerCase();
  return PACKAGE_CATALOG.find(p => p.name.toLowerCase() === lower)
    || PACKAGE_CATALOG.find(p => p.name.toLowerCase().startsWith(lower))
    || PACKAGE_CATALOG.find(p => p.name.toLowerCase().includes(lower));
}

export function getDescriptionsForCategory(category: string): string[] {
  return CATEGORY_DESCRIPTIONS[category] || CATEGORY_DESCRIPTIONS.General;
}

export function getDescriptionsForPackageCategory(category: string): string[] {
  return PACKAGE_DESCRIPTIONS[category] || PACKAGE_DESCRIPTIONS.General;
}

export const ALL_SERVICE_CATEGORIES = Array.from(new Set(SERVICE_CATALOG.map(s => s.category))).sort();
export const ALL_PACKAGE_CATEGORIES = Array.from(new Set(PACKAGE_CATALOG.map(p => p.category))).sort();
