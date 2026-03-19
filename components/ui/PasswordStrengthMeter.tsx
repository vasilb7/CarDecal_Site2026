import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { validatePassword, getPasswordStrength } from '../../lib/passwordUtils';

interface PasswordStrengthMeterProps {
    password: string;
    confirmPassword?: string;
    showChecklist?: boolean;
    userInputs?: string[];
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
    password,
    confirmPassword,
    showChecklist = true,
    userInputs = [],
}) => {
    const { checks, isValid } = validatePassword(password);
    const strength = getPasswordStrength(password, userInputs);

    if (!password) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 pt-2"
        >
            {/* Strength Bar - Hide when strong enough and valid */}
            <AnimatePresence>
                {!isValid && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5 overflow-hidden"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                                Сила на паролата
                            </span>
                            <motion.span
                                key={strength.level}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-[10px] uppercase tracking-widest font-black ${strength.color}`}
                            >
                                {strength.label}
                            </motion.span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${strength.percent}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className={`h-full rounded-full ${strength.barColor} transition-colors duration-300`}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Checklist - Hide when everything is passed */}
            <AnimatePresence>
                {showChecklist && !isValid && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 overflow-hidden"
                    >
                        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-2 block">
                            Изисквания за парола
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {checks.map((check) => (
                            <motion.div
                                key={check.id}
                                initial={false}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 py-0.5"
                            >
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: check.passed ? [1, 1.2, 1] : 1,
                                        rotate: check.passed ? [0, 10, 0] : 0,
                                    }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {check.passed ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                                    ) : (
                                        <X className="w-3.5 h-3.5 text-zinc-600" strokeWidth={2} />
                                    )}
                                </motion.div>
                                <span
                                    className={`text-[11px] transition-colors duration-200 ${
                                        check.passed
                                            ? 'text-emerald-400/80 font-medium'
                                            : 'text-zinc-600'
                                    }`}
                                >
                                    {check.label}
                                </span>
                            </motion.div>
                        ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm Password Match */}
            {confirmPassword !== undefined && password && confirmPassword && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`flex items-center gap-2 py-1 px-3 rounded-lg text-[11px] font-medium ${
                            password === confirmPassword
                                ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10'
                                : 'text-red-400 bg-red-500/5 border border-red-500/10'
                        }`}
                    >
                        {password === confirmPassword ? (
                            <>
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                Паролите съвпадат
                            </>
                        ) : (
                            <>
                                <X className="w-3.5 h-3.5" strokeWidth={2} />
                                Паролите не съвпадат
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}


        </motion.div>
    );
};

export default PasswordStrengthMeter;
