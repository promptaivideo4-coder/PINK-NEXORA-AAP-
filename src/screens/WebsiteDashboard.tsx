import React, { useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { 
  Settings, 
  Upload, 
  Eye, 
  CalendarCheck, 
  TrendingUp, 
  Minus, 
  TrendingDown, 
  Lock, 
  Zap, 
  FileEdit, 
  ImagePlus, 
  Users, 
  ArrowUpRight,
  CheckCircle,
  X,
  Palette,
  Sparkles,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WebsiteDashboard({ navigate }: NavigationProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [heroTitle, setHeroTitle] = useState('Hero Section Needs Update');
  const [heroSubtitle, setHeroSubtitle] = useState('Promote the new summer styling package.');
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, title: 'Homepage text updated', time: 'Today, 10:42 AM', author: 'Ananya', dotColor: 'bg-primary' },
    { id: 2, title: 'New gallery image added', time: 'Yesterday, 4:15 PM', author: 'You', dotColor: 'bg-surface-variant' },
    { id: 3, title: 'Published changes to live site', time: 'Mon, 9:00 AM', author: 'You', dotColor: 'bg-[#10B981]' },
  ]);

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setShowToast(true);
      const newActivity = {
        id: Date.now(),
        title: 'Published changes to live site',
        time: 'Just now',
        author: 'You',
        dotColor: 'bg-[#10B981]'
      };
      setRecentActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setTimeout(() => setShowToast(false), 3500);
    }, 1000);
  };

  const handleSaveHeroSection = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEditModal(false);
    const newActivity = {
      id: Date.now(),
      title: 'Hero section content updated',
      time: 'Just now',
      author: 'You',
      dotColor: 'bg-primary'
    };
    setRecentActivities(prev => [newActivity, ...prev.slice(0, 4)]);
  };

  return (
    <Layout currentScreen="website-dashboard" navigate={navigate} title="Reviews & Feedback" showSettings>
      <div className="px-5 md:px-10 py-8 flex flex-col gap-8 max-w-[1200px] mx-auto w-full relative">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg border border-emerald-400/30 flex items-center gap-3 text-sm font-semibold"
            >
              <CheckCircle className="w-5 h-5 text-white shrink-0" />
              <span>Website changes successfully published to live site!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header & Primary Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Website Management</p>
            <h2 className="text-[32px] md:text-[40px] md:leading-[48px] font-bold text-on-surface tracking-tight">Dashboard</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2.5 rounded-full border border-outline-variant shadow-sm w-full sm:w-auto justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <span className="text-[13px] font-semibold text-on-surface">Live</span>
            </div>
            
            <button 
              onClick={() => navigate('theme-selection')}
              className="w-full sm:w-auto bg-surface-container-high hover:bg-surface-variant text-on-surface font-semibold text-[15px] px-4 py-2.5 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 border border-surface-variant"
            >
              <Palette className="w-4 h-4 text-primary" />
              <span>Themes</span>
            </button>

            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full sm:w-auto bg-primary-container text-white font-semibold text-[15px] px-6 py-2.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isPublishing ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
              <span>{isPublishing ? 'Publishing...' : 'Publish Changes'}</span>
            </button>
          </div>
        </div>

        {/* Metrics Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Metric Card 1 */}
          <div className="bg-surface-container-lowest p-5 rounded-[18px] border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform flex flex-col justify-between min-h-[128px] relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="text-[13px] font-semibold text-on-surface-variant">Total Visitors</span>
              <Eye className="w-5 h-5 text-outline-variant" />
            </div>
            <div className="z-10">
              <p className="text-[32px] font-bold text-on-surface tracking-tight">12.4K</p>
              <p className="text-[13px] font-medium text-[#10B981] flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> +14% this month
              </p>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
          </div>

          {/* Metric Card 2 */}
          <div className="bg-surface-container-lowest p-5 rounded-[18px] border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform flex flex-col justify-between min-h-[128px] relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="text-[13px] font-semibold text-on-surface-variant">Web Bookings</span>
              <CalendarCheck className="w-5 h-5 text-outline-variant" />
            </div>
            <div className="z-10">
              <p className="text-[32px] font-bold text-on-surface tracking-tight">342</p>
              <p className="text-[13px] font-medium text-[#10B981] flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> +8% this month
              </p>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary-container/5 rounded-full blur-xl group-hover:bg-secondary-container/10 transition-colors"></div>
          </div>

          {/* Metric Card 3 */}
          <div className="bg-surface-container-lowest p-5 rounded-[18px] border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform flex flex-col justify-between min-h-[128px] relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="text-[13px] font-semibold text-on-surface-variant">Conversion Rate</span>
              <TrendingUp className="w-5 h-5 text-outline-variant" />
            </div>
            <div className="z-10">
              <p className="text-[32px] font-bold text-on-surface tracking-tight">2.8%</p>
              <p className="text-[13px] font-medium text-outline flex items-center gap-1 mt-1">
                <Minus className="w-3.5 h-3.5" /> Steady
              </p>
            </div>
          </div>

          {/* Metric Card 4 */}
          <div className="bg-surface-container-lowest p-5 rounded-[18px] border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform flex flex-col justify-between min-h-[128px] relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="text-[13px] font-semibold text-on-surface-variant">Avg Session</span>
              <TrendingUp className="w-5 h-5 text-outline-variant" />
            </div>
            <div className="z-10">
              <p className="text-[32px] font-bold text-on-surface tracking-tight">2m 14s</p>
              <p className="text-[13px] font-medium text-error flex items-center gap-1 mt-1">
                <TrendingDown className="w-3.5 h-3.5" /> -2s this week
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area: Site Preview & Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-8 flex flex-col gap-8">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow h-[500px] md:h-[600px] flex flex-col relative">
              {/* Browser Header Mockup */}
              <div className="h-12 border-b border-outline-variant bg-surface-container-low flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                </div>
                <div className="mx-auto bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-1.5 flex items-center gap-2 w-1/2">
                  <Lock className="w-3.5 h-3.5 text-outline" />
                  <span className="text-[11px] font-medium text-on-surface-variant truncate">luxe-salon.com</span>
                </div>
              </div>
              {/* Preview Content Area */}
              <div className="flex-1 bg-surface-bright relative w-full h-full group">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFXEHHTvSMVOZAhg1vqZPl0x8g-JZO6IFtTPCp-YD5IRsZdG21-2bJMEZBUvEv8Ona49XdoRvtK2sg8DYZpiS57yEf_MvnHl2rcQePRk05zTqEe-yeRJS0QlDvelxiZy9KZR2iWuD3aXtrxhCyrGT9P9oMohNJFoDcO_D2fV1YRJnF_WOvmXxAbO-bsQHH205-nvxSxtg_dOwmiQizz1JtlaxtM1cAIM4Y_PMmixTfA3RP9swwTXPT12dWrl1-gXjKr7r3n770ops" 
                  alt="Website Preview" 
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Glass Panel */}
                <div className="absolute inset-x-4 md:inset-x-8 bottom-4 md:bottom-8 bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 flex flex-col md:flex-row justify-between items-center gap-4 opacity-100 transition-all duration-300 shadow-lg">
                  <div>
                    <h3 className="text-[18px] font-bold text-on-surface mb-1">{heroTitle}</h3>
                    <p className="text-[13px] text-on-surface-variant font-medium">{heroSubtitle}</p>
                  </div>
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="bg-secondary/10 text-secondary border border-secondary/20 px-5 py-2.5 rounded-xl text-[15px] font-bold hover:bg-secondary/20 transition-colors w-full md:w-auto shrink-0 flex items-center justify-center gap-2"
                  >
                    <FileEdit className="w-4 h-4" />
                    <span>Edit Section</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area: Quick Actions & Status */}
          <div className="md:col-span-4 flex flex-col gap-8">
            
            {/* Quick Actions */}
            <div className="bg-surface-container-lowest rounded-[18px] border border-outline-variant p-6 shadow-sm">
              <h3 className="text-[20px] font-semibold text-on-surface mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> 
                Quick Actions
              </h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-surface-container-low transition-colors text-left border border-transparent hover:border-outline-variant group"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
                    <FileEdit className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[15px] font-semibold text-on-surface group-hover:text-primary transition-colors">Edit Homepage</p>
                    <p className="text-[13px] font-medium text-on-surface-variant">Modify layout and hero text</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('website-gallery')}
                  className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-surface-container-low transition-colors text-left border border-transparent hover:border-outline-variant group"
                >
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[15px] font-semibold text-on-surface group-hover:text-primary transition-colors">Update Gallery</p>
                    <p className="text-[13px] font-medium text-on-surface-variant">Add recent work photos</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('staff')}
                  className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-surface-container-low transition-colors text-left border border-transparent hover:border-outline-variant group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[15px] font-semibold text-on-surface group-hover:text-primary transition-colors">Team Profiles</p>
                    <p className="text-[13px] font-medium text-on-surface-variant">Manage staff bios</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-surface-container-lowest rounded-[18px] border border-outline-variant p-6 shadow-sm flex-1">
              <h3 className="text-[20px] font-semibold text-on-surface mb-6">Recent Activity</h3>
              <div className="relative border-l-2 border-outline-variant/30 ml-3 space-y-8 pb-2">
                {recentActivities.map((act) => (
                  <div key={act.id} className="relative pl-6">
                    <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ${act.dotColor} ring-4 ring-surface-container-lowest`}></span>
                    <p className="text-[14px] font-semibold text-on-surface">{act.title}</p>
                    <p className="text-[12px] font-medium text-on-surface-variant mt-1">{act.time} by {act.author}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Hero Section Edit Modal */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-lg shadow-xl"
              >
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-surface-variant">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <FileEdit className="w-5 h-5 text-primary" />
                    <span>Edit Hero Section</span>
                  </h3>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveHeroSection} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">Headline</label>
                    <input 
                      type="text" 
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">Subtitle / Promotion</label>
                    <textarea 
                      rows={3}
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container-high text-on-surface hover:bg-surface-variant"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 flex items-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}

