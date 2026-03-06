import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast/ToastProvider';
import SEO from '../components/SEO';
import { AvatarCropModal } from '../components/AvatarCropModal';
import { validatePassword, translateAuthError } from '../lib/passwordUtils';
import { isValidBulgarianPhone } from '../lib/utils';
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter';
import {
    User, Camera, LogOut, Settings, ShoppingBag,
    ChevronRight, Save, Loader2, Lock,
    Mail, Calendar, Shield, Edit3,
    MapPin, Phone, Info, Hash, MoreHorizontal, 
    ArrowRight, Clock, Receipt, RefreshCw, 
    Tag, ChevronDown, Check, CreditCard, 
    ExternalLink, Trash2, ArrowLeft, Eye, 
    EyeOff, X, AlertTriangle, AlertCircle, KeyRound, 
    PackageOpen, CheckCircle2, Truck, Megaphone, ClipboardCheck
} from 'lucide-react';

// ─── Типове ─────────────────────────────────────────────────────────────────
type ProfileTab = 'orders' | 'settings';

// ─── Custom Confirm Dialog ──────────────────────────────────────────────────
interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, title, message, confirmLabel = 'Потвърди', cancelLabel = 'Отказ', onConfirm, onCancel, isDanger = false
}) => {
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
                        className="bg-[#111] border border-white/10 w-full max-w-sm overflow-hidden shadow-2xl"
                    >
                        <div className={`h-1 w-full ${isDanger ? 'bg-red-600' : 'bg-white/20'}`} />
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                {isDanger ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <AlertCircle className="w-5 h-5 text-white/40" />}
                                <h3 className="text-sm uppercase tracking-widest text-white font-bold">{title}</h3>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                                {message}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3 border border-white/10 text-zinc-500 text-[10px] uppercase font-bold tracking-widest hover:text-white hover:bg-white/5 transition-all"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 py-3 font-bold text-[10px] uppercase tracking-widest transition-all ${
                                        isDanger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-black hover:bg-zinc-200'
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
                                            {order.id.slice(0, 8).toUpperCase()}
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
    handleDeleteAccount: () => Promise<void>;
}> = ({ profile, user, onAvatarClick, onSignOut, handleDeleteAccount }) => {
    const { refreshProfile } = useAuth();
    const { showToast } = useToast();

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [saving, setSaving] = useState(false);
    const [nameEditing, setNameEditing] = useState(false);

    const [userPhone, setUserPhone] = useState(profile?.phone || user?.user_metadata?.phone || '');
    const [phoneSaving, setPhoneSaving] = useState(false);
    const [phoneEditing, setPhoneEditing] = useState(false);

    const [showPwdForm, setShowPwdForm] = useState(false);
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [pwdSaving, setPwdSaving] = useState(false);
    const [showDangerZone, setShowDangerZone] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Check if the user has a password set (usually means email provider)
    const isPasswordUser = user?.identities?.some((id: any) => id.provider === 'email');

    useEffect(() => {
        setFullName(profile?.full_name || '');
        setUserPhone(profile?.phone || user?.user_metadata?.phone || '');
    }, [profile, user]);

    const saveProfile = async () => {
        if (!fullName.trim()) return;
        setSaving(true);
        try {
            await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
                .eq('id', user.id);
            if (error) throw error;
            await refreshProfile();
            setNameEditing(false);
            showToast('Профилът е обновен!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Грешка при запазване.', 'error');
        } finally {
            setSaving(false);
        }
    };



    const normalizePhone = (num: string) => {
        let clean = num.replace(/[\s-]/g, '');
        if (clean.startsWith('00')) clean = '+' + clean.substring(2);
        if (clean.startsWith('0')) clean = '+359' + clean.substring(1);
        if (!clean.startsWith('+')) clean = '+359' + clean;
        return clean;
    };

    const savePhone = async () => {
        if (!userPhone.trim()) return;

        if (!isValidBulgarianPhone(userPhone)) {
            showToast('Невалиден телефон! Въведете коректен български мобилен номер.', 'error');
            return;
        }

        setPhoneSaving(true);
        try {
            const normalizedPhone = normalizePhone(userPhone);

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
            
            await refreshProfile();
            setPhoneEditing(false);
            showToast('Телефонният номер е обновен!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Грешка при запазване на телефон.', 'error');
        } finally {
            setPhoneSaving(false);
        }
    };

    const changePassword = async () => {
        if (isPasswordUser && !oldPwd) {
            showToast('Моля, въведете старата си парола.', 'error');
            return;
        }
        if (!newPwd || newPwd !== confirmPwd) {
            showToast('Паролите не съвпадат.', 'error');
            return;
        }
        const pwdValidation = validatePassword(newPwd);
        if (!pwdValidation.isValid) {
            showToast('Паролата не отговаря на изискванията. Минимум 10 символа с главна буква, малка буква, цифра и специален символ.', 'error');
            return;
        }

        setPwdSaving(true);
        try {
            // Security: Re-authenticate with old password before allowing change
            if (isPasswordUser) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: oldPwd,
                });
                if (signInError) {
                    showToast('Старата парола е грешна!', 'error');
                    setPwdSaving(false);
                    return;
                }
            }

            // Now safe to update password
            const { error } = await supabase.auth.updateUser({ password: newPwd });
            if (error) throw error;
            
            showToast(isPasswordUser ? 'Паролата е сменена успешно!' : 'Паролата е създадена успешно!', 'success');
            setShowPwdForm(false);
            setOldPwd('');
            setNewPwd('');
            setConfirmPwd('');
        } catch (e: any) {
            showToast(translateAuthError(e), 'error');
        } finally {
            setPwdSaving(false);
        }
    };

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
                        <p className={labelSubCls}>Препоръчително 400x400px</p>
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
                        <p className={labelTitleCls}>Пълно Име</p>
                        <p className={labelSubCls}>Името, видимо в поръчките ви</p>
                    </div>
                    <div className="md:w-2/3">
                        {nameEditing ? (
                            <div className="flex gap-2 w-full md:max-w-md ml-auto">
                                <input
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
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
                                    type="tel"
                                    value={userPhone}
                                    onChange={e => setUserPhone(e.target.value)}
                                    className={`${inputCls} flex-1`}
                                    placeholder="Вашият телефон"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') savePhone();
                                        if (e.key === 'Escape') { setPhoneEditing(false); setUserPhone(profile?.phone || user?.user_metadata?.phone || ''); }
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
                            <span className="ml-auto text-[9px] text-emerald-400 font-bold uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded shadow-inner">
                                Потвърден
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className={cardWrapCls}>
                
                {/* Password Accordion */}
                <div className="border-b border-white/5">
                    <button
                        onClick={() => {
                            const nextState = !showPwdForm;
                            setShowPwdForm(nextState);
                            if (nextState) setShowDangerZone(false);
                        }}
                        className="w-full flex items-center justify-between text-left p-6 md:px-8 group/btn hover:bg-white/[0.02] transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover/btn:text-white group-hover/btn:bg-white/10 transition-all border border-white/5 group-hover/btn:border-white/10">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-base font-bold text-white group-hover/btn:text-red-400 transition-colors block">
                                    {isPasswordUser ? 'Смяна на парола' : 'Създаване на парола'}
                                </span>
                                <span className={labelSubCls}>Управление на сигурността</span>
                            </div>
                        </div>
                        <ChevronRight
                            className={`w-5 h-5 text-zinc-600 transition-transform group-hover/btn:text-white ${showPwdForm ? 'rotate-90' : ''}`}
                        />
                    </button>

                    <AnimatePresence>
                        {showPwdForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden bg-black/40"
                            >
                                <div className="p-6 md:px-8 space-y-4 max-w-xl mx-auto border-t border-white/5">
                                    {isPasswordUser && (
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Стара Парола</label>
                                            <div className="relative">
                                                <input
                                                    type={showOld ? 'text' : 'password'}
                                                    value={oldPwd}
                                                    onChange={e => setOldPwd(e.target.value)}
                                                    className={`${inputCls} pr-11`}
                                                    placeholder="Въведете текущата си парола"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOld(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-2"
                                                >
                                                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">{isPasswordUser ? 'Нова Парола' : 'Парола'}</label>
                                        <div className="relative">
                                            <input
                                                type={showNew ? 'text' : 'password'}
                                                value={newPwd}
                                                onChange={e => setNewPwd(e.target.value)}
                                                className={`${inputCls} pr-11`}
                                                placeholder="Минимум 10 символа"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNew(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-2"
                                            >
                                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <AnimatePresence>
                                            {newPwd && (
                                                <PasswordStrengthMeter
                                                    password={newPwd}
                                                    confirmPassword={confirmPwd || undefined}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Потвърди Новата Парола</label>
                                        <input
                                            type="password"
                                            value={confirmPwd}
                                            onChange={e => setConfirmPwd(e.target.value)}
                                            className={inputCls}
                                            placeholder="Повтори новата парола"
                                        />
                                    </div>

                                    {newPwd && confirmPwd && newPwd !== confirmPwd && (
                                        <p className="text-red-400 text-xs flex items-center gap-1.5 pt-1">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Паролите не съвпадат
                                        </p>
                                    )}

                                    <div className="pt-2">
                                        <button
                                            onClick={changePassword}
                                            disabled={pwdSaving || !newPwd || !confirmPwd || newPwd !== confirmPwd || !validatePassword(newPwd).isValid || (isPasswordUser && !oldPwd)}
                                            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-[13px] uppercase tracking-widest hover:from-red-500 hover:to-red-700 rounded-xl transition-all shadow-lg shadow-red-900/20 disabled:opacity-40 flex items-center justify-center gap-2"
                                        >
                                            {pwdSaving
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Lock className="w-4 h-4" />}
                                            {pwdSaving ? 'Запазване...' : (isPasswordUser ? 'Запази Новата Парола' : 'Създай Парола')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Danger Zone Accordion */}
                <div>
                    <button
                        onClick={() => {
                            const nextState = !showDangerZone;
                            setShowDangerZone(nextState);
                            if (nextState) setShowPwdForm(false);
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
                        message="Сигурен ли си, че искаш да изтриеш своя акаунт? Акаунтът ти ще бъде насрочен за изтриване след 7 дни. През този 7-дневен период можеш да го възстановиш по всяко време, просто като влезеш отново в сайта ни! Ако изминат 7 дни без да се логнеш, действието става НАПЪЛНО НЕОБРАТИМО и всички твои данни ще бъдат безвъзвратно изтрити."
                        confirmLabel="Да, изтрий акаунта"
                        isDanger={true}
                        onConfirm={() => {
                            setDeleteModalOpen(false);
                            handleDeleteAccount();
                        }}
                        onCancel={() => setDeleteModalOpen(false)}
                    />
                </div>
            </div>

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


// ... inside ProfilePage component ...

// ─── Главна страница ─────────────────────────────────────────────────────────
const ProfilePage: React.FC = () => {
    const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<ProfileTab>('orders');
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [avatarLoading, setAvatarLoading] = useState(false);

    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleDeleteAccount = async () => {
        if (!user) return;
        setDeleting(true);
        try {
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
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <SEO title="Профил" />
            
            {/* ──── Hero Header ──── */}
            <div className="relative bg-gradient-to-b from-zinc-950 to-[#0a0a0a] border-b border-white/5 overflow-hidden">
                {/* Grid bg */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)',
                    }}
                />
                {/* Red glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-32 bg-red-600/8 blur-3xl pointer-events-none" />

                <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                        {/* Avatar */}
                        <div className="relative group flex-shrink-0">
                            <div className="w-28 h-28 rounded-full overflow-hidden bg-zinc-900 border-2 border-white/10 shadow-2xl">
                                {avatarLoading ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                                    </div>
                                ) : (profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                                    <img
                                        src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                                        alt="avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-full h-full p-7 text-zinc-700" />
                                )}
                            </div>
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                title="Промени снимката"
                            >
                                <Camera className="w-3.5 h-3.5 text-white" />
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarFile}
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h1 className="text-2xl font-black tracking-tight text-white">
                                    {profile?.full_name || user.email?.split('@')[0] || 'Потребител'}
                                </h1>
                                <span
                                    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 border rounded-full w-fit mx-auto sm:mx-0 ${roleColor}`}
                                >
                                    <Shield className="w-2.5 h-2.5" />
                                    {roleLabel}
                                </span>
                            </div>
                            <p className="text-zinc-500 text-sm flex items-center gap-2 justify-center sm:justify-start">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="select-none pointer-events-none">{user.email}</span>
                            </p>
                            <p className="text-zinc-700 text-xs flex items-center gap-2 mt-1 justify-center sm:justify-start">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                Член от {memberSince}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ──── Tabs ──── */}
            <div className="max-w-3xl mx-auto px-6">
                <div className="flex border-b border-white/5">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-red-600 text-white'
                                    : 'border-transparent text-zinc-600 hover:text-zinc-400'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ──── Content ──── */}
                <div className="py-6 pb-20">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeTab === 'orders' && <OrdersTab orders={orders} loading={ordersLoading} user={user} />}
                            {activeTab === 'settings' && (
                                <SettingsTab
                                    profile={profile}
                                    user={user}
                                    onAvatarClick={() => avatarInputRef.current?.click()}
                                    onSignOut={handleSignOut}
                                    handleDeleteAccount={handleDeleteAccount}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

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
