import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  heroImagePosition?: string;
  mobileHeroImageSrc?: string;
  mobileHeroImagePosition?: string;
  testimonials?: Testimonial[];
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignUp?: () => void;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="border border-border bg-surface/50 backdrop-blur-sm transition-all focus-within:border-gold-accent focus-within:ring-1 focus-within:ring-gold-accent">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: 1 + index * 0.2, duration: 0.8, ease: "easeOut" }}
    className="flex items-start gap-3 bg-surface/80 backdrop-blur-xl border border-border p-5 w-64"
  >
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover grayscale" alt="avatar" />
    <div className="text-sm leading-snug font-sans">
      <p className="flex items-center gap-1 font-medium text-text-primary">{testimonial.name}</p>
      <p className="text-text-muted">{testimonial.handle}</p>
      <p className="mt-1 text-text-primary/80">{testimonial.text}</p>
    </div>
  </motion.div>
);

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title,
  description,
  heroImageSrc,
  heroImagePosition = "center 40%", // Default to faces, can be overridden
  mobileHeroImageSrc,
  mobileHeroImagePosition,
  testimonials = [],
  onSignUp,
  onGoogleSignUp,
}) => {
  const { t, i18n } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const currentLang = i18n.language.split('-')[0];

  const displayTitle = title || <span className="font-serif text-text-primary tracking-tight">{t('auth.register_title')}</span>;
  const displayDescription = description || t('auth.register_subtitle');

  const handleFocus = (e: React.FocusEvent) => {
    // Only scroll into view on mobile devices to prevent keyboard overlap
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (!isMobile) return;

    setTimeout(() => {
      (e.target as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col-reverse md:flex-row w-full bg-background relative overflow-x-hidden">
      <section className="flex-1 flex items-start md:items-center justify-center p-8 pt-8 md:pt-8 z-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-1"
            >
              <h1 className="text-4xl md:text-5xl font-serif leading-tight">{displayTitle}</h1>
              <p className="text-text-muted text-sm uppercase tracking-widest">{displayDescription}</p>
            </motion.div>

            <form className="space-y-4" onSubmit={onSignUp} onFocus={handleFocus}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <label className="block mb-1 text-xs uppercase tracking-widest text-text-muted">{t('auth.full_name')}</label>
                <GlassInputWrapper>
                  <input name="name" type="text" placeholder="John Doe" className="w-full bg-transparent text-sm p-4 text-text-primary outline-none" required />
                </GlassInputWrapper>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <label className="block mb-1 text-xs uppercase tracking-widest text-text-muted">{t('auth.email')}</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="email@example.com" className="w-full bg-transparent text-sm p-4 text-text-primary outline-none" required />
                </GlassInputWrapper>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <label className="block mb-1 text-xs uppercase tracking-widest text-text-muted">{t('auth.password')}</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-transparent text-sm p-4 pr-12 text-text-primary outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-text-muted hover:text-gold-accent transition-colors" /> : <Eye className="w-5 h-5 text-text-muted hover:text-gold-accent transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-3 cursor-pointer py-2" id="auth-terms">
                <input type="checkbox" id="terms" name="terms" className="accent-gold-accent w-4 h-4" required />
                <label htmlFor="terms" className="text-[10px] uppercase tracking-widest text-text-muted">
                  {t('auth.terms')} <Link to={`/${currentLang}/terms`} className="text-gold-accent underline ml-1">{t('auth.terms_link')}</Link>
                </label>
              </motion.div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                type="submit" 
                className="w-full bg-gold-accent py-5 text-background font-bold text-xs uppercase tracking-widest hover:bg-white transition-all duration-300"
              >
                {t('auth.create_account')}
              </motion.button>
            </form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="relative flex items-center justify-center py-2">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-text-muted bg-background absolute">{t('auth.or_continue_with')}</span>
            </motion.div>

            <motion.button 
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              type="button" 
              onClick={onGoogleSignUp} 
              className="w-full flex items-center justify-center gap-3 border border-border py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300"
            >
                <GoogleIcon />
                {t('auth.continue_with_google')}
            </motion.button>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="text-center text-[11px] uppercase tracking-widest text-text-muted">
              {t('auth.already_have_account')} <Link to={`/${currentLang}/login`} className="text-gold-accent hover:underline ml-1">{t('auth.login_now')}</Link>
            </motion.p>
          </div>
        </div>
      </section>

      {/* Right column on desktop / Top card on mobile: hero image + testimonials */}
      {heroImageSrc && (
        <section className="relative p-4 pt-24 md:pt-6 md:p-6 md:flex-1 h-[320px] md:h-auto flex-shrink-0 overflow-hidden">
          <motion.div 
            layoutId="auth-hero-container"
            className="absolute inset-4 md:inset-0 bg-cover bg-center rounded-[2rem] md:rounded-none overflow-hidden" 
            style={{ 
              backgroundImage: `url("${mobileHeroImageSrc && typeof window !== 'undefined' && window.innerWidth < 768 ? mobileHeroImageSrc : heroImageSrc}")`,
              backgroundPosition: mobileHeroImagePosition && typeof window !== 'undefined' && window.innerWidth < 768 ? mobileHeroImagePosition : heroImagePosition || heroImagePosition
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-black/10"></div>
            
            {/* Advertisement Blur Module */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="absolute bottom-0 left-0 right-0 h-[50%] md:h-[22%] bg-surface/30 backdrop-blur-2xl border-t border-white/10 flex items-center justify-center overflow-visible select-none"
            >
              <div className="flex flex-col items-start px-6 md:px-24 relative z-10 w-full">
                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.5em] text-gold-accent mb-1 md:mb-3 block font-bold opacity-90">
                  MaxiNutrition
                </span>
                <h3 className="text-text-primary font-serif text-xl md:text-4xl mb-1 md:mb-4 leading-none tracking-tight">
                  Classic Protein Bars
                </h3>
                <div className="hidden md:flex flex-wrap gap-x-4 md:gap-x-8 gap-y-2 text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gold-accent font-bold mb-4 md:mb-6">
                  <span className="flex items-center gap-2">20G Protein</span>
                  <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-gold-accent/40 self-center"></span>
                  <span className="flex items-center gap-2">Low Sugar</span>
                  <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-gold-accent/40 self-center"></span>
                  <span className="flex items-center gap-2">145 Kcal</span>
                </div>
                <p className="hidden md:block text-white/80 text-sm md:text-[13px] font-medium leading-[1.4] max-w-[400px] italic drop-shadow-sm">
                  "High-quality whey blend for muscle growth and maintenance. The perfect treat without the cheat."
                </p>
              </div>

              {/* Floating Product Images - Protein Box & Brownie */}
              <div className="absolute right-0 bottom-0 w-full h-full pointer-events-none">
                {/* Protein Box */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5, duration: 0.8 }}
                  className="absolute right-[1%] bottom-[5%] w-[27%] z-40 pointer-events-auto"
                >
                  <img 
                    src="/Site_Pics/SponsorShip/Protein_Snack/ProteinBox.png" 
                    alt="Protein Box" 
                    className="relative z-10 w-full h-auto"
                    draggable="false"
                  />
                  <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-[90%] h-[15%] bg-black/40 blur-xl rounded-[100%] z-0" />
                </motion.div>

                {/* Protein Brownie - Animates from right */}
                <a 
                  href="https://www.maxinutrition.com/products/classic-bars" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute right-[23%] bottom-[8%] w-[14%] z-50 pointer-events-auto block"
                >
                  <motion.div 
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    variants={{
                      initial: { opacity: 0, x: 200, scale: 0.9 },
                      animate: { x: 0, opacity: 1, scale: 1 }
                    }}
                    transition={{ 
                      delay: 1.8, 
                      duration: 1.2, 
                      type: "spring",
                      stiffness: 50
                    }}
                  >
                    {/* The Product Image itself with lift and glow */}
                    <motion.div
                      variants={{
                        initial: { y: 0, filter: "drop-shadow(0 0 0px rgba(212, 175, 55, 0))" },
                        animate: { y: 0, filter: "drop-shadow(0 0 0px rgba(212, 175, 55, 0))" },
                        hover: { y: -10, filter: "drop-shadow(0 0 15px rgba(212, 175, 55, 0.4))" }
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <img 
                        src="/Site_Pics/SponsorShip/Protein_Snack/ProteinBrownie.png" 
                        alt="Protein Brownie" 
                        className="relative z-10 w-full h-auto"
                        draggable="false"
                      />
                    </motion.div>
                    
                    {/* Golden Shadow - Appears ONLY on hover */}
                    <motion.div 
                      variants={{
                        initial: { opacity: 0, scale: 0.5 },
                        animate: { opacity: 0, scale: 0.5 },
                        hover: { opacity: 1, scale: 1 }
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute bottom-[-8%] left-1/2 -translate-x-1/2 w-[80%] h-[20%] bg-gold-accent/20 blur-xl rounded-[100%] z-0"
                    />
                  </motion.div>
                </a>
              </div>
            </motion.div>
          </motion.div>
          {testimonials.length > 0 && (
            <div className="hidden md:flex absolute bottom-12 left-1/2 -translate-x-1/2 gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} index={0} />
            </div>
          )}
        </section>
      )}
    </div>
  );
};
