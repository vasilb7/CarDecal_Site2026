import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { CouponCard, CouponData } from '../components/ui/CouponCard';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const PromosPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useTranslation();
  const { appliedPromo } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        // 1. Fetch all active promo codes
        const { data: allPromos, error: promoError } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (promoError) throw promoError;

        // 2. Fetch order count for filtering (if logged in or has session)
        const userEmail = user?.email || sessionStorage.getItem('last_user_email');
        let orderCount = 0;

        if (userEmail) {
            const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .or(`user_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'},shipping_details->>email.eq.${userEmail}`)
                .neq('status', 'cancelled');
            orderCount = count || 0;
        }

        // 3. Filter coupons based on conditions
        let filteredPromos = allPromos || [];

        // Filter by usage (already used)
        if (userEmail && filteredPromos.length > 0) {
            const { data: usedRecords } = await supabase
                .from('promo_code_uses')
                .select('promo_code_id')
                .eq('email', userEmail);
            
            if (usedRecords) {
                const usedIds = new Set(usedRecords.map(r => r.promo_code_id));
                filteredPromos = filteredPromos.filter(p => !usedIds.has(p.id));
            }
        }

        // Filter by logical conditions (New User / Loyal)
        filteredPromos = filteredPromos.filter(p => {
            if (p.condition_type === 'new_users' && orderCount > 0) return false;
            if (p.condition_type === 'loyal_customers' && orderCount < (p.condition_value || 0)) return false;
            return true;
        });

        setCoupons(filteredPromos);
      } catch (err) {
        console.error('Error fetching promo codes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('promo-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promo_codes' },
        () => {
          fetchCoupons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
              <div className="bg-[#1a1a1a] p-1.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-black/50 pointer-events-auto flex items-center gap-1">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrev} 
                  className="bg-[#0f0f0f] w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border border-white/5 shadow-inner hover:border-[#C5A059]/30 transition-colors group"
                >
                  <ChevronLeft size={24} className="text-[#C5A059] stroke-[3]" />
                </motion.button>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext} 
                  className="bg-[#0f0f0f] w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border border-white/5 shadow-inner hover:border-[#C5A059]/30 transition-colors group"
                >
                  <ChevronRight size={24} className="text-[#C5A059] stroke-[3]" />
                </motion.button>
              </div>
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
