import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    ArrowLeft, ShieldCheck, Truck, CreditCard, 
    ChevronRight, MapPin, Phone, User, Mail, 
    CheckCircle2, AlertCircle, Loader2, Package,
    Edit2, Info, Building2, Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast/ToastProvider';

// --- Sub-components for better organization ---

const Stepper = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${currentStep >= 1 ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'bg-zinc-800 text-zinc-500'}`}>
                {currentStep > 1 ? <Check size={12} /> : "1"}
            </div>
            <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${currentStep >= 1 ? 'text-white' : 'text-zinc-600'}`}>Данни</span>
        </div>
        <div className={`w-12 h-[1px] ${currentStep >= 2 ? 'bg-red-600' : 'bg-zinc-800'}`} />
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${currentStep >= 2 ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'bg-zinc-800 text-zinc-500'}`}>
                2
            </div>
            <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${currentStep >= 2 ? 'text-white' : 'text-zinc-600'}`}>Преглед</span>
        </div>
    </div>
);

const ShippingMethodCard = ({ 
    id, icon: Icon, title, description, time, isActive, onClick 
}: { 
    id: string, icon: any, title: string, description: string, time: string, isActive: boolean, onClick: () => void 
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative flex flex-col p-4 rounded-2xl border text-left transition-all duration-300 group ${
            isActive 
            ? 'border-red-600 bg-red-600/[0.08] shadow-[0_0_20px_rgba(255,0,0,0.1)]' 
            : 'border-white/[0.05] bg-[#0d0d0d] hover:border-white/10'
        }`}
    >
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'}`}>
                <Icon size={18} />
            </div>
            {isActive && <CheckCircle2 className="text-red-600" size={16} />}
        </div>
        <h3 className="text-xs font-black uppercase tracking-wider text-white mb-1">{title}</h3>
        <p className="text-[10px] text-zinc-500 uppercase font-bold leading-tight mb-2">{description}</p>
        <div className="mt-auto pt-2 border-t border-white/5">
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{time}</span>
        </div>
    </button>
);

const CheckoutPage: React.FC = () => {
    const { activeItems, subtotal, total, discountPercentage, clearCart, isFreeShipping, amountToFreeShipping } = useCart();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        deliveryType: 'econt' as 'econt' | 'speedy',
        city: '',
        officeName: '',
        notes: ''
    });
    const [saveForFuture, setSaveForFuture] = useState(true);

    // Initial load from profile
    useEffect(() => {
        if (profile || user) {
            setFormData(prev => ({
                ...prev,
                fullName: prev.fullName || profile?.full_name || (profile as any)?.last_full_name || '',
                email: user?.email || '',
                phone: prev.phone || profile?.phone || (profile as any)?.preferred_phone || '',
                city: prev.city || (profile as any)?.preferred_city || '',
                deliveryType: (prev.deliveryType as any) === 'address' ? 'econt' : (prev.deliveryType || (profile as any)?.preferred_delivery_type || 'econt'),
                officeName: prev.officeName || (profile as any)?.preferred_office_name || ''
            }));
        }
    }, [profile, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Името е задължително";
        if (!formData.phone.trim() || formData.phone.length < 8) newErrors.phone = "Въведете валиден телефон";
        if (!formData.city.trim()) newErrors.city = "Въведете град";
        
        if (!formData.officeName.trim()) newErrors.officeName = "Въведете име или номер на офис";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateForm()) {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showToast('Моля, попълнете всички задължителни полета.', 'warning');
        }
    };

    const handleBack = () => {
        setStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmitOrder = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const { data, error } = await supabase.from('orders').insert({
                user_id: user?.id,
                items: activeItems,
                total_amount: total,
                shipping_details: formData,
                status: 'pending',
                payment_method: 'cash_on_delivery'
            }).select('id').single();

            if (error) throw error;

            if (user && saveForFuture) {
                await supabase.from('profiles').update({
                    preferred_city: formData.city,
                    preferred_delivery_type: formData.deliveryType,
                    preferred_office_name: formData.officeName,
                    preferred_phone: formData.phone,
                    last_full_name: formData.fullName
                }).eq('id', user.id);
            }

            clearCart();
            showToast('Поръчката е успешно приета!', 'success');
            navigate(`/order/success/${data.id}`, { replace: true });
        } catch (err: any) {
            showToast(err.message || 'Грешка при изпращане на поръчката.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Redirect if cart empty
    useEffect(() => {
        if (activeItems.length === 0 && user) {
            navigate('/cart');
        }
    }, [activeItems.length, user, navigate]);

    // UI Helpers
    const inputStyle = (errorKey: string) => `
        w-full h-[52px] bg-[#0d0d0d] border ${errors[errorKey] ? 'border-red-600' : 'border-white/[0.08] hover:border-white/20'} 
        text-white text-base px-4 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 
        transition-all placeholder:text-zinc-600 font-medium
        autofill:shadow-[0_0_0_1000px_#0d0d0d_inset] autofill:text-white
    `;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col pt-[env(safe-area-inset-top)] pb-24 lg:pb-0">
            {/* Minimalist Header */}
            <header className="h-20 sm:h-24 sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50">
                <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/LOGO.png" alt="CarDecal" className="h-8 sm:h-10 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/10 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500/80">ОФИЦИАЛЕН CHECKOUT</span>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8 md:py-12">
                
                <Stepper currentStep={step} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                    
                    {/* Left Column: Form / Review */}
                    <div className="lg:col-span-7 space-y-8">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div 
                                    key="form"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-8"
                                >
                                    {/* Section 1: Customer Info */}
                                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 sm:p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center">
                                                <User className="text-red-600" size={16} />
                                            </div>
                                            <div>
                                                <h2 className="text-xs font-black uppercase tracking-widest text-white leading-none">Контактна информация</h2>
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Въведете актуални данни</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2 block ml-1">Име и Фамилия <span className="text-red-600">*</span></label>
                                                <input 
                                                    type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                                                    className={inputStyle('fullName')} placeholder="Иван Иванов"
                                                />
                                                {errors.fullName && <p className="text-[10px] text-red-600 font-bold uppercase mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.fullName}</p>}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2 block ml-1">Телефон <span className="text-red-600">*</span></label>
                                                <div className="relative">
                                                    <input 
                                                        type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                                                        className={inputStyle('phone')} placeholder="08XXXXXXXX"
                                                    />
                                                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10" size={16} />
                                                </div>
                                                <p className="text-[10px] text-zinc-600 font-bold mt-1.5 ml-1">ТЕЛЕФОН ЗА КУРИЕРА</p>
                                                {errors.phone && <p className="text-[10px] text-red-600 font-bold uppercase mt-1 ml-1">{errors.phone}</p>}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2 block ml-1">Имейл</label>
                                                <input 
                                                    type="email" name="email" value={formData.email} readOnly 
                                                    className="w-full h-[52px] bg-white/[0.03] border border-white/[0.05] text-zinc-500 text-base px-4 rounded-xl cursor-not-allowed font-medium" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Shipping */}
                                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 sm:p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center">
                                                <Truck className="text-red-600" size={16} />
                                            </div>
                                            <div>
                                                <h2 className="text-xs font-black uppercase tracking-widest text-white leading-none">Доставка</h2>
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Изберете предпочитан метод</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <ShippingMethodCard 
                                                id="econt" icon={Building2} title="Econt Офис" description="До офис на Еконт" time="1-2 дни"
                                                isActive={formData.deliveryType === 'econt'} onClick={() => setFormData(p => ({...p, deliveryType: 'econt'}))}
                                            />
                                            <ShippingMethodCard 
                                                id="speedy" icon={Building2} title="Speedy Офис" description="До офис на Спиди" time="1-2 дни"
                                                isActive={formData.deliveryType === 'speedy'} onClick={() => setFormData(p => ({...p, deliveryType: 'speedy'}))}
                                            />
                                        </div>

                                        <div className="space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2 block ml-1">Град <span className="text-red-600">*</span></label>
                                                    <input 
                                                        type="text" name="city" value={formData.city} onChange={handleInputChange}
                                                        className={inputStyle('city')} placeholder="София"
                                                    />
                                                    {errors.city && <p className="text-[10px] text-red-600 font-bold uppercase mt-1.5 ml-1">{errors.city}</p>}
                                                </div>
                                                
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2 block ml-1">Офис на Куриер <span className="text-red-600">*</span></label>
                                                    <input 
                                                        type="text" name="officeName" value={formData.officeName} onChange={handleInputChange}
                                                        className={inputStyle('officeName')} placeholder="Напр. Офис Център"
                                                    />
                                                    {errors.officeName && <p className="text-[10px] text-red-600 font-bold uppercase mt-1.5 ml-1">{errors.officeName}</p>}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2 block ml-1">Бележка към поръчката (Опционално)</label>
                                                <textarea 
                                                    name="notes" value={formData.notes} onChange={handleInputChange} maxLength={300}
                                                    className="w-full h-24 bg-[#0d0d0d] border border-white/[0.08] text-white text-base px-4 py-3 rounded-xl focus:outline-none focus:border-red-600 transition-all placeholder:text-zinc-600 font-medium resize-none shadow-inner" 
                                                    placeholder="Уточнения за цвят, размери или друго..."
                                                />
                                                <div className="flex justify-between items-center mt-1.5 ml-1">
                                                    <span className="text-[9px] text-zinc-600 font-bold uppercase">Общи указания</span>
                                                    <span className={`text-[9px] font-black ${formData.notes.length > 250 ? 'text-red-500' : 'text-zinc-600'}`}>{formData.notes.length}/300</span>
                                                </div>
                                            </div>

                                            <label className="flex items-center gap-3 cursor-pointer select-none group w-fit pt-2">
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" checked={saveForFuture} onChange={(e) => setSaveForFuture(e.target.checked)} className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${saveForFuture ? 'bg-red-600 border-red-600' : 'bg-transparent border-white/20 group-hover:border-white/40'}`}>
                                                        {saveForFuture && <Check size={14} strokeWidth={4} className="text-white" />}
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Запомни данните за следващи поръчки</span>
                                            </label>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 opacity-60">
                                            <ShieldCheck className="text-green-500" size={16} />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Преглед и тест преди плащане при всеки куриер</p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleNext}
                                        className="hidden lg:flex w-full h-[64px] bg-gradient-to-r from-[#3d0000] to-[#950101] text-white text-sm font-black uppercase tracking-[0.3em] rounded-2xl hover:from-[#950101] hover:to-[#ff0000] transition-all shadow-[0_4px_30px_rgba(149,1,1,0.2)] hover:shadow-[0_8px_40px_rgba(255,0,0,0.3)] items-center justify-center gap-4"
                                    >
                                        ПРЕГЛЕД НА ПОРЪЧКАТА
                                        <ChevronRight size={18} />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="review"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 sm:p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                    <CheckCircle2 className="text-green-500" size={16} />
                                                </div>
                                                <h2 className="text-xs font-black uppercase tracking-widest text-white leading-none">Потвърдете Вашите данни</h2>
                                            </div>
                                            <button onClick={handleBack} className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors">
                                                <Edit2 size={12} /> Редактирай
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-2">Получател</h3>
                                                    <p className="text-sm font-black text-white">{formData.fullName}</p>
                                                    <p className="text-xs text-zinc-400 mt-0.5">{formData.phone}</p>
                                                    <p className="text-xs text-zinc-500 mt-1">{formData.email}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-2">Начин на доставка</h3>
                                                    <div className="flex items-center gap-2 text-white">
                                                         <Building2 size={14} className="text-red-600" />
                                                         <span className="text-sm font-black uppercase tracking-tight">
                                                            {formData.deliveryType === 'econt' ? 'Еконт Офис' : 'Спиди Офис'}
                                                         </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 mt-1.5">{formData.city}, {formData.officeName}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {formData.notes && (
                                            <div className="mt-8 pt-8 border-t border-white/5">
                                                <h3 className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-2">Бележка</h3>
                                                <p className="text-xs text-zinc-300 italic bg-white/[0.02] p-4 rounded-xl border border-white/5 leading-relaxed">"{formData.notes}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Section */}
                                    <div className="bg-red-600/5 border border-red-600/10 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <CreditCard size={120} />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                                                    <CreditCard className="text-red-500" size={16} />
                                                </div>
                                                <h2 className="text-xs font-black uppercase tracking-widest text-white leading-none">Начин на плащане</h2>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-base font-black text-white italic">НАЛОЖЕН ПЛАТЕЖ</p>
                                                <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-lg">
                                                    Плащате сумата на куриера при получаване на поръчката. В офис на куриер е възможно и плащане с карта (според техните условия).
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden lg:grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={handleBack}
                                            className="h-[64px] border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
                                        >
                                            ВЪРНИ СЕ НАЗАД
                                        </button>
                                        <button 
                                            onClick={handleSubmitOrder}
                                            disabled={loading}
                                            className="h-[64px] bg-red-600 text-white text-sm font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-red-500 transition-all shadow-[0_8px_40px_rgba(220,38,38,0.3)] disabled:opacity-50 flex items-center justify-center gap-4"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck size={20} />}
                                            ПОТВЪРДИ ПОРЪЧКАТА
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="lg:col-span-5 lg:sticky lg:top-32 h-fit space-y-6">
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
                            <h2 className="text-xs font-black uppercase tracking-widest text-white mb-8 pb-4 border-b border-white/5">Обобщение на поръчката</h2>
                            
                            {/* Product List */}
                            <div className="space-y-4 mb-8 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                {activeItems.map(item => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="w-16 h-16 bg-black border border-white/5 rounded-2xl overflow-hidden shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale tracking-tight group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300" />
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="text-[11px] font-black text-white uppercase tracking-wider truncate">{item.name}</h3>
                                                <span className="text-xs font-black text-white italic whitespace-nowrap">{(item.price * item.quantity).toFixed(2)} €</span>
                                            </div>
                                            <p className="text-[9px] text-zinc-500 uppercase font-black mt-1">Вариант: {item.variant} <span className="text-red-500 ml-2">x{item.quantity}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Free Shipping Progress */}
                            <div className="mb-8 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                                    <span className={isFreeShipping ? 'text-green-500' : 'text-zinc-500'}>БЕЗПЛАТНА ДОСТАВКА</span>
                                    {!isFreeShipping && <span className="text-red-500">ОЩЕ {amountToFreeShipping.toFixed(2)} €</span>}
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: isFreeShipping ? '100%' : `${(subtotal / (subtotal + amountToFreeShipping)) * 100}%` }}
                                        className={`h-full ${isFreeShipping ? 'bg-green-500' : 'bg-red-600'} rounded-full`}
                                    />
                                </div>
                                {isFreeShipping && (
                                    <p className="text-[8px] text-green-500 uppercase font-bold text-center mt-2 tracking-widest">Вие се възползвате от безплатен куриер! 🎉</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 pt-4 text-[10px] uppercase font-black tracking-widest">
                                <div className="flex justify-between text-zinc-500">
                                    <span>Междинна сума</span>
                                    <span className="text-zinc-300">{subtotal.toFixed(2)} €</span>
                                </div>
                                {discountPercentage > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Промо отстъпка</span>
                                        <span>-{(subtotal - total).toFixed(2)} €</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-zinc-500">
                                    <span>Доставка</span>
                                    {isFreeShipping ? (
                                        <span className="text-green-500">БЕЗПЛАТНА</span>
                                    ) : (
                                        <span className="italic text-[9px]">Калкулира се при изпращане</span>
                                    )}
                                </div>
                                
                                <div className="pt-6 mt-2 border-t border-white/10 flex justify-between items-end">
                                    <div>
                                        <span className="text-white text-xs block mb-1">ОБЩО ЗА ПЛАЩАНЕ</span>
                                        <p className="text-[10px] text-zinc-500 lowercase font-bold opacity-60 normal-case italic">~Плащане при доставка</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-baseline gap-1 justify-end">
                                            <span className="text-3xl font-black text-red-600 italic">{(total).toFixed(2)}</span>
                                            <span className="text-sm font-black text-red-600">€</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 font-bold opacity-70 tracking-tighter mt-1">
                                            ≈ {(total * 1.95583).toFixed(2)} лв.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges Container */}
                        <div className="grid grid-cols-2 gap-3 px-2">
                             <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                                <Truck size={20} className="text-red-500 mb-2 opacity-50" />
                                <span className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.2em]">бърза обработка до 24-48ч.</span>
                             </div>
                             <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                                <ShieldCheck size={20} className="text-red-500 mb-2 opacity-50" />
                                <span className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.2em]">100% гаранция за качество</span>
                             </div>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-2 pb-8">
                            <Link to="/shipping" className="text-[8px] font-bold uppercase text-zinc-600 hover:text-white transition-colors tracking-widest">Доставка</Link>
                            <Link to="/terms" className="text-[8px] font-bold uppercase text-zinc-600 hover:text-white transition-colors tracking-widest">Общи условия</Link>
                            <Link to="/privacy" className="text-[8px] font-bold uppercase text-zinc-600 hover:text-white transition-colors tracking-widest">Поверителност</Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Sticky CTA Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/5 p-4 z-[60] pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between max-w-[500px] mx-auto">
                    <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">ОБЩО</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white italic">{total.toFixed(2)}</span>
                            <span className="text-xs font-black text-white">€</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={step === 1 ? handleNext : handleSubmitOrder}
                        disabled={loading}
                        className="h-14 px-8 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-red-500 transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : step === 1 ? "ПРЕГЛЕД" : "ПОРЪЧАЙ"}
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `}} />
        </div>
    );
};

export default CheckoutPage;
