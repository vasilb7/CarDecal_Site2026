import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDb() {
  console.log('--- SITE SETTINGS ---');
  const { data: settings } = await supabase.from('site_settings').select('*');
  if (settings) {
    settings.forEach(s => {
      if (typeof s.value === 'string' && s.value.includes('supabase.co/storage')) {
        console.log(`[site_settings] ${s.key}: ${s.value}`);
      }
    });
  }

  console.log('--- CATEGORIES ---');
  // Check if categories table exists and has images
  const { data: categories, error } = await supabase.from('categories').select('*');
  if (categories) {
    categories.forEach(c => {
      if (typeof c.image === 'string' && c.image.includes('supabase.co/storage')) {
        console.log(`[categories] ${c.slug}: ${c.image}`);
      }
    });
  }

  // Also highlight_types if that exists
  const { data: highlights } = await supabase.from('highlight_types').select('*');
  if (highlights) {
    highlights.forEach(h => {
      if (typeof h.cover_image === 'string' && h.cover_image.includes('supabase.co/storage')) {
        console.log(`[highlight_types] ${h.title}: ${h.cover_image}`);
      }
    });
  }
}
checkDb();
