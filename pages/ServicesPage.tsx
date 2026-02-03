
import React from 'react';
import { useTranslation } from 'react-i18next';

const ServicesPage: React.FC = () => {
    const { t } = useTranslation();

    const services = [
        {
            name: t('services.list.casting.name'),
            focus: t('services.list.casting.focus'),
            description: t('services.list.casting.description'),
            image: "/Stock Photos/Agency Models together/10.jpeg"
        },
        {
            name: t('services.list.production.name'),
            focus: t('services.list.production.focus'),
            description: t('services.list.production.description'),
            image: "/Stock Photos/Agency Models together/12.jpeg"
        },
        {
            name: t('services.list.creative.name'),
            focus: t('services.list.creative.focus'),
            description: t('services.list.creative.description'),
            image: "/Stock Photos/Agency Models together/5.jpeg"
        }
    ];

    return (
        <div className="bg-background">
            <div className="container mx-auto px-6 py-20 md:py-32">
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <h1 className="text-4xl md:text-6xl font-serif text-text-primary">{t('services.title')}</h1>
                    <p className="mt-6 text-lg text-text-muted">
                        {t('services.subtitle')}
                    </p>
                </div>

                <div className="space-y-20">
                    {services.map((service, index) => (
                        <div key={service.name} className={`grid md:grid-cols-2 gap-10 md:gap-20 items-center ${index % 2 !== 0 ? 'md:grid-flow-row-dense' : ''}`}>
                            <div className={index % 2 !== 0 ? 'md:col-start-2' : ''}>
                                <img src={service.image} alt={service.name} className="w-full h-auto object-cover"/>
                            </div>
                            <div className={index % 2 !== 0 ? 'md:col-start-1 md:row-start-1' : ''}>
                                <h2 className="text-gold-accent uppercase tracking-widest text-sm">{service.focus}</h2>
                                <h3 className="text-3xl md:text-4xl font-serif text-text-primary mt-2 mb-6">{service.name}</h3>
                                <p className="text-text-muted">
                                    {service.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
