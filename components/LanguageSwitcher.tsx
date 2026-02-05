import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const BulgarianFlag = () => (
    <svg width="20" height="20" viewBox="0 0 32 32" className="rounded-full shadow-sm">
        <defs>
            <clipPath id="circle-bg">
                <circle cx="16" cy="16" r="16" />
            </clipPath>
        </defs>
        <g clipPath="url(#circle-bg)">
            <rect width="32" height="10.67" fill="#FFFFFF"/>
            <rect y="10.67" width="32" height="10.67" fill="#00966E"/>
            <rect y="21.34" width="32" height="10.67" fill="#D62612"/>
        </g>
    </svg>
);

const EnglishFlag = () => (
    <svg width="20" height="20" viewBox="0 0 32 32" className="rounded-full shadow-sm">
        <defs>
            <clipPath id="circle-uk">
                <circle cx="16" cy="16" r="16" />
            </clipPath>
        </defs>
        <g clipPath="url(#circle-uk)">
            <rect width="32" height="32" fill="#012169"/>
            <path d="M0 0l32 32M32 0L0 32" stroke="#FFFFFF" strokeWidth="4"/>
            <path d="M0 0l32 32M32 0L0 32" stroke="#C8102E" strokeWidth="2.5"/>
            <path d="M16 0v32M0 16h32" stroke="#FFFFFF" strokeWidth="6"/>
            <path d="M16 0v32M0 16h32" stroke="#C8102E" strokeWidth="4"/>
        </g>
    </svg>
);

import { useNavigate, useLocation } from 'react-router-dom';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const currentLang = i18n.language.split('-')[0];

    const toggleLanguage = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextLang = currentLang === 'en' ? 'bg' : 'en';
        
        // Update URL to include the new language prefix
        const pathParts = location.pathname.split('/');
        // pathParts looks like ["", "bg", "models", "slug"]
        if (pathParts[1] === 'bg' || pathParts[1] === 'en') {
            pathParts[1] = nextLang;
        } else {
            // If for some reason there is no prefix, add it
            pathParts.splice(1, 0, nextLang);
        }
        
        const newPath = pathParts.join('/') || `/${nextLang}`;
        navigate(newPath);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="group active-pulse flex items-center justify-center relative p-1 transition-transform active:scale-95"
            title={currentLang === 'en' ? 'Превключи на български' : 'Switch to English'}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentLang}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center shadow-lg rounded-full border border-white/10"
                >
                    {currentLang === 'en' ? <EnglishFlag /> : <BulgarianFlag />}
                </motion.div>
            </AnimatePresence>
            
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gold-accent scale-x-0 gold-line transition-transform duration-300" />
        </button>
    );
};

export default LanguageSwitcher;
