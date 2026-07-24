import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Layout as LayoutIcon, 
  Palette, 
  Type as TypeIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  QrCode, 
  Save, 
  Download, 
  Share2, 
  Maximize2, 
  Sparkles,
  Check,
  Scissors,
  Eye,
  Megaphone,
  Tag,
  Diamond,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PosterCreatorProps {
  onBack: () => void;
}

export default function PosterCreator({ onBack }: PosterCreatorProps) {
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [headline, setHeadline] = useState('Glow Up This Summer!');
  const [discount, setDiscount] = useState('20% OFF');
  const [validity, setValidity] = useState('Aug 31st');
  const [cta, setCta] = useState('Book Now: nexora.com/glow');
  const [canvasSize, setCanvasSize] = useState('1:1');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [showQR, setShowQR] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('festival');
  const [saveToast, setSaveToast] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const templates = [
    { id: 'festival', label: 'Festival', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMSC0cgkvLXcZSxfxW1igbvty08JlzweKw6jvViKixs-qxfxLAUfsKc-_s38Q5xhpsV2vbOxIaQXp5zEv3676kubSV1LU4p2wKFofuxfNkp1v0jn5WAowcxUSPXJKf0lgOAwXrf7EpgHSTbz-0y4xQ6ZVtdbEF2HQmPhUsEul4-F_KpacY7xVJMQGD6tIgavp0w68bm2Wt3s910qUSAfbD9TY4xktUt5CxZChczaOnHJcA4tEbNdb4uHLHTt4nkvPeGX7hbkPcDI8' },
    { id: 'minimal', label: 'Minimalist', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIMEs_TQQayMd2YzeSa8TjRUZOvShPZBoK_YqfCNS5UgLyUXC9bii7P3i7r78jntAsjXbzRqXtJhHIWxO_jqEzVCZ1sypyAvTZ_9vk1Xj9YVPddxR-9KObhFZZMku0nfJll9kpP7nNNAdqXsZPUgufyFxPowGGM311AVgJ4hKJ-SDsGy_hq_4TxcCqRfctJZMk0BkH6AAK31We071CKRBUtrnX0BMR6EEkA82VvypvHEJFUW_leb2DJ60ITnzpzache-_iWAbrNkM' },
    { id: 'bold', label: 'Modern Bold', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAD0Xnvt7fGHHH_DAtZG-pAdJS8KMhMNV4MspQJQNYu6_ueHbJe6T08vseL-PMf5jO_feTFgNzflWLC3GvhRhVLeKUDdE3lIV5Ayd9zPNtxAXj258SuI-nO4sIFdqq_OLwJcocHv16XT4xNVHz7A_7ae4ii9lYBPnPk5kEEmj-lCKJIed6i7DELekBEwMv0FdgN_1hivL6mwjbmtA6uOw2CaWi64U-DSwN2LtmP48l1Dk4JY368NMAbbbNP2m5KH3EZshCtu5Qz_7Y' },
  ];

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full gap-6 p-5 pb-28">
      {/* Header Bar with Toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3 self-start">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-primary border border-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-primary tracking-tight">Poster Creator</h2>
            <p className="text-[10px] text-on-surface-variant font-extrabold uppercase tracking-widest">Design salon masterpieces</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-surface-container p-1 rounded-full border border-outline-variant/30 w-full md:w-80 shadow-inner">
          <button 
            onClick={() => setView('edit')}
            className={`flex-1 py-2.5 px-4 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              view === 'edit' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" /> Edit Details
          </button>
          <button 
            onClick={() => setView('preview')}
            className={`flex-1 py-2.5 px-4 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              view === 'preview' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Editor Controls */}
        <div className={`${view === 'edit' ? 'block' : 'hidden lg:block'} lg:col-span-5 space-y-8`}>
          {/* Template Selection */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant flex items-center justify-between">
              Select Template
              <span className="text-[10px] font-bold text-primary/60">Swipe to browse</span>
            </h3>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x">
              {templates.map((temp) => (
                <button
                  key={temp.id}
                  onClick={() => setSelectedTemplate(temp.id)}
                  className={`flex-none w-32 aspect-[3/4] rounded-2xl border-2 transition-all snap-start overflow-hidden relative cursor-pointer ${
                    selectedTemplate === temp.id ? 'border-primary shadow-lg scale-102' : 'border-outline-variant/30 opacity-70 grayscale-[20%]'
                  }`}
                >
                  <img src={temp.image} alt={temp.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{temp.label}</span>
                  </div>
                  {selectedTemplate === temp.id && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Form Fields */}
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-sm space-y-6">
            <h3 className="text-base font-black text-primary tracking-tight">Poster Content</h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Campaign Title</label>
                <div className="relative">
                  <Megaphone className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary w-4 h-4" />
                  <input 
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-surface border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-bold text-on-surface"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Discount Offer</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary w-4 h-4" />
                  <input 
                    type="text"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-surface border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-black text-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Campaign Description</label>
                <textarea 
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  rows={3}
                  className="w-full p-4 bg-surface border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-medium text-on-surface resize-none leading-relaxed"
                />
              </div>

              {/* QR Code Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-on-surface">Store QR Code</p>
                    <p className="text-[10px] font-bold text-on-surface-variant">Links to your booking page</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowQR(!showQR)}
                  className={`w-12 h-6.5 rounded-full relative transition-all ${showQR ? 'bg-primary' : 'bg-surface-variant'}`}
                >
                  <motion.div 
                    animate={{ x: showQR ? 24 : 4 }}
                    className="absolute top-1 w-4.5 h-4.5 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className={`${view === 'preview' ? 'block' : 'hidden lg:block'} lg:col-span-7 flex flex-col items-center gap-8`}>
          <div className="relative w-full aspect-square max-w-[450px] mx-auto bg-white rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col justify-between p-10 group">
            {/* Poster Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                className="w-full h-full object-cover grayscale-[10%] brightness-[0.85] group-hover:scale-105 transition-transform duration-1000" 
                src={
                  selectedTemplate === 'festival' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlorzn2GuXLuHq29mA37sCltf2jIGrYBo4mYd0zo6aPmD87d25OMzP1z1KUWpZtIWomFOmnOlOB20V6JaQmere15Z-HxWOMTaazdOvO0jO5OOLKEnnUtgNKPqKFCKFtgAg00onVmjLkmKr8HT3l9kKlEmWwTVRdWOIgZIBV6VQsG3Gpt-TdP2z0YJWMBs21xLFGaMWLAHoR6R756ASuIEPzQbeljrimGLwCeiO8Nmqb8OaNGelMw83pEpMj5VgoZtkXT8HRtyJHsg' :
                  selectedTemplate === 'minimal' ? 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop' :
                  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1200&auto=format&fit=crop'
                }
                alt="Poster BG"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/20 to-black/30 backdrop-blur-[1px]"></div>
            </div>

            {/* Live Badge */}
            <div className="absolute top-6 right-6 bg-rose-600 text-white font-black text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center shadow-lg z-20">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-2 animate-pulse shadow-[0_0_8px_white]"></span>
              Live Canvas
            </div>

            {/* Poster Content Foreground */}
            <div className={`relative z-10 h-full w-full p-10 flex flex-col justify-between items-center text-center`}>
              <div className="mt-6 space-y-2">
                <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-2xl mx-auto mb-6">
                  <Diamond className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <motion.h3 
                  key={headline}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-black text-5xl text-on-background uppercase leading-tight tracking-tighter drop-shadow-xl"
                >
                  {headline}
                </motion.h3>
              </div>

              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-primary/95 text-white p-8 rounded-[32px] shadow-2xl rotate-[-3deg] transform hover:rotate-0 transition-transform text-center mx-auto w-full max-w-[85%] border-4 border-white"
              >
                <p className="text-4xl font-black tracking-tight">{discount}</p>
                <p className="text-[12px] font-black uppercase tracking-[0.25em] mt-2 opacity-90">Store Exclusive</p>
              </motion.div>

              <div className="w-full flex items-end justify-between mt-auto pt-10 border-t border-on-background/10">
                <div className="flex flex-col gap-2 w-2/3 text-left">
                  <p className="text-sm font-bold text-on-surface-variant leading-relaxed">
                    {validity}
                  </p>
                  <p className="text-[11px] font-black text-primary mt-1 flex items-center uppercase tracking-wider">
                    <Scissors className="w-4 h-4 mr-2" /> Powered by Nexora AI
                  </p>
                </div>
                {showQR && (
                  <div className="w-20 h-20 bg-white p-2 rounded-2xl shadow-xl border border-on-background/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <QrCode className="w-full h-full text-on-background" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full max-w-[450px]">
            <button 
              onClick={handleSave}
              className="flex-1 h-14 rounded-2xl border-2 border-primary text-primary font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-primary/5 transition-all active:scale-95 cursor-pointer bg-transparent"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Share Masterpiece
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-surface rounded-t-[40px] p-8 pb-14 shadow-2xl flex flex-col items-center"
            >
              <div className="w-14 h-1.5 bg-outline-variant/40 rounded-full mb-8" />
              <h3 className="text-2xl font-black text-on-surface mb-8">Share Poster</h3>
              
              <div className="grid grid-cols-4 gap-6 w-full mb-10">
                {[
                  { id: 'insta', label: 'Instagram', color: 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600', icon: Share2 },
                  { id: 'fb', label: 'Facebook', color: 'bg-blue-600', icon: Share2 },
                  { id: 'wa', label: 'WhatsApp', color: 'bg-emerald-500', icon: MessageSquare },
                  { id: 'link', label: 'Copy Link', color: 'bg-surface-container-high text-on-surface', icon: Share2 },
                ].map((app) => {
                  const Icon = app.icon;
                  return (
                    <button key={app.id} className="flex flex-col items-center gap-2 group">
                      <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 ${app.color}`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{app.label}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="w-full py-4 rounded-2xl bg-surface-container-high text-on-surface font-black uppercase tracking-widest text-[11px] hover:bg-surface-variant transition-all cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[100] bg-surface-container-highest border border-outline-variant/30 text-on-surface px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 pointer-events-none"
          >
            <div className="bg-primary/10 text-primary rounded-full p-1.5">
              <Check className="w-5 h-5" />
            </div>
            <span className="text-sm font-black tracking-tight">Poster saved successfully.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
