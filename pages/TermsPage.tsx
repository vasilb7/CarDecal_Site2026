import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pt-32 pb-20 px-6 max-w-4xl mx-auto"
    >
      <h1 className="text-4xl md:text-5xl font-serif mb-8 text-gold-accent">
        {t('terms_page.title')}
      </h1>
      
      <div className="prose prose-invert max-w-none space-y-8 text-text-muted leading-relaxed">
        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('terms_page.gen_title')}</h2>
          <p>{t('terms_page.gen_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('terms_page.reg_title')}</h2>
          <p>{t('terms_page.reg_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('terms_page.book_title')}</h2>
          <p>{t('terms_page.book_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('terms_page.resp_title')}</h2>
          <p>{t('terms_page.resp_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('terms_page.intel_title')}</h2>
          <p>{t('terms_page.intel_text')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-serif text-text-primary mb-4">{t('terms_page.term_title')}</h2>
          <p>{t('terms_page.term_text')}</p>
        </section>
      </div>
    </motion.div>
  );
};

export default TermsPage;
