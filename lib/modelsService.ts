
import { supabase } from './supabase';
import type { Model } from '../types';

export const modelsService = {
  async getAllModels() {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getTopModel() {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_top_model', true)
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getModelBySlug(slug: string) {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createModel(model: Partial<Model>) {
    const { data, error } = await supabase
      .from('models')
      .insert([model])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateModel(id: string, updates: Partial<Model>) {
    const { data, error } = await supabase
      .from('models')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteModel(id: string) {
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async uploadFile(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('models')
      .upload(path, file, { 
        cacheControl: '3600',
        upsert: true,
        contentType: file.type // Important for video files
      });
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('models')
      .getPublicUrl(path);
      
    return publicUrl;
  },

  async deleteFile(url: string) {
    try {
      // Extract path from public URL
      // Example: https://.../storage/v1/object/public/models/folder/file.jpg
      const parts = url.split('/models/');
      if (parts.length < 2) return;
      
      const path = parts[1];
      const { error } = await supabase.storage
        .from('models')
        .remove([path]);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting file from storage:', err);
    }
  }
};
