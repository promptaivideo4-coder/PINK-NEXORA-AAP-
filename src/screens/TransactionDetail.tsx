import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  CreditCard, 
  Download, 
  Receipt, 
  RotateCcw, 
  Check, 
  X,
  User,
  Scissors
} from 'lucide-react';
import { NavigationProps } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function TransactionDetail({ navigate }: NavigationProps) {
  const [status, setStatus] = useState<'Settled' | 'Refunded'>('Settled');
  const [amount, setAmount] = useState('₹285.00');
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('Customer request');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Refunded');
    setIsRefundModalOpen(false);
    showToast('Refund of ₹285.00 initiated successfully.');
  };

  const handleDownloadPdf = () => {
    showToast('Digital Invoice PDF downloaded to your device.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div id="transaction-detail-screen" className="bg-background text-on-background min-h-screen font-body flex flex-col justify-between items-center pb-24 md:pb-8 w-full relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold max-w-md mx-auto"
            id="toast-notification"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TopAppBar */}
      <header id="transaction-detail-appbar" className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-4 md:px-10 h-16 max-w-7xl mx-auto">
        <button 
          id="btn-back-to-wallet"
          onClick={() => navigate('wallet')} 
          aria-label="Go back" 
          className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200 p-2 -ml-2 flex items-center justify-center rounded-full hover:bg-primary/5"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold text-on-surface">Transaction Detail</h1>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0 cursor-pointer" onClick={() => navigate('profile')}>
          <img 
            alt="Owner Profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAB96CWosLpRuIacee4U2kN2vqyFEPO3ikHurn21emcig6vcxGNfwoS6w8lmDcBwiTGwe7qL0vZUYCTIoe-o3xofsK4CI207x9s6fzXf2nf0fy4EhB7UTDrVWBUIKFtxFgbf99V_obt_DMyXMF2V9ubQCOi5zMP9cX33EZ1fkNllPEYVFDXYBFuxpsCy18lxum9oPb7R6zRxa6j-qzvu-KfqaHyFAKnYM_s4dI7CyLXaY1JqDRKmAE7gBmqshi-POgOfYvhq4pvgXU"
          />
        </div>
      </header>

      {/* Main Content Container */}
      <main id="transaction-detail-main" className="w-full max-w-3xl pt-24 px-5 md:px-0 flex flex-col gap-6 mx-auto">
        
        {/* Header / Amount Section */}
        <section id="transaction-amount-section" className="flex flex-col items-center justify-center py-6">
          <span className="text-xs text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">
            {status === 'Settled' ? 'Successful Payment' : 'Refunded Transaction'}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight">
            {status === 'Settled' ? amount : `-${amount}`}
          </h2>
          
          <div className={`mt-4 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
            status === 'Settled'
              ? 'bg-tertiary-fixed/40 text-tertiary-container'
              : 'bg-rose-100 text-rose-700'
          }`}>
            {status === 'Settled' ? (
              <>
                <CheckCircle2 className="w-4 h-4 fill-current text-tertiary-container" />
                <span>Settled</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Refunded</span>
              </>
            )}
          </div>
        </section>

        {/* Transaction Details Card */}
        <section id="transaction-card-details" className="bg-surface-container-lowest/90 backdrop-blur-xl border border-surface-variant p-6 rounded-[18px] card-shadow flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-on-surface border-b border-outline-variant/30 pb-4">
            Details
          </h3>
          
          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm text-on-surface-variant">Service</span>
            <span className="text-sm font-medium text-on-surface">Balayage & Tone</span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm text-on-surface-variant">Customer</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-surface-variant overflow-hidden">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Isabella Rossi" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQKMFc6Nt1dke_LkANBhh_DFJ9bXqoZDhQD73YYZHbRLo257Ahyalvv4X8HLWEANXlvRobptBAq4i0srmxN4vc_wnkTKvgae3VZD-Gs4X7INWmoRSDWYmIzr0MUIXDGacQ8XIal-Fuy-E4BP0xNWddGVpvSt10b4B9nF05EwEP0cc6Yn0nR00ut5gaUULCkAJWSntLGZ6_h-di4UK06cAvS9Cs1v8g9k99e3nv4DRFEFm2konqadqbTowdRwnvZOwTSH3TXnh71LA"
                />
              </div>
              <span className="text-sm font-medium text-on-surface">Isabella Rossi</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm text-on-surface-variant">Staff</span>
            <span className="text-sm font-medium text-on-surface">Elena Rodriguez</span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm text-on-surface-variant">Date & Time</span>
            <span className="text-sm font-medium text-on-surface">Oct 24, 2023 at 2:30 PM</span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-sm text-on-surface-variant">Payment Method</span>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-on-surface-variant" />
              <span className="text-sm font-medium text-on-surface">Visa ****4242</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-outline-variant/30 mt-2 pt-4">
            <span className="text-sm text-on-surface-variant">Transaction ID</span>
            <span className="text-xs font-mono text-on-surface-variant font-semibold bg-surface-container px-2 py-1 rounded">
              #TXN-8892-ABCD
            </span>
          </div>
        </section>

        {/* Digital Invoice Section */}
        <section id="transaction-card-invoice" className="bg-surface-container-lowest/90 backdrop-blur-xl border border-surface-variant p-6 rounded-[18px] card-shadow flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-primary shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-base text-on-surface">Digital Invoice</h4>
              <p className="text-xs text-on-surface-variant">Available for download</p>
            </div>
          </div>
          <button 
            id="btn-download-pdf"
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-full text-xs font-semibold hover:bg-surface-variant transition-colors flex items-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </section>

        {/* Timeline Section */}
        <section id="transaction-card-timeline" className="bg-surface-container-lowest/90 backdrop-blur-xl border border-surface-variant p-6 rounded-[18px] card-shadow">
          <h3 className="text-lg font-semibold text-on-surface mb-6">Status Timeline</h3>
          <div className="relative pl-6 border-l-2 border-primary-fixed-dim space-y-6">
            
            {status === 'Refunded' && (
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-rose-600 ring-4 ring-surface"></div>
                <p className="text-sm font-medium text-on-surface">Refund Initiated & Settled</p>
                <p className="text-xs text-on-surface-variant">Just now</p>
              </div>
            )}

            {/* Settled (Current) */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full ring-4 ring-surface ${status === 'Settled' ? 'bg-primary' : 'bg-surface-variant'}`}></div>
              <p className="text-sm font-medium text-on-surface">Settled</p>
              <p className="text-xs text-on-surface-variant">Oct 25, 2023 - 9:00 AM</p>
            </div>

            {/* Processed */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-surface-variant ring-4 ring-surface"></div>
              <p className="text-sm font-medium text-on-surface">Processed</p>
              <p className="text-xs text-on-surface-variant">Oct 24, 2023 - 2:32 PM</p>
            </div>

            {/* Initiated */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-surface-variant ring-4 ring-surface"></div>
              <p className="text-sm font-medium text-on-surface">Payment Initiated</p>
              <p className="text-xs text-on-surface-variant">Oct 24, 2023 - 2:30 PM</p>
            </div>

          </div>
        </section>

        {/* Action Button */}
        <section id="transaction-action-section" className="mt-2 mb-8 flex justify-center">
          {status === 'Settled' ? (
            <button 
              id="btn-initiate-refund"
              onClick={() => setIsRefundModalOpen(true)}
              className="w-full md:w-auto px-8 py-4 bg-[#FDE7F3] text-[#E6007E] rounded-[16px] text-base font-semibold hover:opacity-90 transition-opacity active:scale-[0.98] shadow-sm"
            >
              Initiate Refund
            </button>
          ) : (
            <button 
              disabled
              className="w-full md:w-auto px-8 py-4 bg-surface-variant text-on-surface-variant/60 rounded-[16px] text-base font-semibold cursor-not-allowed opacity-75"
            >
              Transaction Refunded
            </button>
          )}
        </section>

      </main>

      {/* Refund Confirmation Modal */}
      <AnimatePresence>
        {isRefundModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest border border-surface-variant rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5"
              id="modal-refund-confirmation"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-on-surface">Initiate Full Refund</h3>
                <button 
                  onClick={() => setIsRefundModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800">
                You are issuing a <strong>₹285.00</strong> refund to Isabella Rossi's Visa ending in 4242. This action cannot be undone.
              </div>

              <form onSubmit={handleRefund} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Refund Reason
                  </label>
                  <select 
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-surface-variant bg-surface-bright text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Customer request">Customer request</option>
                    <option value="Service dissatisfaction">Service dissatisfaction</option>
                    <option value="Duplicate charge">Duplicate charge</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsRefundModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-surface-variant font-semibold text-on-surface hover:bg-surface-container transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 px-4 rounded-xl bg-[#E6007E] text-white font-semibold hover:opacity-90 transition-colors shadow-sm text-sm"
                  >
                    Confirm Refund
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
