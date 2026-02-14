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
      .in('key', ['hero_type', 'hero_image_url', 'hero_video_url', 'hero_grayscale']);
    
    if (error) return { 
        hero_type: 'video', 
        hero_image_url: '/Site_Pics/Homepage/valentine_hero.jpg', 
        hero_video_url: '/Site_Pics/Homepage/homevid.mp4',
        hero_grayscale: true
    };

    const settings = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    return {
        hero_type: settings['hero_type'] || 'video',
        hero_image_url: settings['hero_image_url'] || '/Site_Pics/Homepage/valentine_hero.jpg',
        hero_video_url: settings['hero_video_url'] || '/Site_Pics/Homepage/homevid.mp4',
        hero_grayscale: settings['hero_grayscale'] === undefined ? true : settings['hero_grayscale'] === 'true'
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

  // ═══════ ANNOUNCEMENTS ═══════
  async getAnnouncement() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_announcement')
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') return { text: '', active: false };
    try {
      if (data?.value) return JSON.parse(data.value);
    } catch {}
    return { text: '', active: false };
  },

  async setAnnouncement(config: { text: string; active: boolean }) {
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
        director: 1799
      },
      promos: {
        valentines: {
          starter: 50,  // 50% off → 49€
          pro: 50,       // 50% off → 149€
          director: 0    // no discount → Contact
        },
        christmas: {
          starter: 40,  // 40% off → 59€
          pro: 40,       // 40% off → 179€
          director: 0    // no discount → Contact
        },
        photoshoot: {
          starter: 0,
          pro: 0,
          director: 0
        }
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

  // Helper: calculate discounted price
  calcDiscountedPrice(basePrice: number, discountPercent: number): number {
    if (discountPercent <= 0) return basePrice;
    return Math.round(basePrice * (1 - discountPercent / 100));
  }
};
