import React from 'react';
import { WebsiteConfig } from '../types';
import { Star, Phone, MapPin, Globe, MessageSquare, Timer, ImagePlus } from 'lucide-react';

interface LivePreviewProps {
  config: WebsiteConfig;
}

export default function LivePreview({ config }: LivePreviewProps) {
  const fontClass = config.theme.fontStyle === 'serif' ? 'font-serif' : config.theme.fontStyle === 'mono' ? 'font-mono' : 'font-sans';

  return (
    <div 
      className={`w-full h-full overflow-y-auto transition-all duration-300 flex flex-col mx-auto ${fontClass}`}
      style={{
        backgroundColor: config.theme.backgroundColor,
        color: config.theme.textColor,
        fontSize: `${config.theme.fontSizeBase}px`,
      }}
    >
      {/* Header */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-black/5 shrink-0 bg-white/10 backdrop-blur-md sticky top-0 z-10">
        <span className="font-bold text-lg" style={{ color: config.theme.primaryColor }}>{config.businessName}</span>
        <div className="flex gap-4 text-[10px] font-extrabold uppercase tracking-widest opacity-60">
            {config.layoutToggles.showServices && <span>Services</span>}
            {config.layoutToggles.showReviews && <span>Reviews</span>}
            {config.layoutToggles.showContact && <span>Contact</span>}
        </div>
      </nav>

      {/* Hero Section */}
      {config.layoutToggles.showHero && (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 blur-2xl -z-10 scale-150 transform rotate-12" style={{ backgroundColor: config.theme.accentColor }}></div>
            <div className="p-8 md:p-12 space-y-6 text-center relative">
                {config.heroImageUrl && (
                    <div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden shadow-xl mb-6 border-4 border-white">
                        <img src={config.heroImageUrl} alt="Hero" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                )}
                <h1 
                    className="font-black leading-tight" 
                    style={{ 
                        color: config.theme.primaryColor,
                        fontSize: `${config.theme.fontSizeHeading}px`
                    }}
                >
                {config.heroTitle}
                </h1>
                <p className="opacity-80 max-w-md mx-auto leading-relaxed font-medium">
                {config.heroSubtitle}
                </p>
                <button 
                className="px-8 py-4 rounded-2xl text-white font-bold shadow-lg hover:scale-105 transition-transform" 
                style={{ backgroundColor: config.theme.primaryColor }}
                >
                {config.heroCtaText}
                </button>
            </div>
        </div>
      )}

      {/* Services Section */}
      {config.layoutToggles.showServices && (
        <div className="px-6 py-12 space-y-8">
            <div className="text-center">
            <h2 className="text-2xl font-black mb-2">Our Services</h2>
            <div className="w-12 h-1.5 mx-auto rounded-full" style={{ backgroundColor: config.theme.accentColor }}></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {config.services.map(s => (
                    <div key={s.id} className="p-5 bg-white/40 backdrop-blur-sm border border-black/5 rounded-3xl flex justify-between items-center shadow-sm hover:border-black/10 transition-colors">
                        <div>
                            <h3 className="font-bold text-sm">{s.name}</h3>
                            <div className="flex items-center gap-2 opacity-60 text-[10px] mt-1 font-bold">
                                <Timer size={12} />
                                <span>{s.duration}</span>
                            </div>
                        </div>
                        <span className="font-black text-lg" style={{ color: config.theme.primaryColor }}>{s.price}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Reviews Section */}
      {config.layoutToggles.showReviews && (
        <div className="px-6 py-12 bg-black/5 space-y-8">
            <div className="text-center">
            <h2 className="text-2xl font-black mb-2">Client Love</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 italic">What people are saying about us</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {config.reviews.map(r => (
                    <div key={r.id} className="min-w-[260px] p-6 bg-white rounded-3xl shadow-sm space-y-4 border border-black/5">
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-black/10"} />
                            ))}
                        </div>
                        <p className="text-xs leading-relaxed italic opacity-80 font-medium">"{r.comment}"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold">{r.customerName.charAt(0)}</div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest">— {r.customerName}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Gallery Section Placeholder */}
      {config.layoutToggles.showGallery && (
        <div className="px-6 py-12 space-y-8">
             <div className="text-center">
                <h2 className="text-2xl font-black mb-2">Visual Gallery</h2>
                <div className="w-12 h-1.5 mx-auto rounded-full" style={{ backgroundColor: config.theme.accentColor }}></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-square rounded-3xl bg-surface-variant animate-pulse flex items-center justify-center">
                        <ImagePlus size={24} className="opacity-20" />
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Contact Section */}
      {config.layoutToggles.showContact && (
        <div className="px-6 py-12 space-y-10 bg-surface-container-low/50">
            <div className="space-y-6">
                <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${config.theme.primaryColor}15` }}>
                        <MapPin size={20} style={{ color: config.theme.primaryColor }} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-extrabold uppercase opacity-40 mb-1 tracking-wider">Location</h4>
                        <p className="text-sm font-bold">{config.contact.address}</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${config.theme.primaryColor}15` }}>
                        <Phone size={20} style={{ color: config.theme.primaryColor }} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-extrabold uppercase opacity-40 mb-1 tracking-wider">Direct Phone</h4>
                        <p className="text-sm font-bold">{config.contact.phone}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 p-4 bg-white/50 rounded-2xl border border-black/5">
                {config.contact.socialLinks.instagram && <Globe size={24} className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />}
                {config.contact.socialLinks.facebook && <MessageSquare size={24} className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />}
                <div className="flex-1"></div>
                <button className="px-4 py-2 rounded-xl bg-black text-white text-[10px] font-bold uppercase">Send Message</button>
            </div>
        </div>
      )}

      {/* Footer */}
      {config.layoutToggles.showFooter && (
        <div className="p-8 border-t border-black/5 text-center space-y-4">
            <div className="flex justify-center gap-6 text-[10px] font-extrabold uppercase tracking-widest opacity-40">
                <span>Terms</span>
                <span>Privacy</span>
                <span>Support</span>
            </div>
            <p className="text-[10px] font-bold opacity-30 tracking-wider">© 2026 {config.businessName}. Crafted for excellence.</p>
        </div>
      )}
    </div>
  );
}
