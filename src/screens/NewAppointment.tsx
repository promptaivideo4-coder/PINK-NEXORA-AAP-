import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserPlus, ArrowRight, Check, X } from 'lucide-react';
import TopBar from '../components/TopBar';
import { NavigationProps } from '../types';

import { queueAction } from '../lib/sync-manager';

export default function NewAppointment({ navigate }: NavigationProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const clients = [
    { id: '1', name: 'Ananya Sharma', phone: '+91 98765 43210', initials: 'AS', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqt3CvTQkv49W6kHRrxM8D6AD17xgJJnd1-PXzDvJFntf1vIaWGTBKDrq4178iNlR1oY-i9KXr2tHcivAtU_LIeNeh-KMCH3EZlIXEdAhmNzXCBaYI3yJaOTbEfoBZXI81GOO5xsBP7XZQId6TO1sBrbxZwueWGLrnoWFZxMC9CzTb_Y4VM-2zZsw4FfkeRJbgsPACItgF7as3vVyL-6UYwktjydrHV2UbjorbI4MEGVK9uN8jU3Pk47TTQUpmu0-7pOrkrrVRBZo' },
    { id: '2', name: 'Rohan Verma', email: 'rohan.verma@example.com', initials: 'RV' }
  ];

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Queue for sync
    try {
      await queueAction('CREATE_CLIENT', {
        name: newClientName,
        phone: newClientPhone,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to queue client creation', err);
    }

    // Simulate adding client locally
    setSelectedClientId('new');
    setShowNewClientForm(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col pb-24 md:pb-0">
      <TopBar showBack onBack={() => navigate('bookings')} navigate={navigate} title="New Appointment" />
      
      <main className="w-full max-w-[1200px] mx-auto px-5 md:px-10 pt-8 pb-32 flex-grow">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Side: Stepper Progress */}
          <div className="w-full md:w-1/3 md:sticky md:top-24 flex flex-col gap-4">
            <div className="bg-white/70 backdrop-blur-[20px] border border-surface-variant p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
              <h2 className="text-xl font-semibold text-on-surface mb-6">New Appointment</h2>
              
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-px bg-surface-variant z-0"></div>
                
                <div className="flex flex-col gap-6 relative z-10">
                  {/* Step 1: Active */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
                      <span className="text-[13px] font-medium text-white">1</span>
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-on-surface">Client Details</h3>
                      <p className="text-[13px] font-medium text-primary mt-1">In Progress</p>
                    </div>
                  </div>
                  
                  {/* Step 2: Pending */}
                  <div className="flex items-start gap-4 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-surface-variant flex items-center justify-center shrink-0">
                      <span className="text-[13px] font-medium text-on-surface-variant">2</span>
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-on-surface">Services</h3>
                    </div>
                  </div>
                  
                  {/* Step 3: Pending */}
                  <div className="flex items-start gap-4 opacity-50">
                     <div className="w-8 h-8 rounded-full bg-surface-container-high border border-surface-variant flex items-center justify-center shrink-0">
                      <span className="text-[13px] font-medium text-on-surface-variant">3</span>
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-on-surface">Staff & Time</h3>
                    </div>
                  </div>
                  
                  {/* Step 4: Pending */}
                  <div className="flex items-start gap-4 opacity-50">
                     <div className="w-8 h-8 rounded-full bg-surface-container-high border border-surface-variant flex items-center justify-center shrink-0">
                      <span className="text-[13px] font-medium text-on-surface-variant">4</span>
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-on-surface">Confirm</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Placeholder */}
            <div className="bg-white/70 backdrop-blur-[20px] border border-surface-variant p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] opacity-50">
              <h3 className="text-[18px] font-semibold text-on-surface mb-4">Summary</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-surface-variant pb-2">
                  <span className="text-[13px] font-medium text-on-surface-variant">Total</span>
                  <span className="text-base font-semibold text-on-surface">--</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <div className="bg-white/70 backdrop-blur-[20px] border border-surface-variant rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="p-6 border-b border-surface-variant">
                <h2 className="text-xl font-semibold text-on-surface">Select Client</h2>
                <p className="text-[13px] font-medium text-on-surface-variant mt-1">Search existing clients or add a new one.</p>
              </div>
              
              <div className="p-6">
                <div className="relative w-full mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search by name, phone, or email..." 
                    className="w-full pl-12 pr-4 py-3 bg-surface rounded-[14px] border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-fixed/20 transition-all text-base text-on-surface placeholder:text-on-surface-variant outline-none shadow-sm"
                  />
                </div>
                
                <button 
                  onClick={() => setShowNewClientForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 mb-6 bg-surface border border-dashed border-outline-variant rounded-xl text-primary hover:bg-primary-fixed/10 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="text-base font-medium">Add New Client</span>
                </button>
                
                <h3 className="text-[13px] font-medium text-on-surface-variant mb-4 uppercase tracking-wider">Recent Clients</h3>
                
                <div className="flex flex-col gap-3">
                  {clients.map(client => (
                    <div 
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                        selectedClientId === client.id 
                          ? 'border-primary bg-primary-fixed/10' 
                          : 'border-surface-variant hover:border-primary hover:bg-primary-fixed/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-semibold text-base ${client.image ? 'bg-surface-container-high' : 'bg-primary-container text-white'}`}>
                          {client.image ? (
                            <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
                          ) : (
                            client.initials
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-on-surface">{client.name}</h4>
                          <p className="text-[13px] font-medium text-on-surface-variant">{client.phone || client.email}</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedClientId === client.id ? 'bg-primary border-primary' : 'border-outline-variant'
                      }`}>
                        {selectedClientId === client.id && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                  ))}

                  {selectedClientId === 'new' && (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-primary bg-primary-fixed/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shrink-0 text-base font-semibold uppercase">
                          {newClientName.split(' ').map(n => n[0]).join('') || 'NC'}
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-on-surface">{newClientName || 'New Client'}</h4>
                          <p className="text-[13px] font-medium text-on-surface-variant">{newClientPhone || 'Just added'}</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 bg-surface-container-low border-t border-surface-variant flex justify-end">
                <button 
                   onClick={async () => {
                     // In a real app, we'd have all the data from previous steps
                     try {
                        await queueAction('CREATE_APPOINTMENT', {
                          client_id: selectedClientId,
                          service_id: 'haircut-1', // Mock service
                          staff_id: 'staff-1', // Mock staff
                          appointment_time: new Date().toISOString(),
                          status: 'pending'
                        });
                     } catch (err) {
                        console.error('Failed to queue appointment', err);
                     }
                     navigate('bookings');
                   }}
                   className="px-6 py-3 bg-primary text-white rounded-xl text-base font-semibold hover:opacity-90 transition-opacity active:scale-95 shadow-md flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showNewClientForm && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewClientForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-8 shadow-2xl space-y-6 overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-on-surface">Add New Client</h3>
                <button onClick={() => setShowNewClientForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface">
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface ml-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Rahul Kapoor"
                    className="w-full h-12 px-4 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface ml-1">Phone Number</label>
                  <input 
                    type="tel"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full h-12 px-4 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full h-12 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:brightness-110 transition-all mt-4"
                >
                  Save & Select Client
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
