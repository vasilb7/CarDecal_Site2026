import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { InstagramIcon, TwitterIcon, LinkedInIcon } from "../components/IconComponents";
import { useToast } from "../hooks/useToast";

const UnderlinedInput: React.FC<{
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    isTextArea?: boolean;
}> = ({ id, label, type = "text", placeholder, value, onChange, isTextArea = false }) => (
    <div className="group relative pt-4">
        <label 
            htmlFor={id} 
            className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wide group-focus-within:text-gold-accent transition-colors"
        >
            {label}
        </label>
        {isTextArea ? (
            <textarea
                id={id}
                rows={1}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-transparent border-b border-white/20 py-2 text-white placeholder-white/10 focus:border-gold-accent outline-none transition-all resize-none"
            />
        ) : (
            <input
                type={type}
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-transparent border-b border-white/20 py-2 text-white placeholder-white/10 focus:border-gold-accent outline-none transition-all"
            />
        )}
    </div>
);

const ContactPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { showToast } = useToast();
    const [form, setForm] = useState({ name: "", email: "", message: "" });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Contact form submitted:", form);
        showToast(t('toast.contact_success'), "success");
        setForm({ name: "", email: "", message: "" });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center px-4 md:px-12 py-20">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Side: Image (Hidden on very small screens if preferred, or stacked) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                   className="h-[500px] md:h-[700px] w-full relative overflow-hidden hidden lg:block rounded-lg"
                >
                     <div 
                        className="absolute inset-0 bg-cover bg-left"
                        style={{ backgroundImage: `url("/Site_Pics/Contact_Page/VB.png")` }} // Using a premium model image
                    >
                        {/* Overlay to blend with dark theme if needed, or keep raw for contrast */}
                        <div className="absolute inset-0 bg-black/10" /> 
                    </div>
                </motion.div>

                {/* Right Side: Content */}
                <div className="flex flex-col justify-center h-full">
                    {/* Header: "Contact Us" */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8 md:mb-12"
                    >
                        <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight">
                            {t('contact.title')}
                        </h1>
                    </motion.div>

                    {/* The "Box" Layout from the reference */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="border-t border-l border-white/20 p-8 md:p-12 relative"
                    >
                         {/* Decorative borders to match the 'open box' or 'line' style if desired, 
                             but standard border looks cleanest for the reference. 
                             Let's stick to the reference: It has a border around the content area. */}
                         <div className="absolute top-0 right-0 w-[1px] h-full bg-white/20 hidden md:block" />
                         <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/20 block" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
                            
                            {/* Column 1: Form */}
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <UnderlinedInput 
                                    id="fullname" 
                                    label={t('contact.booking.full_name')} 
                                    value={form.name} 
                                    onChange={(e) => setForm({...form, name: e.target.value})} 
                                />
                                <UnderlinedInput 
                                    id="email" 
                                    label={t('contact.booking.email_address')} 
                                    type="email"
                                    value={form.email} 
                                    onChange={(e) => setForm({...form, email: e.target.value})} 
                                />
                                <UnderlinedInput 
                                    id="message" 
                                    label={t('contact.booking.message')} 
                                    isTextArea
                                    value={form.message} 
                                    onChange={(e) => setForm({...form, message: e.target.value})} 
                                />

                                <div className="pt-4">
                                    <button 
                                        type="submit" 
                                        className="bg-black border border-white/20 text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-gold-accent hover:text-black hover:border-gold-accent transition-all duration-300 w-full md:w-auto"
                                    >
                                        {t('contact.booking.submit')}
                                    </button>
                                </div>
                            </form>

                            {/* Column 2: Info */}
                            <div className="space-y-10 flex flex-col justify-between">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-lg font-serif text-white mb-1">{t('contact.info.title')}</h3>
                                        <a href="mailto:info@vbmodels.com" className="text-text-muted hover:text-gold-accent transition-colors text-sm">
                                            info@vbmodels.com
                                        </a>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-serif text-white mb-1">{t('contact.info.based_in')}</h3>
                                        <p className="text-text-muted text-sm leading-relaxed">
                                            Sofia, Bulgaria<br/>
                                            London, UK
                                        </p>
                                    </div>
                                </div>

                                {/* Socials at bottom right of the box area */}
                                <div className="flex gap-6 items-center">
                                    <SocialIcon href="#" icon={<InstagramIcon className="w-4 h-4" />} />
                                    <SocialIcon href="#" icon={<TwitterIcon className="w-4 h-4" />} />
                                    <SocialIcon href="#" icon={<LinkedInIcon className="w-4 h-4" />} />
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const SocialIcon: React.FC<{ href: string; icon: React.ReactNode }> = ({ href, icon }) => (
    <a href={href} className="text-text-muted hover:text-gold-accent transition-colors">
        {icon}
    </a>
);

export default ContactPage;
