import { PricingCard } from "@/components/ui/dark-gradient-pricing"
import { useTranslation } from 'react-i18next';

const PricingPage = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-background text-foreground min-h-screen">
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 md:px-8">
        <div className="mb-12 space-y-3">
          <h2 className="text-center text-3xl font-semibold leading-tight sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight">
            {t('pricing.title')}
          </h2>
          <p className="text-center text-base text-muted-foreground md:text-lg">
            {t('pricing.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PricingCard
            tier={t('pricing.scouting')}
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
            tier={t('pricing.casting')}
            price={t('pricing.standard')}
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
            tier={t('pricing.campaign')}
            price={t('pricing.custom')}
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
