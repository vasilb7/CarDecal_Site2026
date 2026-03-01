
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { glob } from 'glob';

dotenv.config({ path: '.env.local' });

// Config
const CLOUDINARY_CONFIG = {
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.VITE_CLOUDINARY_API_SECRET,
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

cloudinary.config(CLOUDINARY_CONFIG);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MAPPING_FILE = 'cloudinary_mapping.json';
const PUBLIC_DIR = path.resolve('public');

async function migrateEverything() {
  console.log('🚀 Starting deep migration of all remaining assets...');

  let mapping = {};
  if (await fs.pathExists(MAPPING_FILE)) {
    mapping = await fs.readJson(MAPPING_FILE);
  }

  // 1. Find all files in public/Site_Pics
  const files = glob.sync('Site_Pics/**/*', { 
    cwd: PUBLIC_DIR, 
    nodir: true,
    ignore: ['**/*.ico', '**/*.txt', '**/*.json', '**/*.webmanifest']
  });

  console.log(`Found ${files.length} files in public/Site_Pics`);

  let uploadedCount = 0;
  let skippedCount = 0;

  // Manual batching (10 at a time)
  const BATCH_SIZE = 10;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (file) => {
      const localPath = '/' + file.replace(/\\/g, '/');
      
      if (mapping[localPath]) {
        skippedCount++;
        return;
      }

      const absolutePath = path.join(PUBLIC_DIR, file);
      const folder = path.dirname(file).replace(/\\/g, '/');
      const fileName = path.basename(file, path.extname(file));
      
      try {
        const result = await cloudinary.uploader.upload(absolutePath, {
          folder: folder,
          public_id: fileName,
          use_filename: true,
          unique_filename: false,
          overwrite: true,
          resource_type: 'auto'
        });

        mapping[localPath] = result.secure_url;
        uploadedCount++;
      } catch (error) {
        console.error(`Failed to upload ${localPath}:`, error.message);
      }
    }));

    if (uploadedCount % 50 === 0 && uploadedCount > 0) {
      console.log(`Uploaded ${uploadedCount} assets so far...`);
      await fs.writeJson(MAPPING_FILE, mapping, { spaces: 2 });
    }
  }

  await fs.writeJson(MAPPING_FILE, mapping, { spaces: 2 });
  console.log(`Migration summary: Uploading complete. Uploaded ${uploadedCount}, Skipped ${skippedCount}`);

  // 2. Update Database (Products)
  console.log('Updating Supabase products table...');
  const { data: products, error: pError } = await supabase.from('products').select('id, avatar, cover_image, card_images');
  if (pError) console.error('Error fetching products:', pError);
  else {
    let updatedProducts = 0;
    for (const product of products) {
      let needsUpdate = false;
      const updates = {};
      if (product.avatar && mapping[product.avatar]) { updates.avatar = mapping[product.avatar]; needsUpdate = true; }
      if (product.cover_image && mapping[product.cover_image]) { updates.cover_image = mapping[product.cover_image]; needsUpdate = true; }
      if (product.card_images && Array.isArray(product.card_images)) {
        const newCards = product.card_images.map(img => mapping[img] || img);
        if (JSON.stringify(newCards) !== JSON.stringify(product.card_images)) { updates.card_images = newCards; needsUpdate = true; }
      }
      if (needsUpdate) {
        const { error: uError } = await supabase.from('products').update(updates).eq('id', product.id);
        if (uError) console.error(`Error updating product ${product.id}:`, uError);
        else updatedProducts++;
      }
    }
    console.log(`Updated ${updatedProducts} products.`);
  }

  // 3. Update Site Settings
  console.log('Updating Supabase site_settings table...');
  const { data: settings } = await supabase.from('site_settings').select('*');
  if (settings) {
    for (const setting of settings) {
      if (setting.value && mapping[setting.value]) {
        await supabase.from('site_settings').update({ value: mapping[setting.value] }).eq('key', setting.key);
      }
    }
  }

  // 4. Update Codebases (Search and Replace)
  console.log('Scanning codebase for local paths...');
  const repoFiles = glob.sync('**/*.{tsx,ts,js,jsx,css,sql,cjs}', {
    ignore: ['node_modules/**', 'dist/**', '.git/**', MAPPING_FILE, 'cloudinary_mapping.json', 'migrate*.js']
  });

  let replacedFiles = 0;
  const sortedKeys = Object.keys(mapping).sort((a, b) => b.length - a.length);

  for (const filePath of repoFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let newContent = content;
      let changed = false;

      for (const localPath of sortedKeys) {
        if (newContent.includes(localPath)) {
          const regex = new RegExp(localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          newContent = newContent.replace(regex, mapping[localPath]);
          changed = true;
        }
      }

      if (changed) {
        await fs.writeFile(filePath, newContent);
        replacedFiles++;
      }
    } catch (e) {}
  }
  console.log(`Finished updating ${replacedFiles} source files.`);
}

migrateEverything().catch(console.error);
