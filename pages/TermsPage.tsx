import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Gavel, Scale, CreditCard, AlertTriangle, Copyright, RefreshCcw } from 'lucide-react';
import SEO from '../components/SEO';

const TermsPage: React.FC = () => {
    const { t } = useTranslation();

    const sections = [
        {
            id: 'gen',
            icon: Scale,
            title: t('terms_page.gen_title'),
            content: t('terms_page.gen_text')
        },
        {
            id: 'reg',
            icon: CreditCard,
            title: t('terms_page.reg_title'),
            content: t('terms_page.reg_text')
        },
        {
            id: 'book',
            icon: CreditCard,
            title: t('terms_page.book_title'),
            content: t('terms_page.book_text')
        },
        {
            id: 'resp',
            icon: AlertTriangle,
            title: t('terms_page.resp_title'),
            content: t('terms_page.resp_text')
        },
        {
            id: 'intel',
            icon: Copyright,
            title: t('terms_page.intel_title'),
            content: t('terms_page.intel_text')
        },
        {
            id: 'term',
            icon: RefreshCcw,
            title: t('terms_page.term_title'),
            content: t('terms_page.term_text')
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-red-600/30">
            <SEO title="Условия" />
            
            {/* Hero Header */}
            <div className="relative pt-32 pb-16 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent -z-10" />
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 italic">
                        {t('terms_page.title').split(' ')[0]}
                        <span className="text-red-600 block md:inline md:ml-3">{t('terms_page.title').split(' ').slice(1).join(' ')}</span>
                    </h1>
                    <div className="w-20 h-1 bg-red-600 mx-auto" />
                </motion.div>
            </div>

            {/* Content Sections */}
            <div className="max-w-4xl mx-auto px-6 pb-24 space-y-4">
                {sections.map((section, idx) => (
                    <motion.section
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative p-5 bg-[#111111] border border-white/5 rounded-2xl hover:border-red-600/30 transition-all duration-500"
                    >
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center border border-red-600/20 group-hover:scale-110 transition-transform">
                                    <section.icon className="w-5 h-5 text-red-600" />
                                </div>
                            </div>
                            <div className="space-y-3 flex-grow">
                                <h2 className="text-lg font-black uppercase tracking-widest text-white group-hover:text-red-600 transition-colors">
                                    {section.title}
                                </h2>
                                <div className="text-zinc-400 text-sm leading-relaxed font-medium">
                                    {section.content}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                ))}

                {/* Footer Note */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="text-center pt-8 border-t border-white/5"
                >
                    <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-black">
                        Последно обновено: {new Date().toLocaleDateString('bg-BG')}
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsPage;
