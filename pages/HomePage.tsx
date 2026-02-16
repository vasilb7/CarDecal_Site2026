
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useModels } from '../hooks/useModels';
import ModelCard from '../components/ModelCard';
import { settingsService } from '../lib/settingsService';
import type { Model } from '../types';
import { ChevronLeft } from 'lucide-react';

interface HeroSettings {
    hero_type: string;
    hero_image_url: string;
    hero_video_url: string;
    hero_grayscale: boolean;
    hero_blur: number;
    hero_brightness: number;
    hero_contrast: number;
    hero_saturation: number;
    hero_title_bg?: string;
    hero_title_en?: string;
    hero_subtitle_bg?: string;
    hero_subtitle_en?: string;
    id?: string;
}

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" }
    }
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

const evaporate: Variants = {
    initial: { opacity: 0, filter: 'blur(15px)', y: 30, scale: 0.98 },
    animate: { 
        opacity: 1, 
        filter: 'blur(0px)', 
        y: 0, 
        scale: 1,
        transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] } 
    },
    exit: { 
        opacity: 0, 
        filter: 'blur(25px)', 
        y: -50, 
        scale: 1.05,
        transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } 
    }
};

const HomePage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { getFeaturedModels, getTopModel, loading } = useModels();
    const [featuredModels, setFeaturedModels] = useState<Model[]>([]);
    const [topModel, setTopModel] = useState<Model | null>(null);
    const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(() => {
        const cached = localStorage.getItem('hero_settings');
        if (cached) {
            const parsed = JSON.parse(cached);
            return {
                ...parsed,
                hero_grayscale: parsed.hero_grayscale ?? true
            };
        }
        return null;
    });
    const isFirstRender = React.useRef(true);

    useEffect(() => {
	    isFirstRender.current = false;
    }, []);

    const [lookbookImages, setLookbookImages] = useState<string[]>([]);
    const [lookbookTitle, setLookbookTitle] = useState({ 
        titleBg: 'Lookbook Витрина', 
        titleEn: 'Lookbook Showcase', 
        descBg: '', 
        descEn: '', 
        font: 'Playfair Display',
        descFont: 'Inter'
    });
    const [lookbookId, setLookbookId] = useState<string>('initial');
    const [currentLookbookIndex, setCurrentLookbookIndex] = useState(0);
    const [isLookbookTransitioning, setIsLookbookTransitioning] = useState(true);
    const [isLookbookLocking, setIsLookbookLocking] = useState(false);

    const [currentTopIndex, setCurrentTopIndex] = useState(0);
    const [isTopTransitioning, setIsTopTransitioning] = useState(true);
    const [isTopLocking, setIsTopLocking] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [mobileScrollProgress, setMobileScrollProgress] = useState(0);
    const mobileScrollRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetch = async () => {
            const [featured, top, hSettings, lookbookData] = await Promise.all([
                getFeaturedModels(6),
                getTopModel(),
                settingsService.getActiveHeroContent() as Promise<HeroSettings>,
                settingsService.getActiveLookbookContent()
            ]);
            setFeaturedModels(featured);
            setTopModel(top);
            setHeroSettings(hSettings);
            
            // 2. Check if content actually changed to avoid unnecessary re-triggers
            if (lookbookData.id !== lookbookId) {
                setLookbookImages(lookbookData.images);
                setLookbookTitle(lookbookData.title);
                setLookbookId(lookbookData.id);
                setCurrentLookbookIndex(0);
            }
            
            localStorage.setItem('hero_settings', JSON.stringify(hSettings));
        };
        fetch();

        // 10s Timer to check for scheduled expirations without DB change
        const checkTimer = setInterval(async () => {
            const [lookbookData, hSettings] = await Promise.all([
                settingsService.getActiveLookbookContent(),
                settingsService.getActiveHeroContent()
            ]);

            if (lookbookData.id !== lookbookId) {
                setLookbookId(lookbookData.id);
                setLookbookImages(lookbookData.images);
                setLookbookTitle(lookbookData.title);
                setCurrentLookbookIndex(0);
            }

            if (JSON.stringify(hSettings) !== JSON.stringify(heroSettings)) {
                setHeroSettings(hSettings);
                localStorage.setItem('hero_settings', JSON.stringify(hSettings));
            }
        }, 10000);

        // Real-time Models update
        const channel = supabase
            .channel('public_models_home')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'models'
                },
                (payload) => {
                    // Refresh both for any change to keep it simple and accurate
                    getFeaturedModels(6).then(setFeaturedModels);
                    getTopModel().then(setTopModel);
                }
            )
            .subscribe();

        // Real-time Site Settings update (Hero & Lookbook)
        const settingsChannel = supabase
            .channel('public_site_settings_home')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'site_settings'
                },
                (payload: any) => {
                    const { key, value } = payload.new || payload.old || {};
                    
                    if (['hero_type', 'hero_image_url', 'hero_video_url', 'hero_grayscale', 'hero_blur', 'hero_brightness', 'hero_contrast', 'hero_saturation'].includes(key)) {
                        setHeroSettings(prev => {
                            let val: any = value;
                            if (key === 'hero_grayscale') val = value === 'true';
                            if (['hero_blur', 'hero_brightness', 'hero_contrast', 'hero_saturation'].includes(key)) val = parseInt(value || (key === 'hero_blur' ? '0' : '100'));
                            
                            const updated = prev ? { ...prev, [key]: val } : prev;
                            if (updated) {
                                localStorage.setItem('hero_settings', JSON.stringify(updated));
                            }
                            return updated;
                        });
                    }

                    if (key === 'lookbook_presets' || key === 'homepage_lookbook_images' || key === 'lookbook_title_config' || key === 'hero_presets') {
                        settingsService.getActiveLookbookContent().then(data => {
                            if (data.id !== lookbookId) {
                                setLookbookImages(data.images);
                                setLookbookTitle(data.title);
                                setLookbookId(data.id);
                                setCurrentLookbookIndex(0);
                            }
                        });

                        settingsService.getActiveHeroContent().then(data => {
                            if (data.id !== heroSettings?.id) {
                                setHeroSettings(data);
                                localStorage.setItem('hero_settings', JSON.stringify(data));
                            }
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(settingsChannel);
            clearInterval(checkTimer);
        };
    }, [getFeaturedModels, getTopModel, lookbookId]);


    const topImages = (topModel?.cardImages && topModel.cardImages.length > 0) 
        ? topModel.cardImages 
        : (topModel?.cardImages === undefined ? (topModel?.posts?.map(p => p.src) || []) : []);

    const extendedLookbookImages = lookbookImages.length > 0 ? [...lookbookImages, lookbookImages[0]] : [];
    const extendedTopImages = topImages.length > 0 ? [...topImages, topImages[0]] : [];

    const handleLookbookForward = () => {
        if (isLookbookLocking) return;
        setIsLookbookLocking(true);
        setCurrentLookbookIndex((prev) => prev + 1);
        setTimeout(() => setIsLookbookLocking(false), 850);
    };

    const handleLookbookBackward = () => {
        if (isLookbookLocking) return;
        setIsLookbookLocking(true);
        if (currentLookbookIndex > 0) {
            setCurrentLookbookIndex(prev => prev - 1);
        } else {
            setIsLookbookTransitioning(false);
            setCurrentLookbookIndex(lookbookImages.length - 1);
            requestAnimationFrame(() => {
                setTimeout(() => setIsLookbookTransitioning(true), 20);
            });
        }
        setTimeout(() => setIsLookbookLocking(false), 850);
    };

    const handleTopForward = () => {
        if (isTopLocking) return;
        setIsTopLocking(true);
        setCurrentTopIndex((prev) => prev + 1);
        setTimeout(() => setIsTopLocking(false), 850);
    };

    const handleTopBackward = () => {
        if (isTopLocking) return;
        setIsTopLocking(true);
        if (currentTopIndex > 0) {
            setCurrentTopIndex(prev => prev - 1);
        } else {
            setIsTopTransitioning(false);
            setCurrentTopIndex(topImages.length - 1);
            requestAnimationFrame(() => {
                setTimeout(() => setIsTopTransitioning(true), 20);
            });
        }
        setTimeout(() => setIsTopLocking(false), 850);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isLookbookLocking && !isDrawerOpen) {
                setCurrentLookbookIndex((prev) => prev + 1);
            }
            if (!isTopLocking) {
                setCurrentTopIndex((prev) => prev + 1);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isLookbookLocking, isTopLocking, isDrawerOpen]);

    useEffect(() => {
        if (currentLookbookIndex === extendedLookbookImages.length - 1) {
            const timer = setTimeout(() => {
                setIsLookbookTransitioning(false);
                setCurrentLookbookIndex(0);
                requestAnimationFrame(() => {
                    setTimeout(() => setIsLookbookTransitioning(true), 20);
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentLookbookIndex, extendedLookbookImages.length]);

    useEffect(() => {
        if (topImages.length > 0 && currentTopIndex === extendedTopImages.length - 1) {
            const timer = setTimeout(() => {
                setIsTopTransitioning(false);
                setCurrentTopIndex(0);
                requestAnimationFrame(() => {
                    setTimeout(() => setIsTopTransitioning(true), 20);
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentTopIndex, extendedTopImages.length, topImages.length]);

    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText('VB7');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentLang = i18n.language.split('-')[0];

    return (
        <div>
            {/* Hero Section */}
            <section className="relative h-screen min-h-[500px] flex items-center justify-center text-center overflow-hidden !py-0">
                <AnimatePresence>
                    {heroSettings ? (
                        <motion.div
                            key={`${heroSettings.hero_type}-${heroSettings.hero_image_url}-${heroSettings.hero_video_url}`}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.4, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute inset-0 z-0"
                        >
                            {heroSettings.hero_type?.trim().toLowerCase() === 'image' ? (
                                <img 
                                    src={heroSettings.hero_image_url} 
                                    alt="Hero" 
                                    className="w-full h-full object-cover"
                                    style={{ 
                                        filter: `
                                            blur(${heroSettings.hero_blur || 0}px) 
                                            grayscale(${heroSettings.hero_grayscale ? 1 : 0}) 
                                            brightness(${heroSettings.hero_brightness || 100}%) 
                                            contrast(${heroSettings.hero_contrast || 100}%) 
                                            saturate(${heroSettings.hero_saturation || 100}%)
                                        ` 
                                    }}
                                />
                            ) : (
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                    style={{ 
                                        filter: `
                                            blur(${heroSettings.hero_blur || 0}px) 
                                            grayscale(${heroSettings.hero_grayscale ? 1 : 0}) 
                                            brightness(${heroSettings.hero_brightness || 100}%) 
                                            contrast(${heroSettings.hero_contrast || 100}%) 
                                            saturate(${heroSettings.hero_saturation || 100}%)
                                        ` 
                                    }}
                                >
                                    <source src={heroSettings.hero_video_url} type="video/mp4" />
                                </video>
                            )}
                        </motion.div>
                    ) : (
                        <div className="absolute inset-0 z-0 bg-black opacity-40" />
                    )}
                </AnimatePresence>
                
                {/* Visual Overlay for contrast */}
                <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/20 to-black/60 pointer-events-none" />
                
                <div className="container relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.h1 
                            variants={fadeInUp} 
                            style={{ fontSize: 'var(--fs-hero)' }}
                            className="text-shimmer shadow-premium-gold font-serif font-bold leading-[1.1] uppercase tracking-[0.1em] md:tracking-[0.15em]"
                        >
                            {currentLang === 'bg' 
                                ? (heroSettings?.hero_title_bg || t('home.hero_title')) 
                                : (heroSettings?.hero_title_en || t('home.hero_title'))}
                        </motion.h1>
                        <motion.p 
                            variants={fadeInUp} 
                            style={{ fontSize: 'var(--fs-body)' }}
                            className="mt-[3vh] text-white/90 tracking-[0.2em] md:tracking-[0.25em] font-light uppercase drop-shadow-md max-w-[90%] mx-auto"
                        >
                            {currentLang === 'bg' 
                                ? (heroSettings?.hero_subtitle_bg || t('home.hero_subtitle')) 
                                : (heroSettings?.hero_subtitle_en || t('home.hero_subtitle'))}
                        </motion.p>
                        <motion.div variants={fadeInUp} className="mt-[6vh] flex flex-col gap-y-4 md:flex-row md:gap-x-10 items-center justify-center">
                            <Link to={`/${currentLang}/models`} className="w-full md:w-auto text-center px-10 py-4 bg-gold-accent text-background text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] hover:bg-white transition-all duration-500 shadow-gold">
                                {t('home.explore_models')}
                            </Link>
                            <Link to={`/${currentLang}/book-now`} className="w-full md:w-auto text-center px-10 py-4 border border-white/30 text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] hover:border-gold-accent hover:text-gold-accent transition-all duration-500 backdrop-blur-sm">
                                {t('home.apply_book')}
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Featured Talent Spotlight: Dynamic */}
            {topModel && topImages.length > 0 && (
                <section className="py-24 md:py-32 bg-surface border-y border-border/5">
                    <div className="container mx-auto px-6">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={fadeInUp}
                            className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center"
                        >
                            <div className="max-w-md mx-auto w-full">
                                <div className="relative aspect-[9/16] bg-black overflow-hidden rounded-sm shadow-2xl group">
                                    <div className="absolute inset-0 z-10">
                                        {topImages.map((img, i) => {
                                            const activeIndex = ((currentTopIndex % topImages.length) + topImages.length) % topImages.length;
                                            const isActive = activeIndex === i;
                                            return (
                                                <div
                                                    key={i}
                                                    className={`absolute inset-0 w-full h-full transition-all duration-[1200ms] ease-in-out ${
                                                        isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0'
                                                    }`}
                                                >
                                                    <img
                                                        src={img}
                                                        className="w-full h-full object-cover transform transition-transform duration-[8000ms] ease-out scale-100 group-hover:scale-105"
                                                        alt={`${topModel.name} - Look ${i + 1}`}
                                                    />
                                                </div>
                                            );
                                        })}

                                        {/* Interaction zones */}
                                        <div className="absolute inset-0 z-40">
                                            <div
                                                className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize"
                                                onClick={handleTopBackward}
                                            />
                                            <div
                                                className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize"
                                                onClick={handleTopForward}
                                            />
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-20 pointer-events-none" />
                                        <div className="absolute top-6 left-6 z-30 bg-gold-accent text-black px-4 py-1.5 text-xs font-bold uppercase tracking-widest pointer-events-none">
                                            {t('home.top_model')}
                                        </div>
                                        <div className="absolute bottom-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
                                            <div className="flex space-x-2">
                                                {topImages.map((_, i) => {
                                                    const activeIndex = ((currentTopIndex % topImages.length) + topImages.length) % topImages.length;
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`h-1 rounded-full transition-all duration-300 ${
                                                                activeIndex === i ? 'w-8 bg-gold-accent shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'w-2 bg-white/30'
                                                            }`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-[4vh] text-left">
                                <div>
                                    <h4 className="text-gold-accent font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm mb-3">{t('home.featured_spotlight')}</h4>
                                    <h2 className="font-serif text-6xl md:text-8xl text-text-primary leading-[0.85] tracking-tighter">
                                        {topModel.name.split(' ')[0]} <br/>
                                        <span className="text-text-muted/80 italic">{topModel.name.split(' ').slice(1).join(' ')}</span>
                                    </h2>
                                </div>
                                <div className="w-16 h-px bg-gold-accent/50" />
                                <div className="space-y-6 text-white/80 text-sm md:text-lg font-light leading-relaxed max-w-2xl">
                                    <p className="break-words whitespace-pre-wrap line-clamp-[8] md:line-clamp-none">
                                        {i18n.language === 'bg' 
                                          ? (topModel.spotlight_bio_bg || topModel.spotlight_bio || topModel.bio)
                                          : (topModel.spotlight_bio || topModel.bio)}
                                    </p>
                                </div>

                                <div className="pt-4 flex flex-col items-center md:items-start md:flex-row gap-6 md:gap-8">
                                    <Link
                                        to={`/${currentLang}/models/${topModel.slug}`}
                                        className="btn-mobile-full inline-flex items-center justify-center px-8 py-4 bg-text-primary text-background text-sm font-bold uppercase tracking-widest hover:bg-gold-accent transition-colors duration-300"
                                    >
                                        {t('home.spotlight.view_portfolio')}
                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                    </Link>
                                    <div className="flex items-center space-x-6 px-4 text-text-muted text-sm shrink-0">
                                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                            <span className="font-serif text-2xl text-text-primary">{topModel.spotlight_projects || 0}</span>
                                            <span className="uppercase tracking-wider text-[10px] whitespace-nowrap">{t('home.spotlight.projects')}</span>
                                        </div>
                                        <div className="w-px h-8 bg-border" />
                                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                            <span className="font-serif text-2xl text-text-primary">{topModel.spotlight_awards || 0}</span>
                                            <span className="uppercase tracking-wider text-[10px] whitespace-nowrap">{t('home.spotlight.awards')}</span>
                                        </div>
                                        <div className="w-px h-8 bg-border" />
                                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                            <span className="font-serif text-2xl text-text-primary">{topModel.posts?.length || 0}</span>
                                            <span className="uppercase tracking-wider text-[10px] whitespace-nowrap">{t('home.spotlight.posts')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Top Promo Banner */}
            <div className="bg-gold-accent/10 border-y border-gold-accent/20 py-3 overflow-hidden">
                <div className="animate-marquee whitespace-nowrap">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-[10px] md:text-sm font-bold uppercase tracking-[0.5em] text-gold-accent px-4">
                            {t('sponsored.promo_text')}
                        </span>
                    ))}
                </div>
            </div>

            {/* Sponsored Section */}
            <section className="py-24 md:py-32 bg-background relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center"
                    >
                        <div className="order-2 lg:order-1 space-y-[4vh]">
                            <div className="space-y-[2vh]">
                                <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-gold-accent text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] rounded-full">
                                    Ползи
                                </span>
                                <h2 className="font-serif text-text-primary leading-tight">
                                    Магнезий
                                </h2>
                                <p className="text-white/80 leading-relaxed max-w-xl font-light">
                                    Магнезият е многостранен минерал с множество роли в тялото. Той поддържа основните функции на нервите, мускулите и сърцето, подпомага превръщането на храната в клетъчна енергия и спомага за релаксацията на тялото. Nature Made® Magnesium осигурява 250 mg в една удобна дневна таблетка.†
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                {[
                                    "Поддържа мускулната релаксация, здравето на сърцето, нервите и костите†",
                                    "1 таблетка дневно",
                                    "Без синтетични оцветители, без изкуствени аромати, без глутен",
                                    "№1 марка витамини и хранителни добавки, препоръчана от фармацев*"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start space-x-3 text-sm text-white/60">
                                        <div className="w-1 h-1 bg-gold-accent rounded-full mt-2 shrink-0" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-text-primary/90">Характеристики на продукта</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-6 h-6 rounded-full border border-gold-accent/20 flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 text-gold-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-[0.2em] text-text-primary/80 uppercase">Произведен от висококачествени съставки</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-6 h-6 rounded-full border border-gold-accent/20 flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 text-gold-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-[0.15em] text-text-primary/80 uppercase">Среща се в зеленолистни, ядки и зърнени култури</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6">
                                <a 
                                    href="https://www.naturemade.com/products/magnesium-250-mg-tablets?variant=17776033857607" 
                                    target="_blank"
                                    rel="noopener noreferrer" 
                                    className="group inline-flex items-center space-x-4 text-text-primary hover:text-gold-accent transition-colors"
                                >
                                    <span className="text-xs font-bold uppercase tracking-[0.3em] border-b border-text-primary/30 group-hover:border-gold-accent pb-1 transition-all">
                                        {t('sponsored.cta')}
                                    </span>
                                    <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                            <div className="relative w-full max-w-[440px] group">
                                {/* Model Image - Portrait / Fixed */}
                                <div className="relative z-10 shadow-2xl">
                                    <img
                                        src="/Site_Pics/SponsorShip/NaturalPills.png"
                                        alt="Natural Pills"
                                        className="w-full h-auto object-cover rounded-sm border border-white/5"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                                </div>

                                {/* Floating Product Image (Bottle) - Bottom Left Corner - ENLARGED & ON TOP */}
                                <div className="absolute bottom-[-10%] left-[-30%] md:left-[-50%] w-[100%] md:w-[130%] z-50 transform -rotate-[10deg] md:-rotate-[15deg] drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)] md:drop-shadow-[0_50px_100px_rgba(0,0,0,0.95)] transition-transform duration-700 ease-out group-hover:translate-y-[-10px] group-hover:rotate-[-5deg]">
                                    <a href="https://www.naturemade.com/products/magnesium-250-mg-tablets?variant=17776033857607" target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                        <img
                                            src="/Site_Pics/SponsorShip/Pills.png"
                                            alt="Product Bottle"
                                            className="w-full h-auto cursor-pointer"
                                            loading="lazy"
                                        />
                                    </a>
                                </div>

                                {/* Promo Code Badge - Centered Bottom */}
                                <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 z-30">
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-[#111111]/95 border border-gold-accent/20 px-6 py-3 md:px-8 md:py-4 rounded-sm shadow-2xl backdrop-blur-md flex flex-col items-center min-w-[150px] md:min-w-[180px] active:scale-95 transition-transform"
                                    >
                                        <span className="text-[10px] uppercase tracking-widest text-[#888888] mb-1">
                                            {copied ? t('sponsored.promo_code_copied') : t('sponsored.promo_code_label')}
                                        </span>
                                        <span className="text-2xl font-bold tracking-[0.3em] text-gold-accent">
                                            {t('sponsored.promo_code_val')}
                                        </span>

                                        {!copied && (
                                            <div className="absolute -top-10 bg-black/90 text-[10px] text-white px-3 py-1.5 rounded-sm opacity-0 hover:opacity-100 transition-opacity uppercase tracking-widest border border-white/5 pointer-events-none">
                                                Click to copy
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Bottom Promo Banner */}
            <div className="bg-gold-accent/10 border-y border-gold-accent/20 py-3 overflow-hidden">
                <div className="animate-marquee-reverse whitespace-nowrap">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-[10px] md:text-sm font-bold uppercase tracking-[0.5em] text-gold-accent px-4">
                            {t('sponsored.promo_text')}
                        </span>
                    ))}
                </div>
            </div>

            <section className="py-20 md:py-32 bg-background overflow-hidden border-y border-border/5">
                <div className="container mx-auto px-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={lookbookId}
                            variants={evaporate}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="w-full"
                        >
                            <motion.h2
                                className="text-center text-4xl md:text-5xl text-text-primary mb-4"
                                style={{ fontFamily: lookbookTitle.font }}
                            >
                                {i18n.language === 'bg' ? lookbookTitle.titleBg : lookbookTitle.titleEn}
                            </motion.h2>

                            {(i18n.language === 'bg' ? lookbookTitle.descBg : lookbookTitle.descEn) && (
                                <motion.p
                                    className="text-center text-text-muted text-sm md:text-base max-w-2xl mx-auto mb-12 uppercase tracking-[0.2em]"
                                    style={{ fontFamily: lookbookTitle.descFont || 'Inter' }}
                                >
                                    {i18n.language === 'bg' ? lookbookTitle.descBg : lookbookTitle.descEn}
                                </motion.p>
                            )}

                            <div className="relative w-full max-w-7xl mx-auto aspect-video bg-black overflow-hidden rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 group">
                                <div
                                className={`absolute inset-0 flex ${isLookbookTransitioning ? 'transition-transform duration-[800ms] ease-in-out' : ''}`}
                                style={{ transform: `translateX(-${currentLookbookIndex * 100}%)` }}
                            >
                                {extendedLookbookImages.map((src, index) => (
                                    <div key={index} className="w-full h-full flex-shrink-0 relative overflow-hidden bg-black">
                                        <img
                                            className={`w-full h-full object-cover transition-transform duration-[5000ms] ease-out ${
                                                (currentLookbookIndex % lookbookImages.length) === (index % lookbookImages.length) ? 'scale-105' : 'scale-100'
                                            }`}
                                            src={src}
                                            alt={`Lookbook ${index + 1}`}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
                                    </div>
                                ))}
                            </div>
                            <div
                                className="absolute inset-y-0 left-0 w-1/3 z-40 cursor-w-resize"
                                onClick={handleLookbookBackward}
                            />
                            <div
                                className="absolute inset-y-0 right-0 w-1/3 z-40 cursor-e-resize"
                                onClick={handleLookbookForward}
                            />

                            {/* Responsive Thumbnail Toggle Drawer */}
                            <div className="absolute top-0 bottom-0 right-0 z-[60] flex items-center h-full pointer-events-none">
                                {/* Desktop Side Thumbnails (md+) */}
                                <div className={`hidden md:block h-full bg-black/90 backdrop-blur-xl transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden pointer-events-auto ${isDrawerOpen ? 'w-40' : 'w-0'}`}>
                                    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-3">
                                        <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-3 font-bold text-center sticky top-0 bg-black/90 py-2 z-10 backdrop-blur">Gallery</h3>
                                         {lookbookImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsLookbookTransitioning(true); 
                                                    setCurrentLookbookIndex(idx);
                                                }}
                                                className={`relative w-full aspect-square overflow-hidden rounded-sm border transition-all ${
                                                    (currentLookbookIndex % lookbookImages.length) === idx 
                                                        ? 'border-gold-accent opacity-100 shadow-[0_0_15px_rgba(212,175,55,0.3)] ring-1 ring-gold-accent' 
                                                        : 'border-white/10 opacity-40 hover:opacity-100 hover:border-white/50'
                                                }`}
                                            >
                                                <img src={img} className="w-full h-full object-cover" alt="" />
                                            </button>
                                        ))}
                                        {/* Visual spacer at bottom */}
                                        <div className="h-12" />
                                    </div>
                                </div>

                                {/* Floating Trigger Button moved higher */}
                                <div className="h-full flex items-start pt-1 pr-1">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDrawerOpen(!isDrawerOpen);
                                        }}
                                        className={`pointer-events-auto w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/80 border border-white/10 hover:border-gold-accent/50 text-white/50 hover:text-gold-accent transition-all duration-500 backdrop-blur-sm shadow-2xl active:scale-90 group/trigger`}
                                    >
                                        <ChevronLeft className={`w-4 h-4 transition-transform duration-500 ease-out ${isDrawerOpen ? 'rotate-180' : 'group-hover/trigger:-translate-x-0.5'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 flex h-1 bg-white/5 z-30 space-x-1 px-1">
                                {lookbookImages.map((_, i) => {
                                    const activeIndex = ((currentLookbookIndex % lookbookImages.length) + lookbookImages.length) % lookbookImages.length;
                                    return (
                                        <div key={i} className="flex-1 h-full bg-white/10 overflow-hidden rounded-full">
                                            {i === activeIndex && (
                                                <div className="h-full bg-gold-accent animate-[timeline_5s_linear_forwards]" />
                                            )}
                                            {i < activeIndex && (
                                                <div className="h-full bg-gold-accent w-full" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 flex items-center space-x-2 md:space-x-3 z-40 bg-black/60 backdrop-blur-md px-2 md:px-4 py-1 md:py-2 rounded-sm border border-white/5">
                                <div className="flex items-center space-x-1.5 md:space-x-2">
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                                    <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-white/90">{t('home.model_view')}</span>
                                </div>
                                <div className="h-2 md:h-3 w-px bg-white/20" />
                                <span className="text-[9px] md:text-[11px] font-mono text-gold-accent">
                                    {String((currentLookbookIndex % lookbookImages.length) + 1).padStart(2, '0')} / {String(lookbookImages.length).padStart(2, '0')}
                                </span>
                            </div>
                         </div>

                        {/* Mobile-only Thumbnail Strip - Only shows when toggled open */}
                        <AnimatePresence>
                            {isDrawerOpen && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                    className="md:hidden mt-4 overflow-hidden"
                                >
                                    <div className="relative group/mobile-strip">
                                        <div 
                                            ref={mobileScrollRef}
                                            onScroll={(e) => {
                                                const target = e.currentTarget;
                                                const progress = (target.scrollLeft / (target.scrollWidth - target.clientWidth)) * 100;
                                                setMobileScrollProgress(isNaN(progress) ? 0 : progress);
                                            }}
                                            className="overflow-x-auto flex space-x-2 pb-6 px-2 snap-x no-scrollbar scroll-smooth"
                                        >
                                            {lookbookImages.map((img, idx) => {
                                                const isActive = (currentLookbookIndex % lookbookImages.length) === idx;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            setIsLookbookTransitioning(true);
                                                            setCurrentLookbookIndex(idx);
                                                        }}
                                                        className={`relative w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden border transition-all snap-center ${
                                                            isActive 
                                                                ? 'border-gold-accent ring-1 ring-gold-accent shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                                                : 'border-white/10 opacity-40'
                                                        }`}
                                                    >
                                                        <img src={img} className="w-full h-full object-cover" alt="" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        {/* Orientation / Scroll Progress Line */}
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gold-accent/60 transition-all duration-100 ease-out"
                                                style={{ width: '20%', transform: `translateX(${mobileScrollProgress * (100 - 20) / 20}%)` }} 
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        </motion.div>
                    </AnimatePresence>

                    <style>{`
                        @keyframes timeline {
                            from { width: 0%; }
                            to { width: 100%; }
                        }
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                </div>
            </section>

            <section className="py-20 md:py-32 bg-surface">
                <div className="container mx-auto px-6 text-center">
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={fadeInUp}
                        className="text-4xl md:text-5xl font-serif text-text-primary mb-12"
                    >
                        {t('home.our_services')}
                    </motion.h2>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
                    >
                        {[
                            { key: 'casting', name: 'Casting & Booking' },
                            { key: 'production', name: 'Campaign Production' },
                            { key: 'creative', name: 'Creative Direction' }
                        ].map(service => (
                            <motion.div key={service.key} variants={fadeInUp} className="border border-border p-8">
                                <h3 className="text-xl font-serif text-text-primary">{t(`services.list.${service.key}.name`)}</h3>
                            </motion.div>
                        ))}
                    </motion.div>
                     <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={fadeInUp}
                        className="mt-12 flex justify-center"
                    >
                        <Link to={`/${currentLang}/services`} className="btn-mobile-full inline-block px-8 py-3 border border-gold-accent text-gold-accent text-sm uppercase tracking-widest hover:bg-gold-accent hover:text-background transition-colors duration-300">
                            {t('home.learn_more')}
                        </Link>
                    </motion.div>
                </div>
            </section>

            <section className="py-20 md:py-32 bg-background text-center">
                 <div className="container mx-auto px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                    >
                        <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-serif text-text-primary">{t('home.ready_to_create')}</motion.h2>
                        <motion.p variants={fadeInUp} className="mt-4 text-text-muted">{t('home.connect_with_us')}</motion.p>
                         <motion.div variants={fadeInUp} className="mt-10 flex flex-col gap-y-8 md:flex-row md:gap-x-10 items-center justify-center">
                            <Link to={`/${currentLang}/contact`} className="w-full md:w-auto text-center px-8 py-3 bg-gold-accent text-background text-sm uppercase tracking-widest hover:bg-opacity-90 transition-colors duration-300">
                                {t('home.book_model')}
                            </Link>
                            <Link to={`/${currentLang}/contact`} className="w-full md:w-auto text-center px-8 py-3 border border-text-muted text-text-muted text-sm uppercase tracking-widest hover:border-gold-accent hover:text-gold-accent transition-colors duration-300">
                                {t('home.join_vb')}
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
