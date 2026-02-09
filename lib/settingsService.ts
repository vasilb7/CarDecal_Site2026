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
  }
};
