
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Shield, RefreshCw, Copy, ExternalLink, Clock, Key } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export const StealthTab: React.FC = () => {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [stealthInfo, setStealthInfo] = useState<{ stealth_name: string; secret: string } | null>(null);
    const [currentCode, setCurrentCode] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [loading, setLoading] = useState(true);

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

    const updateCode = async () => {
        if (!stealthInfo) return;
        try {
            const { data, error } = await supabase.rpc('get_my_stealth_code', {
                p_stealth_name: stealthInfo.stealth_name
            });
            if (error) throw error;
            setCurrentCode(data);
            
            // Calculate time left in current 10-min bucket
            const now = Math.floor(Date.now() / 1000);
            const bucketSize = 600;
            const remaining = bucketSize - (now % bucketSize);
            setTimeLeft(remaining);
        } catch (err) {
            console.error('Error updating code:', err);
        }
    };

    useEffect(() => {
        fetchStealthInfo();
    }, [profile?.id]);

    useEffect(() => {
        if (stealthInfo) {
            updateCode();
            const interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        updateCode();
                        return 600;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [stealthInfo]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Копирано!', 'success');
    };

    const stealthUrl = stealthInfo ? `${window.location.origin}/s/${stealthInfo.stealth_name}/${currentCode}` : '';

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
        </div>
    );

    if (!stealthInfo) return (
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
            <Shield className="w-12 h-12 text-zinc-700 mx-auto" />
            <h3 className="text-white font-bold uppercase tracking-widest">Нямате настроен таен достъп</h3>
            <p className="text-zinc-500 text-xs">
                Свържете се с главния администратор за активиране на тази функция.
            </p>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto py-8 space-y-8">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Shield className="w-32 h-32" />
                </div>
                
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-red-500 mb-2">
                        <Key className="w-5 h-5" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em]">Професионален Таен Вход</h2>
                    </div>

                    <div className="space-y-1">
                        <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Текущ код за достъп (10 мин)</p>
                        <div className="flex items-center gap-4">
                            <span className="text-5xl font-black text-white tracking-tighter tabular-nums font-mono">
                                {currentCode}
                            </span>
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-[11px] font-mono text-zinc-400 font-bold">{formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 uppercase tracking-widest">Вашият персонален URL за вход:</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-black/40 border border-white/10 px-4 py-3 text-xs text-zinc-300 font-mono truncate rounded-xl">
                                    {stealthUrl}
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(stealthUrl)}
                                    className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all rounded-xl"
                                    title="Копирай линк"
                                >
                                    <Copy size={18} />
                                </button>
                                <a 
                                    href={stealthUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-red-600 border border-red-500 hover:bg-red-500 text-white transition-all rounded-xl"
                                    title="Отвори линк"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>

                        <div className="bg-red-950/10 border border-red-900/20 p-4 rounded-xl">
                            <div className="flex gap-3">
                                <Shield className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-[10px] text-red-500/80 uppercase tracking-widest font-bold leading-relaxed">
                                    С този линк можете да влезете директно в административния панел, без да въвеждате парола. Кодът в края на линка се сменя автоматично на всеки 10 минути за максимална сигурност.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Име на достъп</p>
                    <p className="text-white font-mono font-bold">{stealthInfo.stealth_name}</p>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Таен ключ (Secret)</p>
                    <div className="flex items-center justify-between">
                        <p className="text-white font-mono font-bold truncate pr-4">••••••••••••••••</p>
                        <button 
                            onClick={() => copyToClipboard(stealthInfo.secret)}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
