/**
 * SecurityTab - Admin Panel Security & Session Monitoring
 * ========================================================
 * Access: Super Admin (role='admin') ONLY
 * Shows:
 * - Security event logs (login/logout/password changes/bans/suspicious activity)
 * - Per-user security details (via user search or from UserProfileModal)
 * - IP masking for non-super-admin (though tab itself is admin-only)
 * - Force logout / session revocation controls
 *
 * Data retention:
 * - General logs: 90 days (auto-cleaned by pg_cron)
 * - Ban-related logs: 1 year
 * - Passwords are NEVER shown
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import {
    fetchSecurityLogs,
    SecurityLog,
    securityEventLabels,
    securityEventColors,
    maskIpAddress,
    SecurityEventType,
} from '../../lib/security';
import {
    Shield, Search, RefreshCw, Loader2, Filter,
    AlertTriangle, ChevronDown, ChevronUp, Clock,
    Globe, Monitor, User, X, Eye, EyeOff,
    LogOut, ShieldAlert, Activity
} from 'lucide-react';

// ── Type filter options ──
const EVENT_FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'Всички събития' },
    { value: 'login_success', label: 'Успешен вход' },
    { value: 'login_failed', label: 'Неуспешен вход' },
    { value: 'logout', label: 'Изход' },
    { value: 'password_change', label: 'Смяна на парола' },
    { value: 'suspicious_login', label: 'Подозрителен вход' },
    { value: 'ban_applied', label: 'Наложен бан' },
    { value: 'ban_bypass_attempt', label: 'Опит за заобикаляне' },
    { value: 'failed_rate_limit', label: 'Достигнат лимит' },
    { value: 'session_revoke', label: 'Прекратена сесия' },
    { value: 'session_revoke_all', label: 'Всички сесии прекратени' },
    { value: 'remember_me_set', label: '"Запомни ме" активирано' },
];

export const SecurityTab: React.FC = () => {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [searchUserId, setSearchUserId] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [showFullIps, setShowFullIps] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [userEmailCache, setUserEmailCache] = useState<Record<string, string>>({});

    const PAGE_SIZE = 30;

    // Fetch logs
    const loadLogs = useCallback(async (reset = false) => {
        setLoading(true);
        const currentOffset = reset ? 0 : offset;
        const userId = searchUserId || null;

        let fetchedLogs = await fetchSecurityLogs(userId, PAGE_SIZE, currentOffset);

        // Client-side filter by event type
        if (filterType !== 'all') {
            fetchedLogs = fetchedLogs.filter(l => l.event_type === filterType);
        }

        if (reset) {
            setLogs(fetchedLogs);
            setOffset(PAGE_SIZE);
        } else {
            setLogs(prev => [...prev, ...fetchedLogs]);
            setOffset(prev => prev + PAGE_SIZE);
        }
        setHasMore(fetchedLogs.length >= PAGE_SIZE);

        // Cache user emails
        const unknownUserIds = fetchedLogs
            .filter(l => l.user_id && !userEmailCache[l.user_id])
            .map(l => l.user_id!);

        if (unknownUserIds.length > 0) {
            const unique = [...new Set(unknownUserIds)];
            const { data } = await supabase
                .from('profiles')
                .select('id, email, full_name')
                .in('id', unique);
            if (data) {
                const newCache: Record<string, string> = {};
                data.forEach(p => {
                    newCache[p.id] = p.email || p.full_name || p.id.slice(0, 8);
                });
                setUserEmailCache(prev => ({ ...prev, ...newCache }));
            }
        }

        setLoading(false);
    }, [filterType, searchUserId, offset, userEmailCache]);

    useEffect(() => {
        loadLogs(true);
    }, [filterType, searchUserId]);

    // Search by email
    const handleEmailSearch = async () => {
        if (!searchEmail.trim()) {
            setSearchUserId('');
            return;
        }
        const { data } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', `%${searchEmail.trim()}%`)
            .limit(1)
            .single();

        if (data) {
            setSearchUserId(data.id);
        } else {
            setSearchUserId('___no_match___');
        }
    };

    const clearSearch = () => {
        setSearchEmail('');
        setSearchUserId('');
    };

    // Format date
    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('bg-BG', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    // Stat cards
    const stats = React.useMemo(() => {
        const total = logs.length;
        const failed = logs.filter(l => l.event_type === 'login_failed').length;
        const suspicious = logs.filter(l => l.event_type === 'suspicious_login').length;
        const bans = logs.filter(l => l.event_type === 'ban_applied').length;
        return { total, failed, suspicious, bans };
    }, [logs]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Записани събития', value: stats.total, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Activity },
                    { label: 'Неуспешни входове', value: stats.failed, color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: AlertTriangle },
                    { label: 'Подозрителни', value: stats.suspicious, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: ShieldAlert },
                    { label: 'Банове', value: stats.bans, color: 'text-red-500', bg: 'bg-red-500/10', icon: Shield },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-[#111] border border-white/5 rounded-2xl p-5"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">{stat.label}</span>
                        </div>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Controls */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Email search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">Търси по имейл</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchEmail}
                                onChange={e => setSearchEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleEmailSearch()}
                                placeholder="user@example.com"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                            />
                            <button
                                onClick={handleEmailSearch}
                                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                            {searchUserId && (
                                <button
                                    onClick={clearSearch}
                                    className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Event type filter */}
                    <div className="w-[220px]">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 block">Тип събитие</label>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 appearance-none"
                        >
                            {EVENT_FILTER_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* IP visibility toggle */}
                    <button
                        onClick={() => setShowFullIps(!showFullIps)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                            showFullIps
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                    >
                        {showFullIps ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {showFullIps ? 'Пълни IP' : 'Маскирани IP'}
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={() => loadLogs(true)}
                        disabled={loading}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Retention notice */}
            <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/10 rounded-xl px-5 py-3">
                <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-zinc-400">
                    <strong className="text-blue-400">Политика за задържане:</strong> Общи логове се изтриват автоматично след <strong className="text-white">90 дни</strong>. Логове свързани с банове се пазят до <strong className="text-white">1 година</strong>. Пароли <strong className="text-white">никога</strong> не се съхраняват в четим вид.
                </p>
            </div>

            {/* Logs table */}
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-20">
                        <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">Няма намерени логове за сигурност</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase tracking-widest">
                                    <th className="text-left px-5 py-4 font-bold">Дата</th>
                                    <th className="text-left px-5 py-4 font-bold">Събитие</th>
                                    <th className="text-left px-5 py-4 font-bold">Потребител</th>
                                    <th className="text-left px-5 py-4 font-bold">IP адрес</th>
                                    <th className="text-left px-5 py-4 font-bold">Устройство</th>
                                    <th className="text-left px-5 py-4 font-bold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                        >
                                            <td className="px-5 py-3.5 text-zinc-400 text-xs whitespace-nowrap">
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-xs font-bold ${securityEventColors[log.event_type as SecurityEventType] || 'text-zinc-400'}`}>
                                                    {securityEventLabels[log.event_type as SecurityEventType] || log.event_type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-zinc-300 text-xs">
                                                {log.user_id
                                                    ? (userEmailCache[log.user_id] || log.user_id.slice(0, 8) + '...')
                                                    : <span className="text-zinc-600">Анонимен</span>
                                                }
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-xs">
                                                <span className="text-zinc-400">
                                                    {showFullIps ? (log.ip_address || '—') : maskIpAddress(log.ip_address)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-zinc-500 text-xs">
                                                {log.device_info || '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                {expandedLog === log.id
                                                    ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
                                                    : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
                                                }
                                            </td>
                                        </tr>
                                        <AnimatePresence>
                                            {expandedLog === log.id && log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-5 pb-4">
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="bg-white/[0.02] rounded-xl p-4 border border-white/5"
                                                        >
                                                            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-2">Метаданни</p>
                                                            <pre className="text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono">
                                                                {JSON.stringify(log.metadata, null, 2)}
                                                            </pre>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Load more */}
                {hasMore && logs.length > 0 && (
                    <div className="p-4 border-t border-white/5 text-center">
                        <button
                            onClick={() => loadLogs(false)}
                            disabled={loading}
                            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-zinc-400 hover:text-white transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Зареди още'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
