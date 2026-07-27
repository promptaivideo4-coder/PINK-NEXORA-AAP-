import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { 
  MoreHorizontal, 
  Receipt, 
  User, 
  Check, 
  X, 
  Calendar, 
  DollarSign, 
  Search, 
  ArrowRight, 
  Download, 
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientRecord {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  lastVisit: string;
  spend: string;
  status: 'VIP' | 'Regular' | 'At Risk';
}

interface TransactionRecord {
  id: string;
  date: string;
  time: string;
  service: string;
  amount: string;
  client: string;
  receiptNumber: string;
}

const CLIENT_RECORDS: ClientRecord[] = [
  {
    id: '1',
    name: 'Aditi Sharma',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBW4CtAT2tdd2YuZ6WouiFS1KneWa5Q8ObiRiC-kQe6wrYErarvNUTcIiFJFquX5zhzP5OcRpEjwAGlR5H-euBjLZQLc9nbZ2tiqAULzn4RPxHD_ZtT50Td2QraviPhxh6Pwgbv_A22rxkKTNj_sGqQP7lbIDn9CFkTtdnaobzwzcGXLU9DAQheRlCFlFhSxN9VY698qd8ZI12BG9DxPU759d3XZYDL3Wgb9l45H40fbB-RNnG_ABbXTgGNIkDZ1bq94eJsyekXh0I',
    lastVisit: 'Oct 12, 2023',
    spend: '₹1,240.00',
    status: 'VIP'
  },
  {
    id: '2',
    name: 'Suman Gupta',
    initials: 'SJ',
    lastVisit: 'Nov 05, 2023',
    spend: '₹450.00',
    status: 'Regular'
  },
  {
    id: '3',
    name: 'Michael Chen',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2GpHIx9Sp7japZtTMjP4Lv4ONK00KLpSclWA7pPXdp4EyfNxK1D3q7ivsD8NmKyIKtIDqMtklF1N9o9TegRSzeBktFakLSnOQzEh84AifdnPcZMCtbiizzA-yhDcJYYRolLcAQvBtpu2Sjmp3TbHLK1W3-cW0sGX1wZ-jfllfkyieFqv0dvWbk_SFv3eSzwqWcEmiLfOkki0I37Ffi8DPEqGSjYf3HJ1u_u9W5I5v3xEaZbv7yjPS5CM4gp9GcIiOlkS5Ttn7uMQ',
    lastVisit: 'Aug 22, 2023',
    spend: '₹890.00',
    status: 'At Risk'
  },
  {
    id: '4',
    name: 'Chloe Martinez',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXmxb3-cgY68I-Np8VynFSUirxUNp3pSC92c02DpaH20RR7TkS2aNc2eBU28yMr2mvF4ta7pMOlY0VsthN-E0_Nru9VFxYExGswOvPTezXWTYjl2tx7mQIuFUSS39PcdOSb7IcY6NCdVlQlhVNIGbL24TMNycSHwZ55k22K_IwoGyYfxhAeh74HXJiHziItTCLCLb4_MNooy-XIxXXBPCIgNiOFFSNoFcpWolBWfwThWlwRIVFxh7CnY3vhGh228vaddwAWIilJiQ',
    lastVisit: 'Nov 12, 2023',
    spend: '₹2,100.00',
    status: 'VIP'
  }
];

const TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx1',
    date: 'Nov 15, 2023',
    time: '14:30 PM',
    service: 'Balayage & Cut',
    amount: '₹285.00',
    client: 'Suman Gupta',
    receiptNumber: '#NX-98231'
  },
  {
    id: 'tx2',
    date: 'Nov 15, 2023',
    time: '10:15 AM',
    service: 'Olaplex Treatment',
    amount: '₹65.00',
    client: 'Aditi Sharma',
    receiptNumber: '#NX-98230'
  },
  {
    id: 'tx3',
    date: 'Nov 14, 2023',
    time: '16:00 PM',
    service: 'Signature Hydro Facial',
    amount: '₹140.00',
    client: 'Michael Chen',
    receiptNumber: '#NX-98229'
  }
];

export default function ResponsiveTables({ navigate }: NavigationProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionRecord | null>(null);
  const [activeMenuClient, setActiveMenuClient] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  return (
    <Layout currentScreen="responsive-tables" navigate={navigate} title="Data Overview" showBack onBack={() => navigate('settings')}>
      <div className="px-5 md:px-10 py-8 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-32">
        
        {/* Page Header */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">Data Overview</h2>
          <p className="text-sm text-on-surface-variant font-medium">Swipe horizontally to view complete records.</p>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-primary-container text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg"
            >
              <span>{toastMsg}</span>
              <button onClick={() => setToastMsg('')} className="p-1 hover:bg-white/20 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table 1: Client Directory with Status Badges */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-on-surface tracking-tight">Client Directory</h3>
            <button 
              onClick={() => navigate('customers')}
              className="text-xs font-bold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
            >
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-variant overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-variant">
                    <th className="text-xs font-bold text-on-surface-variant px-5 py-3.5">Client Name</th>
                    <th className="text-xs font-bold text-on-surface-variant px-5 py-3.5">Last Visit</th>
                    <th className="text-xs font-bold text-on-surface-variant px-5 py-3.5">Total Spend</th>
                    <th className="text-xs font-bold text-on-surface-variant px-5 py-3.5">Status</th>
                    <th className="text-xs font-bold text-on-surface-variant px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {CLIENT_RECORDS.map((client) => (
                    <tr key={client.id} className="hover:bg-surface-container-low/50 transition-colors group">
                      <td className="px-5 py-4 text-sm font-semibold text-on-surface flex items-center gap-3">
                        {client.avatar ? (
                          <img 
                            src={client.avatar} 
                            alt={client.name} 
                            className="w-9 h-9 rounded-full object-cover border border-surface-variant shrink-0" 
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs shrink-0">
                            {client.initials || client.name.charAt(0)}
                          </div>
                        )}
                        <span>{client.name}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant font-medium">{client.lastVisit}</td>
                      <td className="px-5 py-4 text-sm font-bold text-on-surface">{client.spend}</td>
                      <td className="px-5 py-4">
                        {client.status === 'VIP' && (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary-container/10 text-primary-container border border-primary-container/20">
                            VIP
                          </span>
                        )}
                        {client.status === 'Regular' && (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-surface-variant/40 text-on-surface-variant border border-surface-variant">
                            Regular
                          </span>
                        )}
                        {client.status === 'At Risk' && (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-error-container/20 text-error border border-error/20">
                            At Risk
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right relative">
                        <button 
                          onClick={() => triggerToast(`Opened quick actions for ${client.name}`)}
                          className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container-high"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Table 2: Recent Transactions */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-on-surface tracking-tight">Recent Transactions</h3>
            <button 
              onClick={() => navigate('wallet')}
              className="text-xs font-bold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
            >
              <span>View All Transactions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-variant overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[500px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-variant">
                    <th className="text-xs font-bold text-on-surface-variant px-5 py-3.5">Date & Time</th>
                    <th className="text-xs font-bold text-on-surface-variant px-5 py-3.5">Service/Product</th>
                    <th className="text-xs font-bold text-on-surface-variant px-5 py-3.5 text-right">Amount</th>
                    <th className="text-xs font-bold text-on-surface-variant px-5 py-3.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {TRANSACTIONS.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-on-surface">{tx.date}</div>
                        <div className="text-xs text-on-surface-variant font-medium">{tx.time}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-bold text-on-surface">{tx.service}</div>
                        <div className="text-xs text-on-surface-variant font-medium">{tx.client}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-extrabold text-on-surface text-right">{tx.amount}</td>
                      <td className="px-5 py-3.5 text-center">
                        <button 
                          onClick={() => setSelectedReceipt(tx)}
                          className="text-primary hover:bg-primary-container/10 p-2 rounded-full transition-colors inline-flex items-center justify-center"
                          title="View Digital Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>

      {/* Digital Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReceipt(null)}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 w-full max-w-sm border border-outline-variant/30 text-center relative"
            >
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-on-surface tracking-tight">Receipt Overview</h3>
              <p className="text-xs font-mono text-on-surface-variant mt-0.5">{selectedReceipt.receiptNumber}</p>

              <div className="my-6 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 space-y-2 text-left text-xs font-medium text-on-surface">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Client:</span>
                  <span className="font-bold">{selectedReceipt.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Service:</span>
                  <span className="font-bold">{selectedReceipt.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Date:</span>
                  <span>{selectedReceipt.date} • {selectedReceipt.time}</span>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-center text-sm font-extrabold text-on-surface">
                  <span>Total Paid:</span>
                  <span className="text-primary">{selectedReceipt.amount}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedReceipt(null);
                    triggerToast('Receipt downloaded as PDF');
                  }}
                  className="flex-1 py-2.5 bg-primary-container text-white rounded-xl text-xs font-bold hover:bg-primary transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
