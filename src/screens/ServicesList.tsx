import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { Search, Clock, Plus, X, RotateCcw, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../utils/currency';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  image: string;
}

const initialServices: ServiceItem[] = [
  {
    id: '1',
    name: 'Balayage & Styling',
    description: 'Full balayage treatment with toner, root smudge, and signature blowout styling.',
    duration: 120,
    price: 3500,
    category: 'Hair',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    name: 'Bridal Makeup Package',
    description: 'Complete bridal makeup including HD makeup, hair styling, and draping.',
    duration: 180,
    price: 15000,
    category: 'Makeup',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    name: 'De-tan & Bleach',
    description: 'O3+ De-tan pack with gentle skin bleach for face and neck.',
    duration: 45,
    price: 800,
    category: 'Skin & Spa',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '4',
    name: 'Eyebrow Threading',
    description: 'Precision eyebrow shaping and upper lip threading.',
    duration: 15,
    price: 100,
    category: 'Threading',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '5',
    name: 'Bridal Mehendi / Heena',
    description: 'Intricate traditional bridal mehendi design for hands and feet.',
    duration: 240,
    price: 5000,
    category: 'Mehendi',
    image: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '6',
    name: 'L\'Oréal Hair Spa',
    description: 'Deep conditioning L\'Oréal hair spa with scalp massage and steam.',
    duration: 60,
    price: 1200,
    category: 'Hair',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800'
  },
];

export default function ServicesList({ navigate }: NavigationProps) {
  const [services, setServices] = React.useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('nexora_services');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse nexora_services', e);
      }
    }
    return initialServices;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  React.useEffect(() => {
    localStorage.setItem('nexora_services', JSON.stringify(services));
  }, [services]);

  const categories = ['All', 'Hair', 'Makeup', 'Skin & Spa', 'Threading', 'Mehendi'];

  const filteredServices = services.filter((srv) => {
    const matchesCat = activeCategory === 'All' || srv.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleClearAll = () => {
    setServices([]);
  };

  const handleRestore = () => {
    setServices(initialServices);
  };

  return (
    <Layout currentScreen="services" navigate={navigate} title="Salon Elite" showSettings>
      <div className="px-5 md:px-10 py-8 max-w-[1200px] mx-auto w-full relative min-h-[calc(100vh-120px)] flex flex-col pb-32">
        
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
            {services.length > 0 ? (
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-full border border-outline-variant/40 text-xs font-semibold text-on-surface-variant hover:text-error hover:border-error/40 transition-colors"
              >
                Simulate Empty Menu
              </button>
            ) : (
              <button
                onClick={handleRestore}
                className="px-3.5 py-2 rounded-full border border-primary/30 text-xs font-semibold text-primary hover:bg-primary-fixed/20 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Demo Menu</span>
              </button>
            )}

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
                <div className="h-48 w-full relative overflow-hidden bg-surface-container-low">
                  <img 
                    src={service.image} 
                    alt={service.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-3 right-3 px-3 py-1 bg-white/80 backdrop-blur-md text-[11px] font-bold text-on-surface rounded-full border border-white/60 shadow-xs">
                    {service.category}
                  </span>
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
                    <div className="text-[20px] font-extrabold text-primary">{formatPrice(service.price)}</div>
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

                {/* Secondary Action */}
                <button 
                  onClick={handleRestore}
                  className="mt-4 px-6 py-2 text-primary font-bold text-xs hover:bg-secondary-fixed/30 rounded-full transition-colors active:scale-95 duration-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Import existing menu</span>
                </button>
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

