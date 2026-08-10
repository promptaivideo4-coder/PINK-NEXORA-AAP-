/**
 * OwnerPhotoUpload — File picker with auto-resize to HD via Canvas.
 *
 * Features:
 *  - Accepts common image formats (jpg, png, webp)
 *  - Resizes to 1024x1024 max (HD quality, reasonable file size)
 *  - Uses high-quality bicubic-ish resize via canvas
 *  - Converts to JPEG at 92% quality for small file size
 *  - Shows preview with remove button
 *  - Loading spinner during resize
 */
import React, { useRef, useState } from 'react';
import { ImagePlus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  value?: string; // data URL
  onChange: (dataUrl: string) => void;
  onSave?: () => void;
  size?: number; // display size in px (default 104)
  label?: string;
}

const HD_MAX_DIM = 1024; // Resize to 1024x1024 max (HD)
const JPEG_QUALITY = 0.92;

/**
 * Resize an image to fit within HD_MAX_DIM x HD_MAX_DIM using canvas.
 * Returns a JPEG data URL at 92% quality.
 */
function resizeToHD(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxDim = HD_MAX_DIM;

      // Scale down if larger than max, preserve aspect ratio
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      // High-quality resize: use smooth scaling via downscaling in steps for extra quality
      // Step 1: draw image scaled down
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function OwnerPhotoUpload({ value, onChange, onSave, size = 104, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Image too large (max 20MB)');
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await resizeToHD(file);
      onChange(dataUrl);
      onSave?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = () => {
    onChange('');
    onSave?.();
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors group overflow-hidden ${
          value ? 'border-[#ac0053]/40' : 'border-gray-200'
        }`}
        style={{ width: '100%', height: '80px' }}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="w-4 h-4 text-[#ac0053] animate-spin" />
            <span className="text-[10px] font-semibold text-gray-500">Resizing…</span>
          </div>
        ) : value ? (
          <>
            <img
              src={value}
              alt="Owner"
              className="w-full h-full object-cover"
            />
            {/* Hover overlay with remove button */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="bg-white text-red-600 rounded-full p-1 shadow hover:bg-red-50 transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* HD indicator */}
            <div className="absolute bottom-1 right-1 bg-[#ac0053] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> HD
            </div>
          </>
        ) : (
          <span className="text-sm font-semibold text-gray-500 group-hover:text-[#ac0053] flex items-center gap-2">
            <ImagePlus className="w-4 h-4" /> Add Photo
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInput}
      />
      {error && (
        <p className="text-[11px] text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
