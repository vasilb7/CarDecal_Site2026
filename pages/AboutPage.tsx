import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const AboutPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-surface text-text-primary min-h-screen">
            <div className="container mx-auto px-6 py-24 md:py-40">
                <div className="max-w-6xl mx-auto text-center space-y-8 mb-24 md:mb-32">
                    <h1 className="text-5xl md:text-8xl font-serif leading-tight">{t('about.title')}</h1>
                    <div className="w-24 h-px bg-gold-accent mx-auto" />
                    <p className="text-xl md:text-2xl text-text-muted font-light max-w-3xl mx-auto leading-relaxed">
                        {t('about.subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-16 md:gap-32 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative group"
                    >
                        <img src="/Site_Pics/Model_pics_together/67.jpeg" alt="Behind the scenes" className="w-full h-auto aspect-[4/5] object-cover grayscale group-hover:grayscale-0 transition-all duration-700"/>
                        <div className="absolute inset-0 border border-gold-accent/20 -m-4 -z-10 group-hover:m-0 transition-all" />
                    </motion.div>
                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-5xl font-serif text-text-primary">{t('about.brand_title')}</h2>
                        <div className="w-16 h-px bg-gold-accent" />
                        <div className="space-y-6 text-xl text-text-muted font-light leading-relaxed">
                            <p>{t('about.brand_p1')}</p>
                            <p>{t('about.brand_p2')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-16 md:gap-32 items-center mt-32 md:mt-48">
                    <div className="order-2 md:order-1 space-y-8">
                        <h2 className="text-4xl md:text-5xl font-serif text-text-primary">{t('about.values_title')}</h2>
                        <div className="w-16 h-px bg-gold-accent" />
                        <ul className="space-y-8 text-lg text-text-muted font-light">
                            <li className="flex items-start">
                                <span className="text-gold-accent mr-6 text-2xl mt-1">01</span>
                                <span><strong className="text-text-primary block text-xl mb-2">{t('about.value1_title')}</strong> {t('about.value1_desc')}</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-gold-accent mr-6 text-2xl mt-1">02</span>
                                <span><strong className="text-text-primary block text-xl mb-2">{t('about.value2_title')}</strong> {t('about.value2_desc')}</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-gold-accent mr-6 text-2xl mt-1">03</span>
                                <span><strong className="text-text-primary block text-xl mb-2">{t('about.value3_title')}</strong> {t('about.value3_desc')}</span>
                            </li>
                        </ul>
                    </div>
                     <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="order-1 md:order-2"
                    >
                        <img src="/Site_Pics/Model_pics_together/122.jpeg" alt="Studio shot" className="w-full h-auto aspect-[4/5] object-cover"/>
                     </motion.div>
                </div>

                <div className="text-center mt-32 md:mt-48 py-20 border-t border-white/5 space-y-12">
                     <h2 className="text-4xl md:text-6xl font-serif text-text-primary max-w-2xl mx-auto leading-tight">{t('about.join_title')}</h2>
                     <p className="text-xl text-text-muted font-light max-w-xl mx-auto">{t('about.join_subtitle')}</p>
                     <Link to="/contact" className="inline-block px-12 py-5 bg-gold-accent text-black text-xs font-bold uppercase tracking-[0.3em] hover:bg-white transition-all transform hover:-translate-y-1">
                        {t('nav.contact')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
