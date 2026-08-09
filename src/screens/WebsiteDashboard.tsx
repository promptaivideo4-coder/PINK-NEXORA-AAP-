import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { NavigationProps, WebsiteConfig } from '../types';
import WebsiteConfigEditor from '../components/WebsiteConfigEditor';
import LivePreview from '../components/LivePreview';
import { renderSiteHTML } from '../lib/siteTemplates';
import { supabase } from '../lib/supabase';
import {
  fetchMyShop,
  fetchPublishedWebsite,
  publishShopWebsite,
  listServices,
  validateSalonForPublish,
  MyShop,
} from '../lib/shopRepository';
import { 
  Eye, 
  CalendarCheck, 
  TrendingUp, 
  Minus, 
  TrendingDown, 
  Zap, 
  FileEdit, 
  ImagePlus, 
  Users, 
  ArrowUpRight,
  Palette,
  Copy,
  Check,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

export default function WebsiteDashboard({ navigate }: NavigationProps) {
  const { activeTheme } = useTheme();
  const lastThemeId = useRef(activeTheme.id);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'services' | 'reviews' | 'contact' | 'theme' | 'layout'>('hero');
  const [currentShop, setCurrentShop] = useState<MyShop | null>(null);
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>({
    businessName: 'Luxe Salon',
    tagline: 'Experience master artistry',
    heroTitle: 'Redefining Hair & Elegance',
    heroSubtitle: 'Experience master artistry in a sanctuary designed for pure relaxation.',
    heroImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200',
    heroCtaText: 'Book Now',
    heroCtaLink: '/book',
    services: [{ id: '1', name: 'Signature Haircut', price: '₹600', duration: '60m', category: 'Hair' }],
    reviews: [{ id: '1', customerName: 'Ananya', rating: 5, comment: 'Great!' }],
    contact: { address: 'Shop 12, Main Bazar, Jaipur', phone: '9876543210', socialLinks: { instagram: '', facebook: '', tiktok: '' }, openingHours: 'Mon–Sun: 10:00 AM – 8:00 PM', locationMap: '' },
    theme: { 
      primaryColor: activeTheme.primaryColor, 
      accentColor: activeTheme.accentColor,
      textColor: activeTheme.textColor,
      backgroundColor: activeTheme.bgColor, 
      fontStyle: activeTheme.fontStyle.replace('font-', ''),
      fontSizeBase: 16,
      fontSizeHeading: 40
    },
    layoutToggles: {
      showHero: true,
      showServices: true,
      showReviews: true,
      showContact: true,
      showGallery: true,
      showFooter: true,
    }
  });

  // Load live shop data and existing published website from Supabase
  useEffect(() => {
    async function loadLiveSiteData() {
      try {
        const shop = await fetchMyShop(supabase);
        if (shop) {
          setCurrentShop(shop);
          const published = await fetchPublishedWebsite(supabase, shop.id);
          const dbServices = await listServices(supabase, shop.id).catch(() => []);

          setWebsiteConfig((prev) => {
            const next = { ...prev };
            if (shop.name) next.businessName = shop.name;
            if (shop.address) next.contact.address = shop.address;
            if (shop.phone) next.contact.phone = shop.phone;

            if (published && published.config && typeof published.config === 'object') {
              return {
                ...next,
                ...published.config,
                theme: {
                  ...next.theme,
                  ...(published.config.theme || {}),
                },
                layoutToggles: {
                  ...next.layoutToggles,
                  ...(published.config.layoutToggles || {}),
                },
              };
            }

            if (dbServices.length > 0) {
              next.services = dbServices.map((s) => ({
                id: s.id,
                name: s.name,
                price: `₹${(s.pricePaise / 100).toFixed(0)}`,
                duration: `${s.durationMinutes}m`,
                category: 'Hair',
              }));
            }

            return next;
          });

          if (published && published.isPublished && published.slug) {
            setPublishedUrl(`/salons/${published.slug}`);
          }
        }
      } catch (err) {
        console.warn('Live website data load:', err);
      }
    }
    void loadLiveSiteData();
  }, []);

  useEffect(() => {
    if (lastThemeId.current !== activeTheme.id) {
      setWebsiteConfig(prev => ({
        ...prev,
        theme: {
          primaryColor: activeTheme.primaryColor,
          accentColor: activeTheme.accentColor,
          textColor: activeTheme.textColor,
          backgroundColor: activeTheme.bgColor,
          fontStyle: activeTheme.fontStyle.replace('font-', ''),
          fontSizeBase: activeTheme.fontSizeBase || 16,
          fontSizeHeading: activeTheme.fontSizeHeading || 40
        }
      }));
      lastThemeId.current = activeTheme.id;
    }
  }, [activeTheme]);
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, title: 'Homepage text updated', time: 'Today, 10:42 AM', author: 'Ananya', dotColor: 'bg-primary' },
    { id: 2, title: 'New gallery image added', time: 'Yesterday, 4:15 PM', author: 'You', dotColor: 'bg-surface-variant' },
    { id: 3, title: 'Published changes to live site', time: 'Mon, 9:00 AM', author: 'You', dotColor: 'bg-[#10B981]' },
  ]);

  const liveUrl = "https://luxe-salon-app.web.app";
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getSlug = () => {
    const slug = (websiteConfig.businessName || currentShop?.name || 'mysalon')
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'mysalon';
    return slug;
  };

  const handleOpenPreviewModal = () => {
    setShowSuccessModal(true);
  };

  const confirmAndPublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      const html = renderSiteHTML(websiteConfig, activeTheme.id);
      const res = await publishShopWebsite(supabase, {
        slug: getSlug(),
        templateKey: activeTheme.id,
        config: websiteConfig as any,
        html,
      });

      if (res.ok && res.slug) {
        setPublishedUrl(`/salons/${res.slug}`);
        setShowSuccessModal(false);
        setRecentActivities((prev) => [
          {
            id: Date.now(),
            title: `Website published live (slug: ${res.slug})`,
            time: 'Just now',
            author: 'You',
            dotColor: 'bg-[#10B981]',
          },
          ...prev.slice(0, 2),
        ]);
      } else {
        setPublishError(res.error || 'Unknown publish error');
      }
    } catch (e) {
      setPublishError(String(e && (e as Error).message ? (e as Error).message : e));
    } finally {
      setIsPublishing(false);
    }
  };

  const copyLink = async () => {
    if (!publishedUrl) return;
    try {
      const fullUrl = new URL(publishedUrl, window.location.origin).toString();
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Layout currentScreen="website-dashboard" navigate={navigate} title="Reviews & Feedback" showSettings>
      <div className="px-4 py-6 flex flex-col gap-8 max-w-md mx-auto w-full relative">
        
        {/* Preview Before Publish Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[100] bg-surface-container-lowest flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Interactive Preview</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowSuccessModal(false)} className="px-4 py-2 rounded-xl bg-surface-variant">Back to Edit</button>
                    <button onClick={confirmAndPublish} disabled={isPublishing} className="px-4 py-2 rounded-xl bg-primary text-white disabled:opacity-70">
                      {isPublishing ? 'Publishing...' : 'Confirm & Publish Live'}
                    </button>
                </div>
              </div>
              {publishError && (
                <div className="px-4 py-3 bg-error/10 border-b border-error/20 text-error text-sm font-semibold flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>⚠️ {publishError}</span>
                  </div>
                  {publishError.toLowerCase().includes('location') && (
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        navigate('shop-location');
                      }}
                      className="text-xs font-bold underline text-left mt-1 text-primary"
                    >
                      → Go to Set Shop Location
                    </button>
                  )}
                  {publishError.toLowerCase().includes('profile') && (
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        navigate('profile');
                      }}
                      className="text-xs font-bold underline text-left mt-1 text-primary"
                    >
                      → Complete Profile in Settings
                    </button>
                  )}
                </div>
              )}
              <div className="flex-1 overflow-auto p-4">
                <LivePreview config={websiteConfig} />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Publish Success Modal — real live URL */}
        <AnimatePresence>
          {publishedUrl && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant">
                <div className="bg-emerald-600 px-6 py-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
                    <Check className="w-9 h-9 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">🎉 Your website is LIVE!</h2>
                  <p className="text-emerald-100 text-sm mt-1">
                    Template <b>{activeTheme.name}</b> — {websiteConfig.businessName}
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Live URL — kisi ko bhi bhejein</p>
                    <div className="flex items-center gap-2 bg-surface-container-high rounded-xl p-2 border border-outline-variant">
                      <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-primary font-bold text-sm truncate px-2">
                        {publishedUrl}
                      </a>
                      <button onClick={copyLink} className="px-3 py-2 rounded-lg bg-surface-variant hover:bg-surface-container-high transition-colors shrink-0" title="Copy link">
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    {copied && <p className="text-emerald-600 text-xs font-bold mt-1">✅ Link copied!</p>}
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90"
                    >
                      <ExternalLink className="w-4 h-4" /> View Live Site
                    </a>
                    <button
                      onClick={() => setPublishedUrl(null)}
                      className="px-4 py-3 rounded-xl bg-surface-variant text-on-surface font-bold text-sm"
                    >
                      Done
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant text-center">
                    💡 Naya template select karke dubara publish karo — purana live link apni jagah rahega, naya alag link banega.
                  </p>
                </div>
              </div>
            </div>
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
              onClick={handleOpenPreviewModal}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[600px]" id="website-editor">
                <WebsiteConfigEditor config={websiteConfig} onChange={setWebsiteConfig} activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] overflow-hidden shadow-sm h-full">
                    <LivePreview config={websiteConfig} />
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
                  onClick={() => {
                    setActiveTab('hero');
                    document.getElementById('website-editor')?.scrollIntoView({ behavior: 'smooth' });
                  }}
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

        {/* Hero Section Edit Modal removed as it is now integrated into the main editor */}
      </div>
    </Layout>
  );
}

