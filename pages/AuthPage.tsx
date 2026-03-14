import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { recordFailedLogin, recordSuccessfulLogin, logSecurityEvent } from '../lib/security';
import { useAuth } from '../context/AuthContext';
import { validatePassword, translateAuthError } from '../lib/passwordUtils';
import { isValidPhone as isValidBulgarianPhone, isValidFullName, formatToE164, formatPhoneNumber } from '../lib/utils';
import ReportBugModal from '../components/ReportBugModal';
import { hasProfanity } from '../lib/profanity';
import { Turnstile } from '@marsidev/react-turnstile';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, Building2, User, Check } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18c-.77 1.58-1.21 3.35-1.21 5.22 0 1.87.44 3.64 1.21 5.22l3.69-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.13c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335" />
  </svg>
);

const SupabaseLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-600">
    {/* Abstract logo resembling Supabase's shape but in Red (for CarDecal) */}
    <path d="M12.0001 2.5L2.50012 11.5L12.0001 20.5V14.5H21.5001L12.0001 2.5Z" fill="currentColor"/>
  </svg>
);

const SupabaseInput = React.forwardRef(({ label, type = "text", name, required, value, onChange, onClick, icon: Icon, onToggleIcon, ...props }: any, ref: any) => {
  return (
    <div className="flex flex-col space-y-2 w-full group">
      <label htmlFor={name} className="text-[13px] font-medium text-zinc-400 group-focus-within:text-red-500 transition-colors">
        {label}
      </label>
      <div className="relative flex items-center h-[56px]">
        <input
          ref={ref}
          type={type}
          id={name}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          onClick={onClick}
          className={`w-full h-full px-5 bg-neutral-800 rounded-xl text-sm outline-none shadow-inner border border-neutral-700/50 focus:border-red-600 transition-all text-white placeholder-neutral-500 ${Icon ? 'pr-14' : ''}`}
          {...props}
        />
        {Icon && (
          <div className="absolute right-2 inset-y-0 flex items-center">
            <button
              type="button"
              onClick={onToggleIcon}
              className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all outline-none"
            >
              <div key={type} className="animate-eye flex items-center justify-center">
                <Icon size={20} />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});



export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();


  const [view, setView] = useState<'login' | 'register' | 'recovery' | 'onboarding'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  
  // Login Fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("+359 ");
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Company registration state
  const [isCompany, setIsCompany] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [bulstat, setBulstat] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPerson, setCompanyPerson] = useState("");
  const [isVatRegistered, setIsVatRegistered] = useState(false);
  const [vatNumber, setVatNumber] = useState("");


  // Recovery Fields
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);




  useEffect(() => {
    if (location.pathname === '/register') setView('register');
    else if (location.pathname === '/recovery') setView('recovery');
    else setView('login');
  }, [location.pathname]);

  useEffect(() => {
    if (user && !authLoading && profile && !profile.onboarding_completed) {
      setView('onboarding');
    }
  }, [user, authLoading, profile]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const val = e.target.value;
    if (/[а-яА-Я]/.test(val)) {
      e.target.value = val.replace(/[а-яА-Я]/g, '');
    }
    setter(e.target.value);
  };

  // Quote/Benefits rotation
  const loginQuotes = [
    "Успехът е сумата от малки усилия, повтаряни ден след ден.",
    "Постоянството е тайната на всяко голямо постижение.",
    "Дисциплината е мостът между целите и техните резултати.",
    "Твоето бъдеще се създава от това, което правиш днес.",
    "Нищо в света не може да замени постоянството.",
    " Пътят към върха изисква вяра и неуморна работа.",
    "Бъди по-добра версия на себе си всеки изминал ден.",
    "Големите неща започват с малки, но сигурни стъпки.",
    "Търпението и трудът винаги се отплащат.",
    "Твоят потенциал е безграничен, когато действаш.",
  ];

  const registerBenefits = [
    "Направи първата крачка към своята нова цел.",
    "Открий възможностите, които те очакват тук.",
    "Присъедини се към общност, стремяща се към успех.",
    "Твоят напредък е наш основен приоритет.",
    "Започни своето пътешествие към промяната сега.",
    "Постави началото на нещо значимо и трайно.",
    "Всяка голяма промяна започва с едно решение.",
    "Изгради навиците, които ще те направят победител.",
    "Влез в света на високите стандарти и качество.",
    "Днес е идеалният ден да поставиш ново начало.",
  ];

  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % 10);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error: any) {
      showToast(translateAuthError(error), "error");
    }
  };

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail, password: loginPassword, options: { captchaToken }
      });

      if (error) {
        const failResult = await recordFailedLogin(loginEmail);
        if (failResult.locked) {
            showToast('Твърде много неуспешни опити. Моля, опитайте по-късно.', 'error');
        } else if (error.message.includes("Invalid login credentials")) {
            showToast(t('toast.login_error_credentials', 'Невалидни данни за вход.'), "error");
        } else {
            showToast(error.message, "error");
        }
      } else {
        recordSuccessfulLogin(data?.user?.id).catch(console.error);
        const md = data?.user?.user_metadata || {};
        const name = md.full_name || md.name || md.first_name || (data?.user?.email?.split('@')[0]) || '';
        showToast(t('toast.login_success', 'Добре дошли, {{name}}!', { name: name || '!' }), 'success');
        
        sessionStorage.setItem('temp_session', 'true');
        const from = (location.state as any)?.from || '/';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      showToast(t('toast.login_error_generic', 'Грешка при вход.'), "error");
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!isValidFullName(regName)) {
        showToast('Въведете име и фамилия (3-100 символа).', "warning");
        setLoading(false);
        return;
    }
    if (!isValidBulgarianPhone(regPhone)) {
        showToast("Невалиден телефон! (8-15 цифри)", "warning");
        setLoading(false);
        return;
    }
    const normalizedPhone = formatToE164(regPhone);

    try {
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingPhone) {
        showToast('Този телефонен номер вече е свързан с друг акаунт', 'error');
        setLoading(false);
        return;
      }

      const pwdValidation = validatePassword(regPassword);
      if (!pwdValidation.isValid) {
          showToast('Моля, изпълнете изискванията за парола по-долу.', 'error');
          setLoading(false);
          return;
      }
      if (hasProfanity(regName)) {
        showToast(t('toast.register_profanity', 'Името съдържа забранени думи.'), "error");
        setLoading(false);
        return;
      }

      const { error: checkError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: { full_name: regName.trim(), phone: normalizedPhone },
          captchaToken
        }
      });

      // This is a bit of a hack to check for existing email/phone before onboarding
      // But we don't want to actually commit yet if possible. 
      // Actually, Supabase doesn't have a "check email" API easily without signing up.
      // So we will just proceed to onboarding and catch errors during the final signUp.
      
      setView('onboarding');
    } catch (err: any) {
      showToast(translateAuthError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const onCompleteOnboarding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const onboardingData: any = {
        is_company: !!isCompany,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      if (isCompany) {
        onboardingData.company_name = companyName;
        onboardingData.bulstat = bulstat;
        onboardingData.company_address = companyAddress;
        onboardingData.company_person = companyPerson;
        onboardingData.vat_registered = isVatRegistered;
        onboardingData.vat_number = vatNumber;
      }

      if (user) {
        // CASE: Auth user exists (Google Login or session)
        const { error: profileError } = await supabase
          .from('profiles')
          .update(onboardingData)
          .eq('id', user.id);

        if (profileError) throw profileError;

        const { error: authError } = await supabase.auth.updateUser({
          data: onboardingData
        });
        if (authError) throw authError;

      } else {
        // CASE: New Email Registration - Create user ONLY NOW
        const { error: signUpError } = await supabase.auth.signUp({
          email: regEmail,
          password: regPassword,
          options: {
            data: {
              full_name: regName.trim(),
              phone: formatToE164(regPhone),
              role: 'user',
              ...onboardingData
            },
            captchaToken
          }
        });

        if (signUpError) throw signUpError;
      }

      showToast(t('toast.register_success', 'Профилът е готов!'), 'success');
      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      showToast(err.message || 'Грешка при запис на данните', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRecover = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken,
      });

      if (error) {
        showToast(translateAuthError(error), 'error');
      } else {
        setRecoverySent(true);
      }
    } catch (err: any) {
      showToast(err.message || 'Възникна грешка при изпращането на имейла', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex bg-zinc-950 text-zinc-200 font-sans antialiased overflow-x-hidden relative">
      
      {/* Left Column (Forms) */}
      <div className="w-full lg:w-[560px] xl:w-[600px] flex flex-col pt-8 sm:pt-12 pb-12 px-6 sm:px-12 xl:px-16 overflow-y-auto relative z-10 mx-auto lg:mx-0 shadow-2xl bg-zinc-950 border-r border-zinc-900">
        
        {/* CD CARDECAL Gradient Logo */}
        <div className="flex items-center gap-3 mb-12 cursor-pointer transition-opacity hover:opacity-80" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-600/20">
            <span className="text-white font-bold text-sm tracking-widest pl-[1px]">CD</span>
          </div>
          <span className="font-semibold text-[20px] text-white uppercase tracking-[0.05em]">CARDECAL</span>
        </div>

        <div className="flex-1 w-full max-w-[420px] mx-auto flex flex-col justify-center">

        {view === 'login' && (
          <div className="w-full fade-in">
            <h1 className="text-[24px] font-semibold text-white mb-1 tracking-tight">Добре дошли отново</h1>
            <p className="text-[14px] text-zinc-500 mb-8">Влезте във вашия профил</p>

            <button
              type="button"
              onClick={handleOAuth}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 flex items-center justify-center gap-2 py-2 rounded-md transition-colors text-[14px] font-medium"
            >
              <GoogleIcon />
              Продължи с Google
            </button>

            <div className="flex items-center my-6">
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
              <span className="px-3 text-zinc-500 text-[12px]">или</span>
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
            </div>

            <form onSubmit={onSignIn} className="space-y-4">
              <SupabaseInput 
                label="Имейл"
                name="email"
                type="email"
                value={loginEmail}
                onChange={(e: any) => setLoginEmail(e.target.value)}
                required
              />
              
              <SupabaseInput 
                label="Парола"
                name="password"
                type={showPassword ? "text" : "password"}
                icon={showPassword ? EyeOff : Eye}
                onToggleIcon={() => setShowPassword(!showPassword)}
                onChange={(e: any) => handlePasswordChange(e, setLoginPassword)}
                value={loginPassword}
                required
              />

              <div className="flex justify-start">
                <button type="button" onClick={() => { setView('recovery'); window.history.pushState({}, '', '/recovery'); }} className="text-[13px] text-zinc-500 hover:text-zinc-200 transition-colors">
                  Забравена парола?
                </button>
              </div>

              <div className="flex justify-center mt-2 min-h-[65px] w-full overflow-hidden">
                <Turnstile siteKey="0x4AAAAAACn8KBpSOynPkBCf" onSuccess={(token) => setCaptchaToken(token)} options={{ theme: 'dark', size: 'flexible' }} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-2 rounded-md transition-colors text-[14px] font-medium disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Вход"}
              </button>
            </form>

            <div className="mt-8 text-center text-[14px] text-zinc-500">
              Нямате профил?{' '}
              <button onClick={() => { setView('register'); window.history.pushState({}, '', '/register'); }} className="text-white hover:underline">
                Регистрация
              </button>
              <div className="mt-6 pt-6 border-t border-zinc-900/50">
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-bug-report'))} className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors flex items-center justify-center gap-1.5 mx-auto">
                    <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                    Докладване на проблем
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'register' && (
          <div className="w-full fade-in">
            <h1 className="text-[24px] font-semibold text-white mb-1 tracking-tight">Създай профил</h1>
            <p className="text-[14px] text-zinc-500 mb-8">Регистрирайте нов профил</p>

            <button
              type="button"
              onClick={handleOAuth}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 flex items-center justify-center gap-2 py-2 rounded-md transition-colors text-[14px] font-medium"
            >
              <GoogleIcon />
              Продължи с Google
            </button>

            <div className="flex items-center my-6">
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
              <span className="px-3 text-zinc-500 text-[12px]">или</span>
              <div className="flex-1 h-[1px] bg-zinc-800"></div>
            </div>

            <form onSubmit={onSignUp} className="space-y-4 fade-in">
              <SupabaseInput label="Име и Фамилия" name="name" value={regName} onChange={(e: any) => setRegName(e.target.value)} required />
              
              <SupabaseInput 
                ref={phoneInputRef}
                label="Телефон" 
                name="phone" 
                type="tel" 
                value={regPhone} 
                onFocus={(e: any) => {
                  const val = e.target.value;
                  setTimeout(() => e.target.setSelectionRange(val.length, val.length), 0);
                }}
                onKeyDown={(e: any) => {
                  if (e.target.selectionStart <= 5 && (e.key === 'Backspace' || e.key === 'ArrowLeft' || e.key === 'Home')) {
                    e.preventDefault();
                  }
                }}
                onSelect={(e: any) => {
                  const start = e.target.selectionStart;
                  if (start !== null && start < 5) {
                    e.target.setSelectionRange(5, Math.max(5, e.target.selectionEnd || 5));
                  }
                }}
                onChange={(e: any) => {
                  const val = e.target.value;
                  const formatted = formatPhoneNumber(val);
                  setRegPhone(formatted);
                }} 
                onClick={(e: any) => {
                  if (e.target.selectionStart < 5) {
                    e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                  }
                }}
                placeholder="+359 88 888 8888" 
                required 
              />
              <SupabaseInput label="Имейл" name="email" type="email" value={regEmail} onChange={(e: any) => setRegEmail(e.target.value)} required />
              
              <SupabaseInput 
                label="Парола"
                name="password"
                type={showPassword ? "text" : "password"}
                icon={showPassword ? EyeOff : Eye}
                onToggleIcon={() => setShowPassword(!showPassword)}
                onChange={(e: any) => handlePasswordChange(e, setRegPassword)}
                value={regPassword}
                required
              />

              <div className="flex justify-center mt-2 min-h-[65px] w-full overflow-hidden">
                <Turnstile siteKey="0x4AAAAAACn8KBpSOynPkBCf" onSuccess={(token) => setCaptchaToken(token)} options={{ theme: 'dark', size: 'flexible' }} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-2 rounded-md transition-colors text-[14px] font-medium disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Регистрация"}
              </button>
            </form>

            <div className="mt-8 text-center text-[14px] text-zinc-500">
              Вече имате профил?{' '}
              <button onClick={() => { setView('login'); window.history.pushState({}, '', '/login'); }} className="text-white hover:underline">
                Вход
              </button>
              <div className="mt-6 pt-6 border-t border-zinc-900/50">
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-bug-report'))} className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors flex items-center justify-center gap-1.5 mx-auto">
                    <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                    Докладване на проблем
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'onboarding' && (
          <div className="w-full fade-in">
            <h1 className="text-[24px] font-semibold text-white mb-1 tracking-tight">Почти приключихме!</h1>
            <p className="text-[14px] text-zinc-500 mb-8">Искате ли да довършим профила ви с фирмени данни?</p>

            {isCompany === null ? (
              <div className="space-y-6 py-4">
                <h2 className="text-[18px] font-medium text-white text-center">Искате ли да регистрирате фирма?</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsCompany(true)}
                    className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-red-600 hover:bg-red-600/5 transition-all group"
                  >
                    <Building2 className="mb-3 text-zinc-500 group-hover:text-red-500" size={32} />
                    <span className="text-[14px] font-medium text-zinc-300">Да, фирма</span>
                  </button>
                  <button
                    onClick={() => onCompleteOnboarding()}
                    className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-red-600 hover:bg-red-600/5 transition-all group"
                  >
                    <User className="mb-3 text-zinc-500 group-hover:text-red-500" size={32} />
                    <span className="text-[14px] font-medium text-zinc-300">Не, по-късно</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onCompleteOnboarding} className="space-y-4 fade-in">
                <div className="space-y-4 pt-2">
                  <SupabaseInput label="Име на фирмата" name="companyName" value={companyName} onChange={(e: any) => setCompanyName(e.target.value)} placeholder="Пример: Декал Дизайн ЕООД" required />
                  <SupabaseInput label="ЕИК / Булстат" name="bulstat" value={bulstat} onChange={(e: any) => setBulstat(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))} placeholder="9 цифри (напр. 123456789)" required />
                  
                  <div className="flex items-center gap-2 px-1 cursor-pointer w-fit" onClick={() => setIsVatRegistered(!isVatRegistered)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isVatRegistered ? 'bg-red-600 border-red-600' : 'border-zinc-700 bg-zinc-900'}`}>
                      {isVatRegistered && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-[13px] text-zinc-400">Регистрирана по ДДС</span>
                  </div>

                  {isVatRegistered && (
                    <SupabaseInput 
                       label="ДДС Номер" 
                       name="vatNumber" 
                       value={vatNumber} 
                       onChange={(e: any) => setVatNumber(e.target.value.toUpperCase())} 
                       placeholder="Пример: BG123456789"
                     />
                  )}

                  <SupabaseInput label="Адрес на регистрация" name="companyAddress" value={companyAddress} onChange={(e: any) => setCompanyAddress(e.target.value)} placeholder="Град, пощенски код, улица..." required />
                  <SupabaseInput label="МОЛ" name="companyPerson" value={companyPerson} onChange={(e: any) => setCompanyPerson(e.target.value)} placeholder="Име на управителя" required />

                </div>


                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCompany(null)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-md transition-colors text-[14px] font-medium"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-2 rounded-md transition-colors text-[14px] font-medium disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Запази фирмени данни"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {view === 'recovery' && (
          <div className="w-full fade-in">
            {!recoverySent ? (
              <>
                <h1 className="text-[24px] font-semibold text-white mb-1 tracking-tight">Възстановяване</h1>
                <p className="text-[14px] text-zinc-500 mb-8">Въведете вашия имейл, за да получите инструкции</p>

                <form onSubmit={onRecover} className="space-y-4">
                  <SupabaseInput 
                    label="Имейл"
                    name="email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e: any) => setRecoveryEmail(e.target.value)}
                    required
                  />
                  
                  <div className="flex justify-center mt-2 min-h-[65px] w-full overflow-hidden">
                    <Turnstile siteKey="0x4AAAAAACn8KBpSOynPkBCf" onSuccess={(token) => setCaptchaToken(token)} options={{ theme: 'dark', size: 'flexible' }} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-2 rounded-md transition-colors text-[14px] font-medium disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Изпрати инструкции"}
                  </button>
                </form>

                <div className="mt-8 text-center text-[14px] text-zinc-500">
                   <button onClick={() => { setView('login'); window.history.pushState({}, '', '/login'); }} className="text-white hover:underline">
                     Назад към Вход
                   </button>
                   <div className="mt-6 pt-6 border-t border-zinc-900/50">
                    <button onClick={() => window.dispatchEvent(new CustomEvent('open-bug-report'))} className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors flex items-center justify-center gap-1.5 mx-auto">
                        <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                        Докладване на проблем
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={32} className="text-red-500" />
                </div>
                <h2 className="text-[20px] font-semibold text-white mb-2">
                    Проверете имейла си
                </h2>
                <p className="text-[14px] text-zinc-500 mb-8">
                    Изпратихме линк за възстановяване до <br/><span className="text-zinc-200">{recoveryEmail}</span>
                </p>
                <button 
                    onClick={() => setView('login')}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 flex items-center justify-center py-2 rounded-md transition-colors text-[14px] font-medium"
                >
                    Назад към Вход
                </button>
              </div>
            )}
          </div>
        )}

        </div>

        {/* Global Footer in left column - for login and register */}
        {(view === 'login' || view === 'register') && (
          <div className="mt-12 w-full max-w-[420px] mx-auto text-left text-[12px] text-zinc-500 leading-relaxed">
            Продължавайки се съгласявате с <a href="/terms" target="_blank" className="hover:text-white underline transition-colors">Общите условия</a> и{' '}
            <a href="/privacy" target="_blank" className="hover:text-white underline transition-colors">Политиката за поверителност</a> на CarDecal, както и да получавате периодични имейли с обновления.
          </div>
        )}

      </div>

      {/* Right Column (Image/Photo Area) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-[#280905]">
        
        {/* Royal Background Pattern Overlay - Same as PromosPage */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none"
          style={{ 
            backgroundImage: "url('/royal.png')", 
            backgroundRepeat: "repeat",
            backgroundSize: "300px",
          }}
        />
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#280905] via-transparent to-transparent z-10" />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-20">
          <div className="mb-8 p-6 rounded-full bg-black/30 backdrop-blur-md border border-white/5 shadow-2xl animate-float">
            <img src="/crown.png" alt="Crown" className="w-[100px] h-auto object-contain filter drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]" />
          </div>
          
          <div className="max-w-md space-y-6">
            <div className="h-[100px] flex items-center justify-center">
              <h2 key={quoteIndex} className="text-3xl font-medium text-white tracking-tight leading-loose slide-up-fade italic font-serif">
                "{view === 'register' ? registerBenefits[quoteIndex] : loginQuotes[quoteIndex]}"
              </h2>
            </div>
            <div className="flex gap-2 justify-center">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-700 ease-in-out ${i === quoteIndex ? 'w-10 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'w-3 bg-white/10'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ReportBugModal />
      <style>{`
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes eyeToggle {
          0% { transform: scale(0.5) rotate(-30deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .animate-eye {
          animation: eyeToggle 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .slide-up-fade {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}
