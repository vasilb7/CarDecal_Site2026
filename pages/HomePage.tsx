
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModels } from '../hooks/useModels';
import ModelCard from '../components/ModelCard';

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const { getFeaturedModels } = useModels();
    const featuredModels = getFeaturedModels(6);
    // ... existing state and logic ...
    const [currentLookbookIndex, setCurrentLookbookIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isLocking, setIsLocking] = useState(false);

    const lookbookImages = [
        '/Stock Photos/Homepage/models_review/1.jpeg',
        '/Stock Photos/Homepage/models_review/2.jpeg',
        '/Stock Photos/Homepage/models_review/3.jpeg',
        '/Stock Photos/Homepage/models_review/4.jpeg',
        '/Stock Photos/Homepage/models_review/5.jpeg',
        '/Stock Photos/Homepage/models_review/6.jpeg',
        '/Stock Photos/Homepage/models_review/7.jpeg',
        '/Stock Photos/Homepage/models_review/8.jpeg',
    ];

    const extendedImages = [...lookbookImages, lookbookImages[0]];

    const handleForward = () => {
        if (isLocking) return;
        setIsLocking(true);
        setCurrentLookbookIndex((prev) => prev + 1);
        setTimeout(() => setIsLocking(false), 850);
    };

    const handleBackward = () => {
        if (isLocking) return;
        setIsLocking(true);
        if (currentLookbookIndex > 0) {
            setCurrentLookbookIndex(prev => prev - 1);
        } else {
            setIsTransitioning(false);
            setCurrentLookbookIndex(lookbookImages.length - 1);
            requestAnimationFrame(() => {
                setTimeout(() => setIsTransitioning(true), 20);
            });
        }
        setTimeout(() => setIsLocking(false), 850);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isLocking) {
                setCurrentLookbookIndex((prev) => prev + 1);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [lookbookImages.length, isLocking]);

    useEffect(() => {
        if (currentLookbookIndex === extendedImages.length - 1) {
            const timer = setTimeout(() => {
                setIsTransitioning(false);
                setCurrentLookbookIndex(0);
                requestAnimationFrame(() => {
                    setTimeout(() => setIsTransitioning(true), 20);
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentLookbookIndex, extendedImages.length]);

    return (
        <div>
            {/* Hero Section */}
            <section className="relative h-screen min-h-[600px] flex items-center justify-center text-center overflow-hidden">
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="absolute z-0 w-auto min-w-full min-h-full max-w-none grayscale opacity-50 object-cover"
                >
                    <source src="/Stock Photos/Homepage/homevid.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <div className="container mx-auto px-6 relative z-10">
                    <h1 className="text-5xl md:text-8xl font-serif text-text-primary leading-tight">{t('home.hero_title')}</h1>
                    <p className="mt-4 text-lg md:text-2xl text-text-muted tracking-wider">{t('home.hero_subtitle')}</p>
                    <div className="mt-10 space-x-4">
                        <Link to="/models" className="inline-block px-8 py-3 bg-gold-accent text-background text-sm uppercase tracking-widest hover:bg-opacity-90 transition-colors duration-300">
                            {t('home.explore_models')}
                        </Link>
                        <Link to="/contact" className="inline-block px-8 py-3 border border-text-muted text-text-muted text-sm uppercase tracking-widest hover:border-gold-accent hover:text-gold-accent transition-colors duration-300">
                            {t('home.apply_book')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Talent Spotlight: Pamela Nelson */}
            <section className="py-24 md:py-32 bg-surface border-y border-border/5">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
                        <div className="max-w-md mx-auto w-full">
                            <div className="relative aspect-[9/16] bg-black overflow-hidden rounded-sm shadow-2xl group">
                                <div className="absolute inset-0">
                                    {['1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg'].map((img, i, arr) => (
                                        <div 
                                            key={i}
                                            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                                                (currentLookbookIndex % arr.length) === i ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                            }`}
                                        >
                                            <img 
                                                src={`/Stock Photos/Top_Model/${img}`} 
                                                className="w-full h-full object-cover transform transition-transform duration-[8000ms] ease-out scale-100 group-hover:scale-105"
                                                alt={`Pamela Nelson - Look ${i + 1}`}
                                            />
                                        </div>
                                    ))}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-20" />
                                    <div className="absolute top-6 left-6 z-30 bg-gold-accent text-black px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
                                        {t('home.top_model')}
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6 z-30 flex items-center justify-between">
                                        <div className="flex space-x-2">
                                            {['1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg'].map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`h-1 rounded-full transition-all duration-300 ${
                                                        (currentLookbookIndex % 5) === i ? 'w-8 bg-gold-accent' : 'w-2 bg-white/50'
                                                    }`} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 text-left">
                            <div>
                                <h4 className="text-gold-accent font-bold uppercase tracking-[0.2em] text-sm mb-3">{t('home.featured_spotlight')}</h4>
                                <h2 className="text-5xl md:text-7xl font-serif text-text-primary leading-none">
                                    Pamela <br/>
                                    <span className="text-text-muted/40 italic">Nelson</span>
                                </h2>
                            </div>
                            <div className="w-16 h-px bg-gold-accent/50" />
                            <div className="space-y-6 text-text-muted text-lg font-light leading-relaxed">
                                <p>{t('home.pamela.desc1')}</p>
                                <p>{t('home.pamela.desc2')}</p>
                            </div>

                            <div className="pt-4 flex flex-wrap gap-4">
                                <Link 
                                    to="/models/pamela-nelson" 
                                    className="inline-flex items-center px-8 py-4 bg-text-primary text-background text-sm font-bold uppercase tracking-widest hover:bg-gold-accent transition-colors duration-300"
                                >
                                    {t('home.pamela.view_portfolio')}
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </Link>
                                <div className="flex items-center space-x-6 px-4 text-text-muted text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-serif text-2xl text-text-primary">240+</span>
                                        <span className="uppercase tracking-wider text-[10px]">{t('home.pamela.projects')}</span>
                                    </div>
                                    <div className="w-px h-8 bg-border" />
                                    <div className="flex flex-col">
                                        <span className="font-serif text-2xl text-text-primary">12</span>
                                        <span className="uppercase tracking-wider text-[10px]">{t('home.pamela.awards')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 md:py-32 bg-background overflow-hidden border-y border-border/5">
                <div className="container mx-auto px-6">
                    <h2 className="text-center text-4xl md:text-5xl font-serif text-text-primary mb-12">{t('home.lookbook_showcase')}</h2>
                    <div className="relative w-full max-w-7xl mx-auto aspect-[1408/768] bg-black overflow-hidden rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 group">
                        <div 
                            className={`absolute inset-0 flex ${isTransitioning ? 'transition-transform duration-[800ms] ease-in-out' : ''}`}
                            style={{ transform: `translateX(-${currentLookbookIndex * 100}%)` }}
                        >
                            {extendedImages.map((src, index) => (
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
                            className="absolute inset-y-0 left-0 w-1/4 z-40 cursor-w-resize" 
                            onClick={handleBackward}
                        />
                        <div 
                            className="absolute inset-y-0 right-0 w-1/4 z-40 cursor-e-resize" 
                            onClick={handleForward}
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
                    </div>

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
                    <h2 className="text-4xl md:text-5xl font-serif text-text-primary mb-12">{t('home.our_services')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { key: 'casting', name: 'Casting & Booking' },
                            { key: 'production', name: 'Campaign Production' },
                            { key: 'creative', name: 'Creative Direction' }
                        ].map(service => (
                            <div key={service.key} className="border border-border p-8">
                                <h3 className="text-xl font-serif text-text-primary">{t(`services.list.${service.key}.name`)}</h3>
                            </div>
                        ))}
                    </div>
                     <Link to="/services" className="mt-12 inline-block px-8 py-3 border border-gold-accent text-gold-accent text-sm uppercase tracking-widest hover:bg-gold-accent hover:text-background transition-colors duration-300">
                        {t('home.learn_more')}
                    </Link>
                </div>
            </section>
            
            <section className="py-20 md:py-32 bg-background text-center">
                 <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-serif text-text-primary">{t('home.ready_to_create')}</h2>
                    <p className="mt-4 text-text-muted">{t('home.connect_with_us')}</p>
                    <div className="mt-10 space-x-4">
                        <Link to="/contact" className="inline-block px-8 py-3 bg-gold-accent text-background text-sm uppercase tracking-widest hover:bg-opacity-90 transition-colors duration-300">
                            {t('home.book_model')}
                        </Link>
                        <Link to="/contact" className="inline-block px-8 py-3 border border-text-muted text-text-muted text-sm uppercase tracking-widest hover:border-gold-accent hover:text-gold-accent transition-colors duration-300">
                            {t('home.join_vb')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
