import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { CouponCard, CouponData } from '../components/ui/CouponCard';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';

const PromosPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useTranslation();
  const { appliedPromo } = useCart();

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCoupons(data || []);
      } catch (err) {
        console.error('Error fetching promo codes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  useEffect(() => {
    if (activeIndex >= coupons.length && coupons.length > 0) {
      setActiveIndex(Math.max(0, coupons.length - 1));
    }
  }, [coupons.length, activeIndex]);

  const handleNext = () => {
    if (coupons.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % coupons.length);
  };

  const handlePrev = () => {
    if (coupons.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + coupons.length) % coupons.length);
  };

  const getOffset = (index: number) => {
    const len = coupons.length;
    let offset = index - activeIndex;
    if (offset > Math.floor(len / 2)) offset -= len;
    if (offset < -Math.floor(len / 2)) offset += len;
    return offset;
  };

  const bgClass = "bg-[#280905]";

  return (
    <div className={cn("min-h-screen pt-12 md:pt-32 pb-0 overflow-hidden flex flex-col items-center relative", bgClass)}>
      <SEO title="Промоции и Купони" description="Вземи най-добрите отстъпки за твоите нови стикери от CarDecal." />
      
      {/* Royal Background Pattern Overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.12] pointer-events-none"
        style={{ 
          backgroundImage: "url('/royal.png')", 
          backgroundRepeat: "repeat",
          backgroundSize: "300px",
        }}
      />
      
      {/* Header Titles */}
      <div className="text-center mb-10 md:mb-16 z-10 w-full px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/80 font-serif italic text-base md:text-2xl mb-2 drop-shadow-sm"
        >
          Ексклузивни оферти
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-6xl font-serif text-white tracking-wide"
        >
          CarDecal промо кодове
        </motion.h1>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
          <p className="text-white font-bold uppercase tracking-widest">Зареждане на купони...</p>
        </div>
      ) : coupons.length > 0 ? (
        <div className="relative w-full h-[500px] md:h-[400px] flex items-center justify-center mt-4">
          <AnimatePresence>
            {coupons.map((coupon, index) => {
              const offset = getOffset(index);
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
              const maxVisible = isMobile ? 1 : 2;
              
              if (Math.abs(offset) > maxVisible) return null;

              const baseTranslateX = isMobile ? 40 : 120;
              const translateX = offset * baseTranslateX;
              const scale = 1 - Math.abs(offset) * (isMobile ? 0.08 : 0.05);
              const zIndex = 50 - Math.abs(offset) * 10;
              const opacity = 1 - Math.abs(offset) * 0.15;
              
              return (
                <motion.div
                  key={coupon.id}
                  className="absolute cursor-pointer select-none w-full max-w-[95%] sm:max-w-none flex justify-center"
                  initial={false}
                  animate={{ 
                    x: translateX, 
                    scale: scale, 
                    zIndex: zIndex, 
                    opacity: opacity 
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={() => { if (offset !== 0) setActiveIndex(index); }}
                  style={{ filter: offset === 0 ? "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" : "drop-shadow(0 10px 20px rgba(0,0,0,0.1))" }}
                >
                  <div className="w-full max-w-[340px] md:max-w-[600px] relative group/card">
                    <CouponCard coupon={coupon} index={index} bgClass={bgClass} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Unified Premium Navigation Toggle (All Devices) */}
          {coupons.length > 1 && (
            <div className="absolute -top-[20px] left-0 right-0 flex justify-center items-center z-[60] pointer-events-none">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={activeIndex === 0 ? handleNext : handlePrev} 
                className="pointer-events-auto flex items-center justify-center transition-all duration-300 group"
              >
                {/* Outer Pill Shape */}
                <div className="bg-[#1a1a1a] p-1.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-black/50">
                  {/* Inner Pill Shape */}
                  <div className="bg-[#0f0f0f] px-10 py-4 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                    <span className="text-[#C5A059] flex items-center justify-center transition-all duration-300">
                      {activeIndex === 0 ? (
                        <ChevronRight size={24} className="stroke-[3]" />
                      ) : (
                        <ChevronLeft size={24} className="stroke-[3]" />
                      )}
                    </span>
                  </div>
                </div>
              </motion.button>
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center py-10 text-center px-4"
        >
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20">
             <span className="text-4xl text-white opacity-80 font-bold">%</span>
          </div>
          <h3 className="text-3xl font-serif text-white mb-4">В момента няма активни купони</h3>
        </motion.div>
      )}
    </div>
  );
};

export default PromosPage;
