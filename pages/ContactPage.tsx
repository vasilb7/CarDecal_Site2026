import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import SEO from "../components/SEO";

const ContactPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 pt-24 pb-8 relative overflow-hidden mt-16 lg:mt-0">
            <SEO title="Контакти" />
            
            {/* Subtle Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-5xl w-full z-10">
                {/* Header Information */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16 md:mb-24"
                >
                    <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight mb-6">
                        {t('contact.title', 'Свържете се с нас')}
                    </h1>
                    <p className="text-white/60 text-lg md:text-xl font-light max-w-2xl mx-auto px-4">
                        Ние сме изцяло онлайн базиран бизнес, посветен на това да предоставим най-доброто качество, където и да се намирате.
                    </p>
                </motion.div>

                {/* Contact Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    
                    {/* Phone Card */}
                    <motion.a 
                        href="tel:+359894789942"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="group flex flex-col items-center text-center p-8 md:p-12 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 hover:bg-gradient-to-b hover:from-white/[0.04] hover:to-transparent transition-all duration-500 shadow-2xl shadow-black/50 overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-colors duration-500 z-0" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-500 border border-white/5 group-hover:border-red-500/30 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                <Phone className="w-6 h-6 text-white group-hover:text-red-400 transition-colors" />
                            </div>
                            <h3 className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-4">Телефон</h3>
                            <p className="text-xl md:text-2xl font-light text-white group-hover:text-red-400 transition-colors tracking-wide">089 478 9942</p>
                            <span className="text-[10px] text-white/30 tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 uppercase">Обадете се</span>
                        </div>
                    </motion.a>

                    {/* Email Card */}
                    <motion.a 
                        href="mailto:cardecal@abv.bg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="group flex flex-col items-center text-center p-8 md:p-12 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 hover:bg-gradient-to-b hover:from-white/[0.04] hover:to-transparent transition-all duration-500 shadow-2xl shadow-black/50 overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-colors duration-500 z-0" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-500 border border-white/5 group-hover:border-red-500/30 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                <Mail className="w-6 h-6 text-white group-hover:text-red-400 transition-colors" />
                            </div>
                            <h3 className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-4">Имейл</h3>
                            <p className="text-[17px] md:text-xl font-light text-white group-hover:text-red-400 transition-colors tracking-wide">cardecal@abv.bg</p>
                            <span className="text-[10px] text-white/30 tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 uppercase">Изпратете запитване</span>
                        </div>
                    </motion.a>

                    {/* Location Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="group flex flex-col items-center text-center p-8 md:p-12 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.03] transition-all duration-500 shadow-2xl shadow-black/50 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500 z-0" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em] mb-4">Местоположение</h3>
                            <p className="text-xl md:text-2xl font-light text-white tracking-wide">Варна, България</p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default ContactPage;
