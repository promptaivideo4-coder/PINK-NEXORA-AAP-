import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Filter, 
  MoreVertical, 
  Send, 
  CheckCircle2, 
  Eye, 
  MousePointer2, 
  CalendarCheck, 
  BarChart3,
  Layers,
  Clock,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Home,
  Menu,
  Settings,
  Bell,
  Sliders,
  MoreHorizontal,
  Tag,
  Info,
  TrendingUp,
  Users,
  Target,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Custom icons to match mockup better
const TuneIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
    <line x1="2" y1="14" x2="6" y2="14" /><line x1="10" y1="8" x2="14" y2="8" /><line x1="18" y1="16" x2="22" y2="16" />
  </svg>
);

interface CampaignHistoryProps {
  onBack: () => void;
}

const historyData = [
  {
    id: '1',
    name: 'Diwali Glow Offer',
    type: 'WhatsApp',
    offer: 'GLOW20',
    offerDesc: '20% Off Facials',
    date: 'Oct 24, 2024',
    audience: 'VIP Customers',
    recipients: 1240,
    delivered: 1190,
    opened: 940,
    clicked: 310,
    bookings: 45,
    status: 'Running',
    color: 'emerald'
  },
  {
    id: '2',
    name: 'Re-engagement Blast',
    type: 'SMS',
    offer: 'FREE_CONSULT',
    offerDesc: 'Free Consultation',
    date: 'Oct 15, 2024',
    audience: 'Inactive Customers',
    recipients: 3500,
    delivered: 3420,
    opened: 1200,
    clicked: 450,
    bookings: 12,
    status: 'Completed',
    color: 'zinc'
  },
  {
    id: '3',
    name: 'Weekend Special',
    type: 'Push',
    offer: 'BOGO',
    offerDesc: 'BOGO Services',
    date: 'Oct 05, 2024',
    audience: 'All Active',
    recipients: 2100,
    delivered: 2050,
    opened: 1800,
    clicked: 900,
    bookings: 86,
    status: 'Completed',
    color: 'zinc'
  },
  {
    id: '4',
    name: 'Monsoon Hair Care',
    type: 'Email',
    offer: 'HAIR30',
    offerDesc: '30% Off Hair Spa',
    date: 'Sep 28, 2024',
    audience: 'All Customers',
    recipients: 5000,
    delivered: 4800,
    opened: 1500,
    clicked: 200,
    bookings: 0,
    status: 'Scheduled',
    color: 'purple'
  }
];

const chartData = [
  { name: 'Mon', bookings: 12, reach: 400 },
  { name: 'Tue', bookings: 19, reach: 700 },
  { name: 'Wed', bookings: 15, reach: 600 },
  { name: 'Thu', bookings: 22, reach: 800 },
  { name: 'Fri', bookings: 30, reach: 1100 },
  { name: 'Sat', bookings: 38, reach: 1400 },
  { name: 'Sun', bookings: 20, reach: 900 },
];

const performanceData = [
  { name: 'Email', value: 45 },
  { name: 'WhatsApp', value: 30 },
  { name: 'SMS', value: 15 },
  { name: 'Push', value: 10 },
];

export default function CampaignHistory({ onBack }: CampaignHistoryProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<typeof historyData[0] | null>(historyData[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [activeView, setActiveView] = useState('dashboard');
  const [showToast, setShowToast] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');

  const t = {
    EN: {
      dashboard: 'Dashboard',
      campaigns: 'Campaigns',
      analytics: 'Analytics',
      audiences: 'Audiences',
      automation: 'Automation',
      history: 'History',
      overview: 'Overview',
      create: 'Create Campaign',
      search: 'Search campaigns...',
      total_sent: 'Total Sent',
      delivered: 'Delivered',
      opened: 'Opened',
      clicked: 'Clicked',
      bookings: 'Bookings',
      conv_rate: 'Conv. Rate',
      running: 'Running',
      scheduled: 'Scheduled',
      completed: 'Completed',
      draft: 'Draft',
      settings: 'Settings',
      lang: 'Language',
      select_lang: 'Select Language',
      select_client: 'Select Client'
    },
    HI: {
      dashboard: 'डैशबोर्ड',
      campaigns: 'अभियान',
      analytics: 'एनालिटिक्स',
      audiences: 'दर्शक',
      automation: 'ऑटोमेशन',
      history: 'इतिहास',
      overview: 'अवलोकन',
      create: 'अभियान बनाएं',
      search: 'अभियान खोजें...',
      total_sent: 'कुल भेजे गए',
      delivered: 'वितरित',
      opened: 'खोले गए',
      clicked: 'क्लिक किए गए',
      bookings: 'बुकिंग',
      conv_rate: 'कन्वर्जन दर',
      running: 'चल रहा है',
      scheduled: 'निर्धारित',
      completed: 'पूरा हुआ',
      draft: 'ड्राफ्ट',
      settings: 'सेटिंग्स',
      lang: 'भाषा',
      select_lang: 'भाषा चुनें',
      select_client: 'क्लाइंट चुनें'
    }
  }[language];

  const tabs = ['All', 'Draft', 'Scheduled', 'Running', 'Completed', 'Paused'];

  const notifications = [
    { id: 1, title: 'Campaign Milestone', desc: 'Diwali Glow Offer reached 1,000 opens!', time: '2m ago', unread: true },
    { id: 2, title: 'New Audience Segment', desc: 'VIP Skincare segment is ready for use.', time: '1h ago', unread: true },
    { id: 3, title: 'System Update', desc: 'Performance analytics now include ROI tracking.', time: '5h ago', unread: false },
  ];

  const handleSidebarClick = (view: string) => {
    setActiveView(view);
    // Removed toast as these views are now functional
  };

  const [showClientPicker, setShowClientPicker] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  
  const sampleClients = [
    { id: '1', name: 'Ananya Sharma', type: 'VIP', spend: '₹1,25,000' },
    { id: '2', name: 'Priya Kapoor', type: 'Gold', spend: '₹34,000' },
    { id: '3', name: 'Rohan Verma', type: 'Standard', spend: '₹12,000' },
    { id: '4', name: 'Amit Patel', type: 'New', spend: '₹0' },
  ];

  const toggleClient = (id: string) => {
    setSelectedClients(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderClientPicker = () => {
    return (
      <AnimatePresence>
        {showClientPicker && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClientPicker(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-[#191c1e]">{t.select_client}</h3>
                <button onClick={() => setShowClientPicker(false)} className="text-[#5f5e5e]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {sampleClients.map(client => (
                  <button 
                    key={client.id}
                    onClick={() => toggleClient(client.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      selectedClients.includes(client.id)
                        ? 'bg-[#ffd9e2] border-[#e6007e] text-[#3e001e]'
                        : 'bg-white border-[#e2bdc7] text-[#191c1e] hover:bg-[#f7f9fb]'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold">{client.name}</p>
                      <p className="text-[10px] font-bold text-[#5f5e5e] uppercase tracking-widest">{client.type} • {client.spend}</p>
                    </div>
                    {selectedClients.includes(client.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-[#e6007e]" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-[#e2bdc7]" />
                    )}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowClientPicker(false)}
                className="w-full py-4 bg-[#e6007e] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:brightness-110 transition-all"
              >
                Done ({selectedClients.length} Selected)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  const renderDashboard = () => {
    return (
      <div className="space-y-8 pb-10">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Revenue Growth', value: '+24.5%', sub: 'vs last month', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: t.audiences, value: '12.4k', sub: 'across 4 channels', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Avg. Conv. Rate', value: '3.8%', sub: 'industry avg 2.1%', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Campaign ROI', value: '4.2x', sub: 'direct attribution', icon: BarChart3, color: 'text-[#e6007e]', bg: 'bg-[#ffd9e2]' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-[#e2bdc7] shadow-sm flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest mb-1">{kpi.label}</p>
                <p className="text-2xl font-black text-[#191c1e]">{kpi.value}</p>
                <p className="text-[10px] text-[#5f5e5e] font-medium mt-1">{kpi.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#e2bdc7] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-[#191c1e]">Performance Overview</h3>
                <p className="text-xs text-[#5f5e5e]">Tracking weekly reach and booking attribution</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#e6007e]"></div>
                  <span className="text-[10px] font-bold text-[#5f5e5e]">Bookings</span>
                </div>
                <div className="flex items-center gap-1.5 ml-4">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-[10px] font-bold text-[#5f5e5e]">Reach</span>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e6007e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#e6007e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#8e6f77' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#8e6f77' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#e6007e" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorBookings)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="reach" 
                    stroke="#60a5fa" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Module: Top Campaigns */}
          <div className="bg-white rounded-3xl border border-[#e2bdc7] p-6 shadow-sm">
            <h3 className="text-lg font-black text-[#191c1e] mb-6">Active Campaigns</h3>
            <div className="space-y-4">
              {historyData.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="flex items-center gap-4 p-3 hover:bg-[#f7f9fb] rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-[#e2bdc7]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    campaign.status === 'Running' ? 'bg-[#ffd9e2] text-[#e6007e]' : 'bg-[#e0e3e5] text-[#5f5e5e]'
                  }`}>
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#191c1e] truncate">{campaign.name}</p>
                    <p className="text-[10px] text-[#5f5e5e] font-medium">{campaign.bookings} bookings so far</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#e2bdc7] group-hover:text-[#e6007e] transition-colors" />
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveView('campaigns')}
              className="w-full mt-6 py-3 border border-[#e2bdc7] text-[#5f5e5e] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f7f9fb] transition-all"
            >
              View All History
            </button>
          </div>
        </div>

        {/* Secondary Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-[#e2bdc7] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-widest">Channel Efficiency</h3>
              <Info className="w-4 h-4 text-[#e2bdc7]" />
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f2f4f6" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#191c1e' }}
                  />
                  <Tooltip cursor={{ fill: '#f7f9fb' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#e6007e' : index === 1 ? '#6265f0' : '#484ad6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#e2bdc7] p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#e6007e]/5 rounded-full -mr-16 -mt-16"></div>
            <div className="w-16 h-16 bg-[#e6007e]/10 rounded-2xl flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-[#e6007e]" />
            </div>
            <h3 className="text-xl font-black text-[#191c1e] mb-2">Automate Your Offers</h3>
            <p className="text-xs text-[#5f5e5e] max-w-[240px] mb-6">AI-powered scheduling can increase your conversion rates by up to 14% based on peak traffic times.</p>
            <button className="px-8 py-3 bg-[#e6007e] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#e6007e]/20 hover:scale-105 active:scale-95 transition-all">
              Launch AI Planner
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    return (
      <div className="space-y-8 pb-10">
        {/* Analytics Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#191c1e] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#e6007e]/20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#e6007e] mb-2">Total Reach</p>
            <h3 className="text-4xl font-black mb-1">1.2M+</h3>
            <p className="text-xs text-[#5f5e5e] font-medium">Across all marketing channels</p>
            <div className="mt-6 flex items-center gap-2 text-[#e6007e]">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold">+12% from last month</span>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-[#e2bdc7] shadow-sm flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-widest">Conversion Funnel</h3>
              {[
                { label: 'Delivered', value: '98%', width: 'w-full', color: 'bg-[#191c1e]' },
                { label: 'Opened', value: '42%', width: 'w-[42%]', color: 'bg-[#6265f0]' },
                { label: 'Clicked', value: '18%', width: 'w-[18%]', color: 'bg-[#e6007e]' },
                { label: 'Booked', value: '4.5%', width: 'w-[4.5%]', color: 'bg-[#b90064]' },
              ].map((step) => (
                <div key={step.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-[#5f5e5e]">{step.label}</span>
                    <span className="text-[#191c1e]">{step.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: step.width }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-full rounded-full ${step.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block w-px bg-[#f2f4f6]"></div>
            <div className="flex-1 flex flex-col justify-center text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-[#ffd9e2] flex items-center justify-center mx-auto text-[#e6007e]">
                <Target className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-[#191c1e]">$12.4k</h4>
              <p className="text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest">Campaign Revenue</p>
              <p className="text-[10px] text-[#e6007e] font-bold">This Month</p>
            </div>
          </div>
        </div>

        {/* Audience Growth & ROI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-[#e2bdc7] p-6 shadow-sm">
            <h3 className="text-lg font-black text-[#191c1e] mb-8">Audience Growth</h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#8e6f77' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#8e6f77' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reach" 
                    stroke="#e6007e" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#e6007e', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#e2bdc7] p-6 shadow-sm">
            <h3 className="text-lg font-black text-[#191c1e] mb-8">Campaign ROI by Channel</h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#8e6f77' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#8e6f77' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f7f9fb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#e6007e' : '#191c1e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white rounded-3xl border border-[#e2bdc7] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#e2bdc7]">
            <h3 className="text-lg font-black text-[#191c1e]">Top Performing Offers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f9fb]">
                  <th className="px-6 py-4 text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest">Offer Code</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest">Revenue</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest">Bookings</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest">ROI</th>
                  <th className="px-6 py-4 text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {[
                  { code: 'GLOW20', revenue: '$4,250', bookings: 124, roi: '5.2x', status: 'High' },
                  { code: 'SUMMER50', revenue: '$3,100', bookings: 86, roi: '4.1x', status: 'Medium' },
                  { code: 'VIP_ACCESS', revenue: '$2,800', bookings: 42, roi: '6.8x', status: 'Very High' },
                  { code: 'RE_ENGAGE', revenue: '$1,200', bookings: 15, roi: '2.4x', status: 'Low' },
                ].map((row) => (
                  <tr key={row.code} className="hover:bg-[#f7f9fb] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-[#e6007e]" />
                        <span className="text-xs font-bold text-[#191c1e]">{row.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#191c1e]">{row.revenue}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#191c1e]">{row.bookings}</td>
                    <td className="px-6 py-4 text-xs font-black text-[#e6007e]">{row.roi}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        row.status === 'Very High' ? 'bg-emerald-100 text-emerald-700' :
                        row.status === 'High' ? 'bg-blue-100 text-blue-700' :
                        row.status === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAudiences = () => {
    return (
      <div className="space-y-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-[#e2bdc7] shadow-sm">
            <h3 className="text-sm font-black text-[#5f5e5e] uppercase tracking-widest mb-6">Audience Distribution</h3>
            <div className="space-y-6">
              {[
                { label: 'VIP Members', count: '2.4k', percent: 25, color: 'bg-[#e6007e]' },
                { label: 'Regulars', count: '5.1k', percent: 45, color: 'bg-[#6265f0]' },
                { label: 'New Leads', count: '3.2k', percent: 20, color: 'bg-blue-400' },
                { label: 'At Risk', count: '1.7k', percent: 10, color: 'bg-[#191c1e]' },
              ].map((segment) => (
                <div key={segment.label} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-[#191c1e]">{segment.label}</span>
                    <span className="text-xs font-black text-[#5f5e5e]">{segment.count}</span>
                  </div>
                  <div className="h-3 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${segment.percent}%` }}
                      className={`h-full rounded-full ${segment.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#f7f9fb] p-8 rounded-3xl border border-[#e2bdc7] flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-black text-[#191c1e] mb-2">Build Custom Segments</h3>
              <p className="text-xs text-[#5f5e5e] leading-relaxed">Create hyper-targeted lists based on visit frequency, average spend, or service preferences to maximize your ROI.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white border border-[#e2bdc7] rounded-full text-[10px] font-bold text-[#5f5e5e]">Last visit &gt; 30 days</span>
              <span className="px-3 py-1 bg-white border border-[#e2bdc7] rounded-full text-[10px] font-bold text-[#5f5e5e]">Total spend &gt; ₹5000</span>
              <span className="px-3 py-1 bg-white border border-[#e2bdc7] rounded-full text-[10px] font-bold text-[#5f5e5e]">Preferred: Facials</span>
            </div>
            <div className="mt-8 space-y-3">
              <button 
                onClick={() => setShowClientPicker(true)}
                className="w-full py-4 bg-[#e6007e] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#b90064] transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" /> {t.select_client}
              </button>
              <button className="w-full py-4 bg-[#191c1e] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                Create New Segment
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#e2bdc7] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#e2bdc7] flex items-center justify-between">
            <h3 className="text-lg font-black text-[#191c1e]">Active Segments</h3>
            <button className="text-[10px] font-black text-[#e6007e] uppercase tracking-widest">Manage All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#f2f4f6]">
            {[
              { name: 'VIP Skincare', users: 840, engagement: '72%', status: 'Active' },
              { name: 'Weekend Warriors', users: 1250, engagement: '45%', status: 'Active' },
              { name: 'Dormant (90d)', users: 2100, engagement: '12%', status: 'Draft' },
            ].map((item) => (
              <div key={item.name} className="p-6 space-y-4 hover:bg-[#f7f9fb] transition-colors group cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-[#f2f4f6] flex items-center justify-center text-[#191c1e] group-hover:bg-[#e6007e] group-hover:text-white transition-all">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {item.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#191c1e]">{item.name}</h4>
                  <p className="text-[10px] text-[#5f5e5e] font-medium">{item.users} members</p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-bold text-[#5f5e5e]">Engagement Rate</span>
                  <span className="text-xs font-black text-[#e6007e]">{item.engagement}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAutomation = () => {
    return (
      <div className="space-y-8 pb-10">
        <div className="bg-[#e6007e] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full -mb-32 -mr-32"></div>
          <div className="relative z-10 space-y-4 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              Automated Marketing
            </div>
            <h2 className="text-3xl font-black leading-tight">Put your growth on autopilot</h2>
            <p className="text-sm text-white/80 max-w-md">Schedule smart triggers that react to customer behavior in real-time. Never miss an opportunity to re-engage.</p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button className="px-6 py-3 bg-white text-[#e6007e] rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Get Started</button>
              <button className="px-6 py-3 bg-transparent border border-white/30 text-white rounded-xl font-black text-xs uppercase tracking-widest">Watch Tutorial</button>
            </div>
          </div>
          <div className="w-48 h-48 bg-white/10 rounded-3xl backdrop-blur-md flex items-center justify-center border border-white/20 relative z-10 shrink-0">
            <Clock className="w-24 h-24 text-white/30" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-widest">Active Workflows</h3>
              <button className="text-[10px] font-black text-[#e6007e] uppercase tracking-widest">+ New Workflow</button>
            </div>
            {[
              { name: 'Welcome Series', trigger: 'New Customer Sign-up', steps: 3, active: true, success: '84%' },
              { name: 'Birthday Surprise', trigger: 'Customer Birthday', steps: 1, active: true, success: '92%' },
              { name: 'Abandoned Cart', trigger: 'No booking for 7 days', steps: 2, active: false, success: '34%' },
            ].map((flow) => (
              <div key={flow.name} className="bg-white p-6 rounded-2xl border border-[#e2bdc7] shadow-sm flex items-center gap-6 group hover:border-[#e6007e] transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${flow.active ? 'bg-[#ffd9e2] text-[#e6007e]' : 'bg-[#f2f4f6] text-[#5f5e5e]'}`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-[#191c1e]">{flow.name}</h4>
                  <p className="text-[10px] text-[#5f5e5e] font-medium">Trigger: {flow.trigger}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-[#191c1e]">{flow.success}</p>
                  <p className="text-[9px] text-[#5f5e5e] font-bold uppercase tracking-tighter">Success</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${flow.active ? 'bg-[#e6007e]' : 'bg-[#e2bdc7]'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${flow.active ? 'right-1' : 'left-1'}`}></div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#e2bdc7] group-hover:text-[#e6007e]" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-[#e2bdc7] p-6 shadow-sm">
            <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-widest mb-6">Automation Health</h3>
            <div className="space-y-6">
              <div className="text-center p-6 bg-[#f7f9fb] rounded-2xl border border-[#e2bdc7]">
                <p className="text-3xl font-black text-[#191c1e]">94.2%</p>
                <p className="text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest mt-1">Delivery Success Rate</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-lg font-black text-emerald-700">1,240</p>
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Triggers Hit</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-lg font-black text-blue-700">458</p>
                  <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Conversions</p>
                </div>
              </div>
              <div className="pt-4 border-t border-[#f2f4f6]">
                <p className="text-[10px] text-[#5f5e5e] leading-relaxed">Your automations have saved you approximately <span className="font-bold text-[#191c1e]">24 hours</span> of manual work this week.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderViewContent = () => {
    if (activeView === 'dashboard') {
      return renderDashboard();
    }

    if (activeView === 'analytics') {
      return renderAnalytics();
    }

    if (activeView === 'audiences') {
      return renderAudiences();
    }

    if (activeView === 'automation') {
      return renderAutomation();
    }

    if (activeView === 'campaigns') {
      return (
        <>
          {/* Analytics Quick View */}
          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
            {[
              { label: t.campaigns, value: '124', color: 'text-[#e6007e]' },
              { label: t.audiences, value: '8.4k', color: 'text-[#6265f0]' },
              { label: 'Avg. Open Rate', value: '24%', color: 'text-[#191c1e]' },
              { label: t.bookings, value: '156', color: 'text-[#b90064]' },
            ].map((stat) => (
              <div key={stat.label} className="min-w-[180px] bg-white p-5 rounded-2xl border border-[#e2bdc7] shadow-sm flex-shrink-0">
                <p className="text-[10px] font-black text-[#5f5e5e] mb-1 uppercase tracking-widest">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Campaign Cards List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {historyData.filter(c => activeTab === 'All' || c.status === activeTab).map((campaign) => (
              <motion.div 
                layout
                key={campaign.id}
                className="bg-white rounded-2xl border border-[#e2bdc7] p-5 space-y-4 shadow-sm relative overflow-hidden group hover:border-[#b90064]/40 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-[#191c1e] mb-0.5">{campaign.name}</h3>
                    <p className="text-xs font-medium text-[#5f5e5e]">Target: {campaign.audience} • {campaign.type}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    campaign.status === 'Running' ? 'bg-[#ffd9e2] text-[#3e001e]' :
                    campaign.status === 'Scheduled' ? 'bg-[#e1e0ff] text-[#07006c]' :
                    campaign.status === 'Completed' ? 'bg-[#e0e3e5] text-[#191c1e]' :
                    'bg-[#f2f4f6] text-[#5a3f47]'
                  }`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="bg-[#f2f4f6] rounded-xl p-4 border border-[#e2bdc7]/50 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <Tag className="w-4 h-4 text-[#e6007e]" />
                    <span className="text-xs font-black text-[#e6007e] uppercase tracking-widest">{campaign.offer}</span>
                    <span className="text-[10px] text-[#5a3f47] font-medium">• {campaign.offerDesc}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center relative z-10">
                    <div>
                      <p className="text-[9px] font-black text-[#5f5e5e] uppercase tracking-widest mb-1">Sent</p>
                      <p className="text-sm font-bold text-[#191c1e]">{campaign.status === 'Draft' ? '--' : campaign.recipients.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#5f5e5e] uppercase tracking-widest mb-1">Opened</p>
                      <p className="text-sm font-bold text-[#191c1e]">{campaign.status === 'Draft' ? '--' : campaign.opened.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-[#5f5e5e] uppercase tracking-widest mb-1">Bookings</p>
                      <p className={`text-sm font-bold ${campaign.bookings > 0 ? 'text-[#e6007e]' : 'text-[#191c1e]'}`}>
                        {campaign.status === 'Draft' ? '--' : campaign.bookings}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#e2bdc7]/30">
                  <button className="text-[10px] font-black text-[#e6007e] uppercase tracking-widest hover:text-[#b90064] transition-colors">
                    {campaign.status === 'Draft' ? 'Edit Draft' : 'View Full Report'}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#5f5e5e] font-medium">{campaign.date}</span>
                    <button className="text-[#5f5e5e] hover:text-[#191c1e]">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      );
    }

    return (
      <div className="bg-white rounded-3xl p-12 border border-dashed border-[#e2bdc7] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#e2bdc7]">
          {activeView === 'analytics' ? <BarChart3 className="w-10 h-10" /> : <Layers className="w-10 h-10" />}
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#191c1e] capitalize">{activeView} module</h3>
          <p className="text-sm text-[#5f5e5e] max-w-xs mx-auto">This section is currently being processed. Full integration with live marketing data is coming in the next update.</p>
        </div>
        <button 
          onClick={() => setActiveView('campaigns')}
          className="px-6 py-2 bg-[#e6007e] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#e6007e]/20"
        >
          Return to Campaigns
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fb] font-['Inter'] relative">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-10 h-16 bg-white/80 backdrop-blur-md border-b border-[#e2bdc7]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden text-[#b90064]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-['Hanken_Grotesk'] text-2xl text-[#b90064] italic font-black">CampaignPulse</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-[#ffd9e2] text-[#e6007e]' : 'text-[#5f5e5e] hover:bg-[#f2f4f6]'}`}
            >
              <Bell className="w-6 h-6" />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#e6007e] rounded-full border-2 border-white"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-3xl border border-[#e2bdc7] shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-[#f2f4f6] flex justify-between items-center">
                      <h3 className="text-xs font-black text-[#191c1e] uppercase tracking-widest">{t.notifications || 'Notifications'}</h3>
                      <button className="text-[10px] font-bold text-[#e6007e]">Mark all read</button>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-4 border-b border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors cursor-pointer group ${n.unread ? 'bg-[#f7f9fb]/50' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-[#191c1e]">{n.title}</span>
                            <span className="text-[9px] text-[#5f5e5e]">{n.time}</span>
                          </div>
                          <p className="text-[10px] text-[#5f5e5e] leading-relaxed">{n.desc}</p>
                          {n.unread && <div className="mt-2 w-1.5 h-1.5 bg-[#e6007e] rounded-full"></div>}
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-3 bg-[#f7f9fb] text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest hover:text-[#e6007e]">View All Alerts</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`text-[#5f5e5e] p-2 rounded-full transition-colors ${showSettings ? 'bg-[#f2f4f6]' : 'hover:bg-[#f2f4f6]'}`}
            >
              <Settings className="w-6 h-6" />
            </button>

            <AnimatePresence>
              {showSettings && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-3xl border border-[#e2bdc7] shadow-2xl z-50 overflow-hidden p-4"
                  >
                    <h3 className="text-xs font-black text-[#191c1e] uppercase tracking-widest mb-4">{t.settings}</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-[#5f5e5e] uppercase tracking-widest mb-2">{t.lang}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setLanguage('EN')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${language === 'EN' ? 'bg-[#e6007e] text-white border-[#e6007e]' : 'bg-[#f2f4f6] text-[#5f5e5e] border-transparent'}`}
                          >
                            English
                          </button>
                          <button 
                            onClick={() => setLanguage('HI')}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${language === 'HI' ? 'bg-[#e6007e] text-white border-[#e6007e]' : 'bg-[#f2f4f6] text-[#5f5e5e] border-transparent'}`}
                          >
                            हिन्दी
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Side Navigation (Desktop Only) */}
      <nav className="fixed left-0 top-0 h-full z-40 pt-20 px-4 bg-white hidden md:flex flex-col w-64 border-r border-[#e2bdc7]">
        <div className="mb-8 px-4">
          <h2 className="text-xl font-['Hanken_Grotesk'] text-[#b90064] font-bold">Pulse Pro</h2>
          <p className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wider">Marketing Admin</p>
        </div>
        <ul className="space-y-2 flex-grow">
          {[
            { id: 'dashboard', label: t.dashboard, icon: BarChart3 },
            { id: 'campaigns', label: t.campaigns, icon: Send },
            { id: 'analytics', label: t.analytics, icon: Layers },
            { id: 'audiences', label: t.audiences, icon: Eye },
            { id: 'automation', label: t.automation, icon: Clock },
          ].map((item) => (
            <li key={item.id}>
              <button 
                onClick={() => handleSidebarClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-semibold text-sm ${
                  activeView === item.id 
                    ? 'bg-[#e6007e] text-white shadow-md' 
                    : 'text-[#5f5e5e] hover:bg-[#f2f4f6]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-auto pb-4">
          <button 
            onClick={onBack}
            className="w-full bg-[#e6007e] text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-[#b90064] transition-colors shadow-lg active:scale-95"
          >
            {t.create}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 px-4 md:ml-64 md:px-10 md:pt-24 max-w-7xl mx-auto w-full space-y-6 pb-32">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-['Hanken_Grotesk'] font-bold text-[#191c1e] capitalize">{t[activeView as keyof typeof t.EN]} {t.overview}</h1>
          <button className="p-2 bg-[#eceef0] rounded-full text-[#e6007e] shadow-sm border border-[#e2bdc7] hover:bg-[#e6e8ea]">
            <TuneIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Chips (Only show for campaigns) */}
        {activeView === 'campaigns' && (
          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-xs transition-all border ${
                  activeTab === tab 
                    ? 'bg-[#e6007e] text-white border-[#e6007e] shadow-sm' 
                    : 'bg-[#eceef0] text-[#191c1e] border-[#e2bdc7] hover:bg-[#e6e8ea]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {renderViewContent()}
        {renderClientPicker()}
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={onBack}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-[#e6007e] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 focus:outline-none ring-offset-2 ring-[#e6007e]/50 active:scale-95"
      >
        <span className="text-3xl font-bold">+</span>
      </button>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 md:left-auto md:right-10 md:translate-x-0 z-[100] bg-[#191c1e] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3"
          >
            <Info className="w-4 h-4 text-[#e6007e]" />
            <span className="text-xs font-bold uppercase tracking-widest">Switching to {activeView}...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe md:hidden bg-white/95 backdrop-blur-md border-t border-[#e2bdc7] rounded-t-2xl shadow-lg">
        {[
          { id: 'dashboard', label: t.dashboard, icon: Home },
          { id: 'campaigns', label: t.history, icon: Clock },
          { id: 'analytics', label: t.analytics, icon: BarChart3 },
          { id: 'menu', label: 'Menu', icon: Menu },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => handleSidebarClick(item.id)}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${
              activeView === item.id ? 'text-[#e6007e] scale-110' : 'text-[#5f5e5e]'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeView === item.id ? 'fill-current' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

