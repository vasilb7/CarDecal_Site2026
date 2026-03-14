import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const cloud_name = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const api_key = process.env.VITE_CLOUDINARY_API_KEY;
const api_secret = process.env.VITE_CLOUDINARY_API_SECRET;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!cloud_name || !api_key || !api_secret || !supabaseUrl || !supabaseServiceKey) {
  console.error("Missing credentials!");
  process.exit(1);
}

cloudinary.config({ cloud_name, api_key, api_secret });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateSiteSettings() {
  console.log('Fetching site settings...');
  const { data: settings, error } = await supabase.from('site_settings').select('*');

  if (error) {
    console.error('Error fetching settings:', error);
    return;
  }

  const mediaKeys = ['hero_media_url', 'maintenance_bg_url', 'maintenance_bg_url_mobile'];

  for (const setting of settings) {
    if (mediaKeys.includes(setting.key) && setting.value && setting.value.includes('supabase.co')) {
      console.log(`Migrating ${setting.key}: ${setting.value}`);
      
      try {
        const resourceType = setting.value.toLowerCase().endsWith('.mp4') ? 'video' : 'image';
        
        const uploadResult = await cloudinary.uploader.upload(setting.value, {
          folder: 'Site-Settings',
          resource_type: resourceType,
          use_filename: true,
          unique_filename: false,
          overwrite: true
        });

        console.log(`Uploaded to Cloudinary: ${uploadResult.secure_url}`);

        const { error: updateError } = await supabase
          .from('site_settings')
          .update({ value: uploadResult.secure_url })
          .eq('key', setting.key);

        if (updateError) {
          console.error(`Error updating Supabase for ${setting.key}:`, updateError);
        } else {
          console.log(`Successfully updated ${setting.key} in Supabase.`);
        }
      } catch (uploadError) {
        console.error(`Error uploading ${setting.key} to Cloudinary:`, uploadError);
      }
    }
  }

  console.log('Done!');
  process.exit(0);
}

migrateSiteSettings();
