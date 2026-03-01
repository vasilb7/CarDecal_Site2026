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
      className="pt-24 pb-10 px-6 max-w-6xl mx-auto"
    >
      <h1 className="text-3xl md:text-4xl font-serif mb-8 text-red-600 text-center md:text-left border-b border-white/10 pb-4">
        {t('legal_page.title')}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 text-text-muted text-sm leading-snug">
        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('legal_page.comp_title')}</h2>
          <div className="space-y-1 pl-3.5">
            <p><strong className="text-white">{t('legal_page.comp_name')}:</strong> {SITE_CONFIG.company.name}</p>
            <p><strong className="text-white">{t('legal_page.hq')}:</strong> {i18n.language === 'bg' ? SITE_CONFIG.company.headquarters : SITE_CONFIG.company.headquartersEn}</p>
            <p><strong className="text-white">{t('legal_page.addr')}:</strong> {i18n.language === 'bg' ? SITE_CONFIG.company.address : SITE_CONFIG.company.addressEn}</p>
            <p><strong className="text-white">{t('legal_page.vat')}:</strong> {SITE_CONFIG.company.vat}</p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('legal_page.contacts_title')}</h2>
          <div className="space-y-1 pl-3.5">
            <p><strong className="text-white">{t('legal_page.email')}:</strong> <a href={`mailto:${SITE_CONFIG.contact.email}`} className="hover:text-red-600 transition-colors underline decoration-red-600/30">{SITE_CONFIG.contact.email}</a></p>
            <p><strong className="text-white">{t('legal_page.phone')}:</strong> <a href={`tel:${SITE_CONFIG.contact.phone.replace(/\s/g, '')}`} className="hover:text-red-600 transition-colors underline decoration-red-600/30">{SITE_CONFIG.contact.phone}</a></p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('legal_page.disclaimer_title')}</h2>
          <p className="pl-3.5">{t('legal_page.disclaimer_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('legal_page.links_title')}</h2>
          <p className="pl-3.5">{t('legal_page.links_text')}</p>
        </section>
      </div>
    </motion.div>
  );
};

export default LegalPage;
