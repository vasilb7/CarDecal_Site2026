import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const GoogleIcon = () => (
     <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F3"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.23.81-.6z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

interface SignUpPageProps {
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignUp?: () => void;
}

const FloatingInput = ({ 
    label, 
    name, 
    type = "text", 
    required = false, 
    isPassword = false,
    showPassword,
    onTogglePassword,
    ...props 
}: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState("");

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
                        setValue(e.target.value);
                        if (props.onChange) props.onChange(e);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`w-full bg-white/[0.03] border ${isFocused ? 'border-red-600 shadow-[0_0_25px_rgba(239,68,68,0.15)]' : 'border-white/10'} rounded-full px-6 py-4 shadow-sm outline-none text-white placeholder:text-transparent backdrop-blur-xl transition-all ${isPassword ? 'pr-14' : ''}`}
                    required={required}
                    placeholder=" "
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
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  // Detect mobile keyboard close effect properly
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      let isKeyboardOpen = false;
      const handleViewportResize = () => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const screenHeight = window.innerHeight;
        if (currentHeight < screenHeight * 0.8) {
          isKeyboardOpen = true;
        } else if (currentHeight > screenHeight * 0.9 && isKeyboardOpen) {
          isKeyboardOpen = false;
          if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
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
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 relative overflow-y-auto">
            
            {/* Mobile Close Button */}
            <button 
                onClick={() => navigate('/')}
                className="absolute top-8 right-8 lg:hidden w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all z-10"
            >
                <X size={20} />
            </button>

            {/* Logo */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 absolute top-8 left-8 sm:left-12 lg:left-20"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <span className="text-black font-black text-xl leading-none">CD</span>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">CarDecal</span>
                </div>
            </motion.div>

            {/* Form Container */}
            <div className="max-w-md w-full mx-auto flex flex-col justify-center">
                <div className="mb-6 text-center lg:text-left pt-12">
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[40px] font-semibold text-white leading-tight mb-3"
                    >
                        {t('auth.register_title', 'Създай акаунт')}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/60 text-lg font-light"
                    >
                        {t('auth.register_subtitle', 'Регистрирайте се, за да поръчвате индивидуални дизайни и да следите историята на вашите поръчки.')}
                    </motion.p>
                </div>

                <form className="space-y-8 pt-4" onSubmit={onSignUp}>
                    {/* Name - Restrict to two names via label instructions */}
                    <FloatingInput 
                        label={t('auth.name_label', 'Име и Фамилия')}
                        name="name"
                        required
                    />

                    {/* Email */}
                    <FloatingInput 
                        label={t('auth.email', 'Имейл адрес')}
                        name="email"
                        type="email"
                        required
                    />

                    {/* Phone Number */}
                    <FloatingInput 
                        label={t('auth.phone', 'Телефонен номер')}
                        name="phone"
                        type="tel"
                        required
                    />

                    {/* Password */}
                    <FloatingInput 
                        label={t('auth.password', 'Парола')}
                        name="password"
                        isPassword
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                        required
                    />

                    {/* Submit Button */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-red-600 text-white font-semibold py-3.5 rounded-full mt-2 text-lg shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
                    >
                        {t('auth.create_account', 'Създай профил')}
                    </motion.button>

                    {/* Social Buttons */}
                    <div className="flex gap-4 pt-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={onGoogleSignUp}
                            className="w-full flex items-center justify-center gap-2 border border-white/10 rounded-full py-3.5 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <GoogleIcon />
                            <span className="text-sm font-medium text-white/80">Google</span>
                        </motion.button>
                    </div>
                </form>
            </div>

            {/* Bottom Links */}
            <div className="flex justify-center items-center text-sm mt-8 px-2">
                    {t('auth.already_have_account', 'Have an account?')}{' '}
                    <Link 
                        to="/login" 
                        state={location.state}
                        className="text-white font-semibold underline underline-offset-4 hover:text-red-500 transition-colors"
                    >
                        {t('auth.sign_in_link', 'Sign in')}
                    </Link>
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
