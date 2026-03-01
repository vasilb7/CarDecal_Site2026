import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pt-24 pb-10 px-6 max-w-6xl mx-auto"
    >
      <h1 className="text-3xl md:text-4xl font-serif mb-8 text-red-600 text-center md:text-left border-b border-white/10 pb-4">
        {t('terms_page.title')}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 text-text-muted text-sm leading-snug">
        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('terms_page.gen_title')}</h2>
          <p className="pl-3.5">{t('terms_page.gen_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('terms_page.reg_title')}</h2>
          <p className="pl-3.5">{t('terms_page.reg_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('terms_page.book_title')}</h2>
          <p className="pl-3.5">{t('terms_page.book_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('terms_page.resp_title')}</h2>
          <p className="pl-3.5">{t('terms_page.resp_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('terms_page.intel_title')}</h2>
          <p className="pl-3.5">{t('terms_page.intel_text')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wide border-l-2 border-red-600 pl-3">{t('terms_page.term_title')}</h2>
          <p className="pl-3.5">{t('terms_page.term_text')}</p>
        </section>
      </div>
    </motion.div>
  );
};

export default TermsPage;
