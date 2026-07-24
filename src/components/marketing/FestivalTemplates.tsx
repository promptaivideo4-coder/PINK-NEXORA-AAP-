import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  SlidersHorizontal, 
  Eye, 
  X, 
  Star,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FestivalTemplate } from '../../types';

interface FestivalTemplatesProps {
  onBack: () => void;
  onUseTemplate: (template: FestivalTemplate) => void;
}

const festivalTemplates: FestivalTemplate[] = [
  {
    id: 'diwali',
    title: 'Diwali',
    tagline: 'Festival of Lights Special',
    description: 'Celebrate with a glow. Book any facial or styling service and receive a festive discount.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDux4R9jR4030BdijxFeVtA4arVWGgHWhC2lZHdtngGYfwTr0K1z2ixOHFcNcNGU3nX-3dCgUjoxh0O6dd2kPzlC8duTKG2d4ljPui1pXv9ecmAV5R1PuhaYem2e3N1yW0glk1sIFgcDauQckrz9UmNdPIQexDh1qpzk2PlTt8OmK3sIKuGI-3qemQVnsAh84NrASUF79KHReJPpIvFyztRA4hqu38PS2zFXnX93WNsZHSvjxLRSd7qiYjUQg5UIsbPy1thz3FxoRk',
    category: 'Upcoming',
    seasons: ['Winter'],
    discount: '25% Off',
    isPremium: true,
    suggestedMessage: 'Celebrate the Festival of Lights with a radiant glow. Book any facial or styling service this week and receive a special festive discount to shine your brightest!',
    targetServices: ['Facials', 'Hair Styling', 'Makeup']
  },
  {
    id: 'valentines',
    title: 'Valentine\'s Day',
    tagline: 'Love Yourself First',
    description: 'Treat yourself or a loved one to our signature couple\'s spa package. Romantic atmosphere guaranteed.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHO7z6J_uG_ti48vxeQsyLd-K9Mr3_Po_m-SonWJ3fx81ZvdMqG8bEKFRlNY9ggU8rDxMKY_M4LEgwV7hKEYKOpiefuxY2FWOMxaEzXP2yUvL8p7bMyrgPI2Khh58zjIgrDwp_4AqClVoXfKaPkRPcoDuLO2jpKp4E8Kc8GOc-ELJIK2DHzBbJ1sal4nJdJiTrL6TfV_k_ucqMkQxYRwriHoSa672Iwzou4Y8Nr3Ir6oYKeeoRY6LXDU_fpTVoJjQ6GneMSipuel0',
    category: 'Seasonal',
    seasons: ['Spring'],
    discount: 'Couple Package',
    suggestedMessage: 'Treat yourself or a loved one to our signature couple\'s spa package. Romantic atmosphere guaranteed. Book your Valentine\'s pampering session today!',
    targetServices: ['Spa', 'Massage', 'Couples Packages']
  },
  {
    id: 'holi',
    title: 'Holi',
    tagline: 'Colors of Joy Package',
    description: 'Pre and post-Holi hair and skin care routines to protect and restore your natural vibrance.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBj4cbnqSTNIGRNHs5MrZ25OuJOf1GWvFNcpabHp-jUWdvZcCLCRMw0mIRL1qEotp3UnUMh3wfG1qGAnlBUSQHjqU_0_9uV8w4ip2jH4WTCck4iLqenCPDAyjcI86fF0g5_64w_qdbAaZkXtEskbjGOfZP3RPbabm9VJKNUM2Y5oa_flSlbThjFGD2Ui3Ff7ybF1pvWlVcZ47nM2pYTmM2hxWK-dO4GCEFF5U8Uj5DPkBohUoITrWpt-yhg3cwrkLdd0n-fRNc3CRc',
    category: 'Religious',
    seasons: ['Spring'],
    discount: '15% Off Packages',
    suggestedMessage: 'Pre and post-Holi hair and skin care routines to protect and restore your natural vibrance. Don\'t let the colors dull your glow!',
    targetServices: ['Hair Care', 'Skin Care', 'Restorative Facials']
  }
];

export default function FestivalTemplates({ onBack, onUseTemplate }: FestivalTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FestivalTemplate | null>(null);

  const filteredTemplates = festivalTemplates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSeason = !selectedSeason || t.seasons.includes(selectedSeason as any);
    return matchesSearch && matchesCategory && matchesSeason;
  });

  return (
    <div className="p-5 space-y-6 pb-28 max-w-6xl mx-auto w-full">
      {/* Submodule Header */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 rounded-full text-primary hover:bg-primary/5 border border-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-primary tracking-tight">Festival Templates</h2>
            <p className="text-xs text-on-surface-variant font-medium">Stunning celebration banners ready for your salon social media</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary w-5 h-5" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates (Diwali, Holi, Christmas...)"
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body text-sm text-on-surface placeholder:text-on-surface-variant/60 shadow-xs"
        />
      </div>

      {/* Filters */}
      <section className="space-y-5">
        <div>
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant mb-3">Categories</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {['All', 'Upcoming', 'Religious', 'Seasonal', 'Global'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-6 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 border cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-primary-container text-white border-primary' 
                    : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Season Filters */}
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
          <span className="shrink-0 flex items-center justify-center p-2 text-on-surface-variant bg-surface-container rounded-lg">
            <SlidersHorizontal className="w-4 h-4" />
          </span>
          {['Spring', 'Summer', 'Monsoon', 'Winter'].map((season) => (
            <button
              key={season}
              onClick={() => setSelectedSeason(selectedSeason === season ? null : season)}
              className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                selectedSeason === season 
                  ? 'bg-tertiary text-white border-tertiary' 
                  : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {season}
            </button>
          ))}
        </div>
      </section>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTemplates.map((template) => (
          <article 
            key={template.id}
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-[28px] overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300"
          >
            <div className="h-52 w-full relative group">
              <img 
                src={template.imageUrl} 
                alt={template.title}
                className="w-full h-full object-cover transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              {template.isPremium && (
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant flex items-center gap-1.5 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-[10px] font-extrabold text-on-surface uppercase tracking-wider">Premium</span>
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col flex-grow space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-bold text-primary tracking-tight">{template.title}</h3>
                  <p className="text-[11px] font-bold text-on-surface leading-tight">"{template.tagline}"</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/20">
                  {template.category}
                </span>
              </div>

              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed italic">
                {template.description}
              </p>

              <div className="mt-auto space-y-5 pt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-on-surface-variant">Discount Offer:</span>
                  <span className="text-on-surface bg-primary-fixed text-on-primary-fixed px-3 py-1.5 rounded-lg border border-primary/10">
                    {template.discount}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setPreviewTemplate(template)}
                    className="flex-1 py-3.5 px-4 border-2 border-tertiary text-tertiary rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-tertiary/5 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button 
                    onClick={() => onUseTemplate(template)}
                    className="flex-1 py-3.5 px-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Use <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewTemplate(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface rounded-[32px] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="relative h-72 w-full shrink-0">
                <img 
                  src={previewTemplate.imageUrl} 
                  alt={previewTemplate.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                <button 
                  onClick={() => setPreviewTemplate(null)}
                  className="absolute top-6 right-6 p-2.5 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-full text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[10px] font-black uppercase tracking-widest border border-tertiary/20">
                    {previewTemplate.category}
                  </span>
                  <h2 className="text-3xl font-black text-primary tracking-tight">{previewTemplate.title} Special</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Suggested Message</h4>
                    <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant/30">
                      <p className="text-sm font-medium text-on-surface italic leading-relaxed">
                        "{previewTemplate.suggestedMessage}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30 space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Target Services</h4>
                      <p className="text-xs font-bold text-on-surface leading-tight">
                        {previewTemplate.targetServices.join(', ')}
                      </p>
                    </div>
                    <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20 space-y-2 text-right">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/70 text-right">Offer Code</h4>
                      <p className="text-2xl font-black text-primary">
                        {previewTemplate.discount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-outline-variant/30 bg-surface flex gap-4 shrink-0">
                <button 
                  onClick={() => setPreviewTemplate(null)}
                  className="flex-1 py-4 px-4 border border-outline-variant text-on-surface-variant rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-surface-container transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => onUseTemplate(previewTemplate)}
                  className="flex-[2] py-4 px-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Use Template <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
