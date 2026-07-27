import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { 
  Clock, 
  Scissors, 
  Sparkles, 
  ShoppingBag, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  ArrowUpRight, 
  Building2, 
  CreditCard, 
  ChevronRight, 
  Info, 
  Download,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  CalendarDays,
  Filter,
  ChevronDown,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice, getCurrencySymbol } from '../utils/currency';
import { useLanguage } from '../contexts/LanguageContext';

interface Transaction {
  id: string;
  client: string;
  service: string;
  date: string;
  isoDate: string;
  amount: string;
  isPositive: boolean;
  status: 'Completed' | 'Pending' | 'Refunded';
  iconType: 'hair' | 'spa' | 'shop' | 'refund';
  method: string;
  fee: string;
  net: string;
  transactionId: string;
}

interface PayoutMethod {
  id: string;
  type: 'bank' | 'upi';
  label: string;
  details: string;
  meta: string;
}

const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    client: 'Ananya Sharma',
    service: 'Balayage & Cut',
    date: 'Oct 22, 2:30 PM',
    isoDate: '2026-10-22',
    amount: '+₹28,500.00',
    isPositive: true,
    status: 'Completed',
    iconType: 'hair',
    method: 'Visa ending in 8842',
    fee: '₹855.00',
    net: '₹27,645.00',
    transactionId: 'TXN-90418294'
  },
  {
    id: 'tx-2',
    client: 'Priya Kapoor',
    service: 'Deep Conditioning',
    date: 'Oct 21, 11:15 AM',
    isoDate: '2026-10-21',
    amount: '+₹12,000.00',
    isPositive: true,
    status: 'Completed',
    iconType: 'spa',
    method: 'Mastercard ending in 1042',
    fee: '₹360.00',
    net: '₹11,640.00',
    transactionId: 'TXN-88219401'
  },
  {
    id: 'tx-3',
    client: 'Product Sale',
    service: 'Olaplex No.3 Hair Perfector',
    date: 'Oct 21, 4:45 PM',
    isoDate: '2026-10-21',
    amount: '+₹3,000.00',
    isPositive: true,
    status: 'Completed',
    iconType: 'shop',
    method: 'Apple Pay / UPI',
    fee: '₹90.00',
    net: '₹2,910.00',
    transactionId: 'TXN-88210399'
  },
  {
    id: 'tx-4',
    client: 'Rohan Verma',
    service: 'Blowout',
    date: 'Oct 19, 1:00 PM',
    isoDate: '2026-10-19',
    amount: '-₹4,500.00',
    isPositive: false,
    status: 'Refunded',
    iconType: 'refund',
    method: 'Refund to Visa ending in 3319',
    fee: '₹0.00',
    net: '-₹4,500.00',
    transactionId: 'TXN-77319400'
  },
  {
    id: 'tx-5',
    client: 'Amit Patel',
    service: 'Full Highlights & Style',
    date: 'Oct 18, 3:15 PM',
    isoDate: '2026-10-18',
    amount: '+₹31,000.00',
    isPositive: true,
    status: 'Completed',
    iconType: 'hair',
    method: 'Visa ending in 5510',
    fee: '₹930.00',
    net: '₹30,070.00',
    transactionId: 'TXN-76104921'
  },
  {
    id: 'tx-6',
    client: 'Sunita Rao',
    service: 'Keratin Treatment',
    date: 'Sep 15, 2026',
    isoDate: '2026-09-15',
    amount: '+₹35,000.00',
    isPositive: true,
    status: 'Completed',
    iconType: 'hair',
    method: 'Visa ending in 1092',
    fee: '₹1,050.00',
    net: '₹33,950.00',
    transactionId: 'TXN-65104882'
  },
  {
    id: 'tx-7',
    client: 'Neha Gupta',
    service: 'Manicure & Spa Pedicure',
    date: 'Aug 30, 2026',
    isoDate: '2026-08-30',
    amount: '+₹9,500.00',
    isPositive: true,
    status: 'Completed',
    iconType: 'spa',
    method: 'Mastercard ending in 5501',
    fee: '₹285.00',
    net: '₹9,215.00',
    transactionId: 'TXN-54019283'
  }
];

export default function Wallet({ navigate }: NavigationProps) {
  const { t } = useLanguage();
  const [balance, setBalance] = useState(425000.00);
  const [pendingSettlement, setPendingSettlement] = useState(85000.00);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filter, setFilter] = useState<'All' | 'Completed' | 'Refunded'>('All');
  
  // Date Range Picker state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | '7days' | '30days' | 'thisMonth' | 'custom'>('all');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Modals state
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
  const [withdrawMethod, setWithdrawMethod] = useState<'standard' | 'instant'>('standard');
  const [selectedPayoutId, setSelectedPayoutId] = useState<string>('bank-1');
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([
    { id: 'bank-1', type: 'bank', label: 'NEFT/IMPS Bank Transfer', details: 'Arrives in 2-4 hours · Free', meta: 'HDFC •••• 4921' },
    { id: 'upi-1', type: 'upi', label: 'Instant IMPS Payout', details: 'Arrives in 5 minutes · 1.5% fee', meta: 'UPI/Debit •••• 4921' }
  ]);

  // Add New Payout State
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'bank' | 'upi'>('bank');
  const [newMethodData, setNewMethodData] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const applyPreset = (preset: 'all' | '7days' | '30days' | 'thisMonth' | 'custom') => {
    setDatePreset(preset);
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === '7days') {
      setStartDate('2023-10-16');
      setEndDate('2023-10-22');
    } else if (preset === '30days') {
      setStartDate('2023-09-23');
      setEndDate('2023-10-22');
    } else if (preset === 'thisMonth') {
      setStartDate('2023-10-01');
      setEndDate('2023-10-31');
    }
  };

  const clearDateRange = () => {
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) {
      setIsSuccessMessage('No transactions available to export.');
      setTimeout(() => setIsSuccessMessage(null), 3000);
      return;
    }

    const headers = ['Transaction ID', 'Client', 'Service', 'Date', 'ISO Date', 'Amount', 'Status', 'Method', 'Fee', 'Net Payout'];
    const rows = filteredTransactions.map(tx => [
      `"${tx.transactionId}"`,
      `"${tx.client.replace(/"/g, '""')}"`,
      `"${tx.service.replace(/"/g, '""')}"`,
      `"${tx.date}"`,
      `"${tx.isoDate}"`,
      `"${tx.amount}"`,
      `"${tx.status}"`,
      `"${tx.method.replace(/"/g, '""')}"`,
      `"${tx.fee}"`,
      `"${tx.net}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `luxesalon_payout_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsSuccessMessage(`Exported ${filteredTransactions.length} payout records to CSV!`);
    setTimeout(() => setIsSuccessMessage(null), 4000);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter !== 'All' && tx.status !== filter) return false;
    if (startDate && tx.isoDate < startDate) return false;
    if (endDate && tx.isoDate > endDate) return false;
    return true;
  });

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0 || amt > balance) return;

    setBalance(prev => prev - amt);
    
    const todayIso = new Date().toISOString().split('T')[0];
    const selectedMethod = payoutMethods.find(m => m.id === selectedPayoutId);
    
    // Add transaction record
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      client: 'Bank Withdrawal',
      service: selectedMethod?.type === 'upi' ? 'Instant IMPS Transfer' : 'NEFT Bank Payout',
      date: 'Just now',
      isoDate: todayIso,
      amount: `-₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isPositive: false,
      status: 'Completed',
      iconType: 'refund',
      method: selectedMethod?.meta || 'Withdrawal',
      fee: selectedMethod?.type === 'upi' ? `₹${(amt * 0.015).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00',
      net: `-₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      transactionId: `WD-${Math.floor(10000000 + Math.random() * 90000000)}`
    };

    setTransactions([newTx, ...transactions]);
    setIsWithdrawOpen(false);
    setIsSuccessMessage(`Successfully requested withdrawal of ${formatPrice(amt, true)}!`);
    setTimeout(() => setIsSuccessMessage(null), 4000);
  };

  const validateNewMethod = () => {
    const errors: Record<string, string> = {};
    if (newMethodType === 'bank') {
      if (!newMethodData.accountName) errors.accountName = 'Name required';
      if (!newMethodData.bankName) errors.bankName = 'Bank name required';
      if (!newMethodData.accountNumber || newMethodData.accountNumber.length < 9) errors.accountNumber = 'Invalid account number';
      if (!newMethodData.ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(newMethodData.ifsc)) errors.ifsc = 'Invalid IFSC format';
    } else {
      if (!newMethodData.upiId || !newMethodData.upiId.includes('@')) errors.upiId = 'Invalid UPI ID';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddNewMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNewMethod()) return;

    const newId = `${newMethodType}-${Date.now()}`;
    const newMethod: PayoutMethod = {
      id: newId,
      type: newMethodType,
      label: newMethodType === 'bank' ? 'NEFT/IMPS Bank Transfer' : 'Instant IMPS Payout',
      details: newMethodType === 'bank' ? 'Arrives in 2-4 hours · Free' : 'Arrives in 5 minutes · 1.5% fee',
      meta: newMethodType === 'bank' 
        ? `${newMethodData.bankName} •••• ${newMethodData.accountNumber.slice(-4)}`
        : `UPI •••• ${newMethodData.upiId.split('@')[0].slice(-4)}`
    };

    setPayoutMethods([...payoutMethods, newMethod]);
    setSelectedPayoutId(newId);
    setIsAddingMethod(false);
    // Reset form
    setNewMethodData({ accountName: '', bankName: '', accountNumber: '', ifsc: '', upiId: '' });
  };

  const renderIcon = (type: Transaction['iconType']) => {
    switch (type) {
      case 'hair':
        return <Scissors className="w-5 h-5 text-on-surface-variant" />;
      case 'spa':
        return <Sparkles className="w-5 h-5 text-on-surface-variant" />;
      case 'shop':
        return <ShoppingBag className="w-5 h-5 text-on-surface-variant" />;
      case 'refund':
        return <RotateCcw className="w-5 h-5 text-on-surface-variant" />;
    }
  };

  return (
    <Layout currentScreen="wallet" navigate={navigate} title="NEXORA SALON">
      <div id="wallet-dashboard-container" className="px-4 py-6 max-w-md mx-auto space-y-6 w-full">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {isSuccessMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between gap-3 text-sm font-semibold"
              id="wallet-toast-success"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSuccessMessage}</span>
              </div>
              <button onClick={() => setIsSuccessMessage(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Screen Header */}
        <div id="wallet-screen-header" className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">{t('wallet_header')}</h1>
          <p className="text-base text-on-surface-variant">{t('wallet_subheader')}</p>
        </div>

        {/* Main Balance Card */}
        <div id="wallet-main-balance-card" className="bg-surface-container-lowest rounded-[18px] border border-surface-variant p-6 card-shadow flex flex-col gap-6 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
          {/* Decorative gradient blur */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t('current_balance')}</span>
            <div className="text-[42px] sm:text-[48px] leading-[52px] font-bold text-on-surface tracking-tight">
              {formatPrice(balance, true)}
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4">
            <button 
              id="btn-withdraw-main"
              onClick={() => setIsWithdrawOpen(true)}
              className="bg-primary-container text-on-primary-container font-semibold text-base px-6 py-3 rounded-[16px] flex-1 hover:bg-primary-container/90 transition-colors active:scale-95 shadow-sm text-center"
            >
              {t('withdraw')}
            </button>
            <button 
              id="btn-details-main"
              onClick={() => setIsDetailsOpen(true)}
              className="bg-surface-container-low text-on-surface font-semibold text-base px-6 py-3 rounded-[16px] hover:bg-surface-container transition-colors active:scale-95 border border-surface-variant"
            >
              {t('details')}
            </button>
          </div>
        </div>

        {/* Pending Settlement Section */}
        <div id="wallet-pending-settlement-card" className="bg-surface-container-lowest rounded-[18px] border border-surface-variant p-6 card-shadow flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-5 h-5" />
              <h3 className="font-semibold text-lg text-on-surface">{t('pending_settlement')}</h3>
            </div>
            <span className="font-semibold text-lg text-on-surface">{formatPrice(pendingSettlement, true)}</span>
          </div>

          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[70%] rounded-full transition-all duration-500"></div>
          </div>

          <p className="text-xs sm:text-sm text-on-surface-variant">
            {t('estimated_arrival')}: <strong className="text-on-surface font-medium">Oct 24, 2026</strong> · Bank ending in 4921
          </p>
        </div>

        {/* Recent Transactions Section */}
        <div id="wallet-recent-transactions-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-on-surface">{t('recent_transactions')}</h2>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Export CSV Button */}
              <button
                id="btn-export-csv"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-xs font-semibold transition-all active:scale-95 shadow-sm"
                title="Export Payout History to CSV"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>{t('export_csv')}</span>
              </button>

              {/* Date Range Picker Trigger Button */}
              <button 
                id="btn-date-range-picker"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  startDate || endDate 
                    ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                    : 'border-surface-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <Calendar className="w-4 h-4 text-primary" />
                <span>
                  {startDate || endDate 
                    ? `${startDate || 'Start'} to ${endDate || 'End'}`
                    : t('all_dates')
                  }
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl text-xs font-semibold">
                {(['All', 'Completed', 'Refunded'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filter === tab 
                        ? 'bg-surface-container-lowest text-primary shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab === 'All' ? t('all') : tab === 'Completed' ? t('completed') : t('refunded')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Date Range Chip / Summary */}
          {(startDate || endDate) && (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 px-3.5 py-2 rounded-xl text-xs font-medium text-on-surface">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Filtered: <strong className="font-semibold text-primary">{startDate || 'Beginning'}</strong> to <strong className="font-semibold text-primary">{endDate || 'Today'}</strong>
                  {' · '}
                  <span className="text-on-surface-variant">{filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'} found</span>
                </span>
              </div>
              <button 
                onClick={clearDateRange}
                className="text-on-surface-variant hover:text-primary transition-colors p-1"
                title="Clear date filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            {filteredTransactions.map((tx, index) => (
              <motion.div 
                key={tx.id}
                id={`transaction-item-${tx.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
                onClick={() => navigate('transaction-detail')}
                className="bg-surface-container-lowest rounded-[16px] border border-surface-variant p-4 flex justify-between items-center hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                    {renderIcon(tx.iconType)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base text-on-surface">{tx.client}</span>
                    <span className="text-xs text-on-surface-variant">{tx.service} · {tx.date}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`font-semibold text-base ${tx.isPositive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {tx.isPositive ? '+' : ''}{formatPrice(tx.amount, true)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                    tx.status === 'Completed' 
                      ? 'text-primary bg-primary/10' 
                      : 'text-on-surface-variant bg-surface-variant'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </motion.div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 bg-surface-container-lowest rounded-[16px] border border-surface-variant text-on-surface-variant text-sm">
                No transactions found for the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Withdraw Modal */}
        <AnimatePresence>
          {isWithdrawOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-lowest border border-surface-variant rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5"
                id="modal-withdraw"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {isAddingMethod && (
                      <button 
                        onClick={() => setIsAddingMethod(false)}
                        className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant mr-1"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    <h3 className="text-xl font-bold text-on-surface">
                      {isAddingMethod ? t('add_payout_method') : t('withdraw')}
                    </h3>
                  </div>
                  <button 
                    onClick={() => {
                      setIsWithdrawOpen(false);
                      setIsAddingMethod(false);
                    }}
                    className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!isAddingMethod ? (
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                        {t('amount_to_withdraw')}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-on-surface-variant">{getCurrencySymbol()}</span>
                        <input 
                          type="number" 
                          step="0.01"
                          max={balance}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-surface-variant bg-surface-bright text-2xl font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {t('available')}: {formatPrice(balance, true)}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                          Payout Method
                        </label>
                        <button 
                          type="button"
                          onClick={() => setIsAddingMethod(true)}
                          className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add New
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                        {payoutMethods.map(method => (
                          <div 
                            key={method.id}
                            onClick={() => setSelectedPayoutId(method.id)}
                            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                              selectedPayoutId === method.id 
                                ? 'border-primary bg-primary/5 text-on-surface' 
                                : 'border-surface-variant hover:bg-surface-container-low text-on-surface-variant'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {method.type === 'bank' ? (
                                <Building2 className="w-5 h-5 text-primary" />
                              ) : (
                                <CreditCard className="w-5 h-5 text-primary" />
                              )}
                              <div>
                                <div className="text-sm font-semibold">{method.label}</div>
                                <div className="text-[11px] text-on-surface-variant">{method.details}</div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-primary">{method.meta}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setIsWithdrawOpen(false)}
                        className="flex-1 py-3 px-4 rounded-xl border border-surface-variant font-semibold text-on-surface hover:bg-surface-container transition-colors"
                      >
                        {t('cancel')}
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-3 px-4 rounded-xl bg-primary-container text-white font-semibold hover:opacity-90 transition-colors shadow-sm"
                      >
                        {t('confirm_payout')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAddNewMethod} className="space-y-4">
                    <div className="p-1 bg-surface-container rounded-xl flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => setNewMethodType('bank')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          newMethodType === 'bank' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                        }`}
                      >
                        Bank Account
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewMethodType('upi')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          newMethodType === 'upi' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                        }`}
                      >
                        UPI ID
                      </button>
                    </div>

                    <div className="space-y-3">
                      {newMethodType === 'bank' ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">{t('account_holder_name')}</label>
                            <input 
                              type="text"
                              value={newMethodData.accountName}
                              onChange={(e) => setNewMethodData({...newMethodData, accountName: e.target.value})}
                              placeholder="e.g. Rahul Sharma"
                              className={`w-full h-11 px-4 rounded-xl border bg-surface-bright text-sm outline-none focus:ring-1 focus:ring-primary ${formErrors.accountName ? 'border-error' : 'border-surface-variant'}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">{t('bank_name')}</label>
                            <input 
                              type="text"
                              value={newMethodData.bankName}
                              onChange={(e) => setNewMethodData({...newMethodData, bankName: e.target.value})}
                              placeholder="e.g. HDFC Bank"
                              className={`w-full h-11 px-4 rounded-xl border bg-surface-bright text-sm outline-none focus:ring-1 focus:ring-primary ${formErrors.bankName ? 'border-error' : 'border-surface-variant'}`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">{t('account_number')}</label>
                              <input 
                                type="text"
                                value={newMethodData.accountNumber}
                                onChange={(e) => setNewMethodData({...newMethodData, accountNumber: e.target.value})}
                                placeholder="0000 0000 0000"
                                className={`w-full h-11 px-4 rounded-xl border bg-surface-bright text-sm outline-none focus:ring-1 focus:ring-primary ${formErrors.accountNumber ? 'border-error' : 'border-surface-variant'}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">{t('ifsc_code')}</label>
                              <input 
                                type="text"
                                value={newMethodData.ifsc}
                                onChange={(e) => setNewMethodData({...newMethodData, ifsc: e.target.value.toUpperCase()})}
                                placeholder="HDFC0000123"
                                className={`w-full h-11 px-4 rounded-xl border bg-surface-bright text-sm outline-none focus:ring-1 focus:ring-primary ${formErrors.ifsc ? 'border-error' : 'border-surface-variant'}`}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">{t('upi_id')}</label>
                          <input 
                            type="text"
                            value={newMethodData.upiId}
                            onChange={(e) => setNewMethodData({...newMethodData, upiId: e.target.value})}
                            placeholder="username@bank"
                            className={`w-full h-11 px-4 rounded-xl border bg-surface-bright text-sm outline-none focus:ring-1 focus:ring-primary ${formErrors.upiId ? 'border-error' : 'border-surface-variant'}`}
                          />
                          <p className="text-[10px] text-on-surface-variant ml-1">Example: john@okaxis, 9876543210@paytm</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit" 
                        className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-md"
                      >
                        {t('save_select_method')}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Balance Breakdown Details Modal */}
        <AnimatePresence>
          {isDetailsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-lowest border border-surface-variant rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5"
                id="modal-details"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-on-surface">Balance Breakdown</h3>
                  <button 
                    onClick={() => setIsDetailsOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="p-3.5 bg-surface-container-low rounded-xl flex justify-between items-center">
                    <span className="text-on-surface-variant">{t('available_for_payout')}</span>
                    <span className="font-bold text-on-surface text-base">{formatPrice(balance, true)}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-low rounded-xl flex justify-between items-center">
                    <span className="text-on-surface-variant">{t('pending_settlement')}</span>
                    <span className="font-semibold text-on-surface">{formatPrice(pendingSettlement, true)}</span>
                  </div>

                  <div className="p-3.5 bg-surface-container-low rounded-xl flex justify-between items-center">
                    <span className="text-on-surface-variant">Reserve Hold (0%)</span>
                    <span className="font-semibold text-on-surface">{formatPrice(0, true)}</span>
                  </div>

                  <hr className="border-surface-variant my-2" />

                  <div className="flex justify-between items-center text-base font-bold text-on-surface pt-1">
                    <span>{t('total_salon_assets')}</span>
                    <span className="text-primary">{formatPrice(balance + pendingSettlement, true)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsDetailsOpen(false)}
                  className="w-full py-3 rounded-xl bg-primary-container text-white font-semibold hover:opacity-90 transition-colors"
                >
                  {t('close')}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Transaction Detail Drawer Modal */}
        <AnimatePresence>
          {selectedTx && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-surface-container-lowest border border-surface-variant rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5"
                id="modal-transaction-detail"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Transaction Details</span>
                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center py-2 space-y-1">
                  <div className="text-3xl font-bold text-on-surface">{selectedTx.amount}</div>
                  <div className="text-sm font-semibold text-on-surface">{selectedTx.client}</div>
                  <div className="text-xs text-on-surface-variant">{selectedTx.service}</div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-4 space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Date & Time</span>
                    <span className="font-semibold text-on-surface">{selectedTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Payment Method</span>
                    <span className="font-semibold text-on-surface">{selectedTx.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Processing Fee</span>
                    <span className="font-semibold text-on-surface">{selectedTx.fee}</span>
                  </div>
                  <div className="flex justify-between border-t border-surface-variant/60 pt-2">
                    <span className="text-on-surface-variant">Net Payout</span>
                    <span className="font-bold text-primary">{selectedTx.net}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-on-surface-variant">Reference ID</span>
                    <span className="font-mono text-xs text-on-surface">{selectedTx.transactionId}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      alert(`Receipt for ${selectedTx.transactionId} downloaded.`);
                      setSelectedTx(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-surface-variant font-semibold text-on-surface hover:bg-surface-container flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Receipt
                  </button>
                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="flex-1 py-3 rounded-xl bg-primary-container text-white font-semibold hover:opacity-90 text-sm"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Date Range Picker Modal / Popover */}
        <AnimatePresence>
          {isDatePickerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-lowest border border-surface-variant rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5"
                id="modal-date-range-picker"
              >
                <div className="flex justify-between items-center border-b border-surface-variant/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-on-surface">Select Date Range</h3>
                  </div>
                  <button 
                    onClick={() => setIsDatePickerOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Quick Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset('all')}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        datePreset === 'all' && !startDate && !endDate
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-surface-variant hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span>All Time</span>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${datePreset === 'all' && !startDate && !endDate ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('7days')}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        datePreset === '7days'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-surface-variant hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span>Last 7 Days</span>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${datePreset === '7days' ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('30days')}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        datePreset === '30days'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-surface-variant hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span>Last 30 Days</span>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${datePreset === '30days' ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('thisMonth')}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        datePreset === 'thisMonth'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-surface-variant hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span>Oct 2023</span>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${datePreset === 'thisMonth' ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Custom Date Inputs */}
                <div className="space-y-3 pt-1 border-t border-surface-variant/40">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Custom Time Period
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-xs text-on-surface-variant mb-1">Start Date</span>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setDatePreset('custom');
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-surface-variant bg-surface-bright text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <span className="block text-xs text-on-surface-variant mb-1">End Date</span>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setDatePreset('custom');
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-surface-variant bg-surface-bright text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={clearDateRange}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-surface-variant font-semibold text-xs text-on-surface hover:bg-surface-container transition-colors"
                  >
                    Reset Filter
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-primary-container text-white font-semibold text-xs hover:opacity-90 transition-colors shadow-sm"
                  >
                    Apply Range
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
