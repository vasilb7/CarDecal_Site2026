import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Loader2, User, Phone } from 'lucide-react';
import { useToast } from '../Toast/ToastProvider';
import { isValidBulgarianPhone } from '../../lib/utils';

const FloatingInput = ({ 
    label, 
    icon,
    type = "text", 
    required = false, 
    value,
    onChange,
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
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`w-full bg-white/[0.03] border ${isFocused ? 'border-red-600 shadow-[0_0_25px_rgba(239,68,68,0.15)]' : 'border-white/10'} rounded-xl px-4 py-4 pl-12 shadow-sm outline-none text-white placeholder-transparent transition-all`}
                    required={required}
                    placeholder=" "
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                    {React.cloneElement(icon as React.ReactElement, {
                        className: `w-5 h-5 transition-all duration-300 ${isFocused ? 'text-red-500 scale-110' : (value ? 'text-white/80' : 'text-white/30')}`
                    })}
                </div>
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
    const [phone, setPhone] = useState(() => sessionStorage.getItem('registration_draft_phone') || '');
    const [loading, setLoading] = useState(false);

    // Track if we have already pre-filled from Google/Auth
    const [isInitialized, setIsInitialized] = useState(() => sessionStorage.getItem('registration_initialized') === 'true');

    // Save drafts to sessionStorage
    useEffect(() => {
        if (name) sessionStorage.setItem('registration_draft_name', name);
        if (phone) sessionStorage.setItem('registration_draft_phone', phone);
    }, [name, phone]);

    // Използваме isValidBulgarianPhone от utils

    const normalizePhone = (num: string) => {
        let clean = num.replace(/[\s-]/g, '');
        if (clean.startsWith('00')) clean = '+' + clean.substring(2);
        if (clean.startsWith('0')) clean = '+359' + clean.substring(1);
        if (!clean.startsWith('+')) clean = '+359' + clean;
        return clean;
    };

    useEffect(() => {
        // Correctly detect if registration is incomplete
        const userPhone = user?.user_metadata?.phone || profile?.phone;
        const needsCompletion = !!user && !authLoading && !userPhone;

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

        if (name.trim().split(' ').length < 2) {
            showToast(t('toast.register_full_name_required', 'Моля, въведете две имена!'), "warning");
            return;
        }

        if (!isValidBulgarianPhone(phone)) {
            showToast('Невалиден телефон! (8-15 цифри)', 'error');
            return;
        }

        setLoading(true);

        try {
            const normalizedPhone = normalizePhone(phone);

            // Update profile first to check for uniqueness
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ 
                    full_name: name.trim(), 
                    phone: normalizedPhone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);
            
            if (profileError) {
                if (profileError.code === '23505') {
                    throw new Error('този телефонен номер вече е свързан с друг акаунт');
                }
                throw profileError;
            }

            // Update auth metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: name.trim(),
                    phone: normalizedPhone
                }
            });

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
            showToast(error.message || 'Възникна грешка при завършване на регистрацията.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Immediate solid covering if we know we need completion
    const userPhone = user?.user_metadata?.phone || profile?.phone;
    const isBlocking = !!user && !authLoading && !userPhone;

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

                        <form onSubmit={handleSubmit} className="space-y-10">
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
                                onChange={(e: any) => setPhone(e.target.value)}
                                required
                            />

                            <div className="pt-4">
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
