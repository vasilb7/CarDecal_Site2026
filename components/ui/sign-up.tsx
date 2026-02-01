import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
  testimonials?: Testimonial[];
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignUp?: () => void;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="border border-border bg-surface/50 backdrop-blur-sm transition-all focus-within:border-gold-accent focus-within:ring-1 focus-within:ring-gold-accent">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={cn("animate-testimonial flex items-start gap-3 bg-surface/80 backdrop-blur-xl border border-border p-5 w-64", delay)}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover grayscale" alt="avatar" />
    <div className="text-sm leading-snug font-sans">
      <p className="flex items-center gap-1 font-medium text-text-primary">{testimonial.name}</p>
      <p className="text-text-muted">{testimonial.handle}</p>
      <p className="mt-1 text-text-primary/80">{testimonial.text}</p>
    </div>
  </div>
);

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title,
  description,
  heroImageSrc,
  testimonials = [],
  onSignUp,
  onGoogleSignUp,
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const displayTitle = title || <span className="font-serif text-text-primary tracking-tight">{t('auth.register_title')}</span>;
  const displayDescription = description || t('auth.register_subtitle');

  return (
    <div className="h-screen flex flex-col md:flex-row w-full bg-background overflow-hidden relative">
      <section className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <div className="space-y-1">
              <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-serif leading-tight">{displayTitle}</h1>
              <p className="animate-element animate-delay-200 text-text-muted text-sm uppercase tracking-widest">{displayDescription}</p>
            </div>

            <form className="space-y-4" onSubmit={onSignUp}>
              <div className="animate-element animate-delay-300">
                <label className="block mb-1 text-xs uppercase tracking-widest text-text-muted">{t('auth.full_name')}</label>
                <GlassInputWrapper>
                  <input name="name" type="text" placeholder="John Doe" className="w-full bg-transparent text-sm p-4 text-text-primary outline-none" required />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="block mb-1 text-xs uppercase tracking-widest text-text-muted">{t('auth.email')}</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="email@example.com" className="w-full bg-transparent text-sm p-4 text-text-primary outline-none" required />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500">
                <label className="block mb-1 text-xs uppercase tracking-widest text-text-muted">{t('auth.password')}</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-transparent text-sm p-4 pr-12 text-text-primary outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-text-muted hover:text-gold-accent transition-colors" /> : <Eye className="w-5 h-5 text-text-muted hover:text-gold-accent transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-600 flex items-center gap-3 cursor-pointer py-2">
                <input type="checkbox" id="terms" name="terms" className="accent-gold-accent w-4 h-4" required />
                <label htmlFor="terms" className="text-[10px] uppercase tracking-widest text-text-muted">
                  {t('auth.terms')} <a href="#" className="text-gold-accent underline">{t('auth.terms_link')}</a>
                </label>
              </div>

              <button type="submit" className="animate-element animate-delay-700 w-full bg-gold-accent py-5 text-background font-bold text-xs uppercase tracking-widest hover:bg-white transition-all duration-300 transform active:scale-[0.98]">
                {t('auth.create_account')}
              </button>
            </form>

            <div className="animate-element animate-delay-800 relative flex items-center justify-center py-2">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-text-muted bg-background absolute">{t('auth.or_continue_with')}</span>
            </div>

            <button type="button" onClick={onGoogleSignUp} className="animate-element animate-delay-900 w-full flex items-center justify-center gap-3 border border-border py-4 text-xs font-bold uppercase tracking-widest hover:bg-surface transition-all duration-300">
                <GoogleIcon />
                {t('auth.continue_with_google')}
            </button>

            <p className="animate-element animate-delay-1000 text-center text-[11px] uppercase tracking-widest text-text-muted">
              {t('auth.already_have_account')} <Link to="/login" className="text-gold-accent hover:underline ml-1">{t('auth.login_now')}</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-6">
          <div className="animate-slide-right animate-delay-300 absolute inset-0 bg-cover bg-center grayscale" style={{ backgroundImage: `url(${heroImageSrc})` }}>
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
            </div>
          )}
        </section>
      )}
    </div>
  );
};
