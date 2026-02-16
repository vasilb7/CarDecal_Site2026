import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { VerifiedIcon } from './IconComponents';
import { useToast } from '../hooks/useToast';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, profile, signOut, isVerified, activePlan } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();

    const getPlanDisplay = (planId: string | null) => {
        if (!planId) return null;
        const id = planId.toLowerCase();
        if (id === 'scouting' || id === 'starter') return 'STARTER';
        if (id === 'casting' || id === 'pro') return 'PRO';
        if (id === 'campaign' || id.includes('director')) return 'DIRECTOR’S CHOICE';
        return planId.toUpperCase();
    };
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
        setIsProfileMenuOpen(false);
    }, [location.pathname]);

    // ─────────────────────────────────────────────────────────────────────────
    // LOGO CONFIGURATION - Регулирайте размерите на логото тук
    // ─────────────────────────────────────────────────────────────────────────
    const logoConfig = {
        src: "/Site_Pics/Homepage/logo.png",
        height: "h-12 md:h-16",        // Перфектен баланс за мобилни и десктоп
        aspect: "aspect-[1080/617]",   // Точната пропорция за вашия файл
        scaleX: "scale-x-[1.0]",       
        scaleY: "scale-y-[1.0]",       
        translateY: "translate-y-0",  
    };

    const handleLogoClick = (e: React.MouseEvent) => {
        if (location.pathname === `/${i18n.language.split('-')[0]}` || location.pathname === `/${i18n.language.split('-')[0]}/`) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `relative text-xl md:text-sm uppercase tracking-[0.3em] font-light transition-all duration-500 hover:text-gold-accent ${isActive ? 'text-gold-accent' : 'text-white'}`;

    const closeMenu = () => setIsMenuOpen(false);
    
    // Safety check for current language to avoid broken links
    const rawLang = i18n.language?.split("-")[0];
    const currentLang = ["bg", "en"].includes(rawLang) ? rawLang : "bg";
    
    const menuLinks = [
        { path: `/${currentLang}/models`, label: t('nav.models') },
        { path: `/${currentLang}/about`, label: t('nav.about') },
        { path: `/${currentLang}/services`, label: t('nav.services') },
        { path: `/${currentLang}/pricing`, label: t('nav.pricing') },
        { path: `/${currentLang}/blog`, label: t('nav.contributions') },
        { path: `/${currentLang}/contact`, label: t('nav.contact') },
    ];

    const containerVars = {
        initial: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
        animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
    };

    const linkVars: any = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
        exit: { opacity: 0, y: 20, transition: { duration: 0.3 } }
    };

    return (
        <header className="sticky top-0 z-[100] w-full bg-background/90 backdrop-blur-md border-b border-white/5 pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto px-6 pl-[calc(1.5rem+env(safe-area-inset-left))] pr-[calc(1.5rem+env(safe-area-inset-right))] py-4 flex items-center justify-between relative h-20">
                <Link 
                    to={`/${currentLang}`} 
                    onClick={(e) => { handleLogoClick(e); closeMenu(); }}
                    className="hover:brightness-125 transition-all shrink-0 z-[110]"
                >
                    <div className={cn(
                        "relative flex items-center justify-center",
                        logoConfig.scaleX,
                        logoConfig.scaleY,
                        logoConfig.translateY
                    )}>
                        <img 
                            src={logoConfig.src} 
                            alt="VB Logo" 
                            className={cn(
                                logoConfig.height,
                                logoConfig.aspect,
                                "w-auto object-contain"
                            )}
                        />
                    </div>
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
                    {user && activePlan && (
                        <div className="flex items-center px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/70">
                                {getPlanDisplay(activePlan)}
                            </span>
                        </div>
                    )}
                    {user ? (
                        <div className="relative">
                            <button 
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-gold-accent transition-colors focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-surface border border-white/20 flex items-center justify-center overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <img 
                                            src={profile.avatar_url} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )}
                                </div>
                                <span className="hidden xl:inline-block max-w-[120px] truncate">
                                    {profile?.full_name || profile?.username || user.email?.split('@')[0]}
                                </span>
                                {isVerified && <VerifiedIcon className="w-3.5 h-3.5" />}
                                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isProfileMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-4 w-48 bg-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                                    >
                                        <div className="py-2">
                                            <div className="px-4 py-3 border-b border-white/5 mb-1">
                                                <p className="text-[10px] text-text-muted uppercase tracking-wider">Signed in as</p>
                                                <p className="text-xs text-white truncate font-medium mt-1">{user.email}</p>
                                            </div>
                                            
                                            <Link 
                                                to={`/${currentLang}/profile`} 
                                                onClick={() => setIsProfileMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-text-primary hover:bg-white/5 hover:text-gold-accent transition-colors"
                                            >
                                                <User className="w-3.5 h-3.5" />
                                                {t('nav.profile')}
                                            </Link>
                                            
                                            <button 
                                                 onClick={async () => { 
                                                     await signOut(); 
                                                     setIsProfileMenuOpen(false);
                                                     showToast(t('toast.logout_success'), "success");
                                                 }}
                                                 className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-text-primary hover:bg-white/5 hover:text-red-400 transition-colors text-left"
                                             >
                                                <LogOut className="w-3.5 h-3.5" />
                                                {t('nav.logout')}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <NavLink to={`/${currentLang}/login`} className="text-xs uppercase tracking-widest text-white hover:text-gold-accent transition-colors">
                            {t('nav.login')}
                        </NavLink>
                    )}
                    


                    <LanguageSwitcher />
                    <Link to={`/${currentLang}/book-now`} className="px-6 py-2 border border-gold-accent text-gold-accent text-xs uppercase tracking-widest hover:bg-gold-accent hover:text-background transition-colors duration-300">
                        {t('nav.book_now')}
                    </Link>
                </div>

                {/* Mobile & Tablet Controls - Always shown on detected devices */}
                <div className={`${(isMobileOrTablet) ? 'flex' : 'lg:hidden'} items-center gap-5 z-[110]`}>
                    {user && activePlan && (
                        <div className="flex items-center px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">
                                {getPlanDisplay(activePlan)}
                            </span>
                        </div>
                    )}
                    {user && (
                         <Link to={`/${currentLang}/profile`} className="relative flex items-center justify-center w-9 h-9 rounded-full border border-white/20 bg-white/5 text-white hover:border-gold-accent hover:text-gold-accent transition-all duration-300 overflow-hidden">
                             {profile?.avatar_url ? (
                                 <img 
                                     src={profile.avatar_url} 
                                     alt="Profile" 
                                     className="w-full h-full object-cover"
                                 />
                             ) : (
                                 <User className="w-6 h-6 sm:w-4 sm:h-4" />
                             )}
                             {isVerified && (
                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                                    <VerifiedIcon className="w-3 h-3" />
                                </div>
                             )}
                         </Link>
                    )}
                    


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
                            className={`fixed inset-0 bg-[#0a0a0a] ${(isMobileOrTablet) ? '' : 'lg:hidden'} z-[100] flex flex-col items-center justify-start min-h-[100dvh] w-screen overflow-y-auto pt-24 pb-12`}
                        >
                            <motion.nav 
                                variants={containerVars}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="flex flex-col items-center space-y-7 px-6 text-center w-full"
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
                                
                                <motion.div variants={linkVars} className="flex flex-col items-center space-y-5">
                                    {user ? (
                                        <>
                                            <span className="text-white/40 uppercase tracking-[0.2em] text-[10px] mb-1">
                                                {user.email}
                                            </span>
                                            <Link 
                                                to={`/${currentLang}/profile`}
                                                onClick={closeMenu}
                                                className="flex items-center gap-2 text-gold-accent uppercase tracking-[0.2em] text-sm hover:text-white transition-colors"
                                            >
                                                <User className="w-4 h-4" />
                                                {t('nav.profile')}
                                            </Link>
                                            <button 
                                                 onClick={async () => { 
                                                     await signOut(); 
                                                     closeMenu(); 
                                                     showToast(t('toast.logout_success'), "success");
                                                 }} 
                                                 className="flex items-center gap-2 text-white/60 uppercase tracking-[0.2em] text-sm hover:text-red-400 transition-colors"
                                             >
                                                <LogOut className="w-4 h-4" />
                                                {t('nav.logout')}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <NavLink to={`/${currentLang}/login`} onClick={closeMenu} className="text-white/60 uppercase tracking-[0.2em] text-sm hover:text-white transition-colors">
                                                {t('nav.login')}
                                            </NavLink>
                                            <NavLink to={`/${currentLang}/register`} onClick={closeMenu} className="text-white/60 uppercase tracking-[0.2em] text-sm hover:text-white transition-colors">
                                                {t('nav.register')}
                                            </NavLink>
                                        </>
                                    )}
                                </motion.div>

                                <motion.div variants={linkVars} className="pt-6">
                                    <Link 
                                        to={`/${currentLang}/book-now`} 
                                        onClick={closeMenu} 
                                        className="inline-block px-10 py-4 bg-gold-accent text-background text-[11px] font-bold uppercase tracking-[0.3em] rounded-full hover:scale-105 transition-transform"
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
