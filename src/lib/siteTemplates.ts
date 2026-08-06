/**
 * siteTemplates.ts
 * ----------------
 * Nexora ke SAME 4 salon templates (jo ThemeSelection me dikhte hain) +
 * har template ka asli website layout renderer.
 *
 * Yeh ek hi source of truth hai:
 *  - ThemeSelection  → isi se 4 template cards dikhte hain
 *  - ThemePreview    → isi se template ka asli design preview hota hai
 *  - LivePreview     → isi se editor ka live preview banta hai
 *  - Publish         → isi se website publish hoti hai
 *
 * Matlab: jo template chuno, wahi edit, wahi preview, wahi live.
 * Template ka data bilkul wahi hai jo pehle ThemeSelection me tha.
 */

import { Theme, WebsiteConfig } from '../types';

/* ------------------------------------------------------------------ */
/* The 4 salon templates — SAME data as before (ThemeSelection)        */
/* ------------------------------------------------------------------ */
export const SALON_THEMES: Theme[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, airy, and focused on your work.',
    tagline: 'Luminous & Free-spirited style for natural beauty',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvyCJ7cKwxcz80EPFX3_SsAiZI7j5BG8scu-eroiZOeA97VyqVD9R2y8TYR4yDsFrNjGmRREO2ZboLA-b83HfsaAlbSUwkrNW0uUrXXIY2tiW8Nve3whlWtcVG4sVfQCbFsGgmVABmXESQ2tlP_NGestX1dfHr-YB7bcsi3A6n_eVx-XCxxPHAttVorxQIj76QlsM1cZYBJcyUOJ8QOfPw2uHJmQ-rw4YSec0rnTKcZG24WjFzm9Dnvq3Q9Bn136eC68N1q7gv5dg',
    recommended: false,
    primaryColor: '#2D2A26',
    bgColor: '#FAF8F5',
    textColor: '#1A1816',
    accentColor: '#C5A059',
    fontStyle: 'font-sans',
    features: ['Spacious Layout', 'Soft Warm Tones', 'High Contrast Cards', 'Minimal Navigation'],
  },
  {
    id: 'classic-elegance',
    name: 'Classic Elegance',
    description: 'Timeless sophistication for luxury salons.',
    tagline: 'Opulent & Refined luxury cuts for a statement look',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYjwetOJmL1oAyY1bVaI8WrK4Z4pNN4nMwEyWkeENyXoMif0X96hmpiT-Whp01-QojPyt-ofEQaiC7cK1GQdRjzvK3T9aNVFsO3c0bAA8Eb2IHmznvRcU4yeUx9HNmlnoz7TWIyqfTcGEvyMKRlTYkIoq7XggHYHytrmiSC1_m93UtbdcR0j0MYsv8NNORH9gBeNMvjk1ig6mOp5uK_Y9dOsm2VggPtJMswa4bQ_35hCnLC8FnwiFTpTdegVAyChsM6eY-_k8hUkk',
    recommended: true,
    primaryColor: '#b90064',
    bgColor: '#fcf9f8',
    textColor: '#1c1b1b',
    accentColor: '#db227b',
    fontStyle: 'font-serif',
    features: ['Gold & Rose Accents', 'Serif Display Fonts', 'Marble Aesthetic', 'Hero Video/Carousel Ready'],
  },
  {
    id: 'bold-luxury',
    name: 'Bold Luxury',
    description: 'Make a statement with high-contrast design.',
    tagline: 'Avant-Garde Hair Artistry & High Energy Atmosphere',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkoIlcVMX0FoA7CDC8KPZ9CPiTvnPq9ag69qyMdFykSMR_lZxMyitgySGdMh_-D-MgKp0tTRPxtEh-c_Y8WbFkf_aymNlBZ9JShAogAnn6OGLQEQ2NLinqmzqvJXv0x6ngEQFWLTzOc7AQP9O_kzuLPO8IPMQ8tSO9zfU4aZvg1JSTb00uZSkBxIVznyzgnprU9ptdyF8kwkkgliSX9qNbtfwgaGDlpU0wxQEfaxTAnBt8hegTqQa_uz4AzRiK_1WcI4lpXT1VjAg',
    recommended: false,
    primaryColor: '#FF007A',
    bgColor: '#0F0F12',
    textColor: '#F3F0EF',
    accentColor: '#00F0FF',
    fontStyle: 'font-sans',
    features: ['Dark Mode Aesthetic', 'Neon Glowing Buttons', 'Bold Typography', 'Edge-to-edge Gallery'],
  },
  {
    id: 'summer-vibes',
    name: 'Summer Vibes',
    description: 'Bright, energetic, and full of sunshine.',
    tagline: 'Sun-Kissed Glow & Vibrant Summer Styling',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    recommended: false,
    primaryColor: '#F97316',
    bgColor: '#FFFBEB',
    textColor: '#7C2D12',
    accentColor: '#FACC15',
    fontStyle: 'font-sans',
    features: ['Tropical Palette', 'Vibrant Animations', 'Sunny Accents', 'Relaxed Layout'],
  },
];

export function getTheme(id: string | undefined | null): Theme {
  return SALON_THEMES.find((t) => t.id === id) || SALON_THEMES[0];
}

/* ------------------------------------------------------------------ */
/* Default website config (template chunne par website isse banti hai) */
/* ------------------------------------------------------------------ */
export function buildDefaultConfig(theme: Theme): WebsiteConfig {
  return {
    businessName: 'Luxe Salon',
    tagline: theme.tagline,
    heroTitle: 'Redefining Hair & Elegance',
    heroSubtitle: 'Experience master artistry in a sanctuary designed for pure relaxation.',
    heroImageUrl: '',
    heroCtaText: 'Book Now',
    heroCtaLink: '',
    services: [
      { id: '1', name: 'Signature Haircut & Styling', price: '₹600', duration: '60m', category: 'Hair' },
      { id: '2', name: 'Keratin / Smoothing Treatment', price: '₹2,500', duration: '120m', category: 'Hair' },
      { id: '3', name: 'Luxury Facial & Cleanup', price: '₹1,200', duration: '45m', category: 'Skin' },
      { id: '4', name: 'Gel / Acrylic Nails', price: '₹800', duration: '60m', category: 'Nails' },
      { id: '5', name: 'Bridal Makeup Package', price: '₹8,000', duration: '3h', category: 'Makeup' },
      { id: '6', name: 'Head Massage & Spa', price: '₹500', duration: '30m', category: 'Spa' },
    ],
    reviews: [
      { id: '1', customerName: 'Ananya', rating: 5, comment: 'Absolutely loved my new haircut! The team is so professional and the vibe is pure luxury.' },
      { id: '2', customerName: 'Priya', rating: 5, comment: 'Best bridal makeup I have ever had. I felt like a queen on my big day!' },
      { id: '3', customerName: 'Sneha', rating: 4, comment: 'Wonderful service and very hygienic. My keratin treatment was worth every rupee.' },
      { id: '4', customerName: 'Ritika', rating: 5, comment: 'Beautiful salon, friendly staff. My go-to place for every special occasion.' },
    ],
    contact: {
      address: 'Shop 12, Main Bazar, Jaipur, Rajasthan',
      phone: '9876543210',
      socialLinks: { instagram: '', facebook: '', tiktok: '' },
      openingHours: 'Mon–Sun: 10:00 AM – 8:00 PM',
      locationMap: '',
    },
    theme: {
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      textColor: theme.textColor,
      backgroundColor: theme.bgColor,
      fontStyle: theme.fontStyle.replace('font-', ''),
      fontSizeBase: 16,
      fontSizeHeading: 44,
    },
    layoutToggles: {
      showHero: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showGallery: true,
      showFooter: true,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function digits(s: unknown): string {
  return String(s ?? '').replace(/\D/g, '');
}

function waLink(phone: unknown, text: string): string {
  let d = digits(phone);
  if (d.length === 10) d = '91' + d;
  if (d.length < 10) d = '910000000000';
  return 'https://wa.me/' + d + '?text=' + encodeURIComponent(text);
}

function telLink(phone: unknown): string {
  const d = digits(phone);
  return d ? 'tel:' + d : '#';
}

function stars(rating: number): string {
  const r = Math.max(1, Math.min(5, Math.round(rating || 5)));
  let out = '';
  for (let i = 0; i < 5; i++) out += i < r ? '★' : '☆';
  return out;
}

function fontFamily(fontStyle: string): string {
  if (fontStyle === 'serif') return "Georgia, 'Playfair Display', 'Times New Roman', serif";
  if (fontStyle === 'mono') return "'Courier New', ui-monospace, monospace";
  return "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
}

function socialIcons(c: WebsiteConfig): string {
  const items: string[] = [];
  if (c.contact.socialLinks.instagram) items.push(`<a class="soc" href="https://instagram.com/${esc(c.contact.socialLinks.instagram)}" target="_blank" rel="noopener" title="Instagram">📷</a>`);
  if (c.contact.socialLinks.facebook) items.push(`<a class="soc" href="${esc(c.contact.socialLinks.facebook)}" target="_blank" rel="noopener" title="Facebook">👍</a>`);
  if (c.contact.socialLinks.tiktok) items.push(`<a class="soc" href="https://tiktok.com/@${esc(c.contact.socialLinks.tiktok)}" target="_blank" rel="noopener" title="TikTok">🎵</a>`);
  return items.join('');
}

/* ------------------------------------------------------------------ */
/* 1) MODERN MINIMAL — clean, airy, warm                               */
/* ------------------------------------------------------------------ */
function renderModernMinimal(c: WebsiteConfig): string {
  const t = c.theme;
  const f = fontFamily(t.fontStyle);
  const services = c.services.map((s) => `
    <div class="sv">
      <div class="sv-ic">${esc(s.category === 'Hair' ? '✂️' : s.category === 'Nails' ? '💅' : s.category === 'Makeup' ? '💄' : s.category === 'Spa' ? '🧖' : s.category === 'Skin' ? '✨' : '🌸')}</div>
      <div class="sv-m"><h3>${esc(s.name)}</h3><p>${esc(s.duration)}</p></div>
      <div class="sv-p">${esc(s.price)}</div>
    </div>`).join('');
  const reviews = c.reviews.map((r) => `
    <div class="rv">
      <div class="rv-st">${stars(r.rating)}</div>
      <p>“${esc(r.comment)}”</p>
      <div class="rv-w"><span class="rv-av">${esc((r.customerName || 'C').charAt(0).toUpperCase())}</span><b>${esc(r.customerName)}</b></div>
    </div>`).join('');
  const gallery = ['✂️', '💇‍♀️', '💅', '🧖‍♀️', '💄', '✨'].map((e, i) =>
    `<div class="gl" style="background:linear-gradient(135deg,${t.accentColor}26,${t.primaryColor}14)"><span>${e}</span></div>`).join('');
  const soc = socialIcons(c);
  const heroImg = c.heroImageUrl
    ? `<div class="hero-img"><img src="${esc(c.heroImageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'"/></div>`
    : `<div class="hero-img noimg" style="background:linear-gradient(140deg,${t.accentColor}30,${t.primaryColor}14)"><span>✂️</span></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(c.businessName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${f};background:${esc(t.backgroundColor)};color:${esc(t.textColor)};line-height:1.6}
.topstrip{background:${esc(t.primaryColor)};color:#fff;text-align:center;padding:9px 14px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700}
header{position:sticky;top:0;background:${esc(t.backgroundColor)}ee;backdrop-filter:blur(12px);border-bottom:1px solid ${esc(t.primaryColor)}1a;z-index:20}
.hwrap{max-width:1080px;margin:auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.brand{font-size:20px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${esc(t.primaryColor)}}
nav{display:flex;gap:22px;align-items:center;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${esc(t.textColor)}99}
nav a{color:inherit;text-decoration:none;transition:.2s}
nav a:hover{color:${esc(t.primaryColor)}}
.btn{display:inline-block;padding:11px 24px;border-radius:999px;text-decoration:none;font-weight:800;font-size:13px;letter-spacing:1px;transition:.2s}
.btn-p{background:${esc(t.primaryColor)};color:#fff}
.btn-p:hover{opacity:.9;transform:translateY(-1px)}
.btn-wa{background:#25D366;color:#fff}
.hero{max-width:1080px;margin:44px auto 8px;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center}
.hero .kick{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${esc(t.accentColor)};font-weight:800}
.hero h1{font-size:${Math.max(28, t.fontSizeHeading)}px;line-height:1.15;margin:14px 0;color:${esc(t.primaryColor)}}
.hero p{font-size:15px;color:${esc(t.textColor)}aa;max-width:440px}
.hero .cta{margin-top:26px;display:flex;gap:12px;flex-wrap:wrap}
.hero-img{border-radius:24px;overflow:hidden;box-shadow:0 20px 50px ${esc(t.primaryColor)}22;min-height:300px}
.hero-img img{width:100%;height:100%;object-fit:cover;display:block;min-height:300px}
.hero-img.noimg{display:flex;align-items:center;justify-content:center;font-size:96px}
.section{max-width:1080px;margin:70px auto;padding:0 24px}
.sec-h{text-align:center;margin-bottom:36px}
.sec-h .kick{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${esc(t.accentColor)};font-weight:800}
.sec-h h2{font-size:30px;margin-top:8px;color:${esc(t.primaryColor)}}
.sec-h .line{width:54px;height:3px;background:${esc(t.accentColor)};margin:14px auto 0;border-radius:99px}
.services{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.sv{background:#fff;border:1px solid ${esc(t.primaryColor)}12;border-radius:18px;padding:18px;display:flex;align-items:center;gap:14px;transition:.25s}
.sv:hover{transform:translateY(-3px);box-shadow:0 12px 30px ${esc(t.primaryColor)}14}
.sv-ic{width:48px;height:48px;border-radius:14px;background:${esc(t.accentColor)}20;display:flex;align-items:center;justify-content:center;font-size:24px;flex:none}
.sv-m h3{font-size:14.5px}
.sv-m p{font-size:12px;color:${esc(t.textColor)}88}
.sv-p{margin-left:auto;font-weight:800;color:${esc(t.primaryColor)};white-space:nowrap}
.reviews{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.rv{background:#fff;border:1px solid ${esc(t.primaryColor)}12;border-radius:18px;padding:22px}
.rv-st{color:#f5b301;letter-spacing:3px;margin-bottom:10px}
.rv p{font-size:13px;color:${esc(t.textColor)}99;font-style:italic;margin-bottom:14px}
.rv-w{display:flex;align-items:center;gap:10px}
.rv-av{width:34px;height:34px;border-radius:50%;background:${esc(t.accentColor)};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
.rv-w b{font-size:12.5px;letter-spacing:.5px;text-transform:uppercase}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px}
.gl{border-radius:18px;height:150px;display:flex;align-items:center;justify-content:center;font-size:52px}
.contact{max-width:1080px;margin:70px auto;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.co{background:#fff;border:1px solid ${esc(t.primaryColor)}12;border-radius:18px;padding:22px}
.co h4{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${esc(t.accentColor)};margin-bottom:10px}
.co p{font-size:14px;font-weight:600}
.co .soc{font-size:22px;margin-right:10px;text-decoration:none}
footer{margin-top:70px;background:${esc(t.primaryColor)};color:#fff;padding:44px 24px;text-align:center}
.fwrap{max-width:1080px;margin:auto}
footer .brand{color:#fff;margin-bottom:8px}
footer p{font-size:13px;opacity:.8}
.copy{margin-top:20px;font-size:11.5px;opacity:.6;letter-spacing:1px}
.wa-float{position:fixed;bottom:22px;right:22px;z-index:50}
.wa-float a{display:flex;align-items:center;gap:8px;background:#25D366;color:#fff;text-decoration:none;font-weight:800;font-size:13px;padding:13px 20px;border-radius:999px;box-shadow:0 10px 28px rgba(37,211,102,.4)}
@media(max-width:760px){.hero{grid-template-columns:1fr;gap:24px}.hero-img{min-height:220px}.hero-img img{min-height:220px}}
</style></head><body>
<div class="topstrip">✦ ${esc(c.tagline)} ✦</div>
<header><div class="hwrap">
  <span class="brand">${esc(c.businessName)}</span>
  <nav>
    <a href="#services">Services</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a>
    <a class="btn btn-p" href="${c.heroCtaLink && !c.heroCtaLink.startsWith('#') ? esc(c.heroCtaLink) : '#contact'}">${esc(c.heroCtaText || 'Book Now')}</a>
  </nav>
</div></header>

<div class="hero">
  <div>
    <div class="kick">Welcome to ${esc(c.businessName)}</div>
    <h1>${esc(c.heroTitle)}</h1>
    <p>${esc(c.heroSubtitle || c.tagline)}</p>
    <div class="cta">
      <a class="btn btn-p" href="${c.heroCtaLink && !c.heroCtaLink.startsWith('#') ? esc(c.heroCtaLink) : '#contact'}">${esc(c.heroCtaText || 'Book Now')}</a>
      <a class="btn btn-wa" href="${waLink(c.contact.phone, 'Hi! I would like to book an appointment at ' + c.businessName)}" target="_blank" rel="noopener">WhatsApp</a>
    </div>
  </div>
  ${heroImg}
</div>

${c.layoutToggles.showServices ? `<section class="section" id="services">
  <div class="sec-h"><div class="kick">What we offer</div><h2>Our Services</h2><div class="line"></div></div>
  <div class="services">${services}</div>
</section>` : ''}

${c.layoutToggles.showReviews ? `<section class="section" id="reviews" style="background:${esc(t.accentColor)}0d;border-radius:28px;padding:60px 24px">
  <div class="sec-h"><div class="kick">Client love</div><h2>Testimonials</h2><div class="line"></div></div>
  <div class="reviews">${reviews}</div>
</section>` : ''}

${c.layoutToggles.showGallery ? `<section class="section" id="gallery">
  <div class="sec-h"><div class="kick">Our work</div><h2>Gallery</h2><div class="line"></div></div>
  <div class="gallery">${gallery}</div>
</section>` : ''}

${c.layoutToggles.showContact ? `<div class="contact" id="contact">
  <div class="co"><h4>📍 Location</h4><p>${esc(c.contact.address)}</p></div>
  <div class="co"><h4>📞 Phone</h4><p><a href="${telLink(c.contact.phone)}" style="color:inherit">${esc(c.contact.phone)}</a></p></div>
  <div class="co"><h4>🕒 Hours</h4><p>${esc(c.contact.openingHours)}</p></div>
  ${soc ? `<div class="co"><h4>🌐 Follow us</h4><p>${soc}</p></div>` : ''}
</div>` : ''}

${c.layoutToggles.showFooter ? `<footer><div class="fwrap">
  <div class="brand">${esc(c.businessName)}</div>
  <p>${esc(c.tagline)}</p>
  <p class="copy">© ${new Date().getFullYear()} ${esc(c.businessName)}. All rights reserved.</p>
</div></footer>` : ''}

<div class="wa-float"><a href="${waLink(c.contact.phone, 'Hi! I would like to book an appointment at ' + c.businessName)}" target="_blank" rel="noopener">💬 WhatsApp</a></div>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* 2) CLASSIC ELEGANCE — luxury serif, gold & rose                     */
/* ------------------------------------------------------------------ */
function renderClassicElegance(c: WebsiteConfig): string {
  const t = c.theme;
  const f = fontFamily(t.fontStyle);
  const services = c.services.map((s) => `
    <div class="sv">
      <span class="sv-ic">${esc(s.category === 'Hair' ? '✂️' : s.category === 'Nails' ? '💅' : s.category === 'Makeup' ? '💄' : s.category === 'Spa' ? '🧖' : s.category === 'Skin' ? '✨' : '🌹')}</span>
      <div class="sv-m"><h3>${esc(s.name)}</h3><p>${esc(s.duration)}</p></div>
      <span class="sv-p">${esc(s.price)}</span>
    </div>`).join('');
  const reviews = c.reviews.map((r) => `
    <div class="rv">
      <span class="rv-st">${stars(r.rating)}</span>
      <p>“${esc(r.comment)}”</p>
      <div class="rv-w"><span class="rv-av">${esc((r.customerName || 'C').charAt(0).toUpperCase())}</span><b>${esc(r.customerName)}</b></div>
    </div>`).join('');
  const gallery = ['💇‍♀️', '💅', '🧖‍♀️', '💄', '💆‍♀️', '👑'].map((e, i) =>
    `<div class="gl" style="background:linear-gradient(145deg,${t.accentColor}22,#f5e9ef)"><span>${e}</span></div>`).join('');
  const soc = socialIcons(c);
  const heroImg = c.heroImageUrl
    ? `<div class="hero-img"><img src="${esc(c.heroImageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'"/><span class="ring"></span></div>`
    : `<div class="hero-img noimg" style="background:linear-gradient(150deg,#f7e8ef,#efe3dd)"><span class="m">👑</span><span class="ring"></span></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(c.businessName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${f};background:${esc(t.backgroundColor)};color:${esc(t.textColor)};line-height:1.65}
.topstrip{background:${esc(t.primaryColor)};color:#fdeef6;text-align:center;padding:10px 14px;font-size:11.5px;letter-spacing:3px;text-transform:uppercase;font-weight:700}
header{position:sticky;top:0;background:#fcf9f8f2;backdrop-filter:blur(12px);border-bottom:1px solid ${esc(t.accentColor)}22;z-index:20}
.hwrap{max-width:1060px;margin:auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.brand{font-size:21px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:${esc(t.primaryColor)};font-family:${f}}
.brand small{display:block;font-size:9px;letter-spacing:5px;color:${esc(t.accentColor)};text-transform:uppercase;font-weight:700}
nav{display:flex;gap:26px;align-items:center;font-size:11.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${esc(t.textColor)}88}
nav a{color:inherit;text-decoration:none;transition:.2s}
nav a:hover{color:${esc(t.primaryColor)}}
.btn{display:inline-block;padding:12px 28px;text-decoration:none;font-weight:800;font-size:12px;letter-spacing:2px;text-transform:uppercase;transition:.25s;border-radius:3px}
.btn-p{background:${esc(t.primaryColor)};color:#fff;box-shadow:0 8px 24px ${esc(t.primaryColor)}3a}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 12px 30px ${esc(t.primaryColor)}4d}
.btn-wa{background:#25D366;color:#fff}
.hero{max-width:1060px;margin:50px auto 0;padding:0 24px;display:grid;grid-template-columns:1.05fr .95fr;gap:50px;align-items:center}
.hero .kicker{font-size:11px;letter-spacing:5px;text-transform:uppercase;color:${esc(t.accentColor)};font-weight:800}
.hero h1{font-size:${Math.max(30, t.fontSizeHeading)}px;line-height:1.14;margin:16px 0;color:${esc(t.primaryColor)};font-family:${f}}
.hero .rule{width:64px;height:2px;background:${esc(t.accentColor)};margin:0 0 18px}
.hero p{font-size:15px;color:${esc(t.textColor)}99;max-width:430px}
.hero .cta{margin-top:28px;display:flex;gap:14px;flex-wrap:wrap}
.hero-img{position:relative;border-radius:6px;overflow:hidden;box-shadow:0 30px 70px ${esc(t.primaryColor)}2e;min-height:320px}
.hero-img img{width:100%;height:100%;object-fit:cover;display:block;min-height:320px}
.hero-img.noimg{display:flex;align-items:center;justify-content:center;font-size:120px}
.hero-img .ring{position:absolute;inset:14px;border:1px solid #fff7;pointer-events:none}
.section{max-width:1060px;margin:80px auto;padding:0 24px}
.sec-h{text-align:center;margin-bottom:40px}
.sec-h .kick{font-size:11px;letter-spacing:5px;text-transform:uppercase;color:${esc(t.accentColor)};font-weight:800}
.sec-h h2{font-size:34px;margin-top:10px;color:${esc(t.primaryColor)};font-family:${f}}
.sec-h .orn{color:${esc(t.accentColor)};font-size:20px;margin-top:8px;letter-spacing:10px}
.services{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}
.sv{background:linear-gradient(160deg,#ffffff,#fdf4f8);border:1px solid ${esc(t.accentColor)}1f;border-radius:8px;padding:20px;display:flex;align-items:center;gap:16px;transition:.25s;box-shadow:0 4px 18px ${esc(t.primaryColor)}0d}
.sv:hover{transform:translateY(-3px);box-shadow:0 16px 40px ${esc(t.primaryColor)}1f}
.sv-ic{width:52px;height:52px;border-radius:50%;border:1px solid ${esc(t.accentColor)}4d;background:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;flex:none}
.sv-m h3{font-size:15px;color:${esc(t.textColor)}}
.sv-m p{font-size:12px;color:${esc(t.accentColor)};letter-spacing:1px;text-transform:uppercase;font-weight:700}
.sv-p{margin-left:auto;font-weight:800;font-size:15px;color:${esc(t.primaryColor)};white-space:nowrap}
.reviews{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px}
.rv{background:linear-gradient(165deg,#ffffff,#fbf0f6);border:1px solid ${esc(t.accentColor)}1f;border-radius:10px;padding:26px;position:relative}
.rv::before{content:'“';position:absolute;top:6px;left:16px;font-size:64px;color:${esc(t.accentColor)}30;font-family:${f}}
.rv-st{color:#c9a227;letter-spacing:3px;margin-bottom:12px;display:block}
.rv p{font-size:13.5px;color:${esc(t.textColor)}99;font-style:italic;margin-bottom:16px}
.rv-w{display:flex;align-items:center;gap:12px}
.rv-av{width:36px;height:36px;border-radius:50%;background:${esc(t.primaryColor)};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px}
.rv-w b{font-size:12px;letter-spacing:1.5px;text-transform:uppercase}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}
.gl{border-radius:8px;height:170px;display:flex;align-items:center;justify-content:center;font-size:56px;box-shadow:inset 0 0 0 1px ${esc(t.accentColor)}26}
.contact{max-width:1060px;margin:80px auto;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}
.co{background:linear-gradient(160deg,#fff,#fdf3f8);border:1px solid ${esc(t.accentColor)}1f;border-radius:8px;padding:26px}
.co h4{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${esc(t.accentColor)};margin-bottom:12px;font-weight:800}
.co p{font-size:14.5px;font-weight:600}
.co .soc{font-size:24px;margin-right:12px;text-decoration:none}
footer{margin-top:80px;background:${esc(t.primaryColor)};color:#fdeef6;padding:50px 24px;text-align:center}
.fwrap{max-width:1060px;margin:auto}
footer .brand{color:#fff}
footer p{font-size:13.5px;opacity:.85}
.copy{margin-top:22px;font-size:11.5px;opacity:.55;letter-spacing:1.5px}
.wa-float{position:fixed;bottom:24px;right:24px;z-index:50}
.wa-float a{display:flex;align-items:center;gap:8px;background:#25D366;color:#fff;text-decoration:none;font-weight:800;font-size:13px;padding:14px 22px;border-radius:99px;box-shadow:0 10px 30px rgba(37,211,102,.45)}
@media(max-width:760px){.hero{grid-template-columns:1fr;gap:26px}.hero-img{min-height:240px}.hero-img img{min-height:240px}}
</style></head><body>
<div class="topstrip">✦ ${esc(c.tagline)} ✦</div>
<header><div class="hwrap">
  <span class="brand">${esc(c.businessName)}<small>Salon &amp; Spa</small></span>
  <nav>
    <a href="#services">Services</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a>
    <a class="btn btn-p" href="${c.heroCtaLink && !c.heroCtaLink.startsWith('#') ? esc(c.heroCtaLink) : '#contact'}">${esc(c.heroCtaText || 'Book Now')}</a>
  </nav>
</div></header>

<div class="hero">
  <div>
    <div class="kicker">Welcome to ${esc(c.businessName)}</div>
    <h1>${esc(c.heroTitle)}</h1>
    <div class="rule"></div>
    <p>${esc(c.heroSubtitle || c.tagline)}</p>
    <div class="cta">
      <a class="btn btn-p" href="${c.heroCtaLink && !c.heroCtaLink.startsWith('#') ? esc(c.heroCtaLink) : '#contact'}">${esc(c.heroCtaText || 'Book Now')}</a>
      <a class="btn btn-wa" href="${waLink(c.contact.phone, 'Hi! I would like to book an appointment at ' + c.businessName)}" target="_blank" rel="noopener">WhatsApp</a>
    </div>
  </div>
  ${heroImg}
</div>

${c.layoutToggles.showServices ? `<section class="section" id="services">
  <div class="sec-h"><div class="kick">Our signature</div><h2>Services</h2><div class="orn">✦ ✦ ✦</div></div>
  <div class="services">${services}</div>
</section>` : ''}

${c.layoutToggles.showReviews ? `<section class="section" id="reviews">
  <div class="sec-h"><div class="kick">Client love</div><h2>Testimonials</h2><div class="orn">✦ ✦ ✦</div></div>
  <div class="reviews">${reviews}</div>
</section>` : ''}

${c.layoutToggles.showGallery ? `<section class="section" id="gallery">
  <div class="sec-h"><div class="kick">The art</div><h2>Gallery</h2><div class="orn">✦ ✦ ✦</div></div>
  <div class="gallery">${gallery}</div>
</section>` : ''}

${c.layoutToggles.showContact ? `<div class="contact" id="contact">
  <div class="co"><h4>📍 Location</h4><p>${esc(c.contact.address)}</p></div>
  <div class="co"><h4>📞 Phone</h4><p><a href="${telLink(c.contact.phone)}" style="color:inherit">${esc(c.contact.phone)}</a></p></div>
  <div class="co"><h4>🕒 Hours</h4><p>${esc(c.contact.openingHours)}</p></div>
  ${soc ? `<div class="co"><h4>🌐 Follow us</h4><p>${soc}</p></div>` : ''}
</div>` : ''}

${c.layoutToggles.showFooter ? `<footer><div class="fwrap">
  <div class="brand">${esc(c.businessName)}</div>
  <p>${esc(c.tagline)}</p>
  <p class="copy">© ${new Date().getFullYear()} ${esc(c.businessName)}. Crafted with elegance.</p>
</div></footer>` : ''}

<div class="wa-float"><a href="${waLink(c.contact.phone, 'Hi! I would like to book an appointment at ' + c.businessName)}" target="_blank" rel="noopener">💬 WhatsApp</a></div>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* 3) BOLD LUXURY — dark, neon, high contrast                          */
/* ------------------------------------------------------------------ */
function renderBoldLuxury(c: WebsiteConfig): string {
  const t = c.theme;
  const f = fontFamily(t.fontStyle);
  const services = c.services.map((s) => `
    <div class="sv">
      <span class="sv-num">${esc(s.category === 'Hair' ? '✂' : s.category === 'Nails' ? '💅' : s.category === 'Makeup' ? '💄' : s.category === 'Spa' ? '🧖' : s.category === 'Skin' ? '✨' : '◆')}</span>
      <div class="sv-m"><h3>${esc(s.name)}</h3><p>${esc(s.duration)}</p></div>
      <span class="sv-p">${esc(s.price)}</span>
    </div>`).join('');
  const reviews = c.reviews.map((r) => `
    <div class="rv">
      <span class="rv-st">${stars(r.rating)}</span>
      <p>“${esc(r.comment)}”</p>
      <div class="rv-w"><span class="rv-av">${esc((r.customerName || 'C').charAt(0).toUpperCase())}</span><b>${esc(r.customerName)}</b></div>
    </div>`).join('');
  const gallery = ['💇‍♀️', '💅', '🧖‍♀️', '💄', '💆‍♀️', '👑'].map((e, i) =>
    `<div class="gl" style="background:linear-gradient(150deg,${t.primaryColor}2e,#0f0f12)"><span>${e}</span></div>`).join('');
  const soc = socialIcons(c);
  const heroImg = c.heroImageUrl
    ? `<div class="hero-img"><img src="${esc(c.heroImageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'"/></div>`
    : `<div class="hero-img noimg" style="background:radial-gradient(120% 120% at 20% 10%,${t.primaryColor}3d,#0f0f12 70%)"><span>⚡</span></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(c.businessName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${f};background:${esc(t.backgroundColor)};color:${esc(t.textColor)};line-height:1.6}
.topstrip{background:${esc(t.primaryColor)};color:#fff;text-align:center;padding:10px 14px;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:900;text-shadow:0 0 18px ${esc(t.primaryColor)}}
header{position:sticky;top:0;background:${esc(t.backgroundColor)}e6;backdrop-filter:blur(14px);border-bottom:1px solid ${esc(t.primaryColor)}3d;z-index:20}
.hwrap{max-width:1120px;margin:auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.brand{font-size:20px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:${esc(t.textColor)};text-shadow:0 0 16px ${esc(t.primaryColor)}}
.brand em{font-style:normal;color:${esc(t.primaryColor)}}
nav{display:flex;gap:20px;align-items:center;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${esc(t.textColor)}77}
nav a{color:inherit;text-decoration:none;transition:.2s}
nav a:hover{color:${esc(t.accentColor)};text-shadow:0 0 12px ${esc(t.accentColor)}}
.btn{display:inline-block;padding:12px 26px;text-decoration:none;font-weight:900;font-size:12px;letter-spacing:2px;text-transform:uppercase;transition:.2s;border-radius:2px}
.btn-p{background:${esc(t.primaryColor)};color:#fff;box-shadow:0 0 26px ${esc(t.primaryColor)}8c,0 0 60px ${esc(t.primaryColor)}4d}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 0 34px ${esc(t.primaryColor)}}
.btn-wa{background:#25D366;color:#04220f;box-shadow:0 0 24px #25d3668c}
.hero{max-width:1120px;margin:50px auto 0;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.hero .kicker{font-size:11px;letter-spacing:5px;text-transform:uppercase;color:${esc(t.accentColor)};font-weight:900;text-shadow:0 0 14px ${esc(t.accentColor)}}
.hero h1{font-size:${Math.max(32, t.fontSizeHeading)}px;line-height:1.08;margin:16px 0;color:${esc(t.textColor)};text-transform:uppercase;letter-spacing:1px}
.hero h1 b{color:${esc(t.primaryColor)};text-shadow:0 0 30px ${esc(t.primaryColor)}}
.hero p{font-size:15px;color:${esc(t.textColor)}88;max-width:440px}
.hero .cta{margin-top:28px;display:flex;gap:14px;flex-wrap:wrap}
.hero-img{border:1px solid ${esc(t.primaryColor)}4d;border-radius:6px;overflow:hidden;min-height:320px;box-shadow:0 0 50px ${esc(t.primaryColor)}33}
.hero-img img{width:100%;height:100%;object-fit:cover;display:block;min-height:320px}
.hero-img.noimg{display:flex;align-items:center;justify-content:center;font-size:110px}
.section{max-width:1120px;margin:80px auto;padding:0 24px}
.sec-h{margin-bottom:36px}
.sec-h .kick{font-size:11px;letter-spacing:5px;text-transform:uppercase;color:${esc(t.accentColor)};font-weight:900}
.sec-h h2{font-size:32px;margin-top:8px;text-transform:uppercase;letter-spacing:1px}
.sec-h h2 span{color:${esc(t.primaryColor)};text-shadow:0 0 24px ${esc(t.primaryColor)}}
.services{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.sv{background:linear-gradient(160deg,${esc(t.textColor)}0d,#0f0f12);border:1px solid ${esc(t.primaryColor)}3d;border-radius:4px;padding:18px;display:flex;align-items:center;gap:16px;transition:.25s}
.sv:hover{border-color:${esc(t.accentColor)};box-shadow:0 0 24px ${esc(t.primaryColor)}3d;transform:translateY(-2px)}
.sv-num{width:46px;height:46px;border-radius:4px;background:${esc(t.primaryColor)};color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none;box-shadow:0 0 18px ${esc(t.primaryColor)}8c}
.sv-m h3{font-size:14.5px;color:${esc(t.textColor)}}
.sv-m p{font-size:12px;color:${esc(t.accentColor)};letter-spacing:1.5px;text-transform:uppercase;font-weight:800}
.sv-p{margin-left:auto;font-weight:900;color:${esc(t.primaryColor)};white-space:nowrap;text-shadow:0 0 14px ${esc(t.primaryColor)}}
.reviews{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
.rv{background:linear-gradient(160deg,${esc(t.textColor)}0d,#0f0f12);border:1px solid ${esc(t.primaryColor)}3d;border-radius:4px;padding:24px}
.rv-st{color:#f5b301;letter-spacing:3px;margin-bottom:12px;display:block;text-shadow:0 0 12px #f5b30166}
.rv p{font-size:13.5px;color:${esc(t.textColor)}88;font-style:italic;margin-bottom:16px}
.rv-w{display:flex;align-items:center;gap:12px}
.rv-av{width:36px;height:36px;border-radius:50%;background:${esc(t.accentColor)};color:#0f0f12;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px}
.rv-w b{font-size:12px;letter-spacing:1.5px;text-transform:uppercase}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
.gl{border:1px solid ${esc(t.primaryColor)}3d;border-radius:4px;height:160px;display:flex;align-items:center;justify-content:center;font-size:52px}
.contact{max-width:1120px;margin:80px auto;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.co{background:linear-gradient(160deg,${esc(t.textColor)}0d,#0f0f12);border:1px solid ${esc(t.primaryColor)}3d;border-radius:4px;padding:24px}
.co h4{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${esc(t.accentColor)};margin-bottom:12px;font-weight:900}
.co p{font-size:14.5px;font-weight:700}
.co .soc{font-size:24px;margin-right:12px;text-decoration:none}
footer{margin-top:80px;background:#0a0a0d;border-top:1px solid ${esc(t.primaryColor)}3d;padding:46px 24px;text-align:center}
.fwrap{max-width:1120px;margin:auto}
footer p{font-size:13.5px;opacity:.75}
.copy{margin-top:20px;font-size:11.5px;opacity:.45;letter-spacing:1.5px}
.wa-float{position:fixed;bottom:24px;right:24px;z-index:50}
.wa-float a{display:flex;align-items:center;gap:8px;background:#25D366;color:#04220f;text-decoration:none;font-weight:900;font-size:13px;padding:14px 22px;border-radius:99px;box-shadow:0 0 28px #25d36699}
@media(max-width:760px){.hero{grid-template-columns:1fr;gap:26px}.hero-img{min-height:240px}.hero-img img{min-height:240px}}
</style></head><body>
<div class="topstrip">⚡ ${esc(c.tagline)} ⚡</div>
<header><div class="hwrap">
  <span class="brand">${esc(c.businessName)}</span>
  <nav>
    <a href="#services">Services</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a>
    <a class="btn btn-p" href="${c.heroCtaLink && !c.heroCtaLink.startsWith('#') ? esc(c.heroCtaLink) : '#contact'}">${esc(c.heroCtaText || 'Book Now')}</a>
  </nav>
</div></header>

<div class="hero">
  <div>
    <div class="kicker">/// ${esc(c.businessName)}</div>
    <h1>${esc(c.heroTitle)}</h1>
    <p>${esc(c.heroSubtitle || c.tagline)}</p>
    <div class="cta">
      <a class="btn btn-p" href="${c.heroCtaLink && !c.heroCtaLink.startsWith('#') ? esc(c.heroCtaLink) : '#contact'}">${esc(c.heroCtaText || 'Book Now')}</a>
      <a class="btn btn-wa" href="${waLink(c.contact.phone, 'Hi! I would like to book an appointment at ' + c.businessName)}" target="_blank" rel="noopener">WhatsApp</a>
    </div>
  </div>
  ${heroImg}
</div>

${c.layoutToggles.showServices ? `<section class="section" id="services">
  <div class="sec-h"><div class="kick">Menu</div><h2><span>Our</span> Services</h2></div>
  <div class="services">${services}</div>
</section>` : ''}

${c.layoutToggles.showReviews ? `<section class="section" id="reviews">
  <div class="sec-h"><div class="kick">Reviews</div><h2><span>Client</span> Love</h2></div>
  <div class="reviews">${reviews}</div>
</section>` : ''}

${c.layoutToggles.showGallery ? `<section class="section" id="gallery">
  <div class="sec-h"><div class="kick">Portfolio</div><h2><span>The</span> Work</h2></div>
  <div class="gallery">${gallery}</div>
</section>` : ''}

${c.layoutToggles.showContact ? `<div class="contact" id="contact">
  <div class="co"><h4>📍 Location</h4><p>${esc(c.contact.address)}</p></div>
  <div class="co"><h4>📞 Phone</h4><p><a href="${telLink(c.contact.phone)}" style="color:inherit">${esc(c.contact.phone)}</a></p></div>
  <div class="co"><h4>🕒 Hours</h4><p>${esc(c.contact.openingHours)}</p></div>
  ${soc ? `<div class="co"><h4>🌐 Follow us</h4><p>${soc}</p></div>` : ''}
</div>` : ''}

${c.layoutToggles.showFooter ? `<footer><div class="fwrap">
  <div class="brand">${esc(c.businessName)}</div>
  <p>${esc(c.tagline)}</p>
  <p class="copy">© ${new Date().getFullYear()} ${esc(c.businessName)}. All rights reserved.</p>
</div></footer>` : ''}

<div class="wa-float"><a href="${waLink(c.contact.phone, 'Hi! I would like to book an appointment at ' + c.businessName)}" target="_blank" rel="noopener">💬 WhatsApp</a></div>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* 4) SUMMER VIBES — bright, sunny, tropical                           */
/* ------------------------------------------------------------------ */
function renderSummerVibes(c: WebsiteConfig): string {
  const t = c.theme;
  const f = fontFamily(t.fontStyle);
  const services = c.services.map((s) => `
    <div class="sv">
      <span class="sv-ic">${esc(s.category === 'Hair' ? '✂️' : s.category === 'Nails' ? '💅' : s.category === 'Makeup' ? '💄' : s.category === 'Spa' ? '🧖' : s.category === 'Skin' ? '✨' : '🌺')}</span>
      <div class="sv-m"><h3>${esc(s.name)}</h3><p>⏱ ${esc(s.duration)}</p></div>
      <span class="sv-p">${esc(s.price)}</span>
    </div>`).join('');
  const reviews = c.reviews.map((r) => `
    <div class="rv">
      <span class="rv-st">${stars(r.rating)}</span>
      <p>“${esc(r.comment)}”</p>
      <div class="rv-w"><span class="rv-av">${esc((r.customerName || 'C').charAt(0).toUpperCase())}</span><b>${esc(r.customerName)}</b></div>
    </div>`).join('');
  const gallery = ['🌞', '🌺', '🏖️', '🍉', '🌸', '🌈'].map((e, i) =>
    `<div class="gl" style="background:linear-gradient(150deg,${t.accentColor}4d,${t.primaryColor}26)"><span>${e}</span></div>`).join('');
  const soc = socialIcons(c);
  const heroImg = c.heroImageUrl
    ? `<div class="hero-img"><img src="${esc(c.heroImageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'"/></div>`
    : `<div class="hero-img noimg" style="background:linear-gradient(150deg,#ffedd5,#fef3c7)"><span>🌞</span></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(c.businessName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${f};background:${esc(t.backgroundColor)};color:${esc(t.textColor)};line-height:1.6}
.topstrip{background:linear-gradient(90deg,${esc(t.primaryColor)},${esc(t.accentColor)});color:#fff;text-align:center;padding:10px 14px;font-size:13px;font-weight:900;letter-spacing:1px}
header{position:sticky;top:0;background:${esc(t.backgroundColor)}f2;backdrop-filter:blur(12px);border-bottom:3px dashed ${esc(t.primaryColor)}4d;z-index:20}
.hwrap{max-width:1080px;margin:auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.brand{font-size:21px;font-weight:900;letter-spacing:1px;color:${esc(t.primaryColor)}}
nav{display:flex;gap:20px;align-items:center;font-size:12.5px;font-weight:800;color:${esc(t.textColor)}bb}
nav a{color:inherit;text-decoration:none;transition:.2s}
nav a:hover{color:${esc(t.primaryColor)};text-decoration:underline wavy ${esc(t.accentColor)}}
.btn{display:inline-block;padding:12px 26px;border-radius:99px;text-decoration:none;font-weight:900;font-size:13px;transition:.2s;border:0}
.btn-p{background:${esc(t.primaryColor)};color:#fff;box-shadow:0 8px 22px ${esc(t.primaryColor)}4d}
.btn-p:hover{transform:translateY(-2px) rotate(-1deg)}
.btn-wa{background:#25D366;color:#fff}
.hero{max-width:1080px;margin:48px auto 0;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center}
.hero .kicker{display:inline-block;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:900;color:${esc(t.primaryColor)};background:${esc(t.accentColor)}40;padding:6px 14px;border-radius:99px}
.hero h1{font-size:${Math.max(30, t.fontSizeHeading)}px;line-height:1.12;margin:16px 0;color:${esc(t.primaryColor)}}
.hero p{font-size:15px;color:${esc(t.textColor)}aa;max-width:430px}
.hero .cta{margin-top:26px;display:flex;gap:12px;flex-wrap:wrap}
.hero-img{border:6px solid #fff;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px ${esc(t.primaryColor)}2e;min-height:300px;transform:rotate(1deg)}
.hero-img img{width:100%;height:100%;object-fit:cover;display:block;min-height:300px}
.hero-img.noimg{display:flex;align-items:center;justify-content:center;font-size:100px}
.section{max-width:1080px;margin:72px auto;padding:0 24px}
.sec-h{text-align:center;margin-bottom:34px}
.sec-h .kick{display:inline-block;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:900;color:${esc(t.primaryColor)};background:${esc(t.accentColor)}40;padding:5px 14px;border-radius:99px}
.sec-h h2{font-size:32px;margin-top:12px;color:${esc(t.primaryColor)}}
.services{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px}
.sv{background:#fff;border:3px solid ${esc(t.primaryColor)}1f;border-radius:20px;padding:18px;display:flex;align-items:center;gap:15px;transition:.25s}
.sv:hover{transform:translateY(-3px) rotate(.5deg);border-color:${esc(t.accentColor)};box-shadow:0 14px 34px ${esc(t.primaryColor)}1f}
.sv-ic{width:50px;height:50px;border-radius:50%;background:${esc(t.accentColor)}59;display:flex;align-items:center;justify-content:center;font-size:26px;flex:none}
.sv-m h3{font-size:15px;color:${esc(t.textColor)}}
.sv-m p{font-size:12px;color:${esc(t.primaryColor)};font-weight:800}
.sv-p{margin-left:auto;font-weight:900;color:${esc(t.primaryColor)};white-space:nowrap}
.reviews{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
.rv{background:#fff;border:3px solid ${esc(t.primaryColor)}1f;border-radius:22px;padding:24px}
.rv-st{color:#f59e0b;letter-spacing:3px;margin-bottom:12px;display:block}
.rv p{font-size:13.5px;color:${esc(t.textColor)}88;font-style:italic;margin-bottom:16px}
.rv-w{display:flex;align-items:center;gap:12px}
.rv-av{width:36px;height:36px;border-radius:50%;background:${esc(t.primaryColor)};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px}
.rv-w b{font-size:12px;letter-spacing:1px;text-transform:uppercase}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px}
.gl{border-radius:22px;height:160px;display:flex;align-items:center;justify-content:center;font-size:54px;border:3px solid #fff;box-shadow:0 8px 22px ${esc(t.primaryColor)}1a}
.contact{max-width:1080px;margin:72px auto;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.co{background:#fff;border:3px solid ${esc(t.primaryColor)}1f;border-radius:20px;padding:22px}
.co h4{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${esc(t.primaryColor)};margin-bottom:10px;font-weight:900}
.co p{font-size:14px;font-weight:700}
.co .soc{font-size:24px;margin-right:12px;text-decoration:none}
footer{margin-top:72px;background:linear-gradient(90deg,${esc(t.primaryColor)},#f97316);color:#fff;padding:44px 24px;text-align:center;border-radius:40px 40px 0 0}
.fwrap{max-width:1080px;margin:auto}
footer .brand{color:#fff}
footer p{font-size:13.5px;opacity:.9}
.copy{margin-top:20px;font-size:11.5px;opacity:.7;letter-spacing:1px}
.wa-float{position:fixed;bottom:22px;right:22px;z-index:50}
.wa-float a{display:flex;align-items:center;gap:8px;background:#25D366;color:#fff;text-decoration:none;font-weight:900;font-size:13px;padding:13px 20px;border-radius:99px;box-shadow:0 10px 28px rgba(37,211,102,.45)}
@media(max-width:760px){.hero{grid-template-columns:1fr;gap:24px}.hero-img{min-height:230px}.hero-img img{min-height:230px}}
</style></head><body>
<div class="topstrip">🌴 ${esc(c.tagline)} 🌺</div>
<header><div class="hwrap">
  <span class="brand">${esc(c.businessName)}</span>
  <nav>
    <a href="#services">Services</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a>
    <a class="btn btn-p" href="${c.heroCtaLink && !c.heroCtaLink.startsWith('#') ? esc(c.heroCtaLink) : '#contact'}">${esc(c.heroCtaText || 'Book Now')}</a>
  </nav>
</div></header>

<div class="hero">
  <div>
    <div class="kicker">Sunny days await ☀️</div>
    <h1>${esc(c.heroTitle)}</h1>
    <p>${esc(c.heroSubtitle || c.tagline)}</p>
    <div class="cta">
      <a class="btn btn-p" href="${c.heroCtaLink && !c.heroCtaLink.startsWith('#') ? esc(c.heroCtaLink) : '#contact'}">${esc(c.heroCtaText || 'Book Now')}</a>
      <a class="btn btn-wa" href="${waLink(c.contact.phone, 'Hi! I would like to book an appointment at ' + c.businessName)}" target="_blank" rel="noopener">WhatsApp</a>
    </div>
  </div>
  ${heroImg}
</div>

${c.layoutToggles.showServices ? `<section class="section" id="services">
  <div class="sec-h"><div class="kick">Fresh &amp; fun</div><h2>Our Services</h2></div>
  <div class="services">${services}</div>
</section>` : ''}

${c.layoutToggles.showReviews ? `<section class="section" id="reviews">
  <div class="sec-h"><div class="kick">Happy clients</div><h2>Reviews</h2></div>
  <div class="reviews">${reviews}</div>
</section>` : ''}

${c.layoutToggles.showGallery ? `<section class="section" id="gallery">
  <div class="sec-h"><div class="kick">Good vibes</div><h2>Gallery</h2></div>
  <div class="gallery">${gallery}</div>
</section>` : ''}

${c.layoutToggles.showContact ? `<div class="contact" id="contact">
  <div class="co"><h4>📍 Location</h4><p>${esc(c.contact.address)}</p></div>
  <div class="co"><h4>📞 Phone</h4><p><a href="${telLink(c.contact.phone)}" style="color:inherit">${esc(c.contact.phone)}</a></p></div>
  <div class="co"><h4>🕒 Hours</h4><p>${esc(c.contact.openingHours)}</p></div>
  ${soc ? `<div class="co"><h4>🌐 Follow us</h4><p>${soc}</p></div>` : ''}
</div>` : ''}

${c.layoutToggles.showFooter ? `<footer><div class="fwrap">
  <div class="brand">${esc(c.businessName)}</div>
  <p>${esc(c.tagline)}</p>
  <p class="copy">© ${new Date().getFullYear()} ${esc(c.businessName)}. Made with sunshine.</p>
</div></footer>` : ''}

<div class="wa-float"><a href="${waLink(c.contact.phone, 'Hi! I would like to book an appointment at ' + c.businessName)}" target="_blank" rel="noopener">💬 WhatsApp</a></div>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* Public: render site for a given template id                         */
/* ------------------------------------------------------------------ */
export function renderSiteHTML(config: WebsiteConfig, themeId: string | null | undefined): string {
  const id = themeId || getTheme(themeId).id;
  switch (id) {
    case 'modern-minimal':
      return renderModernMinimal(config);
    case 'classic-elegance':
      return renderClassicElegance(config);
    case 'bold-luxury':
      return renderBoldLuxury(config);
    case 'summer-vibes':
      return renderSummerVibes(config);
    default:
      return renderClassicElegance(config);
  }
}
