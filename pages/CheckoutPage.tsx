import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
    ChevronLeft, ShieldCheck, CreditCard, Sparkles, 
    Check, Briefcase, Globe, FileText, Headphones, 
    User, ArrowRight, Building2, Camera, Mail, 
    Shield, ArrowUpRight, Zap, Target, Phone,
    MapPin, StickyNote, UserCheck, CheckCircle2,
    ChevronRight, Lock, Star, Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';

import { PurchaseSuccessModal } from '../components/PurchaseSuccessModal';

/* ─── Step Icons ─── */
const stepIcons = [
    <Building2 className="w-4 h-4" />,
    <FileText className="w-4 h-4" />,
    <Target className="w-4 h-4" />,
];

const CheckoutPage: React.FC = () => {
    const { t } = useTranslation();
    const { lang, planId } = useParams<{ lang: string, planId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const plansMetas: Record<string, any> = {
        scouting: {
            nameKey: "pricing.scouting",
            price: "49€",
            featuresKeys: [
                "pricing.benefits.new_faces",
                "pricing.benefits.online_booking",
                "pricing.benefits.response_24h"
            ],
            gradient: "from-rose-600/20 via-pink-600/10 to-rose-900/30",
            accent: "rose",
            icon: <Camera className="w-5 h-5" />,
        },
        casting: {
            nameKey: "pricing.casting",
            price: "149€",
            featuresKeys: [
                "pricing.benefits.mainboard",
                "pricing.benefits.priority_booking",
                "pricing.benefits.casting_reels",
                "pricing.benefits.dedicated_agent"
            ],
            gradient: "from-violet-600/20 via-purple-600/10 to-indigo-900/30",
            accent: "violet",
            icon: <Star className="w-5 h-5" />,
        },
        campaign: {
            nameKey: "pricing.campaign",
            price: t('pricing.custom'),
            featuresKeys: [
                "pricing.benefits.full_database",
                "pricing.benefits.priority_247",
                "pricing.benefits.wholistic_rights",
                "pricing.benefits.producer"
            ],
            gradient: "from-sky-600/20 via-blue-600/10 to-slate-900/30",
            accent: "sky",
            icon: <Award className="w-5 h-5" />,
        }
    };

    const currentPlan = plansMetas[planId || 'scouting'] || plansMetas.scouting;

    const [formData, setFormData] = useState({
        client_type: 'Brand',
        full_name: '',
        email: '',
        company_name: '',
        vat_number: '',
        billing_address: '',
        phone: '',
        notes: '',
        project_intent: 'Campaign'
    });

    /* ─── Auto-fill from profile ─── */
    useEffect(() => {
        if (user && profile) {
            const autoData: Partial<typeof formData> = {};
            let hasData = false;

            if (profile.full_name) {
                autoData.full_name = profile.full_name;
                hasData = true;
            }
            if (user.email) {
                autoData.email = user.email;
                hasData = true;
            }
            if (profile.location) {
                autoData.billing_address = profile.location;
                hasData = true;
            }

            if (hasData) {
                setFormData(prev => ({ ...prev, ...autoData }));
                setProfileLoaded(true);
            }
        }
    }, [user, profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('promo_orders')
                .insert([
                    {
                        plan_id: planId,
                        plan_name: t(currentPlan.nameKey),
                        price: currentPlan.price,
                        ...formData,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;

            if (user) {
                const updates: any = { active_plan: planId };
                if (planId === 'scouting' || planId === 'casting') {
                    updates.is_verified = true;
                    updates.verified_until = new Date(Date.now() + 20000).toISOString();
                }
                await supabase.from('profiles').update(updates).eq('id', user.id);
            }

            setIsSuccess(true);
            showToast("✨ " + t('checkout.payment.title') + "!", "success");
        } catch (error: any) {
            console.error('Checkout error:', error);
            showToast(error.message || "Error processing order", "error");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        t('checkout.step_client'),
        t('checkout.step_details'),
        t('checkout.step_intent'),
    ];

    const clientTypes = ['Brand', 'Photographer', 'Agency', 'Production'];
    const intentTypes = ['Campaign', 'E-commerce', 'Editorial', 'Social', 'Runway', 'Lookbook'];

    const clientTypeIcons: Record<string, React.ReactNode> = {
        'Brand': <Briefcase className="w-4 h-4" />,
        'Photographer': <Camera className="w-4 h-4" />,
        'Agency': <Building2 className="w-4 h-4" />,
        'Production': <Globe className="w-4 h-4" />,
    };

    const intentIcons: Record<string, React.ReactNode> = {
        'Campaign': <Target className="w-4 h-4" />,
        'E-commerce': <Globe className="w-4 h-4" />,
        'Editorial': <FileText className="w-4 h-4" />,
        'Social': <Sparkles className="w-4 h-4" />,
        'Runway': <ArrowUpRight className="w-4 h-4" />,
        'Lookbook': <Camera className="w-4 h-4" />,
    };

    /* ─── Step validation ─── */
    const canProceed = () => {
        if (currentStep === 0) return !!formData.client_type;
        if (currentStep === 1) return !!(formData.full_name && formData.email && formData.company_name);
        if (currentStep === 2) return !!formData.project_intent;
        return true;
    };

    /* ─── Animated Input Component ─── */
    const FloatingInput = ({ label, icon, name, type = "text", required = false, placeholder = "", value, onChange }: {
        label: string; icon: React.ReactNode; name: string; type?: string; required?: boolean; placeholder?: string;
        value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }) => (
        <div className="group relative">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-zinc-500 group-focus-within:text-white transition-colors">{icon}</span>
                <label className="text-[10px] uppercase font-black tracking-[0.15em] text-zinc-500 group-focus-within:text-zinc-300 transition-colors">
                    {label}
                </label>
                {profileLoaded && value && (
                    <span className="ml-auto flex items-center gap-1 text-emerald-500/60">
                        <UserCheck className="w-3 h-3" />
                        <span className="text-[8px] uppercase tracking-widest font-bold">Auto</span>
                    </span>
                )}
            </div>
            <input
                type={type}
                required={required}
                name={name}
                placeholder={placeholder}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white/90 text-sm placeholder:text-zinc-700 
                           focus:border-white/20 focus:bg-white/[0.05] focus:ring-1 focus:ring-white/10 
                           transition-all duration-300 outline-none"
                value={value}
                onChange={onChange}
            />
        </div>
    );

    /* ─── Step Content ─── */
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <motion.div
                        key="step-0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            {clientTypes.map((type) => (
                                <motion.button
                                    key={type}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setFormData(f => ({...f, client_type: type}))}
                                    className={cn(
                                        "relative py-5 px-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden group",
                                        formData.client_type === type 
                                            ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]" 
                                            : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/20 hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                            formData.client_type === type
                                                ? "bg-black/10"
                                                : "bg-white/5"
                                        )}>
                                            {clientTypeIcons[type]}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.15em]">
                                                {t(`checkout.client_types.${type}`)}
                                            </div>
                                        </div>
                                    </div>
                                    {formData.client_type === type && (
                                        <motion.div
                                            layoutId="client-check"
                                            className="absolute top-2 right-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-black" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                );
            case 1:
                return (
                    <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                    >
                        {/* Auto-fill banner */}
                        {profileLoaded && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10"
                            >
                                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                        {t('checkout.profile_loaded')}
                                    </p>
                                    <p className="text-[10px] text-emerald-500/60 mt-0.5">
                                        {t('checkout.review_data')}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FloatingInput
                                label={t('checkout.fields.full_name')}
                                icon={<User className="w-3.5 h-3.5" />}
                                name="full_name"
                                required
                                placeholder={t('checkout.fields.full_name_placeholder')}
                                value={formData.full_name}
                                onChange={handleInputChange}
                            />
                            <FloatingInput
                                label={t('checkout.fields.email')}
                                icon={<Mail className="w-3.5 h-3.5" />}
                                name="email"
                                type="email"
                                required
                                placeholder={t('checkout.fields.email_placeholder')}
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                            <FloatingInput
                                label={t('checkout.fields.company_name')}
                                icon={<Building2 className="w-3.5 h-3.5" />}
                                name="company_name"
                                required
                                placeholder={t('checkout.fields.company_placeholder')}
                                value={formData.company_name}
                                onChange={handleInputChange}
                            />
                            <FloatingInput
                                label={t('checkout.fields.vat')}
                                icon={<FileText className="w-3.5 h-3.5" />}
                                name="vat_number"
                                placeholder={t('checkout.fields.vat_placeholder')}
                                value={formData.vat_number}
                                onChange={handleInputChange}
                            />
                        </div>
                        <FloatingInput
                            label={t('checkout.fields.billing_address')}
                            icon={<MapPin className="w-3.5 h-3.5" />}
                            name="billing_address"
                            required
                            placeholder={t('checkout.fields.billing_placeholder')}
                            value={formData.billing_address}
                            onChange={handleInputChange}
                        />
                        <FloatingInput
                            label={t('checkout.fields.phone')}
                            icon={<Phone className="w-3.5 h-3.5" />}
                            name="phone"
                            type="tel"
                            placeholder={t('checkout.fields.phone_placeholder')}
                            value={formData.phone}
                            onChange={handleInputChange}
                        />
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {intentTypes.map((intent) => (
                                <motion.button
                                    key={intent}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setFormData(f => ({...f, project_intent: intent}))}
                                    className={cn(
                                        "relative py-4 px-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden",
                                        formData.project_intent === intent 
                                            ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]" 
                                            : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/20 hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                                            formData.project_intent === intent
                                                ? "bg-black/10"
                                                : "bg-white/5"
                                        )}>
                                            {intentIcons[intent]}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.12em]">
                                            {t(`checkout.intents.${intent}`)}
                                        </span>
                                    </div>
                                    {formData.project_intent === intent && (
                                        <motion.div layoutId="intent-check" className="absolute top-2 right-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Notes */}
                        <div className="group relative">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-zinc-500 group-focus-within:text-white transition-colors">
                                    <StickyNote className="w-3.5 h-3.5" />
                                </span>
                                <label className="text-[10px] uppercase font-black tracking-[0.15em] text-zinc-500 group-focus-within:text-zinc-300 transition-colors">
                                    {t('checkout.fields.notes')}
                                </label>
                            </div>
                            <textarea
                                name="notes"
                                rows={3}
                                placeholder={t('checkout.fields.notes_placeholder')}
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white/90 text-sm placeholder:text-zinc-700 
                                           focus:border-white/20 focus:bg-white/[0.05] focus:ring-1 focus:ring-white/10 
                                           transition-all duration-300 outline-none resize-none"
                                value={formData.notes}
                                onChange={handleInputChange}
                            />
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#060607] text-white selection:bg-white/10">
            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className={cn(
                    "absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.04] transition-all duration-1000",
                    planId === 'scouting' ? "bg-rose-500" : planId === 'casting' ? "bg-violet-500" : "bg-sky-500"
                )} />
                <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-white blur-[120px] opacity-[0.02]" />
            </div>

            {/* Success Modal */}
            <PurchaseSuccessModal 
                open={isSuccess}
                planName={t(currentPlan.nameKey)}
                priceLabel={currentPlan.price}
                onDashboard={() => navigate(`/${lang || 'bg'}/profile`)}
                onInvoice={() => showToast("Invoice generated and sent to your email.", "success")}
            />

            {/* ─── Header ─── */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('checkout.exit')}</span>
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">{t('checkout.agency_division')}</span>
                    <div className="w-12 h-px bg-zinc-800 mt-2" />
                </div>
                <div className="flex items-center gap-2 text-emerald-500/80">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('checkout.secure_3d')}</span>
                </div>
            </div>

            {/* ─── Main Content ─── */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    
                    {/* ═══════ LEFT COLUMN: SUMMARY ═══════ */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Title area */}
                        <div className="space-y-5">
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl lg:text-5xl font-serif leading-[1.1] tracking-tight"
                            >
                                {t('checkout.title')} – <br/>
                                <span className="text-zinc-500 italic">{t('checkout.subtitle')}</span>
                            </motion.h1>
                            <div className="flex items-center gap-4 text-zinc-400">
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-[#060607] bg-zinc-800 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs font-medium tracking-wide">{t('checkout.trusted_by')}</p>
                            </div>
                        </div>

                        {/* ─── Plan Card ─── */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={cn(
                                "rounded-[28px] p-7 border border-white/[0.08] relative overflow-hidden bg-gradient-to-br backdrop-blur-sm",
                                currentPlan.gradient
                            )}
                        >
                            {/* Shimmer accent */}
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.02)_50%,transparent_60%)]" />
                            
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 flex items-center gap-2">
                                        {currentPlan.icon}
                                        {t('checkout.package_selected')}
                                    </div>
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3 className="text-2xl font-black tracking-tight">{t(currentPlan.nameKey)}</h3>
                                        <div className="text-2xl font-light tabular-nums">{currentPlan.price}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {currentPlan.featuresKeys.map((fKey: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                                            <div className="w-5 h-5 rounded-md bg-white/[0.06] flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white/50" />
                                            </div>
                                            {t(fKey)}
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-white/[0.06] space-y-2.5">
                                    {[t('checkout.no_hidden_fees'), t('checkout.commercial_usage'), t('checkout.gdpr_release')].map((badge, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/40">
                                            <Check className="w-3 h-3" />
                                            {badge}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* ─── Agent Info ─── */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] group hover:border-white/10 transition-all"
                        >
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" alt="Maria K" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold">Maria K.</h4>
                                <p className="text-xs text-zinc-500 mb-1">{t('checkout.booking_director')}</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500">{t('checkout.reply_within')}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ═══════ RIGHT COLUMN: FORM ═══════ */}
                    <div className="lg:col-span-7">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white/[0.015] rounded-[32px] border border-white/[0.06] p-6 lg:p-10 backdrop-blur-xl"
                        >
                            {/* ─── Stepper ─── */}
                            <div className="mb-10">
                                <div className="flex items-center justify-between relative">
                                    {/* Progress line bg */}
                                    <div className="absolute top-5 left-6 right-6 h-px bg-white/[0.06]" />
                                    {/* Progress line fill */}
                                    <motion.div 
                                        className="absolute top-5 left-6 h-px bg-white/20"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        style={{ maxWidth: 'calc(100% - 48px)' }}
                                    />
                                    
                                    {steps.map((stepLabel, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setCurrentStep(i)}
                                            className="relative z-10 flex flex-col items-center gap-2 group"
                                        >
                                            <motion.div
                                                animate={{
                                                    scale: currentStep === i ? 1 : 0.9,
                                                    backgroundColor: i <= currentStep ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.04)',
                                                }}
                                                className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                                                    i < currentStep
                                                        ? "border-white/20"
                                                        : i === currentStep
                                                        ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                                        : "border-white/[0.06]"
                                                )}
                                            >
                                                {i < currentStep ? (
                                                    <Check className="w-4 h-4 text-black" />
                                                ) : (
                                                    <span className={cn(
                                                        "transition-colors",
                                                        i === currentStep ? "text-black" : "text-zinc-600"
                                                    )}>
                                                        {stepIcons[i]}
                                                    </span>
                                                )}
                                            </motion.div>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest transition-colors whitespace-nowrap",
                                                i <= currentStep ? "text-zinc-300" : "text-zinc-700"
                                            )}>
                                                {stepLabel}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                                {/* ─── Step Content ─── */}
                                <div className="min-h-[280px]">
                                    <AnimatePresence mode="wait">
                                        {renderStepContent()}
                                    </AnimatePresence>
                                </div>

                                {/* ─── Navigation ─── */}
                                <div className="flex items-center justify-between gap-4 pt-4">
                                    {currentStep > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(s => s - 1)}
                                            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            {t('nav.back')}
                                        </button>
                                    ) : <div />}

                                    {currentStep < steps.length - 1 ? (
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: canProceed() ? 1.02 : 1 }}
                                            whileTap={{ scale: canProceed() ? 0.98 : 1 }}
                                            onClick={() => canProceed() && setCurrentStep(s => s + 1)}
                                            disabled={!canProceed()}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                                                canProceed()
                                                    ? "bg-white text-black hover:bg-zinc-200"
                                                    : "bg-white/5 text-zinc-600 cursor-not-allowed"
                                            )}
                                        >
                                            <span>{steps[currentStep + 1]}</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </motion.button>
                                    ) : null}
                                </div>

                                {/* ─── Payment Section (visible on last step) ─── */}
                                {currentStep === steps.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        className="pt-8 border-t border-white/[0.05] space-y-6"
                                    >
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold flex items-center gap-2">
                                                    <Lock className="w-3.5 h-3.5 text-emerald-500/60" />
                                                    {t('checkout.payment.title')}
                                                </h4>
                                                <p className="text-xs text-zinc-500">{t('checkout.payment.subtitle')}</p>
                                            </div>
                                            <div className="flex items-center gap-4 grayscale opacity-30">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-4" alt="Stripe" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5" alt="Mastercard" />
                                            </div>
                                        </div>

                                        <div className="bg-zinc-800/10 p-4 rounded-xl border border-white/[0.04]">
                                            <div className="flex gap-3">
                                                <Shield className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-zinc-500 leading-relaxed">
                                                    {t('checkout.payment.legal_notice')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Terms agreement */}
                                        <label className="flex items-start gap-3 cursor-pointer group select-none">
                                            <div 
                                                onClick={() => setAgreedToTerms(!agreedToTerms)}
                                                className={cn(
                                                    "w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-all shrink-0",
                                                    agreedToTerms
                                                        ? "bg-white border-white"
                                                        : "bg-white/[0.03] border-white/10 group-hover:border-white/30"
                                                )}
                                            >
                                                {agreedToTerms && <Check className="w-3 h-3 text-black" />}
                                            </div>
                                            <span className="text-[11px] text-zinc-400 leading-relaxed">
                                                {t('auth.terms')}{' '}
                                                <a 
                                                    href={`/${lang || 'bg'}/terms`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-white/80 underline decoration-dotted underline-offset-2 hover:text-white transition-colors"
                                                >
                                                    {t('auth.terms_link')}
                                                </a>
                                            </span>
                                        </label>

                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            disabled={loading || !agreedToTerms || !canProceed()}
                                            type="submit"
                                            className={cn(
                                                "w-full font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all duration-300",
                                                agreedToTerms && canProceed()
                                                    ? "bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.08)] hover:shadow-[0_0_60px_rgba(255,255,255,0.12)]"
                                                    : "bg-white/5 text-zinc-600 cursor-not-allowed"
                                            )}
                                        >
                                            {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                                            {loading ? t('checkout.payment.loading') : t('checkout.payment.submit')}
                                        </motion.button>

                                        <div className="text-center">
                                            <a href="mailto:booking@agency.com" className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-colors">
                                                {t('checkout.payment.help')}
                                            </a>
                                        </div>
                                    </motion.div>
                                )}
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
