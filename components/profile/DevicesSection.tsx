import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone, Monitor, Tablet, Globe, Shield, LogOut,
    Loader2, RefreshCw, CheckCircle2, Wifi, Clock, MapPin
} from 'lucide-react';
import {
    fetchUserDevices, getCurrentSessionId,
    revokeAllOtherDevices, revokeCurrentDevice,
    UserDevice
} from '../../lib/device-service';
import { maskIpForUser, relativeTimeBg } from '../../lib/device-utils';
import { useToast } from '../Toast/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// ── Device Icon Component ──

const DeviceIcon: React.FC<{ deviceType: string; platform: string; className?: string }> = ({
    deviceType, platform, className = ''
}) => {
    const iconClass = `w-6 h-6 ${className}`;

    if (deviceType === 'mobile' || platform === 'iPhone' || platform === 'Android') {
        return <Smartphone className={iconClass} />;
    }
    if (deviceType === 'tablet' || platform === 'iPad') {
        return <Tablet className={iconClass} />;
    }
    return <Monitor className={iconClass} />;
};

// ── Platform Color Helper ──

function getPlatformColor(platform: string | null): string {
    switch (platform) {
        case 'iPhone':
        case 'iPad':
        case 'macOS': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        case 'Android': return 'text-green-400 bg-green-500/10 border-green-500/20';
        case 'Windows': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        case 'Linux':
        case 'Chrome OS': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        default: return 'text-zinc-400 bg-white/5 border-white/10';
    }
}

// ── Single Device Card Component ──

const DeviceCard: React.FC<{
    device: UserDevice;
    isCurrent: boolean;
    onRevoke?: () => void;
    revoking?: boolean;
}> = ({ device, isCurrent, onRevoke, revoking }) => {
    const colorCls = getPlatformColor(device.platform);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className={`relative bg-[#0f0f0f] border rounded-2xl p-5 transition-all duration-300 group ${
                isCurrent
                    ? 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.06)]'
                    : 'border-white/5 hover:border-white/10'
            }`}
        >
            {/* Current badge */}
            {isCurrent && (
                <div className="absolute -top-2.5 left-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Текущо устройство
                    </span>
                </div>
            )}

            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${colorCls}`}>
                    <DeviceIcon
                        deviceType={device.device_type}
                        platform={device.platform || ''}
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm tracking-wide truncate">
                        {device.device_label}
                    </h4>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                        {/* Last active */}
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                            <Clock className="w-3 h-3" />
                            {isCurrent ? (
                                <span className="text-emerald-500">Активно сега</span>
                            ) : (
                                relativeTimeBg(device.last_seen_at)
                            )}
                        </div>

                        {/* IP */}
                        {device.ip_masked && (
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase font-bold tracking-wider">
                                <Wifi className="w-3 h-3" />
                                {device.ip_masked}
                            </div>
                        )}
                    </div>

                    {/* First seen */}
                    {device.created_at && (
                        <p className="mt-1.5 text-[9px] text-zinc-700 uppercase font-bold tracking-widest">
                            Вход от: {new Date(device.created_at).toLocaleDateString('bg-BG', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    )}
                </div>

                {/* Revoke button (only for non-current sessions) */}
                {!isCurrent && onRevoke && (
                    <button
                        onClick={onRevoke}
                        disabled={revoking}
                        className="shrink-0 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all disabled:opacity-40"
                        title="Прекрати сесията"
                    >
                        {revoking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <LogOut className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// ── Main DevicesSection Component ──

const DevicesSection: React.FC = () => {
    const { user, signOut } = useAuth();
    const { showToast } = useToast();

    const [devices, setDevices] = useState<UserDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [signingOutCurrent, setSigningOutCurrent] = useState(false);

    const loadDevices = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [fetchedDevices, sessionId] = await Promise.all([
                fetchUserDevices(user.id),
                getCurrentSessionId()
            ]);
            setDevices(fetchedDevices);
            setCurrentSessionId(sessionId);
        } catch {
            showToast('Грешка при зареждане на устройствата.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    // Separate current from other devices
    const currentDevice = devices.find(d => d.session_id === currentSessionId);
    const otherDevices = devices.filter(d => d.session_id !== currentSessionId);

    const handleRevokeAll = async () => {
        if (!user) return;
        setRevokingAll(true);
        try {
            const success = await revokeAllOtherDevices(user.id);
            if (success) {
                showToast('Излезе успешно от всички други устройства.', 'success');
                await loadDevices();
            } else {
                throw new Error();
            }
        } catch {
            showToast('Възникна проблем при управлението на сесиите. Опитай отново.', 'error');
        } finally {
            setRevokingAll(false);
        }
    };

    const handleRevokeSingle = async (deviceId: string) => {
        setRevokingId(deviceId);
        try {
            const { error } = await supabase
                .from('user_devices')
                .update({ is_active: false, revoked_at: new Date().toISOString() })
                .eq('id', deviceId);

            if (error) throw error;
            showToast('Сесията е прекратена.', 'success');
            setDevices(prev => prev.filter(d => d.id !== deviceId));
        } catch {
            showToast('Грешка при прекратяване на сесията.', 'error');
        } finally {
            setRevokingId(null);
        }
    };

    const handleSignOutCurrent = async () => {
        if (!user) return;
        setSigningOutCurrent(true);
        try {
            await revokeCurrentDevice(user.id);
            await signOut();
        } catch {
            showToast('Грешка при излизане.', 'error');
            setSigningOutCurrent(false);
        }
    };

    const cardWrapCls = 'bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl';

    return (
        <div className={`${cardWrapCls} p-6 md:p-8`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Устройства</h3>
                        <p className="text-xs text-zinc-600 mt-0.5">
                            Тук можеш да видиш къде е активен профилът ти и да управляваш сесиите си.
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadDevices}
                    disabled={loading}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                    title="Обнови"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Loading state */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
                    <p className="text-zinc-600 text-xs uppercase tracking-widest font-bold animate-pulse">
                        Зареждане на устройствата...
                    </p>
                </div>
            ) : (
                <div className="space-y-6 mt-6">
                    {/* Current Device */}
                    {currentDevice ? (
                        <div>
                            <DeviceCard
                                device={currentDevice}
                                isCurrent={true}
                            />
                        </div>
                    ) : (
                        /* Fallback if current device not found in DB yet */
                        <div className="bg-[#0f0f0f] border border-emerald-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Текущо устройство</p>
                                    <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mt-0.5">
                                        Активно сега
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other Devices */}
                    {otherDevices.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                                    Други активни устройства ({otherDevices.length})
                                </h4>
                            </div>
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {otherDevices.map(device => (
                                        <DeviceCard
                                            key={device.id}
                                            device={device}
                                            isCurrent={false}
                                            onRevoke={() => handleRevokeSingle(device.id)}
                                            revoking={revokingId === device.id}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {otherDevices.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-7 h-7 text-emerald-500/60" />
                            </div>
                            <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest">
                                Няма други активни устройства.
                            </p>
                            <p className="text-zinc-700 text-[10px] mt-1 max-w-xs">
                                Профилът ти е активен само на това устройство.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-white/5 space-y-3">
                        {otherDevices.length > 0 && (
                            <button
                                onClick={handleRevokeAll}
                                disabled={revokingAll}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                            >
                                {revokingAll ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4" />
                                )}
                                Излез от всички други устройства
                            </button>
                        )}

                        <button
                            onClick={handleSignOutCurrent}
                            disabled={signingOutCurrent}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                        >
                            {signingOutCurrent ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                            Излез от това устройство
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevicesSection;
