import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Turnstile } from '@marsidev/react-turnstile';
import { motion } from 'framer-motion';

const GoogleIcon = () => (
     <svg viewBox="0 0 24 24" className="h-6 w-6">
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

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onGoogleSignUp,
  loading = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string>();

  const canSocialSubmit = !!captchaToken && !loading;

  const handleGoogleClick = async () => {
    if (!canSocialSubmit) return;
    try {
      await onGoogleSignUp?.();
    } finally {
      setCaptchaToken(undefined);
      setTurnstileKey((prev) => prev + 1);
    }
  };

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
            <div className="max-w-md w-full mx-auto flex flex-col justify-center pt-24 sm:pt-0 pb-12">
                <div className="mb-10 text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[28px] sm:text-[42px] font-black text-white leading-tight mb-2 uppercase tracking-tighter"
                    >
                        ВХОД / РЕГИСТРАЦИЯ
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 text-[11px] sm:text-sm font-bold tracking-widest leading-relaxed"
                    >
                        За по-голяма сигурност и удобство, платформата използва само вход чрез Google.
                    </motion.p>
                </div>

                <div className="space-y-8 flex flex-col items-center">
                    {/* Captcha */}
                    <div className="flex justify-center scale-90 sm:scale-100 min-h-[65px]">
                        <Turnstile 
                            key={turnstileKey}
                            siteKey="0x4AAAAAACn8KBpSOynPkBCf" 
                            onSuccess={(token) => setCaptchaToken(token)}
                            options={{ theme: 'dark' }}
                        />
                    </div>

                    {/* Google Button */}
                    <motion.button
                        whileHover={canSocialSubmit ? { scale: 1.02, y: -2 } : {}}
                        whileTap={canSocialSubmit ? { scale: 0.98 } : {}}
                        onClick={handleGoogleClick}
                        disabled={!canSocialSubmit}
                        className={`w-full flex items-center justify-center gap-4 py-5 rounded-2xl text-base sm:text-lg font-black uppercase tracking-[0.1em] shadow-2xl transition-all duration-300 ${
                            canSocialSubmit 
                              ? "bg-white text-black hover:bg-zinc-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] cursor-pointer" 
                              : "bg-zinc-800 text-zinc-500 shadow-none cursor-not-allowed grayscale-[50%]"
                        }`}
                    >
                        <GoogleIcon />
                        <span>Продължи с Google</span>
                    </motion.button>

                    <p className="text-center text-[10px] text-zinc-500 font-medium max-w-[280px]">
                        Продължавайки, вие се съгласявате с нашите Общи условия и Политика за поверителност. Не съхраняваме ваши пароли или чувствителни данни за достъп.
                    </p>
                </div>
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
                    className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#333] shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:bg-white transition-all transform hover:rotate-90 z-20"
                >
                    <X size={24} />
                </button>
            </motion.div>
        </div>
    </div>
  );
};
