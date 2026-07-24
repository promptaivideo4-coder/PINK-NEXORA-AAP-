import React from 'react';
import { motion } from 'motion/react';
import { X, ChevronDown, ArrowRight } from 'lucide-react';
import { NavigationProps } from '../types';

export default function RegistrationStepper({ navigate }: NavigationProps) {
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('theme-selection');
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-[20px] border-b border-outline-variant/30 flex justify-between items-center px-5 h-16 shadow-sm">
        <h1 className="text-[28px] font-bold tracking-tight text-primary">Nexora</h1>
        <button 
          onClick={() => navigate('welcome')}
          className="hover:opacity-80 transition-opacity active:scale-95 duration-200 text-on-surface-variant p-2 -mr-2"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 mt-16 px-5 pt-8 pb-[120px] max-w-[600px] mx-auto w-full flex flex-col">
        {/* Stepper Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 relative">
             {/* Progress Bar Background */}
             <div className="absolute top-4 left-0 w-full h-px bg-surface-variant -z-10 px-4"></div>
             
             {/* Step 1 */}
            <div className="flex flex-col items-center bg-background px-1">
              <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center text-[13px] font-medium mb-1 shadow-sm">1</div>
              <span className="text-[13px] font-semibold text-primary">Info</span>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center bg-background px-1 opacity-50">
              <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-[13px] font-medium mb-1">2</div>
              <span className="text-[13px] font-medium text-on-surface-variant">Location</span>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center bg-background px-1 opacity-50">
              <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-[13px] font-medium mb-1">3</div>
              <span className="text-[13px] font-medium text-on-surface-variant">Services</span>
            </div>
            
            {/* Step 4 */}
            <div className="flex flex-col items-center bg-background px-1 opacity-50">
              <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-[13px] font-medium mb-1">4</div>
              <span className="text-[13px] font-medium text-on-surface-variant">Finish</span>
            </div>
          </div>
          
          {/* Thick Progress Bar below stepper for extra clarity */}
          <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden mt-4">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: '25%' }}
               transition={{ duration: 0.5, ease: "easeOut" }}
               className="h-full bg-primary-container rounded-full"
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-on-background mb-2">Business Information</h2>
          <p className="text-base text-on-surface-variant">Let's start by getting to know your business. This helps us set up your profile perfectly.</p>
        </div>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-[18px] p-6 border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex-1"
        >
          <form onSubmit={handleNext} id="reg-form" className="space-y-4">
            <div>
              <label htmlFor="business_name" className="block text-[13px] font-medium text-on-surface-variant mb-1">Business Name</label>
              <input 
                type="text" 
                id="business_name" 
                required
                placeholder="e.g. Bella Salon" 
                className="w-full bg-surface-container-low border border-surface-variant rounded-[14px] px-4 py-3 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-fixed-dim transition-all placeholder:text-on-surface-variant/50 outline-none"
              />
            </div>
            
            <div>
              <label htmlFor="business_category" className="block text-[13px] font-medium text-on-surface-variant mb-1">Business Category</label>
              <div className="relative">
                <select 
                  id="business_category" 
                  defaultValue=""
                  required
                  className="w-full bg-surface-container-low border border-surface-variant rounded-[14px] px-4 py-3 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-fixed-dim transition-all appearance-none pr-10 outline-none"
                >
                  <option value="" disabled>Select a category</option>
                  <option value="hair">Hair Salon</option>
                  <option value="nails">Nail Studio</option>
                  <option value="spa">Spa & Wellness</option>
                  <option value="barber">Barbershop</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none w-5 h-5" />
              </div>
            </div>
            
            <div>
              <label htmlFor="contact_number" className="block text-[13px] font-medium text-on-surface-variant mb-1">Primary Contact Number</label>
              <input 
                type="tel" 
                id="contact_number" 
                required
                placeholder="(555) 123-4567" 
                className="w-full bg-surface-container-low border border-surface-variant rounded-[14px] px-4 py-3 text-base text-on-background focus:border-primary-container focus:ring-4 focus:ring-primary-fixed-dim transition-all placeholder:text-on-surface-variant/50 outline-none"
              />
            </div>
          </form>
        </motion.div>

        {/* Sticky Bottom Action */}
        <div className="fixed bottom-0 left-0 w-full p-5 pb-[env(safe-area-inset-bottom,20px)] bg-surface/90 backdrop-blur-[20px] border-t border-surface-variant shadow-[0px_-4px_20px_rgba(0,0,0,0.03)] z-40">
          <div className="max-w-[600px] mx-auto w-full">
            <button 
              type="submit"
              form="reg-form"
              className="w-full bg-primary-container text-white rounded-[16px] py-4 text-base font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
            >
              Next Step
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
