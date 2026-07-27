import React from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { Search, Calendar, CreditCard, IdCard, UserCog, TrendingUp, ChevronRight, MessageCircle, Mail, PlusCircle, Star } from 'lucide-react';

export default function HelpCenter({ navigate }: NavigationProps) {
  return (
    <Layout currentScreen="help-center" navigate={navigate} title="Nexora" showSettings={true} transparentTopBar={true}>
      <div className="px-4 py-6 max-w-md mx-auto flex flex-col gap-8 w-full">
        
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
            
            <button className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/20 rounded-xl p-4 flex items-center gap-3 transition-colors text-left group">
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-[16px] font-semibold">WhatsApp Support</span>
                <span className="text-[13px] font-medium text-[#128C7E]/70">Fastest response time</span>
              </div>
            </button>
            
            <button className="w-full bg-surface hover:bg-surface-container border border-surface-variant rounded-xl p-4 flex items-center gap-3 transition-colors text-left group">
              <Mail className="w-6 h-6 text-on-surface-variant group-hover:text-on-background transition-colors" />
              <div className="flex flex-col">
                <span className="text-[16px] font-semibold text-on-background">Email Us</span>
                <span className="text-[13px] font-medium text-on-surface-variant">support@nexora.app</span>
              </div>
            </button>
            
            <div className="w-full h-px bg-surface-variant my-2"></div>
            
            <button className="w-full bg-primary-container text-white rounded-xl p-4 text-[16px] font-semibold flex justify-center items-center gap-2 hover:bg-primary transition-colors shadow-md shadow-primary-container/20 active:scale-[0.98]">
              <PlusCircle className="w-5 h-5" />
              Create Ticket
            </button>
          </section>
        </div>

      </div>
    </Layout>
  );
}
