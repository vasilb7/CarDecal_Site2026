import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { settingsService } from '../lib/settingsService';
import PricingPage from './PricingPage';
import ChristmasPricingPage from './ChristmasPricingPage';
import StandardPricingPage from './StandardPricingPage';

/**
 * Smart pricing router — checks `promo_pricing_route` setting 
 * from DB and renders the appropriate pricing page.
 */
const PricingRouter: React.FC = () => {
  const [promoType, setPromoType] = useState<string | null>(() => {
    return localStorage.getItem('active_promo') || null;
  });

  useEffect(() => {
    // Initial fetch
    settingsService.getActivePromo().then((type) => {
      setPromoType(type || 'none');
      localStorage.setItem('active_promo', type || 'none');
    }).catch(() => {
      setPromoType('none');
    });

    // Real-time listener for site_settings
    const channel = supabase
      .channel('pricing_settings_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload: any) => {
          const { key, value } = payload.new || payload.old || {};
          if (key === 'active_promo') {
            setPromoType(value || 'none');
            localStorage.setItem('active_promo', value || 'none');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Loading state / Container to prevent footer jump
  if (promoType === null) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full border border-white/5 animate-pulse" />
          <div className="w-32 h-2 bg-white/5 rounded-full" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202]">
      <AnimatePresence mode="wait">
        <motion.div
           key={promoType}
           initial={{ opacity: 0, y: 15, scale: 0.98 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: -15, scale: 1.02 }}
           transition={{ 
             duration: 0.7, 
             ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for a "premium" organic feel
           }}
        >
          {(() => {
             if (promoType === 'christmas') return <ChristmasPricingPage />;
             if (promoType === 'valentines') return <PricingPage />;
             
             // fallback - Standard
             return <StandardPricingPage promoType={promoType} />;
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PricingRouter;
