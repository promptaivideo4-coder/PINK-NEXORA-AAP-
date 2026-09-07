import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserPlus, ArrowRight, Check, X, AlertCircle } from 'lucide-react';
import { NavigationProps } from '../types';

import { queueAction } from '../lib/sync-manager';
import { supabase } from '../lib/supabase';
import { fetchMyShop } from '../lib/shopRepository';
import Layout from '../components/Layout';

const FORM_CACHE_KEY = 'nexora-new-appointment-form';

/** Default appointment length, used until the owner picks a real service. */
const DEFAULT_DURATION_MINUTES = 30;

type ClientOption = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  initials: string;
};

function initialsFor(name: string): string {
  const parts = name.split(' ').filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase() || '?';
}

export default function NewAppointment({ navigate }: NavigationProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [policyAgreed, setPolicyAgreed] = useState(false);

  // Real salon + customer data. The client list used to be a hard-coded demo
  // array, so the id saved onto the booking was `'1'` — a value no table
  // accepts — and the queued payload used columns that do not exist.
  const [salonId, setSalonId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [pendingClient, setPendingClient] = useState<{ name: string; phone: string } | null>(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const shop = await fetchMyShop(supabase);
        if (cancelled) return;
        if (!shop) {
          setLoadError('No shop profile found yet. Complete your shop setup before taking bookings.');
          setClientsLoading(false);
          return;
        }
        setSalonId(shop.id);

        const { data, error } = await supabase
          .from('customers')
          .select('id, full_name, first_name, last_name, phone, email')
          .eq('salon_id', shop.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
        } else {
          setClients(
            (data ?? []).map((row: any) => {
              const name =
                row.full_name ||
                [row.first_name, row.last_name].filter(Boolean).join(' ') ||
                'Unnamed';
              return {
                id: row.id,
                name,
                phone: row.phone ?? '',
                email: row.email,
                initials: initialsFor(name),
              };
            }),
          );
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Failed to load clients.');
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  // Form preservation logic
  useEffect(() => {
    const cachedForm = localStorage.getItem(FORM_CACHE_KEY);
    if (cachedForm) {
      try {
        const data = JSON.parse(cachedForm);
        setNewClientName(data.name || '');
        setNewClientPhone(data.phone || '');
        setPolicyAgreed(data.policyAgreed || false);
        setSelectedClientId(data.clientId || null);
      } catch (e) {
        console.error('Failed to parse cached form', e);
      }
    }
  }, []);

  useEffect(() => {
    const formData = {
      name: newClientName,
      phone: newClientPhone,
      policyAgreed,
      clientId: selectedClientId
    };
    localStorage.setItem(FORM_CACHE_KEY, JSON.stringify(formData));
  }, [newClientName, newClientPhone, policyAgreed, selectedClientId]);

  const clearFormCache = () => {
    localStorage.removeItem(FORM_CACHE_KEY);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonId) {
      setLoadError('Your shop profile is still loading. Please try again in a moment.');
      return;
    }

    // Enqueued with the real `customers` columns so the offline replay in
    // `offlineReplay.ts` can actually insert the row once connectivity returns.
    try {
      await queueAction('CREATE_CLIENT', {
        salon_id: salonId,
        name: newClientName,
        phone: newClientPhone,
        customer_type: 'New',
      });
    } catch (err) {
      console.error('Failed to queue client creation', err);
      setLoadError('Could not save this client offline. Please retry when you are back online.');
      return;
    }

    // Optimistic local selection while the write is still queued.
    setClients((prev) => [
      {
        id: `pending-${Date.now()}`,
        name: newClientName,
        phone: newClientPhone,
        initials: initialsFor(newClientName),
      },
      ...prev,
    ]);
    setPendingClient({ name: newClientName, phone: newClientPhone });
    setSelectedClientId('new');
    setShowNewClientForm(false);
  };

  return (
  <Layout currentScreen="new-appointment" navigate={navigate} title="New Appointment" showBack onBack={() => navigate('bookings')}>
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col pb-24 md:pb-0">
      
      <main className="w-full max-w-md mx-auto px-4 pt-6 pb-32 flex-grow">
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
                
                {loadError && (
                  <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-error/10 border border-error/20">
                    <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                    <p className="text-[12px] text-error leading-relaxed">{loadError}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {clientsLoading && (
                    <p className="text-[13px] text-on-surface-variant py-2">Loading clients…</p>
                  )}

                  {!clientsLoading && clients.length === 0 && (
                    <p className="text-[13px] text-on-surface-variant py-2">
                      No clients yet. Use “Add New Client” to create your first one.
                    </p>
                  )}

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
                        <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-semibold text-base bg-primary-container text-white">
                          {client.initials}
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
              
              <div className="p-6 bg-surface-container-low border-t border-surface-variant flex flex-col gap-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={policyAgreed}
                      onChange={(e) => setPolicyAgreed(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-outline-variant bg-surface transition-all checked:border-primary checked:bg-primary"
                    />
                    <Check className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={4} />
                  </div>
                  <span className="text-[13px] text-on-surface-variant leading-tight group-hover:text-on-surface transition-colors">
                    I have read and agree to the <button onClick={() => navigate('cancellation-refund-policy')} className="text-primary font-bold hover:underline">Cancellation & Refund Policy</button>. I understand that fees may apply for late cancellations or no-shows.
                  </span>
                </label>

                <div className="flex justify-end">
                  <button 
                    disabled={!policyAgreed || !selectedClientId || !salonId || isSaving}
                    onClick={async () => {
                      if (!policyAgreed || !salonId) return;

                      // The booking is written with the real `bookings` columns
                      // (salon_id, customer_name/phone, appointment_start/end).
                      // The old payload used `client_id` / `service_id` /
                      // `appointment_time`, none of which exist in the schema, so
                      // a queued booking could never have been inserted.
                      const contact =
                        selectedClient ??
                        (pendingClient
                          ? { name: pendingClient.name, phone: pendingClient.phone }
                          : null);

                      if (!contact) {
                        setLoadError('Select a client before continuing.');
                        return;
                      }

                      const start = new Date();
                      const end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60_000);

                      setIsSaving(true);
                      try {
                        await queueAction('CREATE_APPOINTMENT', {
                          salon_id: salonId,
                          customer_id:
                            selectedClient?.id && !selectedClient.id.startsWith('pending-')
                              ? selectedClient.id
                              : null,
                          customer_name: contact.name,
                          customer_phone: contact.phone,
                          appointment_start: start.toISOString(),
                          appointment_end: end.toISOString(),
                          status: 'pending',
                          total_paise: 0,
                          advance_paise: 0,
                        });
                      } catch (err) {
                        console.error('Failed to queue appointment', err);
                        setLoadError('Could not save this booking offline. Please retry when you are back online.');
                        setIsSaving(false);
                        return;
                      }
                      setIsSaving(false);
                      clearFormCache();
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
  </Layout>
  );
}
