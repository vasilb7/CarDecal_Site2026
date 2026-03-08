import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Turnstile } from '@marsidev/react-turnstile';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { validatePassword } from '../../lib/passwordUtils';

const GoogleIcon = () => (
     <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F3"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.23.81-.6z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

interface SignUpPageProps {
  onSignUp?: (event: React.FormEvent<HTMLFormElement>, captchaToken?: string) => void;
  onGoogleSignUp?: () => void;
  loading?: boolean;
}

const FloatingInput = ({ 
    label, 
    name, 
    type = "text", 
    required = false, 
    isPassword = false,
    showPassword,
    onTogglePassword,
    storageKey,
    ...props 
}: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState(() => {
        if (typeof window !== 'undefined' && storageKey) {
            return sessionStorage.getItem(`register_${storageKey}`) || "";
        }
        return "";
    });

    React.useEffect(() => {
        if (storageKey) {
            sessionStorage.setItem(`register_${storageKey}`, value);
        }
    }, [value, storageKey]);

    return (
        <div className="relative group w-full">
            <motion.label
                initial={false}
                animate={{
                    y: (isFocused || value) ? -40 : 0,
                    x: (isFocused || value) ? -4 : 0,
                    scale: (isFocused || value) ? 0.82 : 1,
                    color: isFocused ? "#ef4444" : (value ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)")
                }}
                className="absolute left-6 top-3.5 pointer-events-none transition-all duration-300 z-10 px-1 select-none"
            >
                {label}
            </motion.label>
            
            <div className="relative flex items-center">
                <input 
                    {...props}
                    name={name}
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    value={value}
                    onChange={(e) => {
                        const val = name === 'name' ? e.target.value.replace(/[0-9]/g, '') : e.target.value;
                        setValue(val);
                        if (props.onChange) {
                            const originalValue = e.target.value;
                            e.target.value = val;
                            props.onChange(e);
                            e.target.value = originalValue; // Restore just in case, though usually not needed
                        }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`w-full bg-white/[0.03] border ${isFocused ? 'border-red-600 shadow-[0_0_25px_rgba(239,68,68,0.15)]' : 'border-white/10'} rounded-full px-6 py-4 shadow-sm outline-none text-white placeholder:text-transparent backdrop-blur-xl transition-all ${isPassword ? 'pr-14' : ''}`}
                    required={required}
                    placeholder=" "
                    maxLength={isPassword ? 64 : undefined}
                />
                
                {isPassword && (
                    <div className="absolute right-2 inset-y-0 flex items-center">
                        <button 
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={onTogglePassword}
                            className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-red-500 transition-all z-30 focus:outline-none rounded-full hover:bg-white/5"
                        >
                            <div className="relative w-5 h-5 pointer-events-none">
                                <motion.div
                                    animate={{ 
                                        opacity: showPassword ? 0 : 1,
                                        scale: showPassword ? 0.5 : 1,
                                        y: showPassword ? 5 : 0
                                    }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <Eye size={20} strokeWidth={1.5} />
                                </motion.div>
                                <motion.div
                                    animate={{ 
                                        opacity: showPassword ? 1 : 0,
                                        scale: showPassword ? 1 : 0.5,
                                        y: showPassword ? 0 : -5
                                    }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <EyeOff size={20} strokeWidth={1.5} />
                                </motion.div>
                            </div>
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                input::-ms-reveal,
                input::-ms-clear { display: none; }
                input::-webkit-contacts-auto-fill-button { visibility: hidden; display: none !important; pointer-events: none; }
            `}</style>
        </div>
    );
};

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onSignUp,
  onGoogleSignUp,
  loading = false,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string>();

  const canSocialSubmit = !!captchaToken && !loading;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSignUp?.(e, captchaToken);
    } finally {
      setCaptchaToken(undefined);
      setTurnstileKey((prev) => prev + 1);
    }
  };

  const passwordValidation = validatePassword(password);
  const canSubmit = passwordValidation.isValid && !loading;

  // Detect mobile keyboard close effect properly
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      let isKeyboardOpen = false;
      const handleViewportResize = () => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const screenHeight = window.innerHeight;
        if (currentHeight < screenHeight * 0.75) {
          isKeyboardOpen = true;
        } else if (currentHeight > screenHeight * 0.9 && isKeyboardOpen) {
          isKeyboardOpen = false;
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
      };
      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
    }
  }, []);

  return (
    <div className="flex w-full min-h-screen bg-[#111] overflow-hidden font-sans selection:bg-red-500/30 text-white">
        {/* Left Side - Form Section */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-20 py-4 sm:py-12 relative overflow-y-auto">
            
            {/* Mobile Close Button */}
            <button 
                onClick={() => navigate('/')}
                className="absolute top-6 right-6 lg:hidden w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all z-20"
            >
                <X size={20} />
            </button>

            {/* Logo */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 absolute top-6 left-6 sm:left-12 lg:left-20 z-20"
            >
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <span className="text-black font-black text-lg sm:text-xl leading-none">CD</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">CarDecal</span>
                </div>
            </motion.div>

            {/* Form Container */}
            <div className="max-w-md w-full mx-auto flex flex-col justify-center pt-24 sm:pt-0">
                <div className="mb-0 text-center lg:text-left">
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[24px] sm:text-[36px] font-black text-white leading-tight mb-1 uppercase tracking-tighter"
                    >
                        {t('auth.register_title', 'Създай акаунт')}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest max-w-sm mx-auto lg:mx-0"
                    >
                        {t('auth.register_subtitle', 'Регистрирайте се за индивидуални дизайни и история на поръчките')}
                    </motion.p>
                </div>

                <form className="space-y-6 pt-8" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                        <FloatingInput 
                            label={t('auth.name_label', 'Въведете име и Фамилия')}
                            name="name"
                            storageKey="name"
                            required
                            onChange={(e: any) => {
                                const val = e.target.value.replace(/[0-9]/g, '');
                                setName(val);
                                e.target.value = val; // Sync back to input if possible, though FloatingInput manages its own state
                            }}
                        />
                    </div>

                    {/* Email */}
                    <FloatingInput 
                        label={t('auth.email', 'Имейл адрес')}
                        name="email"
                        storageKey="email"
                        type="email"
                        required
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <div className="space-y-1">
                        <FloatingInput 
                            label={t('auth.phone', 'Телефонен номер')}
                            name="phone"
                            storageKey="phone"
                            type="tel"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <FloatingInput 
                            label={t('auth.password', 'Парола')}
                            name="password"
                            isPassword
                            showPassword={showPassword}
                            onTogglePassword={() => setShowPassword(!showPassword)}
                            required
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        />
                        <AnimatePresence>
                            {password && (
                                <PasswordStrengthMeter
                                    password={password}
                                    userInputs={[email, name].filter(Boolean)}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-start gap-4 px-2">
                        <label className="relative flex items-center cursor-pointer group mt-0.5">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-white/20 bg-white/5 transition-all duration-300 peer-checked:bg-white peer-checked:border-white group-hover:border-white/40 flex items-center justify-center shrink-0 peer-checked:[&_svg]:opacity-100">
                                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-black stroke-[4] opacity-0 transition-opacity duration-200">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        </label>
                        <label htmlFor="terms" className="text-[10px] sm:text-xs text-white/40 leading-relaxed uppercase tracking-widest cursor-pointer select-none">
                            {t('auth.agree_to_terms', 'Съгласявам се с')}
                            <Link to="/terms" target="_blank" className="text-white hover:text-red-500 underline underline-offset-2 mx-1">
                                {t('auth.terms_link', 'Общите условия')}
                            </Link>
                            и
                            <Link to="/privacy" target="_blank" className="text-white hover:text-red-500 underline underline-offset-2 ml-1">
                                {t('auth.privacy_link', 'Поверителността')}
                            </Link>
                        </label>
                    </div>

                    {/* Captcha */}
                    <div className="flex justify-center py-2 scale-90 sm:scale-100">
                        <Turnstile 
                            key={turnstileKey}
                            siteKey="0x4AAAAAACn8KBpSOynPkBCf" 
                            onSuccess={(token) => setCaptchaToken(token)}
                            options={{ theme: 'dark' }}
                        />
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        whileHover={canSubmit ? { scale: 1.01 } : {}}
                        whileTap={canSubmit ? { scale: 0.98 } : {}}
                        type="submit"
                        disabled={!canSubmit}
                        className={`w-full font-black py-4 rounded-full mt-1 text-base uppercase tracking-[0.1em] shadow-xl transition-all ${
                            canSubmit 
                                ? 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-500 active:scale-95 cursor-pointer' 
                                : 'bg-zinc-800 text-zinc-500 shadow-none cursor-not-allowed'
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Регистриране...
                            </span>
                        ) : t('auth.create_account', 'Регистрация')}
                    </motion.button>

                    {/* Social Buttons Section - Ultra Compact */}
                    <div className="flex flex-col items-center pt-2">
                        <span className="text-[9px] text-white/20 uppercase tracking-[0.2em] mb-2">
                            {t('auth.or_sign_up_with', 'Или се регистрирайте чрез')}
                        </span>

                        <div className="flex justify-center mb-4">
                            <motion.button
                                whileHover={canSocialSubmit ? { scale: 1.1 } : {}}
                                whileTap={canSocialSubmit ? { scale: 0.9 } : {}}
                                type="button"
                                onClick={onGoogleSignUp}
                                disabled={!canSocialSubmit}
                                className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-all ${
                                    canSocialSubmit 
                                        ? "bg-white cursor-pointer" 
                                        : "bg-zinc-800 grayscale opacity-40 cursor-not-allowed"
                                }`}
                            >
                                <GoogleIcon />
                            </motion.button>
                        </div>

                        {/* Bottom Links Grouped */}
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">
                                {t('auth.already_have_account', 'Имате акаунт?')}
                            </span>
                            <Link 
                                to="/login" 
                                state={location.state}
                                className="text-[11px] text-white font-black uppercase tracking-widest border-b border-red-600/50 hover:border-red-600 hover:text-red-500 transition-all pb-0.5"
                            >
                                {t('auth.sign_in_link', 'Влезте тук')}
                            </Link>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.dispatchEvent(new Event('open-bug-report'));
                                }}
                                className="text-[9px] text-white/30 hover:text-white uppercase tracking-widest mt-4 transition-colors flex items-center gap-1"
                            >
                                Проблем при регистрация?
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        {/* Right Side - Square Hero Section */}
        <div className="hidden lg:block lg:w-[100vh] relative overflow-hidden h-screen bg-black">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
                className="w-full h-full relative"
            >
                {/* Background Image - Fixed Base */}
                <img 
                    src="/Sign/regbg.jpeg" 
                    alt="Registration background"
                    className="w-full h-full object-cover"
                />


                {/* Subtle Overlay to blend */}
                <div className="absolute inset-0 bg-black/10 z-0" />

                {/* Close Button */}
                <button 
                    onClick={() => navigate('/')}
                    className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#333] shadow-lg hover:bg-white transition-all transform hover:rotate-90 z-20"
                >
                    <X size={24} />
                </button>
            </motion.div>
        </div>


    </div>
  );
};
