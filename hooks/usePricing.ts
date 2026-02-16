import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { settingsService } from '../lib/settingsService';

export interface PricingData {
  basePrices: { starter: number; pro: number; director: number };
  promos: {
    valentines: { starter: number; pro: number; director: number };
    christmas: { starter: number; pro: number; director: number };
    photoshoot?: { starter: number; pro: number; director: number };
  };
}

export interface ComputedPrices {
  starter: { base: number; discounted: number; discountPercent: number; display: string; originalDisplay: string };
  pro: { base: number; discounted: number; discountPercent: number; display: string; originalDisplay: string };
  director: { base: number; discounted: number; discountPercent: number; display: string; originalDisplay: string; isContact: boolean };
}

/**
 * Hook: reads pricing config from DB and computes prices for a given promo type.
 * promoType: 'none' | 'valentines' | 'christmas'
 */
export function usePricing(promoType: 'none' | 'valentines' | 'christmas' | 'photoshoot' | string = 'none') {
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

  const computed: ComputedPrices | null = config ? computePrices(config, promoType) : null;

  return { config, computed, loading };
}

function computePrices(config: PricingData, promoType: string): ComputedPrices {
  const bp = config.basePrices;
  const discounts = promoType !== 'none' && config.promos[promoType as keyof typeof config.promos]
    ? config.promos[promoType as keyof typeof config.promos]
    : { starter: 0, pro: 0, director: 0 };

  const calc = (base: number, discPct: number) => ({
    base,
    discounted: settingsService.calcDiscountedPrice(base, discPct),
    discountPercent: discPct,
    display: discPct > 0
      ? `${settingsService.calcDiscountedPrice(base, discPct)}€`
      : `${base}€`,
    originalDisplay: discPct > 0 ? `${base}€` : '',
  });

  const starter = calc(bp.starter, discounts.starter);
  const pro = calc(bp.pro, discounts.pro);
  const directorCalc = calc(bp.director, discounts.director);

  return {
    starter,
    pro,
    director: { 
      ...directorCalc, 
      isContact: bp.director === 0 
    }
  };
}
