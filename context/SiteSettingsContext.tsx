import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSettings {
    hero_media_url: string;
    hero_media_type: 'image' | 'video';
    maintenance_mode: boolean;
    maintenance_title: string;
    maintenance_message: string;
    maintenance_end_time: string | null;
    maintenance_bg_url: string;
    maintenance_bg_url_mobile: string;
    maintenance_logo_url: string;
    announcement_mode: boolean;
    announcement_text: string;
    announcement_bg_color: string;
    announcement_text_color: string;
    announcement_font_size: string;
    announcement_font_weight: string;
    announcement_letter_spacing: string;
    maintenance_auto_start_at: string | null;
    maintenance_features: string;
}

const DEFAULTS: SiteSettings = {
    hero_media_url: '/Homepage/frame_000.jpg',
    hero_media_type: 'image',
    maintenance_mode: false,
    maintenance_title: 'ОЧАКВАЙТЕ СКОРО!',
    maintenance_message: 'Нашият сайт е в процес на профилактика. Очаквайте ни скоро!',
    maintenance_end_time: null,
    maintenance_bg_url: '/Maintance/1.jpeg',
    maintenance_bg_url_mobile: '/Maintance/1.jpeg',
    maintenance_logo_url: '/Maintance/LOGO.png',
    announcement_mode: false,
    announcement_text: 'Единствен имейл: cardecal@abv.bg\nЕдинствен номер: 089 478 9942',
    announcement_bg_color: '#000000',
    announcement_text_color: '#ffffff',
    announcement_font_size: '11px',
    announcement_font_weight: 'bold',
    announcement_letter_spacing: '0.15em',
    maintenance_auto_start_at: null,
    maintenance_features: '',
};

interface SiteSettingsContextType {
    settings: SiteSettings;
    loading: boolean;
    serverTimeOffset: number;
    updateSetting: (key: string, value: string) => Promise<void>;
    refetch: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [serverTimeOffset, setServerTimeOffset] = useState(0);

    const fetchSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('key, value');
            if (error) throw error;

            const map: Record<string, string> = {};
            (data || []).forEach(row => { map[row.key] = row.value; });

            setSettings({
                hero_media_url: map['hero_media_url'] || DEFAULTS.hero_media_url,
                hero_media_type: (map['hero_media_type'] as 'image' | 'video') || DEFAULTS.hero_media_type,
                maintenance_mode: String(map['maintenance_mode']).toLowerCase() === 'true',
                maintenance_title: map['maintenance_title'] || DEFAULTS.maintenance_title,
                maintenance_message: map['maintenance_message'] || DEFAULTS.maintenance_message,
                maintenance_end_time: map['maintenance_end_time'] || DEFAULTS.maintenance_end_time,
                maintenance_bg_url: map['maintenance_bg_url'] || DEFAULTS.maintenance_bg_url,
                maintenance_bg_url_mobile: map['maintenance_bg_url_mobile'] || DEFAULTS.maintenance_bg_url_mobile,
                maintenance_logo_url: map['maintenance_logo_url'] || DEFAULTS.maintenance_logo_url,
                announcement_mode: String(map['announcement_mode']).toLowerCase() === 'true',
                announcement_text: map['announcement_text'] || DEFAULTS.announcement_text,
                announcement_bg_color: map['announcement_bg_color'] || DEFAULTS.announcement_bg_color,
                announcement_text_color: map['announcement_text_color'] || DEFAULTS.announcement_text_color,
                announcement_font_size: map['announcement_font_size'] || DEFAULTS.announcement_font_size,
                announcement_font_weight: map['announcement_font_weight'] || DEFAULTS.announcement_font_weight,
                announcement_letter_spacing: map['announcement_letter_spacing'] || DEFAULTS.announcement_letter_spacing,
                maintenance_auto_start_at: map['maintenance_auto_start_at'] || DEFAULTS.maintenance_auto_start_at,
                maintenance_features: map['maintenance_features'] || DEFAULTS.maintenance_features,
            });

            const { data: serverTime } = await supabase.rpc('get_server_time');
            if (serverTime) {
                const diffMs = new Date(serverTime).getTime() - Date.now();
                setServerTimeOffset(diffMs);
            }
        } catch (e) {
            console.error('fetchSettings error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();

        const channel = supabase
            .channel('global_site_settings')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'site_settings' },
                (payload) => {
                    const newData = payload.new as { key: string; value: any };
                    if (!newData || !newData.key) return;


                    
                    setSettings(prev => {
                        const next = { ...prev };
                        const val = newData.value;
                        if (newData.key === 'maintenance_mode') {
                            next.maintenance_mode = String(val).toLowerCase() === 'true';
                        } else if (newData.key === 'announcement_mode') {
                            next.announcement_mode = String(val).toLowerCase() === 'true';
                        } else if (newData.key in next) {
                            (next as any)[newData.key] = val;
                        }
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchSettings]);

    const updateSetting = async (key: string, value: string) => {
        // Optimistic update
        setSettings(prev => {
            const next = { ...prev };
            if (key === 'maintenance_mode') {
                next.maintenance_mode = String(value).toLowerCase() === 'true';
            } else if (key === 'announcement_mode') {
                next.announcement_mode = String(value).toLowerCase() === 'true';
            } else if (key in next) {
                (next as any)[key] = value;
            }
            return next;
        });

        const { error } = await supabase
            .from('site_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() });
        
        if (error) {
            console.error(`Error updating setting ${key}:`, error);
            fetchSettings(); // Re-sync
            throw error;
        }
    };

    return (
        <SiteSettingsContext.Provider value={{ settings, loading, serverTimeOffset, updateSetting, refetch: fetchSettings }}>
            {children}
        </SiteSettingsContext.Provider>
    );
};

export const useSiteSettings = () => {
    const context = useContext(SiteSettingsContext);
    if (context === undefined) {
        throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
    }
    return context;
};
