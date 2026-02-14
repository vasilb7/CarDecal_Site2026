
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', ['hero_type', 'hero_image_url', 'hero_video_url']);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Current Hero Settings in DB:');
  console.log(JSON.stringify(data, null, 2));
}

checkSettings();
