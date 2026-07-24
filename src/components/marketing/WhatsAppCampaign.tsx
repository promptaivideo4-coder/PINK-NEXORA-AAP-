import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Send, 
  Users, 
  MessageSquare, 
  ExternalLink, 
  ChevronDown, 
  CheckCircle2, 
  Smartphone,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsAppCampaignProps {
  onBack: () => void;
}

export default function WhatsAppCampaign({ onBack }: WhatsAppCampaignProps) {
  const [campaignName, setCampaignName] = useState('');
  const [selectedOffer, setSelectedOffer] = useState('20% Off All Services');
  const [customerGroup, setCustomerGroup] = useState('All opted-in');
  const [template, setTemplate] = useState('New Offer');
  const [couponCode, setCouponCode] = useState('SUMMER20');
  const [includeBooking, setIncludeBooking] = useState(true);
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [isSending, setIsSending] = useState(false);
  const [isSelectingClients, setIsSelectingClients] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const sampleClients = [
    { id: '1', name: 'Ananya Sharma', phone: '+91 98765 43210' },
    { id: '2', name: 'Priya Kapoor', phone: '+91 98765 87654' },
    { id: '3', name: 'Rohan Verma', phone: '+91 98765 32109' },
    { id: '4', name: 'Amit Patel', phone: '+91 98765 65432' },
  ];

  const filteredClients = sampleClients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const toggleClient = (id: string) => {
    setSelectedClients(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const templates = ['New Offer', 'Festival Offer', 'We miss you'];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full gap-8 p-5 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/30">
        <button 
          onClick={onBack}
          className="p-2.5 rounded-full hover:bg-surface-container transition-colors text-primary border border-primary/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight">WhatsApp Campaign</h2>
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Connect directly with your clients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <section className="bg-white rounded-[32px] p-8 border border-outline-variant/30 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-on-surface tracking-tight">Configuration</h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Campaign Name</label>
                <input 
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Summer Sale 2026"
                  className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-bold text-on-surface"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Select Offer</label>
                <div className="relative">
                  <select 
                    value={selectedOffer}
                    onChange={(e) => setSelectedOffer(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-bold text-on-surface appearance-none"
                  >
                    <option>20% Off All Services</option>
                    <option>Buy 1 Get 1 Free</option>
                    <option>Free Consultation</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Target Group</label>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <select 
                      value={customerGroup}
                      onChange={(e) => {
                        setCustomerGroup(e.target.value);
                        if (e.target.value === 'Individual Selection') {
                          setIsSelectingClients(true);
                        } else {
                          setIsSelectingClients(false);
                        }
                      }}
                      className="w-full h-12 pl-4 pr-10 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-bold text-on-surface appearance-none"
                    >
                      <option>All opted-in</option>
                      <option>New Clients</option>
                      <option>VIP Members</option>
                      <option>Inactive (60+ days)</option>
                      <option>Individual Selection</option>
                    </select>
                    <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                  </div>

                  {isSelectingClients && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
                        <input 
                          type="text"
                          placeholder="Search clients..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-9 pl-9 pr-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {filteredClients.map(client => (
                          <button
                            key={client.id}
                            onClick={() => toggleClient(client.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              selectedClients.includes(client.id)
                                ? 'bg-primary/5 border-primary/30 text-primary'
                                : 'bg-transparent border-transparent text-on-surface-variant hover:bg-surface-container'
                            }`}
                          >
                            <div className="text-left">
                              <p className="text-xs font-bold">{client.name}</p>
                              <p className="text-[10px] opacity-70">{client.phone}</p>
                            </div>
                            {selectedClients.includes(client.id) && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-center">
                        <p className="text-[10px] font-bold text-on-surface-variant">
                          {selectedClients.length} Selected
                        </p>
                        <button 
                          onClick={() => setIsSelectingClients(false)}
                          className="text-[10px] font-black text-primary uppercase tracking-widest"
                        >
                          Confirm Selection
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Template Style</label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTemplate(t)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        template === t 
                          ? 'bg-primary text-white border-primary shadow-md' 
                          : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Coupon Code</label>
                  <input 
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm font-black text-primary uppercase"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <button 
                      onClick={() => setIncludeBooking(!includeBooking)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        includeBooking ? 'bg-primary border-primary' : 'border-outline-variant/50'
                      }`}
                    >
                      {includeBooking && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">Include Link</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Estimates */}
          <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Estimated Reach</p>
              <h4 className="text-3xl font-black text-primary">
                ~{customerGroup === 'Individual Selection' ? selectedClients.length : '1,240'}
              </h4>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Deliverable</p>
                <p className="text-sm font-black text-on-surface">1,180</p>
              </div>
              <div className="text-right border-l border-outline-variant/30 pl-4">
                <p className="text-[10px] font-bold text-rose-500 uppercase">Opted-out</p>
                <p className="text-sm font-black text-on-surface">60</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:sticky lg:top-8 space-y-6">
          <div className="relative bg-white rounded-[40px] border-[12px] border-zinc-900 shadow-2xl overflow-hidden aspect-[9/18.5] max-w-[320px] mx-auto group">
            {/* Phone Interface */}
            <div className="absolute top-0 w-full h-14 bg-[#075E54] flex items-center px-6 gap-3 z-10">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] font-black text-white leading-none">Nexora Salon</p>
                <p className="text-[9px] text-emerald-100/70 font-bold uppercase tracking-widest mt-0.5">Online</p>
              </div>
            </div>

            {/* WhatsApp Chat Background */}
            <div className="absolute inset-0 bg-[#E5DDD5] opacity-40 z-0">
               {/* Pattern Overlay Mockup */}
               <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            </div>

            {/* Chat Content */}
            <div className="relative z-10 p-6 pt-20 flex flex-col items-end gap-3 h-full">
              <div className="bg-[#DCF8C6] p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[90%] relative border border-emerald-900/5">
                <p className="text-[13px] text-zinc-800 leading-relaxed font-medium">
                  Hey there! 👋 Enjoy <span className="font-bold text-emerald-800">{selectedOffer}</span> this week to celebrate summer!
                </p>
                <p className="text-[13px] font-black text-emerald-900 mt-2">Use code: {couponCode}</p>
                {includeBooking && (
                  <p className="text-[13px] text-blue-600 underline mt-2 font-bold flex items-center gap-1">
                    Book now: nexora.app/summer <ExternalLink className="w-3 h-3" />
                  </p>
                )}
                
                {/* Image Preview */}
                <div className="mt-3 rounded-xl overflow-hidden border border-emerald-900/10 shadow-sm bg-white">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCJhQINO2dYoc9E1gZAHjGfntuyxm-W7ju6VAJq765U7ZpFJ8iiRrv1EPN4zLKq6JXGsElp3THxsdPK3G6qM4C3Yd2ZItyXfoLPgD-c-j8vg2uvXB5Mt0WzYhEWK8dQE6mBryi5LkzQ3QkPvRm4acFy72bJLnPT9JbpC1q_a5-UmkSVoHeSU68xQ_qLzdONREKIvNgHJvuxX5HbYk9y4oAQVmuVRhr1tEL9BAVXjT6kmgyk2vPrc2G9NXilAg51pfHve2gOt_BIhI" 
                    className="w-full h-32 object-cover"
                    alt="Offer Preview"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-2 px-3">
                    <p className="text-[10px] font-black text-zinc-800 truncate uppercase tracking-tight">{selectedOffer} Special</p>
                  </div>
                </div>

                <div className="flex justify-end gap-1 mt-1">
                   <span className="text-[9px] text-emerald-800/60 font-bold">10:42 AM</span>
                   <CheckCircle2 className="w-2.5 h-2.5 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-5 bg-zinc-900 rounded-full z-20" />
          </div>

          {/* Schedule Controls */}
          <div className="bg-white rounded-[32px] p-6 border border-outline-variant/30 space-y-4">
            <h3 className="text-xs font-black text-on-surface uppercase tracking-widest ml-1">Scheduling</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setScheduleType('now')}
                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  scheduleType === 'now' ? 'bg-primary text-white shadow-lg' : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                }`}
              >
                Send Now
              </button>
              <button 
                onClick={() => setScheduleType('later')}
                className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  scheduleType === 'later' ? 'bg-primary text-white shadow-lg' : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                }`}
              >
                Schedule
              </button>
            </div>
            <div className="flex items-center gap-2 px-2 text-on-surface-variant/60">
              <Info className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold">This is a simulation. No real messages are sent.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-outline-variant/30 p-4 pb-8 z-50 flex items-center justify-center">
        <div className="w-full max-w-4xl flex gap-4">
          <button className="flex-1 py-4 bg-transparent border-2 border-tertiary text-tertiary rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-tertiary/5 transition-all active:scale-95 flex items-center justify-center gap-2">
            Save Draft
          </button>
          <button 
            onClick={() => setIsSending(true)}
            disabled={isSending}
            className="flex-[2] py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>Processing...</>
            ) : (
              <>Send Campaign <Send className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
