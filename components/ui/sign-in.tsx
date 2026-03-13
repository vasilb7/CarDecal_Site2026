import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, X, ArrowRight, Github } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Turnstile } from "@marsidev/react-turnstile";

interface SignInPageProps {
  onSignIn: (e: React.FormEvent<HTMLFormElement>, captchaToken?: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onResetPassword: () => void;
  isUpdatingPassword?: boolean;
  onUpdatePassword?: (password: string) => Promise<void>;
  loading: boolean;
  stealthMessage?: string | null;
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18c-.77 1.58-1.21 3.35-1.21 5.22 0 1.87.44 3.64 1.21 5.22l3.69-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.13c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335" />
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
          y: isFocused || value ? -32 : 0,
          scale: isFocused || value ? 0.8 : 1,
          color: isFocused ? "#ff0000" : "rgba(255,255,255,0.4)",
        }}
        className="absolute left-1 top-4 pointer-events-none transition-all duration-300 z-10 text-sm font-bold uppercase tracking-widest px-1"
      >
        {label}
      </motion.label>
      <div className="relative border-b-2 border-white/10 transition-all duration-500 group-hover:border-white/20">
        <input
          name={name}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent py-4 outline-none text-white text-lg font-bold placeholder:text-transparent transition-all"
          required={required}
          placeholder=" "
        />
        <motion.div 
          className="absolute bottom-[-2px] left-0 h-[2px] bg-red-600 shadow-[0_0_10px_rgba(255,0,0,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: isFocused ? '100%' : 0 }}
        />
        {Icon && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:text-red-500 transition-colors text-white/30"
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
  loading,
  stealthMessage,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();

  return (
    <div className="fixed inset-0 w-full h-full bg-[#050505] overflow-y-auto font-sans selection:bg-red-500/30 text-white custom-scrollbar-hidden flex flex-col md:flex-row">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
      `}</style>
      
      {/* ── LEFT PANEL — DESKTOP ONLY ── */}
      <div className="hidden md:flex w-1/2 h-full bg-[#0a0a0a] relative overflow-hidden items-center justify-center border-r border-white/5">
        <div className="absolute top-[-20%] right-[-20%] w-full h-full bg-red-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-20%] w-full h-full bg-red-600/5 rounded-full blur-[150px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 px-20"
        >
          <h2 className="text-7xl font-playfair italic font-black text-white leading-tight mb-6">
            Вашият стил,<br/>
            <span className="text-red-600">Вашите правила.</span>
          </h2>
          <p className="text-white/40 text-lg uppercase tracking-[0.2em] font-bold max-w-sm">
            Влезте в профила си, за да управлявате поръчките и да ползвате персонални отстъпки.
          </p>
          
          <div className="mt-12 flex items-center gap-4">
             <div className="h-0.5 w-12 bg-red-600" />
             <span className="text-xs font-black uppercase tracking-widest text-white">CarDecal HQ Est. 2026</span>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL — FORM ── */}
      <div className="w-full md:w-1/2 min-h-full flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md">
          {/* Logo & Header Mobile */}
          <div className="flex flex-col items-center mb-12 md:items-start">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="md:hidden w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-2xl mb-6 rotate-3"
            >
              <span className="text-black font-black text-3xl">CD</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-playfair italic font-black text-white mb-2"
            >
              {t("auth.login_title", "Добре Дошли")}
            </motion.h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
              {stealthMessage || t("auth.login_subtitle", "Достъп до вашия профил")}
            </p>
          </div>

          <form className="space-y-8" onSubmit={(e) => onSignIn(e, captchaToken)}>
            <div className="space-y-10">
              <FloatingInput label={t("auth.email", "Имейл")} name="email" type="email" required />
              
              <div className="relative">
                <FloatingInput
                  label={t("auth.password", "Парола")}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  icon={showPassword ? EyeOff : Eye}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  required
                />
                <div className="flex justify-end mt-4">
                  <Link to="/recovery" className="text-[10px] font-bold text-white/30 hover:text-red-500 uppercase tracking-widest transition-colors">
                    {t("auth.forgot_password", "Забравена парола?")}
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative flex items-center cursor-pointer group">
                <input type="checkbox" name="rememberMe" id="rememberMe" className="peer sr-only" />
                <div className="w-5 h-5 border-2 border-white/10 bg-white/5 rounded transition-all peer-checked:bg-red-600 peer-checked:border-red-600">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-white stroke-[4] opacity-0 peer-checked:opacity-100 transition-opacity mx-auto my-0.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </label>
              <label htmlFor="rememberMe" className="text-[11px] font-bold text-white/40 uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors">
                {t("auth.remember_me", "Запомни ме")}
              </label>
            </div>

            <div className="flex justify-center py-2">
               <Turnstile siteKey="0x4AAAAAACn8KBpSOynPkBCf" onSuccess={(token) => setCaptchaToken(token)} options={{ theme: 'dark' }} />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full h-16 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-md transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,0,0,0.2)] disabled:opacity-50"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("auth.sign_in", "Вход в профила")}
              {!loading && <ArrowRight size={18} />}
            </motion.button>
          </form>

          {/* Providers */}
          <div className="mt-12">
            <div className="relative flex items-center justify-center mb-8">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
               <span className="relative px-4 bg-[#050505] text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">Или продъжлете с</span>
            </div>

            <div className="flex justify-center gap-4">
               <motion.button
                 whileHover={{ y: -2, scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={onGoogleSignIn}
                 className="flex-1 h-14 bg-white rounded-md flex items-center justify-center gap-3 transition-all hover:shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
               >
                 <GoogleIcon />
                 <span className="text-black font-black text-xs uppercase tracking-widest">Google</span>
               </motion.button>
            </div>

            <div className="mt-12 text-center">
              <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2 font-bold">Нямате акаунт?</p>
              <Link to="/register" className="inline-block text-sm font-playfair italic font-black text-white hover:text-red-600 transition-colors border-b border-red-600/30 pb-1">
                {t("auth.register_link", "Станете част от нашето общество тук")}
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Back Button */}
        <button 
          onClick={() => navigate("/")}
          className="absolute top-10 right-10 p-4 rounded-full border border-white/5 hover:bg-white/5 transition-all group"
        >
          <X size={20} className="text-white/40 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
