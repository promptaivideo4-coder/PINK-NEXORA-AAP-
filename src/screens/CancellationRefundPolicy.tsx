import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, Clock, RefreshCcw, AlertCircle } from 'lucide-react';
import { NavigationProps } from '../types';

export default function CancellationRefundPolicy({ navigate }: NavigationProps) {
  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-4 bg-surface border-b border-outline-variant/40 sticky top-0 z-10">
        <button 
          onClick={() => navigate('settings')}
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-on-surface">Cancellation & Refund Policy</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-8 pb-12"
        >
          {/* Introduction */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-xl font-bold">Our Commitment</h2>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              At Nexora, we value your time and our stylists' expertise. Our cancellation policy is designed to ensure fair availability for all our clients while protecting our team's schedule.
            </p>
          </section>

          {/* Cancellation Rules */}
          <section className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/40 space-y-4">
            <div className="flex items-center gap-3 text-on-surface">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Cancellation Windows</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-on-surface-variant">
                  <span className="font-bold text-on-surface">24 Hours or More:</span> No cancellation fee. You can reschedule or cancel directly through the app.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                <p className="text-xs text-on-surface-variant">
                  <span className="font-bold text-on-surface">Less than 24 Hours:</span> A cancellation fee of 50% of the service price may be applied.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 shrink-0" />
                <p className="text-xs text-on-surface-variant">
                  <span className="font-bold text-on-surface">No-Show:</span> Clients who do not show up for their appointment without notice will be charged 100% of the service fee.
                </p>
              </li>
            </ul>
          </section>

          {/* Refund Rules */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-on-surface">
              <RefreshCcw className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Refund Policy</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Refunds are processed to the original payment method within 5-7 business days. Please note that booking fees or processing charges may be non-refundable.
                </p>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                If you are unsatisfied with your service, please let us know within 48 hours. We do not offer cash refunds for services rendered, but we are happy to offer a complimentary adjustment with the original stylist.
              </p>
            </div>
          </section>

          {/* Exceptions */}
          <section className="p-4 bg-surface-container-high rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-on-surface-variant shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-on-surface">Emergency Situations</h4>
              <p className="text-[11px] text-on-surface-variant mt-1">
                We understand that emergencies happen. Cancellation fees may be waived at the salon's discretion for genuine emergencies or medical reasons.
              </p>
            </div>
          </section>

          <div className="pt-6 border-t border-outline-variant/40">
            <p className="text-[10px] text-on-surface-variant text-center">
              Last updated: July 2026 • Nexora Platform Policies
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
