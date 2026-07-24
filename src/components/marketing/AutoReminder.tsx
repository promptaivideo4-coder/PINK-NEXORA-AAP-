import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Tag, 
  MessageSquare, 
  Bell, 
  ShieldAlert, 
  Play, 
  Pause, 
  Send,
  Square, 
  Eye, 
  Search,
  CheckCircle2, 
  AlertCircle,
  History,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AutoReminderProps {
  onBack: () => void;
}

type CampaignStatus = 'Idle' | 'Running' | 'Paused' | 'Stopped';

export default function AutoReminder({ onBack }: AutoReminderProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [status, setStatus] = useState<CampaignStatus>('Idle');
  
  // Configuration States
  const [customerGroup, setCustomerGroup] = useState('Inactive Customers');
  const [selectedOffer, setSelectedOffer] = useState('Summer Festival 20% Off');
  const [frequency, setFrequency] = useState('Every 2 days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sendTime, setSendTime] = useState('10:00');
  const [maxReminders, setMaxReminders] = useState(3);
  const [selectedTemplate, setSelectedTemplate] = useState('Friendly Nudge');
  
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
  
  // Safeguard Toggles
  const [stopAfterBooking, setStopAfterBooking] = useState(true);
  const [stopAfterExpiry, setStopAfterExpiry] = useState(true);
  const [skipRecentlyContacted, setSkipRecentlyContacted] = useState(true);
  const [excludeUnsubscribed, setExcludeUnsubscribed] = useState(true);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleActivate = () => {
    setStatus('Running');
    setIsConfirmModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handlePause = () => {
    setStatus('Paused');
  };

  const handleStop = () => {
    if (confirm('Are you sure you want to stop this campaign? This will end all scheduled reminders.')) {
      setStatus('Stopped');
    }
  };

  const previewSteps = [
    { day: 'Day 1', time: '10:00 AM', message: `Hey there! 👋 Enjoy ${selectedOffer} this week! We'd love to see you back at the salon.` },
    { day: 'Day 3', time: '10:15 AM', message: `Quick reminder! 🌸 Your ${selectedOffer} is still waiting for you. Don't let your self-care slide!` },
    { day: 'Day 5', time: '09:45 AM', message: `We miss your glow! ✨ Just a few days left to use your special offer. Book your spot today!` },
    { day: 'Day 7', time: '11:00 AM', message: `Final call! ⏰ Your exclusive ${selectedOffer} expires tonight. We've saved a slot for you!` },
  ].slice(0, maxReminders + 1);

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fb] font-['Inter']">
      {/* Top App Bar */}
      <header className="bg-white sticky top-0 w-full z-50 border-b border-[#e2bdc7] shrink-0">
        <div className="flex items-center justify-between px-4 md:px-10 h-16 w-full max-w-7xl mx-auto">
          <button 
            onClick={onBack}
            className="text-[#b90064] hover:bg-[#eceef0] transition-colors active:scale-95 duration-100 p-2 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl md:text-2xl font-['Hanken_Grotesk'] font-bold text-[#b90064] truncate flex-1 text-center">Auto Reminders</h1>
          <button className="text-[#b90064] hover:bg-[#eceef0] transition-colors active:scale-95 duration-100 p-2 rounded-full flex items-center justify-center">
            <Search className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-10 space-y-6 pb-32">
        {/* Main Toggle Card */}
        <div className="bg-white border border-[#e2bdc7] rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-['Hanken_Grotesk'] font-bold text-[#191c1e]">Enable Automatic Reminders</h2>
            <p className="text-sm text-[#5a3f47] mt-1">Send scheduled follow-ups to maximize engagement.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isEnabled}
              onChange={() => setIsEnabled(!isEnabled)}
            />
            <div className="w-14 h-7 bg-[#e0e3e5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#e6007e]"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white border border-[#e2bdc7] rounded-[24px] p-8 shadow-sm space-y-8">
              <h3 className="text-xl font-['Hanken_Grotesk'] font-semibold text-[#191c1e]">Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Group */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold tracking-wider text-[#5a3f47] uppercase">Target Group</label>
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
                        className="w-full bg-[#f7f9fb] border border-[#e2bdc7] text-[#191c1e] text-sm rounded-lg focus:ring-[#b90064] focus:border-[#b90064] block p-3 outline-none appearance-none font-medium"
                      >
                        <option>Inactive Customers</option>
                        <option>VIP Members</option>
                        <option>Recent Purchasers</option>
                        <option>Individual Selection</option>
                      </select>
                      <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b90064] pointer-events-none" />
                    </div>

                    {isSelectingClients && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 p-4 bg-white border border-[#e2bdc7] rounded-xl shadow-sm"
                      >
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a3f47]/50" />
                          <input 
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-3 bg-[#f7f9fb] border border-[#e2bdc7] rounded-lg text-sm outline-none focus:border-[#b90064]"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                          {filteredClients.map(client => (
                            <button
                              key={client.id}
                              onClick={() => toggleClient(client.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                selectedClients.includes(client.id)
                                  ? 'bg-[#b90064]/5 border-[#b90064]/30 text-[#b90064]'
                                  : 'bg-white border-[#e2bdc7] text-[#5a3f47] hover:bg-[#f7f9fb]'
                              }`}
                            >
                              <div className="text-left">
                                <p className="text-sm font-bold">{client.name}</p>
                                <p className="text-xs opacity-70">{client.phone}</p>
                              </div>
                              {selectedClients.includes(client.id) && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-[#eceef0] flex justify-between items-center">
                          <p className="text-xs font-bold text-[#5a3f47]">
                            {selectedClients.length} Selected
                          </p>
                          <button 
                            onClick={() => setIsSelectingClients(false)}
                            className="text-xs font-black text-[#b90064] uppercase tracking-widest"
                          >
                            Done
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Selected Offer */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold tracking-wider text-[#5a3f47] uppercase">Selected Offer</label>
                  <select 
                    value={selectedOffer}
                    onChange={(e) => setSelectedOffer(e.target.value)}
                    className="w-full bg-[#f7f9fb] border border-[#e2bdc7] text-[#191c1e] text-sm rounded-lg focus:ring-[#b90064] focus:border-[#b90064] block p-3 outline-none appearance-none font-medium"
                  >
                    <option>Summer Festival 20% Off</option>
                    <option>Buy 1 Get 1 Free Promo</option>
                  </select>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold tracking-wider text-[#5a3f47] uppercase">Frequency</label>
                  <select 
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-[#f7f9fb] border border-[#e2bdc7] text-[#191c1e] text-sm rounded-lg focus:ring-[#b90064] focus:border-[#b90064] block p-3 outline-none appearance-none font-medium"
                  >
                    <option>Every 2 days</option>
                    <option>Every 3 days</option>
                    <option>Weekly</option>
                    <option>Custom</option>
                  </select>
                </div>

                {/* Max Reminders */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold tracking-wider text-[#5a3f47] uppercase">Max Reminders</label>
                  <input 
                    type="number"
                    max={5}
                    min={1}
                    value={maxReminders}
                    onChange={(e) => setMaxReminders(parseInt(e.target.value))}
                    className="w-full bg-[#f7f9fb] border border-[#e2bdc7] text-[#191c1e] text-sm rounded-lg focus:ring-[#b90064] focus:border-[#b90064] block p-3 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Message Template Chips */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold tracking-wider text-[#5a3f47] uppercase">Message Template</label>
                <div className="flex flex-wrap gap-2">
                  {['Friendly Nudge', 'Urgent Reminder', 'Last Chance'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTemplate(t)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
                        selectedTemplate === t 
                          ? 'bg-[#e6007e] text-white border-[#e6007e]' 
                          : 'bg-white text-[#191c1e] border-[#e2bdc7] hover:bg-[#eceef0]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safeguards */}
              <div className="space-y-4 pt-4 border-t border-[#eceef0]">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#5a3f47]">Safety Safeguards</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Stop after booking', state: stopAfterBooking, setter: setStopAfterBooking },
                    { label: 'Stop after offer expiry', state: stopAfterExpiry, setter: setStopAfterExpiry },
                    { label: 'Skip recently contacted', state: skipRecentlyContacted, setter: setSkipRecentlyContacted },
                    { label: 'Exclude unsubscribed', state: excludeUnsubscribed, setter: setExcludeUnsubscribed },
                  ].map((item) => (
                    <button 
                      key={item.label}
                      onClick={() => item.setter(!item.state)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        item.state ? 'bg-[#b90064]/5 border-[#b90064]/20' : 'bg-white border-[#e2bdc7]'
                      }`}
                    >
                      <span className={`text-xs font-bold ${item.state ? 'text-[#b90064]' : 'text-[#5a3f47]'}`}>{item.label}</span>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        item.state ? 'bg-[#b90064] border-[#b90064]' : 'border-[#e2bdc7]'
                      }`}>
                        {item.state && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Warning Card */}
            <section className="bg-[#fff9fa] rounded-2xl p-6 border border-[#e2bdc7] flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#ffd9e2] flex items-center justify-center text-[#b90064] shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-['Hanken_Grotesk'] font-bold text-[#3e001e] uppercase tracking-tight">Important Policy Notice</h4>
                <p className="text-xs font-medium text-[#5a3f47] leading-relaxed">
                  Frequent promotional messages may annoy customers. Send only to customers who have agreed to receive marketing messages.
                </p>
              </div>
            </section>
          </div>

          {/* Right Column: Timeline & Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Timeline */}
            <section className="bg-white rounded-[24px] p-8 border border-[#e2bdc7] shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-[#191c1e] uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#b90064]" /> Campaign Sequence
              </h3>
              
              <div className="space-y-0 relative">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-[#eceef0] z-0" />
                
                {[
                  { day: 'Day 1', label: 'First Contact', icon: Send, color: 'bg-[#b90064]', desc: 'Initial invitation message' },
                  { day: 'Day 3', label: 'Reminder 1', icon: Bell, color: 'bg-[#b90064]/70', desc: 'Gentle follow-up nudge' },
                  { day: 'Day 5', label: 'Reminder 2', icon: Bell, color: 'bg-[#b90064]/40', desc: 'Value-focused reminder' },
                  { day: 'Day 7', label: 'Final Call', icon: AlertCircle, color: 'bg-[#ba1a1a]', desc: 'Last chance before expiry' },
                ].map((step) => (
                  <div key={step.day} className="flex gap-6 relative z-10 pb-8 last:pb-0">
                    <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center text-white shadow-md shrink-0`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#5a3f47] uppercase tracking-widest">{step.day}</span>
                        <span className="w-1 h-1 bg-[#8e6f77] rounded-full" />
                        <span className="text-sm font-bold text-[#b90064]">{step.label}</span>
                      </div>
                      <p className="text-xs font-medium text-[#5a3f47]">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Action Card */}
            <div className="bg-white rounded-[24px] p-8 border border-[#e2bdc7] shadow-sm space-y-4">
              <button 
                onClick={() => setIsPreviewModalOpen(true)}
                className="w-full py-4 border-2 border-[#b90064] text-[#b90064] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#b90064]/5 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> Preview Sequence
              </button>
              
              {status === 'Idle' || status === 'Stopped' ? (
                <button 
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={!isEnabled}
                  className="w-full py-4 bg-[#b90064] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#b90064]/20 hover:brightness-110 transition-all disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Activate Reminder
                </button>
              ) : status === 'Running' ? (
                <div className="flex gap-4">
                  <button 
                    onClick={handlePause}
                    className="flex-1 py-4 bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                  <button 
                    onClick={handleStop}
                    className="flex-1 py-4 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4" /> Stop
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setStatus('Running')}
                  className="w-full py-4 bg-[#b90064] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#b90064]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Resume Campaign
                </button>
              )}

              <p className="text-[10px] text-center font-bold text-[#5a3f47]/60 pt-2 px-4 italic">
                Automated reminders only send between selected business hours.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Preview Sequence Modal */}
      <AnimatePresence>
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#E5DDD5] rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="bg-[#075E54] p-6 pt-10 flex items-center gap-4 shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm font-['Hanken_Grotesk']">Campaign Preview</h3>
                  <p className="text-[10px] text-emerald-100/70 font-bold uppercase tracking-widest">Automation Sequence</p>
                </div>
                <button onClick={() => setIsPreviewModalOpen(false)} className="text-white p-2">
                   <span className="text-2xl">✕</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {previewSteps.map((step, idx) => (
                  <motion.div 
                    key={step.day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-center">
                      <span className="bg-white/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-[#5a3f47] uppercase tracking-widest shadow-sm">
                        {step.day}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-[#DCF8C6] p-4 rounded-xl rounded-tr-none shadow-sm max-w-[85%] border border-emerald-900/5">
                        <p className="text-xs font-medium text-zinc-800 leading-relaxed">{step.message}</p>
                        <div className="flex justify-end items-center gap-1 mt-1">
                          <span className="text-[9px] text-emerald-800/60 font-bold">{step.time}</span>
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-[#eceef0] shrink-0">
                <button 
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-full py-4 bg-[#b90064] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-[#b90064]/20"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 rounded-[24px] bg-[#b90064]/10 flex items-center justify-center text-[#b90064] mx-auto">
                <Play className="w-8 h-8 fill-current" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-['Hanken_Grotesk'] font-bold text-[#191c1e] tracking-tight">Confirm Activation</h3>
                <p className="text-sm font-medium text-[#5a3f47] px-4">
                  Launch automated campaign targeting <span className="font-bold text-[#191c1e]">~{customerGroup === 'Individual Selection' ? selectedClients.length : '1,240'} clients</span>?
                </p>
              </div>

              <div className="space-y-3 bg-[#f7f9fb] p-4 rounded-xl border border-[#e2bdc7]">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-[#5a3f47]">Frequency</span>
                  <span className="text-[#b90064]">{frequency}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-[#5a3f47]">Max Messages</span>
                  <span className="text-[#b90064]">{maxReminders} per user</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-4 bg-[#eceef0] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#e0e3e5] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleActivate}
                  className="flex-1 py-4 bg-[#b90064] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#b90064]/20 hover:brightness-110 transition-all"
                >
                  Activate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 pointer-events-none"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold tracking-tight">Campaign is now live!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
