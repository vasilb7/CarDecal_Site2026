import { PricingCard } from "@/components/ui/dark-gradient-pricing";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Shield, Zap, Crown, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePricing } from "@/hooks/usePricing";

/* Small animated sparkle dots for the background */
const StarField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(24)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          width: Math.random() * 2 + 1,
          height: Math.random() * 2 + 1,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          opacity: [0.05, 0.3, 0.05],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 5,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

const ACCENT = "#2dd4bf"; // teal-400

const StandardPricingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { activePlan } = useAuth();
  const { computed, loading } = usePricing("none");

  const handleCheckout = (planId: string) => {
    navigate(`/${lang || "bg"}/checkout/${planId}`);
  };

  if (loading || !computed) {
    return (
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center py-24 md:py-36 bg-[#020202]">
        <StarField />
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
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center py-24 md:py-36 bg-[#020202]">
      {/* Starfield Background */}
      <StarField />

      {/* Soft ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[20%] w-[35%] h-[35%] rounded-full bg-teal-500/[0.03] blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-amber-500/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 w-full">
        {/* Header */}
        <motion.div
          className="mb-16 md:mb-20 space-y-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-4xl md:text-6xl font-serif leading-tight text-white italic">
            {t("pricing.title")}
          </h2>
          <p className="text-white/40 font-light max-w-2xl mx-auto uppercase tracking-[0.4em] text-[9px]">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
          {/* ── СТАРТОВ ── */}
          <PricingCard
            tier={t("pricing.scouting")}
            price={computed.starter.display}
            bestFor={t("pricing.for_indie")}
            CTA={
              activePlan === "scouting" || activePlan === "starter"
                ? t("pricing.current_plan")
                : t("pricing.cta_browse")
            }
            isCurrent={activePlan === "scouting" || activePlan === "starter"}
            gradient="linear-gradient(160deg, #0a0a0a 0%, #040404 100%)"
            accentColor={ACCENT}
            ribbonColor="#333"
            icon={<Zap className="w-5 h-5" style={{ color: ACCENT }} />}
            onClick={() => handleCheckout("scouting")}
            benefits={[
              { text: t("pricing.benefits.new_faces"), checked: true },
              { text: t("pricing.benefits.online_booking"), checked: true },
              { text: t("pricing.benefits.response_24h"), checked: true },
              { text: t("pricing.benefits.casting_reels"), checked: false },
              { text: t("pricing.benefits.dedicated_agent"), checked: false },
              { text: t("pricing.benefits.usage_rights"), checked: false },
            ]}
          />

          {/* ── ПРО (BEST VALUE) ── */}
          <PricingCard
            tier={t("pricing.casting")}
            price={computed.pro.display}
            bestFor={t("pricing.for_commercial")}
            CTA={
              activePlan === "casting" || activePlan === "pro"
                ? t("pricing.current_plan")
                : t("pricing.cta_start")
            }
            isCurrent={activePlan === "casting" || activePlan === "pro"}
            gradient="linear-gradient(160deg, #111111 0%, #050505 100%)"
            accentColor={ACCENT}
            ribbonColor={ACCENT}
            icon={<Crown className="w-5 h-5" style={{ color: ACCENT }} />}
            featured={true}
            onClick={() => handleCheckout("casting")}
            benefits={[
              { text: t("pricing.benefits.mainboard"), checked: true },
              { text: t("pricing.benefits.priority_booking"), checked: true },
              { text: t("pricing.benefits.response_4h"), checked: true },
              { text: t("pricing.benefits.casting_reels"), checked: true },
              { text: t("pricing.benefits.dedicated_agent"), checked: true },
              { text: t("pricing.benefits.production_logistics"), checked: false },
            ]}
          />

          {/* ── ДИРЕКТОРСКИ ИЗБОР ── */}
          <PricingCard
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
            accentColor="#fbbf24"
            ribbonColor="#333"
            icon={<Shield className="w-5 h-5 text-amber-400" />}
            onClick={() => handleCheckout("campaign")}
            benefits={[
              { text: t("pricing.benefits.full_database"), checked: true },
              { text: t("pricing.benefits.priority_247"), checked: true },
              { text: t("pricing.benefits.wholistic_rights"), checked: true },
              { text: t("pricing.benefits.producer"), checked: true },
              { text: t("pricing.benefits.travel"), checked: true },
              { text: t("pricing.benefits.creative_consult"), checked: true },
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default StandardPricingPage;
