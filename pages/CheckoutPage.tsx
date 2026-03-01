import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, ShieldCheck, Truck, CreditCard, 
    ChevronRight, MapPin, Phone, User, Mail, 
    CheckCircle2, AlertCircle, Loader2, Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast/ToastProvider';

const CheckoutPage: React.FC = () => {
    const { activeItems, subtotal, total, discountPercentage, clearCart, isFreeShipping, amountToFreeShipping } = useCart();
    const { user, profile } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Info, 2: Review, 3: Success

    // Authentication Guard
    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: '/checkout' } });
        }
    }, [user, navigate]);

    // Form State
    const [formData, setFormData] = useState({
        fullName: profile?.full_name || profile?.last_full_name || '',
        email: user?.email || '',
        phone: profile?.phone || profile?.preferred_phone || '',
        city: profile?.preferred_city || '',
        deliveryType: (profile?.preferred_delivery_type as 'econt' | 'speedy') || 'econt',
        officeName: profile?.preferred_office_name || '',
        notes: ''
    });
    const [saveForFuture, setSaveForFuture] = useState(true);

    // Update form when profile loads if it was empty
    React.useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                fullName: prev.fullName || profile.full_name || (profile as any).last_full_name || '',
                phone: prev.phone || profile.phone || (profile as any).preferred_phone || '',
                city: prev.city || (profile as any).preferred_city || '',
                deliveryType: prev.deliveryType || ((profile as any).preferred_delivery_type as any) || 'econt',
                officeName: prev.officeName || (profile as any).preferred_office_name || ''
            }));
        }
    }, [profile]);

    const totalAmount = total;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep1 = () => {
        if (!formData.fullName || formData.fullName.length < 3) {
            showToast('Моля, въведете валидно име.', 'warning');
            return false;
        }
        if (!formData.phone || formData.phone.length < 8) {
            showToast('Моля, въведете валиден телефонен номер.', 'warning');
            return false;
        }
        if (!formData.city || formData.city.length < 2) {
            showToast('Моля, въведете град.', 'warning');
            return false;
        }
        if (!formData.officeName || formData.officeName.length < 3) {
            showToast('Моля, въведете име или адрес на офиса.', 'warning');
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
            window.scrollTo(0, 0);
        }
    };

    const submitOrder = async () => {
        setLoading(true);
        try {
            // Simplified order submission logic
            // In a real app, you'd save this to a 'orders' table
            const { error } = await supabase.from('orders').insert({
                user_id: user?.id || null,
                items: activeItems,
                total_amount: totalAmount,
                shipping_details: formData,
                status: 'pending',
                payment_method: 'cash_on_delivery'
            });

            if (error) throw error;

            // Save preferences if requested
            if (user && saveForFuture) {
                await supabase.from('profiles').update({
                    preferred_city: formData.city,
                    preferred_delivery_type: formData.deliveryType,
                    preferred_office_name: formData.officeName,
                    preferred_phone: formData.phone,
                    last_full_name: formData.fullName
                }).eq('id', user.id);
            }

            showToast('Поръчката е приета успешно!', 'success');
            setStep(3);
            clearCart();
        } catch (err: any) {
            console.error('Order error:', err);
            showToast(err.message || 'Възникна грешка при изпращане на поръчката.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <div className="pt-32 pb-24 min-h-screen flex flex-col items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-lg"
                >
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Благодарим Ви!</h1>
                    <p className="text-[#B0BEC5] uppercase tracking-widest text-sm mb-8 leading-relaxed">
                        Вашата поръчка е приета успешно. Ще се свържем с Вас по телефона за потвърждение преди изпращане.
                    </p>
                    <Link 
                        to="/" 
                        className="px-8 py-4 bg-gradient-to-r from-[#3d0000] to-[#950101] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-sm transition-all hover:bg-red-600 shadow-lg shadow-red-900/20"
                    >
                        КЪМ НАЧАЛО
                    </Link>
                </motion.div>
            </div>
        );
    }

    const inputCls = "w-full bg-black/40 border border-white/10 text-white text-sm px-4 py-2.5 md:py-3 rounded-lg focus:outline-none focus:border-red-600/60 transition-colors placeholder:text-zinc-600";
    const labelCls = "block text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-bold ml-1";

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col font-sans">
            {/* Minimalist Standalone Header */}
            <header className="h-20 border-b border-white/5 bg-black/60 backdrop-blur-md flex items-center shrink-0 z-50">
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                            <span className="text-black font-black text-xl leading-none">CD</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white hidden sm:block">CarDecal</span>
                    </Link>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold">
                            <ShieldCheck className="w-4 h-4 text-green-500/50" />
                            <span className="hidden xs:block">Secure Checkout</span>
                        </div>
                        <button 
                            onClick={() => navigate('/cart')}
                            className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg transition-all border border-white/10"
                        >
                            Количка
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow py-8 md:py-16">
                <div className="container mx-auto px-4 md:px-6">
                
                {/* Header & Steps Nav */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 mb-8 md:mb-12">
                    <div className="space-y-0.5">
                        <div className="inline-flex items-center text-[#B0BEC5] text-[9px] uppercase tracking-[0.2em] gap-2 mb-1 opacity-60">
                            Стъпка {step} от 2
                        </div>
                        <h1 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">
                            Завършване на <span className="text-[#ff0000]">Поръчката</span>
                        </h1>
                    </div>
                    
                    {/* Steps Indicator */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold ${step >= 1 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>1</div>
                            <span className={`text-[9px] md:text-[10px] uppercase tracking-widest font-bold ${step >= 1 ? 'text-white' : 'text-zinc-600'}`}>Данни</span>
                        </div>
                        <div className="w-6 md:w-8 h-[1px] bg-zinc-800" />
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold ${step >= 2 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>2</div>
                            <span className={`text-[9px] md:text-[10px] uppercase tracking-widest font-bold ${step >= 2 ? 'text-white' : 'text-zinc-600'}`}>Преглед</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-7 space-y-6">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div 
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-4 md:space-y-6"
                                >
                                    {/* Personal Info */}
                                    <section className="bg-[#101010] border border-white/5 rounded-2xl p-4 md:p-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <User className="w-4 h-4 text-red-500" />
                                            <h2 className="text-xs uppercase tracking-widest text-white font-black">Лична Информация</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className={labelCls}>Име и Фамилия *</label>
                                                <input 
                                                    type="text" 
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    className={inputCls} 
                                                    placeholder="Иван Иванов"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Email Адрес</label>
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className={inputCls} 
                                                    placeholder="ivan@example.com"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Телефонен Номер *</label>
                                                <input 
                                                    type="tel" 
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className={inputCls} 
                                                    placeholder="08XXXXXXXX"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Shipping Info */}
                                    <section className="bg-[#101010] border border-white/5 rounded-2xl p-4 md:p-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Truck className="w-4 h-4 text-red-500" />
                                            <h2 className="text-xs uppercase tracking-widest text-white font-black">Доставка</h2>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4">
                                            {(['econt', 'speedy'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, deliveryType: type }))}
                                                    className={`py-4 px-2 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                                        formData.deliveryType === type 
                                                        ? 'border-red-600 bg-red-600/5 text-white' 
                                                        : 'border-white/5 bg-white/2 text-zinc-500 hover:border-white/20'
                                                    }`}
                                                >
                                                    <span className="text-xs uppercase tracking-tighter font-black">
                                                        {type === 'econt' ? 'Еконт Офис' : 'Спиди Офис'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelCls}>Град *</label>
                                                    <input 
                                                        type="text" 
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        className={inputCls} 
                                                        placeholder="Напр. София"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Име/Адрес на Офис *</label>
                                                    <input 
                                                        type="text" 
                                                        name="officeName"
                                                        value={formData.officeName}
                                                        onChange={handleInputChange}
                                                        className={inputCls} 
                                                        placeholder="Напр. Офис Център"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className={labelCls}>Бележка към поръчката</label>
                                                <textarea 
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    className={`${inputCls} min-h-[80px] resize-none`} 
                                                    placeholder="Напр. Цвят на фолиото..."
                                                />
                                            </div>

                                            <label className="flex items-center gap-4 cursor-pointer group pt-2 px-1">
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={saveForFuture}
                                                        onChange={(e) => setSaveForFuture(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <motion.div 
                                                        animate={{ 
                                                            backgroundColor: saveForFuture ? 'rgba(220, 38, 38, 1)' : 'rgba(255, 255, 255, 0.05)',
                                                            borderColor: saveForFuture ? 'rgba(220, 38, 38, 1)' : 'rgba(255, 255, 255, 0.1)'
                                                        }}
                                                        className="w-10 h-10 border rounded-2xl flex items-center justify-center transition-all shadow-lg"
                                                    >
                                                        <AnimatePresence>
                                                            {saveForFuture && (
                                                                <motion.div 
                                                                    initial={{ scale: 0, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    exit={{ scale: 0, opacity: 0 }}
                                                                    className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center pt-0.5"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M2.5 6L4.5 8L9.5 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    </svg>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] uppercase tracking-[0.2em] font-black text-white leading-tight">Запомни данните</span>
                                                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">За следващи поръчки</span>
                                                </div>
                                            </label>
                                        </div>
                                    </section>

                                    <button 
                                        onClick={nextStep}
                                        className="w-full py-5 bg-gradient-to-r from-[#3d0000] to-[#950101] text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl hover:from-[#950101] hover:to-[#ff0000] transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-3"
                                    >
                                        ПРЕГЛЕД НА ПОРЪЧКАТА
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <section className="bg-[#101010] border border-white/5 rounded-2xl p-6 md:p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-red-500" />
                                                <h2 className="text-sm uppercase tracking-widest text-white font-black">Потвърждение на Данни</h2>
                                            </div>
                                            <button onClick={prevStep} className="text-[10px] text-red-500 uppercase tracking-widest font-bold hover:underline">Редактирай</button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold">Получател</h3>
                                                <p className="text-white text-sm font-medium">{formData.fullName}</p>
                                                <p className="text-zinc-400 text-sm">{formData.phone}</p>
                                                 <p className="text-zinc-400 text-sm select-none pointer-events-none">{formData.email}</p>
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold">Доставка</h3>
                                                <p className="text-white text-sm font-medium">
                                                    {formData.deliveryType === 'econt' ? 'Еконт Офис' : 'Спиди Офис'}
                                                </p>
                                                <p className="text-zinc-400 text-sm">{formData.city}</p>
                                                <p className="text-zinc-400 text-sm">{formData.officeName}</p>
                                            </div>
                                        </div>
                                        
                                        {formData.notes && (
                                            <div className="mt-6 pt-6 border-t border-white/5">
                                                <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Бележка</h3>
                                                <p className="text-zinc-400 text-xs italic">"{formData.notes}"</p>
                                            </div>
                                        )}
                                    </section>

                                    {/* Payment Method - Only Cash on Delivery */}
                                    <section className="bg-red-600/5 border border-red-600/20 rounded-2xl p-6 flex items-center gap-4">
                                        <CreditCard className="w-6 h-6 text-red-500" />
                                        <div>
                                            <h3 className="text-xs uppercase tracking-widest text-white font-black">Начин на плащане</h3>
                                            <p className="text-[#B0BEC5] text-[10px] uppercase tracking-widest">Наложен платеж (Плащане при доставка)</p>
                                        </div>
                                    </section>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button 
                                            onClick={prevStep}
                                            className="flex-1 py-4 border border-white/10 text-zinc-400 text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:text-white hover:bg-white/5 transition-all"
                                        >
                                            НАЗАД
                                        </button>
                                        <button 
                                            onClick={submitOrder}
                                            disabled={loading}
                                            className="flex-[2] py-4 bg-red-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                            ПОТВЪРДИ ПОРЪЧКАТА
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-5">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#101010] border border-white/5 rounded-2xl p-5 md:p-8 sticky top-24"
                        >
                            <h2 className="text-sm uppercase tracking-widest text-white font-black mb-6 border-b border-white/10 pb-4">Вашата Поръчка</h2>
                            
                            {/* Items List */}
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4 mb-8 custom-scrollbar">
                                {activeItems.map(item => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="w-16 h-16 bg-black border border-white/5 rounded-lg overflow-hidden shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-black text-white uppercase tracking-wider truncate">{item.name}</h3>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{item.variant}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[10px] text-zinc-400">x{item.quantity}</span>
                                                <span className="text-sm font-black text-red-500">{(item.price * item.quantity).toFixed(2)} €</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Free Shipping Progress */}
                            <div className="mb-6 p-4 rounded-xl bg-red-600/5 border border-red-600/10">
                                {isFreeShipping ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                            <Truck className="w-4 h-4 text-green-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Поздравления!</span>
                                            <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Имате БЕЗПЛАТНА ДОСТАВКА</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">До безплатна доставка</span>
                                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Още {(amountToFreeShipping * 1.95583).toFixed(2)} лв.</span>
                                            </div>
                                            <Truck className="w-4 h-4 text-red-600 mb-0.5" />
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((total / (total + amountToFreeShipping)) * 100, 100)}%` }}
                                                className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 pt-6 border-t border-white/5 text-[10px] uppercase font-bold tracking-widest">
                                <div className="flex justify-between text-zinc-500">
                                    <span>Междинна сума</span>
                                    <span>{subtotal.toFixed(2)} €</span>
                                </div>
                                {discountPercentage > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Отстъпка (-{discountPercentage}%)</span>
                                        <span>-{(subtotal - total).toFixed(2)} €</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-zinc-500">
                                    <span>Доставка</span>
                                    {isFreeShipping ? (
                                        <span className="text-green-500 font-black">БЕЗПЛАТНА</span>
                                    ) : (
                                        <span className="italic">Калкулира се при изпращане</span>
                                    )}
                                </div>
                                
                                <div className="pt-4 mt-2 border-t border-white/10 flex justify-between items-end">
                                    <span className="text-white">ОБЩО</span>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-red-600 italic">{(total).toFixed(2)}</span>
                                            <span className="text-sm font-black text-red-600">€</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-bold opacity-70">
                                            ≈ {(total * 1.95583).toFixed(2)} лв.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="mt-8 p-4 bg-white/2 rounded-xl border border-white/5 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Package className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-widest">
                                        Поръчките се обработват в рамките на 24-48 часа. Плащането се извършва в лева по курса на деня при доставка.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-widest">
                                        Всяка поръчка включва опция за преглед преди плащане.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>

            {/* Minimalist Standalone Footer */}
            <footer className="py-8 border-t border-white/5 bg-black/40 mt-auto">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold mb-4">
                        &copy; {new Date().getFullYear()} CARDECAL. Всички права запазени.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                        <Link to="/privacy" className="hover:text-white transition-colors">Поверителност</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Общи Условия</Link>
                        <Link to="/legal" className="hover:text-white transition-colors">Доставка</Link>
                    </div>
                </div>
            </footer>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 0, 0, 0.3);
                }
            `}} />
        </div>
    );
};

export default CheckoutPage;
