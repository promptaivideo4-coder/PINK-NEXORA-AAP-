import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { Search, Clock, Plus, X, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../utils/currency';
import { supabase } from '../lib/supabase';
import { fetchMyShop, listServices, deleteService, ShopService } from '../lib/shopRepository';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  image: string;
  isActive: boolean;
}

export default function ServicesList({ navigate }: NavigationProps) {
  // Live data from the shared Supabase project — no localStorage, no demo menu.
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const load = useCallback(async () => {
    try {
      const shop = await fetchMyShop(supabase);
      if (!shop) { setServices([]); return; }
      const rows = await listServices(supabase, shop.id);
      setServices(rows.map((r: ShopService) => ({
        id: r.id,
        name: r.name,
        category: 'General',
        description: r.description ?? '',
        duration: r.durationMinutes,
        price: r.pricePaise / 100,
        image: '',
        isActive: r.isActive,
      })));
    } catch (err) {
      console.warn('Services load failed:', err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await deleteService(supabase, id);
      await load();
    } catch (err: any) {
      alert(err?.message || 'Could not delete service.');
    }
  };

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((srv) => {
    const matchesCat = activeCategory === 'All' || srv.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <Layout currentScreen="services" navigate={navigate} title="Salon Elite" showSettings>
      <div className="px-4 py-6 max-w-md mx-auto w-full relative min-h-[calc(100vh-120px)] flex flex-col pb-32">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              Salon Services Menu
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Configure packages, durations, and pricing for online bookings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('new-service')}
              className="bg-primary-container hover:bg-primary text-on-primary-container px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-primary-container/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Service</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        {services.length > 0 && (
          <div className="mb-8">
            <div className="relative mb-4 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-5 h-5" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..." 
                className="w-full h-12 pl-12 pr-10 rounded-[14px] bg-surface-container-low border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all text-base text-on-surface placeholder:text-on-surface-variant/60 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-primary-container text-white shadow-[0px_4px_12px_rgba(230,0,126,0.2)]'
                      : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Service Cards Grid or Empty State */}
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div 
                key={service.id}
                onClick={() => {
                  localStorage.setItem('nexora_selected_service_id', service.id);
                  navigate('service-detail');
                }} 
                className="bg-white/70 backdrop-blur-[20px] border border-[#e8e8e8] rounded-[18px] overflow-hidden flex flex-col group hover:shadow-[0px_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="h-36 w-full relative overflow-hidden bg-gradient-to-br from-primary-fixed/30 to-secondary-fixed/20 flex items-center justify-center">
                  <span className="absolute top-3 right-3 px-3 py-1 bg-white/80 backdrop-blur-md text-[11px] font-bold text-on-surface rounded-full border border-white/60 shadow-xs">
                    {service.category}
                  </span>
                  {!service.isActive && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500/90 text-white text-[10px] font-bold rounded-full">Inactive</span>
                  )}
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="text-[18px] font-bold text-on-surface mb-1">{service.name}</h3>
                    <p className="text-[13px] font-medium text-on-surface-variant/80 mb-4 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/30">
                    <div className="flex items-center text-on-surface-variant text-[13px] font-semibold gap-1">
                      <Clock className="w-4 h-4 text-primary" /> {service.duration} min
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[20px] font-extrabold text-primary">{formatPrice(service.price)}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleDelete(service.id); }}
                        className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                        aria-label="Delete service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* NO SERVICES OFFERED - EXACT SPECIFICATION FROM DESIGN */
          <div className="flex-1 flex flex-col items-center justify-center py-12 relative overflow-hidden">
            {/* Background Radial Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              <div className="w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full bg-primary-container/5 blur-[120px] absolute -top-1/4 -right-1/4" />
              <div className="w-[60vw] h-[60vw] max-w-[400px] max-h-[400px] rounded-full bg-secondary-fixed/20 blur-[100px] absolute -bottom-1/4 -left-1/4" />
            </div>

            {/* Empty Panel Container */}
            <div className="w-full max-w-md relative z-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-8 md:p-12 flex flex-col items-center text-center border border-[#E8E8E8]/50 shadow-[0px_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0px_20px_60px_rgba(0,0,0,0.06)] transition-all duration-500"
              >
                {/* Floating Illustration */}
                <div className="w-48 h-48 mb-6 relative animate-bounce [animation-duration:5s]">
                  <div className="absolute inset-0 bg-primary-container/10 rounded-full blur-2xl" />
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-ZyyUtLPgznHYckAHsV-WazQwIAYRb5OnWcM0tHYKJZdHnkHQhoYd54tAQT2y5lNIKIDWaayJfnqwo1A8dcjULP1onrUqnN4DOAh56eTYeESRdFHfcP0416_ereQVX5mw6CUQ0xjOb0sRS9g4jJu8Ptp7IFjwk50lf7Ovloo5aJeZUcKUGZNvw2gIqV74w4Uze2d3Y-MrB-mrwVYnCrwAWObr-hxphjbspVqfSCazm2c7wWLRNsxZ0QK059jqTVgxnG5hFgpr0T0" 
                    alt="Salon tools illustration" 
                    className="w-full h-full object-contain drop-shadow-2xl relative z-10" 
                  />
                </div>

                {/* Text Content */}
                <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-3 tracking-tight">
                  No Services Offered
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mb-8 max-w-[280px] leading-relaxed">
                  Define your salon services to start accepting bookings and building your client base.
                </p>

                {/* Primary CTA */}
                <button 
                  onClick={() => navigate('new-service')}
                  className="w-full sm:w-auto px-8 py-4 bg-primary-container text-on-primary-container rounded-[16px] font-bold text-sm shadow-[0px_8px_24px_rgba(230,0,126,0.25)] hover:shadow-[0px_12px_32px_rgba(230,0,126,0.35)] hover:bg-[#D40074] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Create Service</span>
                </button>

                {loading && (
                  <p className="mt-4 text-[13px] text-on-surface-variant">Loading services…</p>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* FAB */}
        <button 
          onClick={() => navigate('new-service')}
          className="fixed bottom-24 right-5 md:right-10 w-14 h-14 bg-primary-container text-white rounded-full shadow-[0px_8px_24px_rgba(230,0,126,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        >
          <Plus className="w-8 h-8" />
        </button>

      </div>
    </Layout>
  );
}

