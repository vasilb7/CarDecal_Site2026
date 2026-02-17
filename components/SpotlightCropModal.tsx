import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface SpotlightCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  aspectRatio?: number;
}

export const SpotlightCropModal: React.FC<SpotlightCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete,
  aspectRatio = 4 / 5,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Crop window size in CSS pixels
  const CROP_W = 560;
  const CROP_H = Math.round(CROP_W / aspectRatio);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Reset when image changes
  useEffect(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setNaturalSize({ w: 0, h: 0 });
  }, [imageUrl]);

  // Calculate the "cover" scale: how much to scale the natural image so it covers the crop area
  const coverScale = naturalSize.w > 0
    ? Math.max(CROP_W / naturalSize.w, CROP_H / naturalSize.h)
    : 1;

  // The displayed image size at current zoom
  const dispW = naturalSize.w * coverScale * zoom;
  const dispH = naturalSize.h * coverScale * zoom;

  // Output canvas bounds logic
  const maxPanX = Math.max(0, (dispW - CROP_W) / 2);
  const maxPanY = Math.max(0, (dispH - CROP_H) / 2);

  // Helper to keep pan within bounds
  const clampPan = useCallback((x: number, y: number) => {
    // Re-calculate bounds inside to ensure latest values
    const currentMaxX = Math.max(0, (naturalSize.w * coverScale * zoom - CROP_W) / 2);
    const currentMaxY = Math.max(0, (naturalSize.h * coverScale * zoom - CROP_H) / 2);
    return {
      x: Math.min(Math.max(x, -currentMaxX), currentMaxX),
      y: Math.min(Math.max(y, -currentMaxY), currentMaxY)
    };
  }, [naturalSize, coverScale, zoom, CROP_W, CROP_H]);

  // Apply clamping when zoom or pan changes
  useEffect(() => {
    if (naturalSize.w > 0) {
      const { x, y } = clampPan(panX, panY);
      if (x !== panX) setPanX(x);
      if (y !== panY) setPanY(y);
    }
  }, [zoom, naturalSize, clampPan, panX, panY]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // --- Mouse drag ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      
      setPanX(prevX => {
        const nextX = prevX + dx;
        const currentMaxX = Math.max(0, (naturalSize.w * coverScale * zoom - CROP_W) / 2);
        return Math.min(Math.max(nextX, -currentMaxX), currentMaxX);
      });
      setPanY(prevY => {
        const nextY = prevY + dy;
        const currentMaxY = Math.max(0, (naturalSize.h * coverScale * zoom - CROP_H) / 2);
        return Math.min(Math.max(nextY, -currentMaxY), currentMaxY);
      });
      
      setLastMouse({ x: e.clientX, y: e.clientY });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, lastMouse, naturalSize, coverScale, zoom, CROP_W, CROP_H]);

  // --- Touch drag ---
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setLastMouse({ x: t.clientX, y: t.clientY });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = t.clientX - lastMouse.x;
      const dy = t.clientY - lastMouse.y;

      setPanX(prevX => {
        const nextX = prevX + dx;
        const currentMaxX = Math.max(0, (naturalSize.w * coverScale * zoom - CROP_W) / 2);
        return Math.min(Math.max(nextX, -currentMaxX), currentMaxX);
      });
      setPanY(prevY => {
        const nextY = prevY + dy;
        const currentMaxY = Math.max(0, (naturalSize.h * coverScale * zoom - CROP_H) / 2);
        return Math.min(Math.max(nextY, -currentMaxY), currentMaxY);
      });

      setLastMouse({ x: t.clientX, y: t.clientY });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, lastMouse, naturalSize, coverScale, zoom, CROP_W, CROP_H]);

  // --- Scroll zoom ---
  const handleWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY * 0.001;
    setZoom(prev => Math.max(1, Math.min(5, prev + delta)));
  };

  // --- SAVE: crop exactly what's visible ---
  const handleSave = async () => {
    if (naturalSize.w === 0) return;
    setIsProcessing(true);

    try {
      const totalScale = coverScale * zoom;

      // Image top-left corner in crop-window coordinates
      const imgLeft = (CROP_W - dispW) / 2 + panX;
      const imgTop  = (CROP_H - dispH) / 2 + panY;

      // Convert crop window center coordinates back to natural image
      const srcX = -imgLeft / totalScale;
      const srcY = -imgTop / totalScale;
      const srcW = CROP_W / totalScale;
      const srcH = CROP_H / totalScale;

      // Tight clamping based on natural size
      const clampedSx = Math.max(0, Math.min(srcX, naturalSize.w - srcW));
      const clampedSy = Math.max(0, Math.min(srcY, naturalSize.h - srcH));
      const clampedSw = Math.min(srcW, naturalSize.w - clampedSx);
      const clampedSh = Math.min(srcH, naturalSize.h - clampedSy);

      // Output canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) { setIsProcessing(false); return; }

      const outputW = 1600;
      const outputH = Math.round(outputW / aspectRatio);
      canvas.width = outputW;
      canvas.height = outputH;

      // Fill with black first (for any area outside the image)
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, outputW, outputH);

      // Load image
      const img = new Image();
      if (imageUrl.startsWith('http')) img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
      });

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Calculate destination offset if crop extends beyond image edge
      const destX = (clampedSx - srcX) / srcW * outputW;
      const destY = (clampedSy - srcY) / srcH * outputH;
      const destW = (clampedSw / srcW) * outputW;
      const destH = (clampedSh / srcH) * outputH;

      ctx.drawImage(img,
        clampedSx, clampedSy, clampedSw, clampedSh,
        destX, destY, destW, destH
      );

      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(URL.createObjectURL(blob));
          onClose();
        }
        setIsProcessing(false);
      }, 'image/jpeg', 0.92);

    } catch (err) {
      console.error('Crop error:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
            style={{ width: CROP_W + 48 + 'px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-white">Crop Image</h2>
                <span className="text-[10px] uppercase tracking-widest text-gold-accent font-medium mt-0.5 block">
                  Drag to position • Scroll to zoom
                </span>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crop Area */}
            <div className="flex items-center justify-center mb-5">
              <div
                ref={containerRef}
                className="relative overflow-hidden border-2 border-white/50 bg-black"
                style={{
                  width: CROP_W,
                  height: CROP_H,
                  cursor: dragging ? 'grabbing' : 'grab',
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onWheel={handleWheel}
              >
                <img
                  src={imageUrl}
                  alt=""
                  draggable={false}
                  onLoad={handleImageLoad}
                  className="absolute select-none pointer-events-none"
                  style={{
                    width: dispW || 'auto',
                    height: dispH || 'auto',
                    left: (CROP_W - dispW) / 2 + panX,
                    top: (CROP_H - dispH) / 2 + panY,
                    maxWidth: 'none',
                  }}
                />
                {/* Rule-of-thirds grid */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/15" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/15" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/15" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/15" />
                </div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3 mb-5 px-1">
              <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.15))}
                className="p-1.5 text-white/40 hover:text-white transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range" min="1" max="5" step="0.01" value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-accent [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <button type="button" onClick={() => setZoom(z => Math.min(5, z + 0.15))}
                className="p-1.5 text-white/40 hover:text-white transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-gold-accent w-14 text-right">
                {(zoom * 100).toFixed(0)}%
              </span>
              <button type="button" onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}
                className="p-1.5 text-white/40 hover:text-white transition-colors" title="Reset">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end border-t border-white/5 pt-5">
              <button onClick={onClose}
                className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isProcessing}
                className="px-10 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gold-accent transition-all flex items-center gap-2 group disabled:opacity-50">
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
