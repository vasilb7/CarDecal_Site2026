
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useModels } from '../hooks/useModels';
import ModelCard from '../components/ModelCard';

const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

const HomePage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { getFeaturedModels } = useModels();
    const featuredModels = getFeaturedModels(6);
    // ... existing state and logic ...
    const [currentLookbookIndex, setCurrentLookbookIndex] = useState(0);
    const [isLookbookTransitioning, setIsLookbookTransitioning] = useState(true);
    const [isLookbookLocking, setIsLookbookLocking] = useState(false);

    const [currentTopIndex, setCurrentTopIndex] = useState(0);
    const [isTopTransitioning, setIsTopTransitioning] = useState(true);
    const [isTopLocking, setIsTopLocking] = useState(false);

    const lookbookImages = [
        '/Site_Pics/Homepage/models_review/1.jpeg',
        '/Site_Pics/Homepage/models_review/2.jpeg',
        '/Site_Pics/Homepage/models_review/3.jpeg',
        '/Site_Pics/Homepage/models_review/4.jpeg',
        '/Site_Pics/Homepage/models_review/5.jpeg',
        '/Site_Pics/Homepage/models_review/6.jpeg',
        '/Site_Pics/Homepage/models_review/7.jpeg',
        '/Site_Pics/Homepage/models_review/8.jpeg',
        '/Site_Pics/Homepage/models_review/9.jpeg',
        '/Site_Pics/Homepage/models_review/10.jpeg',
        '/Site_Pics/Homepage/models_review/11.jpeg',
        '/Site_Pics/Homepage/models_review/12.jpeg'
    ];

    const topModelImages = [
        '1.jpeg',
        '2.jpeg',
        '3.jpeg',
        '4.jpeg',
        '5.jpeg',
        '6.jpeg',
        '7.jpeg',
        '8.jpeg',
        '9.jpeg',
        '10.jpeg',
        '11.jpeg',
        '12.jpeg',
        '13.jpeg',
        '14.jpeg',
        '15.jpeg',
        '16.jpeg',
        '17.jpeg',
        '18.jpeg',
        '19.jpeg',
        '20.jpeg',
        '21.jpeg',
        '22.jpeg',
        '23.jpeg',
        '24.jpeg',
        '25.jpeg'
    ];

    const extendedLookbookImages = [...lookbookImages, lookbookImages[0]];
    const extendedTopImages = [...topModelImages, topModelImages[0]];

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
            setCurrentTopIndex(topModelImages.length - 1);
            requestAnimationFrame(() => {
                setTimeout(() => setIsTopTransitioning(true), 20);
            });
        }
        setTimeout(() => setIsTopLocking(false), 850);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isLookbookLocking) {
                setCurrentLookbookIndex((prev) => prev + 1);
            }
            if (!isTopLocking) {
                setCurrentTopIndex((prev) => prev + 1);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isLookbookLocking, isTopLocking]);

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
        if (currentTopIndex === extendedTopImages.length - 1) {
            const timer = setTimeout(() => {
                setIsTopTransitioning(false);
                setCurrentTopIndex(0);
                requestAnimationFrame(() => {
                    setTimeout(() => setIsTopTransitioning(true), 20);
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentTopIndex, extendedTopImages.length]);

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
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute z-0 w-auto min-w-full min-h-full max-w-none grayscale opacity-40 object-cover"
                >
                    <source src="/Site_Pics/Homepage/homevid.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
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
                            {t('home.hero_title')}
                        </motion.h1>
                        <motion.p 
                            variants={fadeInUp} 
                            style={{ fontSize: 'var(--fs-body)' }}
                            className="mt-[3vh] text-white/90 tracking-[0.2em] md:tracking-[0.25em] font-light uppercase drop-shadow-md max-w-[90%] mx-auto"
                        >
                            {t('home.hero_subtitle')}
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

            {/* Featured Talent Spotlight: Pamela Nelson */}
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
                                    {topModelImages.map((img, i) => {
                                        const activeIndex = ((currentTopIndex % topModelImages.length) + topModelImages.length) % topModelImages.length;
                                        const isActive = activeIndex === i;
                                        return (
                                            <div
                                                key={i}
                                                className={`absolute inset-0 w-full h-full transition-all duration-[1200ms] ease-in-out ${
                                                    isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0'
                                                }`}
                                            >
                                                <img
                                                    src={`/Site_Pics/Top_Model/${img}`}
                                                    className="w-full h-full object-cover transform transition-transform duration-[8000ms] ease-out scale-100 group-hover:scale-105"
                                                    alt={`Pamela Nelson - Look ${i + 1}`}
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
                                            {topModelImages.map((_, i) => {
                                                const activeIndex = ((currentTopIndex % topModelImages.length) + topModelImages.length) % topModelImages.length;
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`h-1 rounded-full transition-all duration-300 ${
                                                            activeIndex === i ? 'w-8 bg-gold-accent' : 'w-2 bg-white/50'
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
                                <h2 className="font-serif text-text-primary leading-tight">
                                    Pamela <br/>
                                    <span className="text-text-muted/40 italic">Nelson</span>
                                </h2>
                            </div>
                            <div className="w-16 h-px bg-gold-accent/50" />
                            <div className="space-y-6 text-white/80 text-lg font-light leading-relaxed">
                                <p>{t('home.pamela.desc1')}</p>
                                <p>{t('home.pamela.desc2')}</p>
                            </div>

                            <div className="pt-4 flex flex-col items-center md:items-start md:flex-row gap-6 md:gap-8">
                                <Link
                                    to={`/${currentLang}/models/pamela-nelson`}
                                    className="btn-mobile-full inline-flex items-center justify-center px-8 py-4 bg-text-primary text-background text-sm font-bold uppercase tracking-widest hover:bg-gold-accent transition-colors duration-300"
                                >
                                    {t('home.pamela.view_portfolio')}
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </Link>
                                <div className="flex items-center space-x-6 px-4 text-text-muted text-sm shrink-0">
                                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                        <span className="font-serif text-2xl text-text-primary">240+</span>
                                        <span className="uppercase tracking-wider text-[10px] whitespace-nowrap">{t('home.pamela.projects')}</span>
                                    </div>
                                    <div className="w-px h-8 bg-border" />
                                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                        <span className="font-serif text-2xl text-text-primary">12</span>
                                        <span className="uppercase tracking-wider text-[10px] whitespace-nowrap">{t('home.pamela.awards')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

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
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={fadeInUp}
                        className="text-center text-4xl md:text-5xl font-serif text-text-primary mb-12"
                    >
                        {t('home.lookbook_showcase')}
                    </motion.h2>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="relative w-full max-w-7xl mx-auto aspect-[1408/768] bg-black overflow-hidden rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 group"
                    >
                        <div
                            className={`absolute inset-0 flex ${isLookbookTransitioning ? 'transition-transform duration-[800ms] ease-in-out' : ''}`}
                            style={{ transform: `translateX(-${currentLookbookIndex * 100}%)` }}
                        >
                            {extendedLookbookImages.map((src, index) => (
                                <div key={index} className="w-full h-full flex-shrink-0 relative overflow-hidden bg-black">
                                    <img
                                        className={`w-full h-full object-cover transition-transform duration-[5000ms] ease-out ${
                                            (currentLookbookIndex % lookbookImages.length) === (index % lookbookImages.length) ? 'scale-110' : 'scale-100'
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
                        <div className="absolute bottom-0 left-0 right-0 flex h-1 bg-white/5 z-30 space-x-1 px-1">
                            {lookbookImages.map((_, i) => (
                                <div key={i} className="flex-1 h-full bg-white/10 overflow-hidden rounded-full">
                                    {i === (currentLookbookIndex % lookbookImages.length) && (
                                        <div className="h-full bg-gold-accent animate-[timeline_5s_linear_forwards]" />
                                    )}
                                    {i < (currentLookbookIndex % lookbookImages.length) && (
                                        <div className="h-full bg-gold-accent w-full" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="absolute bottom-6 left-6 flex items-center space-x-3 z-40 bg-black/60 backdrop-blur-md px-4 py-2 rounded-sm border border-white/5">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">{t('home.model_view')}</span>
                            </div>
                            <div className="h-3 w-px bg-white/20" />
                            <span className="text-[11px] font-mono text-gold-accent">
                                {String((currentLookbookIndex % lookbookImages.length) + 1).padStart(2, '0')} / {String(lookbookImages.length).padStart(2, '0')}
                            </span>
                        </div>
                    </motion.div>

                    <style>{`
                        @keyframes timeline {
                            from { width: 0%; }
                            to { width: 100%; }
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
