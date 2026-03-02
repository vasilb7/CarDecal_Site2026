import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, X, ChevronRight, Github } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SignInPageProps {
  onSignIn: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onResetPassword: () => void;
  isUpdatingPassword?: boolean;
  onUpdatePassword?: (password: string) => Promise<void>;
  loading: boolean;
}

// ──── Sub-components ────

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18c-.77 1.58-1.21 3.35-1.21 5.22 0 1.87.44 3.64 1.21 5.22l3.69-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.13c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/>
    </svg>
);

const FloatingInput = ({ label, name, type = "text", required = false, icon: Icon, onTogglePassword }: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState("");

    return (
        <div className="relative group">
            <motion.label
                initial={false}
                animate={{
                    y: (isFocused || value) ? -38 : 0,
                    x: (isFocused || value) ? -4 : 0,
                    scale: (isFocused || value) ? 0.82 : 1,
                    color: isFocused ? "#ef4444" : (value ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)")
                }}
                className="absolute left-6 top-3.5 pointer-events-none transition-all duration-300 z-10 px-1 text-sm"
            >
                {label}
            </motion.label>
            <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}>
                <input 
                    name={name}
                    type={type}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`w-full bg-white/[0.03] border ${isFocused ? 'border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-white/10'} rounded-xl px-6 py-4 shadow-sm outline-none text-white placeholder:text-transparent backdrop-blur-md transition-all`}
                    required={required}
                    placeholder=" "
                />
                {Icon && (
                    <button 
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                        <Icon size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export const SignInPage: React.FC<SignInPageProps> = ({ 
  onSignIn, 
  onGoogleSignIn, 
  onResetPassword,
  isUpdatingPassword,
  onUpdatePassword,
  loading 
}) => {
  const { t, i18n } = useTranslation();
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
                        {t('auth.login_title', 'Sign in')}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/60 text-base font-light"
                    >
                        {t('auth.login_subtitle', 'Welcome back! Please enter your details.')}
                    </motion.p>
                </div>

                <form className="space-y-8 pt-4" onSubmit={onSignIn}>
                    {/* Email */}
                    <FloatingInput 
                        label={t('auth.email', 'Имейл адрес')}
                        name="email"
                        type="email"
                        required
                    />

                    {/* Password */}
                    <div className="relative">
                        <FloatingInput 
                            label={t('auth.password', 'Парола')}
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            icon={showPassword ? EyeOff : Eye}
                            onTogglePassword={() => setShowPassword(!showPassword)}
                            required
                        />
                        <div className="absolute -top-7 right-4">
                            <Link 
                                to="/recovery"
                                className="text-xs font-semibold text-white/40 hover:text-red-500 underline underline-offset-4 transition-colors"
                            >
                                {t('auth.forgot_password', 'Забравена парола?')}
                            </Link>
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center gap-2 pt-2 px-2">
                        <div className="relative flex items-center justify-center">
                            <input 
                                type="checkbox" 
                                id="rememberMe" 
                                name="rememberMe" 
                                className="peer appearance-none w-5 h-5 border border-white/20 rounded-md bg-white/5 checked:bg-red-600 checked:border-red-600 cursor-pointer transition-all hover:bg-white/10"
                            />
                            <svg className="absolute w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 peer-checked:text-white transition-opacity" viewBox="0 0 14 10" fill="none">
                                <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <label htmlFor="rememberMe" className="text-sm text-white/60 cursor-pointer select-none hover:text-white transition-colors">
                            {t('auth.remember_me', 'Запомни ме за 30 дни')}
                        </label>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-red-600 text-white font-semibold py-3.5 rounded-full mt-2 text-lg shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
                    >
                        {t('auth.sign_in', 'Sign in')}
                    </motion.button>

                    {/* Social Buttons */}
                    <div className="flex flex-col gap-3 pt-4">
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={onGoogleSignIn}
                            className="w-full flex items-center justify-center gap-2 border border-white/10 rounded-full py-3.5 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <GoogleIcon />
                            <span className="text-sm font-medium text-white/80">Google</span>
                        </motion.button>
                        
                        {/* Bottom Links Moved Inside Form Flow */}
                        <div className="flex justify-center items-center text-sm pt-4 px-2 text-white/60">
                            {t('auth.dont_have_account', "Don't have an account?")}{' '}
                            <Link 
                                to="/register" 
                                state={location.state}
                                className="ml-2 text-white font-semibold underline underline-offset-4 hover:text-red-500 transition-colors"
                            >
                                {t('auth.register_link', 'Sign up')}
                            </Link>
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
                {/* Hero Image */}
                <img 
                    src="/Sign/login.png" 
                    alt="Login background"
                    className="w-full h-full object-cover"
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-black/5" />

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

export default SignInPage;
