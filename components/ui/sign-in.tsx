import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
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
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18c-.77 1.58-1.21 3.35-1.21 5.22 0 1.87.44 3.64 1.21 5.22l3.69-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.13c.86-2.59 3.28-4.51 6.13-4.51z"
      fill="#EA4335"
    />
  </svg>
);

const FloatingInput = ({
  label,
  name,
  type = "text",
  required = false,
  icon: Icon,
  onTogglePassword,
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="relative group">
      <motion.label
        initial={false}
        animate={{
          y: isFocused || value ? -38 : 0,
          x: isFocused || value ? -4 : 0,
          scale: isFocused || value ? 0.82 : 1,
          color: isFocused
            ? "#ef4444"
            : value
              ? "rgba(255,255,255,0.6)"
              : "rgba(255,255,255,0.4)",
        }}
        className="absolute left-6 top-3.5 pointer-events-none transition-all duration-300 z-10 px-1 text-sm"
      >
        {label}
      </motion.label>
      <div
        className={`relative transition-all duration-300 ${isFocused ? "scale-[1.01]" : ""}`}
      >
        <input
          name={name}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full bg-white/[0.03] border ${isFocused ? "border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "border-white/10"} rounded-xl pl-6 ${Icon ? 'pr-14' : 'pr-6'} py-4 shadow-sm outline-none text-white placeholder:text-transparent backdrop-blur-md transition-all`}
          required={required}
          placeholder=" "
          maxLength={type === 'password' ? 64 : undefined}
        />
        {Icon && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors z-20"
          >
            <Icon size={20} />
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
  loading,
  stealthMessage,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();

  return (
    <div className="fixed inset-0 w-full h-full bg-[#080808] overflow-y-auto font-sans selection:bg-red-500/30 text-white custom-scrollbar-hidden">
      {/* Background Glows for depth */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Section */}
      <div className="min-h-full w-full flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md relative z-10 py-12">
          {/* Close Button */}
          <button
            onClick={() => navigate("/")}
            className="absolute -top-4 -right-2 sm:-right-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all z-20"
          >
            <X size={20} />
          </button>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-4">
            <span className="text-black font-black text-2xl leading-none">CD</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white mb-2">CarDecal</span>
          <div className="h-1 w-12 bg-red-600 rounded-full" />
        </motion.div>

        {/* Form Container */}
        <div className="w-full">
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[28px] sm:text-[32px] font-black text-white leading-tight mb-2 uppercase tracking-tighter"
            >
              {t("auth.login_title", "Добре Дошли")}
            </motion.h1>
            {stealthMessage ? (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Lock size={12} className="text-red-600" />
                {stealthMessage}
              </motion.p>
            ) : (
              <p className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                {t("auth.login_subtitle", "Достъп до вашия профил и поръчки")}
              </p>
            )}
          </div>

          <form className="space-y-6" onSubmit={(e) => onSignIn(e, captchaToken)}>
            <FloatingInput label={t("auth.email", "Имейл адрес")} name="email" type="email" required />

            <div className="relative">
              <FloatingInput
                label={t("auth.password", "Парола")}
                name="password"
                type={showPassword ? "text" : "password"}
                icon={showPassword ? EyeOff : Eye}
                onTogglePassword={() => setShowPassword(!showPassword)}
                required
              />
              <div className="flex justify-end mt-2 px-1">
                <Link to="/recovery" className="text-[10px] font-bold text-white/40 hover:text-red-500 uppercase tracking-widest transition-colors">
                  {t("auth.forgot_password", "Забравена парола?")}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3 px-1">
              <label className="relative flex items-center cursor-pointer group">
                <input type="checkbox" name="rememberMe" id="rememberMe" className="peer sr-only" />
                <div className="w-5 h-5 border-2 border-white/20 bg-white/5 transition-all duration-300 peer-checked:bg-white peer-checked:border-white group-hover:border-white/40 flex items-center justify-center peer-checked:[&_svg]:opacity-100">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-black stroke-[4] opacity-0 transition-opacity duration-200">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </label>
              <label htmlFor="rememberMe" className="text-[11px] font-bold text-white/50 uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors">
                {t("auth.remember_me", "Запомни ме за 30 дни")}
              </label>
            </div>

            <div className="flex justify-center py-2 scale-90">
              <Turnstile siteKey="0x4AAAAAACn8KBpSOynPkBCf" onSuccess={(token) => setCaptchaToken(token)} options={{ theme: 'dark' }} />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-red-600 text-white font-bold py-4 rounded-full text-base uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all hover:bg-red-500"
            >
              {t("auth.sign_in", "Вход")}
            </motion.button>

            <div className="flex flex-col items-center pt-4">
              <span className="text-[9px] text-white/20 uppercase tracking-[0.2em] mb-4">
                {t("auth.or_sign_in_with", "Или използвайте за вход")}
              </span>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onGoogleSignIn}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg mb-8"
              >
                <GoogleIcon />
              </motion.button>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-white/40 uppercase tracking-widest">
                  {t("auth.dont_have_account", "Нямате акаунт?")}
                </span>
                <Link to="/register" state={location.state} className="text-[11px] text-white font-black uppercase tracking-widest border-b border-red-600/50 hover:border-red-600 transition-all pb-0.5">
                  {t("auth.register_link", "Създай регистрация")}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SignInPage;
