import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ImageScrollSequenceProps {
  frameCount: number;
  framePath: (index: number) => string;
  children?: React.ReactNode; // For overlay content
}

const ImageScrollSequence: React.FC<ImageScrollSequenceProps> = ({ frameCount, framePath, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);

  useEffect(() => {
    let loadedCount = 0;
    const imgArray: HTMLImageElement[] = [];

    // Preload all images
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = framePath(i);
        img.onload = () => {
          loadedCount++;
          setLoadProgress(Math.round((loadedCount / frameCount) * 100));
          if (loadedCount === frameCount) {
             setIsLoaded(true);
          }
        };
        imgArray[i] = img; // maintain order
    }
    setImages(imgArray);
  }, [frameCount, framePath]);

  useEffect(() => {
    const render = (index: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !isLoaded || !images[index]) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = images[index];
        
        // Calculate aspect ratio cover
        // We set canvas internal dimensions to match window dpr for sharpness
        
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
           drawHeight = canvas.height;
           drawWidth = canvas.height * imgRatio;
           offsetX = (canvas.width - drawWidth) / 2;
           offsetY = 0;
        } else {
           drawWidth = canvas.width;
           drawHeight = canvas.width / imgRatio;
           offsetX = 0;
           offsetY = (canvas.height - drawHeight) / 2;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    const unsubscribe = frameIndex.on("change", (latest) => {
        const index = Math.round(latest);
        requestAnimationFrame(() => render(index));
    });

    // Initial render when loaded
    if (isLoaded) { 
        render(0);
    }
    
    return () => unsubscribe();
  }, [frameIndex, images, isLoaded]);

  // Handle Resize
  useEffect(() => {
      const handleResize = () => {
          if (canvasRef.current) {
              const dpr = window.devicePixelRatio || 1;
              canvasRef.current.width = window.innerWidth * dpr;
              canvasRef.current.height = window.innerHeight * dpr;
              
              // Scale context if needed, though drawing full res image usually simpler
              // Just ensure styles set to 100%
          }
      }
      window.addEventListener('resize', handleResize);
      handleResize(); 
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="h-[150vh] relative bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <canvas 
            ref={canvasRef} 
            className="w-full h-full object-cover" 
            style={{ width: '100%', height: '100%' }}
        />
        
        <div className="absolute inset-0 z-10 pointer-events-none">
            {children}
        </div>

        {!isLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
               <div className="text-white text-xl font-bold uppercase tracking-widest animate-pulse mb-4">Initialising Engine...</div>
               <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
                   <div 
                        className="h-full bg-red-600 transition-all duration-300 ease-out"
                        style={{ width: `${loadProgress}%` }}
                   />
               </div>
               <div className="mt-2 text-white/50 text-xs font-mono">{loadProgress}%</div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageScrollSequence;
