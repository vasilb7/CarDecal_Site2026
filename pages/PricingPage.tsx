import { PricingCard } from "@/components/ui/dark-gradient-pricing"
import { useTranslation } from 'react-i18next';

const PricingPage = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-background text-foreground min-h-screen flex items-center justify-center py-20 md:py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 w-full">
        <div className="mb-20 space-y-6 text-center">
          <h2 className="text-4xl md:text-6xl font-serif leading-tight">
            {t('pricing.title')}
          </h2>
          <p className="text-base md:text-xl text-text-muted font-light max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PricingCard
            tier={t('pricing.tier_standard')}
            price={t('pricing.basic')}
            bestFor={t('pricing.for_indie')}
            CTA={t('pricing.cta_browse')}
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
            tier={t('pricing.tier_premium')}
            price={t('pricing.standard_plan')}
            bestFor={t('pricing.for_commercial')}
            CTA={t('pricing.cta_start')}
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
            tier={t('pricing.tier_elite')}
            price={t('pricing.custom_plan')}
            bestFor={t('pricing.for_global')}
            CTA={t('pricing.cta_contact')}
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
      </div>
    </section>
  )
}

export default PricingPage;
