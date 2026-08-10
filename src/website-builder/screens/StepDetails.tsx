import { Sparkles, Mic, ImagePlus, ArrowLeft, ArrowRight, ChevronDown, Check, X, Volume2, StopCircle } from 'lucide-react';
import { SalonData } from '../types';
import PreviewPane from '../components/PreviewPane';
import OwnerPhotoUpload from '../components/OwnerPhotoUpload';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';

/* -------------------------------------------------------------------------- */
/*  PRESETS                                                                   */
/* -------------------------------------------------------------------------- */

const OWNER_ROLES = [
  'Founder & Master Stylist',
  'Owner & Senior Barber',
  'Founder & Lead Artist',
  'CEO & Beauty Director',
  'Co-Founder & Stylist',
  'Owner & Hair Specialist',
  'Principal Artist & Trainer',
  'Creative Director',
  'Owner & Makeup Expert',
  'Master Barber & Shop Owner',
  'Owner & Nail Artist',
  'Spa Owner & Wellness Expert',
];

const TAGLINE_SUGGESTIONS = [
  'Where Style Meets Elegance',
  'Premium Hair & Beauty Care',
  'Your Look, Our Passion',
  'Luxury Hair, Lasting Impressions',
  'The Art of Personal Style',
  'Beauty Redefined, Confidence Delivered',
  'Expert Cuts, Exquisite Care',
  'Glow Up Starts Here',
  'Unleash Your Inner Radiance',
  'Where Every Visit is a Transformation',
  'Crafted for Your Confidence',
  'Timeless Beauty, Modern Touch',
  'Salon That Speaks Your Style',
  'Beyond Hair — A Lifestyle',
];

/* -------------------------------------------------------------------------- */
/*  AI DESCRIPTION SUGGESTIONS (tagline → curated descriptions)               */
/* -------------------------------------------------------------------------- */

type TaglineKeyword = 'style' | 'beauty' | 'hair' | 'luxury' | 'art' | 'glow' | 'confidence' | 'spa' | 'barber' | 'nail' | 'general';

function classifyTagline(tagline: string): TaglineKeyword[] {
  const t = tagline.toLowerCase();
  const keywords: TaglineKeyword[] = [];
  if (/style|elegance|fashion|chic/.test(t)) keywords.push('style');
  if (/beauty|glam|glamour|makeup/.test(t)) keywords.push('beauty');
  if (/hair|cut|color|styling|strand/.test(t)) keywords.push('hair');
  if (/luxury|premium|luxe|exclusive|elite/.test(t)) keywords.push('luxury');
  if (/art|artist|craft|master/.test(t)) keywords.push('art');
  if (/glow|radiance|shine|glow up/.test(t)) keywords.push('glow');
  if (/confidence|empower/.test(t)) keywords.push('confidence');
  if (/spa|wellness|relax|massage|facial/.test(t)) keywords.push('spa');
  if (/barber|groom|beard|fade/.test(t)) keywords.push('barber');
  if (/nail|manicure|pedicure/.test(t)) keywords.push('nail');
  if (keywords.length === 0) keywords.push('general');
  return keywords;
}

const DESCRIPTION_TEMPLATES: Record<TaglineKeyword, string[]> = {
  style: [
    'At {name}, we believe style is a personal statement. From precision haircuts to curated looks, our expert stylists help you express yourself with confidence.',
    'Step into {name} — a space where modern aesthetics meet timeless craftsmanship. We craft looks that reflect your unique personality.',
  ],
  beauty: [
    '{name} is your destination for premium beauty care. From HD bridal makeup to skincare treatments, we help you look and feel your best every day.',
    'Welcome to {name} — where beauty meets expertise. Our specialists offer personalized treatments that enhance your natural glow.',
  ],
  hair: [
    'At {name}, we specialize in expert hair care — from precision cuts and balayage to smoothing treatments. Every strand gets the attention it deserves.',
    'Hair is our craft at {name}. Our stylists combine technical skill with artistic vision to create looks you\'ll love.',
  ],
  luxury: [
    'Experience luxury at {name}. From the moment you walk in, enjoy premium products, expert hands, and an ambiance designed for relaxation.',
    '{name} offers an exclusive salon experience — curated products, private styling suites, and service that anticipates your every need.',
  ],
  art: [
    'At {name}, hair and beauty are art forms. Our master artists bring years of training and creativity to every client who sits in our chair.',
    '{name} is where craftsmanship meets creativity. We treat every appointment as a canvas for your personal expression.',
  ],
  glow: [
    'Glow up starts at {name}. From facials to styling, we offer treatments that leave you radiant, refreshed, and ready to shine.',
    '{name} is all about your glow. Our beauty experts combine skincare, hair, and makeup to help you look luminous every day.',
  ],
  confidence: [
    '{name} is built on one belief: when you look good, you feel unstoppable. We\'re here to help you step out with confidence.',
    'At {name}, every service is designed to boost your confidence. From cuts to coloring, we craft looks that make you feel like the best version of yourself.',
  ],
  spa: [
    'Unwind at {name} — your sanctuary for wellness and beauty. From scalp massages to rejuvenating facials, we offer a complete spa experience.',
    '{name} blends salon expertise with spa tranquility. Enjoy personalized treatments in a calming, luxurious environment.',
  ],
  barber: [
    '{name} is a classic barbershop with a modern edge. From precision fades to hot towel shaves, we deliver grooming excellence for the modern man.',
    'Sharp cuts, clean lines, and timeless style — that\'s {name}. Our master barbers bring decades of craft to every chair.',
  ],
  nail: [
    'At {name}, nail artistry is our specialty. From elegant manicures to creative nail art, we help your hands and feet look their finest.',
    '{name} offers premium nail care — gel, acrylic, nail art, and spa pedicures in a clean, relaxing environment.',
  ],
  general: [
    '{name} is a full-service salon offering expert hair, beauty, and grooming services. Our team is dedicated to making every visit exceptional.',
    'Welcome to {name} — where skill meets service. We offer personalized treatments to help you look and feel your absolute best.',
  ],
};

function generateDescriptionSuggestions(salonName: string, tagline: string): { text: string }[] {
  const name = salonName || 'our salon';
  const keywords = classifyTagline(tagline);
  const seen = new Set<string>();
  const results: { text: string }[] = [];

  // Pick 1 suggestion from each matched keyword (max 3)
  for (const kw of keywords) {
    const templates = DESCRIPTION_TEMPLATES[kw];
    for (const tmpl of templates) {
      const filled = tmpl.replace(/\{name\}/g, name);
      if (!seen.has(filled)) {
        seen.add(filled);
        results.push({ text: filled });
        if (results.length >= 3) break;
      }
    }
    if (results.length >= 3) break;
  }

  // Fallback: always offer general suggestion
  if (results.length === 0) {
    const tmpl = DESCRIPTION_TEMPLATES.general[0];
    results.push({ text: tmpl.replace(/\{name\}/g, name) });
  }

  return results;
}

/* -------------------------------------------------------------------------- */
/*  WEB SPEECH RECOGNITION TYPES                                              */
/* -------------------------------------------------------------------------- */

interface Props {
  data: SalonData;
  setData: (d: SalonData) => void;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  WEB SPEECH RECOGNITION TYPES                                              */
/* -------------------------------------------------------------------------- */

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string; confidence: number };
  length: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: { [n: number]: SpeechRecognitionResult; length: number } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/* -------------------------------------------------------------------------- */
/*  MAIN COMPONENT                                                            */
/* -------------------------------------------------------------------------- */

export default function StepDetails({ data, setData, onNext, onPrev, onSave }: Props) {
  // Owner role dropdown
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleInputRef = useRef<HTMLInputElement>(null);

  // Tagline dropdown
  const [taglineDropdownOpen, setTaglineDropdownOpen] = useState(false);

  // AI description suggestions
  const [showDescriptionSuggestions, setShowDescriptionSuggestions] = useState(false);
  const descriptionSuggestions = generateDescriptionSuggestions(data.salonName, data.tagline);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const SpeechRecognitionClass = getSpeechRecognition();
  const isVoiceSupported = !!SpeechRecognitionClass;

  // Stop listening on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  /* ---------- Voice recording handlers ---------- */
  const startListening = () => {
    if (!SpeechRecognitionClass) {
      setVoiceError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    setVoiceError(null);
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.results.length - 1; i >= 0; i--) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText = result[0].transcript;
          break;
        } else {
          interim = result[0].transcript + interim;
        }
      }
      setInterimTranscript(interim);
      if (finalText) {
        const newAbout = (data.about ? data.about + ' ' : '') + finalText.trim();
        setData({ ...data, about: newAbout });
        setInterimTranscript('');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript('');
      if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Please allow microphone permission.');
      } else {
        setVoiceError(`Voice error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  /* ---------- Owner role handlers ---------- */
  const selectOwnerRole = (role: string) => {
    setData({ ...data, ownerRole: role });
    setRoleDropdownOpen(false);
    onSave?.();
  };

  /* ---------- Tagline handlers ---------- */
  const selectTagline = (tagline: string) => {
    setData({ ...data, tagline });
    setTaglineDropdownOpen(false);
    setShowDescriptionSuggestions(true);
    onSave?.();
  };

  /* ---------- Apply description suggestion ---------- */
  const applyDescription = (text: string) => {
    setData({ ...data, about: text });
    setShowDescriptionSuggestions(false);
    onSave?.();
  };

  return (
    <div className="flex-1 flex w-full h-full">
      <div className="w-full md:w-[55%] h-full flex flex-col relative bg-white">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 lg:p-16">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto pb-24">
            <div className="mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffd9e1] text-[#8f0044] rounded-full text-[10px] font-bold uppercase tracking-wider mb-6">
                Business Details
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Tell us about your salon</h1>
              <p className="text-gray-500 text-lg">Add a few basic details. Nexora will use them to create your website.</p>
            </div>

            <form className="space-y-10" onSubmit={e => e.preventDefault()}>
              {/* ---- Salon Name ---- */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Business / Salon Name <span className="text-[#ac0053]">*</span></label>
                <input
                  type="text"
                  value={data.salonName}
                  onChange={e => setData({ ...data, salonName: e.target.value })}
                  onBlur={onSave}
                  className="w-full px-4 py-3.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  placeholder="e.g. Royal Hair Studio"
                />
                <p className="text-xs text-gray-400 mt-2">This name will appear on your website.</p>
              </div>

              {/* ---- Business Tagline with dropdown ---- */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-semibold text-gray-900">Business Tagline <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDescriptionSuggestions(true);
                      if (!data.about) {
                        const suggestions = generateDescriptionSuggestions(data.salonName, data.tagline);
                        if (suggestions[0]) {
                          setData({ ...data, about: suggestions[0].text });
                          onSave?.();
                        }
                      }
                    }}
                    className="text-[#ac0053] text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate with AI
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={data.tagline}
                    onChange={e => {
                      setData({ ...data, tagline: e.target.value });
                      setShowDescriptionSuggestions(false);
                    }}
                    onFocus={() => setTaglineDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setTaglineDropdownOpen(false), 150)}
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all pr-10"
                    placeholder="A short catchy line for your salon"
                  />
                  <button
                    type="button"
                    onClick={() => setTaglineDropdownOpen(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#ac0053] transition-colors"
                    tabIndex={-1}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${taglineDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {taglineDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-30 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl py-1"
                      >
                        {TAGLINE_SUGGESTIONS.map(t => (
                          <button
                            key={t}
                            type="button"
                            onMouseDown={() => selectTagline(t)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[#ffd9e1]/40 transition-colors flex items-center justify-between ${
                              data.tagline === t ? 'bg-[#ffd9e1]/30 text-[#ac0053] font-semibold' : 'text-gray-700'
                            }`}
                          >
                            <span>{t}</span>
                            {data.tagline === t && <Check className="w-4 h-4 text-[#ac0053]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* AI description suggestions */}
                <AnimatePresence>
                  {showDescriptionSuggestions && descriptionSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#ac0053] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> AI suggestions based on your tagline
                        </span>
                        <button type="button" onClick={() => setShowDescriptionSuggestions(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {descriptionSuggestions.map((s, i) => (
                        <div key={i} className="group relative p-3 rounded-lg border border-gray-200 hover:border-[#ac0053]/50 hover:bg-[#ffd9e1]/10 transition-all cursor-pointer" onClick={() => applyDescription(s.text)}>
                          <p className="text-xs text-gray-700 leading-relaxed pr-6">{s.text}</p>
                          <button type="button" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#ac0053]">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---- Owner Section ---- */}
              <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#ac0053]"></div>
                <h2 className="text-2xl font-bold text-gray-900">About the Owner</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Owner / Founder Name <span className="text-[#ac0053]">*</span></label>
                  <input
                    type="text"
                    value={data.ownerName}
                    onChange={e => setData({ ...data, ownerName: e.target.value })}
                    onBlur={onSave}
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                    placeholder="e.g. Uma Tiwari"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Owner Photo <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <OwnerPhotoUpload
                      value={data.ownerPhotoUrl}
                      onChange={(url) => setData({ ...data, ownerPhotoUrl: url })}
                      onSave={onSave}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Owner Role <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <select
                      value={data.ownerRole}
                      onChange={e => {
                        setData({ ...data, ownerRole: e.target.value });
                        onSave?.();
                      }}
                      className="w-full h-[72px] px-4 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5rem' }}
                    >
                      <option value="">Select a role...</option>
                      {OWNER_ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="custom">Custom Role (type below)</option>
                    </select>
                    {data.ownerRole === 'custom' && (
                      <input
                        type="text"
                        value={data.ownerRole === 'custom' ? '' : data.ownerRole}
                        onChange={e => setData({ ...data, ownerRole: e.target.value })}
                        placeholder="Enter custom role..."
                        className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* ---- Business description with voice + AI ---- */}
              <div className="space-y-3">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-semibold text-gray-900">Tell customers about your business <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <div className="flex gap-3">
                    {isVoiceSupported && (
                      <button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isListening
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-gray-500 hover:text-[#ac0053]'
                        }`}
                      >
                        {isListening ? (
                          <>
                            <StopCircle className="w-3.5 h-3.5 animate-pulse" /> Stop listening
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" /> Speak instead
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDescriptionSuggestions(true)}
                      className="text-[#ac0053] text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Write with AI
                    </button>
                  </div>
                </div>

                {/* Listening indicator */}
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                          <Volume2 className="w-4 h-4 text-white" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-red-700">Listening… speak now</p>
                        {interimTranscript && (
                          <p className="text-[11px] text-red-600 italic truncate">{interimTranscript}</p>
                        )}
                      </div>
                      <button type="button" onClick={stopListening} className="text-xs font-bold text-red-700 hover:text-red-900 px-2 py-1 rounded bg-red-100">
                        Stop
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {voiceError && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> {voiceError}
                  </p>
                )}

                <textarea
                  rows={5}
                  value={data.about}
                  onChange={e => {
                    setData({ ...data, about: e.target.value });
                    setShowDescriptionSuggestions(false);
                  }}
                  onBlur={onSave}
                  className="w-full px-4 py-4 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all resize-none"
                  placeholder="Briefly describe your services, ambiance, or specialties…"
                />

                {/* AI suggestions for description */}
                <AnimatePresence>
                  {showDescriptionSuggestions && descriptionSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#ac0053] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> AI suggestions
                        </span>
                        <button type="button" onClick={() => setShowDescriptionSuggestions(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {descriptionSuggestions.map((s, i) => (
                        <div key={i} className="group relative p-3 rounded-lg border border-gray-200 hover:border-[#ac0053]/50 hover:bg-[#ffd9e1]/10 transition-all cursor-pointer" onClick={() => applyDescription(s.text)}>
                          <p className="text-xs text-gray-700 leading-relaxed pr-6">{s.text}</p>
                          <button type="button" className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#ac0053]">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-gray-200 flex justify-between items-center z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <button onClick={onPrev} className="px-6 py-3 rounded-lg text-gray-600 font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={onNext} className="px-8 py-3 rounded-lg bg-[#ac0053] text-white font-semibold flex items-center gap-2 hover:bg-[#8f0044] transition-colors shadow-sm">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="hidden md:block w-[45%] h-full">
        <PreviewPane data={data} step={2} />
      </div>
    </div>
  );
}
