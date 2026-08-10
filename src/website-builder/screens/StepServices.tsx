import { Sparkles, Mic, ArrowLeft, ArrowRight, Plus, Check, Copy, Trash2, GripVertical, Info, Volume2, X, ChevronDown } from 'lucide-react';
import { SalonData, Service, Package } from '../types';
import PreviewPane from '../components/PreviewPane';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent, useRef, useEffect, useMemo } from 'react';
import {
  SERVICE_CATALOG,
  PACKAGE_CATALOG,
  ALL_SERVICE_CATEGORIES,
  ALL_PACKAGE_CATEGORIES,
  getDescriptionsForCategory,
  getDescriptionsForPackageCategory,
  matchCatalogService,
  matchCatalogPackage,
  type CatalogService,
  type CatalogPackage,
} from '../lib/serviceCatalog';

interface Props {
  data: SalonData;
  setData: (d: SalonData) => void;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  CURATED SUGGESTED LIST (shown as quick-pick chips at top)                 */
/* -------------------------------------------------------------------------- */

const SUGGESTED_TOP = SERVICE_CATALOG.filter(s => [
  'Classic Haircut', 'Hair Spa', 'Blow-Dry Styling', 'Keratin Treatment',
  'Balayage', 'Full Highlights', 'Gentlemens Haircut', 'Beard Grooming & Hot Towel',
  'HD Bridal Makeup', 'Classic Facial', 'Classic Manicure', 'Full Legs Waxing',
].includes(s.name));

/* -------------------------------------------------------------------------- */
/*  DROPDOWN HELPER — searchable combobox                                     */
/* -------------------------------------------------------------------------- */

function SearchableDropdown<T extends { name: string }>({
  options,
  value,
  onChange,
  placeholder,
  label,
}: {
  options: T[];
  value: string;
  onChange: (name: string) => void;
  placeholder: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o => o.name.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={wrapperRef} className="relative">
      {label && <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053] pr-9"
        />
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#5f5e5e] hover:text-[#ac0053]"
          tabIndex={-1}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-[#eeeeee] rounded-lg shadow-lg py-1"
          >
            {filtered.slice(0, 50).map(o => (
              <button
                key={o.name}
                type="button"
                onMouseDown={() => {
                  onChange(o.name);
                  setQuery(o.name);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[#ffd9e1]/40 transition-colors flex items-center justify-between ${
                  value === o.name ? 'bg-[#ffd9e1]/30 text-[#ac0053] font-semibold' : 'text-[#1a1c1c]'
                }`}
              >
                <span>{o.name}</span>
                {value === o.name && <Check className="w-3.5 h-3.5 text-[#ac0053]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  MAIN COMPONENT                                                            */
/* -------------------------------------------------------------------------- */

export default function StepServices({ data, setData, onNext, onPrev, onSave }: Props) {
  const [selectedSuggested, setSelectedSuggested] = useState<string[]>(SUGGESTED_TOP.map(s => s.name).slice(0, 3));
  const [isAddingService, setIsAddingService] = useState(false);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // New Service Form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(300);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceCategory, setNewServiceCategory] = useState('Haircut');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [showServiceAiSuggestions, setShowServiceAiSuggestions] = useState(false);

  // New Package Form state
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackagePrice, setNewPackagePrice] = useState(2000);
  const [newPackageDuration, setNewPackageDuration] = useState(90);
  const [newPackageCategory, setNewPackageCategory] = useState('Bridal');
  const [newPackageDesc, setNewPackageDesc] = useState('');
  const [showPackageAiSuggestions, setShowPackageAiSuggestions] = useState(false);

  /* ---------- Suggested Services ---------- */
  const toggleSuggested = (name: string) => {
    setSelectedSuggested(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const selectAllSuggested = () => {
    if (selectedSuggested.length === SUGGESTED_TOP.length) setSelectedSuggested([]);
    else setSelectedSuggested(SUGGESTED_TOP.map(s => s.name));
  };

  const handleAddSelected = () => {
    if (selectedSuggested.length === 0) return;
    const newServices: Service[] = selectedSuggested.map(sName => {
      const found = SUGGESTED_TOP.find(s => s.name === sName) || SERVICE_CATALOG.find(s => s.name === sName);
      const descriptions = found ? getDescriptionsForCategory(found.category) : [];
      return {
        id: 's-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: found?.name || sName,
        category: found?.category || 'General',
        description: descriptions[0] || 'Professional service provided by experienced stylists.',
        price: found?.defaultPrice || 50,
        duration: found?.defaultDuration || 30,
      };
    });
    setData({ ...data, services: [...data.services, ...newServices] });
    setSelectedSuggested([]);
    onSave?.();
  };

  /* ---------- AI Suggestions ---------- */
  const handleAISuggest = () => {
    const aiAdded: Service[] = [
      { id: 'ai-1', name: 'Organic Scalp Detox', category: 'Treatment', description: 'Exfoliating botanical treatment for ultimate scalp health.', price: 850, duration: 45, featured: true },
      { id: 'ai-2', name: 'Express Gloss & Shine', category: 'Color', description: 'Instant demi-permanent glaze for high-gloss tone.', price: 650, duration: 30 },
    ];
    setData({ ...data, services: [...data.services, ...aiAdded] });
    onSave?.();
  };

  /* ---------- Voice (placeholder for now — same pattern as StepDetails) ---------- */
  const handleSpeechInput = () => {
    setIsSpeaking(true);
    setTimeout(() => { setIsSpeaking(false); }, 1500);
  };

  /* ---------- Service form handlers ---------- */
  const handleServiceNameChange = (name: string) => {
    setNewServiceName(name);
    const matched = matchCatalogService(name);
    if (matched) {
      setNewServiceCategory(matched.category);
      setNewServicePrice(matched.defaultPrice);
      setNewServiceDuration(matched.defaultDuration);
      const descriptions = getDescriptionsForCategory(matched.category);
      setNewServiceDesc(descriptions[0] || '');
      setShowServiceAiSuggestions(true);
    } else {
      setShowServiceAiSuggestions(false);
    }
  };

  const applyServiceDescription = (text: string) => {
    setNewServiceDesc(text);
    setShowServiceAiSuggestions(false);
  };

  const serviceAiSuggestions = useMemo(
    () => getDescriptionsForCategory(newServiceCategory),
    [newServiceCategory]
  );

  const handleCreateService = (e: FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const created: Service = {
      id: 'custom-' + Date.now(),
      name: newServiceName,
      category: newServiceCategory || 'General',
      description: newServiceDesc || (serviceAiSuggestions[0] || 'Professional service.'),
      price: Number(newServicePrice) || 0,
      duration: Number(newServiceDuration) || 30,
    };
    setData({ ...data, services: [...data.services, created] });
    setNewServiceName(''); setNewServiceDesc('');
    setIsAddingService(false);
    setShowServiceAiSuggestions(false);
    onSave?.();
  };

  /* ---------- Package form handlers ---------- */
  const handlePackageNameChange = (name: string) => {
    setNewPackageName(name);
    const matched = matchCatalogPackage(name);
    if (matched) {
      setNewPackageCategory(matched.category);
      setNewPackagePrice(matched.defaultPrice);
      setNewPackageDuration(matched.defaultDuration);
      const descriptions = getDescriptionsForPackageCategory(matched.category);
      setNewPackageDesc(descriptions[0] || '');
      setShowPackageAiSuggestions(true);
    } else {
      setShowPackageAiSuggestions(false);
    }
  };

  const applyPackageDescription = (text: string) => {
    setNewPackageDesc(text);
    setShowPackageAiSuggestions(false);
  };

  const packageAiSuggestions = useMemo(
    () => getDescriptionsForPackageCategory(newPackageCategory),
    [newPackageCategory]
  );

  const handleCreatePackage = (e: FormEvent) => {
    e.preventDefault();
    if (!newPackageName.trim()) return;
    const created: Package = {
      id: 'pkg-' + Date.now(),
      name: newPackageName,
      description: newPackageDesc || (packageAiSuggestions[0] || 'Combo package offering maximum savings.'),
      price: Number(newPackagePrice) || 0,
      duration: Number(newPackageDuration) || 60,
    };
    setData({ ...data, packages: [...data.packages, created] });
    setNewPackageName(''); setNewPackageDesc('');
    setIsAddingPackage(false);
    setShowPackageAiSuggestions(false);
    onSave?.();
  };

  /* ---------- Delete / Duplicate ---------- */
  const handleDeleteService = (id: string) => {
    setData({ ...data, services: data.services.filter(s => s.id !== id) });
    onSave?.();
  };

  const handleDuplicateService = (s: Service) => {
    setData({ ...data, services: [...data.services, { ...s, id: 'dup-' + Date.now(), name: `${s.name} (Copy)` }] });
    onSave?.();
  };

  const handleDeletePackage = (id: string) => {
    setData({ ...data, packages: data.packages.filter(p => p.id !== id) });
    onSave?.();
  };

  return (
    <div className="flex-1 flex w-full h-full bg-[#f9f9f9]">
      <div className="w-full md:w-[55%] h-full flex flex-col relative bg-[#f9f9f9] border-r border-[#eeeeee]">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto pb-32 space-y-8">
            <div>
              <span className="text-xs font-semibold tracking-widest text-[#5f5e5e] uppercase">SERVICES</span>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1a1c1c] mt-1 mb-2">What services do you offer?</h1>
              <p className="text-[#5f5e5e] text-base">Choose your services, add prices and your website will update instantly.</p>
            </div>

            {/* Suggested Services */}
            <div className="bg-white rounded-lg border border-[#eeeeee] p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-[#1a1c1c] uppercase tracking-wider">SUGGESTED SERVICES</h3>
                <button onClick={selectAllSuggested} className="text-xs font-semibold text-[#ac0053] hover:underline">
                  {selectedSuggested.length === SUGGESTED_TOP.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOP.map(s => {
                  const isSelected = selectedSuggested.includes(s.name);
                  return (
                    <button
                      key={s.name}
                      onClick={() => toggleSuggested(s.name)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-[#ac0053] bg-[#ffd9e1] text-[#3f001a]'
                          : 'border-[#eeeeee] bg-[#f9f9f9] text-[#1a1c1c] hover:border-[#ac0053] hover:text-[#ac0053]'
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4 text-[#ac0053]" /> : <Plus className="w-4 h-4 text-[#5f5e5e]" />}
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2">
                <button
                  onClick={handleAddSelected}
                  disabled={selectedSuggested.length === 0}
                  className="bg-[#ac0053] text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#ba005b] transition-colors disabled:opacity-40"
                >
                  Add Selected ({selectedSuggested.length})
                </button>
              </div>
            </div>

            {/* Fast Add */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSpeechInput}
                disabled={isSpeaking}
                className="flex-1 bg-white border border-[#eeeeee] rounded-lg p-4 flex items-center justify-center gap-2 hover:border-[#ac0053] transition-colors group shadow-sm"
              >
                {isSpeaking ? <Volume2 className="w-5 h-5 text-[#ac0053] animate-pulse" /> : <Mic className="w-5 h-5 text-[#5f5e5e] group-hover:text-[#ac0053] transition-colors" />}
                <span className="text-sm font-semibold text-[#1a1c1c] group-hover:text-[#ac0053] transition-colors">
                  {isSpeaking ? 'Listening...' : 'Speak your services'}
                </span>
              </button>
              <button
                onClick={handleAISuggest}
                className="flex-1 bg-white border border-[#eeeeee] rounded-lg p-4 flex items-center justify-center gap-2 hover:border-[#ac0053] transition-colors group shadow-sm"
              >
                <Sparkles className="w-5 h-5 text-[#5f5e5e] group-hover:text-[#ac0053] transition-colors" />
                <span className="text-sm font-semibold text-[#1a1c1c] group-hover:text-[#ac0053] transition-colors">Suggest with AI</span>
              </button>
            </div>

            <hr className="border-[#eeeeee]" />

            {/* My Services */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold tracking-wider text-[#5f5e5e] uppercase">MY SERVICES ({data.services.length})</h3>

              <AnimatePresence>
                {data.services.map(s => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={s.id}
                    className="bg-white border border-[#eeeeee] rounded-lg p-5 shadow-sm flex flex-col gap-4 group hover:border-[#ac0053]/40 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="text-[#5f5e5e] cursor-grab pt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-[#1a1c1c]">{s.name}</h4>
                            {s.featured && <span className="bg-[#ffd9e1] text-[#3f001a] font-medium text-[10px] px-2 py-0.5 rounded-full">Featured</span>}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#5f5e5e]">
                            <span className="font-semibold text-[#1a1c1c]">₹{s.price.toLocaleString('en-IN')}</span>
                            <span>•</span>
                            <span>{s.duration} min</span>
                          </div>
                          <p className="text-sm text-[#565755] mt-1">{s.description}</p>
                          <p className="text-xs text-[#565755] italic mt-2 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            25% advance at booking
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDuplicateService(s)} title="Duplicate" className="p-2 text-[#5f5e5e] hover:text-[#ac0053] hover:bg-[#f9f9f9] rounded-full transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteService(s.id)} title="Delete" className="p-2 text-[#5f5e5e] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Service Form */}
              {isAddingService ? (
                <form onSubmit={handleCreateService} className="bg-white border-2 border-[#ac0053] rounded-lg p-5 shadow-md space-y-4">
                  <div className="flex justify-between items-center border-b border-[#eeeeee] pb-3">
                    <h4 className="font-bold text-[#1a1c1c]">Add New Service</h4>
                    <button type="button" onClick={() => { setIsAddingService(false); setShowServiceAiSuggestions(false); }} className="text-[#5f5e5e] hover:text-black">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <SearchableDropdown
                    label="Service Name *"
                    options={SERVICE_CATALOG}
                    value={newServiceName}
                    onChange={handleServiceNameChange}
                    placeholder="Type or pick a service…"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Category</label>
                      <select
                        value={newServiceCategory}
                        onChange={e => { setNewServiceCategory(e.target.value); setShowServiceAiSuggestions(true); }}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      >
                        {ALL_SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Price (₹)</label>
                      <input type="number" required value={newServicePrice} onChange={e => setNewServicePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Duration (mins)</label>
                      <input type="number" required value={newServiceDuration} onChange={e => setNewServiceDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]" />
                    </div>
                  </div>

                  {/* Description with AI suggestions */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-[#1a1c1c]">Description</label>
                      <button
                        type="button"
                        onClick={() => setShowServiceAiSuggestions(v => !v)}
                        className="text-[10px] font-bold text-[#ac0053] flex items-center gap-1 hover:opacity-80"
                      >
                        <Sparkles className="w-3 h-3" /> AI Suggestions
                      </button>
                    </div>
                    <textarea
                      value={newServiceDesc}
                      onChange={e => { setNewServiceDesc(e.target.value); setShowServiceAiSuggestions(false); }}
                      placeholder="Brief details about the service"
                      rows={2}
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053] resize-none"
                    />

                    <AnimatePresence>
                      {showServiceAiSuggestions && serviceAiSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-1.5"
                        >
                          {serviceAiSuggestions.map((text, i) => (
                            <div
                              key={i}
                              onClick={() => applyServiceDescription(text)}
                              className="group p-2.5 rounded-lg border border-gray-200 hover:border-[#ac0053]/50 hover:bg-[#ffd9e1]/10 transition-all cursor-pointer"
                            >
                              <p className="text-[11px] text-gray-700 leading-relaxed pr-5">{text}</p>
                              <button type="button" className="absolute opacity-0 group-hover:opacity-100 text-[#ac0053]">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => { setIsAddingService(false); setShowServiceAiSuggestions(false); }} className="px-4 py-2 text-sm text-[#5f5e5e] hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-5 py-2 text-sm bg-[#ac0053] text-white font-semibold rounded-lg hover:bg-[#ba005b]">Save Service</button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingService(true)}
                  className="flex items-center justify-center gap-2 w-full py-4 border border-dashed border-[#5f5e5e] hover:border-[#ac0053] hover:text-[#ac0053] text-[#5f5e5e] rounded-lg text-sm font-semibold transition-colors bg-white"
                >
                  <Plus className="w-5 h-5" /> Add Service
                </button>
              )}
            </div>

            <hr className="border-[#eeeeee]" />

            {/* Packages */}
            <div className="flex flex-col gap-4 pb-24">
              <h3 className="text-xs font-semibold tracking-wider text-[#5f5e5e] uppercase">PACKAGES ({data.packages.length})</h3>

              {data.packages.map(p => (
                <div key={p.id} className="bg-white border border-[#eeeeee] rounded-lg p-5 shadow-sm flex flex-col gap-4 group hover:border-[#ac0053]/40 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="text-[#5f5e5e] cursor-grab pt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-lg font-bold text-[#1a1c1c]">{p.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-[#5f5e5e]">
                          <span className="font-semibold text-[#1a1c1c]">₹{p.price.toLocaleString('en-IN')}</span>
                          <span>•</span>
                          <span>{p.duration} min</span>
                        </div>
                        <p className="text-sm text-[#565755] mt-1">{p.description}</p>
                        <p className="text-xs text-[#565755] italic mt-2 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" /> 25% advance at booking
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDeletePackage(p.id)} className="p-2 text-[#5f5e5e] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Package Form */}
              {isAddingPackage ? (
                <form onSubmit={handleCreatePackage} className="bg-white border-2 border-[#ac0053] rounded-lg p-5 shadow-md space-y-4">
                  <div className="flex justify-between items-center border-b border-[#eeeeee] pb-3">
                    <h4 className="font-bold text-[#1a1c1c]">Add New Package</h4>
                    <button type="button" onClick={() => { setIsAddingPackage(false); setShowPackageAiSuggestions(false); }} className="text-[#5f5e5e] hover:text-black">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <SearchableDropdown
                    label="Package Name *"
                    options={PACKAGE_CATALOG}
                    value={newPackageName}
                    onChange={handlePackageNameChange}
                    placeholder="Type or pick a package…"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Category</label>
                      <select
                        value={newPackageCategory}
                        onChange={e => { setNewPackageCategory(e.target.value); setShowPackageAiSuggestions(true); }}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      >
                        {ALL_PACKAGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Price (₹)</label>
                      <input type="number" required value={newPackagePrice} onChange={e => setNewPackagePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Duration (mins)</label>
                      <input type="number" required value={newPackageDuration} onChange={e => setNewPackageDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]" />
                    </div>
                  </div>

                  {/* Description with AI suggestions */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-[#1a1c1c]">Description</label>
                      <button
                        type="button"
                        onClick={() => setShowPackageAiSuggestions(v => !v)}
                        className="text-[10px] font-bold text-[#ac0053] flex items-center gap-1 hover:opacity-80"
                      >
                        <Sparkles className="w-3 h-3" /> AI Suggestions
                      </button>
                    </div>
                    <textarea
                      value={newPackageDesc}
                      onChange={e => { setNewPackageDesc(e.target.value); setShowPackageAiSuggestions(false); }}
                      placeholder="What's included in this package"
                      rows={2}
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053] resize-none"
                    />

                    <AnimatePresence>
                      {showPackageAiSuggestions && packageAiSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-1.5"
                        >
                          {packageAiSuggestions.map((text, i) => (
                            <div
                              key={i}
                              onClick={() => applyPackageDescription(text)}
                              className="group p-2.5 rounded-lg border border-gray-200 hover:border-[#ac0053]/50 hover:bg-[#ffd9e1]/10 transition-all cursor-pointer"
                            >
                              <p className="text-[11px] text-gray-700 leading-relaxed pr-5">{text}</p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => { setIsAddingPackage(false); setShowPackageAiSuggestions(false); }} className="px-4 py-2 text-sm text-[#5f5e5e] hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-5 py-2 text-sm bg-[#ac0053] text-white font-semibold rounded-lg hover:bg-[#ba005b]">Save Package</button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingPackage(true)}
                  className="flex items-center justify-center gap-2 w-full py-4 border border-dashed border-[#5f5e5e] hover:border-[#ac0053] hover:text-[#ac0053] text-[#5f5e5e] rounded-lg text-sm font-semibold transition-colors bg-white"
                >
                  <Plus className="w-5 h-5" /> Add Package
                </button>
              )}
            </div>

          </motion.div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-[#eeeeee] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4">
          <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-4 md:px-8">
            <button onClick={onPrev} className="text-sm font-semibold text-[#5f5e5e] hover:text-[#1a1c1c] transition-colors flex items-center gap-2 py-2 px-4 rounded-lg border border-transparent hover:border-[#eeeeee]">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={onNext} className="bg-[#ac0053] hover:bg-[#ba005b] text-white text-sm font-semibold flex items-center gap-2 px-8 py-3 rounded-lg transition-all shadow-sm">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block w-[45%] h-full">
        <PreviewPane data={data} step={3} />
      </div>
    </div>
  );
}


