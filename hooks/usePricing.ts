import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { settingsService } from '../lib/settingsService';

export interface PricingData {
  basePrices: { starter: number; pro: number; business: number; director: number };
  promos: {
    valentines: { starter: number; pro: number; business: number; director: number };
    christmas: { starter: number; pro: number; business: number; director: number };
    photoshoot?: { starter: number; pro: number; business: number; director: number };
  };
  annualDiscount: number | { starter: number; pro: number; business: number; director: number };
}

export interface ComputedPrices {
  starter: { base: number; discounted: number; discountPercent: number; display: string; originalDisplay: string; monthlyPrice: number; yearlyPrice: number; savingsPercent: number };
  pro: { base: number; discounted: number; discountPercent: number; display: string; originalDisplay: string; monthlyPrice: number; yearlyPrice: number; savingsPercent: number };
  business: { base: number; discounted: number; discountPercent: number; display: string; originalDisplay: string; monthlyPrice: number; yearlyPrice: number; savingsPercent: number };
  director: { base: number; discounted: number; discountPercent: number; display: string; originalDisplay: string; isContact: boolean; monthlyPrice: number; yearlyPrice: number; savingsPercent: number };
}

/**
 * Hook: reads pricing config from DB and computes prices for a given promo type.
 * promoType: 'none' | 'valentines' | 'christmas'
 */
export function usePricing(promoType: 'none' | 'valentines' | 'christmas' | 'photoshoot' | string = 'none', isAnnual: boolean = false) {
  const [config, setConfig] = useState<PricingData | null>(() => {
    const cached = localStorage.getItem('pricing_config');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!config);

  useEffect(() => {
    // Initial fetch
    settingsService.getPricingConfig().then((c) => {
      setConfig(c);
      setLoading(false);
      localStorage.setItem('pricing_config', JSON.stringify(c));
    });

    // Real-time listener for pricing_config updates
    const channel = supabase
      .channel('pricing_config_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: `key=eq.pricing_config`
        },
        (payload: any) => {
          const newConfig = payload.new?.value;
          if (newConfig) {
            try {
              const parsed = JSON.parse(newConfig);
              setConfig(parsed);
              localStorage.setItem('pricing_config', newConfig);
            } catch (e) {
              console.error('Error parsing real-time pricing config:', e);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const computed: ComputedPrices | null = config ? computePrices(config, promoType, isAnnual) : null;

  return { config, computed, loading };
}

function computePrices(config: any, promoType: string, isAnnual: boolean): ComputedPrices {
  const bp = config.basePrices;
  const annualDiscount = config.annualDiscount || 0;
  
  const discounts = promoType !== 'none' && config.promos[promoType as keyof typeof config.promos]
    ? config.promos[promoType as keyof typeof config.promos]
    : { starter: 0, pro: 0, business: 0, director: 0 };

   const calc = (base: number, discPct: number, tierKey: string) => {
    const tierAnnualDisc = typeof annualDiscount === 'object' 
      ? (annualDiscount[tierKey as keyof typeof annualDiscount] || 0) 
      : annualDiscount;

    const monthlyPrice = settingsService.calcDiscountedPrice(base, discPct);
    const yearlyMonthlyEquivalent = settingsService.calcDiscountedPrice(monthlyPrice, tierAnnualDisc);
    const yearlyPrice = yearlyMonthlyEquivalent * 12;
    
    // Final price to display
    const finalPrice = isAnnual ? yearlyMonthlyEquivalent : monthlyPrice;
    const finalOriginal = isAnnual ? monthlyPrice : (discPct > 0 ? base : 0);
    
    return {
      base,
      discounted: finalPrice,
      discountPercent: discPct,
      display: `${finalPrice}€`,
      originalDisplay: finalOriginal > 0 ? `${finalOriginal}€` : '',
      monthlyPrice,
      yearlyPrice,
      savingsPercent: isAnnual ? tierAnnualDisc : 0
    };
  };

  const starter = calc(bp.starter, discounts.starter, 'starter');
  const pro = calc(bp.pro, discounts.pro, 'pro');
  const business = calc(bp.business || 480, discounts.business || 0, 'business');
  const directorCalc = calc(bp.director, discounts.director, 'director');

  return {
    starter,
    pro,
    business,
    director: { 
      ...directorCalc, 
      isContact: bp.director === 0 
    }
  };
}
