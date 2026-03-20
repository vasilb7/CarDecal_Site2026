import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ShieldBan, Clock, Mail, FileText, ExternalLink, LogOut, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

// ─── Deletion Request Modal ──────────────────────────────────────────────
const DeletionRequestModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => Promise<void>;
    loading: boolean;
    submitted: boolean;
}> = ({ isOpen, onClose, onSubmit, loading, submitted }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg p-6 md:p-8"
            >
                {submitted ? (
                    <div className="text-center py-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-3">Заявката е изпратена</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                            Получихме заявката ти за изтриване на акаунта. Профилът ти ще бъде деактивиран, 
                            а личните данни, които вече не са необходими, ще бъдат изтрити или анонимизирани. 
                            Информация, свързана с поръчки, плащания, рекламации, сигурност и законови задължения, 
                            може да бъде съхранявана за ограничен срок.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-white/10 text-white text-xs uppercase tracking-widest font-bold hover:bg-white/20 transition-all rounded-xl"
                        >
                            Разбрах
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Заявка за изтриване на акаунта</h3>
                                <p className="text-zinc-500 text-xs">Тази заявка ще бъде прегледана от нашия екип</p>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-6 space-y-3">
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                При подаване на тази заявка:
                            </p>
                            <ul className="space-y-2 text-zinc-400 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">&#x2022;</span>
                                    Акаунтът ти ще бъде деактивиран
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">&#x2022;</span>
                                    Лични данни, които вече не са необходими, ще бъдат изтрити или анонимизирани
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">&#x2022;</span>
                                    Данни, свързани с поръчки, плащания, сигурност и законови задължения, може да бъдат
                                    съхранявани за определен срок съгласно приложимото законодателство
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 border border-white/10 text-zinc-400 text-xs uppercase tracking-widest font-bold hover:text-white transition-colors rounded-xl"
                            >
                                Отказ
                            </button>
                            <button
                                onClick={onSubmit}
                                disabled={loading}
                                className="flex-1 py-3 bg-red-600 text-white text-xs uppercase tracking-widest font-bold hover:bg-red-700 transition-colors rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                Изпрати Заявка
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

// ─── Main Restricted Page ──────────────────────────────────────────────────
const RestrictedPage: React.FC = () => {
    const { profile, signOut, moderationStatus } = useAuth();
    const [deletionModalOpen, setDeletionModalOpen] = useState(false);
    const [deletionLoading, setDeletionLoading] = useState(false);
    const [deletionSubmitted, setDeletionSubmitted] = useState(false);

    const isTemporary = moderationStatus === 'temporarily_suspended';
    const isPermanent = moderationStatus === 'permanently_banned';

    const bannedUntilDate = profile?.banned_until 
        ? new Date(profile.banned_until).toLocaleString('bg-BG', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : null;

    const publicReason = profile?.public_reason || 'Нарушение на Общите условия';

    const alreadyRequestedDeletion = !!profile?.deletion_requested_at;

    const handleDeletionRequest = async () => {
        setDeletionLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    deletion_requested_at: new Date().toISOString(),
                    deletion_request_status: 'pending'
                })
                .eq('id', profile!.id);

            if (!error) {
                // Log in moderation history
                await supabase.from('moderation_history').insert({
                    user_id: profile!.id,
                    action_type: 'delete_request',
                    public_reason: 'Потребителят подаде заявка за изтриване на акаунта',
                    metadata: { source: 'restricted_page' }
                });
                setDeletionSubmitted(true);
            }
        } catch (err) {
            console.error('Deletion request error:', err);
        } finally {
            setDeletionLoading(false);
        }
    };

    // ─── Auto-Refresh Logic ─────────────────────────────────────────────
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    React.useEffect(() => {
        if (!isTemporary || !profile?.banned_until) return;

        const checkTime = () => {
            const bannedUntil = new Date(profile.banned_until).getTime();
            const now = new Date().getTime();
            const diff = bannedUntil - now;

            if (diff <= 0) {
                window.location.href = '/';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const totalHours = (days * 24) + hours;
            let timeStr = `${totalHours}ч : ${minutes.toString().padStart(2, '0')}мин : ${seconds.toString().padStart(2, '0')}сек`;
            setTimeLeft(timeStr);
        };

        const timer = setInterval(checkTime, 1000);
        checkTime(); // Initial check

        return () => clearInterval(timer);
    }, [isTemporary, profile?.banned_until]);

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/3 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-900/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-lg"
            >
                {/* Main Card */}
                <div className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                    {/* Header banner */}
                    <div className={`px-6 py-8 md:px-8 md:py-10 text-center ${isTemporary ? 'bg-gradient-to-b from-amber-600/10 to-transparent' : 'bg-gradient-to-b from-red-600/10 to-transparent'}`}>
                        <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center ${isTemporary ? 'bg-amber-600/10 border border-amber-600/20' : 'bg-red-600/10 border border-red-600/20'}`}>
                            {isTemporary ? (
                                <Clock className="w-10 h-10 text-amber-500" />
                            ) : (
                                <ShieldBan className="w-10 h-10 text-red-500" />
                            )}
                        </div>

                        <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-2">
                            {isTemporary 
                                ? 'Акаунтът ти е временно ограничен'
                                : 'Акаунтът ти е окончателно ограничен'
                            }
                        </h1>

                        <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                            {isTemporary ? (
                                <>
                                    Достъпът до профила ти е ограничен
                                    {bannedUntilDate && <> до <span className="text-amber-400 font-semibold">{bannedUntilDate}</span></>}.
                                </>
                            ) : (
                                'Профилът ти е деактивиран поради нарушение на Общите условия.'
                            )}
                        </p>
                    </div>

                    {/* Details section */}
                    <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4">
                        {/* Reason */}
                        <div className={`p-4 rounded-xl border ${isTemporary ? 'bg-amber-950/10 border-amber-600/10' : 'bg-red-950/10 border-red-600/10'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className={`w-3.5 h-3.5 ${isTemporary ? 'text-amber-500' : 'text-red-500'}`} />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Причина за ограничение</span>
                            </div>
                            <p className={`text-sm ${isTemporary ? 'text-amber-200/80' : 'text-red-200/80'}`}>
                                {publicReason}
                            </p>
                        </div>



                        {/* Remaining time for temp bans */}
                        {isTemporary && bannedUntilDate && (
                            <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Ограничението изтича</span>
                                </div>
                                {timeLeft && (
                                    <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
                                        <div className="text-[10px] uppercase font-black tracking-[0.2em] text-amber-500/60 mb-2">Оставащо време</div>
                                        <div className="text-2xl font-black text-amber-500 tabular-nums tracking-wider leading-none">
                                            {timeLeft}
                                        </div>
                                    </div>
                                )}
                                <p className="text-zinc-500 text-[11px] mt-3">
                                    След изтичането ще имаш пълен достъп до профила си.
                                </p>
                            </div>
                        )}

                        {/* Permanent ban - data retention notice */}
                        {isPermanent && (
                            <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5">
                                <p className="text-zinc-400 text-xs leading-relaxed">
                                    Данни, свързани с поръчки, плащания, сигурност и законови задължения, 
                                    може да бъдат съхранявани за определен срок съгласно приложимото законодателство
                                    и вътрешната политика за съхранение на данни.
                                </p>
                            </div>
                        )}

                        {/* Info text */}
                        <p className="text-zinc-500 text-xs text-center leading-relaxed">
                            Ако смяташ, че това е грешка, свържи се с нас.
                        </p>

                        {/* Action buttons */}
                        <div className="space-y-2 pt-2">
                            {/* Contact / Support */}
                            <a
                                href="/contact"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 text-white text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-all rounded-xl"
                            >
                                <Mail className="w-4 h-4" />
                                Свържи се с нас
                            </a>

                            {/* Deletion request (for permanent bans) */}
                            {isPermanent && (
                                <button
                                    onClick={() => !alreadyRequestedDeletion && setDeletionModalOpen(true)}
                                    disabled={alreadyRequestedDeletion}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600/10 border border-red-600/20 text-red-400 text-xs uppercase tracking-widest font-bold hover:bg-red-600/20 transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FileText className="w-4 h-4" />
                                    {alreadyRequestedDeletion ? 'Заявката е изпратена' : 'Заявка за изтриване на акаунта'}
                                </button>
                            )}

                            {/* Links row */}
                            <div className="flex items-center justify-center gap-4 pt-2">
                                <a href="/terms" target="_blank" rel="noopener noreferrer"
                                    className="text-zinc-600 hover:text-zinc-400 text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Общи условия
                                </a>
                                <a href="/privacy" target="_blank" rel="noopener noreferrer"
                                    className="text-zinc-600 hover:text-zinc-400 text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Поверителност
                                </a>
                            </div>

                            {/* Sign out */}
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 py-3 text-zinc-600 hover:text-zinc-400 text-[10px] uppercase tracking-widest font-bold transition-all mt-2"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Изход
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer branding */}
                <p className="text-center text-zinc-700 text-[9px] uppercase tracking-[0.3em] mt-6">
                    CARDECAL
                </p>
            </motion.div>

            {/* Deletion Request Modal */}
            <AnimatePresence>
                <DeletionRequestModal
                    isOpen={deletionModalOpen}
                    onClose={() => setDeletionModalOpen(false)}
                    onSubmit={handleDeletionRequest}
                    loading={deletionLoading}
                    submitted={deletionSubmitted}
                />
            </AnimatePresence>
        </div>
    );
};

export default RestrictedPage;
