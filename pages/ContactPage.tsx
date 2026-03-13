import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import SEO from "../components/SEO";

const ContactPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-start px-4 pt-24 md:pt-32 pb-24 relative overflow-hidden mt-16 lg:mt-0">
            <SEO title="Контакти" />
            
            {/* Royal Background Pattern Overlay */}
            <div 
                className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
                style={{ 
                    backgroundImage: "url('/royal.png')", 
                    backgroundRepeat: "repeat",
                    backgroundSize: "300px",
                    filter: "brightness(0.5) contrast(1.2)"
                }}
            />

            <div className="max-w-5xl w-full z-10">
                {/* Header Information */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12 md:mb-16"
                >
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white tracking-tight mb-4 drop-shadow-md">
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
                        variants={{
                            initial: { opacity: 0, y: 20 },
                            hover: { scale: 1.02 }
                        }}
                        initial="initial"
                        whileHover="hover"
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="group flex flex-col items-center text-center p-8 md:p-10 rounded-[2rem] bg-[#111] border border-white/5 hover:border-[#C5A059]/40 transition-all duration-500 shadow-2xl overflow-hidden relative cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-[#C5A059]/0 group-hover:bg-[#C5A059]/5 transition-colors duration-500 z-0" />
                        <div className="relative z-10 flex flex-col items-center w-full">
                            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6 border border-[#C5A059]/20 group-hover:scale-110 group-hover:border-[#C5A059]/60 transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_20px_rgba(197,160,89,0.2)]">
                                <motion.div
                                    variants={{
                                        hover: {
                                            rotate: [0, -10, 10, -10, 10, 0],
                                            transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.1 }
                                        }
                                    }}
                                >
                                    <Phone className="w-6 h-6 text-[#C5A059]" />
                                </motion.div>
                            </div>
                            <h3 className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-3">Телефон</h3>
                            <p className="text-xl md:text-2xl font-serif text-white group-hover:text-[#C5A059] transition-colors tracking-wide">089 478 9942</p>
                            <div className="h-[1px] w-12 bg-[#C5A059]/30 mt-6 group-hover:w-24 group-hover:bg-[#C5A059] transition-all duration-500" />
                        </div>
                    </motion.a>

                    {/* Email Card */}
                    <motion.a 
                        href="mailto:cardecal@abv.bg"
                        variants={{
                            initial: { opacity: 0, y: 20 },
                            hover: { scale: 1.02 }
                        }}
                        initial="initial"
                        whileHover="hover"
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="group flex flex-col items-center text-center p-8 md:p-10 rounded-[2rem] bg-[#111] border border-white/5 hover:border-[#C5A059]/40 transition-all duration-500 shadow-2xl overflow-hidden relative cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-[#C5A059]/0 group-hover:bg-[#C5A059]/5 transition-colors duration-500 z-0" />
                        <div className="relative z-10 flex flex-col items-center w-full">
                            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6 border border-[#C5A059]/20 group-hover:scale-110 group-hover:border-[#C5A059]/60 transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_20px_rgba(197,160,89,0.2)]">
                                <motion.div
                                    variants={{
                                        hover: {
                                            rotateY: 180,
                                            scale: 1.1,
                                            transition: { duration: 0.6, type: "spring", stiffness: 200 }
                                        }
                                    }}
                                >
                                    <Mail className="w-6 h-6 text-[#C5A059]" />
                                </motion.div>
                            </div>
                            <h3 className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-3">Имейл</h3>
                            <p className="text-[17px] md:text-xl font-serif text-white group-hover:text-[#C5A059] transition-colors tracking-wide">cardecal@abv.bg</p>
                            <div className="h-[1px] w-12 bg-[#C5A059]/30 mt-6 md:mt-[27px] group-hover:w-24 group-hover:bg-[#C5A059] transition-all duration-500" />
                        </div>
                    </motion.a>

                    {/* Location Card */}
                    <motion.div 
                        variants={{
                            initial: { opacity: 0, y: 20 },
                            hover: { scale: 1.02 }
                        }}
                        initial="initial"
                        whileHover="hover"
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="group flex flex-col items-center text-center p-8 md:p-10 rounded-[2rem] bg-[#111] border border-white/5 hover:border-[#C5A059]/40 transition-all duration-500 shadow-2xl overflow-hidden relative cursor-default"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-[#C5A059]/0 group-hover:bg-[#C5A059]/5 transition-colors duration-500 z-0" />
                        <div className="relative z-10 flex flex-col items-center w-full">
                            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6 border border-[#C5A059]/20 group-hover:scale-110 group-hover:border-[#C5A059]/60 transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_20px_rgba(197,160,89,0.2)]">
                                <motion.div
                                    variants={{
                                        hover: {
                                            y: [0, -10, 0],
                                            scale: [1, 1.2, 1],
                                            transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.2 }
                                        }
                                    }}
                                >
                                    <MapPin className="w-6 h-6 text-[#C5A059]" />
                                </motion.div>
                            </div>
                            <h3 className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-3">Местоположение</h3>
                            <p className="text-xl md:text-2xl font-serif text-white group-hover:text-[#C5A059] transition-colors tracking-wide">Варна, България</p>
                            <div className="h-[1px] w-12 bg-[#C5A059]/30 mt-6 group-hover:w-24 group-hover:bg-[#C5A059] transition-all duration-500" />
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default ContactPage;
