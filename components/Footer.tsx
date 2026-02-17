
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.split('-')[0];
  
  return (
    <footer className="bg-background text-silver-text pt-20 pb-10 overflow-hidden border-t border-red-accent/10">
      <div className="container mx-auto px-6">
        
        {/* TOP SECTION: LARGE HEADING */}
        <div className="text-center mb-16 select-none">
          <h2 className="flex flex-col md:flex-row items-center justify-center gap-x-3 md:gap-x-6 text-[11vw] md:text-[7vw] lg:text-[6.5vw] leading-[1.1] font-bold tracking-tight uppercase mb-4 px-4">
            <span className="text-silver-text">{t('footer.title_part1')}</span>
            <span className="relative inline-block italic font-serif text-red-accent transform -rotate-1 px-2">
               {t('footer.title_part2')}
               <span className="absolute left-0 bottom-[15%] w-full h-[0.03em] bg-red-accent/40 transform scale-x-105"></span>
            </span>
            <span className="text-silver-text">{t('footer.title_part3')}</span>
          </h2>
        </div>

        {/* MIDDLE SECTION: HERO IMAGE WITH POP-OUT EFFECT (STATIC) */}
        <div className="relative w-full aspect-[21/9] mb-32 mt-20 flex justify-center items-end bg-transparent">
          {/* РАМКА И ФОН */}
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-white/5 pointer-events-none">
            <img 
              /* МЕСТЕНЕ НА ФОНА */
              src="/Site_Pics/Footer/backround.png" 
              alt="VB Vision Background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
          </div>

          {/* МОДЕЛИТЕ - "ИЗЛИЗАЩИ" ОТ РАМКАТА (СТАТИЧНИ) */}
          <div className="relative z-10 w-full h-full flex justify-center items-end pointer-events-none">
            <img 
              /* МЕСТЕНЕ НА МОМИЧЕТАТА */
              src="/Site_Pics/Footer/1.png" 
              alt="Models" 
              className="h-[150%] w-auto object-contain transform translate-y-[0%]"
              style={{ filter: 'drop-shadow(0 40px 50px rgba(0,0,0,0.6))' }}
            />
          </div>
        </div>

        {/* BOTTOM SECTION: COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          {/* EXPLORE */}
          <div>
            <h4 className="text-red-accent text-xl font-bold uppercase mb-8 tracking-widest border-b border-red-accent/20 pb-4">
              EXPLORE
            </h4>
            <ul className="space-y-4">
              <li><Link to={`/${currentLang}/models`} className="text-silver-text/60 hover:text-red-accent transition-all hover:pl-2 duration-300 font-medium">{t('nav.models')}</Link></li>
              <li><Link to={`/${currentLang}/about`} className="text-silver-text/60 hover:text-red-accent transition-all hover:pl-2 duration-300 font-medium">{t('nav.about')}</Link></li>
              <li><Link to={`/${currentLang}/services`} className="text-silver-text/60 hover:text-red-accent transition-all hover:pl-2 duration-300 font-medium">{t('nav.services')}</Link></li>
              <li><Link to={`/${currentLang}/contact`} className="text-silver-text/60 hover:text-red-accent transition-all hover:pl-2 duration-300 font-medium">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          {/* FOLLOW */}
          <div>
            <h4 className="text-red-accent text-xl font-bold uppercase mb-8 tracking-widest border-b border-red-accent/20 pb-4">
              FOLLOW
            </h4>
            <ul className="space-y-4 text-silver-text/60">
              <li>
                <a 
                  href="https://www.instagram.com/vbvision.agency/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-red-accent transition-all hover:pl-2 duration-300 font-medium"
                >
                  INSTAGRAM
                </a>
              </li>
              <li>
                <a 
                  href="https://www.tiktok.com/@vbvision.agency" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-red-accent transition-all hover:pl-2 duration-300 font-medium"
                >
                  TIKTOK
                </a>
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/company/vb-vision" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-red-accent transition-all hover:pl-2 duration-300 font-medium"
                >
                  LINKEDIN
                </a>
              </li>
              <li>
                <a 
                  href="https://www.facebook.com/vbvision.official" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-red-accent transition-all hover:pl-2 duration-300 font-medium"
                >
                  FACEBOOK
                </a>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="text-red-accent text-xl font-bold uppercase mb-8 tracking-widest border-b border-red-accent/20 pb-4">
              CONTACT
            </h4>
            <p className="text-silver-text/80 font-bold mb-2">AGENCY@VBVISION.COM</p>
            <p className="text-silver-text/60 text-sm leading-relaxed mb-6">
              SOFIA, BULGARIA<br />
              UL. EXARCH YOSIF 15
            </p>
            <Link 
              to={`/${currentLang}/contact`}
              className="inline-block mt-6 px-10 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.22em] rounded-full relative overflow-hidden transition-all duration-500 ease-out hover:shadow-[0_12px_40px_rgba(255,255,255,0.18)] hover:scale-[1.06] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:translate-x-[-120%] hover:before:translate-x-[120%] before:transition-transform before:duration-700 before:ease-out shadow-[0_8px_24px_rgba(255,255,255,0.06)] text-center"
            >
            REACH OUT
            </Link>
          </div>
        </div>
      </div>

      {/* MARQUEE (PARTNERS) - FULL WIDTH SECTION */}
      <div className="w-full border-y border-silver-text/10 pt-10 pb-10 my-10 hover:opacity-100 transition-opacity duration-500 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 md:gap-32 px-8 md:px-16 shrink-0">
              <img src="/Site_Pics/Partners_Footer/CD logo.png" alt="Partner" className="h-10 object-contain hover:scale-110 transition-transform duration-300" />
              <img src="/Site_Pics/Partners_Footer/MaxNutrition.png" alt="Partner" className="h-8 object-contain hover:scale-110 transition-transform duration-300" />
              <img src="/Site_Pics/Partners_Footer/Alexander-McQueen.png" alt="Partner" className="h-8 object-contain hover:scale-110 transition-transform duration-300" />
              <img src="/Site_Pics/Partners_Footer/BURBERRY.png" alt="Partner" className="h-8 object-contain hover:scale-110 transition-transform duration-300" />
              <img src="/Site_Pics/Partners_Footer/VOGUE.png" alt="Partner" className="h-8 object-contain hover:scale-110 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6">
        {/* COPYRIGHT */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-silver-text/30 text-[10px] uppercase font-bold tracking-[0.2em]">
          <p>© {new Date().getFullYear()} VB VISION. {t('footer.rights')}</p>
          <div className="flex gap-8">
            <Link to={`/${currentLang}/privacy`} className="hover:text-red-accent transition-colors">{t('footer.privacy')}</Link>
            <Link to={`/${currentLang}/terms`} className="hover:text-red-accent transition-colors">{t('footer.terms')}</Link>
          </div>
          <p>STAY VISIONARY</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

