import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { Search, Calendar, CreditCard, IdCard, UserCog, TrendingUp, ChevronRight, MessageCircle, Mail, PlusCircle, Star, X, Ticket, Camera, CheckCircle2, Sparkles, UploadCloud, Loader2, Check, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SUBJECT_CATEGORIES: Record<string, string> = {
  "Unable to Receive Booking": "Bookings",
  "Booking Not Confirmed": "Bookings",
  "Booking Automatically Cancelled": "Bookings",
  "Appointment Issue": "Bookings",
  "Customer Not Showing": "Bookings",
  "Online Booking Issue": "Bookings",
  "Payment Not Received": "Payments",
  "Wallet Balance Issue": "Payments",
  "Settlement Delay": "Payments",
  "Invoice Issue": "Payments",
  "Tax Calculation Issue": "Payments",
  "Offer Not Working": "Marketing",
  "Festival Poster Issue": "Marketing",
  "WhatsApp Campaign Issue": "Marketing",
  "AI Marketing Issue": "Marketing",
  "Service Not Appearing": "Services",
  "Unable to Add Service": "Services",
  "Service Price Issue": "Services",
  "Inventory Issue": "Services",
  "Barcode Scanner Issue": "Services",
  "Staff Profile Issue": "Staff",
  "Staff Schedule Issue": "Staff",
  "Plan Upgrade Problem": "Subscription",
  "Subscription Issue": "Subscription",
  "App Crash": "Technical",
  "App Slow Performance": "Technical",
  "Sync Issue": "Technical",
  "Bug Report": "Technical",
  "Report Error": "Technical",
  "Analytics Incorrect": "Technical",
  "Device Compatibility Issue": "Technical",
  "Login Problem": "Technical",
  "OTP Verification Issue": "Technical",
  "Notification Not Received": "Technical",
  "Data Missing": "Technical",
  "Website Builder Issue": "Website",
  "QR Code Issue": "Website",
  "Feature Request": "General",
  "Other": "General",
  "Customer Management Issue": "General",
  "Printer Issue": "Technical",
};

const SUBJECTS = Object.keys(SUBJECT_CATEGORIES);

const SUBJECT_TEMPLATES: Record<string, string> = {};
SUBJECTS.forEach((subject) => {
  let template = `Issue:\n${subject}\n\n`;
  const cat = SUBJECT_CATEGORIES[subject];
  if (cat === "Bookings") {
    template += `When did it start?\nToday\n\nFrequency\nAlways\n\nAffected Service\nNot Selected\n\nExpected Result\nBookings should appear normally.\n\nActual Result\nNo booking is received.\n\nAdditional Information\n____________________`;
  } else if (cat === "Payments") {
    template += `Transaction Date\nToday\n\nAmount\n________\n\nPayment Method\nUPI/Card/Cash\n\nExpected Result\nPayment should be reflected.\n\nActual Result\nBalance not updated.\n\nAdditional Notes\n_________________`;
  } else if (subject === "App Crash" || subject === "App Slow Performance") {
    template += `When does it happen?\n• Login\n• Booking\n• Marketing\n• Reports\n\nFrequency\n• Every Time\n• Sometimes\n• Once\n\nAdditional Details\n_________________`;
  } else if (cat === "Staff") {
    template += `Affected Staff\n_________\n\nExpected Schedule\n_________\n\nActual Behaviour\n_________\n\nAdditional Notes\n_________`;
  } else {
    template += `Details:\nFacing issue while processing request.\n\nUrgency: High\nAction Required: Please review and assist.\n\nAdditional Information\n____________________`;
  }
  
  template += `\n\n--- Auto Device Information ---\nApp Version: 2.4.1\nDevice: Auto Detect (Web)\nOS/Browser: ${navigator.userAgent.substring(0, 30)}...\nResolution: ${window.innerWidth}x${window.innerHeight}\nTime: ${new Date().toLocaleString()}\nTimezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\nLanguage: ${navigator.language}\nCurrent Screen: Help Center`;
  
  SUBJECT_TEMPLATES[subject] = template;
});

const getSuggestions = (subject: string) => {
  const cat = SUBJECT_CATEGORIES[subject];
  if (cat === "Bookings") return ["Check internet connection", "Verify booking settings", "Refresh booking list", "Restart app"];
  if (subject === "App Crash" || subject === "App Slow Performance" || cat === "Technical") return ["Clear app cache", "Update app to latest version", "Restart device", "Check network"];
  if (cat === "Payments") return ["Check bank statement", "Verify payment gateway status", "Wait 15 mins for sync"];
  if (cat === "Marketing") return ["Check active subscription", "Verify WhatsApp number", "Check image sizes"];
  return [];
};

export default function HelpCenter({ navigate }: NavigationProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState(SUBJECTS[0]);
  const [ticketDescription, setTicketDescription] = useState(SUBJECT_TEMPLATES[SUBJECTS[0]]);
  const [hasEditedDescription, setHasEditedDescription] = useState(false);
  const [myTickets, setMyTickets] = useState<{id: string, subject: string, category: string, status: string, date: string, attachments?: {name: string, preview?: string}[]}[]>([]);
  const [suggestionsResolved, setSuggestionsResolved] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "uploading" | "creating" | "done">("idle");
  const [attachments, setAttachments] = useState<{name: string, preview?: string, file?: File, isScreenshot?: boolean}[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const currentCategory = SUBJECT_CATEGORIES[ticketSubject];
  const currentSuggestions = getSuggestions(ticketSubject);

  const handleCreateTicket = () => {
    setTicketSubject(SUBJECTS[0]);
    setTicketDescription(SUBJECT_TEMPLATES[SUBJECTS[0]]);
    setHasEditedDescription(false);
    setSuggestionsResolved(false);
    setSubmitStatus("idle");
    setAttachments([]);
    setIsTicketModalOpen(true);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubject = e.target.value;
    setTicketSubject(newSubject);
    if (!hasEditedDescription) {
      setTicketDescription(SUBJECT_TEMPLATES[newSubject]);
    }
    setSuggestionsResolved(false);
  };

  const handleFiles = (files: File[]) => {
    const validFiles: {name: string, preview?: string, file?: File}[] = [];
    let hasError = false;

    files.forEach(file => {
      if (attachments.length + validFiles.length >= 10) {
        hasError = true;
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        hasError = true;
        return;
      }
      const isImage = file.type.startsWith('image/');
      validFiles.push({
        name: file.name,
        preview: isImage ? URL.createObjectURL(file) : undefined,
        file
      });
    });

    if (hasError) {
      setToastMessage("Some files were rejected (max 10 files, up to 10MB each).");
      setTimeout(() => setToastMessage(null), 3000);
    }
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleAutoScreenshot = () => {
    if (attachments.length >= 10) {
      setToastMessage("Maximum 10 attachments allowed.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    
    // Create a mock canvas
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Mock Screen Capture", canvas.width / 2, canvas.height / 2);
    }
    
    const preview = canvas.toDataURL("image/png");
    
    setAttachments([...attachments, {
      name: "current-screen-capture.png",
      preview,
      isScreenshot: true
    }]);
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDescription) return;
    
    setSubmitStatus("submitting");
    await new Promise(r => setTimeout(r, 600));
    setSubmitStatus("uploading");
    await new Promise(r => setTimeout(r, 600));
    setSubmitStatus("creating");
    await new Promise(r => setTimeout(r, 600));
    setSubmitStatus("done");
    
    const ticketId = `#NX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Add to tickets list
    setMyTickets(prev => [{
      id: ticketId,
      subject: ticketSubject,
      category: currentCategory,
      status: 'Open',
      date: new Date().toLocaleDateString(),
      attachments: attachments.map(a => ({ name: a.name, preview: a.preview }))
    }, ...prev]);

    setTimeout(() => {
      setIsTicketModalOpen(false);
      setSubmitStatus("idle");
      setToastMessage(`Ticket ${ticketId} created successfully.`);
      setTimeout(() => setToastMessage(null), 4000);
    }, 1500);
  };

  return (
    <Layout currentScreen="help-center" navigate={navigate} title="Nexora" showSettings={true} transparentTopBar={true}>
      <div className="px-4 py-6 max-w-md mx-auto flex flex-col gap-8 w-full relative">
        
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Search Section */}
        <section className="flex flex-col items-center text-center gap-4 pt-8 pb-4">
          <h2 className="text-[28px] md:text-[32px] font-bold text-on-background tracking-tight">How can we help?</h2>
          <div className="w-full max-w-2xl relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for articles, tutorials, or guides..." 
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-surface-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-all shadow-[0px_4px_20px_rgba(0,0,0,0.03)] text-base text-on-background placeholder:text-on-surface-variant/60 outline-none"
            />
          </div>
        </section>

        {/* My Tickets (Visible only when tickets exist) */}
        {myTickets.length > 0 && (
          <section className="bg-white/70 backdrop-blur-[20px] border border-[#E8E8E8] rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-6">
            <h3 className="text-xl font-semibold text-on-background mb-4 flex items-center gap-2">
              <Ticket className="text-primary-container w-6 h-6" />
              My Support Tickets
            </h3>
            <div className="flex flex-col gap-3">
              {myTickets.map((ticket, i) => (
                <div key={i} className="p-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-on-surface">{ticket.subject}</span>
                    <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">{ticket.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-on-surface-variant mt-1">
                    <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5" /> {ticket.id} • {ticket.category}</span>
                    <span>{ticket.date}</span>
                  </div>
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {ticket.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-surface border border-outline-variant/40 rounded-lg px-2 py-1 text-[10px] font-medium text-on-surface-variant max-w-[150px]">
                          <FileImage className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section>
          <h3 className="text-xl font-semibold text-on-background mb-4">Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: Calendar, label: 'Bookings', target: 'bookings' },
              { icon: CreditCard, label: 'Payments', target: 'wallet' },
              { icon: Star, label: 'Reviews', target: 'reviews' },
              { icon: IdCard, label: 'Staff', target: 'profile' },
              { icon: UserCog, label: 'Settings', target: 'settings' }
            ].map((cat, i) => (
              <button 
                key={i} 
                onClick={() => cat.target && navigate(cat.target as any)}
                className="bg-white/70 backdrop-blur-[20px] border border-[#E8E8E8] rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center hover:-translate-y-1 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-primary-fixed/30 text-primary flex items-center justify-center group-hover:bg-primary-container group-hover:text-white transition-colors">
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="text-[16px] font-semibold text-on-background">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Popular Articles */}
          <section className="md:col-span-2 bg-white/70 backdrop-blur-[20px] border border-[#E8E8E8] rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-6">
            <h3 className="text-xl font-semibold text-on-background mb-4 flex items-center gap-2">
              <TrendingUp className="text-primary-container w-6 h-6" />
              Trending Articles
            </h3>
            <div className="flex flex-col">
              {[
                "How to set up flexible staff schedules",
                "Integrating third-party payment gateways",
                "Managing cancellation policies and fees",
                "Exporting client data for marketing"
              ].map((article, i, arr) => (
                <a key={i} href="#" className={`py-4 flex items-center justify-between group hover:pl-2 transition-all ${i !== arr.length - 1 ? 'border-b border-surface-variant' : ''}`}>
                  <span className="text-base text-on-surface group-hover:text-primary transition-colors">{article}</span>
                  <ChevronRight className="text-on-surface-variant group-hover:text-primary transition-colors w-5 h-5" />
                </a>
              ))}
            </div>
          </section>

          {/* Quick Contact */}
          <section className="md:col-span-1 bg-white border border-[#E8E8E8] rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-on-background mb-2">Quick Contact</h3>
            
            <a 
              href="https://wa.me/1234567890" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/20 rounded-xl p-4 flex items-center gap-3 transition-colors text-left group cursor-pointer"
            >
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-[16px] font-semibold">WhatsApp Support</span>
                <span className="text-[13px] font-medium text-[#128C7E]/70">Fastest response time</span>
              </div>
            </a>
            
            <a 
              href="mailto:support@nexora.app"
              className="w-full bg-surface hover:bg-surface-container border border-surface-variant rounded-xl p-4 flex items-center gap-3 transition-colors text-left group cursor-pointer"
            >
              <Mail className="w-6 h-6 text-on-surface-variant group-hover:text-on-background transition-colors" />
              <div className="flex flex-col">
                <span className="text-[16px] font-semibold text-on-background">Email Us</span>
                <span className="text-[13px] font-medium text-on-surface-variant">support@nexora.app</span>
              </div>
            </a>
            
            <div className="w-full h-px bg-surface-variant my-2"></div>
            
            <button 
              onClick={handleCreateTicket}
              className="w-full bg-primary-container text-white rounded-xl p-4 text-[16px] font-semibold flex justify-center items-center gap-2 hover:bg-primary transition-colors shadow-md shadow-primary-container/20 active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              Create Ticket
            </button>
          </section>
        </div>

        {/* Ticket Creation Modal */}
        <AnimatePresence>
          {isTicketModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-center pb-4 border-b border-outline-variant/40 mb-4">
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <PlusCircle className="w-6 h-6 text-primary" />
                    Create Ticket
                  </h3>
                  <button onClick={() => setIsTicketModalOpen(false)} className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {submitStatus === "idle" ? (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    
                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Subject / Issue Type</label>
                      <select 
                        value={ticketSubject}
                        onChange={handleSubjectChange}
                        className="w-full bg-surface border border-outline-variant/60 text-on-surface text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer"
                      >
                        {SUBJECTS.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">Category (Auto-assigned)</label>
                      <input 
                        type="text"
                        readOnly
                        value={currentCategory}
                        className="w-full bg-surface-container-low border border-transparent text-on-surface-variant text-sm rounded-xl px-4 py-3 outline-none cursor-not-allowed"
                      />
                    </div>

                    {/* AI Suggestions Box */}
                    {currentSuggestions.length > 0 && !suggestionsResolved && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> AI Smart Suggestions: Possible Fixes</h4>
                        <ul className="text-xs text-on-surface-variant space-y-1 mb-4">
                          {currentSuggestions.map((s,i) => <li key={i} className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {s}</li>)}
                        </ul>
                        <p className="text-xs font-semibold text-on-surface mb-2">Did this solve your problem?</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setIsTicketModalOpen(false)} className="flex-1 py-2 bg-surface text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/10 transition-colors cursor-pointer">YES, Cancel Ticket</button>
                          <button type="button" onClick={() => setSuggestionsResolved(true)} className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:brightness-110 transition-colors cursor-pointer">NO, Continue</button>
                        </div>
                      </div>
                    )}

                    {/* Description and Attachments (hidden if suggestions not resolved but exist) */}
                    {(!currentSuggestions.length || suggestionsResolved) && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Description</label>
                          <textarea 
                            required
                            value={ticketDescription}
                            onChange={(e) => {
                              setTicketDescription(e.target.value);
                              setHasEditedDescription(true);
                            }}
                            rows={8}
                            className="w-full bg-surface border border-outline-variant/60 text-on-surface text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none resize-none font-mono text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">Attachments & Proof (Optional)</label>
                          <div 
                            className="w-full border-2 border-dashed border-outline-variant/60 rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                          >
                            <UploadCloud className="w-6 h-6 text-on-surface-variant" />
                            <span className="text-xs font-medium text-on-surface-variant">Tap or drop to upload images or PDF (Max 10MB)</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*,.pdf" 
                              multiple 
                              ref={fileInputRef}
                              onChange={handleFileChange}
                            />
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <button type="button" onClick={handleAutoScreenshot} className="text-xs flex items-center gap-1.5 text-primary hover:underline font-semibold cursor-pointer">
                              <Camera className="w-4 h-4" /> Attach Current Screen
                            </button>
                          </div>
                          
                          {attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-2 bg-surface-container-low p-1.5 pr-3 rounded-lg border border-outline-variant/40 max-w-[200px]">
                                  {att.preview ? (
                                    <img src={att.preview} alt="preview" className="w-8 h-8 object-cover rounded bg-surface" />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-surface flex items-center justify-center">
                                      <FileImage className="w-4 h-4 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex flex-col overflow-hidden">
                                    <span className="text-[10px] font-medium text-on-surface truncate">{att.name}</span>
                                    {att.isScreenshot && <span className="text-[8px] text-primary uppercase font-bold">Screen Capture</span>}
                                  </div>
                                  <button type="button" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-on-surface-variant hover:text-error ml-auto cursor-pointer shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setIsTicketModalOpen(false)}
                            className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-115 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            Submit Ticket
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    {submitStatus === "done" ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mb-2"
                      >
                        <Check className="w-8 h-8" />
                      </motion.div>
                    ) : (
                      <Loader2 className="w-12 h-12 text-primary animate-spin mb-2" />
                    )}
                    
                    <h3 className="text-lg font-bold text-on-surface">
                      {submitStatus === "submitting" && "Submitting..."}
                      {submitStatus === "uploading" && "Uploading Images..."}
                      {submitStatus === "creating" && "Creating Ticket..."}
                      {submitStatus === "done" && "Ticket Created Successfully"}
                    </h3>
                    
                    {submitStatus === "done" && (
                      <p className="text-sm text-on-surface-variant">
                        Our support team will contact you within 24 hours.
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
