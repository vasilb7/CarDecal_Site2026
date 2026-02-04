import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pt-24 pb-10 px-6 max-w-6xl mx-auto"
    >
      <h1 className="text-3xl md:text-4xl font-serif mb-8 text-gold-accent text-center md:text-left border-b border-white/10 pb-4">
        {t('privacy.title')}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 text-text-muted text-sm leading-snug">
        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-gold-accent pl-3">{t('privacy.intro_title')}</h2>
          <p className="pl-3.5">{t('privacy.intro_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-gold-accent pl-3">{t('privacy.collect_title')}</h2>
          <div className="pl-3.5">
              <p className="mb-2">{t('privacy.collect_text')}</p>
              <ul className="list-disc pl-4 space-y-1 marker:text-gold-accent">
                <li>{t('privacy.collect_item1')}</li>
                <li>{t('privacy.collect_item2')}</li>
                <li>{t('privacy.collect_item3')}</li>
              </ul>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-gold-accent pl-3">{t('privacy.usage_title')}</h2>
          <div className="pl-3.5">
              <p className="mb-2">{t('privacy.usage_text')}</p>
              <ul className="list-disc pl-4 space-y-1 marker:text-gold-accent">
                <li>{t('privacy.usage_item1')}</li>
                <li>{t('privacy.usage_item2')}</li>
                <li>{t('privacy.usage_item3')}</li>
              </ul>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-gold-accent pl-3">{t('privacy.sharing_title')}</h2>
          <p className="pl-3.5">{t('privacy.sharing_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-gold-accent pl-3">{t('privacy.security_title')}</h2>
          <p className="pl-3.5">{t('privacy.security_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-gold-accent pl-3">{t('privacy.rights_title')}</h2>
          <p className="pl-3.5">{t('privacy.rights_text')}</p>
        </section>
      </div>
    </motion.div>
  );
};

export default PrivacyPage;
