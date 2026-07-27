import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  IndianRupee, 
  Sparkles, 
  Send, 
  ChevronRight,
  TrendingUp,
  BarChart2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SkeletonShowcase({ navigate }: NavigationProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const simulateRefresh = () => {
    setIsRefreshing(true);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsRefreshing(false);
    }, 2200);
  };

  useEffect(() => {
    // Initial loading state simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout currentScreen="skeleton-showcase" navigate={navigate} title="System Loading">
      <div className="px-4 py-6 max-w-md mx-auto w-full flex flex-col gap-6 pb-32">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              System Loading &amp; Skeletons
            </h1>
            <p className="text-sm text-on-surface-variant font-medium mt-1">
              Visual shimmer placeholders indicating data retrieval and hydration states.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Switch */}
            <button
              onClick={() => setIsLoading(!isLoading)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                isLoading 
                  ? 'bg-primary text-white border-primary shadow-xs' 
                  : 'bg-surface-container-high text-on-surface border-surface-variant hover:bg-surface-variant'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Skeleton View Active' : 'Show Skeleton Mode'}</span>
            </button>

            {/* Refresh Simulation */}
            <button
              onClick={simulateRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-surface-container-lowest border border-surface-variant hover:border-outline text-on-surface text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span>Simulate Fetch</span>
            </button>
          </div>
        </div>

        {/* Shimmer Animation CSS */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .skeleton-surface {
            background: linear-gradient(to right, #f6f3f2 4%, #ebe7e7 25%, #f6f3f2 36%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite linear;
          }
        `}</style>

        {/* Bento Grid Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Bento Box 1: Floating Stats Card Skeleton */}
          <div className="md:col-span-4 bg-surface-container-lowest rounded-[18px] p-6 border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[160px]">
            {isLoading ? (
              <div className="flex flex-col gap-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="skeleton-surface h-5 w-28 rounded-full" />
                  <div className="skeleton-surface h-8 w-8 rounded-full" />
                </div>
                <div className="skeleton-surface h-10 w-36 rounded-lg" />
                <div className="flex items-center gap-2 mt-1">
                  <div className="skeleton-surface h-4 w-14 rounded-full" />
                  <div className="skeleton-surface h-4 w-24 rounded-full" />
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Gross Revenue</span>
                  <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-on-surface">₹12,45,000.00</div>
                <div className="flex items-center gap-2 text-xs font-bold text-sky-600">
                  <span className="bg-sky-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +14.2%
                  </span>
                  <span className="text-on-surface-variant font-medium">vs last month</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bento Box 2: Appointment Card Skeleton */}
          <div className="md:col-span-8 bg-surface-container-lowest rounded-[18px] p-6 border border-surface-variant border-l-4 border-l-primary shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between min-h-[160px]">
            {isLoading ? (
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center w-full justify-between">
                <div className="flex items-center gap-4 w-full">
                  <div className="skeleton-surface w-16 h-16 rounded-full shrink-0" />
                  <div className="space-y-3 w-full max-w-sm">
                    <div className="skeleton-surface h-6 w-3/4 rounded-lg" />
                    <div className="skeleton-surface h-4 w-1/2 rounded-full" />
                    <div className="flex gap-2 pt-1">
                      <div className="skeleton-surface h-7 w-20 rounded-full" />
                      <div className="skeleton-surface h-7 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end space-y-2 shrink-0">
                  <div className="skeleton-surface h-6 w-20 rounded-lg" />
                  <div className="skeleton-surface h-4 w-12 rounded-full" />
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBW4CtAT2tdd2YuZ6WouiFS1KneWa5Q8ObiRiC-kQe6wrYErarvNUTcIiFJFquX5zhzP5OcRpEjwAGlR5H-euBjLZQLc9nbZ2tiqAULzn4RPxHD_ZtT50Td2QraviPhxh6Pwgbv_A22rxkKTNj_sGqQP7lbIDn9CFkTtdnaobzwzcGXLU9DAQheRlCFlFhSxN9VY698qd8ZI12BG9DxPU759d3XZYDL3Wgb9l45H40fbB-RNnG_ABbXTgGNIkDZ1bq94eJsyekXh0I" 
                    alt="Kavita Sen" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-fixed shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-on-surface">Kavita Sen</h4>
                      <span className="bg-primary-container/10 text-primary-container text-[11px] font-bold px-2 py-0.5 rounded-full">VIP</span>
                    </div>
                    <p className="text-xs font-semibold text-on-surface-variant">Balayage &amp; Signature Cut • 2h 30m</p>
                    <div className="flex items-center gap-2 pt-1 text-xs font-bold text-on-surface">
                      <span className="flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-primary" /> 14:30 PM
                      </span>
                      <span className="flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-full">
                        <User className="w-3.5 h-3.5 text-primary" /> Stylist: Ananya
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-surface-variant">
                  <span className="text-xl font-black text-primary">₹3,500.00</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">Confirmed</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bento Box 3: Complex List / Directory Skeleton */}
          <div className="md:col-span-12 bg-surface-container-lowest rounded-[18px] border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-surface-variant flex justify-between items-center bg-surface-container-low/40">
              <h3 className="text-sm font-extrabold text-on-surface">Client Activity Log</h3>
              <span className="text-xs text-on-surface-variant font-medium">Auto-updated</span>
            </div>

            {isLoading ? (
              <div className="divide-y divide-surface-variant">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="skeleton-surface h-12 w-12 rounded-lg shrink-0" />
                      <div className="space-y-2 flex-grow">
                        <div className="skeleton-surface h-5 w-1/3 min-w-[120px] rounded-lg" />
                        <div className="skeleton-surface h-4 w-1/4 min-w-[80px] rounded-full" />
                      </div>
                    </div>
                    <div className="skeleton-surface h-8 w-8 rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-surface-variant">
                <div className="p-4 flex items-center justify-between gap-4 hover:bg-surface-container-low/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-fixed/30 text-primary flex items-center justify-center font-bold shrink-0">
                      SJ
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-on-surface">Sarita Joshi</h5>
                      <p className="text-xs text-on-surface-variant font-medium">Booked Olaplex Treatment for Tomorrow</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </div>

                <div className="p-4 flex items-center justify-between gap-4 hover:bg-surface-container-low/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-tertiary-fixed/30 text-tertiary flex items-center justify-center font-bold shrink-0">
                      MC
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-on-surface">Manish Chandra</h5>
                      <p className="text-xs text-on-surface-variant font-medium">Completed Signature Hydro Facial</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </div>

                <div className="p-4 flex items-center justify-between gap-4 hover:bg-surface-container-low/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary-fixed/30 text-secondary flex items-center justify-center font-bold shrink-0">
                      CM
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-on-surface">Chitra Mehta</h5>
                      <p className="text-xs text-on-surface-variant font-medium">Purchased Aftercare Luxury Set (₹5,500.00)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Bento Box 4: Chart Skeleton */}
          <div className="md:col-span-6 bg-surface-container-lowest rounded-[18px] p-6 border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] h-64 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-extrabold text-on-surface">Daily Traffic Trends</h3>
              <BarChart2 className="w-4 h-4 text-on-surface-variant" />
            </div>

            {isLoading ? (
              <div className="flex-grow flex items-end gap-3 w-full h-full pt-4">
                <div className="skeleton-surface w-full h-1/4 rounded-t-sm" />
                <div className="skeleton-surface w-full h-2/4 rounded-t-sm" />
                <div className="skeleton-surface w-full h-1/3 rounded-t-sm" />
                <div className="skeleton-surface w-full h-3/4 rounded-t-sm" />
                <div className="skeleton-surface w-full h-full rounded-t-sm" />
                <div className="skeleton-surface w-full h-2/3 rounded-t-sm" />
                <div className="skeleton-surface w-full h-1/2 rounded-t-sm" />
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex items-end gap-3 w-full h-full pt-4">
                <div className="bg-primary-fixed/40 hover:bg-primary transition-colors w-full h-[30%] rounded-t-sm" />
                <div className="bg-primary-fixed/40 hover:bg-primary transition-colors w-full h-[55%] rounded-t-sm" />
                <div className="bg-primary-fixed/40 hover:bg-primary transition-colors w-full h-[40%] rounded-t-sm" />
                <div className="bg-primary-fixed/40 hover:bg-primary transition-colors w-full h-[80%] rounded-t-sm" />
                <div className="bg-primary w-full h-[95%] rounded-t-sm shadow-xs" />
                <div className="bg-primary-fixed/40 hover:bg-primary transition-colors w-full h-[65%] rounded-t-sm" />
                <div className="bg-primary-fixed/40 hover:bg-primary transition-colors w-full h-[50%] rounded-t-sm" />
              </motion.div>
            )}

            <div className="flex justify-between mt-3 px-1 text-[11px] font-bold text-on-surface-variant">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          {/* Bento Box 5: Form Controls Skeleton */}
          <div className="md:col-span-6 bg-surface-container-lowest rounded-[18px] p-6 border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-4">
            <h3 className="text-sm font-extrabold text-on-surface">Quick Express Booking</h3>

            {isLoading ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="skeleton-surface h-4 w-20 rounded-full mb-1" />
                  <div className="skeleton-surface h-12 w-full rounded-[14px]" />
                </div>
                <div className="space-y-1">
                  <div className="skeleton-surface h-4 w-24 rounded-full mb-1" />
                  <div className="skeleton-surface h-12 w-full rounded-[14px]" />
                </div>
                <div className="skeleton-surface h-12 w-full rounded-[16px] mt-2" />
              </div>
            ) : (
              <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Select Service</label>
                  <select className="w-full h-11 px-3 bg-surface-container-low border border-surface-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Signature Balayage &amp; Style (₹3,500)</option>
                    <option>Olaplex Deep Conditioning (₹1,200)</option>
                    <option>Express Cut &amp; Blowdry (₹2,500)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Client Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter full name" 
                    defaultValue="Pooja Hegde"
                    className="w-full h-11 px-3 bg-surface-container-low border border-surface-variant rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button 
                  type="button" 
                  className="w-full h-11 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reserve Appointment</span>
                </button>
              </motion.form>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
