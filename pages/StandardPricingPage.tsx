import React, { useState, useEffect } from "react";
import { PricingCard } from "@/components/ui/dark-gradient-pricing";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePricing } from "@/hooks/usePricing";
import { supabase } from "@/lib/supabase";
import { settingsService } from "@/lib/settingsService";
import { cn } from "@/lib/utils";


const ACCENT = "#2dd4bf"; // teal-400

interface StandardPricingPageProps {
  promoType?: string;
}

const StandardPricingPage: React.FC<StandardPricingPageProps> = ({ promoType = 'none' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { activePlan } = useAuth();
  
  // Use "none" if promoType is not recognized or is just regular standard fallback
  const effectivePromo = (promoType === 'photoshoot') ? 'photoshoot' : 'none';
  // But usePricing only accepts 'none' | 'valentines' | 'christmas' in typescript definition unless updated?
  // We updated interface but not usePricing signature? 
  // Wait, I didn't update usePricing signature in previous step, only interface. 
  // usePricing signature was: export function usePricing(promoType: 'none' | 'valentines' | 'christmas' = 'none')
  // I should cast it or update usePricing signature. Let's cast for now or assume it accepts string if I updated it? 
  // I only updated interface PricingData. I did NOT update usePricing signature. 
  // Let's use 'as any' for now to be safe or update usePricing signature next. 
  // Actually, I should update usePricing signature too.
  
  const [isAnnual, setIsAnnual] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const { computed, loading: pricingLoading } = usePricing(effectivePromo as any, isAnnual);

  const getBgKey = () => effectivePromo === 'photoshoot' ? 'pricing_bg_photoshoot' : 'pricing_bg_standard';
  const getTypeKey = () => effectivePromo === 'photoshoot' ? 'pricing_type_photoshoot' : 'pricing_type_standard';

  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem(getBgKey()) || "/Site_Pics/Pricing/backroundpricing.png");
  const [bgType, setBgType] = useState<'image' | 'video'>(() => (localStorage.getItem(getTypeKey()) as 'image' | 'video') || 'image');

  // Update state when promoType changes
  useEffect(() => {
    const bgKey = getBgKey();
    const typeKey = getTypeKey();
    
    // Load initial
    const cachedBg = localStorage.getItem(bgKey);
    const cachedType = localStorage.getItem(typeKey);
    
    if (cachedBg) setBgUrl(cachedBg);
    if (cachedType) setBgType(cachedType as 'image' | 'video');

    settingsService.getPricingSettings().then(s => {
      // @ts-ignore
      const newBg = s[bgKey];
      // @ts-ignore
      const newType = s[typeKey] || 'image';
      
      if (newBg) {
        setBgUrl(newBg);
        localStorage.setItem(bgKey, newBg);
      }
      setBgType(newType);
      localStorage.setItem(typeKey, newType);
    });
  }, [effectivePromo]);

  useEffect(() => {
    const bgKey = getBgKey();
    const typeKey = getTypeKey();

    const channel = supabase
      .channel('standard_pricing_bg')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, 
      (payload: any) => {
        const { key, value } = payload.new || {};
        if (key === bgKey) {
          setBgUrl(value);
          localStorage.setItem(bgKey, value);
        }
        if (key === typeKey) {
          setBgType(value as any);
          localStorage.setItem(typeKey, value);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [effectivePromo]);

  const handleCheckout = (planId: string) => {
    navigate(`/${lang || "bg"}/checkout/${planId}`);
  };

  if (pricingLoading || !computed) {
    return (
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center py-24 md:py-36 bg-[#020202]">
        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 w-full text-center space-y-20">
          <div className="space-y-4">
            <div className="h-12 w-64 bg-white/5 rounded-lg mx-auto animate-pulse" />
            <div className="h-4 w-48 bg-white/5 rounded-full mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[500px] bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden min-h-screen w-full flex flex-col items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-[#020202]">
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

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[20%] w-[35%] h-[35%] rounded-full bg-teal-500/[0.03] blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-amber-500/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1100px] mx-auto flex flex-col items-center">
        {/* Header */}
        <motion.div
          className="mb-12 md:mb-16 space-y-4 text-center max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-3xl md:text-5xl font-serif leading-tight text-white uppercase tracking-[0.2em] font-light">
            {t("pricing.title")}
          </h2>
          <p className="text-white/40 font-light uppercase tracking-[0.4em] text-[8px] md:text-[9px]">
            {t("pricing.subtitle")}
          </p>

          {/* Business/Personal Toggle */}
          <div className="flex items-center justify-center pt-8">
            <div className="bg-white/5 border border-white/10 rounded-full p-1 flex items-center gap-1">
              <button
                onClick={() => setIsBusiness(false)}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                  !isBusiness ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                )}
              >
                {t("pricing.personal")}
              </button>
              <button
                onClick={() => setIsBusiness(true)}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                  isBusiness ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                )}
              >
                {t("pricing.business")}
              </button>
            </div>
            
            {/* Annual Toggle with clear labels */}
            <div className="flex items-center gap-4 ml-8 bg-white/[0.03] border border-white/10 rounded-full px-4 py-2">
              <span className={cn(
                "text-[9px] uppercase tracking-widest transition-colors",
                !isAnnual ? "text-white font-bold" : "text-white/30"
              )}>
                {t("pricing.monthly")}
              </span>
              
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative w-9 h-5 rounded-full bg-white/5 border border-white/20 p-1 transition-colors hover:border-white/40"
              >
                <motion.div
                  animate={{ x: isAnnual ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-3 h-3 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]"
                />
              </button>

              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[9px] uppercase tracking-widest transition-colors",
                  isAnnual ? "text-white font-bold" : "text-white/30"
                )}>
                  {t("pricing.annual")}
                </span>
                <span className="text-[8px] font-black text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded border border-teal-400/20">
                  -{computed?.starter?.savingsPercent || 20}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div 
          layout
          className={cn(
            "grid gap-6 lg:gap-8 items-stretch w-full",
            isBusiness 
              ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto" 
              : "grid-cols-1 md:grid-cols-3"
          )}
        >
          {/* ── СТАРТОВ / ПРО ── */}
          <PricingCard
            key="card-left"
            tier={isBusiness ? t("pricing.casting") : t("pricing.scouting")}
            price={isBusiness ? computed.pro.display : computed.starter.display}
            bestFor={isBusiness ? t("pricing.for_commercial") : t("pricing.for_indie")}
            CTA={
              activePlan === (isBusiness ? "pro" : "starter")
                ? t("pricing.current_plan")
                : t("pricing.cta_browse")
            }
            isCurrent={activePlan === (isBusiness ? "pro" : "starter")}
            gradient="linear-gradient(160deg, #0a0a0a 0%, #040404 100%)"
            accentColor={ACCENT}
            ribbonColor={isBusiness ? ACCENT : "#333"}
            featured={isBusiness}
            onClick={() => handleCheckout(isBusiness ? "pro" : "starter")}
            originalPrice={isBusiness ? computed.pro.originalDisplay : computed.starter.originalDisplay}
            unitLabel={isBusiness ? `EUR / ${t("pricing.month_unit")}` : t("pricing.month_unit")}
            billingLabel={isBusiness ? t("pricing.includes_vat", { amount: (computed.pro.discounted * 0.2).toFixed(2) }) : (isAnnual ? t("pricing.billed_annually") : undefined)}
            discountLabel={isAnnual ? (isBusiness ? t("pricing.best_price") : t("pricing.save_amount", { percent: computed.starter.savingsPercent })) : undefined}
            benefits={isBusiness ? [
              { text: t("pricing.benefits.mainboard"), checked: true },
              { text: t("pricing.benefits.priority_booking"), checked: true },
              { text: t("pricing.benefits.response_4h"), checked: true },
              { text: t("pricing.benefits.casting_reels"), checked: true },
              { text: t("pricing.benefits.dedicated_agent"), checked: true },
              { text: t("pricing.benefits.usage_rights"), checked: false },
            ] : [
              { text: t("pricing.benefits.new_faces"), checked: true },
              { text: t("pricing.benefits.online_booking"), checked: true },
              { text: t("pricing.benefits.response_24h"), checked: true },
              { text: t("pricing.benefits.casting_reels"), checked: false },
              { text: t("pricing.benefits.dedicated_agent"), checked: false },
              { text: t("pricing.benefits.usage_rights"), checked: false },
            ]}
          />

          {/* ── ПРО / БИЗНЕС ── */}
          <PricingCard
            tier={isBusiness ? t("pricing.business") : t("pricing.casting")}
            price={isBusiness ? computed.business.display : computed.pro.display}
            bestFor={isBusiness ? t("pricing.for_global") : t("pricing.for_commercial")}
            CTA={
              activePlan === (isBusiness ? "business" : "pro")
                ? t("pricing.current_plan")
                : t("pricing.cta_start")
            }
            isCurrent={activePlan === (isBusiness ? "business" : "pro")}
            gradient="linear-gradient(160deg, #111111 0%, #050505 100%)"
            accentColor={ACCENT}
            ribbonColor={ACCENT}
            featured={!isBusiness}
            key="card-middle"
            onClick={() => handleCheckout(isBusiness ? "business" : "pro")}
            originalPrice={isBusiness ? computed.business.originalDisplay : computed.pro.originalDisplay}
            unitLabel={isBusiness ? `EUR / ${t("pricing.month_unit")}` : t("pricing.month_unit")}
            billingLabel={isBusiness ? t("pricing.includes_vat", { amount: (computed.business.discounted * 0.2).toFixed(2) }) : (isAnnual ? t("pricing.billed_annually") : undefined)}
            discountLabel={isAnnual ? (isBusiness ? t("pricing.save_amount", { percent: computed.business.savingsPercent }) : t("pricing.best_price")) : undefined}
            benefits={isBusiness ? [
              { text: t("pricing.benefits.full_database"), checked: true },
              { text: t("pricing.benefits.priority_247"), checked: true },
              { text: t("pricing.benefits.wholistic_rights"), checked: true },
              { text: t("pricing.benefits.producer"), checked: true },
              { text: t("pricing.benefits.travel"), checked: true },
              { text: t("pricing.benefits.creative_consult"), checked: true },
            ] : [
              { text: t("pricing.benefits.mainboard"), checked: true },
              { text: t("pricing.benefits.priority_booking"), checked: true },
              { text: t("pricing.benefits.response_4h"), checked: true },
              { text: t("pricing.benefits.casting_reels"), checked: true },
              { text: t("pricing.benefits.dedicated_agent"), checked: true },
              { text: t("pricing.benefits.production_logistics"), checked: false },
            ]}
          />

          {/* ── ДИРЕКТОРСКИ ИЗБОР ── */}
          <AnimatePresence>
          {!isBusiness && (
            <PricingCard
              key="card-right"
              tier={t("pricing.campaign")}
              price={
                computed.director.isContact
                  ? t("pricing.custom")
                  : computed.director.display
              }
              bestFor={t("pricing.for_global")}
              CTA={
                activePlan === 'campaign'
                  ? t('pricing.current_plan')
                  : computed.director.isContact
                    ? t('pricing.cta_contact')
                    : t('pricing.cta_start')
              }
              isCurrent={activePlan === "campaign"}
              gradient="linear-gradient(160deg, #0a0a0a 0%, #040404 100%)"
              accentColor={ACCENT}
              ribbonColor="#333"
              onClick={() => handleCheckout("campaign")}
              originalPrice={computed.director.originalDisplay}
              unitLabel={computed.director.isContact ? undefined : t("pricing.month_unit")}
              billingLabel={isAnnual && !computed.director.isContact ? t("pricing.billed_annually") : undefined}
              discountLabel={isAnnual && !computed.director.isContact ? t("pricing.save_amount", { percent: computed.director.savingsPercent }) : undefined}
              benefits={[
                { text: t("pricing.benefits.full_database"), checked: true },
                { text: t("pricing.benefits.priority_247"), checked: true },
                { text: t("pricing.benefits.wholistic_rights"), checked: true },
                { text: t("pricing.benefits.producer"), checked: true },
                { text: t("pricing.benefits.travel"), checked: true },
                { text: t("pricing.benefits.creative_consult"), checked: true },
              ]}
            />
          )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default StandardPricingPage;
