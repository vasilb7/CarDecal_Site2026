import React, { useState, useRef, useEffect } from 'react';
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

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete,
}) => {
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Disable background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSave = async () => {
    if (!cropArea || !imageUrl) return;
    setIsProcessing(true);

    try {
      const image = new Image();
      image.src = imageUrl;
      await new Promise((resolve) => {
        if (image.complete) resolve(true);
        else image.onload = () => resolve(true);
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
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif text-white">Изрязване на профилна снимка</h2>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cropper */}
            <div className="mb-6 space-y-4">
              <div className="bg-black/50 rounded-lg border border-white/5 overflow-hidden">
                <Cropper
                  className="h-96 w-full"
                  image={imageUrl}
                  onCropChange={setCropArea}
                  zoom={zoom}
                  onZoomChange={setZoom}
                >
                  <CropperDescription />
                  <CropperImage />
                  <CropperCropArea className="rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]" />
                </Cropper>
              </div>
              
              {/* Zoom Slider */}
              <div className="px-4 flex items-center gap-4">
                 <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Увеличение</span>
                 <Slider 
                    value={[zoom]} 
                    onValueChange={(vals) => setZoom(vals[0])} 
                    min={1} 
                    max={3} 
                    step={0.1}
                    className="flex-1"
                 />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 border-white/10 hover:bg-white/5 hover:text-white"
              >
                Отказ
              </Button>
              <Button
                onClick={handleSave}
                disabled={isProcessing}
                className="px-6 bg-white text-black hover:bg-white/90"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">Обработка...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Запази
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
