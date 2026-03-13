import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { CouponCard, CouponData } from '../components/ui/CouponCard';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const PromosPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        // Even if empty, we set it. We will handle empty state.
        setCoupons(data || []);
      } catch (err) {
        console.error('Error fetching promo codes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleNext = () => {
    if (coupons.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % coupons.length);
  };

  const handlePrev = () => {
    if (coupons.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + coupons.length) % coupons.length);
  };

  // Determine circular offset for a given index based on activeIndex
  const getOffset = (index: number) => {
    const len = coupons.length;
    let offset = index - activeIndex;
    // Circular bounds so we don't have sudden jumps if list is long
    // If length is 5, and active is 0, index 4 is offset -1
    if (offset > Math.floor(len / 2)) offset -= len;
    if (offset < -Math.floor(len / 2)) offset += len;
    return offset;
  };

  // The background color from the screenshot - replaced with user requested palette
  const bgClass = "bg-[#280905]";

  return (
    <div className={cn("min-h-screen py-24 sm:py-32 overflow-hidden flex flex-col justify-center relative", bgClass)}>
      <SEO title="Промоции и Купони" description="Вземи най-добрите отстъпки за твоите нови стикери от CarDecal." />
      
      {/* Back Button */}
      <div className="absolute top-8 left-4 md:left-8 z-50">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs md:text-sm"
          >
              <ChevronLeft className="w-5 h-5" />
              Назад
          </button>
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 px-4 flex-1 flex flex-col items-center justify-center -mt-10">
        
        {/* Header Titles matching the soft theme */}
        <div className="text-center mb-8 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/80 font-serif italic text-lg md:text-2xl mb-2 drop-shadow-sm"
          >
            Ексклузивни оферти
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-serif text-white tracking-wide"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
          >
            CarDecal промо кодове
          </motion.h1>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-white mb-4 drop-shadow-md" />
            <p className="text-white font-bold uppercase tracking-widest drop-shadow">Зареждане на купони...</p>
          </div>
        ) : coupons.length > 0 ? (
          <div className="relative w-full h-[500px] md:h-[350px] flex items-center justify-center mt-4">
            <AnimatePresence>
              {coupons.map((coupon, index) => {
                const offset = getOffset(index);
                
                // Hide cards that are too far away in the stack (only show active, 1 left, 1 right, and maybe a 2nd left/right on desktop)
                const isMobile = window.innerWidth < 768;
                const maxVisible = isMobile ? 1 : 2;
                
                if (Math.abs(offset) > maxVisible) return null;

                // Adjust stacking logic for "TRY ANOTHER" style
                // The active card is in front. Positive offset is right, negative is left.
                // We want the active card to be fully visible, other cards peeking out.
                const isRightActive = offset > 0;
                
                // Fine-tune transforms based on mobile vs desktop
                const baseTranslateX = isMobile ? 35 : 120; // how far each card shifts
                const translateX = offset * baseTranslateX;
                const scale = 1 - Math.abs(offset) * (isMobile ? 0.08 : 0.05);
                const zIndex = 50 - Math.abs(offset) * 10;
                const opacity = 1 - Math.abs(offset) * 0.15; // cards behind are slightly dimmed
                
                return (
                  <motion.div
                    key={coupon.id}
                    className="absolute cursor-pointer select-none"
                    initial={false}
                    animate={{ 
                      x: translateX, 
                      scale: scale, 
                      zIndex: zIndex, 
                      opacity: opacity 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={() => {
                        // Clicking non-active card centers it
                        if (offset !== 0) {
                            setActiveIndex(index);
                        }
                    }}
                    style={{
                       // Add a soft drop shadow on the cards themselves
                       filter: offset === 0 ? "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" : "drop-shadow(0 10px 20px rgba(0,0,0,0.1))"
                    }}
                  >
                    <CouponCard coupon={coupon} index={index} bgClass={bgClass} />
                    
                    {/* Navigation Overlays for Desktop */}
                    {offset === 1 && !isMobile && (
                        <div 
                          className="absolute right-[-40px] top-1/2 -translate-y-1/2 bg-[#f4f4f4] text-gray-500 font-bold text-[11px] uppercase tracking-wider py-3 px-4 rounded-r-lg shadow-lg flex items-center gap-1 cursor-pointer hover:bg-white hover:text-gray-700 transition-colors z-50 border-l border-white"
                          onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        >
                            ВИЖ ДРУГ <ChevronRight className="w-4 h-4" />
                        </div>
                    )}

                    {offset === -1 && !isMobile && (
                        <div 
                          className="absolute left-[-40px] top-1/2 -translate-y-1/2 bg-[#f4f4f4] text-gray-500 font-bold text-[11px] uppercase tracking-wider py-3 px-4 rounded-l-lg shadow-lg flex items-center gap-1 cursor-pointer hover:bg-white hover:text-gray-700 transition-colors z-50 border-r border-white"
                          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        >
                            <ChevronLeft className="w-4 h-4" /> ВИЖ ПРЕДИШЕН
                        </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Mobile Controls if there's more than 1 coupon */}
            {coupons.length > 1 && (
               <div className="absolute -bottom-20 left-0 right-0 flex justify-center items-center gap-6 md:hidden">
                   <button onClick={handlePrev} className="p-3 bg-white/20 text-white rounded-full backdrop-blur-md active:bg-white/40 shadow-sm border border-white/30">
                       <ChevronLeft className="w-6 h-6" />
                   </button>
                   <button onClick={handleNext} className="p-3 bg-white/20 text-white rounded-full backdrop-blur-md active:bg-white/40 shadow-sm border border-white/30">
                       <ChevronRight className="w-6 h-6" />
                   </button>
               </div>
            )}
            
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-xl backdrop-blur-sm border border-white/20">
               <span className="text-4xl text-white opacity-80">%</span>
            </div>
            <h3 className="text-3xl font-serif text-white mb-4 drop-shadow-md">В момента няма активни купони</h3>
            <p className="text-white/80 max-w-sm drop-shadow">Последвайте ни в социалните мрежи, за да не изпуснете следващата промоция!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PromosPage;
