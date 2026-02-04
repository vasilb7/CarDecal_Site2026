import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

    // DEVICE DETECTION (Mobile/Tablet)
    useEffect(() => {
        const checkDevice = () => {
            const ua = navigator.userAgent;
            const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua);
            const isMobile = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpwOS)/i.test(ua);
            
            // Special check for modern iPads that report as Macintosh
            const isIPad = navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent);
            
            setIsMobileOrTablet(isTablet || isMobile || isIPad);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    // LOCK BODY SCROLL
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.touchAction = 'auto';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.touchAction = 'auto';
        };
    }, [isMenuOpen]);

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const logoHeightClass = "h-8 md:h-8"; 

    const handleLogoClick = (e: React.MouseEvent) => {
        if (location.pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `relative text-xl md:text-sm uppercase tracking-[0.3em] font-light transition-all duration-500 hover:text-gold-accent ${isActive ? 'text-gold-accent' : 'text-white'}`;

    const closeMenu = () => setIsMenuOpen(false);

    const menuLinks = [
        { path: '/models', label: t('nav.models') },
        { path: '/about', label: t('nav.about') },
        { path: '/services', label: t('nav.services') },
        { path: '/pricing', label: t('nav.pricing') },
        { path: '/contributions', label: t('nav.contributions') },
        { path: '/contact', label: t('nav.contact') },
    ];

    const containerVars = {
        initial: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
        animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
    };

    const linkVars = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
        exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
    };

    return (
        <header className="sticky top-0 z-[100] w-full bg-background/90 backdrop-blur-md border-b border-white/5 pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto px-6 pl-[calc(1.5rem+env(safe-area-inset-left))] pr-[calc(1.5rem+env(safe-area-inset-right))] py-4 flex items-center justify-between relative h-20">
                <Link 
                    to="/" 
                    onClick={(e) => { handleLogoClick(e); closeMenu(); }}
                    className="hover:opacity-80 transition-all shrink-0 z-[110]"
                >
                    <img 
                        src="/Site_Pics/Homepage/logo.png" 
                        alt="VB Logo" 
                        className={`${logoHeightClass} w-auto object-contain transition-transform duration-300 hover:scale-105`}
                    />
                </Link>

                {/* Desktop Nav - Hidden on mobile, tablets, and forced detection */}
                <nav className={`${(isMobileOrTablet) ? 'hidden' : 'hidden lg:flex'} items-center space-x-12 ml-16 flex-grow`}>
                    {menuLinks.map(link => (
                        <NavLink key={link.path} to={link.path} className={({ isActive }) =>
                            `relative text-xs uppercase tracking-widest transition-colors duration-300 hover:text-gold-accent ${isActive ? 'text-gold-accent' : 'text-text-primary'
                            } after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-full after:h-[1px] after:bg-gold-accent after:transition-transform after:duration-300 after:scale-x-0 ${isActive ? 'after:scale-x-100' : 'hover:after:scale-x-50'}`
                        }>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className={`${(isMobileOrTablet) ? 'hidden' : 'hidden lg:flex'} items-center space-x-6 shrink-0 ml-auto`}>
                    <NavLink to="/login" className="text-xs uppercase tracking-widest text-white hover:text-gold-accent transition-colors">
                        {t('nav.login')}
                    </NavLink>
                    <LanguageSwitcher />
                    <Link to="/book-now" className="px-6 py-2 border border-gold-accent text-gold-accent text-xs uppercase tracking-widest hover:bg-gold-accent hover:text-background transition-colors duration-300">
                        {t('nav.book_now')}
                    </Link>
                </div>

                {/* Mobile & Tablet Controls - Always shown on detected devices */}
                <div className={`${(isMobileOrTablet) ? 'flex' : 'lg:hidden'} items-center gap-6 z-[110]`}>
                    <LanguageSwitcher />
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-white focus:outline-none p-2 w-10 h-10 flex flex-col justify-center items-center gap-1.5"
                        aria-label="Toggle menu"
                    >
                        <motion.span 
                            animate={isMenuOpen ? { rotate: 45, y: 7.5 } : { rotate: 0, y: 0 }}
                            className="w-6 h-[1.5px] bg-white block rounded-full"
                        />
                        <motion.span 
                            animate={isMenuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                            className="w-6 h-[1.5px] bg-white block rounded-full origin-right"
                        />
                        <motion.span 
                            animate={isMenuOpen ? { rotate: -45, y: -7.5 } : { rotate: 0, y: 0 }}
                            className="w-6 h-[1.5px] bg-white block rounded-full"
                        />
                    </button>
                </div>

                {/* Mobile & Tablet Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`fixed inset-0 bg-background ${(isMobileOrTablet) ? '' : 'lg:hidden'} z-[100] flex flex-col items-center justify-center h-screen w-screen overflow-hidden`}
                        >
                            <motion.nav 
                                variants={containerVars}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="flex flex-col items-center space-y-8 px-6 text-center"
                            >
                                {menuLinks.map((link) => (
                                    <motion.div key={link.path} variants={linkVars}>
                                        <NavLink 
                                            to={link.path} 
                                            onClick={closeMenu} 
                                            className={navLinkClasses}
                                        >
                                            {link.label}
                                        </NavLink>
                                    </motion.div>
                                ))}
                                
                                <motion.div variants={linkVars} className="w-24 h-[1px] bg-gold-accent/30 my-4" />
                                
                                <motion.div variants={linkVars} className="flex flex-col items-center space-y-6">
                                    <NavLink to="/login" onClick={closeMenu} className="text-white/60 uppercase tracking-[0.2em] text-sm hover:text-white transition-colors">
                                        {t('nav.login')}
                                    </NavLink>
                                    <NavLink to="/register" onClick={closeMenu} className="text-white/60 uppercase tracking-[0.2em] text-sm hover:text-white transition-colors">
                                        {t('nav.register')}
                                    </NavLink>
                                </motion.div>

                                <motion.div variants={linkVars} className="pt-8">
                                    <Link 
                                        to="/book-now" 
                                        onClick={closeMenu} 
                                        className="px-12 py-5 bg-gold-accent text-background text-xs font-bold uppercase tracking-[0.4em] rounded-full hover:scale-105 transition-transform"
                                    >
                                        {t('nav.book_now')}
                                    </Link>
                                </motion.div>
                            </motion.nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

export default Header;
