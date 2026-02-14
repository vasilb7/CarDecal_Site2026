
import { supabase } from './supabase';
import { modelsService } from './modelsService';

interface ManifestModel {
  name: string;
  category: string;
  avatar: string;
  images: string[];
}

export const adminService = {
  async reseedDatabase() {
    try {
      console.log('Starting database reseed...');
      
      // 1. Fetch Manifest
      const response = await fetch('/site-manifest.json');
      if (!response.ok) throw new Error('Failed to load site-manifest.json');
      const manifest: ManifestModel[] = await response.json();
      
      console.log(`Loaded manifest with ${manifest.length} models.`);

      console.log(`Loaded manifest with ${manifest.length} models.`);

      // 2. CLEANUP: Delete OLD files from Storage
      console.log('Cleaning up old storage files...');
      const { data: oldModels } = await supabase.from('models').select('avatar, card_images');
      
      if (oldModels && oldModels.length > 0) {
        const filesToDelete: string[] = [];
        
        oldModels.forEach(m => {
          if (m.avatar) {
             const path = m.avatar.split('/models/').pop(); // Extract relative path
             if (path) filesToDelete.push(path);
          }
          if (m.card_images && Array.isArray(m.card_images)) {
            m.card_images.forEach((url: string) => {
              const path = url.split('/models/').pop();
              if (path) filesToDelete.push(path);
            });
          }
        });

        // Delete in batches of 200
        const STORAGE_BATCH = 200;
        for (let i = 0; i < filesToDelete.length; i += STORAGE_BATCH) {
           const batch = filesToDelete.slice(i, i + STORAGE_BATCH);
           if (batch.length > 0) {
             await supabase.storage.from('models').remove(batch);
           }
        }
        console.log(`Deleted ${filesToDelete.length} old images.`);
      }

      // 3. Clear Database (Models)
      const { error: deleteError } = await supabase
        .from('models')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError) throw deleteError;
      console.log('Cleared existing models.');

      // 3. Process Models
      for (const modelData of manifest) {
        console.log(`Processing ${modelData.name}...`);
        
        // Slugify name
        const slug = modelData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        // Upload Avatar
        let avatarUrl = '';
        if (modelData.avatar) {
          avatarUrl = await this.uploadImageFromUrl(modelData.avatar, `${slug}/avatar.jpg`);
        }

        // Upload Gallery Images with Concurrency
        const cardImages: string[] = [];
        const BATCH_SIZE = 5;
        
        // Create an array of indices to process
        const indices = modelData.images.map((_, i) => i);
        
        for (let i = 0; i < indices.length; i += BATCH_SIZE) {
          const batch = indices.slice(i, i + BATCH_SIZE);
          const uploadPromises = batch.map(async (idx) => {
            const imageUrl = modelData.images[idx];
            const ext = imageUrl.split('.').pop() || 'jpg';
            const path = `${slug}/gallery_${idx}.${ext}`;
            return await this.uploadImageFromUrl(imageUrl, path);
          });
          
          const results = await Promise.all(uploadPromises);
          results.forEach(url => {
            if (url) cardImages.push(url);
          });
          
          // Small delay to prevent rate limiting
          await new Promise(r => setTimeout(r, 100));
        }

        // Insert Model
        const { error: insertError } = await supabase
          .from('models')
          .insert({
            name: modelData.name,
            slug,
            categories: [modelData.category],
            location: 'Sofia, BG',
            avatar: avatarUrl,
            card_images: cardImages,
            is_top_model: modelData.category === 'Top Model',
            is_verified: true,
            bio: ''
          });
        
        if (insertError) {
          console.error(`Failed to insert ${modelData.name}:`, insertError);
        }
      }

      console.log('Reseed complete!');
      return { success: true };

    } catch (error) {
      console.error('Reseed failed:', error);
      throw error;
    }
  },

  async uploadImageFromUrl(sourceUrl: string, storagePath: string): Promise<string> {
    try {
      // 1. Fetch Blob
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`Failed to fetch ${sourceUrl}: ${res.statusText}`);
      const blob = await res.blob();

      // 2. Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('models')
        .upload(storagePath, blob, {
          upsert: true,
          contentType: blob.type
        });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data } = supabase.storage
        .from('models')
        .getPublicUrl(storagePath);
      
      return data.publicUrl;
    } catch (e) {
      console.error(`Upload error for ${sourceUrl}:`, e);
      return '';
    }
  }
};
