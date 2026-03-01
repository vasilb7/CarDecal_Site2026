import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';
import path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Explicitly load .env.local
dotenv.config({ path: '.env.local' });

// Load Config
const cloud_name = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const api_key = process.env.VITE_CLOUDINARY_API_KEY;
const api_secret = process.env.VITE_CLOUDINARY_API_SECRET;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("Конфигурация:");
console.log("- Cloud Name:", cloud_name || "ЛИПСВА");
console.log("- API Key:", api_key || "ЛИПСВА");
console.log("- API Secret:", api_secret ? "OK" : "ЛИПСВА");
console.log("- Supabase URL:", supabaseUrl || "ЛИПСВА");

if (!cloud_name || !api_key || !api_secret || !supabaseUrl || !supabaseKey) {
  console.error("Липсват Cloudinary или Supabase credentials в .env.local!");
  process.exit(1);
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret
});

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_DIR = './public/Site_Pics/Decals';
const MAPPING_FILE = './cloudinary_mapping.json';

async function uploadDir(dir, folderInCloudinary, mapping = {}) {
  if (!await fs.exists(dir)) {
    console.error(`Директорията не съществува: ${dir}`);
    return mapping;
  }

  const items = await fs.readdir(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      await uploadDir(fullPath, `${folderInCloudinary}/${item}`, mapping);
    } else if (item.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const relativePath = '/' + path.relative('./public', fullPath).replace(/\\/g, '/');
      
      if (mapping[relativePath]) {
        continue;
      }

      console.log(`Качване на ${relativePath}...`);
      try {
        const result = await cloudinary.uploader.upload(fullPath, {
          folder: folderInCloudinary,
          use_filename: true,
          unique_filename: false,
          overwrite: true
        });
        
        mapping[relativePath] = result.secure_url;
        await fs.writeJson(MAPPING_FILE, mapping, { spaces: 2 });
      } catch (err) {
        console.error(`Грешка при качване на ${relativePath}:`, err);
      }
    }
  }
  return mapping;
}

async function updateDatabase(mapping) {
  console.log("Стартиране на актуализация на базата данни...");
  const { data: products, error } = await supabase
    .from('products')
    .select('id, avatar, cover_image, card_images');

  if (error) {
    console.error("Грешка при четене от Supabase:", error);
    return;
  }

  for (const product of products) {
    let updates = {};
    let hasChanges = false;

    if (product.avatar && mapping[product.avatar]) {
      updates.avatar = mapping[product.avatar];
      hasChanges = true;
    }
    if (product.cover_image && mapping[product.cover_image]) {
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
      const { error: updateError } = await supabase
        .from('products')
        .update(updates)
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`Грешка при актуализация на продукт ${product.id}:`, updateError);
      } else {
        console.log(`Актуализиран продукт: ${product.id}`);
      }
    }
  }
}

(async () => {
  try {
    let mapping = {};
    if (await fs.exists(MAPPING_FILE)) {
      mapping = await fs.readJson(MAPPING_FILE);
    }
    await uploadDir(BASE_DIR, 'Site_Pics/Decals', mapping);
    mapping = await fs.readJson(MAPPING_FILE);
    await updateDatabase(mapping);
    console.log("Готово!");
  } catch (err) {
    console.error("Грешка:", err);
  }
})();
