import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Model } from '../types';

interface ModelCardProps {
  model: Model;
}

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  const images = model.cardImages && model.cardImages.length > 0 
    ? model.cardImages 
    : [model.coverImage];

  React.useEffect(() => {
    if (isHovering && images.length > 1) {
      timerRef.current = window.setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1000); // Change image every 1 second
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCurrentImageIndex(0); // Reset to first image when not hovering
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovering, images.length]);
  
  return (
    <Link 
      to={`/models/${model.slug}`} 
      className="group block overflow-hidden bg-background"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-surface">
        {/* Main Image - Back to object-cover for a clean professional grid */}
        <img
          src={images[currentImageIndex]}
          alt={model.name}
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-110 grayscale saturate-0"
        />
        
        {/* Single Premium Overlay - Fixed to prevent bugging */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Content Container - Animated to climb up on hover */}
        <div className="absolute inset-0 z-30 flex flex-col justify-end">
          <div className="p-6 pb-4 md:pb-6 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <div className="backdrop-blur-[2px] inline-block">
              <h3 className="text-xl md:text-2xl font-serif text-white mb-0.5 tracking-wide drop-shadow-md">
                {model.name}
              </h3>
              <p className="text-xs md:text-sm text-gold-accent uppercase tracking-[0.2em] font-semibold drop-shadow-sm">
                {t(`filter_values.${model.location}`, model.location)}
              </p>
            </div>
            
            {/* View Profile Button - Revealed as text climbs up */}
            <div className="mt-6 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 hidden md:block">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white flex items-center space-x-2">
                <span>{t('models.view_profile')}</span>
                <span className="w-8 h-[1px] bg-gold-accent"></span>
              </span>
            </div>
          </div>
        </div>

        {/* Image Indicators */}
        {images.length > 1 && isHovering && (
          <div className="absolute top-4 left-0 right-0 px-6 flex space-x-1 z-40">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-0.5 flex-1 transition-all duration-300 ${idx === currentImageIndex ? 'bg-gold-accent' : 'bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ModelCard;
