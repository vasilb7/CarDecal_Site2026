import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';
import path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
dotenv.config({ path: '.env.local' });

// Config
const cloud_name = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const api_key = process.env.VITE_CLOUDINARY_API_KEY;
const api_secret = process.env.VITE_CLOUDINARY_API_SECRET;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!cloud_name || !api_key || !api_secret || !supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env.local!");
  process.exit(1);
}

cloudinary.config({ cloud_name, api_key, api_secret });
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_DIR = './public/Site_Pics/Decals';
const MAPPING_FILE = './cloudinary_mapping.json';
const CONCURRENCY = 10; // 10 parallel uploads

async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function updateDatabaseIncremental(mapping) {
  console.log("Updating database with current mapping...");
  const { data: products, error } = await supabase.from('products').select('id, avatar, cover_image, card_images');
  if (error) { console.error("Database read error:", error); return; }

  let updatedCount = 0;
  for (const product of products) {
    let updates = {};
    let hasChanges = false;

    if (product.avatar && mapping[product.avatar] && !product.avatar.startsWith('http')) {
      updates.avatar = mapping[product.avatar];
      hasChanges = true;
    }
    if (product.cover_image && mapping[product.cover_image] && !product.cover_image.startsWith('http')) {
      updates.cover_image = mapping[product.cover_image];
      hasChanges = true;
    }
    if (Array.isArray(product.card_images)) {
      const newCardImages = product.card_images.map(img => mapping[img] || img);
      if (JSON.stringify(newCardImages) !== JSON.stringify(product.card_images)) {
        updates.card_images = newCardImages;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      const { error: updateError } = await supabase.from('products').update(updates).eq('id', product.id);
      if (!updateError) updatedCount++;
    }
  }
  console.log(`Database updated: ${updatedCount} products.`);
}

async function run() {
  let mapping = {};
  if (await fs.exists(MAPPING_FILE)) {
    mapping = await fs.readJson(MAPPING_FILE);
  }

  const allFiles = await getFiles(BASE_DIR);
  const imageFiles = allFiles.filter(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  
  console.log(`Found ${imageFiles.length} images total.`);
  
  const toUpload = imageFiles.filter(f => {
    const rel = '/' + path.relative('./public', f).replace(/\\/g, '/');
    return !mapping[rel];
  });

  console.log(`${toUpload.length} images left to upload.`);

  // Upload in batches
  for (let i = 0; i < toUpload.length; i += CONCURRENCY) {
    const batch = toUpload.slice(i, i + CONCURRENCY);
    console.log(`Uploading batch ${i / CONCURRENCY + 1}/${Math.ceil(toUpload.length / CONCURRENCY)}...`);
    
    await Promise.all(batch.map(async (file) => {
      const rel = '/' + path.relative('./public', file).replace(/\\/g, '/');
      const folder = path.dirname(path.relative('./public', file)).replace(/\\/g, '/');
      
      try {
        const result = await cloudinary.uploader.upload(file, {
          folder,
          use_filename: true,
          unique_filename: false,
          overwrite: true
        });
        mapping[rel] = result.secure_url;
      } catch (err) {
        console.error(`Failed ${rel}:`, err.message);
      }
    }));

    // Save and periodic DB update
    await fs.writeJson(MAPPING_FILE, mapping, { spaces: 2 });
    if (i > 0 && (i / CONCURRENCY) % 10 === 0) { // Every 10 batches (100 files)
      await updateDatabaseIncremental(mapping);
    }
  }

  await updateDatabaseIncremental(mapping);
  console.log("Migration complete!");
}

run().catch(console.error);
