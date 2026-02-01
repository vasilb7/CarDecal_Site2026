
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './IconComponents';

interface StoryViewerProps {
  images: string[];
  onClose: () => void;
  onAllStoriesEnd?: () => void;
  title: string;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ images, onClose, onAllStoriesEnd, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 5000; // 5 seconds per story
    const interval = 50; // update progress every 50ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onAllStoriesEnd?.();
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, images.length, onClose]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onAllStoriesEnd?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-center items-center justify-center">
      <div className="relative w-full max-w-[450px] h-full md:h-[90vh] bg-neutral-900 overflow-hidden md:rounded-xl shadow-2xl flex flex-col">
        {/* Progress Bars */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4 flex gap-1">
          {images.map((_, index) => (
            <div key={index} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-50"
                style={{ 
                  width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 rounded-full border border-gold-accent overflow-hidden">
                <img src={images[0]} alt="avatar" className="w-full h-full object-cover" />
             </div>
             <span className="text-white text-sm font-semibold shadow-sm">{title}</span>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Areas */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
        </div>

        {/* Image */}
        <img 
          src={images[currentIndex]} 
          alt={`Story ${currentIndex + 1}`} 
          className="w-full h-full object-cover select-none"
        />
      </div>
    </div>
  );
};

export default StoryViewer;
