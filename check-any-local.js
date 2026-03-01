import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  const localProducts = products.filter(p => {
    const isAvatarLocal = p.avatar && (p.avatar.startsWith('/') || p.avatar.startsWith('.'));
    const isCoverLocal = p.cover_image && (p.cover_image.startsWith('/') || p.cover_image.startsWith('.'));
    const isGalleryLocal = p.card_images && p.card_images.some(img => img.startsWith('/') || img.startsWith('.'));
    return isAvatarLocal || isCoverLocal || isGalleryLocal;
  });

  console.log(`Found ${localProducts.length} products with local paths.`);
  localProducts.forEach(p => {
    console.log(`- Product "${p.name}" (Slug: ${p.slug})`);
    if (p.avatar && (p.avatar.startsWith('/') || p.avatar.startsWith('.'))) console.log(`  Avatar: ${p.avatar}`);
    if (p.cover_image && (p.cover_image.startsWith('/') || p.cover_image.startsWith('.'))) console.log(`  Cover: ${p.cover_image}`);
    if (p.card_images && p.card_images.some(img => img.startsWith('/') || img.startsWith('.'))) {
      console.log(`  Gallery: ${p.card_images.filter(img => img.startsWith('/') || img.startsWith('.'))}`);
    }
  });
}

check();
