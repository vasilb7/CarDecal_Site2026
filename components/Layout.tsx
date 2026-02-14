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

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activePromo, setActivePromo] = useState<string>('none');
  const [announcement, setAnnouncement] = useState<{ text: string; active: boolean }>({ text: '', active: false });

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

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <AnimatePresence mode="wait">
        {announcement.active && (
          <SiteAnnouncement 
            key="announcement" 
            text={announcement.text} 
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
