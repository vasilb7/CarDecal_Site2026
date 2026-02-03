
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AboutPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-surface">
            <div className="container mx-auto px-6 py-20 md:py-32">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-serif text-text-primary">{t('about.title')}</h1>
                    <p className="mt-6 text-lg text-text-muted">
                        {t('about.subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center mt-20 md:mt-32">
                    <div>
                        <img src="/Stock Photos/Agency Models together/67.jpeg" alt="Behind the scenes" className="w-full h-auto object-cover"/>
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-serif text-text-primary mb-6">{t('about.brand_title')}</h2>
                        <p className="text-text-muted mb-4">
                            {t('about.brand_p1')}
                        </p>
                        <p className="text-text-muted">
                            {t('about.brand_p2')}
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center mt-20 md:mt-32">
                    <div className="order-2 md:order-1">
                        <h2 className="text-3xl md:text-4xl font-serif text-text-primary mb-6">{t('about.values_title')}</h2>
                        <ul className="space-y-4 text-text-muted">
                            <li className="flex items-start">
                                <span className="text-gold-accent mr-3 mt-1">&#10003;</span>
                                <span><strong className="text-text-primary">{t('about.value1_title')}</strong> {t('about.value1_desc')}</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-gold-accent mr-3 mt-1">&#10003;</span>
                                <span><strong className="text-text-primary">{t('about.value2_title')}</strong> {t('about.value2_desc')}</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-gold-accent mr-3 mt-1">&#10003;</span>
                                <span><strong className="text-text-primary">{t('about.value3_title')}</strong> {t('about.value3_desc')}</span>
                            </li>
                        </ul>
                    </div>
                     <div className="order-1 md:order-2">
                        <img src="/Stock Photos/Agency Models together/122.jpeg" alt="Studio shot" className="w-full h-auto object-cover"/>
                    </div>
                </div>

                <div className="text-center mt-20 md:mt-32">
                     <h2 className="text-3xl font-serif text-text-primary">{t('about.join_title')}</h2>
                     <p className="mt-4 text-text-muted">{t('about.join_subtitle')}</p>
                     <Link to="/contact" className="btn-mobile-full mt-8 inline-block px-8 py-3 bg-gold-accent text-background text-sm uppercase tracking-widest hover:bg-opacity-90 transition-colors duration-300">
                        {t('nav.contact')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
