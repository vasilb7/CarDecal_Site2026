import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { logSecurityEvent, recordProfileChange } from '../lib/security';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast/ToastProvider';
import SEO from '../components/SEO';
import { AvatarCropModal } from '../components/AvatarCropModal';
import { isValidPhone as isValidBulgarianPhone, isValidFullName, formatToE164, formatPhoneNumber } from '../lib/utils';
import DevicesSection from '../components/profile/DevicesSection';
import AddressesTab from '../components/profile/AddressesTab';
import {
    User, Camera, LogOut, Settings, ShoppingBag,
    ChevronRight, Save, Loader2, Lock,
    Mail, Calendar, Shield, Edit3,
    MapPin, Phone, Info, Hash, MoreHorizontal, 
    ArrowRight, Clock, Receipt, RefreshCw, 
    Tag, ChevronDown, Check, CreditCard, 
    ExternalLink, Trash2, ArrowLeft, Eye, 
    EyeOff, X, AlertTriangle, AlertCircle, KeyRound, 
    PackageOpen, CheckCircle2, Truck, Megaphone, ClipboardCheck,
    Library, FileText, Heart, Wallet, BookOpen, Undo2, Building2
} from 'lucide-react';


// ─── Типове ─────────────────────────────────────────────────────────────────
type ProfileTab = 'dashboard' | 'orders' | 'settings' | 'addresses' | 'favorites' | 'wallet' | 'company';


// ─── Custom Confirm Dialog ──────────────────────────────────────────────────
interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: (password?: string) => void;
    onCancel: () => void;
    isDanger?: boolean;
    requiresPassword?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, title, message, confirmLabel = 'Потвърди', cancelLabel = 'Отказ', onConfirm, onCancel, isDanger = false, requiresPassword = false
}) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Reset password field when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setShowPassword(false);
        }
    }, [isOpen]);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#111] border border-white/10 w-full max-w-sm overflow-hidden shadow-2xl rounded-2xl"
                    >
                        <div className={`h-1 w-full ${isDanger ? 'bg-red-600' : 'bg-white/20'}`} />
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                {isDanger ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <AlertCircle className="w-5 h-5 text-white/40" />}
                                <h3 className="text-sm uppercase tracking-widest text-white font-black">{title}</h3>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-6 font-medium">
                                {message}
                            </p>

                            {requiresPassword && (
                                <div className="mb-8">
                                    <label className="block text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3">
                                        ВЪВЕДИ ПАРОЛА ЗА ПОТВЪРЖДЕНИЕ
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Твоята текуща парола"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500 outline-none transition-all placeholder:text-zinc-700"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3 border border-white/10 text-zinc-500 text-[10px] uppercase font-black tracking-widest hover:text-white hover:bg-white/5 transition-all rounded-xl"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={() => onConfirm(password)}
                                    disabled={requiresPassword && !password}
                                    className={`flex-1 py-3 font-black text-[10px] uppercase tracking-widest transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                                        isDanger ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20' : 'bg-white text-black hover:bg-zinc-200'
                                    }`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// ─── Таб Поръчки (Динамичен) ────────────────────────────────────────────────
const OrdersTab: React.FC<{ orders: any[]; loading: boolean; user: any }> = ({ orders, loading, user }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-4" />
                <p className="text-zinc-500 text-sm animate-pulse">Зареждане на историята...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
            >
                <div className="w-20 h-20 rounded-full bg-white/3 border border-white/8 flex items-center justify-center mb-5">
                    <PackageOpen className="w-9 h-9 text-zinc-700" />
                </div>
                <h3 className="text-white font-bold text-base uppercase tracking-widest mb-2">
                    Няма поръчки
                </h3>
                <p className="text-zinc-600 text-sm max-w-xs leading-relaxed">
                    Когато направиш поръчка, тя ще се появи тук.
                </p>
                <a
                    href="/catalog"
                    className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Разгледай Каталога
                </a>
            </motion.div>
        );
    }

    const getStatusInfo = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return { label: 'Обработва се', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Clock };
            case 'shipped':
                return { label: 'Изпратена', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Truck };
            case 'delivered':
                return { label: 'Доставена', color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: CheckCircle2 };
            case 'cancelled':
                return { label: 'Отказна', color: 'text-zinc-400 bg-white/5 border-white/10', icon: X };
            default:
                return { label: status, color: 'text-zinc-400 bg-white/5 border-white/10', icon: Receipt };
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {orders.map((order) => {
                const status = getStatusInfo(order.status);
                const dateObj = new Date(order.created_at);
                const orderDate = dateObj.toLocaleDateString('bg-BG', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                const orderTime = dateObj.toLocaleTimeString('bg-BG', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const items = Array.isArray(order.items) ? order.items : [];
                const shipping = order.shipping_details || {};
                const totalAmount = order.total_amount || 0;
                const bgnAmount = totalAmount * 1.95583;

                return (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden group hover:border-red-600/30 transition-all duration-500 flex flex-col h-full shadow-lg hover:shadow-red-600/5"
                    >
                        {/* Status Bar */}
                        <div className={`h-1 w-full ${status.color.split(' ')[1]}`} />
                        
                        <div className="p-6 flex-1 flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-3 h-3 text-zinc-600" />
                                        <h4 className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                            #{order.order_number}
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                        <p className="text-white text-xs font-bold uppercase tracking-widest">
                                            {orderDate} <span className="text-zinc-500 ml-1">{orderTime}</span>
                                        </p>
                                    </div>
                                </div>
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border ${status.color}`}>
                                    <status.icon className="w-3 h-3" />
                                    {status.label}
                                </span>
                            </div>

                            {/* Product Thumbnails Grid */}
                            <div className="flex gap-2 mb-8 overflow-hidden h-14">
                                {items.slice(0, 4).map((item: any, idx: number) => (
                                    <div key={idx} className="w-14 h-14 rounded-xl bg-black border border-white/5 overflow-hidden shrink-0">
                                        <img 
                                            src={item.image || item.product?.image_url || '/placeholder.png'} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                ))}
                                {items.length > 4 && (
                                    <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                                        +{items.length - 4}
                                    </div>
                                )}
                            </div>

                            {/* Info Footer */}
                            <div className="mt-auto pt-6 border-t border-white/5 flex items-end justify-between mb-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black">Стойност</p>
                                    <div className="flex flex-col">
                                        <p className="text-xl font-black text-white leading-none">
                                            {totalAmount.toFixed(2)} <span className="text-xs text-red-500 uppercase tracking-widest font-bold">€</span>
                                        </p>
                                        <p className="text-[10px] text-zinc-500 font-bold opacity-70 mt-1">
                                            ≈ {bgnAmount.toFixed(2)} лв.
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/account/orders/${order.id}`)}
                                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all active:scale-95"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Admin Notes */}
                            {order.admin_notes && (
                                <div className="p-4 bg-red-600/5 border border-red-600/10 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ClipboardCheck className="w-3.5 h-3.5 text-red-500" />
                                        <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">Бележка от екипа</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed italic line-clamp-2">
                                        "{order.admin_notes}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}

        </div>
    );
};

const SettingsTab: React.FC<{
    profile: any;
    user: any;
    onAvatarClick: () => void;
    onSignOut: () => void;
    handleDeleteAccount: (password?: string) => Promise<void>;
}> = ({ profile, user, onAvatarClick, onSignOut, handleDeleteAccount }) => {
    const { refreshProfile } = useAuth();
    const { showToast } = useToast();

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [saving, setSaving] = useState(false);
    const [nameEditing, setNameEditing] = useState(false);

    const [userPhone, setUserPhone] = useState(formatPhoneNumber(profile?.phone || user?.user_metadata?.phone || ''));
    const [phoneSaving, setPhoneSaving] = useState(false);
    const [phoneEditing, setPhoneEditing] = useState(false);

    const [showDangerZone, setShowDangerZone] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const phoneInputRef = useRef<HTMLInputElement>(null);

    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);

    // Check if the user has a password set (usually means email provider or has_password flag)
    const isPasswordUser = false;

    useEffect(() => {
        setFullName(profile?.full_name || '');
        setUserPhone(formatPhoneNumber(profile?.phone || user?.user_metadata?.phone || ''));
    }, [profile, user]);

    const saveProfile = async () => {
        if (!fullName.trim()) return;
        
        if (!isValidFullName(fullName)) {
            showToast('Въведете име и фамилия (3-100 символа).', 'error');
            return;
        }

        setSaving(true);
        try {
            const oldName = profile?.full_name || '';
            const newName = fullName.trim();
            const nameParts = newName.split(/\s+/);
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || firstName; // Fallback to avoid null constraint fail

            await supabase.auth.updateUser({ 
                data: { 
                    full_name: newName,
                    first_name: firstName,
                    last_name: lastName
                } 
            });

            const { error } = await supabase
                .from('profiles')
                .update({ 
                    full_name: newName, 
                    first_name: firstName,
                    last_name: lastName,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', user.id);
            if (error) throw error;

            // Track change history
            if (oldName !== newName) {
                await recordProfileChange(user.id, 'full_name', oldName, newName, 'user');
            }

            await refreshProfile();
            setNameEditing(false);
            showToast('Профилът е обновен!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Грешка при запазване.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const savePhone = async () => {
        if (!userPhone.trim()) return;

        if (!isValidBulgarianPhone(userPhone)) {
            showToast("Невалиден телефон! (8-15 цифри)", "error");
            return;
        }

        setPhoneSaving(true);
        try {
            const oldPhone = profile?.phone || '';
            const normalizedPhone = formatToE164(userPhone);

            // Update profile first for uniqueness check
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ phone: normalizedPhone, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (profileError) {
                if (profileError.code === '23505') {
                    throw new Error('Този номер вече е свързан с друг профил.');
                }
                throw profileError;
            }

            // Sync with Auth
            await supabase.auth.updateUser({ data: { phone: normalizedPhone } });
            
            // Track change history
            if (oldPhone !== normalizedPhone) {
                await recordProfileChange(user.id, 'phone', oldPhone, normalizedPhone, 'user');
            }

            await refreshProfile();
            setPhoneEditing(false);
            showToast('Телефонният номер е обновен!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Грешка при запазване на телефон.', 'error');
        } finally {
            setPhoneSaving(false);
        }
    };

    const changePassword = async () => {}; // No longer used

    const inputCls =
        'w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-red-600/60 transition-colors shadow-inner placeholder-zinc-600';
    const labelTitleCls = 'text-sm font-bold text-white';
    const labelSubCls = 'text-xs text-zinc-500 mt-1';
    const rowCls = 'flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:px-8 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors';
    const cardWrapCls = 'bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl';

    return (
        <div className="space-y-6">
            {/* Admin Profile/Global Note */}
            {profile?.admin_notes && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/50 border border-red-600/20 p-6 rounded-3xl flex items-start gap-4 shadow-xl"
                >
                    <div className="p-3 rounded-2xl bg-red-600/10 border border-red-600/20 shrink-0">
                        <Megaphone className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Важно съобщение за Вашия профил</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">{profile.admin_notes}</p>
                    </div>
                </motion.div>
            )}

            {/* General Settings Card */}
            <div className={cardWrapCls}>
                
                {/* Avatar */}
                <div className={rowCls}>
                    <div className="md:w-1/3">
                        <p className={labelTitleCls}>Профилна Снимка</p>
                        <p className={labelSubCls}>Препоръчително 400x400px (до 3MB)</p>
                    </div>
                    <div className="md:w-2/3 flex items-center justify-between md:justify-end gap-6">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0 shadow-inner">
                            {(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture)
                                ? <img src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt="avatar" className="w-full h-full object-cover" />
                                : <User className="w-full h-full p-4 text-zinc-700" />
                            }
                        </div>
                        <button
                            onClick={onAvatarClick}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all text-xs font-bold tracking-wide shadow-lg"
                        >
                            <Camera className="w-4 h-4 text-zinc-400" />
                            Промени
                        </button>
                    </div>
                </div>

                {/* Name */}
                <div className={rowCls}>
                    <div className="md:w-1/3">
                        <p className={labelTitleCls}>Име и Фамилия</p>
                        <p className={labelSubCls}>Името, видимо в поръчките ви</p>
                    </div>
                    <div className="md:w-2/3">
                        {nameEditing ? (
                            <div className="flex gap-2 w-full md:max-w-md ml-auto">
                                <input
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value.replace(/[0-9]/g, ''))}
                                    className={`${inputCls} flex-1`}
                                    placeholder="Вашето Име"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') saveProfile();
                                        if (e.key === 'Escape') { setNameEditing(false); setFullName(profile?.full_name || ''); }
                                    }}
                                />
                                <button
                                    onClick={saveProfile}
                                    disabled={saving}
                                    className="px-5 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-red-900/40"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => { setNameEditing(false); setFullName(profile?.full_name || ''); }}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-4 w-full md:max-w-md ml-auto bg-white/5 px-5 py-3.5 rounded-xl border border-white/5">
                                <span className="text-white text-sm font-medium">
                                    {fullName || <span className="text-zinc-600 italic font-normal">Не е зададено</span>}
                                </span>
                                <button
                                    onClick={() => setNameEditing(true)}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Phone */}
                <div className={rowCls}>
                    <div className="md:w-1/3">
                        <p className={labelTitleCls}>Телефонен Номер</p>
                        <p className={labelSubCls}>За контакт при доставка</p>
                    </div>
                    <div className="md:w-2/3">
                        {phoneEditing ? (
                            <div className="flex gap-2 w-full md:max-w-md ml-auto">
                                <input
                                    ref={phoneInputRef}
                                    type="tel"
                                    value={userPhone}
                                    onFocus={(e: any) => {
                                        const val = e.target.value;
                                        setTimeout(() => e.target.setSelectionRange(val.length, val.length), 0);
                                    }}
                                    onSelect={(e: any) => {
                                        const start = e.target.selectionStart;
                                        if (start !== null && start < 5) {
                                            e.target.setSelectionRange(5, Math.max(5, e.target.selectionEnd || 5));
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.target instanceof HTMLInputElement && e.target.selectionStart !== null && e.target.selectionStart <= 5 && (e.key === 'Backspace' || e.key === 'ArrowLeft' || e.key === 'Home')) {
                                            e.preventDefault();
                                            return;
                                        }
                                        if (e.key === 'Enter') savePhone();
                                        if (e.key === 'Escape') { setPhoneEditing(false); setUserPhone(formatPhoneNumber(profile?.phone || user?.user_metadata?.phone || '')); }
                                    }}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const formatted = formatPhoneNumber(val);
                                        setUserPhone(formatted);
                                    }}
                                    className={`${inputCls} flex-1`}
                                    placeholder="+359 88 888 8888"
                                    autoFocus
                                    onClick={(e: any) => {
                                        if (e.target.selectionStart < 5) {
                                            e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                                        }
                                    }}
                                />
                                <button
                                    onClick={savePhone}
                                    disabled={phoneSaving}
                                    className="px-5 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-red-900/40"
                                >
                                    {phoneSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => { setPhoneEditing(false); setUserPhone(profile?.phone || user?.user_metadata?.phone || ''); }}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-4 w-full md:max-w-md ml-auto bg-white/5 px-5 py-3.5 rounded-xl border border-white/5">
                                <span className="text-white text-sm font-medium">
                                    {userPhone || <span className="text-zinc-600 italic font-normal">Не е зададено</span>}
                                </span>
                                <button
                                    onClick={() => setPhoneEditing(true)}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email (readonly) */}
                <div className={rowCls}>
                    <div className="md:w-1/3">
                        <p className={labelTitleCls}>Имейл Адрес</p>
                        <p className={labelSubCls}>Свързан с акаунта ви</p>
                    </div>
                    <div className="md:w-2/3 flex items-center justify-end">
                        <div className="flex items-center gap-3 bg-white/5 px-5 py-3.5 rounded-xl border border-white/5 w-full md:max-w-md">
                            <Mail className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                            <span className="text-zinc-300 text-sm pointer-events-none truncate">{user?.email}</span>
                            {user?.email_confirmed_at ? (
                                <span className="ml-auto text-[9px] text-emerald-400 font-bold uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded shadow-inner whitespace-nowrap">
                                    Потвърден
                                </span>
                            ) : (
                                <span className="ml-auto text-[9px] text-amber-500 font-bold uppercase tracking-widest border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded shadow-inner whitespace-nowrap">
                                    Очаква потвърждение
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className={cardWrapCls}>
                
                {/* Danger Zone Accordion */}
                <div>
                    <button
                        onClick={() => {
                            const nextState = !showDangerZone;
                            setShowDangerZone(nextState);
                        }}
                        className="w-full flex items-center justify-between text-left p-6 md:px-8 group/btn hover:bg-red-950/10 transition-colors"
                    >
                        <div className="flex items-center gap-4 text-red-500">
                            <div className="w-10 h-10 rounded-xl bg-red-950/30 flex items-center justify-center text-red-500 group-hover/btn:bg-red-900/40 transition-all border border-red-900/30 group-hover/btn:border-red-500/30">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-base font-bold uppercase tracking-wider group-hover/btn:text-red-400 transition-colors block">Опасна зона</span>
                                <span className="text-xs text-red-900/80 mt-1 uppercase font-bold tracking-widest">Изтриване на акаунта</span>
                            </div>
                        </div>
                        <ChevronRight
                            className={`w-5 h-5 text-red-900/50 transition-transform group-hover/btn:text-red-500/80 ${showDangerZone ? 'rotate-90' : ''}`}
                        />
                    </button>

                    <AnimatePresence>
                        {showDangerZone && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden bg-black/40 lg:bg-transparent"
                            >
                                <div className="p-6 md:px-8 border-t border-white/5 flex flex-col items-center">
                                    <div className="max-w-2xl w-full">
                                        <p className="text-zinc-500 text-sm leading-relaxed font-medium bg-red-950/10 p-5 border border-red-900/20 rounded-xl mb-6">
                                            ВНИМАНИЕ: Това действие ще премахне твоите лични данни и ще деактивира профила ти. 
                                            Според нашите общи условия, данните за твоите поръчки ще бъдат запазени в архива за легални цели за определен период.
                                        </p>
                                        <button
                                            onClick={() => setDeleteModalOpen(true)}
                                            className="w-full py-4 bg-red-950/20 border border-red-900/40 text-red-500 hover:bg-red-600 hover:text-white text-[13px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-900/30 group/del"
                                        >
                                            <Trash2 className="w-4 h-4 group-hover/del:animate-bounce" />
                                            Изтрий акаунта ми
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ConfirmDialog
                        isOpen={deleteModalOpen}
                        title="ПОТВЪРДИ ИЗТРИВАНЕТО"
                        message="Сигурен ли си, че искаш да изтриеш своя акаунт? Акаунтът ти ще бъде насрочен за изтриване след 7 дни. През този 7-дневен период можеш да го възстановиш по всяко време, просто като влезеш отново в сайта ни чрез Google! Ако изминат 7 дни без да се логнеш, действието става НАПЪЛНО НЕОБРАТИМО и всички твои данни ще бъдат безвъзвратно изтрити."
                        confirmLabel="Да, изтрий акаунта"
                        isDanger={true}
                        requiresPassword={false}
                        onConfirm={() => {
                            setDeleteModalOpen(false);
                            handleDeleteAccount();
                        }}
                        onCancel={() => setDeleteModalOpen(false)}
                    />


                </div>
            </div>

            {/* Devices Section */}
            <DevicesSection />

            {/* Sign out */}
            <div className="pt-4 flex justify-end">
                <button
                    onClick={onSignOut}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20 text-xs font-bold uppercase tracking-widest transition-all rounded-2xl w-full md:w-auto"
                >
                    <LogOut className="w-4 h-4" />
                    Изход от профила
                </button>
            </div>
        </div>
    );
};


// ─── Таб Данни на Фирма ──────────────────────────────────────────────────
const CompanyTab: React.FC<{ profile: any }> = ({ profile }) => {
    const { refreshProfile } = useAuth();
    const { showToast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    
    const [form, setForm] = useState({
        company_name: profile?.company_name || '',
        bulstat: profile?.bulstat || '',
        vat_registered: profile?.vat_registered || false,
        vat_number: profile?.vat_number || '',
        company_address: profile?.company_address || '',
        company_person: profile?.company_person || ''
    });

    useEffect(() => {
        if (profile) {
            setForm({
                company_name: profile.company_name || '',
                bulstat: profile.bulstat || '',
                vat_registered: profile.vat_registered || false,
                vat_number: profile.vat_number || '',
                company_address: profile.company_address || '',
                company_person: profile.company_person || ''
            });
        }
    }, [profile]);

    const handleSave = async () => {
        if (!form.company_name || !form.bulstat || !form.company_address || !form.company_person) {
            showToast('Моля, попълнете всички задължителни полета.', 'error');
            return;
        }

        setLoading(true);
        try {
            const nameParts = (profile?.full_name || '').trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const { error } = await supabase
                .from('profiles')
                .update({
                    company_name: form.company_name,
                    bulstat: form.bulstat,
                    vat_registered: form.vat_registered,
                    vat_number: form.vat_number,
                    company_address: form.company_address,
                    company_person: form.company_person,
                    is_company: true,
                    first_name: firstName || undefined,
                    last_name: lastName || undefined,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id);

            if (error) throw error;

            // Sync with Auth metadata
            await supabase.auth.updateUser({
                data: {
                    is_company: true,
                    company_name: form.company_name,
                    bulstat: form.bulstat,
                    company_address: form.company_address,
                    company_person: form.company_person,
                    vat_registered: form.vat_registered,
                    vat_number: form.vat_number,
                    first_name: firstName,
                    last_name: lastName,
                    onboarding_completed: true
                }
            });

            await refreshProfile();
            setEditing(false);
            showToast('Данните на фирмата бяха обновени успешно!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Грешка при запис.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-3 rounded-xl focus:border-red-600 outline-none transition-all';
    const labelCls = 'block text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2';

    if (!editing) {
        return (
            <div className="space-y-6">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div>
                            <h3 className="text-white font-bold text-lg uppercase tracking-widest">Данни на фирмата</h3>
                            <p className="text-zinc-500 text-xs mt-1">Информация за фактуриране</p>
                        </div>
                        <button 
                            onClick={() => setEditing(true)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <Edit3 size={14} />
                            Редактирай
                        </button>
                    </div>
                    
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className={labelCls}>Наименование</p>
                            <p className="text-white text-base font-medium">{form.company_name}</p>
                        </div>
                        <div>
                            <p className={labelCls}>ЕИК / Булстат</p>
                            <p className="text-white text-base font-medium font-mono tracking-wider">{form.bulstat}</p>
                        </div>
                        <div>
                            <p className={labelCls}>ДДС Номер</p>
                            <p className="text-white text-base font-medium font-mono tracking-wider">
                                {form.vat_registered ? form.vat_number : 'Не е регистрирана по ДДС'}
                            </p>
                        </div>
                        <div>
                            <p className={labelCls}>МОЛ</p>
                            <p className="text-white text-base font-medium">{form.company_person}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className={labelCls}>Адрес на регистрация</p>
                            <p className="text-white text-base font-medium leading-relaxed">{form.company_address}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-xl">Редактиране на данни</h3>
                        <p className="text-zinc-500 text-sm">Всички полета са задължителни</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelCls}>Наименование на фирмата</label>
                        <input 
                            className={inputCls} 
                            value={form.company_name} 
                            onChange={e => setForm({...form, company_name: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className={labelCls}>ЕИК / Булстат</label>
                        <input 
                            className={inputCls} 
                            value={form.bulstat} 
                            onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
                                setForm({...form, bulstat: val});
                            }} 
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={labelCls + " mb-0"}>ДДС Номер</label>
                            <button 
                                onClick={() => {
                                    const next = !form.vat_registered;
                                    setForm({
                                        ...form, 
                                        vat_registered: next,
                                        vat_number: next ? form.vat_number : ''
                                    });
                                }}
                                className={`text-[10px] font-black uppercase px-2 py-1 rounded transition-colors ${form.vat_registered ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                            >
                                {form.vat_registered ? 'Регистрирана' : 'Не е регистрирана'}
                            </button>
                        </div>
                        <input 
                            className={inputCls} 
                            value={form.vat_number} 
                            disabled={!form.vat_registered}
                            onChange={e => setForm({...form, vat_number: e.target.value.toUpperCase()})}
                            placeholder={form.vat_registered ? "BG..." : "Няма ДДС"}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>МОЛ</label>
                        <input 
                            className={inputCls} 
                            value={form.company_person} 
                            onChange={e => setForm({...form, company_person: e.target.value})} 
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelCls}>Адрес на регистрация</label>
                        <textarea 
                            className={inputCls + " min-h-[100px] resize-none"} 
                            value={form.company_address} 
                            onChange={e => setForm({...form, company_address: e.target.value})} 
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-10">
                    <button 
                        onClick={() => setEditing(false)}
                        className="flex-1 py-4 bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 rounded-2xl transition-all"
                    >
                        Отказ
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 py-4 bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Запази промените
                    </button>
                </div>
            </div>
        </div>
    );
};


const DashboardGrid: React.FC<{
    profile: any;
    user: any;
    onSelect: (tab: ProfileTab) => void;
    onSignOut: () => void;
}> = ({ profile, user, onSelect, onSignOut }) => {
    const cards = [
        { id: 'settings', label: 'Настройки', icon: Settings },
        { id: 'addresses', label: 'Моите адреси', icon: MapPin },
        { id: 'orders', label: 'Моите поръчки', icon: ShoppingBag },
        { id: 'company', label: 'Данни на фирма', icon: Building2 },
        { id: 'favorites', label: 'Любими продукти', icon: Heart },
        { id: 'wallet', label: 'Портфейл', icon: Wallet },
        { id: 'logout', label: 'Изход', icon: LogOut, action: onSignOut },
    ];


    const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Васил';
    const fullName = profile?.full_name || user?.email?.split('@')[0] || 'Васил Бенков';

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
            <div className="mb-10 sm:mb-16 flex flex-col items-center sm:items-start text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-3">Моят профил</h1>
                <p className="text-zinc-500 text-base sm:text-lg">Здравей, {fullName} !</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {cards.map((card) => (
                    <button
                        key={card.id}
                        onClick={() => card.action ? card.action() : onSelect(card.id as ProfileTab)}
                        className="flex items-center justify-between p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:border-zinc-200 dark:hover:border-white/10 transition-all group text-left h-24 sm:h-32"
                    >
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:text-red-600 transition-colors">
                                <card.icon className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.2} />
                            </div>
                            <span className="text-zinc-900 dark:text-white font-bold text-sm sm:text-lg tracking-tight">{card.label}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                ))}
            </div>
        </div>
    );
};


// ─── Главна страница ─────────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
    const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<ProfileTab>('dashboard');
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [avatarLoading, setAvatarLoading] = useState(false);

    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleDeleteAccount = async (password?: string) => {
        if (!user || !user.email) return;
        setDeleting(true);
        try {
            // Verify password if provided (for email auth)
            if (password) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: password,
                });

                if (signInError) {
                    throw new Error('Неправилна парола. Моля, опитайте отново за да потвърдите изтриването.');
                }
            }

            const { error } = await supabase.rpc('schedule_account_deletion', { reason: 'Потребителят пожела изтриване на акаунта (Профил)' });

            if (error) {
                throw new Error(error.message || 'Грешка при насрочване за изтриване на акаунта.');
            }

            showToast('Акаунтът е насрочен за изтриване. Имаш 7 дни за възстановяване чрез повторен вход.', 'success');
            
            // Wait for toast and then sign out locally
            setTimeout(async () => {
                await signOut();
                navigate('/');
            }, 3000);

        } catch (e: any) {
            showToast(e.message || 'Възникна грешка.', 'error');
            setDeleting(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) navigate('/');
        
        if (user) {
            fetchOrders();
        }
    }, [user, authLoading, navigate]);

    const fetchOrders = async () => {
        if (!user) return;
        setOrdersLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select("*")
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (e: any) {
            console.error("Error fetching orders:", e);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // 3MB limit
        if (file.size > 3 * 1024 * 1024) {
            showToast('Снимката е твърде голяма! Максималният размер е 3MB.', 'error');
            if (avatarInputRef.current) avatarInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = ev => {
            if (ev.target?.result) {
                setImageToCrop(ev.target.result as string);
                setCropModalOpen(true);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedUrl: string) => {
        try {
            setAvatarLoading(true);
            const res = await fetch(croppedUrl);
            const blob = await res.blob();
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            const folderName = user?.email || user?.id || 'unknown';
            const displayName = profile?.full_name || user?.email?.split('@')[0] || 'avatar';
            
            // Supabase storage needs ASCII keys, so let's map bg to english letters
            const bgToLatin = (str: string) => {
                const map: Record<string, string> = {
                    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ж':'Zh','З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'H','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sht','Ъ':'A','Ь':'Y','Ю':'Yu','Я':'Ya',
                    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'y','ю':'yu','я':'ya'
                };
                return str.split('').map(c => map[c] || c).join('');
            };

            // Safe filename avoiding non-latin chars
            const safeName = bgToLatin(displayName).replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_');
            const fileName = `${folderName}/${safeName}.jpg`;

            // Optional: Cleanup old avatars in this user's folder
            const { data: existingFiles } = await supabase.storage.from('avatars').list(folderName);
            if (existingFiles && existingFiles.length > 0) {
                const toDel = existingFiles.map(f => `${folderName}/${f.name}`);
                await supabase.storage.from('avatars').remove(toDel);
            }

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            const { error: updateError } = await supabase.from('profiles')
                .update({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
                .eq('id', user?.id);
            if (updateError) throw updateError;

            await refreshProfile();
            showToast('Профилната снимка е обновена!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Грешка при качване.', 'error');
        } finally {
            setAvatarLoading(false);
            setCropModalOpen(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const memberSince = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' })
        : '—';

    const roleLabel =
        profile?.role === 'admin' ? 'Администратор'
        : profile?.role === 'editor' ? 'Редактор'
        : 'Клиент';

    const roleColor =
        profile?.role === 'admin'
            ? 'text-red-400 bg-red-600/15 border-red-600/30'
            : profile?.role === 'editor'
            ? 'text-yellow-400 bg-yellow-600/15 border-yellow-600/30'
            : 'text-zinc-400 bg-white/5 border-white/10';

    const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
        { id: 'orders',   label: 'Поръчки',   icon: ShoppingBag },
        { id: 'settings', label: 'Настройки', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* ──── Header Mobile ──── */}
            {activeTab !== 'dashboard' && (
                <div className="bg-white border-b border-zinc-100 flex items-center px-4 h-16 sm:hidden sticky top-0 z-50">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="flex-1 text-center font-bold text-zinc-900 mr-10">
                        {activeTab === 'orders' ? 'Моите поръчки' : 
                         activeTab === 'addresses' ? 'Моите адреси' :
                         activeTab === 'company' ? 'Данни на фирма' :
                         activeTab === 'settings' ? 'Настройки' : 'Профил'}
                    </h2>

                </div>
            )}

            {/* ──── Desktop Header (Compact when NOT in dashboard) ──── */}
            {activeTab !== 'dashboard' && (
                <div className="hidden sm:block bg-zinc-950 border-b border-white/5 py-4">
                    <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                        <button 
                            onClick={() => setActiveTab('dashboard')}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft size={16} />
                            Назад
                        </button>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                             {activeTab === 'orders' ? 'Моите поръчки' : 
                              activeTab === 'addresses' ? 'Моите адреси' :
                              activeTab === 'company' ? 'Данни на фирма' :
                              activeTab === 'settings' ? 'Настройки' : 'Раздел'}
                        </h2>

                        <div className="w-20" /> {/* Spacer */}
                    </div>
                </div>
            )}

            {/* ──── Dynamic Content ──── */}
            <main className={`${activeTab === 'dashboard' ? 'bg-[#fcfcfc] dark:bg-zinc-950 min-h-screen' : 'bg-[#0a0a0a] min-h-screen py-8'}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'dashboard' && (
                            <DashboardGrid 
                                profile={profile} 
                                user={user} 
                                onSelect={setActiveTab} 
                                onSignOut={handleSignOut} 
                            />
                        )}
                        
                        {(activeTab === 'orders' || activeTab === 'settings' || activeTab === 'addresses' || activeTab === 'company') && (
                            <div className="max-w-4xl mx-auto px-6">
                                {activeTab === 'orders' && <OrdersTab orders={orders} loading={ordersLoading} user={user} />}
                                {activeTab === 'company' && <CompanyTab profile={profile} />}

                                {activeTab === 'settings' && (
                                    <SettingsTab
                                        profile={profile}
                                        user={user}
                                        onAvatarClick={() => avatarInputRef.current?.click()}
                                        onSignOut={handleSignOut}
                                        handleDeleteAccount={handleDeleteAccount}
                                    />
                                )}
                                {activeTab === 'addresses' && (
                                    <AddressesTab />
                                )}
                            </div>
                        )}

                        {!['dashboard', 'orders', 'settings', 'addresses', 'company'].includes(activeTab) && (

                            <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                                <div className="w-24 h-24 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-700">
                                    <Info className="w-12 h-12" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Този раздел е в разработка</h3>
                                <p className="text-zinc-500 max-w-sm mx-auto">Работим по добавянето на тази функционалност. Очаквайте я скоро!</p>
                                <button 
                                    onClick={() => setActiveTab('dashboard')}
                                    className="mt-8 px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200"
                                >
                                    Обратно към профила
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Avatar Crop Modal */}
            {cropModalOpen && imageToCrop && (
                <AvatarCropModal
                    isOpen={cropModalOpen}
                    imageUrl={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onClose={() => {
                        setCropModalOpen(false);
                        if (avatarInputRef.current) avatarInputRef.current.value = '';
                    }}
                />
            )}
        </div>
    );
};

export default ProfilePage;
