import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import ValentineBanner from './ValentineBanner';
import ChristmasBanner from './ChristmasBanner';
import PhotoshootBanner from './PhotoshootBanner';
import SiteAnnouncement from './SiteAnnouncement';
import { settingsService } from '../lib/settingsService';
import { supabase } from '../lib/supabase';

import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [activePromo, setActivePromo] = useState<string>('none');
  const [announcement, setAnnouncement] = useState<{ 
    text_bg?: string;
    text_en?: string;
    active: boolean;
    buttonText_bg?: string;
    buttonText_en?: string;
    buttonLink?: string;
    buttonType?: 'internal' | 'external';
    customSvg?: string;
    iconColor?: string;
    buttonColor?: string;
    textColor?: string;
    iconSize?: number;
    buttonTextColor?: string;
    bannerColor?: string;
    bannerColor2?: string;
    bannerGradient?: boolean;
    buttonFontSize?: number;
  }>({ active: false });

  const currentLang = i18n.language.startsWith('bg') ? 'bg' : 'en';

  useEffect(() => {
    settingsService.getActivePromo().then(setActivePromo);
    settingsService.getAnnouncement().then(setAnnouncement);

    // Real-time sync
    const channel = supabase
      .channel('layout_settings_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload: any) => {
        const { key, value } = payload.new || {};
        if (key === 'active_promo') {
          setActivePromo(value || 'none');
        }
        if (key === 'site_announcement') {
          try { setAnnouncement(JSON.parse(value)); } catch {}
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const displayText = currentLang === 'bg' ? announcement.text_bg : announcement.text_en;
  const displayButtonText = currentLang === 'bg' ? announcement.buttonText_bg : announcement.buttonText_en;

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <AnimatePresence mode="wait">
        {announcement.active && displayText && (
          <SiteAnnouncement 
            key="announcement" 
            text={displayText} 
            buttonText={displayButtonText}
            buttonLink={announcement.buttonLink}
            buttonType={announcement.buttonType}
            customSvg={announcement.customSvg}
            iconColor={announcement.iconColor}
            buttonColor={announcement.buttonColor}
            textColor={announcement.textColor}
            iconSize={announcement.iconSize}
            buttonTextColor={announcement.buttonTextColor}
            bannerColor={announcement.bannerColor}
            bannerColor2={announcement.bannerColor2}
            bannerGradient={announcement.bannerGradient}
            buttonFontSize={announcement.buttonFontSize}
            onClose={() => setAnnouncement({ ...announcement, active: false })} 
          />
        )}
        {activePromo === 'valentines' && <ValentineBanner key="valentines" />}
        {activePromo === 'christmas' && <ChristmasBanner key="christmas" />}
        {activePromo === 'photoshoot' && <PhotoshootBanner key="photoshoot" />}
      </AnimatePresence>
      <Header />
      <main className="flex-grow w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
