
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
            <h3 className="text-xl font-serif font-bold text-text-primary tracking-widest uppercase">VB VISION</h3>
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

        {/* Partners Marquee Section */}
        <div className="mt-16 py-8 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap items-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-10 md:gap-34 px-8 md:px-16 shrink-0">
                <img src="/Site_Pics/Partners_Footer/CD logo.png" alt="Partner CD" className="h-14 md:h-20 w-auto opacity-60 hover:opacity-100 transition-all duration-500 object-contain" />
                <img src="/Site_Pics/Partners_Footer/MaxNutrition.png" alt="Partner MaxNutrition" className="h-12 md:h-16 w-auto opacity-60 hover:opacity-100 transition-all duration-500 object-contain" />
                <img src="/Site_Pics/Partners_Footer/Alexander-McQueen.png" alt="Partner Alexander-McQueen" className="h-12 md:h-15 w-auto opacity-60 hover:opacity-100 transition-all duration-500 object-contain" />
                <img src="/Site_Pics/Partners_Footer/BURBERRY.png" alt="Partner BURBERRY" className="h-12 md:h-19 w-auto opacity-60 hover:opacity-100 transition-all duration-500 object-contain" />
                <img src="/Site_Pics/Partners_Footer/VOGUE.png" alt="Partner VOGUE" className="h-12 md:h-19 w-auto opacity-60 hover:opacity-100 transition-all duration-500 object-contain" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-text-muted text-xs uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} VB VISION. {t('footer.rights')}</p>
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

