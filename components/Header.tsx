import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown, Shield, X, Mail, Lock, ChevronLeft, ChevronRight, Bug } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useUI } from '../context/UIContext';
import { CartIcon } from './CartIcon';
import { CartDrawer } from './CartDrawer';

import { cn } from '../lib/utils';

const Header: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { user, profile, signOut, isAdmin, isEditor } = useAuth();
    const { showToast } = useToast();
    const { clearCart } = useCart();
    const navigate = useNavigate();
    const { settings, serverTimeOffset, isMaintenanceActive } = useSiteSettings();
    const { isMobileNavOpen: isMenuOpen, setIsMobileNavOpen: setIsMenuOpen } = useUI();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(true);
    const [timeLeftToStart, setTimeLeftToStart] = useState<string | null>(null);

    const autoStart = settings.maintenance_auto_start_at;
    const isPastAutoStart = !!autoStart && autoStart !== 'null' && new Date(autoStart).getTime() <= (Date.now() + serverTimeOffset);
    const isMaintenanceOn = isMaintenanceActive || isPastAutoStart;
    
    const [isBarManuallyClosed, setIsBarManuallyClosed] = useState(false);

    const [isMaintWarningDismissed, setIsMaintWarningDismissed] = useState(false);

    // Auto-reappear after 1 hour (3600000ms)
    useEffect(() => {
        if (isBarManuallyClosed) {
            const timer = setTimeout(() => setIsBarManuallyClosed(false), 3600000);
            return () => clearTimeout(timer);
        }
    }, [isBarManuallyClosed]);

    useEffect(() => {
        if (isMaintWarningDismissed) {
            const timer = setTimeout(() => setIsMaintWarningDismissed(false), 3600000);
            return () => clearTimeout(timer);
        }
    }, [isMaintWarningDismissed]);

    const isMaintenanceWarningActive = !!autoStart && 
        !isMaintenanceOn && 
        !isMaintWarningDismissed && 
        (new Date(autoStart).getTime() > (Date.now() + serverTimeOffset));

    const isAnnouncementVisible = settings.announcement_mode && !isBarManuallyClosed && !isMaintenanceWarningActive;
    const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
    const annMessages = (settings.announcement_text || "").split('\n').filter(m => m.trim());
    const [manualTick, setManualTick] = useState(0);

    useEffect(() => {
        if (annMessages.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentMsgIndex(prev => (prev + 1) % annMessages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [annMessages.length, manualTick]);

    const handleNextMsg = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (annMessages.length <= 1) return;
        setCurrentMsgIndex(prev => (prev + 1) % annMessages.length);
        setManualTick(curr => curr + 1);
    };

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > 20);
                    ticking = false;
                });
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handlePrevMsg = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (annMessages.length <= 1) return;
        setCurrentMsgIndex(prev => (prev - 1 + annMessages.length) % annMessages.length);
        setManualTick(curr => curr + 1);
    };

    // Body Scroll Lock & Back Button Handling for Mobile Menu
    useEffect(() => {
        if (isMenuOpen) {
            document.documentElement.classList.add('scroll-locked');
            
            // Push state for back button handling
            window.history.pushState({ modal: 'mobile-nav' }, '');
            
            const handlePopState = () => {
                setIsMenuOpen(false);
            };

            window.addEventListener('popstate', handlePopState);
            
            return () => {
                window.removeEventListener('popstate', handlePopState);
                document.documentElement.classList.remove('scroll-locked');
            };
        }
    }, [isMenuOpen]);

    const handleManualClose = () => {
        setIsMenuOpen(false);
        if (window.history.state?.modal === 'mobile-nav') {
            window.history.back();
        }
    };

    const handleCloseMenu = () => {
        setIsMenuOpen(false);
    };

    // Announcement Effect (Toast)
    useEffect(() => {
        const autoStart = settings.maintenance_auto_start_at;
        if (!autoStart || isMaintenanceOn) return;

        const seenKey = `ann_seen_${autoStart}`;
        if (sessionStorage.getItem(seenKey) !== 'true') {
            showToast("Предстои профилактика на сайта.", "info");
            sessionStorage.setItem(seenKey, 'true');
        }
    }, [settings.maintenance_auto_start_at, isMaintenanceOn]);
    
    // Active Maintenance Toast for Admins/Editors
    useEffect(() => {
        if (isMaintenanceOn && (isAdmin || isEditor)) {
            const activeKey = `maint_active_seen_${settings.maintenance_auto_start_at || 'manual'}`;
            if (sessionStorage.getItem(activeKey) !== 'true') {
                showToast("Сайтът вече е в активен режим на поддръжка.", "warning");
                sessionStorage.setItem(activeKey, 'true');
            }
        } else if (!isMaintenanceOn) {
            const keys = Object.keys(sessionStorage).filter(k => k.startsWith('maint_active_seen_'));
            keys.forEach(k => sessionStorage.removeItem(k));
        }
    }, [isMaintenanceOn, isAdmin, isEditor]);

    // Maintenance Auto-start Countdown
    useEffect(() => {
        const autoStart = settings.maintenance_auto_start_at;
        if (!autoStart) {
            setTimeLeftToStart(null);
            return;
        }

        const tick = () => {
            const now = Date.now() + serverTimeOffset;
            const target = new Date(autoStart).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeftToStart(null);
                return true;
            }

            const totalSeconds = Math.ceil(diff / 1000);
            if (totalSeconds < 60) {
                setTimeLeftToStart(`${totalSeconds} сек`);
            } else {
                const m = Math.floor(totalSeconds / 60);
                const s = totalSeconds % 60;
                setTimeLeftToStart(`${m}:${s < 10 ? '0' : ''}${s}`);
            }
            return false;
        };

        if (tick()) return;
        const interval = setInterval(() => { if (tick()) clearInterval(interval); }, 1000);
        return () => clearInterval(interval);
    }, [settings.maintenance_auto_start_at]);

    const renderMessageWithTimer = (text: string, forceTimer: boolean = false) => {
        if (!text) return null;
        const lowerText = text.toLowerCase();
        const hasPlaceholder = lowerText.includes("{timer}");
        const timerElement = timeLeftToStart ? (
            <span className="inline-flex items-center justify-center px-2 py-0.5 bg-[#ff0000] text-white text-[10px] font-black rounded font-mono ml-2 shrink-0 shadow-[0_0_12px_rgba(255,0,0,0.5)] border border-white/20 animate-pulse">
                {timeLeftToStart}
            </span>
        ) : null;

        if (!hasPlaceholder) {
            return (
                <span className="flex items-center">
                    {text}
                    {forceTimer && timerElement}
                </span>
            );
        }

        const parts = text.split(/{timer}/i);
        return (
            <span className="flex items-center flex-wrap justify-center">
                {parts[0]}
                {timerElement}
                {parts[1]}
            </span>
        );
    };

    // Performance: Close menus on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (isProfileMenuOpen) setIsProfileMenuOpen(false);
        };

        if (isProfileMenuOpen) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isProfileMenuOpen]);

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
        setIsProfileMenuOpen(false);
    }, [location.pathname]);

    const handleLogoClick = (e: React.MouseEvent) => {
        if (location.pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const closeMenu = handleCloseMenu;
    
    const menuLinks = [
        { path: `/catalog`, label: "КАТАЛОГ" },
        { path: `/promos`, label: "ПРОМОЦИИ" },
        { path: `/about`, label: "ЗА НАС" },
        { path: `/contact`, label: "КОНТАКТИ" },
    ];

    const showMaintenanceBanner = isMaintenanceOn && (isAdmin || isEditor) && isBannerVisible && !location.pathname.startsWith('/admin');

    return (
        <>
            <AnimatePresence>
                {isAnnouncementVisible && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="relative z-[101] border-b border-white/5"
                        style={{ backgroundColor: settings.announcement_bg_color }}
                    >
                        <div className="max-w-[1440px] w-full mx-auto min-h-[32px] sm:min-h-[40px] py-1 px-4 flex items-center justify-center relative">
                            <div className="flex items-center justify-center gap-3 sm:gap-6 max-w-full">
                                {annMessages.length > 1 && (
                                    <button 
                                        onClick={handlePrevMsg}
                                        className="p-1 hover:opacity-100 opacity-60 transition-all z-10 shrink-0"
                                        aria-label="Previous message"
                                    >
                                        <ChevronLeft className="w-4 h-4" strokeWidth={3} style={{ color: settings.announcement_text_color }} />
                                    </button>
                                )}

                                <div className="flex justify-center items-center min-w-0">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`msg-${currentMsgIndex}`}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.2 }}
                                            className="w-full flex items-center justify-center overflow-hidden"
                                        >
                                            <span 
                                                className="uppercase select-none text-center inline-block"
                                                style={{ color: settings.announcement_text_color }}
                                            >
                                                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider line-clamp-1 font-medium">
                                                    {renderMessageWithTimer(annMessages[currentMsgIndex] || "")}
                                                </span>
                                            </span>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {annMessages.length > 1 && (
                                    <button 
                                        onClick={handleNextMsg}
                                        className="p-1 hover:opacity-100 opacity-60 transition-all z-10 shrink-0"
                                        aria-label="Next message"
                                    >
                                        <ChevronRight className="w-4 h-4" strokeWidth={3} style={{ color: settings.announcement_text_color }} />
                                    </button>
                                )}
                            </div>

                            <button 
                                onClick={() => {
                                    setIsBarManuallyClosed(true);
                                }}
                                className="absolute right-2 sm:right-4 p-1 hover:opacity-70 transition-colors z-10 shrink-0"
                                style={{ color: settings.announcement_text_color }}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {isMaintenanceWarningActive && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="relative z-[101] bg-black border-b border-red-600/20"
                    >
                        <div className="max-w-[1440px] w-full mx-auto min-h-[32px] py-1 px-4 flex items-center justify-center relative">
                            <span className="flex items-center justify-center gap-x-3 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ff0000] animate-pulse shrink-0" />
                                {renderMessageWithTimer(settings.maintenance_warning_text || "Сайтът ще влезе в профилактика след {timer}", true)}
                            </span>
                            
                            <button 
                                onClick={() => {
                                    setIsMaintWarningDismissed(true);
                                }}
                                className="absolute right-2 sm:right-4 p-1 hover:opacity-70 transition-colors text-white/50 hover:text-white"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {showMaintenanceBanner && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-[#ff0000] relative overflow-hidden z-[101]"
                    >
                        <div className="container mx-auto px-6 py-2 flex items-center justify-center relative">
                            <span className="text-white text-[9px] md:text-[10px] uppercase font-black tracking-widest text-center animate-pulse">
                                🚨 РЕЖИМ ПОДДРЪЖКА Е ВКЛЮЧЕН (ВИДИМ САМО ЗА АДМИНИСТРАТОРИ) 🚨
                            </span>
                            <button 
                                onClick={() => setIsBannerVisible(false)}
                                className="absolute right-4 p-1 rounded-full hover:bg-black/10 transition-colors text-white/80 hover:text-white"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className={cn(
                "sticky top-0 z-[100] w-full border-b border-white/5 pt-[env(safe-area-inset-top)] transition-colors duration-500",
                (location.pathname === '/contact' || location.pathname === '/promos') && !isScrolled
                    ? "bg-transparent" 
                    : "bg-background/[0.97]"
            )}>
                <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between relative h-20 sm:h-24">
                    <Link 
                        to="/" 
                        onClick={(e) => { handleLogoClick(e); closeMenu(); }}
                        className="hover:opacity-80 transition-all shrink-0 z-[110]"
                    >
                        <img 
                            src="/LOGO.webp" 
                            alt="CarDecal Logo" 
                            fetchPriority="high"
                            className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center space-x-12 ml-16 flex-grow">
                        {menuLinks.map(link => (
                            <NavLink 
                                key={link.path} 
                                to={link.path} 
                                onClick={(e) => {
                                    if (location.pathname === link.path) {
                                        e.preventDefault();
                                    }
                                    closeMenu();
                                }}
                                className={({ isActive }) =>
                                    `relative text-xs uppercase tracking-widest transition-colors duration-300 hover:text-[#ff0000] ${isActive ? 'text-[#ff0000]' : 'text-text-primary'
                                    } after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-full after:h-[1px] after:bg-[#ff0000] after:transition-transform after:duration-300 after:scale-x-0 ${isActive ? 'after:scale-x-100' : 'hover:after:scale-x-50'}`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="hidden lg:flex items-center space-x-6 shrink-0 ml-auto">
                        <CartIcon />
                        {user ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-[#ff0000] transition-colors focus:outline-none"
                                >
                                    <div className="w-8 h-8 rounded-full bg-surface border border-white/20 flex items-center justify-center overflow-hidden">
                                        {(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                                            <img 
                                                src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
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
                                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Вписан като</p>
                                                     <p className="text-xs text-white truncate font-medium mt-1 select-none pointer-events-none">{user.email}</p>
                                                </div>
                                                
                                                <Link 
                                                    to={`/profile`} 
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-text-primary hover:bg-white/5 hover:text-[#ff0000] transition-colors"
                                                >
                                                    <User className="w-3.5 h-3.5" />
                                                    Профил
                                                </Link>

                                                {(isAdmin || isEditor) && (
                                                    <Link 
                                                        to="/admin" 
                                                        onClick={() => setIsProfileMenuOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors border-b border-white/5"
                                                    >
                                                        <Shield className="w-3.5 h-3.5" />
                                                        {isAdmin ? 'Администрация' : 'Редактор Панел'}
                                                    </Link>
                                                )}
                                                
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setIsProfileMenuOpen(false);
                                                        window.dispatchEvent(new Event('open-bug-report'));
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-[#B0BEC5] hover:bg-white/5 hover:text-white transition-colors text-left border-b border-white/5"
                                                >
                                                    <Bug className="w-3.5 h-3.5" />
                                                    Докладвай проблем
                                                </button>
                                                
                                                <button 
                                                     onClick={async () => { 
                                                         await signOut(); 
                                                         setIsProfileMenuOpen(false);
                                                         showToast(t('toast.logout_success'), "success");
                                                         navigate('/');
                                                     }}
                                                     className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-text-primary hover:bg-white/5 hover:text-red-400 transition-colors text-left"
                                                 >
                                                    <LogOut className="w-3.5 h-3.5" />
                                                    Изход
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <NavLink to={`/login`} className="text-xs uppercase tracking-widest text-white hover:text-[#ff0000] transition-colors">
                                Вход
                            </NavLink>
                        )}
                        
                        {user && (
                            <Link to={`/custom-orders`} className="px-6 py-2.5 bg-gradient-to-r from-[#3d0000] to-[#950101] border border-[#ff0000]/30 text-white text-[11px] font-medium uppercase tracking-[0.25em] hover:from-[#950101] hover:to-[#ff0000] rounded-sm transition-all duration-300 shadow-[0_0_15px_rgba(149,1,1,0.3)] hover:shadow-[0_0_20px_rgba(255,0,0,0.5)] flex items-center gap-2">
                                ИНДИВИДУАЛНИ ПОРЪЧКИ
                            </Link>
                        )}
                    </div>

                    {/* Mobile & Tablet Controls */}
                    <div className="flex lg:hidden items-center gap-2 sm:gap-4 z-[110]">
                        <CartIcon />
                        
                        <Link 
                            to={user ? "/profile" : "/login"}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
                        >
                            {user ? (
                                <div className="w-7 h-7 rounded-full bg-surface border border-white/20 flex items-center justify-center overflow-hidden">
                                    {(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                                        <img 
                                            src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={16} className="text-white" />
                                    )}
                                </div>
                            ) : (
                                <User size={22} className="text-white/80" />
                            )}
                        </Link>

                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="text-white focus:outline-none w-12 h-12 flex flex-col justify-center items-center gap-1.5 rounded-full hover:bg-white/5 transition-colors"
                            aria-label="Open menu"
                        >
                            <span className="w-8 h-[1.5px] bg-white block rounded-full" />
                            <span className="w-8 h-[1.5px] bg-white block rounded-full" />
                            <span className="w-8 h-[1.5px] bg-white block rounded-full" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile & Tablet Menu Overlay (Drawer) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            onClick={handleManualClose}
                            className="fixed inset-0 bg-black/80 z-[115] lg:hidden"
                        />

                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-[#0a0a0a] z-[120] shadow-2xl flex flex-col lg:hidden border-l border-white/5"
                        >
                            <div className="flex items-center justify-between px-6 h-20 border-b border-white/5 bg-[#0a0a0a] shrink-0 shadow-sm">
                                <img src="/LOGO.webp" alt="CarDecal Logo" className="h-6 w-auto object-contain" />
                                <button 
                                    onClick={handleManualClose}
                                    className="w-12 h-12 -mr-3 flex items-center justify-center text-white/60 hover:text-white transition-colors focus:outline-none"
                                    aria-label="Close menu"
                                >
                                    <X className="w-7 h-7" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-8 px-6 flex flex-col">
                                <nav className="flex flex-col space-y-2 mb-8">
                                    {menuLinks.map((link) => (
                                        <NavLink 
                                            key={link.path}
                                            to={link.path} 
                                            onClick={(e) => {
                                                if (location.pathname === link.path) {
                                                    e.preventDefault();
                                                }
                                                closeMenu();
                                            }}
                                            className="group"
                                        >
                                            {({ isActive }) => (
                                                <div className={`flex items-center p-3 -ml-3 rounded-xl transition-colors min-h-[48px] ${isActive ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-4 transition-colors shrink-0 ${isActive ? 'bg-red-500' : 'bg-white/10 group-hover:bg-white/30'}`} />
                                                    <span className={`text-xl uppercase tracking-widest transition-colors ${isActive ? 'text-[#E0F2F1] font-bold' : 'text-white/80 group-hover:text-white font-medium'}`}>
                                                        {link.label}
                                                    </span>
                                                </div>
                                            )}
                                        </NavLink>
                                    ))}
                                </nav>

                                <div className="w-full h-px bg-gradient-to-r from-white/10 to-transparent mb-8 shrink-0" />

                                <div className="flex flex-col space-y-1 mb-auto">
                                    {user ? (
                                        <>
                                            <Link 
                                                to={`/profile`}
                                                onClick={closeMenu}
                                                className="flex items-center gap-4 text-[#B0BEC5] hover:text-white transition-colors group p-3 -ml-3 rounded-xl hover:bg-white/5 min-h-[48px]"
                                            >
                                                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                                                    {(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                                                        <img src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                                <span className="text-base font-normal">Профил</span>
                                            </Link>
                                            
                                            {(isAdmin || isEditor) && (
                                                <Link 
                                                    to="/admin"
                                                    onClick={closeMenu}
                                                    className="flex items-center gap-4 text-[#B0BEC5] hover:text-white transition-colors p-3 -ml-3 rounded-xl hover:bg-white/5 min-h-[48px]"
                                                >
                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                        <Shield className="w-5 h-5 opacity-70" />
                                                    </div>
                                                    <span className="text-base font-normal">Администрация</span>
                                                </Link>
                                            )}
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    closeMenu();
                                                    window.dispatchEvent(new Event('open-bug-report'));
                                                }}
                                                className="flex items-center gap-4 text-[#B0BEC5] hover:text-white transition-colors p-3 -ml-3 rounded-xl hover:bg-white/5 w-full text-left min-h-[48px]"
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                    <Bug className="w-5 h-5 opacity-70" />
                                                </div>
                                                <span className="text-base font-normal">Докладвай проблем</span>
                                            </button>
                                            
                                            <button 
                                                 onClick={async () => { 
                                                     await signOut(); 
                                                     clearCart();
                                                     closeMenu(); 
                                                     showToast(t('toast.logout_success'), "success");
                                                     navigate('/');
                                                 }} 
                                                 className="flex items-center gap-4 text-white/40 hover:text-red-400 transition-colors p-3 -ml-3 rounded-xl hover:bg-white/5 text-left w-full min-h-[48px] mt-2"
                                             >
                                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                    <LogOut className="w-5 h-5" />
                                                </div>
                                                <span className="text-base font-normal">Изход</span>
                                            </button>

                                             <div className="flex items-center gap-3 text-white/30 transition-colors mt-8 p-3 -ml-3 min-h-[48px] select-none pointer-events-none">
                                                 <Mail className="w-4 h-4 shrink-0" />
                                                 <span className="text-sm font-light truncate">{user.email}</span>
                                             </div>
                                        </>
                                    ) : (
                                        <>
                                            <NavLink 
                                                to={`/login`} 
                                                onClick={closeMenu} 
                                                className="flex items-center gap-4 text-[#B0BEC5] hover:text-white transition-colors p-3 -ml-3 rounded-xl hover:bg-white/5 min-h-[56px]"
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                    <User className="w-5 h-5 opacity-70" />
                                                </div>
                                                <span className="text-base font-normal">Вход</span>
                                            </NavLink>
                                            <NavLink 
                                                to={`/register`} 
                                                onClick={closeMenu} 
                                                className="flex items-center gap-4 text-[#B0BEC5] hover:text-white transition-colors p-3 -ml-3 rounded-xl hover:bg-white/5 min-h-[56px]"
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-white/5 rounded-full">
                                                    <span className="text-xl leading-none -mt-0.5 opacity-80">+</span>
                                                </div>
                                                <span className="text-base font-normal">Регистрация</span>
                                            </NavLink>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 pb-8 border-t border-white/5 bg-gradient-to-t from-black to-[#0a0a0a] shrink-0">
                                {user && (
                                    <Link 
                                        to={`/custom-orders`} 
                                        onClick={closeMenu} 
                                        className="flex items-center justify-center gap-2 w-full px-4 py-4 md:py-5 bg-gradient-to-r from-[#3d0000] to-[#950101] border border-[#ff0000]/30 text-white text-[13px] font-bold uppercase tracking-[0.2em] rounded-xl hover:from-[#950101] hover:to-[#ff0000] transition-all duration-300 shadow-[0_4px_20px_rgba(255,0,0,0.15)] focus:scale-[0.98] active:scale-[0.98]"
                                    >
                                        ИНДИВИДУАЛНИ ПОРЪЧКИ
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <CartDrawer />
        </>
    );
};

export default Header;
