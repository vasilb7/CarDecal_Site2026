import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pLimit from 'p-limit'; // We will use built in if missing, but let's try native fetch

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Same optimization logic as the frontend
function getOptimizedUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary.com')) return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const { width, height, crop = 'fill' } = options;
  const transformations = ['f_auto', 'q_auto'];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);

  return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
}

async function warmCache() {
  console.log('Fetching all products from Supabase...');
  const { data: products, error } = await supabase
    .from('products')
    .select('avatar, card_images');

  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }

  console.log(`Found ${products.length} products. Generating URLs...`);

  const urlsToWarm = new Set();

  products.forEach(p => {
    if (p.avatar && p.avatar.includes('cloudinary.com')) {
      // Catalog size
      urlsToWarm.add(getOptimizedUrl(p.avatar, { width: 500, crop: 'fit' }));
      // QuickView thumbnails size
      urlsToWarm.add(getOptimizedUrl(p.avatar, { width: 160 }));
    }
    
    if (p.card_images && Array.isArray(p.card_images)) {
      p.card_images.forEach(img => {
        if (img && img.includes('cloudinary.com')) {
            // Variation thumbnails size
            urlsToWarm.add(getOptimizedUrl(img, { width: 160 }));
        }
      });
    }
  });

  const urls = Array.from(urlsToWarm);
  console.log(`Total unique transformed URLs to warm up: ${urls.length}`);

  let successCount = 0;
  let failCount = 0;

  // Let's do batches of 20 to not overwhelm
  const batchSize = 20;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`Warming batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(urls.length/batchSize)}... (${((i/urls.length)*100).toFixed(1)}%)`);
    
    await Promise.all(batch.map(async (url) => {
      try {
        // We only need the headers to trigger Cloudinary's transformation engine
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
          console.log(`Warning: Failed to warm up ${url} - Status ${res.status}`);
        }
      } catch (err) {
        failCount++;
        console.error(`Error warming ${url}:`, err.message);
      }
    }));
  }

  console.log(`\n--- Cache Warming Complete ---`);
  console.log(`Successfully warmed: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  process.exit(0);
}

warmCache();
