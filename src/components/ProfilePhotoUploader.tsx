import React, { useState, useRef } from 'react';
import { Camera, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfilePhotoUploaderProps {
  avatar?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  variant?: 'circle' | 'box';
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

export default function ProfilePhotoUploader({ avatar, onUpload, onRemove, variant = 'box', onUploadStart, onUploadEnd }: ProfilePhotoUploaderProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsBottomSheetOpen(false);
      setIsUploading(true);
      setProgress(0);
      onUploadStart?.();
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            onUpload(file);
            onUploadEnd?.();
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const BottomSheet = () => (
      <AnimatePresence>
        {isBottomSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-surface rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-on-surface flex justify-between items-center">
                Upload Profile Photo
                <button onClick={() => setIsBottomSheetOpen(false)}><X className="w-5 h-5 text-on-surface-variant" /></button>
              </h3>
              
              <div className="grid grid-cols-1 gap-2">
                <button className="flex items-center gap-3 p-3 text-sm font-semibold text-on-surface hover:bg-surface-variant rounded-xl transition-colors">
                  <Camera className="w-5 h-5 text-primary" /> Take Photo
                </button>
                <button className="flex items-center gap-3 p-3 text-sm font-semibold text-on-surface hover:bg-surface-variant rounded-xl transition-colors">
                  <ImageIcon className="w-5 h-5 text-primary" /> Choose from Gallery
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-3 text-sm font-semibold text-on-surface hover:bg-surface-variant rounded-xl transition-colors">
                  <Upload className="w-5 h-5 text-primary" /> Browse Files
                </button>
                {avatar && (
                    <button onClick={() => {onRemove(); setIsBottomSheetOpen(false);}} className="flex items-center gap-3 p-3 text-sm font-semibold text-error hover:bg-error/10 rounded-xl transition-colors">
                      <Trash2 className="w-5 h-5" /> Remove Photo
                    </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );

  return (
    <>
      <div className="flex flex-col items-center">
        {isUploading ? (
            <div className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-primary-container/20">
                <div className="text-sm font-bold text-primary">Uploading...</div>
                <div className="text-xl font-black text-primary">{progress}%</div>
            </div>
        ) : (
          <div 
            onClick={() => setIsBottomSheetOpen(true)}
            className={`relative ${variant === 'circle' ? 'w-28 h-28 rounded-full' : 'w-32 h-32 rounded-full'} overflow-hidden shrink-0 border-4 border-white shadow-md z-10 cursor-pointer group`}
          >
            {avatar ? (
                <>
                    <img src={avatar} alt="Staff profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                </>
            ) : (
                <div className="w-full h-full bg-primary-container/10 flex items-center justify-center font-bold text-primary-container text-3xl">
                    <Camera className="w-8 h-8" />
                </div>
            )}
          </div>
        )}
        <BottomSheet />
      </div>
    </>
  );
}
