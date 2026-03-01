
import fs from 'fs-extra';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runSync() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );
  
  const mapping = await fs.readJson('cloudinary_mapping_lower.json');
  console.log('Mapping size:', Object.keys(mapping).length);

  let offset = 0;
  const PAGE_SIZE = 50;
  let totalUpdated = 0;
  let hasMore = true;
  let missingEntries = [];

  const normalize = (path) => {
    if (!path || typeof path !== 'string') return null;
    return path.trim().replace(/\\/g, '/').toLowerCase();
  };

  while (hasMore) {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, avatar, cover_image, card_images, name')
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

      // Avatar
      if (product.avatar && !product.avatar.startsWith('http')) {
        const norm = normalize(product.avatar);
        if (mapping[norm]) {
          updates.avatar = mapping[norm];
          changed = true;
        } else if (norm.includes('/site_pics/')) {
          missingEntries.push({ name: product.name, field: 'avatar', path: product.avatar });
        }
      }

      // Cover
      if (product.cover_image && !product.cover_image.startsWith('http')) {
        const norm = normalize(product.cover_image);
        if (mapping[norm]) {
          updates.cover_image = mapping[norm];
          changed = true;
        } else if (norm.includes('/site_pics/')) {
          missingEntries.push({ name: product.name, field: 'cover', path: product.cover_image });
        }
      }

      // Card Images
      if (Array.isArray(product.card_images)) {
        const newImages = product.card_images.map(img => {
          if (img && !img.startsWith('http')) {
            const norm = normalize(img);
            if (mapping[norm]) return mapping[norm];
            if (norm.includes('/site_pics/')) {
              missingEntries.push({ name: product.name, field: 'gallery', path: img });
            }
          }
          return img;
        });
        
        if (JSON.stringify(newImages) !== JSON.stringify(product.card_images)) {
          updates.card_images = newImages;
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
  console.log(`Total records updated in this run: ${totalUpdated}`);
  console.log(`Missing mappings in total: ${missingEntries.length}`);
  
  if (missingEntries.length > 0) {
    console.log('Sample missing mappings:');
    console.log(missingEntries.slice(0, 10));
    await fs.writeJson('missing_images.json', missingEntries);
  }
}

runSync().catch(console.error);
