
import fs from 'fs-extra';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runSync() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );
  const mapping = await fs.readJson('cloudinary_mapping.json');
  
  console.log('Total mapping entries:', Object.keys(mapping).length);
  
  let offset = 0;
  const PAGE_SIZE = 50;
  let totalUpdated = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, avatar, cover_image, card_images')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching products:', error);
      break;
    }

    if (!products || products.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Processing batch ${offset} to ${offset + products.length}...`);

    const updatePromises = products.map(async (product) => {
      const updates = {};
      let changed = false;

      if (product.avatar && mapping[product.avatar] && !product.avatar.startsWith('http')) {
        updates.avatar = mapping[product.avatar];
        changed = true;
      }

      if (product.cover_image && mapping[product.cover_image] && !product.cover_image.startsWith('http')) {
        updates.cover_image = mapping[product.cover_image];
        changed = true;
      }

      if (Array.isArray(product.card_images)) {
        const newCardImages = product.card_images.map(img => mapping[img] || img);
        if (JSON.stringify(newCardImages) !== JSON.stringify(product.card_images)) {
          updates.card_images = newCardImages;
          changed = true;
        }
      }

      if (changed) {
        const { error: updateError } = await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`Error updating product ${product.id}:`, updateError);
          return false;
        }
        return true;
      }
      return false;
    });

    const results = await Promise.all(updatePromises);
    totalUpdated += results.filter(r => r === true).length;
    
    offset += PAGE_SIZE;
  }

  console.log('--- FINAL SYNC REPORT ---');
  console.log(`Total products updated: ${totalUpdated}`);
}

runSync().catch(console.error);
