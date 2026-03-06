
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Shield, RefreshCw, Copy, ExternalLink, Key, Lock, Fingerprint, Eye, EyeOff, Crown, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

export const StealthTab: React.FC = () => {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [stealthInfo, setStealthInfo] = useState<{ stealth_name: string; secret: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSecret, setShowSecret] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const fetchStealthInfo = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admin_stealth_access')
                .select('stealth_name, secret_token')
                .eq('profile_id', profile.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Not found
                } else {
                    throw error;
                }
            } else {
                setStealthInfo({
                    stealth_name: data.stealth_name,
                    secret: data.secret_token
                });
            }
        } catch (err) {
            console.error('Error fetching stealth info:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStealthInfo();
    }, [profile?.id]);

    const handleRegenerateClick = () => {
        if (!profile?.id) return;
        setShowConfirmModal(true);
    };

    const confirmRegenerate = async () => {
        if (!profile?.id) return;
        setShowConfirmModal(false);
        setRegenerating(true);
        try {
            // Generate a truly complex random key
            const randomValues = new Uint8Array(24);
            window.crypto.getRandomValues(randomValues);
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
            const newSecret = Array.from(randomValues)
                .map(b => chars.charAt(b % chars.length))
                .join('');
            
            const { error } = await supabase
                .from('admin_stealth_access')
                .update({ secret_token: newSecret })
                .eq('profile_id', profile.id);
            
            if (error) throw error;
            
            setStealthInfo(prev => prev ? { ...prev, secret: newSecret } : null);
            showToast('Нов супер-секретен ключ е генериран успешно!', 'success');
            setShowSecret(true); // Show it so they can copy it
        } catch (err: any) {
            console.error('Error generating secret:', err);
            showToast('Грешка при генериране на ключ: ' + (err.message || ''), 'error');
        } finally {
            setRegenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Копирано в клипборда!', 'success');
    };

    const stealthUrl = stealthInfo ? `${window.location.origin}/s/${stealthInfo.stealth_name}/${stealthInfo.secret}` : '';

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
        </div>
    );

    if (!stealthInfo) return (
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
            <Shield className="w-12 h-12 text-zinc-700 mx-auto" />
            <h3 className="text-white font-bold uppercase tracking-widest">Нямате настроен таен достъп</h3>
            <p className="text-zinc-500 text-xs text-balance">
                Свържете се с главния администратор за активиране на функцията за супер-секретен достъп.
            </p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Header / Status */}
            <div className="bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full group-hover:bg-red-600/20 transition-all duration-700" />
                
                <div className="relative z-10 space-y-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-red-500 font-black tracking-widest uppercase text-[10px]">
                                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                                Master Access Control
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">Таен Ключ за Достъп</h2>
                            {stealthInfo?.stealth_name === 'vasilminchevbenkov' && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Main Admin Owner</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-xl">
                            <Fingerprint className="w-8 h-8 text-white/20" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30">Сложен секретен код</label>
                            <Lock className="w-3 h-3 text-red-600/50" />
                        </div>
                        <div className="bg-black/40 border border-white/5 p-6 rounded-3xl flex items-center justify-between gap-4 group/code hover:border-white/20 transition-all">
                            <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight break-all">
                                {showSecret ? stealthInfo.secret : '••••••••••••••••••••••••'}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
                                    title={showSecret ? "Скрий" : "Покажи"}
                                >
                                    {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                <button 
                                    onClick={handleRegenerateClick}
                                    disabled={regenerating}
                                    className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-red-500 hover:bg-white/10 transition-all shrink-0 disabled:opacity-50"
                                    title="Регенерирай ключ"
                                >
                                    <RefreshCw size={20} className={regenerating ? "animate-spin" : ""} />
                                </button>
                                <button 
                                    onClick={() => copyToClipboard(stealthInfo.secret)}
                                    className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
                                    title="Копирай"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-10 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 pl-1">Вашият персонален Stealth URL:</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 bg-black/40 border border-white/5 p-5 text-sm text-zinc-400 font-mono truncate rounded-[1.5rem] group-hover:border-red-600/20 transition-all">
                                    {stealthUrl}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => copyToClipboard(stealthUrl)}
                                        className="flex-1 sm:flex-none px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all rounded-[1.5rem] flex items-center justify-center"
                                        title="Копирай линк"
                                    >
                                        <Copy size={20} />
                                    </button>
                                    <a 
                                        href={stealthUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 sm:flex-none px-6 py-4 bg-red-600 hover:bg-red-500 text-white transition-all rounded-[1.5rem] flex items-center justify-center transform active:scale-95 shadow-xl shadow-red-600/20"
                                        title="Тествай линк"
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-600/5 border border-red-600/10 p-6 rounded-[2rem] flex gap-4">
                            <Shield className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                            <div className="space-y-1">
                                <p className="text-[11px] text-white font-black uppercase tracking-widest">Двуфакторна Гейтуей Система</p>
                                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium uppercase tracking-wider">
                                    Този линк служи като таен вход, който ви прекарва през режима на поддръжка (maintance) и деактивираните защити. След разпознаване на ключа ще бъдете пренасочени към логин страницата за финално потвърждение на вашата идентичност чрез Google или парола.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] group hover:border-white/10 transition-all">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-black">Име за оторизация</p>
                    <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-red-600/40" />
                        <p className="text-white text-xl font-bold tracking-tight">
                            {stealthInfo.stealth_name === 'vasilminchevbenkov' ? 'vasil' : stealthInfo.stealth_name}
                        </p>
                    </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2rem] group hover:border-white/10 transition-all">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-black">Сигурност на ключа</p>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1.5 h-1.5 bg-red-600 rounded-full" />)}
                        </div>
                        <p className="text-white/60 text-xs font-black uppercase tracking-widest ml-2">High Encryption</p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirmModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-gradient-to-b from-[#1a0505] to-[#0A0202] border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden"
                        >
                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full pointer-events-none" />
                            
                            <button 
                                onClick={() => setShowConfirmModal(false)}
                                className="absolute right-4 top-4 p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
                            >
                                <X size={16} />
                            </button>

                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                                <AlertTriangle className="w-8 h-8 text-red-500 relative z-10" />
                            </div>

                            <h3 className="text-xl md:text-2xl font-black text-white tracking-widest uppercase mb-3 text-balance">
                                Внимание!
                            </h3>
                            
                            <p className="text-zinc-400 text-xs md:text-sm mb-8 leading-relaxed font-medium">
                                Старият ключ ще <strong className="text-red-400">спре да работи веднага</strong>. 
                                Всички съществуващи връзки с него ще бъдат прекратени.
                                <br/><br/>
                                Сигурни ли сте, че искате да генерирате нов секретен ключ?
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full relative z-10">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-xs bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
                                >
                                    Отказ
                                </button>
                                <button
                                    onClick={confirmRegenerate}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-xs bg-red-600 text-white hover:bg-red-500 border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Генерирай
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
