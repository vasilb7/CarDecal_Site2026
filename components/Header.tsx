import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `relative text-sm uppercase tracking-widest transition-colors duration-300 hover:text-gold-accent ${isActive ? 'text-gold-accent' : 'text-text-primary'
        } after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-full after:h-[1px] after:bg-gold-accent after:transition-transform after:duration-300 after:scale-x-0 ${isActive ? 'after:scale-x-100' : 'hover:after:scale-x-50'}`;


    const navLinks = (
        <>
            <NavLink to="/models" className={navLinkClasses}>{t('nav.models')}</NavLink>
            <NavLink to="/about" className={navLinkClasses}>{t('nav.about')}</NavLink>
            <NavLink to="/services" className={navLinkClasses}>{t('nav.services')}</NavLink>
            <NavLink to="/pricing" className={navLinkClasses}>{t('nav.pricing')}</NavLink>
            <NavLink to="/contact" className={navLinkClasses}>{t('nav.contact')}</NavLink>
        </>
    );

    return (
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center relative">
                <Link to="/" className="hover:opacity-80 transition-all shrink-0">
                    <img 
                        src="/Stock Photos/Homepage/logo.png" 
                        alt="VB Logo" 
                        className="h-8 md:h-10 w-auto object-contain transition-transform duration-300 hover:scale-105"
                    />
                </Link>

                <nav className="hidden md:flex items-center space-x-10 absolute left-1/2 -translate-x-1/2">
                    {navLinks}
                </nav>

                <div className="hidden md:flex items-center space-x-6 shrink-0">
                    <NavLink to="/login" className={navLinkClasses}>
                        {t('nav.login')}
                    </NavLink>
                    <NavLink to="/register" className={navLinkClasses}>
                        {t('nav.register')}
                    </NavLink>
                    <LanguageSwitcher />
                    <Link to="/contact" className="px-6 py-2 border border-gold-accent text-gold-accent text-sm uppercase tracking-widest hover:bg-gold-accent hover:text-background transition-colors duration-300">
                        {t('nav.book_now')}
                    </Link>
                </div>

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden text-text-primary focus:outline-none flex items-center gap-4"
                >
                    <LanguageSwitcher />
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                    </svg>
                </button>
            </div>
            {isMenuOpen && (
                <div className="md:hidden bg-surface">
                    <nav className="flex flex-col items-center space-y-6 py-8">
                        {navLinks}
                        <NavLink to="/login" className={navLinkClasses}>
                            {t('nav.login')}
                        </NavLink>
                        <NavLink to="/register" className={navLinkClasses}>
                            {t('nav.register')}
                        </NavLink>
                        <Link to="/contact" className="mt-4 px-6 py-2 border border-gold-accent text-gold-accent text-sm uppercase tracking-widest hover:bg-gold-accent hover:text-background transition-colors duration-300">
                            {t('nav.book_now')}
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
