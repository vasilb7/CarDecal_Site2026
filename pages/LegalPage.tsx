import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SITE_CONFIG } from '../lib/site-config';

const LegalPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pt-32 pb-20 px-6 max-w-4xl mx-auto"
    >
      <h1 className="text-4xl md:text-5xl font-serif mb-8 text-gold-accent">
        {t('legal_page.title')}
      </h1>
      
      <div className="prose prose-invert max-w-none space-y-8 text-text-muted leading-relaxed">
        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('legal_page.comp_title')}</h2>
          <div className="space-y-4">
            <p><strong className="text-text-primary">{t('legal_page.comp_name')}:</strong> {SITE_CONFIG.company.name}</p>
            <p><strong className="text-text-primary">{t('legal_page.hq')}:</strong> {i18n.language === 'bg' ? SITE_CONFIG.company.headquarters : SITE_CONFIG.company.headquartersEn}</p>
            <p><strong className="text-text-primary">{t('legal_page.addr')}:</strong> {i18n.language === 'bg' ? SITE_CONFIG.company.address : SITE_CONFIG.company.addressEn}</p>
            <p><strong className="text-text-primary">{t('legal_page.vat')}:</strong> {SITE_CONFIG.company.vat}</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('legal_page.contacts_title')}</h2>
          <div className="space-y-4">
            <p><strong className="text-text-primary">{t('legal_page.email')}:</strong> <a href={`mailto:${SITE_CONFIG.contact.email}`} className="hover:text-gold-accent transition-colors">{SITE_CONFIG.contact.email}</a></p>
            <p><strong className="text-text-primary">{t('legal_page.phone')}:</strong> <a href={`tel:${SITE_CONFIG.contact.phone.replace(/\s/g, '')}`} className="hover:text-gold-accent transition-colors">{SITE_CONFIG.contact.phone}</a></p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('legal_page.disclaimer_title')}</h2>
          <p>{t('legal_page.disclaimer_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('legal_page.links_title')}</h2>
          <p>{t('legal_page.links_text')}</p>
        </section>
      </div>
    </motion.div>
  );
};

export default LegalPage;
