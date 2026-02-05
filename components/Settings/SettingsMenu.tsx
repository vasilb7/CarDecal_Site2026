import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { SETTINGS_CONFIG, SettingsSectionId } from './config';

interface SettingsMenuProps {
    onSelect: (id: SettingsSectionId) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onSelect }) => {
    const { t } = useTranslation();

    return (
        <div className="px-4 py-8 max-w-[760px] mx-auto">
            <header className="mb-10 text-center md:text-left">
                <h2 className="text-2xl font-serif font-bold text-white mb-2">{t('settings_page.menu_title') || 'Настройки'}</h2>
                <p className="text-sm text-white/40 tracking-wide uppercase">{t('settings_page.menu_subtitle') || 'Управление на вашия профил и преживяване'}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SETTINGS_CONFIG.map((section, index) => {
                    const Icon = section.icon;
                    return (
                        <motion.button
                            key={section.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onSelect(section.id)}
                            className="group relative flex flex-col items-start p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all text-left overflow-hidden"
                        >
                            <div className="mb-4 p-3 rounded-xl bg-white/5 text-white/70 group-hover:text-gold-accent group-hover:bg-gold-accent/10 transition-colors">
                                <Icon className="w-6 h-6" />
                            </div>
                            
                            <h3 className="text-sm font-bold text-white mb-1 group-hover:text-gold-accent transition-colors">
                                {t(section.title).toUpperCase()}
                            </h3>
                            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
                                {t(section.description)}
                            </p>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="w-4 h-4 text-gold-accent" />
                            </div>
                        </motion.button>
                    );
                })}
            </div>
            
            <footer className="mt-12 pt-8 border-t border-white/5 text-center">
                <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">VB Agency v2.0 • Secure & Encrypted</p>
            </footer>
        </div>
    );
};

export default SettingsMenu;
