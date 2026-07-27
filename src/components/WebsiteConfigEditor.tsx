import React, { useState } from 'react';
import { WebsiteConfig } from '../types';
import { FileEdit, ImagePlus, Star, Mail, Palette } from 'lucide-react';

interface EditorProps {
  config: WebsiteConfig;
  onChange: (config: WebsiteConfig) => void;
  activeTab: 'hero' | 'services' | 'reviews' | 'contact' | 'theme';
  setActiveTab: (tab: 'hero' | 'services' | 'reviews' | 'contact' | 'theme') => void;
}

export default function WebsiteConfigEditor({ config, onChange, activeTab, setActiveTab }: EditorProps) {
  const update = (path: string[], value: any) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    let current: any = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm h-full flex flex-col">
      <div className="flex gap-2 mb-6 border-b border-surface-variant pb-2 overflow-x-auto">
        {(['hero', 'services', 'reviews', 'contact', 'theme'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${activeTab === tab ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {activeTab === 'hero' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Business Branding</label>
              <input value={config.businessName} onChange={(e) => update(['businessName'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm font-semibold" placeholder="Business Name" />
              <input value={config.tagline} onChange={(e) => update(['tagline'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm" placeholder="Tagline" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hero Section</label>
              <input value={config.heroTitle} onChange={(e) => update(['heroTitle'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm font-bold" placeholder="Hero Title" />
              <textarea value={config.heroSubtitle} onChange={(e) => update(['heroSubtitle'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm min-h-[80px]" placeholder="Hero Subtitle" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Call to Action</label>
              <div className="grid grid-cols-2 gap-3">
                <input value={config.heroCtaText} onChange={(e) => update(['heroCtaText'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm" placeholder="Button Text" />
                <input value={config.heroCtaLink} onChange={(e) => update(['heroCtaLink'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm" placeholder="Button Link" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Service List</label>
              <button 
                onClick={() => {
                  const newService = { id: Date.now().toString(), name: 'New Service', price: '$0', duration: '30m', category: 'General' };
                  onChange({...config, services: [...config.services, newService]});
                }}
                className="text-xs font-bold text-primary px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                + Add Service
              </button>
            </div>
            <div className="space-y-3">
              {config.services.map((service, index) => (
                <div key={service.id} className="p-4 border border-outline-variant rounded-xl bg-surface-container-low space-y-3 relative group">
                  <button 
                    onClick={() => {
                      const newServices = config.services.filter((_, i) => i !== index);
                      onChange({...config, services: newServices});
                    }}
                    className="absolute top-2 right-2 text-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    ×
                  </button>
                  <input value={service.name} onChange={(e) => {
                    const newServices = [...config.services];
                    newServices[index].name = e.target.value;
                    onChange({...config, services: newServices});
                  }} className="w-full bg-transparent font-bold text-sm border-b border-outline-variant focus:border-primary focus:outline-none pb-1" placeholder="Service Name" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={service.price} onChange={(e) => {
                      const newServices = [...config.services];
                      newServices[index].price = e.target.value;
                      onChange({...config, services: newServices});
                    }} className="w-full bg-transparent text-xs border-none p-0 focus:outline-none" placeholder="Price (e.g. $50)" />
                    <input value={service.duration} onChange={(e) => {
                      const newServices = [...config.services];
                      newServices[index].duration = e.target.value;
                      onChange({...config, services: newServices});
                    }} className="w-full bg-transparent text-xs border-none p-0 focus:outline-none text-right" placeholder="Duration (e.g. 60m)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Testimonials</label>
              <button 
                onClick={() => {
                  const newReview = { id: Date.now().toString(), customerName: 'New Client', rating: 5, comment: 'Excellent service!' };
                  onChange({...config, reviews: [...config.reviews, newReview]});
                }}
                className="text-xs font-bold text-primary px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                + Add Review
              </button>
            </div>
            <div className="space-y-3">
              {config.reviews.map((review, index) => (
                <div key={review.id} className="p-4 border border-outline-variant rounded-xl bg-surface-container-low space-y-2 relative group">
                  <button 
                    onClick={() => {
                      const newReviews = config.reviews.filter((_, i) => i !== index);
                      onChange({...config, reviews: newReviews});
                    }}
                    className="absolute top-2 right-2 text-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    ×
                  </button>
                  <div className="flex justify-between items-center">
                    <input value={review.customerName} onChange={(e) => {
                      const newReviews = [...config.reviews];
                      newReviews[index].customerName = e.target.value;
                      onChange({...config, reviews: newReviews});
                    }} className="bg-transparent font-bold text-sm border-none p-0 focus:outline-none" placeholder="Customer Name" />
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <Star 
                          key={star} 
                          size={12} 
                          className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-outline"} 
                          onClick={() => {
                            const newReviews = [...config.reviews];
                            newReviews[index].rating = star;
                            onChange({...config, reviews: newReviews});
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <textarea value={review.comment} onChange={(e) => {
                    const newReviews = [...config.reviews];
                    newReviews[index].comment = e.target.value;
                    onChange({...config, reviews: newReviews});
                  }} className="w-full bg-transparent text-xs border-none p-0 focus:outline-none resize-none" rows={2} placeholder="Comment..." />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Address & Phone</label>
                <input value={config.contact.address} onChange={(e) => update(['contact', 'address'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm" placeholder="Full Address" />
                <input value={config.contact.phone} onChange={(e) => update(['contact', 'phone'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm" placeholder="Phone Number" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Social Media</label>
                <input value={config.contact.socialLinks.instagram} onChange={(e) => update(['contact', 'socialLinks', 'instagram'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm" placeholder="Instagram Username" />
                <input value={config.contact.socialLinks.facebook} onChange={(e) => update(['contact', 'socialLinks', 'facebook'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm" placeholder="Facebook Page" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Hours & Map</label>
                <input value={config.contact.openingHours} onChange={(e) => update(['contact', 'openingHours'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm" placeholder="Opening Hours (e.g. Mon-Fri 9-5)" />
                <input value={config.contact.locationMap} onChange={(e) => update(['contact', 'locationMap'], e.target.value)} className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm" placeholder="Google Maps Embed URL" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Brand Colors</label>
              <div className="flex items-center justify-between p-3 border border-outline-variant rounded-xl bg-surface-container-low">
                <span className="text-sm font-medium">Primary Color</span>
                <input type="color" value={config.theme.primaryColor} onChange={(e) => update(['theme', 'primaryColor'], e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
              </div>
              <div className="flex items-center justify-between p-3 border border-outline-variant rounded-xl bg-surface-container-low">
                <span className="text-sm font-medium">Background Color</span>
                <input type="color" value={config.theme.backgroundColor} onChange={(e) => update(['theme', 'backgroundColor'], e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Typography</label>
              <div className="grid grid-cols-3 gap-2">
                {['sans', 'serif', 'mono'].map(font => (
                  <button 
                    key={font}
                    onClick={() => update(['theme', 'fontStyle'], font)}
                    className={`py-3 rounded-xl border transition-all text-sm font-bold ${config.theme.fontStyle === font ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant hover:border-outline'}`}
                  >
                    {font.charAt(0).toUpperCase() + font.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
