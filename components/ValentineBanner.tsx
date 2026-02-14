import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, ChevronRight, X } from 'lucide-react';

const ValentineBanner: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  const handleAction = () => {
    navigate(`/${lang || 'bg'}/pricing`);
  };

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="relative pattern-hearts border-b border-white/10 overflow-hidden z-[110]"
    >
      <div className="container mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Heart className="w-4 h-4 text-white fill-white shrink-0 hidden xs:block" />
          <span className="text-white font-black text-[10px] sm:text-xs md:text-base uppercase tracking-wider sm:tracking-widest leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {t('valentines.promo_text')}
          </span>
          <Heart className="w-4 h-4 text-white fill-white shrink-0 hidden xs:block" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={handleAction}
            className="bg-white text-red-600 px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300 shadow-xl flex items-center gap-1 group whitespace-nowrap"
          >
             <span className="hidden xs:inline">{t('valentines.choose')}</span>
             <span className="xs:hidden">ИЗБЕРИ</span>
             <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ValentineBanner;
