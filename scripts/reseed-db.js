
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple MIME helper
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg': return 'image/jpeg';
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

// Configuration from .env.local
const SUPABASE_URL = 'https://mkgtkxigomsihrfyhdrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZ3RreGlnb21zaWhyZnloZHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjg4NDksImV4cCI6MjA4NTc0NDg0OX0.44etEz9FxC4USg-P5UN0LbSAA4U6NW0Dv2Awv3l1PBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MANIFEST_PATH = path.join(__dirname, '../public/site-manifest.json');
const PUBLIC_DIR = path.join(__dirname, '../public'); // For resolving relative paths

async function reseed() {
  try {
    console.log('Starting Advanced Database Reseed...');

    if (!fs.existsSync(MANIFEST_PATH)) {
      throw new Error('Manifest not found. Run generate-manifest.js first.');
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    console.log(`Loaded ${manifest.length} models from manifest.`);

    // 1. CLEANUP STORAGE (Optional but cleaner)
    // console.log('Cleaning up storage bucket...');
    // We might want to be careful here if we don't want to wipe everything.
    // For now, let's just upload with 'upsert: true'.

    // 2. Clear Database (Optional: User might want to keep some rows, but here we wipe for fresh state)
    console.log('Clearing "models" table...');
    const { error: deleteError } = await supabase
      .from('models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.warn('DELETE ERROR (may be RLS):', deleteError.message);
      // If RLS blocks, we continue and try upsert
    }

    // 3. Process Models
    for (const modelData of manifest) {
      console.log(`\n--- Processing: ${modelData.name} ---`);
      
      const slug = modelData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Helper to upload with retry
      const uploadFile = async (relPath, storagePath, retries = 3) => {
         const fullPath = path.join(PUBLIC_DIR, relPath.replace(/^\//, ''));
         if (!fs.existsSync(fullPath)) return null;
         
         const fileBuffer = fs.readFileSync(fullPath);
         const contentType = getMimeType(fullPath);

         for (let attempt = 1; attempt <= retries; attempt++) {
           try {
             const { error } = await supabase.storage
                .from('models')
                .upload(storagePath, fileBuffer, {
                   contentType: contentType,
                   upsert: true
                });
             
             if (!error) {
                const { data } = supabase.storage.from('models').getPublicUrl(storagePath);
                return data.publicUrl;
             }
             
             if (attempt === retries) {
               console.error(`  [Upload Final Failure] ${storagePath}:`, error.message);
               return null;
             }
             console.warn(`  [Retry ${attempt}/${retries}] ${storagePath}: ${error.message}`);
             await new Promise(r => setTimeout(r, 1000 * attempt));
           } catch (e) {
             if (attempt === retries) throw e;
             console.warn(`  [Exception Retry ${attempt}/${retries}] ${storagePath}`);
             await new Promise(r => setTimeout(r, 1000 * attempt));
           }
         }
         return null;
      };

      // 1. Upload Avatar
      let avatarUrl = '';
      if (modelData.avatar) {
         avatarUrl = await uploadFile(modelData.avatar, `${slug}/avatar.jpg`);
      }

      // 2. Upload Cover Images (for ModelCard hover)
      const coverUrls = [];
      console.log(`  Uploading ${modelData.cover_images.length} cover images...`);
      for (let i = 0; i < modelData.cover_images.length; i++) {
        const url = await uploadFile(modelData.cover_images[i], `${slug}/cover_${i}${path.extname(modelData.cover_images[i]) || '.jpg'}`);
        if (url) coverUrls.push(url);
      }

      // 3. Upload Posts (for Profile grid)
      const postsObjects = [];
      console.log(`  Uploading ${modelData.posts.length} posts...`);
      for (let i = 0; i < modelData.posts.length; i++) {
        const src = modelData.posts[i];
        const ext = path.extname(src) || '.jpg';
        const url = await uploadFile(src, `${slug}/post_${i}${ext}`);
        if (url) {
          postsObjects.push({
            id: `post_${Date.now()}_${i}`,
            src: url,
            type: 'image',
            caption: '',
            liked_by_users: [],
            comments: [],
            date: new Date().toISOString(),
            tags: []
          });
        }
        if (i > 0 && i % 20 === 0) console.log(`    ... ${i}/${modelData.posts.length} posts uploaded`);
      }

      // 4. Upload Stories/Highlights
      const storyUrls = [];
      if (modelData.stories && modelData.stories.length > 0) {
        console.log(`  Uploading ${modelData.stories.length} stories...`);
        for (let i = 0; i < modelData.stories.length; i++) {
          const src = modelData.stories[i];
          const ext = path.extname(src) || '.jpg';
          const url = await uploadFile(src, `${slug}/story_${i}${ext}`);
          if (url) storyUrls.push(url);
        }
      }

      // Insert Row
      console.log(`  Inserting into DB...`);
      const { error: insertError } = await supabase
         .from('models')
         .insert({
           name: modelData.name,
           slug,
           categories: [modelData.category],
           location: 'Sofia, BG',
           avatar: avatarUrl,
           cover_image: coverUrls, // Used by ModelCard
           card_images: coverUrls, // Keep for fallback/safety
           posts: postsObjects,    // Used by ProfilePage grid
           is_top_model: ['Top Model', 'Trending'].includes(modelData.category),
           is_verified: true,
           bio: `Official portfolio of ${modelData.name}. Represented by Antigravity Agency.`,
           height: "175cm",
           measurements: "88-60-88",
           hair_color: "Blonde",
           eye_color: "Blue",
           availability: "Available"
         });
      
      if (insertError) {
         console.error(`  [DB Error] ${modelData.name}:`, insertError.message);
      } else {
         console.log(`  [Success] ${modelData.name} seeded.`);
      }
      
      // Artificial delay to prevent storage rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n--- ADVANCED RESEED COMPLETED ---');

  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
}

reseed();
