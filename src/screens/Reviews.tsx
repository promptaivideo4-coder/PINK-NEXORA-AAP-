import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Filter, 
  Search, 
  CornerDownRight, 
  X, 
  Sparkles,
  Share2,
  Clock,
  ThumbsUp,
  UserCheck,
  Wand2,
  RefreshCw,
  Check,
  Copy,
  Bookmark,
  Plus,
  Edit3,
  Trash2,
  Save,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  customerInitials?: string;
  timeAgo: string;
  rating: number;
  service: string;
  comment: string;
  type: '5star' | '4star' | 'critical' | 'unreplied';
  replied: boolean;
  replyText?: string;
  replyDate?: string;
  isResolved?: boolean;
  statusBorder?: 'green' | 'red' | 'default';
}

interface SavedReply {
  id: string;
  title: string;
  category: 'General' | 'Apology' | 'Promotion' | 'Stylist Praise';
  text: string;
}

const initialReviews: Review[] = [
  {
    id: 'rev-1',
    customerName: 'Suman G.',
    customerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyamfgVHEFfNUwHoBFHMzlxXIXNRz7pgW1XewyxhXLuQCekKzaJgg80c6oXwCgbKLYxOVKaP1GWvkaC3tb558V2elM2uuVQNT7LFZynb6wP-pfK-TsNJ3N1dXZH4eYvq-hvdkN8F9qA4jM_Idd54OwkEMuSKk7Mh9mLJHUehYdrPRc6NoDkJL5OghshpXpI7s5VecRmT9B3HSHqltg2bKYJTA1N01V2hV0i38kCC2lxQXGQp_HvQhPM2u0zxDuErElIavNtrB57Pg',
    timeAgo: '2 days ago',
    rating: 5,
    service: 'Balayage & Tone',
    comment: '"The balayage service was incredible! Elena is a true artist. She really listened to what I wanted and delivered perfectly. The salon atmosphere is so relaxing and luxurious."',
    type: '5star',
    replied: false,
    statusBorder: 'green'
  },
  {
    id: 'rev-2',
    customerName: 'Michael T.',
    customerInitials: 'M',
    timeAgo: '1 week ago',
    rating: 5,
    service: 'Signature Cut',
    comment: '"Always a fantastic experience. The attention to detail is unmatched, and I always leave feeling refreshed. Highly recommend Marcus for mens cuts!"',
    type: '5star',
    replied: true,
    replyText: 'Thank you Michael! Marcus and the team love having you at Nexora. See you next month!',
    replyDate: '6 days ago',
    statusBorder: 'green'
  },
  {
    id: 'rev-3',
    customerName: 'Jessica R.',
    customerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDELI09ZNOrGv45IgrLVGbRbQjK0MGiqgG8uc5GJCiZEGjSyN-EXlca0-INuxWJuon1HvdF12dNDY5RuIr07jjafSUsZITa16JfGbd20c62wO_TveMSQ8znaEYg6qY3c_bvG3itRNLmhiXnJuxFZIgBRrYxs7KpIOVGygzBKLtb1eJk9VOMxNuv2jwY9xXXR-n8UlgxdgcZwKil6gkcaVFYV7BATKJKCAzL0a2idf4GHIC54I3xOKBG7Qz-87HZgg8f3Bwa4qV2kmI',
    timeAgo: '3 weeks ago',
    rating: 2,
    service: 'Express Blowout',
    comment: '"The stylist was a bit rushed today and my hair didn\'t hold the style as long as it usually does. Usually I have a great experience, but this time fell short."',
    type: 'critical',
    replied: false,
    isResolved: false,
    statusBorder: 'red'
  },
  {
    id: 'rev-4',
    customerName: 'Eleanor Vance',
    customerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBEsXkeAiVpvmbW8Yi3JPENw2qM0ItwZpAz4hWWf5JnqazR2ARjy_t6e3sGZ-IMhBnUF8OsvAHl6q6JYVrXk9Q8OHZTOZCe-AQzwWHjpvs8bmrqSQnZ_XPtnUvJN2UFt-H9MLYJjZaDBXCA9Nb7ErMP742bTh86O_dY0lB6onIk_T893uD5rwxcDAwH3aRDKAR-VoFl5jo80ld4dY2JKpW_ozzD-e6OWnTdEz0_LUJ5c9jZAAO6wEqngX_Dzq7HKBM_a2ZnuPck9E',
    timeAgo: '1 month ago',
    rating: 5,
    service: 'Full Highlights & Treatment',
    comment: '"Nexora is the absolute best salon in town. My hair feels healthier than ever after the deep hydration treatment!"',
    type: '5star',
    replied: true,
    replyText: 'Dear Eleanor, you are always such a joy to host! Thank you for trusting us with your hair journey.',
    replyDate: '3 weeks ago',
    statusBorder: 'green'
  },
  {
    id: 'rev-5',
    customerName: 'David K.',
    customerInitials: 'D',
    timeAgo: '1 month ago',
    rating: 4,
    service: 'Beard Trim & Facial',
    comment: '"Great service and friendly staff. Parking was a little tricky during peak time, but the service itself was top notch."',
    type: '4star',
    replied: false,
    statusBorder: 'default'
  }
];

const defaultSavedReplies: SavedReply[] = [
  {
    id: 'sr-1',
    title: 'Thank You & Rebook',
    category: 'General',
    text: 'Thank you so much for your glowing review! It was an absolute pleasure hosting you at Nexora. We look forward to welcoming you back for your next visit!'
  },
  {
    id: 'sr-2',
    title: 'Apology & Manager Reach Out',
    category: 'Apology',
    text: 'We sincerely apologize that your visit fell short of our high standards. Please reach out to our salon manager directly at manager@nexora.com so we can address your feedback and arrange a complimentary touch-up.'
  },
  {
    id: 'sr-3',
    title: 'Special Loyalty Promo',
    category: 'Promotion',
    text: 'Thank you for taking the time to share your experience! As a thank you, mention this review during your next appointment to receive 15% off your treatment.'
  },
  {
    id: 'sr-4',
    title: 'Stylist Team Shoutout',
    category: 'Stylist Praise',
    text: 'Thank you for the wonderful feedback! Our team works passionately to create luxury salon experiences, and we will be sure to share your kind words with your stylist.'
  }
];

export default function Reviews({ navigate }: NavigationProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [activeFilter, setActiveFilter] = useState<'all' | '5star' | '4star' | 'critical' | 'unreplied'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reply Modal state
  const [replyingTo, setReplyingTo] = useState<Review | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [activeReplySourceTab, setActiveReplySourceTab] = useState<'ai' | 'saved'>('ai');

  // AI Reply State
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'warm' | 'professional' | 'apologetic' | 'promotional'>('warm');
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Saved Replies Manager State
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>(() => {
    const local = localStorage.getItem('nexora_saved_replies');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return defaultSavedReplies;
  });
  const [isSavedRepliesManagerOpen, setIsSavedRepliesManagerOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<SavedReply | null>(null);
  const [isCreatingReply, setIsCreatingReply] = useState(false);
  const [replyFormTitle, setReplyFormTitle] = useState('');
  const [replyFormCategory, setReplyFormCategory] = useState<'General' | 'Apology' | 'Promotion' | 'Stylist Praise'>('General');
  const [replyFormText, setReplyFormText] = useState('');

  useEffect(() => {
    localStorage.setItem('nexora_saved_replies', JSON.stringify(savedReplies));
  }, [savedReplies]);

  const filteredReviews = reviews.filter(rev => {
    let matchesFilter = true;
    if (activeFilter === '5star') matchesFilter = rev.rating === 5;
    if (activeFilter === '4star') matchesFilter = rev.rating === 4;
    if (activeFilter === 'critical') matchesFilter = rev.rating <= 3;
    if (activeFilter === 'unreplied') matchesFilter = !rev.replied;

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchesSearch = 
        rev.customerName.toLowerCase().includes(q) ||
        rev.service.toLowerCase().includes(q) ||
        rev.comment.toLowerCase().includes(q);
    }

    return matchesFilter && matchesSearch;
  });

  // Open reply dialog and auto-fetch AI suggestions
  const handleOpenReplyModal = (review: Review) => {
    setReplyingTo(review);
    setReplyInput(review.replyText || '');
    setSelectedSuggestionIdx(null);
    setActiveReplySourceTab('ai');

    // Pick appropriate default tone based on rating
    let initialTone: 'warm' | 'professional' | 'apologetic' | 'promotional' = 'warm';
    if (review.rating <= 3) initialTone = 'apologetic';
    else if (review.rating === 4) initialTone = 'professional';
    setSelectedTone(initialTone);

    fetchAiSuggestions(review, initialTone);
  };

  const fetchAiSuggestions = async (review: Review, tone: 'warm' | 'professional' | 'apologetic' | 'promotional') => {
    setIsLoadingAi(true);
    setSelectedSuggestionIdx(null);
    try {
      const res = await fetch('/api/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.comment,
          customerName: review.customerName,
          serviceName: review.service,
          rating: review.rating,
          tone
        })
      });
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Failed to generate AI replies:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleToneChange = (tone: 'warm' | 'professional' | 'apologetic' | 'promotional') => {
    setSelectedTone(tone);
    if (replyingTo) {
      fetchAiSuggestions(replyingTo, tone);
    }
  };

  const handleApplySuggestion = (text: string, idx?: number) => {
    setReplyInput(text);
    if (idx !== undefined) setSelectedSuggestionIdx(idx);
  };

  const handleCopySuggestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSendReply = () => {
    if (!replyingTo || !replyInput.trim()) return;

    setReviews(prev => prev.map(rev => {
      if (rev.id === replyingTo.id) {
        return {
          ...rev,
          replied: true,
          replyText: replyInput,
          replyDate: 'Just now',
          type: rev.type === 'unreplied' ? (rev.rating >= 4 ? '5star' : 'critical') : rev.type
        };
      }
      return rev;
    }));

    setReplyingTo(null);
    setReplyInput('');
    setAiSuggestions([]);
  };

  const handleToggleResolve = (id: string) => {
    setReviews(prev => prev.map(rev => {
      if (rev.id === id) {
        return {
          ...rev,
          isResolved: !rev.isResolved
        };
      }
      return rev;
    }));
  };

  // Saved Reply Template Actions
  const handleOpenCreateForm = () => {
    setEditingReply(null);
    setReplyFormTitle('');
    setReplyFormCategory('General');
    setReplyFormText(replyInput || '');
    setIsCreatingReply(true);
  };

  const handleOpenEditForm = (sr: SavedReply) => {
    setEditingReply(sr);
    setReplyFormTitle(sr.title);
    setReplyFormCategory(sr.category);
    setReplyFormText(sr.text);
    setIsCreatingReply(true);
  };

  const handleSaveReplyTemplate = () => {
    if (!replyFormTitle.trim() || !replyFormText.trim()) return;

    if (editingReply) {
      setSavedReplies(prev => prev.map(sr => sr.id === editingReply.id ? {
        ...sr,
        title: replyFormTitle,
        category: replyFormCategory,
        text: replyFormText
      } : sr));
    } else {
      const newTemplate: SavedReply = {
        id: `sr-${Date.now()}`,
        title: replyFormTitle,
        category: replyFormCategory,
        text: replyFormText
      };
      setSavedReplies(prev => [newTemplate, ...prev]);
    }

    setIsCreatingReply(false);
    setEditingReply(null);
    setReplyFormTitle('');
    setReplyFormText('');
  };

  const handleDeleteReplyTemplate = (id: string) => {
    setSavedReplies(prev => prev.filter(sr => sr.id !== id));
  };

  return (
    <Layout currentScreen="reviews" navigate={navigate} title="Reviews & Feedback" showSettings={true}>
      <div id="reviews-screen-container" className="px-4 sm:px-6 md:px-10 py-6 max-w-[1200px] mx-auto w-full space-y-6">
        
        {/* Rating Summary Section & Saved Replies Action Header */}
        <section id="reviews-summary-header" className="bg-surface-container-lowest rounded-[20px] border border-outline-variant/60 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">4.9</h2>
              <div className="flex text-primary">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
            </div>
            <p className="text-sm font-semibold text-on-surface-variant mt-1">Based on 1,248 client reviews</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>98% Positive Feedback Score • AI Smart Assistant Active</span>
              </div>

              <button
                id="btn-manage-saved-replies"
                onClick={() => setIsSavedRepliesManagerOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-container/10 border border-primary/20 px-3 py-1 rounded-full hover:bg-primary-container/20 transition-colors shadow-2xs"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Reply Templates ({savedReplies.length})</span>
              </button>
            </div>
          </div>

          {/* Rating Distribution Bars */}
          <div className="w-full md:w-72 space-y-2 text-xs">
            {[
              { label: '5 Stars', pct: 88, count: '1,098' },
              { label: '4 Stars', pct: 8, count: '98' },
              { label: '3 Stars', pct: 2, count: '24' },
              { label: '2 Stars', pct: 1, count: '18' },
              { label: '1 Star', pct: 1, count: '10' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-12 text-on-surface-variant font-medium text-right">{item.label}</span>
                <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${item.pct}%` }}></div>
                </div>
                <span className="w-10 text-on-surface-variant font-medium text-right">{item.pct}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Filter Chips & Search Bar */}
        <section id="reviews-filters-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'All Reviews' },
                { id: '5star', label: '5 Stars' },
                { id: '4star', label: '4 Stars' },
                { id: 'critical', label: 'Critical (1-3★)' },
                { id: 'unreplied', label: 'Unreplied' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  id={`btn-filter-${chip.id}`}
                  onClick={() => setActiveFilter(chip.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                    activeFilter === chip.id
                      ? 'bg-primary-container text-on-primary-container border-primary-container shadow-xs'
                      : 'bg-surface text-on-surface border-outline-variant/60 hover:bg-surface-variant'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input 
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full text-xs bg-surface border border-outline-variant/60 focus:outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant/60"
              />
            </div>
          </div>
        </section>

        {/* Reviews Grid */}
        <section id="reviews-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredReviews.map((review) => {
              const isCritical = review.rating <= 3;
              return (
                <motion.div
                  key={review.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-surface-container-lowest rounded-[18px] border border-outline-variant/60 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                    review.statusBorder === 'green' 
                      ? 'border-l-4 border-l-emerald-500' 
                      : review.statusBorder === 'red' || isCritical 
                        ? 'border-l-4 border-l-error' 
                        : ''
                  }`}
                >
                  {/* Top Row: Avatar, Name, Rating */}
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {review.customerAvatar ? (
                          <img 
                            src={review.customerAvatar} 
                            alt={review.customerName} 
                            className="w-10 h-10 rounded-full object-cover border border-outline-variant/60 shadow-xs" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface font-bold text-sm flex items-center justify-center border border-outline-variant/60">
                            {review.customerInitials || review.customerName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-sm text-on-surface leading-tight">{review.customerName}</h3>
                          <p className="text-xs text-on-surface-variant/80">{review.timeAgo}</p>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex text-primary">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-primary text-primary' : 'text-surface-variant fill-surface-variant'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* Service Pill & Comment */}
                    <div className="mb-4">
                      <span className="inline-block px-2.5 py-1 bg-surface-container-low rounded-md text-xs font-semibold text-on-surface-variant mb-2">
                        {review.service}
                      </span>
                      <p className="text-sm text-on-surface leading-relaxed italic">
                        {review.comment}
                      </p>
                    </div>

                    {/* Reply thread if exists */}
                    {review.replied && review.replyText && (
                      <div className="mb-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs space-y-1">
                        <div className="flex items-center justify-between text-primary font-bold">
                          <span className="flex items-center gap-1">
                            <CornerDownRight className="w-3.5 h-3.5" />
                            Salon Response
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-normal">{review.replyDate}</span>
                        </div>
                        <p className="text-on-surface font-medium">{review.replyText}</p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Row */}
                  <div className="pt-4 border-t border-outline-variant/40 flex items-center gap-2 mt-2">
                    {isCritical ? (
                      <>
                        <button
                          id={`btn-reply-${review.id}`}
                          onClick={() => handleOpenReplyModal(review)}
                          className="flex-1 py-2 px-3 bg-secondary-fixed text-primary-container text-xs font-bold rounded-xl hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-primary" />
                          <span>{review.replied ? 'Edit Reply' : 'Reply'}</span>
                        </button>

                        <button
                          onClick={() => handleToggleResolve(review.id)}
                          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                            review.isResolved 
                              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30' 
                              : 'bg-error-container text-on-error-container hover:bg-error/20'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{review.isResolved ? 'Resolved' : 'Resolve'}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        id={`btn-reply-${review.id}`}
                        onClick={() => handleOpenReplyModal(review)}
                        className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs ${
                          review.replied
                            ? 'bg-surface text-on-surface border border-outline-variant hover:bg-surface-variant'
                            : 'bg-secondary-fixed text-primary-container hover:opacity-80'
                        }`}
                      >
                        <Wand2 className="w-4 h-4 text-primary" />
                        <span>{review.replied ? 'Edit Reply' : 'Reply to Review'}</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </section>

        {filteredReviews.length === 0 && (
          <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/60">
            <MessageSquare className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-on-surface">No reviews found</h3>
            <p className="text-xs text-on-surface-variant mt-1">Try switching your filter or clearing the search bar.</p>
          </div>
        )}

      </div>

      {/* AI & Saved Reply Dialog Modal */}
      <AnimatePresence>
        {replyingTo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">
                      Reply Assistant
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">Responding to {replyingTo.customerName} ({replyingTo.rating}★)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Review snippet card */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs text-on-surface space-y-1">
                <div className="flex items-center justify-between text-on-surface-variant text-[11px]">
                  <span className="font-semibold text-primary">{replyingTo.service}</span>
                  <span>{replyingTo.timeAgo}</span>
                </div>
                <p className="italic text-on-surface font-medium leading-relaxed">{replyingTo.comment}</p>
              </div>

              {/* Mode Switcher Tabs: AI Suggestions vs Saved Replies */}
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                <div className="flex bg-surface-container p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setActiveReplySourceTab('ai')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeReplySourceTab === 'ai'
                        ? 'bg-surface-container-lowest text-primary shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Assistant</span>
                  </button>

                  <button
                    onClick={() => setActiveReplySourceTab('saved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeReplySourceTab === 'saved'
                        ? 'bg-surface-container-lowest text-primary shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Saved Templates ({savedReplies.length})</span>
                  </button>
                </div>

                <button
                  onClick={handleOpenCreateForm}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save New Template</span>
                </button>
              </div>

              {/* Tab 1: AI Assistant */}
              {activeReplySourceTab === 'ai' && (
                <div className="space-y-4">
                  {/* Tone Selection & Generate Button Bar */}
                  <div className="space-y-3 bg-primary-fixed/10 p-3.5 rounded-xl border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary" />
                        AI Response Tone
                      </span>

                      <button
                        id="btn-generate-with-ai"
                        onClick={() => fetchAiSuggestions(replyingTo, selectedTone)}
                        disabled={isLoadingAi}
                        className="px-3.5 py-1.5 bg-primary-container text-on-primary-container font-bold text-xs rounded-lg hover:bg-primary transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <Wand2 className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
                        <span>{isLoadingAi ? 'Generating...' : 'Generate with AI'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'warm', label: 'Warm & Grateful' },
                        { id: 'professional', label: 'Professional' },
                        { id: 'apologetic', label: 'Apologetic' },
                        { id: 'promotional', label: 'Promotional' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleToneChange(t.id as any)}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold text-center transition-all border ${
                            selectedTone === t.id
                              ? 'bg-primary-container text-on-primary-container border-primary-container shadow-2xs font-bold'
                              : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-low'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Generated Suggestions */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-on-surface block">
                      Select a Suggested Reply:
                    </span>

                    {isLoadingAi ? (
                      <div className="space-y-2 py-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 rounded-xl bg-surface-container-low animate-pulse border border-outline-variant/20" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion, idx) => {
                          const isSelected = selectedSuggestionIdx === idx;
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border text-xs transition-all relative group flex flex-col justify-between gap-2 ${
                                isSelected
                                  ? 'bg-primary-fixed/20 border-primary ring-1 ring-primary/40'
                                  : 'bg-surface-container-lowest border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container-low/50'
                              }`}
                            >
                              <p className="text-on-surface leading-relaxed">{suggestion}</p>
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  onClick={() => handleCopySuggestion(suggestion, idx)}
                                  className="text-[11px] text-on-surface-variant hover:text-on-surface flex items-center gap-1 px-2 py-1 rounded bg-surface-container-high/40 hover:bg-surface-container-high transition-colors"
                                >
                                  {copiedIdx === idx ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-600 font-semibold">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleApplySuggestion(suggestion, idx)}
                                  className={`text-[11px] font-bold px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-primary text-on-primary'
                                      : 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{isSelected ? 'Applied' : 'Use Reply'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Saved Templates */}
              {activeReplySourceTab === 'saved' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">Quick Select Predefined Template:</span>
                    <button 
                      onClick={() => setIsSavedRepliesManagerOpen(true)}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Manage Templates</span>
                    </button>
                  </div>

                  {savedReplies.length === 0 ? (
                    <div className="text-center py-6 bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                      <Bookmark className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-on-surface">No saved templates yet</p>
                      <button 
                        onClick={handleOpenCreateForm}
                        className="mt-2 text-xs text-primary font-bold hover:underline"
                      >
                        + Create Your First Template
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {savedReplies.map((sr) => (
                        <div 
                          key={sr.id}
                          className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 hover:border-primary/50 transition-all text-xs space-y-1.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-on-surface text-xs">{sr.title}</span>
                              <span className="px-2 py-0.5 rounded-full bg-primary-fixed/20 text-primary text-[10px] font-bold">
                                {sr.category}
                              </span>
                            </div>
                            <button
                              onClick={() => handleApplySuggestion(sr.text)}
                              className="px-3 py-1 bg-primary-container text-on-primary-container hover:bg-primary font-bold rounded-md text-[11px] transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Use Template</span>
                            </button>
                          </div>
                          <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed">{sr.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Editable Text Area */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface block">
                    Final Response Preview & Edit:
                  </label>
                  {replyInput.trim() && (
                    <button 
                      onClick={handleOpenCreateForm}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Current as Template</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Selected template or suggestion will appear here, or write your custom response..."
                  className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant focus:outline-none focus:border-primary text-xs text-on-surface placeholder:text-on-surface-variant/60 leading-relaxed shadow-2xs"
                />
              </div>

              {/* Modal Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyInput.trim()}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-primary-container text-on-primary-container hover:bg-primary disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Response</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Saved Replies Manager Modal */}
      <AnimatePresence>
        {isSavedRepliesManagerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/40">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-on-surface">Saved Response Templates</h3>
                </div>
                <button 
                  onClick={() => setIsSavedRepliesManagerOpen(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-on-surface-variant">Create and reuse response templates for recurring customer inquiries.</p>
                <button
                  onClick={handleOpenCreateForm}
                  className="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-xs hover:bg-primary transition-colors flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Template</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {savedReplies.map((sr) => (
                  <div key={sr.id} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">{sr.title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary-fixed/20 text-primary text-[10px] font-bold">
                          {sr.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenEditForm(sr)}
                          className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-md hover:bg-surface-container-low"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteReplyTemplate(sr.id)}
                          className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-md hover:bg-error/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{sr.text}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-outline-variant/40 flex justify-end">
                <button 
                  onClick={() => setIsSavedRepliesManagerOpen(false)}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Template Sub-Modal */}
      <AnimatePresence>
        {isCreatingReply && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-outline-variant/80 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-primary" />
                  <span>{editingReply ? 'Edit Saved Reply' : 'Create New Saved Reply'}</span>
                </h3>
                <button 
                  onClick={() => setIsCreatingReply(false)}
                  className="p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-on-surface block mb-1">Template Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Apology & Touch-up Offer"
                    value={replyFormTitle}
                    onChange={(e) => setReplyFormTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">Category</label>
                  <select 
                    value={replyFormCategory}
                    onChange={(e) => setReplyFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="General">General Thank You</option>
                    <option value="Apology">Apology & Resolution</option>
                    <option value="Promotion">Promotional / Discount</option>
                    <option value="Stylist Praise">Stylist / Team Shoutout</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">Response Content</label>
                  <textarea 
                    rows={4}
                    placeholder="Write template response text..."
                    value={replyFormText}
                    onChange={(e) => setReplyFormText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:border-primary leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
                <button
                  onClick={() => setIsCreatingReply(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReplyTemplate}
                  disabled={!replyFormTitle.trim() || !replyFormText.trim()}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-primary-container text-on-primary-container hover:bg-primary disabled:opacity-50 transition-colors"
                >
                  {editingReply ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </Layout>
  );
}


