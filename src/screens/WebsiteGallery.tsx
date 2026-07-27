import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Upload, Search, Edit2, Trash2, ImagePlus, GripVertical, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Check, Square, ListChecks, Tags } from 'lucide-react';
import { NavigationProps } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GalleryItemType {
  id: string;
  image: string;
  title?: string;
  tag?: string;
  className: string;
  alt: string;
}

const initialItems: GalleryItemType[] = [
  {
    id: '1',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS1TSh0xAT-CaIARm8ZMOh8lkKgSpOKyr6uUhzigGX4Btksym-kT8sd7bBrnIG6ZL-Vf6osifrQdhPwOr7LuZBkuQ2fAgLcW8qdq-aJLwosgJCPvd_um3VMGqeUt4itxYlgOJKFSmBjrf3PQAl6MZlgCQjRSPcepRPexIOpeohFakeqHln1V90P66YBuW280jctHCr_nw6sPtJdM2vbcBhVOTG-vC0dfcrV4rtgunzGCsnUzVrkrOi7tKytY_9xhQdUIl0vAJyl48',
    title: 'Sunset Balayage',
    tag: 'Hair',
    className: 'col-span-2 row-span-2 min-h-[300px]',
    alt: 'Balayage Hair Style',
  },
  {
    id: '2',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6GxQrpGuWsf_jIb5LWWLw-SDCi3yNhBVu7NUInT1dcXNhUM8VWWnP9YfiF68otcLuEhLeptYybaFKHIIJOczC5nZh9HXvefD3bqyMeBkIRvd2CD7iR6WVBCFDvCdUYWuz26gR4AehSysjd_V18UqfacnDp47zojjbpITxS0csac6Bb9laGqNGOmeQcR6t0TM5uViysjGv4AE9-gdzsEQ0w4OEqyKuehkAQHoGpNUZN6W-49v0yZAtfroDFnBsEHReS-_JwtVcoM4',
    className: 'aspect-square md:aspect-auto min-h-[200px]',
    alt: 'Nail Art',
  },
  {
    id: '3',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfdrhJO5no9IZn2n4bIPXl4uerEuKsDOigm6EMTBUlk7206_TMP80yazgL2WTyRdfGaSa8CbZFA1K8RXg4hbzExBLADki327FEzSEWelcHgBEcWFqRxd7FEgvbmpaoemK0R3Yly0g1OmZ8VU3bj0xbLh-kfB0kDNMd8xsRQwGjJNb8IJ6Dqph2PDrGRmcZ7-2Y7kmssS5O1CWyltkS-abS_PV-LN969PNWU7ug-2wj3TL7j2eyHTS5qRebGMDO5b6N_asPRx4skck',
    tag: 'Spa',
    className: 'row-span-2 min-h-[300px]',
    alt: 'Spa Treatment',
  },
  {
    id: '4',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXv8Fns7rFvgNoNp0vOf0sx96lSrrt2xzPGfUpKZ40nywy0FZy386DXCEV4PnBajNG8Hk7pTO8Qe07SptzFUhcyiydEhRpTIwHv26NBJH0z6aLxETWwYLu4GzzlzagtdzA5uBT47g9j5J1-WqSFi0t6ATsZbvvV--hXV-hZFATwpLeX7iQZGnbuGb83WALEOIgrIqsE-Tpt07Dq_CaQ6M2x0C2Q-J1OsccRwgJAYA8xeyuOsLmuDIi8tQL9fjBEG7ZDgpNQcXFaUg',
    className: 'aspect-square md:aspect-auto min-h-[200px]',
    alt: 'Bridal Hair',
  },
  {
    id: '5',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoLIZOsj3ncxBEggDL0PVLWdad_Ge0s4a44XTf8EO0whukB_hmHKVAemR0IUwK_R8b3EuthJmp_reEKN8zljro61S_lZ6anY4XDgc7A21ZojW1uanP9K8vv_QptnzkkcHLF-iu2snTiz0RvpEGfPYXNLbHmtMqLmDqKSPuBcX3ESbWCPlISZJFGzksLcJ5lb_ehHydkvrwBgbazTeazA1bYlPc0NUMaqpqYmFaE61Ku1CRfxQ2q5fa95U3aXcl-Qwo8XK8dRVu6k0',
    title: 'Studio Interior',
    className: 'col-span-2 min-h-[200px]',
    alt: 'Salon Interior',
  }
];

interface SortableGalleryItemProps {
  key?: string;
  item: GalleryItemType;
  isOverlay?: boolean;
  onEdit?: (item: GalleryItemType) => void;
  onClick?: (item: GalleryItemType) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: (item: GalleryItemType) => void;
  onDelete?: (item: GalleryItemType) => void;
  index?: number;
}

function SortableGalleryItem({ item, isOverlay, onEdit, onClick, isSelectionMode, isSelected, onSelectToggle, onDelete, index }: SortableGalleryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index ?? 0) * 0.05, duration: 0.4, ease: "easeOut" }}
      className={`${item.className} relative rounded-[18px] overflow-hidden group shadow-sm transition-all duration-300 transform bg-surface-bright ${isSelectionMode ? (isSelected ? 'ring-4 ring-primary border-transparent' : 'border border-outline-variant/50') : 'border border-outline-variant/50 hover:shadow-lg hover:-translate-y-1'} ${isOverlay ? 'shadow-2xl scale-105' : ''}`}
    >
      <img alt={item.alt} className={`w-full h-full object-cover transition-transform duration-500 ${isSelectionMode && isSelected ? 'scale-105' : ''}`} src={item.image}/>
      <div 
        className={`absolute inset-0 bg-black/40 ${isSelectionMode || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300 flex flex-col justify-between p-3 sm:p-4 cursor-pointer`}
        onClick={() => {
          if (isSelectionMode) {
            onSelectToggle && onSelectToggle(item);
          } else {
            onClick && onClick(item);
          }
        }}
      >
        <div className="flex justify-between items-start gap-2">
          {isSelectionMode ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onSelectToggle && onSelectToggle(item); }}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-primary text-white' : 'bg-surface-bright/90 backdrop-blur-sm text-on-background hover:bg-white hover:text-primary'}`}
            >
              {isSelected ? <Check className="w-5 h-5" /> : <Square className="w-5 h-5 opacity-50" />}
            </button>
          ) : (
            <button 
              {...attributes} 
              {...listeners} 
              className="w-10 h-10 rounded-full bg-surface-bright/90 backdrop-blur-sm text-on-background flex items-center justify-center hover:bg-white hover:text-primary transition-colors shadow-sm cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-5 h-5" />
            </button>
          )}
          
          {!isSelectionMode && (
            <div className="flex gap-1.5 sm:gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit && onEdit(item); }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-bright/90 backdrop-blur-sm text-on-background flex items-center justify-center hover:bg-white hover:text-primary transition-colors shadow-sm"
              >
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(item); }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-bright/90 backdrop-blur-sm text-error flex items-center justify-center hover:bg-error hover:text-white transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
        {(item.tag || item.title) && (
          <div className="mt-auto">
            {item.tag && <span className="inline-block bg-primary-container text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded-full mb-1">{item.tag}</span>}
            {item.title && <h3 className="text-white text-[16px] sm:text-[18px] font-semibold drop-shadow-md">{item.title}</h3>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function WebsiteGallery({ navigate }: NavigationProps) {
  const [activeTab, setActiveTab] = useState('All Photos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [items, setItems] = useState(initialItems);
  const tabs = ['All Photos', ...Array.from(new Set(items.map(item => item.tag).filter(Boolean) as string[]))];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      
      const newItem: GalleryItemType = {
        id: Math.random().toString(36).substr(2, 9),
        image: data.image,
        title: data.title,
        tag: data.tag,
        className: 'aspect-square md:aspect-auto min-h-[200px]',
        alt: data.alt,
      };

      setItems([newItem, ...items]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload and analyze image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === 'All Photos' || item.tag === activeTab;
    const matchesSearch = !searchQuery || 
      (item.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tag?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<GalleryItemType | null>(null);
  const [editForm, setEditForm] = useState({ title: '', tag: '' });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState('');

  const handleToggleSelect = (item: GalleryItemType) => {
    setSelectedIds(prev => 
      prev.includes(item.id) 
        ? prev.filter(id => id !== item.id)
        : [...prev, item.id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleDeleteSelected = () => {
    setItems(items.filter(item => !selectedIds.includes(item.id)));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };
  
  const handleApplyBulkTag = () => {
    setItems(items.map(item => 
      selectedIds.includes(item.id) 
        ? { ...item, tag: bulkTagValue }
        : item
    ));
    setBulkTagValue('');
    setIsBulkTagModalOpen(false);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleDeleteItem = (item: GalleryItemType) => {
    setItems(items.filter(i => i.id !== item.id));
  };

  const handleItemClick = (item: GalleryItemType) => {
    if (isSelectionMode) {
      handleToggleSelect(item);
      return;
    }
    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      setLightboxIndex(index);
      setZoomLevel(1);
    }
  };

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % items.length);
      setZoomLevel(1);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + items.length) % items.length);
      setZoomLevel(1);
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleEditClick = (item: GalleryItemType) => {
    setEditingItem(item);
    setEditForm({ title: item.title || '', tag: item.tag || '' });
  };

  const handleSaveEdit = () => {
    if (editingItem) {
      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, title: editForm.title, tag: editForm.tag }
          : item
      ));
      setEditingItem(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const activeItem = items.find(item => item.id === activeId);

  return (
    <div className="bg-background text-on-background font-sans antialiased min-h-screen pb-24 md:pb-0">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant flex justify-between items-center px-5 md:px-10 h-16">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('website-dashboard')}
            className="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/50"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[24px] text-primary font-bold tracking-tight">Gallery</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds([]);
            }}
            className={`px-4 py-2 rounded-2xl font-semibold flex items-center gap-2 transition-colors shadow-sm hidden md:flex ${isSelectionMode ? 'bg-primary-container text-white' : 'bg-surface-variant text-on-surface-variant hover:opacity-90'}`}
          >
            <ListChecks className="w-5 h-5" />
            {isSelectionMode ? 'Cancel Selection' : 'Select'}
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-primary-container text-white font-semibold px-4 py-2 rounded-2xl flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95 shadow-sm hidden md:flex disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            {isUploading ? 'Uploading...' : 'Upload New'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant hover:opacity-80 transition-opacity cursor-pointer">
            <img alt="Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3cfwFtum2j_ltbbZY3Todj99N9LXXIcrfDcCiyA8lZ59MF1A00a6WjwMvE_PGF0A7yLTOrysanaHrIH994eqSF3FVO2_0gArdKWAC0L6TvQLFVcRud33pnSg4eIRFnboBy-0Pu4Sx1nFGQN1pGhnd4YFN_oKM6GpZXSQes3mLukVfL1l0YM2xmGfrgKF2jKjcDXUbcxxdEy1Ffh4ftU0N6Qm12VL8V1WKtEvfPwsIQSwDFFEpDZgeEtkRcUCYnJ5M4fE911nx3Dc"/>
          </div>
        </div>
      </header>
      
      {/* Selection Action Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface shadow-2xl border border-outline-variant rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex items-center gap-2 pr-4 border-r border-outline-variant">
            <button 
              onClick={handleSelectAll}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-variant text-on-surface transition-colors"
            >
              {selectedIds.length === items.length ? <Check className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            </button>
            <span className="font-semibold text-on-surface text-sm">{selectedIds.length} Selected</span>
          </div>
          <button 
            onClick={() => setIsBulkTagModalOpen(true)}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Tags className="w-4 h-4" />
            Tag Group
          </button>
          <button 
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-error hover:bg-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
      
      {/* Main Content Canvas */}
      <main className="pt-24 px-4 max-w-md mx-auto min-h-screen flex flex-col gap-8 pb-10">
        {/* Filters & Search Bar Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 w-full md:w-auto flex-nowrap">
            {tabs.map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-[13px] font-semibold transition-all border ${
                  activeTab === tab 
                    ? 'bg-primary-container text-white border-primary-container' 
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant border-outline-variant/30'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Search Bar */}
          <div className="relative w-full md:w-[320px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-outline" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tags or titles..." 
              className="w-full pl-11 pr-4 py-3 bg-surface-bright border border-outline-variant rounded-[14px] text-[16px] text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-sm placeholder:text-outline" 
            />
          </div>
        </div>

        {/* High-Density Bento Grid */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 md:gap-6" style={{ gridAutoFlow: 'dense' }}>
            
            {/* Upload Slot / Add Image Card (Mobile) */}
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`bg-surface-bright rounded-[18px] border border-dashed border-outline hover:border-primary transition-colors flex flex-col items-center justify-center p-6 min-h-[220px] cursor-pointer group shadow-sm md:hidden ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-primary-container mb-3 group-hover:scale-110 transition-transform">
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <ImagePlus className="w-7 h-7" />
                )}
              </div>
              <span className="text-[18px] font-semibold text-on-background group-hover:text-primary transition-colors text-center">
                {isUploading ? 'Uploading...' : 'Add Image'}
              </span>
              <span className="text-[13px] font-medium text-outline mt-1 text-center">
                {isUploading ? 'Analyzing with AI...' : 'Upload from device'}
              </span>
            </div>

            <SortableContext 
              items={filteredItems.map(item => item.id)}
              strategy={rectSortingStrategy}
            >
              {filteredItems.map((item, index) => (
                <SortableGalleryItem 
                  key={item.id} 
                  item={item} 
                  index={index}
                  onEdit={handleEditClick} 
                  onClick={handleItemClick}
                  onDelete={handleDeleteItem}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.includes(item.id)}
                  onSelectToggle={handleToggleSelect}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeItem ? <SortableGalleryItem item={activeItem} isOverlay={true} /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-xl w-full max-w-[400px] overflow-hidden">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="text-xl font-bold text-on-surface">Edit Image Details</h2>
              <button 
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Image Title</label>
                <input 
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  placeholder="e.g. Sunset Balayage"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Tag (Category)</label>
                <input 
                  type="text"
                  value={editForm.tag}
                  onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  placeholder="e.g. Hair"
                />
              </div>
            </div>
            <div className="p-4 bg-surface-container flex justify-end gap-3">
              <button 
                onClick={() => setEditingItem(null)}
                className="px-5 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && items[lightboxIndex] && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent absolute top-0 inset-x-0 z-10">
            <div className="flex gap-2">
              <button 
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button 
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <span className="text-white text-sm font-medium flex items-center ml-2 opacity-70 w-12">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white text-sm font-medium opacity-70">
                {lightboxIndex + 1} / {items.length}
              </span>
              <button 
                onClick={() => setLightboxIndex(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 overflow-auto flex items-center justify-center relative touch-pan-x touch-pan-y h-full w-full" onClick={() => setLightboxIndex(null)}>
            <div 
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={items[lightboxIndex].image} 
                alt={items[lightboxIndex].alt}
                className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-zoom-in"
                style={{ transform: `scale(${zoomLevel})` }}
                onClick={(e) => { e.stopPropagation(); zoomLevel < 3 ? handleZoomIn(e) : handleZoomOut(e); }}
              />
            </div>
            
            {/* Nav Buttons */}
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors border border-white/10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors border border-white/10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
          
          {/* Footer Info */}
          {(items[lightboxIndex].title || items[lightboxIndex].tag) && (
            <div className="absolute bottom-0 inset-x-0 p-8 pt-24 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center pointer-events-none z-10">
              {items[lightboxIndex].tag && (
                <span className="bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wider">
                  {items[lightboxIndex].tag}
                </span>
              )}
              {items[lightboxIndex].title && (
                <h2 className="text-white text-xl font-semibold text-center drop-shadow-md">
                  {items[lightboxIndex].title}
                </h2>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Tag Modal */}
      {isBulkTagModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-xl w-full max-w-[400px] overflow-hidden">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="text-xl font-bold text-on-surface">Add to Tag Group</h2>
              <button 
                onClick={() => setIsBulkTagModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Tag Name</label>
                <input 
                  type="text"
                  value={bulkTagValue}
                  onChange={(e) => setBulkTagValue(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  placeholder="e.g. Hair, Spa, Nails"
                />
              </div>
            </div>
            <div className="p-4 bg-surface-container flex justify-end gap-3">
              <button 
                onClick={() => setIsBulkTagModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApplyBulkTag}
                disabled={!bulkTagValue.trim()}
                className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                Apply Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
