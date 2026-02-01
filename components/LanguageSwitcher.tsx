import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language.split('-')[0]; // Handle cases like 'en-US'

    const toggleLanguage = () => {
        const nextLang = currentLang === 'en' ? 'bg' : 'en';
        i18n.changeLanguage(nextLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="relative px-3 py-1 flex items-center gap-2 group overflow-hidden border border-gold-accent/30 hover:border-gold-accent transition-colors duration-300"
            title={currentLang === 'en' ? 'Switch to Bulgarian' : 'Превключи на английски'}
        >
            <AnimatePresence mode="wait">
                <motion.span
                    key={currentLang}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs uppercase tracking-[0.2em] font-medium text-gold-accent"
                >
                    {currentLang === 'en' ? 'EN' : 'BG'}
                </motion.span>
            </AnimatePresence>
            
            {/* Hover effect background */}
            <div className="absolute inset-0 bg-gold-accent transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
        </button>
    );
};

export default LanguageSwitcher;
