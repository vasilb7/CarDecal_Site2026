
import fs from 'fs-extra';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config({ path: '.env.local' });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'die68h4oh',
  api_key: process.env.VITE_CLOUDINARY_API_KEY || '136596978215658',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'evNs20lxlERC54QmlDMGETOmySs'
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadFile(localPath) {
  try {
    // Remove leading slash for local fs
    const cleanPath = localPath.startsWith('/') ? localPath.substring(1) : localPath;
    const fullLocalPath = `./public/${cleanPath}`;
    
    if (!fs.existsSync(fullLocalPath)) {
      console.log(`File not found locally: ${fullLocalPath}`);
      return null;
    }

    // Determine folder
    const folder = localPath.includes('Decals') ? 'Decals' : 'Site_Pics';
    
    const result = await cloudinary.uploader.upload(fullLocalPath, {
      folder: folder,
      use_filename: true,
      unique_filename: false
    });
    
    return result.secure_url;
  } catch (e) {
    console.error(`Upload failed for ${localPath}:`, e.message);
    return null;
  }
}

async function fixMissing() {
  console.log('Starting final cleanup and manual upload for missing items...');
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, avatar, cover_image, card_images');

  let fixedCount = 0;

  for (const p of products) {
    let updates = {};
    let changed = false;

    // Check Avatar
    if (p.avatar && !p.avatar.startsWith('http')) {
      console.log(`Fixing avatar for ${p.name}: ${p.avatar}`);
      const url = await uploadFile(p.avatar);
      if (url) {
        updates.avatar = url;
        changed = true;
      }
    }

    // Check Cover
    if (p.cover_image && !p.cover_image.startsWith('http')) {
      console.log(`Fixing cover for ${p.name}: ${p.cover_image}`);
      const url = await uploadFile(p.cover_image);
      if (url) {
        updates.cover_image = url;
        changed = true;
      }
    }

    // Check Card Images (Gallery)
    if (Array.isArray(p.card_images)) {
      const newGallery = [];
      let galleryChanged = false;
      for (const img of p.card_images) {
        if (img && !img.startsWith('http')) {
          console.log(`Fixing gallery item for ${p.name}: ${img}`);
          const url = await uploadFile(img);
          if (url) {
            newGallery.push(url);
            galleryChanged = true;
          } else {
            newGallery.push(img);
          }
        } else {
          newGallery.push(img);
        }
      }
      if (galleryChanged) {
        updates.card_images = newGallery;
        changed = true;
      }
    }

    if (changed) {
      const { error } = await supabase.from('products').update(updates).eq('id', p.id);
      if (!error) {
        fixedCount++;
        console.log(`Successfully updated ${p.name}`);
      } else {
        console.error(`Error updating DB for ${p.name}:`, error.message);
      }
    }
  }

  console.log(`\nDONE! Fixed ${fixedCount} products.`);
}

fixMissing().catch(console.error);
