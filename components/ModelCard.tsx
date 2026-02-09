import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { VerifiedIcon } from './IconComponents';
import type { Model } from '../types';

interface ModelCardProps {
  model: Model;
}

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  const { t, i18n } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  const images = model.cover_image && model.cover_image.length > 0 
    ? model.cover_image 
    : ['/placeholder.png'];

  React.useEffect(() => {
    // Check if the device stays in hover mode (prevents cycling on mobile/touch)
    const supportsHover = window.matchMedia('(hover: hover)').matches;
    
    if (isHovering && images.length > 1 && supportsHover) {
      timerRef.current = window.setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1000); 
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCurrentImageIndex(0); 
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovering, images.length]);
  
  const currentLang = i18n.language.split('-')[0];
  
  return (
    <Link 
      to={`/${currentLang}/models/${model.slug}`} 
      className={`group block overflow-hidden bg-background relative transition-all duration-500 ${
        model.is_top_model ? 'shadow-[0_0_20px_rgba(201,162,39,0.15)] ring-1 ring-gold-accent/30' : ''
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-surface">
        <div className="absolute top-2 md:top-8 right-2 md:right-4 z-40 flex flex-col items-end gap-1.5 md:gap-2">
          {model.is_top_model && (
            <div className="bg-gold-accent text-black px-2 md:px-3 py-0.5 md:py-1 text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] shadow-lg">
              {t('home.top_model')}
            </div>
          )}
          <div className={`px-2 md:px-3 py-0.5 md:py-1 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] shadow-lg backdrop-blur-sm ${
            model.availability === 'Booked' 
              ? 'bg-red-900/80 text-white border border-red-500/50' 
              : 'bg-black/40 text-white border border-white/40'
          }`}>
            {t(`models.availability.${model.availability}_${model.gender || 'Female'}`)}
          </div>
        </div>
        
        {/* Main Image - Back to object-cover for a clean professional grid */}
        <img
          src={images[currentImageIndex]}
          alt={model.name}
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-110 grayscale saturate-0"
        />
        
        {/* Single Premium Overlay - Fixed to prevent bugging */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/100 via-black/20 to-transparent md:opacity-80 md:group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Content Container - Animated to climb up on hover only on desktop */}
        <div className="absolute inset-x-0 bottom-0 z-30">
          <div className="p-3 md:p-6 transform translate-y-0 md:translate-y-8 md:group-hover:translate-y-0 transition-transform duration-500 ease-out text-center md:text-left bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <div className="inline-block mx-auto md:mx-0 max-w-full">
              <h3 className="text-sm md:text-2xl font-serif text-white mb-0.5 tracking-wide drop-shadow-md truncate flex items-center justify-center md:justify-start gap-1">
                {i18n.language.startsWith('bg') && model.name_bg ? model.name_bg : model.name}
                {model.is_verified && <VerifiedIcon className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#0095F6] flex-shrink-0" />}
              </h3>
              <p className="text-[9px] md:text-sm text-gold-accent uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold drop-shadow-sm truncate">
                {t(`attributes.locations.${model.location}`, model.location)}
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
          <div className="absolute top-4 left-0 right-0 px-6 hidden md:flex space-x-1 z-40">
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
