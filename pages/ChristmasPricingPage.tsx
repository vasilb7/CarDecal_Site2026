import React, { useState, useEffect } from "react";
import { ChristmasPricingCard } from "@/components/ui/christmas-pricing"
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TreePine, Sparkles, Crown, Snowflake, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePricing } from '@/hooks/usePricing';
import { supabase } from "@/lib/supabase";
import { settingsService } from "@/lib/settingsService";

const ChristmasPricingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { activePlan } = useAuth();
  const { computed, loading: pricingLoading } = usePricing('christmas');
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem('pricing_bg_christmas') || "/Site_Pics/Pricing/backroundpricing.png");
  const [bgType, setBgType] = useState<'image' | 'video'>(() => (localStorage.getItem('pricing_type_christmas') as 'image' | 'video') || 'image');

  useEffect(() => {
    settingsService.getPricingSettings().then(s => {
      setBgUrl(s.pricing_bg_christmas);
      // @ts-ignore
      setBgType(s.pricing_type_christmas || 'image');
      localStorage.setItem('pricing_bg_christmas', s.pricing_bg_christmas);
      // @ts-ignore
      localStorage.setItem('pricing_type_christmas', s.pricing_type_christmas || 'image');
    });

    const channel = supabase
      .channel('christmas_pricing_bg')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, 
      (payload: any) => {
        const { key, value } = payload.new || {};
        if (key === 'pricing_bg_christmas') {
          setBgUrl(value);
          localStorage.setItem('pricing_bg_christmas', value);
        }
        if (key === 'pricing_type_christmas') {
          setBgType(value as any);
          localStorage.setItem('pricing_type_christmas', value);
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
        style={{ background: 'linear-gradient(180deg, #0B0B0C 0%, #0a1a10 100%)' }}
      >
        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 w-full text-center space-y-20">
          <div className="space-y-4">
             <div className="h-10 w-48 bg-emerald-500/10 rounded-full mx-auto animate-pulse" />
             <div className="h-12 w-72 bg-white/5 rounded-lg mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[500px] bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center py-24 md:py-36"
      style={{ background: 'linear-gradient(180deg, #0B0B0C 0%, #0a1a10 30%, #0e2018 50%, #0a1a10 70%, #0B0B0C 100%)' }}
    >
      {/* Background Media */}
      {bgType === 'video' ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 w-full h-full object-cover opacity-20 pointer-events-none"
        >
          <source src={bgUrl} type="video/mp4" />
        </video>
      ) : (
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{ 
            backgroundImage: `url("${bgUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
      {/* Background snowflakes floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${5 + (i * 6.5)}%`,
              top: `${5 + (i % 4) * 25}%`,
            }}
            animate={{
              y: [0, 30, 0],
              opacity: [0.03, 0.1, 0.03],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 6 + (i % 4),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          >
            <Snowflake 
              className="text-white" 
              style={{ width: `${14 + (i % 5) * 6}px`, height: `${14 + (i % 5) * 6}px` }}
            />
          </motion.div>
        ))}
      </div>

      {/* Radial glow - green/gold */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(234, 179, 8, 0.04) 0%, transparent 70%)' }}
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
            <Snowflake className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-emerald-400 text-sm font-bold uppercase tracking-[0.3em]">
              {t('christmas.special_label')}
            </span>
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
          </div>
          <h2 className="text-4xl md:text-6xl font-serif leading-tight text-white">
            {t('pricing.title')}
          </h2>
          <p className="text-base md:text-xl text-white/50 font-light max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-yellow-500/20 border border-emerald-500/20 rounded-full px-5 py-2 text-emerald-300 text-xs font-bold uppercase tracking-widest">
              🎄 {computed.starter.discountPercent > 0 
                ? `-${computed.starter.discountPercent}% ${t('christmas.promo_deadline')}` 
                : t('christmas.promo_deadline')
              }
            </span>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
          <ChristmasPricingCard
            tier={t('pricing.scouting')}
            price={computed.starter.display}
            originalPrice={computed.starter.originalDisplay}
            bestFor={t('pricing.for_indie')}
            CTA={(activePlan === 'scouting' || activePlan === 'starter') ? t('pricing.current_plan') : t('pricing.cta_browse')}
            isCurrent={activePlan === 'scouting' || activePlan === 'starter'}
            gradient="linear-gradient(135deg, #064e3b 0%, #022c22 40%, #011a14 100%)"
            accentColor="#10b981"
            ribbonColor="linear-gradient(135deg, #10b981, #059669)"
            icon={<TreePine className="w-5 h-5 text-emerald-300" />}
            discountLabel={computed.starter.discountPercent > 0 ? `-${computed.starter.discountPercent}% Christmas` : undefined}
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
          <ChristmasPricingCard
            tier={t('pricing.casting')}
            price={computed.pro.display}
            originalPrice={computed.pro.originalDisplay}
            bestFor={t('pricing.for_commercial')}
            CTA={(activePlan === 'casting' || activePlan === 'pro') ? t('pricing.current_plan') : t('pricing.cta_start')}
            isCurrent={activePlan === 'casting' || activePlan === 'pro'}
            gradient="linear-gradient(135deg, #047857 0%, #064e3b 40%, #022c22 100%)"
            accentColor="#34d399"
            ribbonColor="linear-gradient(135deg, #34d399, #10b981)"
            icon={<Crown className="w-5 h-5 text-yellow-300" />}
            featured={true}
            discountLabel={computed.pro.discountPercent > 0 ? `-${computed.pro.discountPercent}% Christmas` : undefined}
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
          <ChristmasPricingCard
            tier={t('pricing.campaign')}
            price={computed.director.isContact ? t('pricing.custom') : computed.director.display}
            originalPrice={computed.director.originalDisplay}
            bestFor={t('pricing.for_global')}
            CTA={activePlan === 'campaign' ? t('pricing.current_plan') : (computed.director.isContact ? t('pricing.cta_contact') : t('pricing.cta_start'))}
            isCurrent={activePlan === 'campaign'}
            gradient="linear-gradient(135deg, #065f46 0%, #064e3b 40%, #022c22 100%)"
            accentColor="#6ee7b7"
            ribbonColor="linear-gradient(135deg, #6ee7b7, #34d399)"
            icon={<Sparkles className="w-5 h-5 text-yellow-200" />}
            discountLabel={computed.director.discountPercent > 0 ? `-${computed.director.discountPercent}% Christmas` : undefined}
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
          🎄 {t('christmas.promo_footer')}
        </motion.p>
      </div>
    </section>
  )
}

export default ChristmasPricingPage;
