import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pt-32 pb-20 px-6 max-w-4xl mx-auto"
    >
      <h1 className="text-4xl md:text-5xl font-serif mb-8 text-gold-accent">
        {t('privacy.title')}
      </h1>
      
      <div className="prose prose-invert max-w-none space-y-8 text-text-muted leading-relaxed">
        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('privacy.intro_title')}</h2>
          <p>{t('privacy.intro_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('privacy.collect_title')}</h2>
          <p>{t('privacy.collect_text')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('privacy.collect_item1')}</li>
            <li>{t('privacy.collect_item2')}</li>
            <li>{t('privacy.collect_item3')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('privacy.usage_title')}</h2>
          <p>{t('privacy.usage_text')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('privacy.usage_item1')}</li>
            <li>{t('privacy.usage_item2')}</li>
            <li>{t('privacy.usage_item3')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('privacy.sharing_title')}</h2>
          <p>{t('privacy.sharing_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('privacy.security_title')}</h2>
          <p>{t('privacy.security_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('privacy.rights_title')}</h2>
          <p>{t('privacy.rights_text')}</p>
        </section>
      </div>
    </motion.div>
  );
};

export default PrivacyPage;
