import { supabase } from './supabase';

export const settingsService = {
  async getMaintenanceMode() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching maintenance mode:', error);
      return false;
    }
    return data?.value === 'true';
  },

  async setMaintenanceMode(enabled: boolean) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'maintenance_mode', 
        value: String(enabled),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    
    if (error) throw error;
  },

  async getMaintenanceMessage() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_message')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return '';
    return data?.value || '';
  },

  async setMaintenanceMessage(message: string) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'maintenance_message', 
        value: message,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  async getMaintenanceEndTime() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_end_time')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return null;
    return data?.value || null;
  },

  async setMaintenanceEndTime(endTime: string | null) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'maintenance_end_time', 
        value: endTime || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  async getMaintenancePerks() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_perks')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return '';
    return data?.value || '';
  },

  async setMaintenancePerks(perks: string) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'maintenance_perks', 
        value: perks,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  async getMaintenanceUpdatesText() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_updates_text')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return '';
    return data?.value || '';
  },

  async setMaintenanceUpdatesText(text: string) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'maintenance_updates_text', 
        value: text,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  async getHeroSettings() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'hero_type', 'hero_image_url', 'hero_video_url', 'hero_grayscale', 'hero_blur', 'hero_brightness', 'hero_contrast', 'hero_saturation',
        'hero_title_bg', 'hero_title_en', 'hero_subtitle_bg', 'hero_subtitle_en',
        'hero_title_font', 'hero_subtitle_font'
      ]);
    
    const defaults = { 
        hero_type: 'video', 
        hero_image_url: '/Site_Pics/Homepage/valentine_hero.jpg', 
        hero_video_url: '/Site_Pics/Homepage/homevid.mp4',
        hero_grayscale: true,
        hero_blur: 0,
        hero_brightness: 100,
        hero_contrast: 100,
        hero_saturation: 100,
        hero_title_bg: 'VB VISION',
        hero_title_en: 'VB VISION',
        hero_subtitle_bg: 'Твоето лице. Твоят бранд. Твоята кариера.',
        hero_subtitle_en: 'Your Face. Your Brand. Your Career.',
        hero_title_font: 'Playfair Display',
        hero_subtitle_font: 'Inter'
    };

    if (error) return defaults;

    const settings = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    return {
        hero_type: settings['hero_type'] || defaults.hero_type,
        hero_image_url: settings['hero_image_url'] || defaults.hero_image_url,
        hero_video_url: settings['hero_video_url'] || defaults.hero_video_url,
        hero_grayscale: settings['hero_grayscale'] === undefined ? defaults.hero_grayscale : settings['hero_grayscale'] === 'true',
        hero_blur: parseInt(settings['hero_blur'] || String(defaults.hero_blur)),
        hero_brightness: parseInt(settings['hero_brightness'] || String(defaults.hero_brightness)),
        hero_contrast: parseInt(settings['hero_contrast'] || String(defaults.hero_contrast)),
        hero_saturation: parseInt(settings['hero_saturation'] || String(defaults.hero_saturation)),
        hero_title_bg: settings['hero_title_bg'] || defaults.hero_title_bg,
        hero_title_en: settings['hero_title_en'] || defaults.hero_title_en,
        hero_subtitle_bg: settings['hero_subtitle_bg'] || defaults.hero_subtitle_bg,
        hero_subtitle_en: settings['hero_subtitle_en'] || defaults.hero_subtitle_en,
        hero_title_font: settings['hero_title_font'] || defaults.hero_title_font,
        hero_subtitle_font: settings['hero_subtitle_font'] || defaults.hero_subtitle_font
    };
  },

  async setHeroSetting(key: string, value: string) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key, 
        value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  async getPricingSettings() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'pricing_bg_standard', 'pricing_bg_valentines', 'pricing_bg_christmas', 'pricing_bg_photoshoot',
        'pricing_type_standard', 'pricing_type_valentines', 'pricing_type_christmas', 'pricing_type_photoshoot'
      ]);
    
    if (error) return { 
        pricing_bg_standard: '/Site_Pics/Pricing/backroundpricing.png', 
        pricing_bg_valentines: '/Site_Pics/Pricing/backroundpricing.png', 
        pricing_bg_christmas: '/Site_Pics/Pricing/backroundpricing.png',
        pricing_bg_photoshoot: '/Site_Pics/Pricing/backroundpricing.png',
        pricing_type_standard: 'image',
        pricing_type_valentines: 'image',
        pricing_type_christmas: 'image',
        pricing_type_photoshoot: 'image'
    };

    const settings = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    return {
        pricing_bg_standard: settings['pricing_bg_standard'] || '/Site_Pics/Pricing/backroundpricing.png',
        pricing_bg_valentines: settings['pricing_bg_valentines'] || '/Site_Pics/Pricing/backroundpricing.png',
        pricing_bg_christmas: settings['pricing_bg_christmas'] || '/Site_Pics/Pricing/backroundpricing.png',
        pricing_bg_photoshoot: settings['pricing_bg_photoshoot'] || '/Site_Pics/Pricing/backroundpricing.png',
        pricing_type_standard: settings['pricing_type_standard'] || 'image',
        pricing_type_valentines: settings['pricing_type_valentines'] || 'image',
        pricing_type_christmas: settings['pricing_type_christmas'] || 'image',
        pricing_type_photoshoot: settings['pricing_type_photoshoot'] || 'image'
    };
  },

  async setPricingVisuals(settings: any): Promise<void> {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString()
    }));
    
    // Convert to upsert format for Supabase
    // Note: Supabase upsert requires an array if updating multiple
    const { error } = await supabase
      .from('site_settings')
      .upsert(updates, { onConflict: 'key' }); // Check if 'key' is the constraint
      
    if (error) throw error;
  },

  async getPageBackgrounds() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
        'bg_about_1', 'bg_about_2',
        'bg_services_1', 'bg_services_2', 'bg_services_3',
        'bg_contact', 'bg_blog'
      ]);
    
    const defaults = {
      bg_about_1: '/Site_Pics/Model_pics_together/67.jpeg',
      bg_about_2: '/Site_Pics/Model_pics_together/122.jpeg',
      bg_services_1: '/Site_Pics/Model_pics_together/10.jpeg',
      bg_services_2: '/Site_Pics/Model_pics_together/12.jpeg',
      bg_services_3: '/Site_Pics/Model_pics_together/5.jpeg',
      bg_contact: '/Site_Pics/Contact_Page/VB.png',
      bg_blog: '/Site_Pics/Model_pics_together/18.jpeg'
    };

    if (error) return defaults;
    const settings = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    return {
      bg_about_1: settings['bg_about_1'] || defaults.bg_about_1,
      bg_about_2: settings['bg_about_2'] || defaults.bg_about_2,
      bg_services_1: settings['bg_services_1'] || defaults.bg_services_1,
      bg_services_2: settings['bg_services_2'] || defaults.bg_services_2,
      bg_services_3: settings['bg_services_3'] || defaults.bg_services_3,
      bg_contact: settings['bg_contact'] || defaults.bg_contact,
      bg_blog: settings['bg_blog'] || defaults.bg_blog
    };
  },

  // ═══════ PROMOTIONS ═══════
  async getActivePromo(): Promise<string> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'active_promo')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return 'none';
    return data?.value || 'none';
  },

  async setActivePromo(promo: string) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'active_promo', 
        value: promo,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  async getPromoExpiration() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'active_promo_expires_at')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return null;
    return data?.value || null;
  },

  async setPromoExpiration(endTime: string | null) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'active_promo_expires_at', 
        value: endTime || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  // ═══════ ANNOUNCEMENTS ═══════
  async getAnnouncement() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_announcement')
      .maybeSingle();
    
    const defaults = { 
      text_bg: '', 
      text_en: '',
      active: false, 
      buttonText_bg: '', 
      buttonText_en: '',
      buttonLink: '', 
      buttonType: 'internal',
      customSvg: '',
      iconColor: '#3b82f6',
      buttonColor: '#3b82f6',
      textColor: '#ffffff',
      iconSize: 14,
      buttonTextColor: '#000000',
      bannerColor: '#09090b',
      bannerColor2: '#09090b',
      bannerGradient: false,
      buttonFontSize: 9 
    };

    if (error && error.code !== 'PGRST116') return defaults;
    
    try {
      if (data?.value) {
        const parsed = JSON.parse(data.value);
        return { ...defaults, ...parsed };
      }
    } catch {}
    return defaults;
  },

  async setAnnouncement(config: any) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'site_announcement', 
        value: JSON.stringify(config),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  async getPromoPricingRoute(): Promise<string> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'promo_pricing_route')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return 'default';
    return data?.value || 'default';
  },

  async setPromoPricingRoute(route: string) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'promo_pricing_route', 
        value: route,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  // ═══════ PRICING CONFIG ═══════
  // Structure: { basePrices: {starter, pro, director}, promos: { valentines: {starter, pro, director}, christmas: {starter, pro, director} } }
  // Discount values are percentages (e.g. 50 = 50% off)
  
  getDefaultPricingConfig() {
    return {
      basePrices: {
        starter: 99,
        pro: 299,
        business: 480,
        director: 1799
      },
      promos: {
        valentines: {
          starter: 50,  // 50% off → 49€
          pro: 50,       // 50% off → 149€
          business: 50,  // 50% off → 240€
          director: 0    // no discount → Contact
        },
        christmas: {
          starter: 40,  // 40% off → 59€
          pro: 40,       // 40% off → 179€
          business: 40,  // 40% off → 288€
          director: 0    // no discount → Contact
        },
        photoshoot: {
          starter: 0,
          pro: 0,
          business: 0,
          director: 0
        }
      },
      annualDiscount: {
        starter: 20,
        pro: 20,
        business: 20,
        director: 0
      }
    };
  },

  async getPricingConfig() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'pricing_config')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return this.getDefaultPricingConfig();
    
    try {
      if (data?.value) return JSON.parse(data.value);
    } catch { /* ignore parse error */ }
    
    return this.getDefaultPricingConfig();
  },

  async setPricingConfig(config: any) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'pricing_config', 
        value: JSON.stringify(config),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  async getLookbookImages(): Promise<string[]> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'homepage_lookbook_images')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return [];
    
    try {
      if (data?.value) return JSON.parse(data.value);
    } catch {}
    
    return [
      '/Site_Pics/Homepage/models_review/1.jpeg',
      '/Site_Pics/Homepage/models_review/2.jpeg',
      '/Site_Pics/Homepage/models_review/3.jpeg',
      '/Site_Pics/Homepage/models_review/4.jpeg',
      '/Site_Pics/Homepage/models_review/5.jpeg',
      '/Site_Pics/Homepage/models_review/6.jpeg',
      '/Site_Pics/Homepage/models_review/7.jpeg',
      '/Site_Pics/Homepage/models_review/8.jpeg',
      '/Site_Pics/Homepage/models_review/9.jpeg',
      '/Site_Pics/Homepage/models_review/10.jpeg',
      '/Site_Pics/Homepage/models_review/11.jpeg',
      '/Site_Pics/Homepage/models_review/12.jpeg'
    ];
  },

  async setLookbookImages(images: string[]) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'homepage_lookbook_images', 
        value: JSON.stringify(images),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  // ═══════ LOOKBOOK TITLE SETTINGS ═══════
  async getLookbookTitle(): Promise<{ titleBg: string; titleEn: string; descBg: string; descEn: string; font: string; descFont: string; startDate: string; endDate: string; isPermanent: boolean; name: string }> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'lookbook_title_config')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    const defaults = {
      titleBg: 'Lookbook Витрина',
      titleEn: 'Lookbook Showcase',
      descBg: '',
      descEn: '',
      font: 'Playfair Display',
      descFont: 'Inter',
      startDate: '',
      endDate: '',
      isPermanent: false,
      name: 'Default (Global)'
    };

    try {
      if (data?.value) return { ...defaults, ...JSON.parse(data.value) };
    } catch {}
    return defaults;
  },

  async setLookbookTitle(config: { titleBg: string; titleEn: string; descBg: string; descEn: string; font: string; descFont: string; startDate?: string; endDate?: string; isPermanent?: boolean; name?: string }) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'lookbook_title_config',
        value: JSON.stringify(config),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  // ═══════ LOOKBOOK PRESETS & SCHEDULING ═══════
  async getLookbookPresets(): Promise<any[]> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'lookbook_presets')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    try {
      if (data?.value) return JSON.parse(data.value);
    } catch {}
    return [];
  },

  async saveLookbookPresets(presets: any[]) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'lookbook_presets',
        value: JSON.stringify(presets),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error) throw error;
  },

  async getActiveHeroContent(): Promise<any> {
    const globalHero = await this.getHeroSettings();
    return {
      ...globalHero,
      id: 'global_hero'
    };
  },

  async getActiveLookbookContent(): Promise<{ images: string[], title: any, id: string }> {
    // 1. Get all presets
    const presets = await this.getLookbookPresets();
    
    const now = new Date();

    // 2. Filter by active schedule OR permanent status
    const activeOptions = presets.filter(p => {
      if (p.isPermanent) return true;
      if (!p.startDate || !p.endDate) return false;
      
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return now >= start && now <= end;
    });

    // 3. Sort: 
    // - Permanent items first
    // - Then by StartDate (Latest starts win - most specific)
    const winner = activeOptions.sort((a, b) => {
      // 1. Forced Active wins all
      if (a.isPermanent && !b.isPermanent) return -1;
      if (!a.isPermanent && b.isPermanent) return 1;
      
      // 2. Most recently started wins (Connector logic)
      if (a.startDate && b.startDate) {
        const timeA = new Date(a.startDate).getTime();
        const timeB = new Date(b.startDate).getTime();
        if (timeB !== timeA) return timeB - timeA;
      }
      
      return 0;
    })[0];

    // 4. Build final result
    const finalWinner = winner || { 
      images: [], 
      title: { titleBg: '', titleEn: '', descBg: '', descEn: '', font: '', descFont: '' }, 
      id: 'none' 
    };

    return {
      images: finalWinner.images,
      title: {
        titleBg: finalWinner.titleBg,
        titleEn: finalWinner.titleEn,
        descBg: finalWinner.descBg,
        descEn: finalWinner.descEn,
        font: finalWinner.font,
        descFont: finalWinner.descFont
      },
      id: finalWinner.id || (finalWinner.isPreset ? `preset_${finalWinner.id}` : 'global_config')
    };
  },

  // Helper: calculate discounted price
  calcDiscountedPrice(basePrice: number, discountPercent: number): number {
    if (discountPercent <= 0) return basePrice;
    return Math.round(basePrice * (1 - discountPercent / 100));
  },


};
