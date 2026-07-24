import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Mail, MapPin, Calendar, Clock, ChevronRight, Share, Check } from 'lucide-react';
import { Customer } from '../types';

interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
}

export default function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!customer) return;
    const shareText = `Customer Details:\nName: ${customer.name}\nPhone: ${customer.phone}\nEmail: ${customer.email}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Customer Contact',
          text: shareText,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      {customer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-[8px] z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-[28px] sm:rounded-[32px] shadow-2xl flex flex-col w-full max-w-[600px] max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border border-outline-variant/30 overflow-hidden shrink-0 ${customer.image ? 'bg-surface-variant' : 'bg-surface-container-highest text-[20px] font-semibold text-on-surface-variant'}`}>
                  {customer.image ? (
                    <img 
                      src={customer.image} 
                      alt={customer.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    customer.initials
                  )}
                </div>
                <div>
                  <h2 className="text-[22px] font-bold text-on-surface tracking-tight">{customer.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                      customer.type === 'VIP' ? 'bg-primary-container/10 text-primary-container' :
                      customer.type === 'Gold Member' ? 'bg-[#0052da]/10 text-[#0052da]' :
                      customer.type === 'New' ? 'bg-secondary-container/10 text-secondary-container' :
                      'bg-surface-variant text-on-surface-variant'
                    }`}>
                      {customer.type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
                  title="Share Contact"
                >
                  {copied ? <Check className="w-5 h-5 text-[#10B981]" /> : <Share className="w-5 h-5" />}
                </button>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              
              {/* Quick Actions */}
              <div className="flex gap-4">
                <button className="flex-1 bg-primary-container/10 text-primary-container py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-container/20 transition-colors">
                  <Calendar className="w-5 h-5" />
                  Book Now
                </button>
                <button className="flex-1 bg-surface-container py-3 rounded-xl font-semibold text-on-surface flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors">
                  <Mail className="w-5 h-5" />
                  Message
                </button>
              </div>

              {/* Contact Info */}
              <section>
                <h3 className="text-[16px] font-semibold text-on-surface mb-4">Contact Information</h3>
                <div className="bg-white rounded-[20px] border border-outline-variant/30 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 p-4 border-b border-outline-variant/30">
                    <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium text-on-surface">{customer.phone}</div>
                      <div className="text-[13px] text-on-surface-variant">Mobile</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 border-b border-outline-variant/30">
                    <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium text-on-surface">{customer.email}</div>
                      <div className="text-[13px] text-on-surface-variant">Email</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium text-on-surface leading-tight">{customer.address}</div>
                      <div className="text-[13px] text-on-surface-variant mt-0.5">Address</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Notes */}
              {customer.notes && (
                <section>
                  <h3 className="text-[16px] font-semibold text-on-surface mb-4">Client Notes</h3>
                  <div className="bg-[#FFF5F8] p-5 rounded-[20px] border border-primary-container/20">
                    <p className="text-[14px] text-on-surface leading-relaxed">{customer.notes}</p>
                  </div>
                </section>
              )}

              {/* History */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-semibold text-on-surface">Appointment History</h3>
                  <button className="text-[14px] font-semibold text-primary hover:opacity-80 transition-opacity">View All</button>
                </div>
                
                {customer.history.length > 0 ? (
                  <div className="space-y-3">
                    {customer.history.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-white rounded-[20px] border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container flex flex-col items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase">{record.date.split(' ')[0]}</span>
                            <span className="text-[16px] font-bold text-on-surface leading-none mt-0.5">{record.date.split(' ')[1].replace(',', '')}</span>
                          </div>
                          <div>
                            <div className="text-[15px] font-semibold text-on-surface">{record.service}</div>
                            <div className="flex items-center gap-1.5 mt-1 text-[13px] text-on-surface-variant">
                              <Clock className="w-3.5 h-3.5" />
                              with {record.provider}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[15px] font-semibold text-on-surface">{record.price}</span>
                          <ChevronRight className="w-5 h-5 text-on-surface-variant opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-surface-container-lowest border border-outline-variant/30 rounded-[20px]">
                    <p className="text-[14px] text-on-surface-variant">No appointment history yet.</p>
                  </div>
                )}
              </section>
              
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
