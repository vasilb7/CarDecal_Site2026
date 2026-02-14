
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to parse .env.local manually if dotenv is not working
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', ['hero_type', 'hero_image_url', 'hero_video_url']);
  
  if (data) {
    data.forEach(item => {
      console.log(`${item.key}: ${item.value}`);
    });
  }
}

checkSettings();
