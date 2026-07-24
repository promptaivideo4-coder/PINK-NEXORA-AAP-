import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Star, MessageCircle, Check, CreditCard, Edit2, CheckCircle2 } from 'lucide-react';

export default function BookingDetailDrawer({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-center items-end md:items-center h-[100dvh] pointer-events-none">
        {/* Backdrop Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm cursor-pointer pointer-events-auto"
        />

        {/* Drawer Content */}
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="bg-white w-full md:w-[600px] h-[85vh] md:h-[750px] rounded-t-3xl md:rounded-3xl shadow-[0px_-10px_40px_rgba(0,0,0,0.1)] flex flex-col pointer-events-auto border-t md:border border-surface-container-highest mt-auto md:mb-auto relative overflow-hidden"
        >
          {/* Drag Handle (Mobile) */}
          <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-12 h-1.5 bg-surface-container-high rounded-full"></div>
          </div>

          {/* Drawer Header */}
          <div className="px-6 py-4 flex justify-between items-start border-b border-surface-container-highest bg-white sticky top-0 z-10 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 rounded-full bg-tertiary-container/10 text-tertiary text-[13px] font-medium">In Progress</span>
                <span className="text-[13px] font-medium text-on-surface-variant">ID: #BK-7829</span>
              </div>
              <h2 className="text-2xl font-semibold text-on-surface">Balayage & Styling</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-[140px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* Customer Profile Snippet */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-surface-container-highest shadow-[0px_4px_20px_rgba(0,0,0,0.02)] mb-8">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-outline-variant shrink-0">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCXYJHvTM4aDYgW5x9Q5novOM8ZmiTanq7l7E-ci8Ih7NlFeoYtT26KoQ3JJ2Xnj8ih6l-Zxna_SgZh1GcTgIkqEBmdoP61YPo6s3Yj9ZWYn6VySbN8JjLUBj0C39lI7LudSx5Nb3umY_MOO3_2rFCMkEP3QBWqF-DVAIuufrEYW7kuaL15r1pdymnIBhEfqrOIpMLs1OhqWtQJZH3xxBPtNqyaJp5a4zbJTSUE01iZnvGA2n9kauVqhRNh-z4zSBmJuUIJjeqSWY" alt="Client" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="text-[18px] font-semibold text-on-surface mb-0.5">Eleanor Vance</h3>
                <div className="flex items-center gap-3 text-[13px] font-medium text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> +1 (555) 019-2834
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    <Star className="w-3.5 h-3.5 fill-primary" /> 4.9
                  </span>
                </div>
              </div>
              <button className="w-10 h-10 rounded-full border border-surface-container-highest flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-on-surface mb-4">Appointment Status</h4>
              <div className="relative pl-4">
                {/* Vertical Line */}
                <div className="absolute left-[23px] top-4 bottom-4 w-px bg-surface-container-high"></div>
                
                {/* Timeline Item 1 */}
                <div className="flex gap-4 mb-6 relative">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 z-10 ring-4 ring-white">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </div>
                  <div className="pt-0.5 flex-1 flex justify-between items-start">
                    <div>
                      <p className="text-base font-medium text-on-surface">Checked In</p>
                      <p className="text-[13px] font-medium text-on-surface-variant">Client arrived at reception</p>
                    </div>
                    <span className="text-[13px] font-medium text-on-surface-variant">10:15 AM</span>
                  </div>
                </div>

                {/* Timeline Item 2 */}
                <div className="flex gap-4 mb-6 relative">
                  <div className="w-6 h-6 rounded-full bg-tertiary flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-[0_0_0_2px_rgba(0,82,218,0.2)]">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div className="pt-0.5 flex-1 flex justify-between items-start">
                    <div>
                      <p className="text-base font-medium text-tertiary">Service Started</p>
                      <p className="text-[13px] font-medium text-on-surface-variant">With Stylist: Marcus G.</p>
                    </div>
                    <span className="text-[13px] font-medium text-tertiary">10:30 AM</span>
                  </div>
                </div>

                {/* Timeline Item 3 */}
                <div className="flex gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 z-10 ring-4 ring-white"></div>
                  <div className="pt-0.5 flex-1 flex justify-between items-start opacity-50">
                    <div>
                      <p className="text-base font-medium text-on-surface">Completion Expected</p>
                      <p className="text-[13px] font-medium text-on-surface-variant">Estimated duration: 2h 30m</p>
                    </div>
                    <span className="text-[13px] font-medium text-on-surface-variant">1:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h4 className="text-xl font-semibold text-on-surface mb-4">Payment Summary</h4>
              <div className="bg-surface rounded-2xl p-5 border border-surface-container-highest shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-surface-container-highest">
                  <span className="text-base text-on-surface-variant">Status</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-[13px] font-medium flex items-center gap-1">
                    <CreditCard className="w-4 h-4" /> Card on File
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-base text-on-surface-variant">
                    <span>Balayage Full</span>
                    <span>₹3,500.00</span>
                  </div>
                  <div className="flex justify-between items-center text-base text-on-surface-variant">
                    <span>Olaplex Treatment</span>
                    <span>₹1,200.00</span>
                  </div>
                  <div className="flex justify-between items-center text-base text-on-surface-variant">
                    <span>GST (18%)</span>
                    <span>₹846.00</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-surface-container-highest">
                  <span className="text-[18px] font-semibold text-on-surface">Total Estimated</span>
                  <span className="text-[18px] font-semibold text-primary">₹5,546.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-surface-container-highest shadow-[0px_-10px_20px_rgba(0,0,0,0.05)] pb-[calc(1rem+env(safe-area-inset-bottom,20px))] shrink-0">
            <div className="flex gap-3">
              <button className="flex-1 h-12 rounded-[16px] bg-surface border border-surface-container-highest text-on-surface text-base font-semibold flex items-center justify-center gap-2 hover:bg-surface-container transition-colors active:scale-95">
                <Edit2 className="w-[18px] h-[18px]" /> Modify
              </button>
              <button className="flex-[2] h-12 rounded-[16px] bg-primary text-white text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 active:scale-95">
                <CheckCircle2 className="w-[18px] h-[18px]" /> Mark as Completed
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
