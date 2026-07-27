import React from 'react';
import { WebsiteConfig } from '../types';
import { Star, Phone, MapPin, Globe, MessageSquare, Timer } from 'lucide-react';

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
      }}
    >
      {/* Header */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-black/5">
        <span className="font-bold text-lg" style={{ color: config.theme.primaryColor }}>{config.businessName}</span>
        <div className="flex gap-4 text-xs font-semibold opacity-70">
            <span>Services</span>
            <span>Reviews</span>
            <span>Contact</span>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="p-8 md:p-12 space-y-6 text-center">
        <h1 className="text-4xl md:text-5xl font-black leading-tight" style={{ color: config.theme.primaryColor }}>
          {config.heroTitle}
        </h1>
        <p className="text-lg opacity-80 max-w-md mx-auto leading-relaxed">
          {config.heroSubtitle}
        </p>
        <button 
          className="px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform" 
          style={{ backgroundColor: config.theme.primaryColor }}
        >
          {config.heroCtaText}
        </button>
      </div>

      {/* Services Section */}
      <div className="px-6 py-12 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Our Services</h2>
          <div className="w-12 h-1 mx-auto rounded-full" style={{ backgroundColor: config.theme.primaryColor }}></div>
        </div>
        <div className="grid grid-cols-1 gap-4">
            {config.services.map(s => (
                <div key={s.id} className="p-5 bg-white/50 backdrop-blur-sm border border-black/5 rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                        <h3 className="font-bold text-sm">{s.name}</h3>
                        <div className="flex items-center gap-2 opacity-60 text-[10px] mt-1">
                            <Timer size={10} />
                            <span>{s.duration}</span>
                        </div>
                    </div>
                    <span className="font-black text-lg" style={{ color: config.theme.primaryColor }}>{s.price}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="px-6 py-12 bg-black/5 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Client Love</h2>
          <p className="text-xs opacity-60 italic">What people are saying about us</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {config.reviews.map(r => (
                <div key={r.id} className="min-w-[240px] p-5 bg-white rounded-2xl shadow-sm space-y-3">
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-black/10"} />
                        ))}
                    </div>
                    <p className="text-xs leading-relaxed italic opacity-80">"{r.comment}"</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest">— {r.customerName}</p>
                </div>
            ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="px-6 py-12 space-y-10">
        <div className="space-y-6">
            <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${config.theme.primaryColor}15` }}>
                    <MapPin size={18} style={{ color: config.theme.primaryColor }} />
                </div>
                <div>
                    <h4 className="text-[10px] font-bold uppercase opacity-50 mb-1">Location</h4>
                    <p className="text-xs font-medium">{config.contact.address}</p>
                </div>
            </div>
            <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${config.theme.primaryColor}15` }}>
                    <Phone size={18} style={{ color: config.theme.primaryColor }} />
                </div>
                <div>
                    <h4 className="text-[10px] font-bold uppercase opacity-50 mb-1">Phone</h4>
                    <p className="text-xs font-medium">{config.contact.phone}</p>
                </div>
            </div>
        </div>

        <div className="flex gap-3">
            {config.contact.socialLinks.instagram && <Globe size={20} className="opacity-40" />}
            {config.contact.socialLinks.facebook && <MessageSquare size={20} className="opacity-40" />}
        </div>

        <div className="pt-8 border-t border-black/5 text-center">
            <p className="text-[10px] opacity-40">© 2026 {config.businessName}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
