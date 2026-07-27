import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { 
  TrendingUp, 
  Calendar,
  Download,
  Users,
  Star,
  Clock,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  UserCheck,
  Megaphone,
  CheckCircle2,
  Receipt,
  Gem,
  RotateCcw,
  X,
  Check,
  BarChart2,
  PieChart as PieIcon,
  Filter,
  IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

type AnalyticsTab = 'insights' | 'retention' | 'revenue-kpi';
type TimeframeOption = '30-days' | '90-days' | 'year';

// --- DATA DEFINITIONS ---
const REVENUE_DATA_30 = [
  { name: 'Jan', revenue: 65000 },
  { name: 'Feb', revenue: 72000 },
  { name: 'Mar', revenue: 81000 },
  { name: 'Apr', revenue: 79000 },
  { name: 'May', revenue: 95000 },
  { name: 'Jun', revenue: 102000 },
  { name: 'Jul', revenue: 115000 },
  { name: 'Aug', revenue: 110000 },
  { name: 'Sep', revenue: 125000 },
  { name: 'Oct', revenue: 138000 },
  { name: 'Nov', revenue: 142000 },
  { name: 'Dec', revenue: 158000 },
];

const REVENUE_DATA_90 = [
  { name: 'Oct W1', revenue: 31000 },
  { name: 'Oct W2', revenue: 34000 },
  { name: 'Oct W3', revenue: 36000 },
  { name: 'Oct W4', revenue: 37000 },
  { name: 'Nov W1', revenue: 34500 },
  { name: 'Nov W2', revenue: 35500 },
  { name: 'Nov W3', revenue: 36000 },
  { name: 'Nov W4', revenue: 36000 },
  { name: 'Dec W1', revenue: 38000 },
  { name: 'Dec W2', revenue: 39000 },
  { name: 'Dec W3', revenue: 40000 },
  { name: 'Dec W4', revenue: 41000 },
];

const SERVICE_DISTRIBUTION = [
  { name: 'Haircuts & Styling', value: 35, color: '#E6007E' },
  { name: 'Coloring', value: 40, color: '#ffb0c8' },
  { name: 'Treatments', value: 10, color: '#0052da' },
  { name: 'Extensions', value: 10, color: '#b4c5ff' },
  { name: 'Retail', value: 5, color: '#8e6f77' },
];

const CLIENT_BOOKINGS = [
  { month: 'Jun', returning: 320, newClients: 80 },
  { month: 'Jul', returning: 350, newClients: 95 },
  { month: 'Aug', returning: 340, newClients: 110 },
  { month: 'Sep', returning: 380, newClients: 105 },
  { month: 'Oct', returning: 410, newClients: 130 },
  { month: 'Nov', returning: 450, newClients: 150 },
];

const TOP_CLIENTS = [
  {
    name: 'Ananya Sharma',
    visits: '12 visits this year',
    ltv: '₹3,50,000',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBEsXkeAiVpvmbW8Yi3JPENw2qM0ItwZpAz4hWWf5JnqazR2ARjy_t6e3sGZ-IMhBnUF8OsvAHl6q6JYVrXk9Q8OHZTOZCe-AQzwWHjpvs8bmrqSQnZ_XPtnUvJN2UFt-H9MLYJjZaDBXCA9Nb7ErMP742bTh86O_dY0lB6onIk_T893uD5rwxcDAwH3aRDKAR-VoFl5jo80ld4dY2JKpW_ozzD-e6OWnTdEz0_LUJ5c9jZAAO6wEqngX_Dzq7HKBM_a2ZnuPck9E'
  },
  {
    name: 'Rohan Verma',
    visits: '8 visits this year',
    ltv: '₹2,45,000',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6c90fxjCFG_7uhwOhq0PIu450kI7ZB23anu4A4TEZv_IWB_2-mOyswZZKiGMjBJz4sxsqH3HPoECd_jf9vAAgjJZQB5LnCQgGMR7SZS99ZU6H2LqgqJ5-w9f7X2cBuFhhUmWXpha7ZPvM4c0muanQBdmFS96kbNwJNRqgX-MnH43-4qRCju9Z_SVZA6ff_w97xbCCIXdcxzL_puTCTAmaQrEb-BLZnzkhJoyikOYbENaeYUd2__gIWTDq4j4qB9D1DuPUqwDZGUQ'
  },
  {
    name: 'Priya Kapoor',
    visits: '10 visits this year',
    ltv: '₹2,15,000',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCs1BkDa6F8InBDwEfmbUTPqJZM3xcC1Ttt7KTT442AkU9Z9Hh9AjA5VZyv64hovnSbdifCfn_dgr3Ttro9iXUQZy_KZUTmR8NOR_vPySGwm0wMEWRggpH36vl7JF7Y3fCCkvK9tSk37xFEYSSGtPvJDuUo6krRD3mI_K4gJ0HIsbzWhL6uE5pSXnSAhlKtGwfDRoU8h_fPjzAWWc5FtWBkvTfsnQQT_cPunBdCTMRFyWOzlZkHeDiXCg38NDhEhs3if4NScytrfVQ'
  }
];

const ACQUISITION_CHANNELS = [
  { name: 'Social', count: 120, pct: '85%' },
  { name: 'Referral', count: 80, pct: '60%' },
  { name: 'Walk-in', count: 40, pct: '32%' },
  { name: 'Search', count: 65, pct: '50%' }
];

export default function RevenueAnalytics({ navigate }: NavigationProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('insights');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30-days');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exporting, setExporting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setShowExportModal(false);
      triggerToast(`Report successfully exported as ${exportFormat.toUpperCase()}!`);
    }, 1200);
  };

  const currentRevenueData = timeframe === '90-days' ? REVENUE_DATA_90 : REVENUE_DATA_30;

  return (
    <Layout currentScreen="revenue-analytics" navigate={navigate} title="Insights & Analytics">
      <div className="px-4 py-6 max-w-md mx-auto w-full flex flex-col gap-6 pb-32">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-primary text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl z-50 fixed top-20 right-4 sm:right-10 max-w-sm"
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{toastMsg}</span>
              </div>
              <button onClick={() => setToastMsg('')} className="p-1 hover:bg-white/20 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {t('analytics_header')}
            </h1>
            <p className="text-sm text-on-surface-variant font-medium mt-1">
              {t('analytics_subheader')}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Timeframe Selector Dropdown / Pills */}
            <div className="flex bg-surface-container-high p-1 rounded-[16px] border border-surface-variant/80">
              <button 
                onClick={() => setTimeframe('30-days')}
                className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all ${
                  timeframe === '30-days' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t('last_30_days')}
              </button>
              <button 
                onClick={() => setTimeframe('90-days')}
                className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all ${
                  timeframe === '90-days' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t('last_90_days')}
              </button>
              <button 
                onClick={() => setTimeframe('year')}
                className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all ${
                  timeframe === 'year' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t('ytd')}
              </button>
            </div>

            {/* Export Report Button */}
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 rounded-[16px] bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{t('export_report')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-surface-variant gap-6 pt-2">
          <button
            onClick={() => setActiveTab('insights')}
            className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 relative ${
              activeTab === 'insights' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>{t('overview_charts')}</span>
            {activeTab === 'insights' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('retention')}
            className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 relative ${
              activeTab === 'retention' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('client_retention_segments')}</span>
            {activeTab === 'retention' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('revenue-kpi')}
            className={`pb-3 text-sm font-bold transition-colors flex items-center gap-2 relative ${
              activeTab === 'revenue-kpi' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('financial_kpis')}</span>
            {activeTab === 'revenue-kpi' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* TAB 1: MAIN CHARTS & BENTO GRID */}
        {activeTab === 'insights' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-12 gap-6">

              {/* 1. Revenue Growth Line Chart (Full Width Top) */}
              <div className="col-span-12 bg-white/80 backdrop-blur-md rounded-[24px] p-6 border border-surface-variant shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6 z-10 relative">
                  <div>
                    <h3 className="text-lg font-extrabold text-on-surface mb-0.5">{t('revenue_growth')}</h3>
                    <p className="text-xs font-medium text-on-surface-variant">{t('monthly_revenue_trajectory')}</p>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">₹12,45,000</span>
                    <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md mt-1 flex items-center gap-1 w-fit">
                      <TrendingUp className="w-3.5 h-3.5" /> +14.2%
                    </span>
                  </div>
                </div>

                {/* Recharts Area Line Chart */}
                <div className="h-72 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E6007E" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#E6007E" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#5a3f47', fontSize: 12, fontWeight: 500 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#5a3f47', fontSize: 12, fontWeight: 500 }}
                        tickFormatter={(val) => `₹${val / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1c1b1b', 
                          borderRadius: '12px', 
                          border: 'none', 
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#E6007E" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#revenueGradient)" 
                        dot={{ r: 4, fill: '#fff', stroke: '#E6007E', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#E6007E' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Decorative background blur blob */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
              </div>

              {/* 2. Service Distribution Donut Chart (Left Half) */}
              <div className="col-span-12 md:col-span-6 bg-white/80 backdrop-blur-md rounded-[24px] p-6 border border-surface-variant shadow-xs flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="text-lg font-extrabold text-on-surface mb-0.5">{t('service_distribution')}</h3>
                  <p className="text-xs font-medium text-on-surface-variant">{t('revenue_by_category')}</p>
                </div>

                <div className="h-64 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={SERVICE_DISTRIBUTION}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {SERVICE_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1c1b1b', borderRadius: '10px', border: 'none', color: '#fff' }}
                        formatter={(val: any) => [`${val}%`, 'Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-surface-variant text-xs font-medium">
                  {SERVICE_DISTRIBUTION.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-on-surface font-semibold truncate">{item.name}</span>
                      <span className="text-on-surface-variant ml-auto font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Client Bookings Bar Chart (Right Half) */}
              <div className="col-span-12 md:col-span-6 bg-white/80 backdrop-blur-md rounded-[24px] p-6 border border-surface-variant shadow-xs flex flex-col justify-between">
                <div className="mb-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-extrabold text-on-surface mb-0.5">{t('client_bookings')}</h3>
                    <p className="text-xs font-medium text-on-surface-variant">{t('new_returning_clients')}</p>
                  </div>
                </div>

                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CLIENT_BOOKINGS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#5a3f47', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5a3f47', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1c1b1b', borderRadius: '10px', border: 'none', color: '#fff' }}
                      />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                      <Bar dataKey="returning" name="Returning Clients" fill="#E6007E" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="newClients" name="New Clients" fill="#ffb0c8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. Quick Stats Row (Bottom) */}
              <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div className="bg-white/80 backdrop-blur-md rounded-[18px] p-5 text-center border border-surface-variant shadow-xs hover:-translate-y-0.5 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed mx-auto mb-3 flex items-center justify-center text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-on-surface-variant mb-1">{t('total_clients')}</p>
                  <p className="text-xl font-black text-on-surface">3,240</p>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-[18px] p-5 text-center border border-surface-variant shadow-xs hover:-translate-y-0.5 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed mx-auto mb-3 flex items-center justify-center text-tertiary">
                    <Star className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-on-surface-variant mb-1">{t('avg_rating')}</p>
                  <p className="text-xl font-black text-on-surface">4.9 / 5.0</p>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-[18px] p-5 text-center border border-surface-variant shadow-xs hover:-translate-y-0.5 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed mx-auto mb-3 flex items-center justify-center text-secondary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-on-surface-variant mb-1">{t('utilization')}</p>
                  <p className="text-xl font-black text-on-surface">82%</p>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-[18px] p-5 text-center border border-surface-variant shadow-xs hover:-translate-y-0.5 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 mx-auto mb-3 flex items-center justify-center text-primary-container">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-on-surface-variant mb-1">{t('avg_ticket')}</p>
                  <p className="text-xl font-black text-on-surface">₹2,500.00</p>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: CLIENT RETENTION & SEGMENTS */}
        {activeTab === 'retention' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Client Retention Card */}
              <div className="md:col-span-2 bg-surface rounded-[24px] border border-surface-variant p-6 shadow-xs flex flex-col justify-between gap-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-extrabold text-on-surface">{t('client_retention_segments')}</h3>
                    <p className="text-xs font-medium text-on-surface-variant">Repeat visit performance vs churn metrics</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-[16px] border border-surface-variant">
                    <p className="text-xs font-medium text-on-surface-variant mb-1">{t('repeat_customer_rate')}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-black text-on-surface">68%</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <ArrowUp className="w-3 h-3" /> 2.4%
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-[16px] border border-surface-variant">
                    <p className="text-xs font-medium text-on-surface-variant mb-1">{t('churn_risk_rate')}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-black text-on-surface">12%</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <ArrowDown className="w-3 h-3" /> 1.1%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Clients List */}
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-3">{t('top_vip_clients')}</h4>
                  <div className="space-y-3">
                    {TOP_CLIENTS.map((client, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-[16px] bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-variant"
                      >
                        <div className="flex items-center gap-3">
                          <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-full object-cover border border-surface-variant shrink-0" />
                          <div>
                            <h5 className="text-sm font-bold text-on-surface">{client.name}</h5>
                            <p className="text-xs text-on-surface-variant font-medium">{client.visits}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-on-surface">{client.ltv}</p>
                          <p className="text-[11px] font-bold text-primary">LTV</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acquisition Channels */}
              <div className="bg-surface rounded-[24px] border border-surface-variant p-6 shadow-xs flex flex-col justify-between gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-on-surface mb-1">{t('acquisition_channels')}</h3>
                  <p className="text-xs font-medium text-on-surface-variant">Where new clients discover your salon</p>
                </div>

                <div className="space-y-4">
                  {ACQUISITION_CHANNELS.map((ch) => (
                    <div key={ch.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-on-surface">{ch.name}</span>
                        <span className="text-primary">{ch.count} clients ({ch.pct})</span>
                      </div>
                      <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: ch.pct }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-primary-container/10 rounded-2xl border border-primary-container/20 text-xs font-medium text-on-surface leading-relaxed">
                  <span className="font-bold text-primary">Insight:</span> Social Media drives 48% of high-spend VIP conversions this quarter.
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 3: FINANCIAL KPIS */}
        {activeTab === 'revenue-kpi' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <div className="bg-surface rounded-[24px] border border-surface-variant p-6 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +5.2%
                </span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">{t('average_ticket_size')}</p>
                <h4 className="text-3xl font-black text-on-surface">₹2,500.00</h4>
              </div>
            </div>

            <div className="bg-surface rounded-[24px] border border-surface-variant p-6 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                  <Gem className="w-5 h-5" />
                </div>
                <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +12.0%
                </span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">{t('client_lifetime_value')}</p>
                <h4 className="text-3xl font-black text-on-surface">₹25,000.00</h4>
              </div>
            </div>

            <div className="bg-surface rounded-[24px] border border-surface-variant p-6 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ArrowDown className="w-3.5 h-3.5" /> -0.5%
                </span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-medium mb-1">{t('refund_rate')}</p>
                <h4 className="text-3xl font-black text-on-surface">0.8%</h4>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Export Report Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExportModal(false)}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 w-full max-w-sm border border-outline-variant/30 text-left relative"
            >
              <button 
                onClick={() => setShowExportModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-3">
                <Download className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-on-surface tracking-tight">{t('export_insights_report')}</h3>
              <p className="text-xs text-on-surface-variant mt-1">Select your preferred export format and date range.</p>

              <div className="my-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1.5">Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportFormat('csv')}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        exportFormat === 'csv'
                          ? 'border-primary bg-primary-fixed/20 text-primary'
                          : 'border-surface-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <Check className={`w-4 h-4 ${exportFormat === 'csv' ? 'opacity-100' : 'opacity-0'}`} />
                      <span>CSV Spreadsheet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportFormat('pdf')}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        exportFormat === 'pdf'
                          ? 'border-primary bg-primary-fixed/20 text-primary'
                          : 'border-surface-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <Check className={`w-4 h-4 ${exportFormat === 'pdf' ? 'opacity-100' : 'opacity-0'}`} />
                      <span>PDF Document</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl text-xs font-bold hover:bg-surface-variant transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <span>{t('generating')}</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{t('download')}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
