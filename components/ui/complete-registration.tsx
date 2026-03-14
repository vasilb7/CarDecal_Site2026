import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Loader2, User, Phone, CheckSquare, Square } from 'lucide-react';
import { useToast } from '../Toast/ToastProvider';
import { translateAuthError } from '../../lib/passwordUtils';
import { isValidBulgarianPhone, formatToE164, formatPhoneNumber } from '../../lib/utils';

const FloatingInput = ({ 
    label, 
    icon,
    type = "text", 
    required = false, 
    value,
    onChange,
    className = "",
    ...props 

}: any) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="relative group w-full">
            <motion.label
                initial={false}
                animate={{
                    y: (isFocused || value) ? -42 : 0,
                    x: (isFocused || value) ? -44 : 0,
                    scale: (isFocused || value) ? 0.8 : 1,
                    color: isFocused ? "#ef4444" : (value ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)")
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute left-12 top-4 pointer-events-none transition-all z-10 px-1 select-none text-sm md:text-base font-medium"
            >
                {label}
            </motion.label>
            
            <div className="relative flex items-center">
                <input 
                    {...props}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={(e) => {
                        setIsFocused(true);
                        if (props.onFocus) props.onFocus(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        if (props.onBlur) props.onBlur(e);
                    }}
                    className={`w-full bg-white/[0.03] border ${isFocused ? 'border-red-600 shadow-[0_0_25px_rgba(239,68,68,0.15)]' : 'border-white/10'} rounded-xl px-4 py-4 ${icon ? 'pl-12' : ''} shadow-sm outline-none text-white placeholder-transparent transition-all ${className}`}
                    required={required}
                    placeholder=" "
                />
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                        {React.cloneElement(icon as React.ReactElement, {
                            className: `w-5 h-5 transition-all duration-300 ${isFocused ? 'text-red-500 scale-110' : (value ? 'text-white/80' : 'text-white/30')}`
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

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



    const [isCompany, setIsCompany] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [bulstat, setBulstat] = useState("");
    const [isVatRegistered, setIsVatRegistered] = useState(false);
    const [vatNumber, setVatNumber] = useState("");
    const [companyAddress, setCompanyAddress] = useState("");
    const [companyPerson, setCompanyPerson] = useState("");



    useEffect(() => {
        // Correctly detect if registration is incomplete
        const userPhone = user?.user_metadata?.phone || profile?.phone;
        const userName = user?.user_metadata?.full_name || profile?.full_name;
        
        let needsCompletion = false;
        if (!user || authLoading) {
            needsCompletion = false;
        } else {
            // Re-check for onboarding_completed if profile is loaded
            const isOnboardingDone = profile?.onboarding_completed ?? false;
            const isEmailUser = user?.app_metadata?.provider === 'email';

            // Only show for non-email users (e.g. Google) who have incomplete data
            needsCompletion = !isEmailUser && (!userName || !userPhone || !isOnboardingDone);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length < 2) {
            showToast('Моля, въведете име и фамилия разделени с интервал.', "warning");
            return;
        }

        if (!isValidBulgarianPhone(phone)) {
            showToast('Невалиден телефон! (8-15 цифри)', 'error');
            return;
        }

        if (isCompany) {
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

            if (isCompany) {
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

            if (isCompany) {
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

    // Immediate solid covering if we know we need completion
    const userName = user?.user_metadata?.full_name || profile?.full_name;
    const userPhone = user?.user_metadata?.phone || profile?.phone;
    
    let isBlocking = false;
    if (user && !authLoading) {
        isBlocking = !userName || !userPhone;
    }

    if (!isBlocking && !isOpen) return null;

    return (
        <AnimatePresence>
            {(isBlocking || isOpen) && (
                <motion.div 
                    initial={{ opacity: 1 }} // Start solid if blocking
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black p-4 overflow-y-auto"
                >
                    <motion.div 
                        initial={isOpen ? { scale: 1, y: 0 } : { scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: "spring", bounce: 0.4 }}
                        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl md:rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden"
                    >
                    {/* Background glows */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-900/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10">
                        <div className="text-center mb-6 md:mb-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                Завършете регистрацията
                            </h2>
                            <p className="text-zinc-400 text-sm md:text-base leading-relaxed px-2">
                                За да продължите, моля, потвърдете Вашите имена и въведете телефонен номер за връзка относно поръчките Ви.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <FloatingInput 
                                label="Име и Фамилия"
                                icon={
                                    <svg viewBox="0 0 19.05 19.05" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <g transform="matrix(1.2920428,0,0,1.2919512,-1.6693268,-1.8598751)">
                                            <circle cx="8.6640282" cy="6.1416821" r="3.1941113" stroke="currentColor" strokeWidth="0.4" />
                                            <path d="M 2.8440923,14.676347 A 5.8645983,5.8645983 0 0 1 8.6640286,9.5341541 5.8645983,5.8645983 0 0 1 14.484013,14.676741" stroke="currentColor" strokeWidth="0.4" />
                                        </g>
                                    </svg>
                                }
                                value={name}
                                onChange={(e: any) => setName(e.target.value.replace(/[0-9]/g, ''))}
                                required
                            />

                            <FloatingInput 
                                label="Телефонен номер"
                                icon={
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
                                            <path d="M15 7a2 2 0 0 1 2 2" />
                                            <path d="M15 3a6 6 0 0 1 6 6" />
                                        </svg>
                                    }
                                    type="tel"
                                    value={phone}
                                    onChange={(e: any) => setPhone(formatPhoneNumber(e.target.value))}
                                    required
                                    onKeyDown={(e: any) => {
                                        if (e.target.selectionStart <= 5 && (e.key === 'Backspace' || e.key === 'ArrowLeft' || e.key === 'Home')) {
                                            e.preventDefault();
                                            return;
                                        }
                                    }}
                                    onFocus={(e: any) => {
                                        const val = e.target.value;
                                        setTimeout(() => e.target.setSelectionRange(val.length, val.length), 0);
                                    }}
                                    onClick={(e: any) => {
                                        if (e.target.selectionStart < 5) {
                                            e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                                        }
                                    }}
                                    onSelect={(e: any) => {
                                    const start = e.target.selectionStart;
                                    if (start !== null && start < 5) {
                                        e.target.setSelectionRange(5, Math.max(5, e.target.selectionEnd || 5));
                                    }
                                }}
                            />

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer w-fit" onClick={() => setIsCompany(!isCompany)}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isCompany ? 'bg-red-600 text-white' : 'bg-white/10 text-transparent border border-white/20'}`}>
                                        <CheckSquare className="w-4 h-4" />
                                    </div>
                                    <span className="text-white text-sm">Искате ли да регистрирате фирма?</span>
                                </label>
                            </div>

                            <AnimatePresence>
                                {isCompany && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <FloatingInput 
                                            label="Наименование на фирмата"
                                            value={companyName}
                                            onChange={(e: any) => setCompanyName(e.target.value)}
                                            placeholder="Пример: Декал Дизайн ЕООД"
                                            required={isCompany}
                                        />
                                        <FloatingInput 
                                            label="ЕИК / Булстат (9 цифри)"
                                            value={bulstat}
                                            onChange={(e: any) => setBulstat(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
                                            placeholder="напр. 123456789"
                                            required={isCompany}
                                        />
                                        <div className="pl-1">
                                            <label className="flex items-center gap-2 cursor-pointer w-fit" onClick={() => setIsVatRegistered(!isVatRegistered)}>
                                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isVatRegistered ? 'bg-red-600 text-white' : 'bg-white/10 text-transparent border border-white/20'}`}>
                                                    <CheckSquare className="w-4 h-4" />
                                                </div>
                                                <span className="text-white text-sm">Регистрирана по ДДС</span>
                                            </label>
                                        </div>
                                        {isVatRegistered && (
                                            <FloatingInput 
                                                label="ДДС Номер"
                                                value={vatNumber}
                                                onChange={(e: any) => setVatNumber(e.target.value.toUpperCase())}
                                                placeholder="Пример: BG123456789"
                                            />
                                        )}
                                        <FloatingInput 
                                            label="Адрес на регистрация"
                                            value={companyAddress}
                                            onChange={(e: any) => setCompanyAddress(e.target.value)}
                                            placeholder="Град, п.к., улица и номер"
                                            required={isCompany}
                                        />
                                        <FloatingInput 
                                            label="МОЛ"
                                            value={companyPerson}
                                            onChange={(e: any) => setCompanyPerson(e.target.value)}
                                            placeholder="Име на управителя"
                                            required={isCompany}
                                        />

                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="pt-6">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full relative overflow-hidden bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 transition-all border border-red-500/30"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Запазване...</span>
                                        </>
                                    ) : (
                                        <span>Завърши</span>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
};
