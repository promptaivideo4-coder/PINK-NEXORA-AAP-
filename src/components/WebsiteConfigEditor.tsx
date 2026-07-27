import React, { useState } from 'react';
import { WebsiteConfig } from '../types';
import { FileEdit, ImagePlus, Star, Mail, Palette, Layout as LayoutIcon, Save } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface EditorProps {
  config: WebsiteConfig;
  onChange: (config: WebsiteConfig) => void;
  activeTab: 'hero' | 'services' | 'reviews' | 'contact' | 'theme' | 'layout';
  setActiveTab: (tab: 'hero' | 'services' | 'reviews' | 'contact' | 'theme' | 'layout') => void;
}

export default function WebsiteConfigEditor({ config, onChange, activeTab, setActiveTab }: EditorProps) {
  const { updateThemeSettings, activeTheme } = useTheme();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const update = (path: string[], value: any) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    let current: any = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  const handleSaveTheme = () => {
    setSaveStatus('saving');
    // Map WebsiteConfig theme to Context Theme
    updateThemeSettings({
        primaryColor: config.theme.primaryColor,
        bgColor: config.theme.backgroundColor,
        textColor: config.theme.textColor,
        accentColor: config.theme.accentColor,
        fontStyle: `font-${config.theme.fontStyle}`,
        fontSizeBase: config.theme.fontSizeBase,
        fontSizeHeading: config.theme.fontSizeHeading,
    });
    
    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm h-full flex flex-col">
      <div className="flex gap-2 mb-6 border-b border-surface-variant pb-2 overflow-x-auto no-scrollbar">
        {(['hero', 'services', 'reviews', 'contact', 'theme', 'layout'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant">Hero Image URL</label>
                <div className="flex gap-2">
                    <input value={config.heroImageUrl} onChange={(e) => update(['heroImageUrl'], e.target.value)} className="flex-1 p-3 rounded-xl border border-outline-variant bg-surface-container-low text-xs" placeholder="https://..." />
                    <button className="p-3 rounded-xl bg-surface-variant text-on-surface-variant"><ImagePlus size={16} /></button>
                </div>
              </div>
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
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Color Palette</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-outline-variant rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-60">Primary</span>
                    <input type="color" value={config.theme.primaryColor} onChange={(e) => update(['theme', 'primaryColor'], e.target.value)} className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                </div>
                <div className="p-3 border border-outline-variant rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-60">Accent</span>
                    <input type="color" value={config.theme.accentColor} onChange={(e) => update(['theme', 'accentColor'], e.target.value)} className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                </div>
                <div className="p-3 border border-outline-variant rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-60">Text</span>
                    <input type="color" value={config.theme.textColor} onChange={(e) => update(['theme', 'textColor'], e.target.value)} className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                </div>
                <div className="p-3 border border-outline-variant rounded-xl bg-surface-container-low flex flex-col gap-2">
                    <span className="text-[10px] font-bold opacity-60">Background</span>
                    <input type="color" value={config.theme.backgroundColor} onChange={(e) => update(['theme', 'backgroundColor'], e.target.value)} className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Typography Style</label>
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

            <div className="space-y-4">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Font Sizes</label>
              <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-xs font-medium">Heading Size</span>
                        <span className="text-xs font-bold text-primary">{config.theme.fontSizeHeading}px</span>
                    </div>
                    <input 
                        type="range" min="24" max="64" 
                        value={config.theme.fontSizeHeading} 
                        onChange={(e) => update(['theme', 'fontSizeHeading'], parseInt(e.target.value))}
                        className="w-full accent-primary" 
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-xs font-medium">Body Size</span>
                        <span className="text-xs font-bold text-primary">{config.theme.fontSizeBase}px</span>
                    </div>
                    <input 
                        type="range" min="12" max="20" 
                        value={config.theme.fontSizeBase} 
                        onChange={(e) => update(['theme', 'fontSizeBase'], parseInt(e.target.value))}
                        className="w-full accent-primary" 
                    />
                </div>
              </div>
            </div>

            <button 
                onClick={handleSaveTheme}
                disabled={saveStatus !== 'idle'}
                className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg transition-all ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:brightness-110 active:scale-95'}`}
            >
                {saveStatus === 'saving' ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveStatus === 'saved' ? (
                    'Theme Applied!'
                ) : (
                    <>
                        <Save size={18} />
                        <span>Save Theme Customizations</span>
                    </>
                )}
            </button>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Section Visibility</label>
            <div className="space-y-2">
              {[
                { key: 'showHero', label: 'Hero Banner', icon: FileEdit },
                { key: 'showServices', label: 'Services Section', icon: LayoutIcon },
                { key: 'showReviews', label: 'Testimonials', icon: Star },
                { key: 'showContact', label: 'Contact Info', icon: Mail },
                { key: 'showGallery', label: 'Image Gallery', icon: ImagePlus },
                { key: 'showFooter', label: 'Site Footer', icon: Palette },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-outline-variant bg-surface-container-low">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant">
                            <item.icon size={16} />
                        </div>
                        <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    <button 
                        onClick={() => update(['layoutToggles', item.key], !config.layoutToggles[item.key as keyof typeof config.layoutToggles])}
                        className={`w-12 h-6 rounded-full relative transition-colors ${config.layoutToggles[item.key as keyof typeof config.layoutToggles] ? 'bg-primary' : 'bg-outline-variant'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.layoutToggles[item.key as keyof typeof config.layoutToggles] ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
