import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone, Monitor, Tablet, Shield, LogOut,
    Loader2, RefreshCw, CheckCircle2, Wifi, Clock, ChevronDown
} from 'lucide-react';
import {
    fetchUserDevices, getCurrentSessionId,
    revokeAllOtherDevices, revokeCurrentDevice,
    UserDevice
} from '../../lib/device-service';
import { relativeTimeBg } from '../../lib/device-utils';
import { useToast } from '../Toast/ToastProvider';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// ── Device Icon ──

const DeviceIcon: React.FC<{ deviceType: string; platform: string; className?: string }> = ({
    deviceType, platform, className = ''
}) => {
    const iconClass = `w-5 h-5 ${className}`;
    if (deviceType === 'mobile' || platform === 'iPhone' || platform === 'Android') {
        return <Smartphone className={iconClass} />;
    }
    if (deviceType === 'tablet' || platform === 'iPad') {
        return <Tablet className={iconClass} />;
    }
    return <Monitor className={iconClass} />;
};

// ── Platform Color ──

function getPlatformColor(os_name: string | null): string {
    switch (os_name) {
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

// ── Single Device Card ──

const DeviceCard: React.FC<{
    device: UserDevice;
    isCurrent: boolean;
    onRevoke?: () => void;
    revoking?: boolean;
}> = ({ device, isCurrent, onRevoke, revoking }) => {
    const colorCls = getPlatformColor(device.os_name);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className={`relative bg-[#0f0f0f] border rounded-2xl p-4 transition-all duration-300 ${
                isCurrent
                    ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                    : 'border-white/5 hover:border-white/10'
            }`}
        >
            {isCurrent && (
                <div className="absolute -top-2 left-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-400">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Текущо
                    </span>
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${colorCls}`}>
                    <DeviceIcon deviceType={device.device_type} platform={device.os_name || ''} />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{device.device_label}</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold">
                            <Clock className="w-3 h-3" />
                            {isCurrent ? (
                                <span className="text-emerald-500">Сега</span>
                            ) : (
                                relativeTimeBg(device.last_seen_at)
                            )}
                        </div>
                        {device.ip_masked && (
                            <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-bold">
                                <Wifi className="w-3 h-3" />
                                {device.ip_masked}
                            </div>
                        )}
                    </div>
                </div>

                {!isCurrent && onRevoke && (
                    <button
                        onClick={onRevoke}
                        disabled={revoking}
                        className="shrink-0 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all disabled:opacity-40"
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

// ── Main DevicesSection ──

interface DevicesSectionProps {
    targetUserId?: string;
    isAdminView?: boolean;
}

const DevicesSection: React.FC<DevicesSectionProps> = ({ targetUserId, isAdminView }) => {
    const { user: currentUser, signOut } = useAuth();
    const { showToast } = useToast();

    const userId = targetUserId || currentUser?.id;

    const [devices, setDevices] = useState<UserDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [signingOutCurrent, setSigningOutCurrent] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const loadDevices = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const sessionId = getCurrentSessionId();
            const fetchedDevices = await fetchUserDevices(userId);
            setDevices(fetchedDevices);
            setCurrentSessionId(sessionId);
        } catch {
            showToast('Грешка при зареждане на устройствата.', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId, showToast]);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    // Realtime: listen for device changes (new devices added, revoked, etc.)
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`devices-ui:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_devices',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Refresh the device list on any change
                    loadDevices();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, loadDevices]);

    const currentDevice = devices.find(d => d.session_id === currentSessionId);
    const otherDevices = devices.filter(d => d.session_id !== currentSessionId);

    const handleRevokeAll = async () => {
        if (!userId) return;
        setRevokingAll(true);
        try {
            const success = await revokeAllOtherDevices(userId);
            if (success) {
                showToast('Излезе успешно от всички други устройства.', 'success');
                // Realtime will auto-refresh the list
            } else {
                throw new Error();
            }
        } catch {
            showToast('Възникна проблем. Опитай отново.', 'error');
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
            // Realtime will auto-update the list
        } catch {
            showToast('Грешка при прекратяване на сесията.', 'error');
        } finally {
            setRevokingId(null);
        }
    };

    const handleSignOutCurrent = async () => {
        if (!currentUser) return;
        setSigningOutCurrent(true);
        try {
            await revokeCurrentDevice(currentUser.id);
            await signOut();
        } catch {
            showToast('Грешка при излизане.', 'error');
            setSigningOutCurrent(false);
        }
    };

    const totalDevices = devices.length;
    const totalOther = otherDevices.length;

    const cardWrapCls = isAdminView 
        ? 'bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden' 
        : 'bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl';

    return (
        <div className={`${cardWrapCls}`}>
            {/* Header - always visible, acts as toggle */}
            <button
                onClick={() => setExpanded(prev => !prev)}
                className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-white/[0.02] transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Устройства
                            {totalDevices > 0 && (
                                <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">
                                    {totalDevices}
                                </span>
                            )}
                        </h3>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                            {isAdminView
                                ? 'Активни сесии на потребителя.'
                                : 'Управлявай активните си сесии.'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); loadDevices(); }}
                        disabled={loading}
                        className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                        title="Обнови"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Expandable content */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <Loader2 className="w-6 h-6 text-red-600 animate-spin mb-2" />
                                    <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
                                        Зареждане...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Current device - always shown first */}
                                    {currentDevice && !isAdminView && (
                                        <DeviceCard device={currentDevice} isCurrent={true} />
                                    )}

                                    {/* Other devices */}
                                    {(isAdminView ? devices : otherDevices).length > 0 && (
                                        <div>
                                            {!isAdminView && totalOther > 0 && (
                                                <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3">
                                                    Други устройства ({totalOther})
                                                </h4>
                                            )}
                                            <div className="space-y-2.5">
                                                <AnimatePresence mode="popLayout">
                                                    {(isAdminView ? devices : otherDevices).map(device => (
                                                        <DeviceCard
                                                            key={device.id}
                                                            device={device}
                                                            isCurrent={device.session_id === currentSessionId && !isAdminView}
                                                            onRevoke={() => handleRevokeSingle(device.id)}
                                                            revoking={revokingId === device.id}
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty state: Show when no devices at all */}
                                    {totalDevices === 0 && (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-3">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
                                            </div>
                                            <p className="text-zinc-500 text-xs font-bold">
                                                Няма регистрирани устройства.
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {!isAdminView && (
                                        <div className="pt-3 border-t border-white/5 space-y-2.5">
                                            {totalOther > 0 && (
                                                <button
                                                    onClick={handleRevokeAll}
                                                    disabled={revokingAll}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                                                >
                                                    {revokingAll ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <LogOut className="w-4 h-4" />
                                                    )}
                                                    Излез от всички други ({totalOther})
                                                </button>
                                            )}

                                            <button
                                                onClick={handleSignOutCurrent}
                                                disabled={signingOutCurrent}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                                            >
                                                {signingOutCurrent ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <LogOut className="w-4 h-4" />
                                                )}
                                                Излез от това устройство
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DevicesSection;
