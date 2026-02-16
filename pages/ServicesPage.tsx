import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { settingsService } from '../lib/settingsService';
import { supabase } from '../lib/supabase';

const ServicesPage: React.FC = () => {
    const { t } = useTranslation();
    const [bg1, setBg1] = useState("");
    const [bg2, setBg2] = useState("");
    const [bg3, setBg3] = useState("");

    useEffect(() => {
        const loadBgs = async () => {
            const bgs = await settingsService.getPageBackgrounds();
            setBg1(bgs.bg_services_1);
            setBg2(bgs.bg_services_2);
            setBg3(bgs.bg_services_3);
        };
        loadBgs();

        const channel = supabase
            .channel('services_bg_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (payload: any) => {
                if (payload.new.key === 'bg_services_1') setBg1(payload.new.value);
                if (payload.new.key === 'bg_services_2') setBg2(payload.new.value);
                if (payload.new.key === 'bg_services_3') setBg3(payload.new.value);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const services = [
        {
            name: t('services.list.casting.name'),
            focus: t('services.list.casting.focus'),
            description: t('services.list.casting.description'),
            image: bg1
        },
        {
            name: t('services.list.production.name'),
            focus: t('services.list.production.focus'),
            description: t('services.list.production.description'),
            image: bg2
        },
        {
            name: t('services.list.creative.name'),
            focus: t('services.list.creative.focus'),
            description: t('services.list.creative.description'),
            image: bg3
        }
    ];

    return (
        <div className="bg-background text-text-primary min-h-screen">
            <div className="container mx-auto px-6 py-24 md:py-40">
                <div className="max-w-6xl mx-auto text-center mb-32 md:mb-48 space-y-8">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-8xl font-serif leading-tight"
                    >
                        {t('services.title')}
                    </motion.h1>
                    <div className="w-24 h-px bg-gold-accent mx-auto" />
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl md:text-2xl text-text-muted font-light max-w-3xl mx-auto leading-relaxed"
                    >
                        {t('services.subtitle')}
                    </motion.p>
                </div>

                <div className="space-y-40 md:space-y-64">
                    {services.map((service, index) => (
                        <div key={service.name} className={`grid md:grid-cols-2 gap-16 md:gap-32 items-center ${index % 2 !== 0 ? 'md:grid-flow-row-dense' : ''}`}>
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className={index % 2 !== 0 ? 'md:col-start-2' : ''}
                            >
                                <img src={service.image} alt={service.name} className="w-full h-auto aspect-[4/5] object-cover grayscale hover:grayscale-0 transition-all duration-1000"/>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className={`space-y-6 ${index % 2 !== 0 ? 'md:col-start-1 md:row-start-1' : ''}`}
                            >
                                <h2 className="text-gold-accent uppercase tracking-[0.3em] text-xs font-bold">{service.focus}</h2>
                                <h3 className="text-4xl md:text-6xl font-serif text-text-primary leading-tight">{service.name}</h3>
                                <div className="w-16 h-px bg-gold-accent/50" />
                                <p className="text-xl text-text-muted font-light leading-relaxed">
                                    {service.description}
                                </p>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
