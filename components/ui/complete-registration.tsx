import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Loader2, User, Phone, CheckSquare, Building2, ChevronRight, ArrowLeft, Check } from 'lucide-react';
import { useToast } from '../Toast/ToastProvider';
import { translateAuthError } from '../../lib/passwordUtils';
import { isValidPhone as isValidBulgarianPhone, formatToE164, formatPhoneNumber, isValidFullName } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

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

export const CompleteRegistrationModal = () => {
    const { user, profile, refreshProfile, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const { showToast } = useToast();
    
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(() => sessionStorage.getItem('registration_draft_name') || '');
    const [phone, setPhone] = useState(() => formatPhoneNumber(sessionStorage.getItem('registration_draft_phone') || ''));
    const [loading, setLoading] = useState(false);

    // Track if we have already pre-filled from Google/Auth
    const [isInitialized, setIsInitialized] = useState(() => sessionStorage.getItem('registration_initialized') === 'true');

    // Save drafts to sessionStorage
    useEffect(() => {
        if (name) sessionStorage.setItem('registration_draft_name', name);
        if (phone) sessionStorage.setItem('registration_draft_phone', phone);
    }, [name, phone]);

    // Използваме isValidBulgarianPhone от utils



    const [step, setStep] = useState(1);
    const [isCompany, setIsCompany] = useState<boolean | null>(null);
    const [companyName, setCompanyName] = useState("");
    const [bulstat, setBulstat] = useState("");
    const [isVatRegistered, setIsVatRegistered] = useState(false);
    const [vatNumber, setVatNumber] = useState("");
    const [companyAddress, setCompanyAddress] = useState("");
    const [companyPerson, setCompanyPerson] = useState("");
    const [quoteIndex, setQuoteIndex] = useState(0);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const registerBenefits = [
        "Направи първата крачка към своята нова цел.",
        "Открий възможностите, които те очакват тук.",
        "Присъедини се към общност, стремяща се към успех.",
        "Твоят напредък е наш основен приоритет.",
        "Започни своето пътешествие към промяната сега.",
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % registerBenefits.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);



    useEffect(() => {
        // Correctly detect if registration is incomplete
        const userPhone = user?.user_metadata?.phone || profile?.phone;
        const userName = user?.user_metadata?.full_name || profile?.full_name;
        
        let needsCompletion = false;
        if (!user || authLoading) {
            needsCompletion = false;
        } else {
            const isOnboardingDone = profile?.onboarding_completed ?? false;
            const isEmailUser = user?.app_metadata?.provider === 'email';

            // Email users already provide name/phone during registration
            // We only need to show this for non-email users (Google) who lack data,
            // OR if it's an email user who somehow ended up with missing name/phone
            const missingData = !userName || !userPhone;
            
            if (isEmailUser) {
                // For email users, only show if they are really missing critical info AND not marked as done
                needsCompletion = missingData && !isOnboardingDone;
            } else {
                // For Google users, show if any data is missing OR onboarding is not done
                needsCompletion = missingData || !isOnboardingDone;
            }
        }

        if (needsCompletion) {
            setIsOpen(true);
            
            // Pre-fill name draft if not initialized
            if (!isInitialized && !name) {
                const defaultName = 
                    user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    profile?.full_name || 
                    (user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') : '');
                    
                setName(defaultName);
                setIsInitialized(true);
                sessionStorage.setItem('registration_initialized', 'true');
            }
        } else {
            setIsOpen(false);
        }
    }, [user, profile, authLoading, isInitialized]);
    
    // Detect mobile keyboard close effect properly
    useEffect(() => {
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

    // Unified scroll lock handled by html class
    useEffect(() => {
        if (isOpen) {
            document.documentElement.classList.add('scroll-locked');
        } else {
            document.documentElement.classList.remove('scroll-locked');
        }

        return () => {
            document.documentElement.classList.remove('scroll-locked');
        };
    }, [isOpen]);

    const nextStep = () => {
        if (!isValidFullName(name)) {
            showToast('Въведете име и фамилия (3-100 символа).', "warning");
            return;
        }
        if (!isValidBulgarianPhone(phone)) {
            showToast('Невалиден телефон! (8-15 цифри)', 'error');
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e?: React.FormEvent, forcePersonal = false) => {
        if (e) e.preventDefault();
        
        const nameParts = name.trim().split(/\s+/);
        const activeIsCompany = forcePersonal ? false : isCompany;

        if (activeIsCompany) {
            if (!companyName || !bulstat || !companyAddress || !companyPerson) {
                showToast('Моля, попълнете всички задължителни данни за фирмата.', 'error');
                return;
            }
        }

        setLoading(true);

        try {
            const normalizedPhone = phone ? formatToE164(phone) : null;
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || firstName; // Fallback to avoid empty string constraint

            // Update profile first to check for uniqueness
            const updateData: any = { 
                full_name: name.trim(), 
                first_name: firstName,
                last_name: lastName,
                onboarding_completed: true,
                updated_at: new Date().toISOString()
            };
            
            if (normalizedPhone) {
                updateData.phone = normalizedPhone;
            }

            if (activeIsCompany) {
                updateData.is_company = true;
                updateData.account_type = 'company';
                updateData.company_name = companyName;
                updateData.bulstat = bulstat;
                updateData.company_address = companyAddress;
                updateData.company_person = companyPerson;
                updateData.vat_registered = isVatRegistered;
                updateData.vat_number = vatNumber;
            } else {
                updateData.is_company = false;
                updateData.account_type = 'personal';
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user?.id);
            
            if (profileError) {
                if (profileError.code === '23505') {
                    throw new Error('този телефонен номер вече е свързан с друг акаунт');
                }
                throw profileError;
            }

            // Update auth metadata
            const authUpdateData: any = {
                data: {
                    full_name: name.trim(),
                    first_name: firstName,
                    last_name: lastName,
                    onboarding_completed: true
                }
            };
            
            if (normalizedPhone) {
                authUpdateData.data.phone = normalizedPhone;
            }

            if (activeIsCompany) {
                authUpdateData.data.is_company = true;
                authUpdateData.data.company_name = companyName;
                authUpdateData.data.bulstat = bulstat;
                authUpdateData.data.company_address = companyAddress;
                authUpdateData.data.company_person = companyPerson;
                authUpdateData.data.vat_registered = isVatRegistered;
                authUpdateData.data.vat_number = vatNumber;
            } else {
                authUpdateData.data.is_company = false;
            }

            const { error: authError } = await supabase.auth.updateUser(authUpdateData);

            if (authError) throw authError;

            // Successfully updated
            showToast('Регистрацията е завършена успешно! Добре дошли в CarDecal.', 'success');
            
            // Clear drafts
            sessionStorage.removeItem('registration_draft_name');
            sessionStorage.removeItem('registration_draft_phone');
            sessionStorage.removeItem('registration_initialized');
            
            await refreshProfile();
            setIsOpen(false);
            
        } catch (error: any) {
            console.error('Error completing registration:', error);
            showToast(translateAuthError(error), 'error');
        } finally {
            setLoading(false);
        }
    };

    // Use the same blocking logic as App.tsx
    const isEmailUser = user?.app_metadata?.provider === 'email';
    const isBlocking = !!user && profile?.onboarding_completed === false && (!isEmailUser || (!profile?.full_name || !profile?.phone));

    if (!isBlocking && !isOpen) return null;

    return (
        <AnimatePresence>
            {(isBlocking || isOpen) && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-zinc-950 flex font-sans antialiased overflow-hidden"
                >
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
                            {step === 1 ? (
                                <div className="fade-in">
                                    <h1 className="text-[24px] font-semibold text-white mb-1 tracking-tight">Завършете профила си</h1>
                                    <p className="text-[14px] text-zinc-500 mb-8">Потвърдете Вашите имена и въведете телефонен номер за контакт.</p>

                                    <div className="space-y-4">
                                        <SupabaseInput 
                                            label="Име и Фамилия"
                                            name="name"
                                            value={name}
                                            onChange={(e: any) => setName(e.target.value.replace(/[0-9]/g, ''))}
                                            required
                                        />

                                        <SupabaseInput 
                                            ref={phoneInputRef}
                                            label="Телефонен номер"
                                            name="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e: any) => setPhone(formatPhoneNumber(e.target.value))}
                                            onFocus={(e: any) => {
                                                const val = e.target.value;
                                                setTimeout(() => e.target.setSelectionRange(val.length, val.length), 0);
                                            }}
                                            onKeyDown={(e: any) => {
                                                if (e.target.selectionStart <= 5 && (e.key === 'Backspace' || e.key === 'ArrowLeft' || e.key === 'Home')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            required
                                        />

                                        <div className="pt-6">
                                            <button
                                                onClick={nextStep}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-3 rounded-md transition-colors text-[14px] font-medium"
                                            >
                                                <span>Продължи</span>
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="fade-in">
                                    {isCompany === null ? (
                                        <div className="space-y-6">
                                            <div>
                                                <h1 className="text-[24px] font-semibold text-white mb-1 tracking-tight">Почти приключихме!</h1>
                                                <p className="text-[14px] text-zinc-500">Искате ли да довършим профила ви с фирмени данни?</p>
                                            </div>

                                            <div className="space-y-6 pt-4">
                                                <h2 className="text-[16px] font-medium text-white text-center">Искате ли да регистрирате фирма?</h2>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => setIsCompany(true)}
                                                        className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-red-600 hover:bg-red-600/5 transition-all group"
                                                    >
                                                        <Building2 className="mb-3 text-zinc-500 group-hover:text-red-500" size={32} />
                                                        <span className="text-[14px] font-medium text-zinc-300">Да, фирма</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubmit(undefined, true)}
                                                        className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-red-600 hover:bg-red-600/5 transition-all group"
                                                    >
                                                        <User className="mb-3 text-zinc-500 group-hover:text-red-500" size={32} />
                                                        <span className="text-[14px] font-medium text-zinc-300">Не, по-късно</span>
                                                    </button>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => setStep(1)}
                                                    className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs py-2"
                                                >
                                                    <ArrowLeft className="w-3 h-3" />
                                                    <span>Назад към лични данни</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="flex items-center gap-3 mb-6">
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsCompany(null)}
                                                    className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                </button>
                                                <h2 className="text-[20px] font-semibold text-white tracking-tight">Данни за фирмата</h2>
                                            </div>

                                            <div className="space-y-4">
                                                <SupabaseInput 
                                                    label="Наименование на фирмата"
                                                    name="companyName"
                                                    value={companyName}
                                                    onChange={(e: any) => setCompanyName(e.target.value)}
                                                    placeholder="Пример: Декал Дизайн ЕООД"
                                                    required
                                                />
                                                <SupabaseInput 
                                                    label="ЕИК / Булстат (9-13 цифри)"
                                                    name="bulstat"
                                                    value={bulstat}
                                                    onChange={(e: any) => setBulstat(e.target.value.replace(/[^0-9]/g, '').slice(0, 13))}
                                                    placeholder="напр. 123456789"
                                                    required
                                                />
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
                                                <SupabaseInput 
                                                    label="Адрес на регистрация"
                                                    name="companyAddress"
                                                    value={companyAddress}
                                                    onChange={(e: any) => setCompanyAddress(e.target.value)}
                                                    placeholder="Град, п.к., улица и номер"
                                                    required
                                                />
                                                <SupabaseInput 
                                                    label="МОЛ"
                                                    name="companyPerson"
                                                    value={companyPerson}
                                                    onChange={(e: any) => setCompanyPerson(e.target.value)}
                                                    placeholder="Име на управителя"
                                                    required
                                                />

                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-3 rounded-md transition-colors text-[14px] font-medium disabled:opacity-50 mt-4"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                            <span>Запазване...</span>
                                                        </>
                                                    ) : (
                                                        <span>Завърши</span>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-12 w-full max-w-[420px] mx-auto text-left text-[11px] text-zinc-500 leading-relaxed">
                            Продължавайки се съгласявате с <a href="/terms" target="_blank" className="hover:text-white underline transition-colors">Общите условия</a> и{' '}
                            <a href="/privacy" target="_blank" className="hover:text-white underline transition-colors">Политиката за поверителност</a> на CarDecal.
                        </div>
                    </div>

                    {/* Right Column (Branding) */}
                    <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-[#280905]">
                        <div 
                            className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none"
                            style={{ 
                                backgroundImage: "url('/royal.png')", 
                                backgroundRepeat: "repeat",
                                backgroundSize: "300px",
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#280905] via-transparent to-transparent z-10" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-20">
                            <div className="mb-8 p-6 rounded-full bg-black/30 backdrop-blur-md border border-white/5 shadow-2xl animate-float">
                                <img src="/crown.png" alt="Crown" className="w-[100px] h-auto object-contain filter drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]" />
                            </div>
                            
                            <div className="max-w-md space-y-6">
                                <div className="h-[100px] flex items-center justify-center">
                                    <h2 key={quoteIndex} className="text-2xl font-medium text-white tracking-tight leading-relaxed slide-up-fade italic font-serif">
                                        "{registerBenefits[quoteIndex]}"
                                    </h2>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    {registerBenefits.map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`h-1 rounded-full transition-all duration-700 ease-in-out ${i === quoteIndex ? 'w-8 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'w-2 bg-white/10'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <style>{`
                        .fade-in { animation: fadeIn 0.3s ease-in-out; }
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(5px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-float { animation: float 6s ease-in-out infinite; }
                        @keyframes float {
                            0%, 100% { transform: translateY(0px); }
                            50% { transform: translateY(-20px); }
                        }
                        .slide-up-fade { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                        @keyframes slideUpFade {
                            from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
                            to { opacity: 1; transform: translateY(0); filter: blur(0); }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
