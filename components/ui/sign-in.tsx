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


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  heroImagePosition?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
}

// --- SUB-COMPONENTS ---

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

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title,
  description,
  heroImageSrc,
  heroImagePosition = "center 100%", // Default to faces, can be overridden
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const displayTitle = title || <span className="font-serif text-text-primary tracking-tight">{t('auth.login_title')}</span>;
  const displayDescription = description || t('auth.login_subtitle');

  return (
    <div className="h-screen flex flex-col md:flex-row w-full bg-background overflow-hidden relative">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-2"
            >
              <h1 className="text-4xl md:text-5xl font-serif leading-tight">{displayTitle}</h1>
              <p className="text-text-muted text-sm uppercase tracking-widest">{displayDescription}</p>
            </motion.div>

            <form className="space-y-6" onSubmit={onSignIn}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <label className="block mb-2 text-xs uppercase tracking-widest text-text-muted">{t('auth.email')}</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="email@example.com" className="w-full bg-transparent text-sm p-4 text-text-primary outline-none" required />
                </GlassInputWrapper>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <label className="block mb-2 text-xs uppercase tracking-widest text-text-muted">{t('auth.password')}</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-transparent text-sm p-4 pr-12 text-text-primary outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-text-muted hover:text-gold-accent transition-colors" /> : <Eye className="w-5 h-5 text-text-muted hover:text-gold-accent transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-between text-xs uppercase tracking-widest">
                <label className="flex items-center gap-3 cursor-pointer" id="auth-remember-me">
                  <input type="checkbox" name="rememberMe" className="accent-gold-accent w-4 h-4" />
                  <span className="text-text-muted">{t('auth.remember_me')}</span>
                </label>
                <button type="button" onClick={onResetPassword} className="hover:text-gold-accent text-text-muted transition-colors">{t('auth.forgot_password')}</button>
              </motion.div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                type="submit" 
                className="w-full bg-gold-accent py-5 text-background font-bold text-xs uppercase tracking-widest hover:bg-white transition-all duration-300"
              >
                {t('auth.sign_in')}
              </motion.button>
            </form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="relative flex items-center justify-center py-2">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-text-muted bg-background absolute">{t('auth.or_continue_with')}</span>
            </motion.div>

            <motion.button 
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              type="button" 
              onClick={onGoogleSignIn} 
              className="w-full flex items-center justify-center gap-3 border border-border py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300"
            >
                <GoogleIcon />
                {t('auth.continue_with_google')}
            </motion.button>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-center text-[11px] uppercase tracking-widest text-text-muted">
              {t('auth.dont_have_account')} <Link to="/register" className="text-gold-accent hover:underline ml-1">{t('auth.register_now')}</Link>
            </motion.p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-6">
          <motion.div 
            layoutId="auth-hero-container"
            className="absolute inset-0 bg-cover" 
            style={{ 
              backgroundImage: `url("${heroImageSrc}")`,
              backgroundPosition: heroImagePosition 
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
              className="absolute bottom-0 left-0 right-0 h-[22%] bg-surface/30 backdrop-blur-2xl border-t border-white/10 flex items-center justify-center overflow-visible select-none"
            >
              <div className="flex flex-col items-start px-12 md:px-20 relative z-10 w-full">
                <span className="text-[11px] uppercase tracking-[0.6em] text-gold-accent mb-3 block font-bold">
                  MaxiNutrition
                </span>
                <h3 className="text-text-primary font-serif text-3xl md:text-4xl mb-4 leading-none tracking-tight">
                  Classic Protein Bars
                </h3>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-gold-accent font-extrabold mb-7">
                  <span className="flex items-center gap-2">20G Protein</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-accent/60 self-center"></span>
                  <span className="flex items-center gap-2">Low Sugar</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-accent/60 self-center"></span>
                  <span className="flex items-center gap-2">145 Kcal</span>
                </div>
                <p className="text-white/80 text-sm md:text-base font-medium leading-relaxed max-w-xl italic drop-shadow-sm">
                  "High-quality whey blend for muscle growth and maintenance. The perfect treat without the cheat for your active lifestyle."
                </p>
              </div>

              {/* Floating Product Image - Protein Bar */}
              <motion.div 
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="absolute right-[1%] bottom-[5%] w-[32%] z-50 pointer-events-auto"
              >
                <img 
                  src="/Stock Photos/SponsorShip/Protein_Snack/ProteinLogin.png" 
                  alt="Protein Snack" 
                  className="relative z-10 w-full h-auto"
                  draggable="false"
                />
                {/* Grounded Realistic Shadow */}
                <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-[80%] h-[15%] bg-black/40 blur-xl rounded-[100%] z-0 shadow-[0_0_20px_rgba(0,0,0,0.3)]" />
              </motion.div>
            </motion.div>
          </motion.div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} index={0} />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} index={1} /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
