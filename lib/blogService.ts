import { supabase } from './supabase';

export interface BlogPost {
  id: string;
  title: string;
  title_bg?: string;
  slug: string;
  description?: string;
  description_bg?: string;
  location?: string;
  date: string;
  cover_image?: string;
  images: string[];
  tags: string[];
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const blogService = {
  async getPublishedPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: false })
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('sort_order', { ascending: false })
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  },

  async createPost(post: Partial<BlogPost>): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([post])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadImage(file: File, postSlug: string): Promise<string> {
    const path = `blog/${postSlug}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from('models')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('models')
      .getPublicUrl(path);

    return publicUrl;
  },

  async deleteImage(url: string): Promise<void> {
    try {
      const parts = url.split('/models/');
      if (parts.length < 2) return;
      const path = parts[1];
      await supabase.storage.from('models').remove([path]);
    } catch (err) {
      console.error('Error deleting blog image:', err);
    }
  }
};
