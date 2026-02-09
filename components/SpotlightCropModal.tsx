import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "@/components/ui/image-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface SpotlightCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  aspectRatio?: number; // default to 4/5
}

export const SpotlightCropModal: React.FC<SpotlightCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete,
  aspectRatio = 4 / 5,
}) => {
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleSave = async () => {
    if (!cropArea || !imageUrl) return;
    setIsProcessing(true);

    try {
      const image = new Image();
      image.crossOrigin = "anonymous"; // Handle cross-origin images
      image.src = imageUrl;
      await new Promise((resolve, reject) => {
        image.onload = () => resolve(true);
        image.onerror = (e) => reject(e);
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedUrl = URL.createObjectURL(blob);
          onCropComplete(croppedUrl);
          onClose();
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.95);
      
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-white">Adjust Asset</h2>
                <span className="text-[10px] uppercase tracking-widest text-gold-accent font-medium mt-1">4:5 Editorial Ratio</span>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cropper */}
            <div className="mb-6 space-y-6">
              <div className="bg-black/80 rounded-lg border border-white/5 overflow-hidden ring-1 ring-white/10">
                <Cropper
                  className="h-[500px] w-full"
                  image={imageUrl}
                  onCropChange={setCropArea}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  aspectRatio={aspectRatio}
                >
                  <CropperDescription />
                  <CropperImage />
                  <CropperCropArea className="border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.8)]" />
                </Cropper>
              </div>
              
              {/* Zoom Slider */}
              <div className="px-4 flex items-center gap-6 bg-white/[0.02] py-4 border border-white/5 rounded-xl">
                 <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Zoom Level</span>
                 <Slider 
                    value={[zoom]} 
                    onValueChange={(vals) => setZoom(vals[0])} 
                    min={1} 
                    max={3} 
                    step={0.01}
                    className="flex-1 select-none"
                 />
                 <span className="text-[11px] font-mono text-gold-accent w-12 text-right">
                   {(zoom * 100).toFixed(0)}%
                 </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end border-t border-white/5 pt-6">
              <button
                onClick={onClose}
                className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="px-10 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gold-accent transition-all flex items-center gap-2 group disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Apply Crop
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
