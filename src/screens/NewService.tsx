import React, { useState, useRef } from 'react';
import TopBar from '../components/TopBar';
import { NavigationProps } from '../types';
import { ImagePlus, ChevronDown, Clock, X, Sparkles } from 'lucide-react';

interface ServiceTemplate {
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
}

const presetTemplates: ServiceTemplate[] = [
  {
    name: 'Balayage & Blowdry',
    category: 'color',
    duration: 180,
    price: 240,
    description: 'A customized, hand-painted highlighting technique creating a soft, natural gradation of lightness towards the ends. Includes professional gloss toner, deep conditioning, and a signature blowout styling.'
  },
  {
    name: 'Haircut & Styling',
    category: 'haircut',
    duration: 60,
    price: 75,
    description: 'A personalized consultation followed by a professional relaxing hair wash, a bespoke haircut tailored to your face structure, and a premium salon blow-dry styling.'
  },
  {
    name: 'Hydra Facial',
    category: 'treatment',
    duration: 75,
    price: 120,
    description: 'An advanced multi-step skin treatment that combines cleansing, exfoliation, extraction, hydration, and antioxidant protection simultaneously, resulting in clearer, more beautiful skin with no discomfort or downtime.'
  },
  {
    name: 'Keratin Treatment',
    category: 'treatment',
    duration: 150,
    price: 180,
    description: 'A professional-grade deep-conditioning treatment designed to rebuild, strengthen, and smooth frizzy hair. Delivers silky, straight-looking results that last up to 12 weeks.'
  },
  {
    name: 'Bridal Makeup',
    category: 'makeup',
    duration: 120,
    price: 350,
    description: 'Complete HD luxury bridal makeup, including skin prep, contouring, lash application, hairstyle setup, and drape assistance to ensure a gorgeous, long-lasting look for your special day.'
  },
  {
    name: 'Manicure & Pedicure',
    category: 'nails',
    duration: 90,
    price: 65,
    description: 'A luxurious nail spa treatment involving deep cleansing, skin exfoliation, mask therapy, gentle massage, nail shaping, cuticle care, and a flawless gel polish application.'
  },
  {
    name: 'Beard Trim & Styling',
    category: 'haircut',
    duration: 30,
    price: 30,
    description: 'Bespoke beard trimming and hot towel edge-shaping using premium oils and balms to condition and style your facial hair to perfection.'
  }
];

export default function NewService({ navigate }: NavigationProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Controlled states for auto-fill & manual edit
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyTemplate = (tpl: ServiceTemplate) => {
    setServiceName(tpl.name);
    setCategory(tpl.category);
    setDuration(tpl.duration.toString());
    setPrice(tpl.price.toString());
    setDescription(tpl.description);
    setSelectedPreset(tpl.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const saved = localStorage.getItem('nexora_services');
    let currentList = [];
    if (saved) {
      try {
        currentList = JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load current services list', err);
      }
    }

    let mappedCat: 'Hair' | 'Nails' | 'Spa' | 'Aesthetic' = 'Hair';
    if (category === 'haircut' || category === 'color' || category === 'extensions') {
      mappedCat = 'Hair';
    } else if (category === 'nails') {
      mappedCat = 'Nails';
    } else if (category === 'treatment') {
      mappedCat = 'Spa';
    } else if (category === 'makeup') {
      mappedCat = 'Aesthetic';
    }

    const newService = {
      id: `SRV-${Date.now()}`,
      name: serviceName,
      category: mappedCat,
      description: description,
      duration: Number(duration),
      price: Number(price),
      image: imagePreview || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw9naRZ0loBzUpQG7MWjsnG_zY_PI1ow606HO1hgOtQCN7eS4F9SNU82vaAlJuI9nP_pA0lqH-3gDIl6BedEJ2KMYBqnjLPx81IRT1u-5ZNCXvIV96G4Of2THK_tGUJkjAF49lnh5VyTsaPI3VJQphCIO6fflhrL6Ti0deu6eq955lQwvQeJMhwk4SF5FbCjnmV9Y9Trz0r3lSW_Q3EebSRGkhUrv5A2V-0u9qwXA2pdms4WzmRAD_jB30b5KUn6FaIv6bVeXayw0'
    };

    currentList.push(newService);
    localStorage.setItem('nexora_services', JSON.stringify(currentList));

    navigate('services');
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 font-body md:pb-8 flex flex-col items-center">
      <TopBar showBack onBack={() => navigate('services')} navigate={navigate} title="New Service" />

      <main className="w-full max-w-md mx-auto mt-8 px-4 space-y-8 pb-[env(safe-area-inset-bottom,20px)] flex-grow">
        <form onSubmit={handleSubmit} className="space-y-8 w-full mx-auto">
          
          {/* Quick Preset Templates Selection */}
          <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary font-bold text-[15px]">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span>Smart Preset Templates</span>
            </div>
            <p className="text-xs font-semibold text-on-surface-variant leading-relaxed">
              Select one of the popular preset services below to automatically auto-fill the form with typical details. You can freely edit and override any field afterwards.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {presetTemplates.map((tpl) => {
                const isSelected = selectedPreset === tpl.name;
                return (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={`text-xs font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 border flex items-center gap-1 active:scale-95 ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-on-surface border-[#E8E8E8] hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <span>{tpl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Upload Area */}
          <div 
            onClick={() => {
              if (!imagePreview) {
                fileInputRef.current?.click();
              }
            }}
            className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden group cursor-pointer border-2 border-dashed border-outline-variant bg-white hover:border-primary-container transition-all duration-300 flex flex-col items-center justify-center"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="hidden" 
            />
            
            {imagePreview ? (
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src={imagePreview} 
                  alt="Service preview" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/90 text-on-surface text-sm font-semibold px-4 py-2 rounded-xl shadow-md hover:bg-white transition-colors"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="bg-red-600/90 text-white p-2.5 rounded-xl shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Standard subtle close button in case they don't hover on mobile */}
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-20 sm:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 text-on-surface-variant group-hover:text-primary-container transition-colors z-0">
                <ImagePlus className="w-10 h-10" strokeWidth={1.5} />
                <span className="text-[18px] font-semibold">Upload Cover Image</span>
                <span className="text-[13px] font-medium text-outline">High-res PNG or JPG (Max 5MB)</span>
              </div>
            )}
          </div>

          {/* Form Details */}
          <div className="bg-white/70 backdrop-blur-[20px] border border-white/50 p-6 rounded-3xl space-y-4 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
            
            {/* Service Name */}
            <div className="space-y-2">
              <label htmlFor="serviceName" className="block text-[18px] font-semibold text-on-surface">Service Name</label>
              <input 
                id="serviceName" 
                type="text" 
                placeholder="e.g., Balayage & Blowdry" 
                required
                value={serviceName}
                onChange={(e) => {
                  setServiceName(e.target.value);
                  setSelectedPreset(null); // Clear selected tag if modified
                }}
                className="w-full rounded-2xl px-4 py-3 text-base text-on-surface placeholder:text-outline border border-outline-variant bg-white focus:border-primary-container focus:ring-[3px] focus:ring-primary-container/10 transition-all outline-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="block text-[18px] font-semibold text-on-surface">Category</label>
              <div className="relative">
                <select 
                  id="category" 
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSelectedPreset(null);
                  }}
                  required
                  className="w-full rounded-2xl px-4 py-3 text-base text-on-surface appearance-none border border-outline-variant bg-white focus:border-primary-container focus:ring-[3px] focus:ring-primary-container/10 transition-all outline-none"
                >
                  <option value="" disabled>Select a category</option>
                  <option value="haircut">Haircut & Styling</option>
                  <option value="color">Color Services</option>
                  <option value="treatment">Treatments & Skincare</option>
                  <option value="makeup">Makeup & Bridal</option>
                  <option value="nails">Nails & Spa</option>
                  <option value="extensions">Hair Extensions</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant w-5 h-5" />
              </div>
            </div>

            {/* Grid for Duration & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="duration" className="block text-[18px] font-semibold text-on-surface">Duration (Min)</label>
                <div className="relative">
                  <input 
                    id="duration" 
                    type="number" 
                    placeholder="60" 
                    min="1" 
                    required
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      setSelectedPreset(null);
                    }}
                    className="w-full rounded-2xl pl-10 pr-4 py-3 text-base text-on-surface placeholder:text-outline border border-outline-variant bg-white focus:border-primary-container focus:ring-[3px] focus:ring-primary-container/10 transition-all outline-none"
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="price" className="block text-[18px] font-semibold text-on-surface">Price ($)</label>
                <div className="relative">
                  <input 
                    id="price" 
                    type="number" 
                    placeholder="240" 
                    min="0" 
                    required
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setSelectedPreset(null);
                    }}
                    className="w-full rounded-2xl pl-8 pr-4 py-3 text-base text-on-surface placeholder:text-outline border border-outline-variant bg-white focus:border-primary-container focus:ring-[3px] focus:ring-primary-container/10 transition-all outline-none"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">$</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-[18px] font-semibold text-on-surface">Description</label>
              <textarea 
                id="description" 
                placeholder="Detail what this service includes..." 
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setSelectedPreset(null);
                }}
                className="w-full rounded-2xl px-4 py-3 text-base text-on-surface placeholder:text-outline resize-none border border-outline-variant bg-white focus:border-primary-container focus:ring-[3px] focus:ring-primary-container/10 transition-all outline-none"
              ></textarea>
            </div>

          </div>

          {/* Action Button */}
          <div className="pt-4 pb-8">
            <button 
              type="submit"
              className="w-full bg-primary-container text-white text-[18px] font-semibold py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-[0_8px_16px_rgba(230,0,126,0.2)]"
            >
              Create Service
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
