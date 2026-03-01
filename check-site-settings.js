import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSiteSettings() {
  const { data: settings, error } = await supabase.from('site_settings').select('*');
  if (error) {
    console.error('Error fetching site_settings:', error);
    return;
  }
  console.log('Site Settings:', JSON.stringify(settings, null, 2));
  process.exit(0);
}

checkSiteSettings();
