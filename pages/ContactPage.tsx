import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { JollyDatePicker } from "../components/ui/date-picker";
import { PinIcon, MailIcon, PhoneIcon, InstagramIcon, TwitterIcon, LinkedInIcon, GlobeIcon } from "../components/IconComponents";

const InputField: React.FC<{
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, label, type = "text", placeholder, required = true, value, onChange }) => (
    <div className="group">
        <label htmlFor={id} className="block mb-2 text-xs uppercase tracking-widest text-text-muted group-focus-within:text-gold-accent transition-colors">
            {label}
        </label>
        <input
            type={type}
            id={id}
            name={id}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={onChange}
            className="bg-surface/50 border border-border text-text-primary text-sm focus:ring-1 focus:ring-gold-accent focus:border-gold-accent block w-full p-4 transition-all outline-none"
        />
    </div>
);

const TextAreaField: React.FC<{
    id: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}> = ({ id, label, placeholder, required = true, value, onChange }) => (
    <div className="group">
        <label htmlFor={id} className="block mb-2 text-xs uppercase tracking-widest text-text-muted group-focus-within:text-gold-accent transition-colors">
            {label}
        </label>
        <textarea
            id={id}
            name={id}
            rows={4}
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={onChange}
            className="bg-surface/50 border border-border text-text-primary text-sm focus:ring-1 focus:ring-gold-accent focus:border-gold-accent block w-full p-4 transition-all outline-none resize-none"
        ></textarea>
    </div>
);

const BookingForm: React.FC = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('contact_booking_form');
        return saved ? JSON.parse(saved) : {
            name: '',
            email: '',
            brand: '',
            location: '',
            budget: t('contact.booking.budget_select'),
            message: ''
        };
    });

    useEffect(() => {
        localStorage.setItem('contact_booking_form', JSON.stringify(formData));
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, send to API
        localStorage.removeItem('contact_booking_form');
        alert(t('common.success') || 'Success!');
    };

    return (
        <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField 
                    id="name" 
                    label={t('contact.booking.full_name')} 
                    placeholder={t('contact.booking.name_placeholder')}
                    value={formData.name}
                    onChange={handleChange}
                />
                <InputField
                    id="email"
                    type="email"
                    label={t('contact.booking.email_address')}
                    placeholder={t('contact.booking.email_placeholder')}
                    value={formData.email}
                    onChange={handleChange}
                />
            </div>
            <InputField
                id="brand"
                label={t('contact.booking.brand')}
                placeholder={t('contact.booking.brand_placeholder')}
                value={formData.brand}
                onChange={handleChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <JollyDatePicker label={t('contact.booking.project_date')} />
                <InputField
                    id="location"
                    label={t('contact.booking.project_location')}
                    placeholder={t('contact.booking.location_placeholder')}
                    value={formData.location}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="budget" className="block mb-2 text-xs uppercase tracking-widest text-text-muted">
                    {t('contact.booking.budget')}
                </label>
                <select
                    id="budget"
                    name="budget"
                    className="bg-surface/50 border border-border text-text-primary text-sm focus:ring-1 focus:ring-gold-accent focus:border-gold-accent block w-full p-4 outline-none appearance-none"
                    value={formData.budget}
                    onChange={handleChange}
                >
                    <option className="bg-surface">{t('contact.booking.budget_select')}</option>
                    <option className="bg-surface">$5,000 - $10,000</option>
                    <option className="bg-surface">$10,000 - $25,000</option>
                    <option className="bg-surface">$25,000 - $50,000</option>
                    <option className="bg-surface">$50,000+</option>
                </select>
            </div>
            <TextAreaField
                id="message"
                label={t('contact.booking.message')}
                placeholder={t('contact.booking.message_placeholder')}
                value={formData.message}
                onChange={handleChange}
            />
            <button
                type="submit"
                className="w-full px-8 py-4 bg-gold-accent text-background text-sm font-bold uppercase tracking-[0.2em] hover:bg-white transition-all duration-300 transform active:scale-[0.98]"
            >
                {t('contact.booking.submit')}
            </button>
        </form>
    );
};

const ApplicationForm: React.FC = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('contact_application_form');
        return saved ? JSON.parse(saved) : {
            apply_name: '',
            apply_email: '',
            age: '',
            height: '',
            apply_location: '',
            portfolio: ''
        };
    });

    useEffect(() => {
        localStorage.setItem('contact_application_form', JSON.stringify(formData));
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.removeItem('contact_application_form');
        alert(t('common.success') || 'Success!');
    };

    return (
        <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField 
                    id="apply_name" 
                    label={t('contact.application.full_name')} 
                    placeholder={t('contact.application.name_placeholder')}
                    value={formData.apply_name}
                    onChange={handleChange}
                />
                <InputField
                    id="apply_email"
                    type="email"
                    label={t('contact.application.email_address')}
                    placeholder={t('contact.application.email_placeholder')}
                    value={formData.apply_email}
                    onChange={handleChange}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField 
                    id="age" 
                    type="number" 
                    label={t('contact.application.age')} 
                    placeholder={t('contact.application.age_placeholder')}
                    value={formData.age}
                    onChange={handleChange}
                />
                <InputField
                    id="height"
                    label={t('contact.application.height')}
                    placeholder={t('contact.application.height_placeholder')}
                    value={formData.height}
                    onChange={handleChange}
                />
            </div>
            <InputField
                id="apply_location"
                label={t('contact.application.location')}
                placeholder={t('contact.application.location_placeholder')}
                value={formData.apply_location}
                onChange={handleChange}
            />
            <InputField
                id="portfolio"
                type="url"
                label={t('contact.application.portfolio')}
                placeholder={t('contact.application.portfolio_placeholder')}
                value={formData.portfolio}
                onChange={handleChange}
            />
            <p className="text-xs text-text-muted leading-relaxed">
                {t('contact.application.note')}
            </p>
            <button
                type="submit"
                className="w-full px-8 py-4 bg-gold-accent text-background text-sm font-bold uppercase tracking-[0.2em] hover:bg-white transition-all duration-300 transform active:scale-[0.98]"
            >
                {t('contact.application.submit')}
            </button>
        </form>
    );
};

const ContactPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("booking");

    const TabButton: React.FC<{ tabName: string; label: string }> = ({
        tabName,
        label,
    }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 py-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] transition-all relative ${
                activeTab === tabName ? "text-gold-accent" : "text-text-muted hover:text-text-primary"
            }`}
        >
            {label}
            {activeTab === tabName && (
                <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-accent" 
                />
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Elite Hero Header */}
            <div className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 scale-105"
                    style={{ backgroundImage: `url("/Site_Pics/Model_pics_together/114.jpeg")` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/40 to-background"></div>
                
                <div className="relative z-10 text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    >
                        <h1 className="text-6xl md:text-9xl font-serif text-white mb-6 tracking-tight drop-shadow-2xl">
                            {t('contact.title')}
                        </h1>
                        <div className="w-24 h-[1px] bg-gold-accent/60 mx-auto mb-6" />
                        <p className="max-w-2xl mx-auto text-text-muted text-[10px] md:text-xs font-bold uppercase tracking-[0.8em] leading-relaxed opacity-80">
                            {t('contact.subtitle')}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-7xl -mt-24 relative z-20">
                {/* Visual Accent Grid - Perfectly Symmetrical */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 h-[300px] md:h-[400px]">
                    {[125, 98, 100].map((imgNum, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="overflow-hidden rounded-2xl group relative"
                        >
                            <img 
                                src={`/Site_Pics/Model_pics_together/${imgNum}.jpeg`} 
                                className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[2s] ease-out"
                                alt={`Model group ${i+1}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </motion.div>
                    ))}
                </div>

                {/* Main Content: Perfectly Balanced 1:1 Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
                    
                    {/* Module Left: Information & Connect */}
                    <div className="space-y-12">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-surface/40 backdrop-blur-2xl border border-white/5 p-10 md:p-14 rounded-3xl space-y-16"
                        >
                            {/* Contact Details */}
                            <section className="space-y-10 text-center md:text-left">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-accent flex items-center gap-4 justify-center md:justify-start">
                                    <span className="w-12 h-[1px] bg-gold-accent/30" />
                                    {t('contact.info.title')}
                                </h2>
                                <div className="space-y-10">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                                        <div className="p-4 bg-white/5 rounded-2xl text-gold-accent">
                                            <MailIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] uppercase tracking-widest text-text-muted mb-2">{t('contact.info.general')}</h3>
                                            <p className="text-white text-lg font-serif tracking-wide italic">info@vbmodels.com</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                                        <div className="p-4 bg-white/5 rounded-2xl text-gold-accent">
                                            <PhoneIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] uppercase tracking-widest text-text-muted mb-2">{t('contact.info.booking')}</h3>
                                            <p className="text-white text-lg font-serif tracking-wide italic">+359 89 777 7373</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-white/5" />

                            {/* Offices */}
                            <section className="space-y-10">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold-accent flex items-center gap-4 justify-center md:justify-start">
                                    <span className="w-12 h-[1px] bg-gold-accent/30" />
                                    {t('contact.offices.title')}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                    <div className="text-center md:text-left space-y-3">
                                        <h3 className="text-xl font-serif text-white">{t('contact.offices.sofia.city')}</h3>
                                        <p className="text-sm text-text-muted leading-relaxed font-light">{t('contact.offices.sofia.address')}</p>
                                    </div>
                                    <div className="text-center md:text-left space-y-3">
                                        <h3 className="text-xl font-serif text-white">{t('contact.offices.london.city')}</h3>
                                        <p className="text-sm text-text-muted leading-relaxed font-light">{t('contact.offices.london.address')}</p>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-white/5" />

                            {/* Socials */}
                            <section className="flex flex-wrap justify-center md:justify-start gap-10">
                                <SocialLink href="#" icon={<InstagramIcon className="w-5 h-5" />} label={t('contact.socials.instagram')} />
                                <SocialLink href="#" icon={<TwitterIcon className="w-5 h-5" />} label={t('contact.socials.twitter')} />
                                <SocialLink href="#" icon={<LinkedInIcon className="w-5 h-5" />} label={t('contact.socials.linkedin')} />
                            </section>
                        </motion.div>
                    </div>

                    {/* Module Right: Interaction Tabs & Form */}
                    <div className="space-y-12">
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-surface/40 backdrop-blur-2xl border border-gold-accent/10 p-10 md:p-14 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-accent/5 blur-[120px] rounded-full" />
                            
                            {/* Tabs Header */}
                            <div className="flex border-b border-white/5 mb-14">
                                <TabButton tabName="booking" label={t('contact.tabs.booking')} />
                                <TabButton tabName="application" label={t('contact.tabs.application')} />
                            </div>
                            
                            {/* Form Switcher */}
                            <div className="relative z-10 transition-all duration-500">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        {activeTab === "booking" ? <BookingForm /> : <ApplicationForm />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const SocialLink: React.FC<{ href: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => (
    <a href={href} className="flex items-center gap-3 group transition-all">
        <div className="p-2 rounded-lg bg-white/0 group-hover:bg-white/5 text-text-muted group-hover:text-gold-accent transition-all">
            {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-white transition-colors">{label}</span>
    </a>
);

export default ContactPage;
