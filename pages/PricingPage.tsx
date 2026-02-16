import React, { useState, useEffect } from 'react';
import { PricingCard } from "@/components/ui/dark-gradient-pricing"
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Crown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePricing } from '@/hooks/usePricing';
import { supabase } from '@/lib/supabase';
import { settingsService } from '@/lib/settingsService';

const PricingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { activePlan } = useAuth();
  const { computed, loading: pricingLoading } = usePricing('valentines');
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem('pricing_bg_valentines') || "/Site_Pics/Pricing/backroundpricing.png");
  const [bgType, setBgType] = useState<'image' | 'video'>(() => (localStorage.getItem('pricing_type_valentines') as 'image' | 'video') || 'image');

  useEffect(() => {
    settingsService.getPricingSettings().then(s => {
      setBgUrl(s.pricing_bg_valentines);
      // @ts-ignore
      setBgType(s.pricing_type_valentines || 'image');
      localStorage.setItem('pricing_bg_valentines', s.pricing_bg_valentines);
      // @ts-ignore
      localStorage.setItem('pricing_type_valentines', s.pricing_type_valentines || 'image');
    });

    const channel = supabase
      .channel('valentines_pricing_bg')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, 
      (payload: any) => {
        const { key, value } = payload.new || {};
        if (key === 'pricing_bg_valentines') {
          setBgUrl(value);
          localStorage.setItem('pricing_bg_valentines', value);
        }
        if (key === 'pricing_type_valentines') {
          setBgType(value as any);
          localStorage.setItem('pricing_type_valentines', value);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCheckout = (planId: string) => {
    navigate(`/${lang || 'bg'}/checkout/${planId}`);
  };

  if (pricingLoading || !computed) {
    return (
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center py-24 md:py-36"
        style={{ background: 'linear-gradient(180deg, #0B0B0C 0%, #1a0a10 100%)' }}
      >
        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 w-full text-center space-y-20">
          <div className="space-y-4">
             <div className="h-10 w-48 bg-pink-500/10 rounded-full mx-auto animate-pulse" />
             <div className="h-12 w-72 bg-white/5 rounded-lg mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[500px] bg-pink-500/[0.02] border border-pink-500/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center py-24 md:py-36"
      style={{ background: 'linear-gradient(180deg, #0B0B0C 0%, #1a0a10 30%, #200e18 50%, #1a0a10 70%, #0B0B0C 100%)' }}
    >
      {/* Background Media */}
      {bgType === 'video' ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 w-full h-full object-cover opacity-30 pointer-events-none"
        >
          <source src={bgUrl} type="video/mp4" />
        </video>
      ) : (
        <div 
          className="absolute inset-0 z-0 opacity-30 pointer-events-none"
          style={{ 
            backgroundImage: `url("${bgUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
      {/* Background hearts floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${8 + (i * 7.5)}%`,
              top: `${10 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.03, 0.08, 0.03],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          >
            <Heart 
              className="fill-pink-500 text-pink-500" 
              style={{ width: `${16 + (i % 4) * 8}px`, height: `${16 + (i % 4) * 8}px` }}
            />
          </motion.div>
        ))}
      </div>

      {/* Radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 w-full">
        {/* Header */}
        <motion.div 
          className="mb-16 md:mb-20 space-y-6 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400 animate-pulse" />
            <span className="text-pink-400 text-sm font-bold uppercase tracking-[0.3em]">
              Valentine's Special
            </span>
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400 animate-pulse" />
          </div>
          <h2 className="text-4xl md:text-6xl font-serif leading-tight text-white">
            {t('pricing.title')}
          </h2>
          <p className="text-base md:text-xl text-white/50 font-light max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/20 rounded-full px-5 py-2 text-pink-300 text-xs font-bold uppercase tracking-widest">
              {computed.starter.discountPercent > 0 
                ? `💕 -${computed.starter.discountPercent}% Промо пакети до 28.02`
                : 'Промо пакети до 28.02'
              }
            </span>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
          <PricingCard
            tier={t('pricing.scouting')}
            price={computed.starter.display}
            originalPrice={computed.starter.originalDisplay}
            bestFor={t('pricing.for_indie')}
            CTA={(activePlan === 'scouting' || activePlan === 'starter') ? t('pricing.current_plan') : t('pricing.cta_browse')}
            isCurrent={activePlan === 'scouting' || activePlan === 'starter'}
            gradient="linear-gradient(135deg, #831843 0%, #500724 40%, #2d0413 100%)"
            accentColor="#ec4899"
            ribbonColor="linear-gradient(135deg, #ec4899, #db2777)"
            icon={<Heart className="w-5 h-5 text-pink-300" />}
            discountLabel={computed.starter.discountPercent > 0 ? `-${computed.starter.discountPercent}% Valentine's` : undefined}
            onClick={() => handleCheckout('scouting')}
            benefits={[
              { text: t('pricing.benefits.new_faces'), checked: true },
              { text: t('pricing.benefits.online_booking'), checked: true },
              { text: t('pricing.benefits.response_24h'), checked: true },
              { text: t('pricing.benefits.casting_reels'), checked: false },
              { text: t('pricing.benefits.dedicated_agent'), checked: false },
              { text: t('pricing.benefits.usage_rights'), checked: false },
            ]}
          />
          <PricingCard
            tier={t('pricing.casting')}
            price={computed.pro.display}
            originalPrice={computed.pro.originalDisplay}
            bestFor={t('pricing.for_commercial')}
            CTA={(activePlan === 'casting' || activePlan === 'pro') ? t('pricing.current_plan') : t('pricing.cta_start')}
            isCurrent={activePlan === 'casting' || activePlan === 'pro'}
            gradient="linear-gradient(135deg, #be185d 0%, #831843 40%, #500724 100%)"
            accentColor="#f472b6"
            ribbonColor="linear-gradient(135deg, #f472b6, #ec4899)"
            icon={<Crown className="w-5 h-5 text-pink-200" />}
            featured={true}
            discountLabel={computed.pro.discountPercent > 0 ? `-${computed.pro.discountPercent}% Valentine's` : undefined}
            onClick={() => handleCheckout('casting')}
            benefits={[
              { text: t('pricing.benefits.mainboard'), checked: true },
              { text: t('pricing.benefits.priority_booking'), checked: true },
              { text: t('pricing.benefits.response_4h'), checked: true },
              { text: t('pricing.benefits.casting_reels'), checked: true },
              { text: t('pricing.benefits.dedicated_agent'), checked: true },
              { text: t('pricing.benefits.production_logistics'), checked: false },
            ]}
          />
          <PricingCard
            tier={t('pricing.campaign')}
            price={computed.director.isContact ? t('pricing.custom') : computed.director.display}
            originalPrice={computed.director.originalDisplay}
            bestFor={t('pricing.for_global')}
            CTA={activePlan === 'campaign' ? t('pricing.current_plan') : (computed.director.isContact ? t('pricing.cta_contact') : t('pricing.cta_start'))}
            isCurrent={activePlan === 'campaign'}
            gradient="linear-gradient(135deg, #9f1239 0%, #6b0f2e 40%, #3b0717 100%)"
            accentColor="#fb7185"
            ribbonColor="linear-gradient(135deg, #fb7185, #f43f5e)"
            icon={<Sparkles className="w-5 h-5 text-rose-300" />}
            discountLabel={computed.director.discountPercent > 0 ? `-${computed.director.discountPercent}% Valentine's` : undefined}
            onClick={() => handleCheckout('campaign')}
            benefits={[
              { text: t('pricing.benefits.full_database'), checked: true },
              { text: t('pricing.benefits.priority_247'), checked: true },
              { text: t('pricing.benefits.wholistic_rights'), checked: true },
              { text: t('pricing.benefits.producer'), checked: true },
              { text: t('pricing.benefits.travel'), checked: true },
              { text: t('pricing.benefits.creative_consult'), checked: true },
            ]}
          />
        </div>

        {/* Bottom note */}
        <motion.p 
          className="text-center text-white/30 text-xs mt-12 max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          ❤️ Промоционалните цени са валидни до 28 февруари 2026. Всички пакети включват персонална консултация.
        </motion.p>
      </div>
    </section>
  )
}

export default PricingPage;
