
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-surface border-t border-border">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-xl font-serif font-bold text-text-primary">VB Models</h3>
            <p className="mt-2 text-text-muted text-sm">{t('home.hero_subtitle')}</p>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-text-muted text-sm">{t('footer.navigate')}</h4>
            <ul className="mt-4 space-y-2">
              <li><Link to="/models" className="hover:text-gold-accent transition-colors">{t('nav.models')}</Link></li>
              <li><Link to="/about" className="hover:text-gold-accent transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/services" className="hover:text-gold-accent transition-colors">{t('nav.services')}</Link></li>
              <li><Link to="/contact" className="hover:text-gold-accent transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="uppercase tracking-widest text-text-muted text-sm">{t('footer.connect')}</h4>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="hover:text-gold-accent transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-gold-accent transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-gold-accent transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-text-muted text-xs uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} VB Models. {t('footer.rights')}</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/privacy" className="hover:text-gold-accent transition-colors">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-gold-accent transition-colors">{t('footer.terms')}</Link>
            <Link to="/legal" className="hover:text-gold-accent transition-colors">{t('footer.legal')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

