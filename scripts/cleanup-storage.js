
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mkgtkxigomsihrfyhdrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZ3RreGlnb21zaWhyZnloZHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjg4NDksImV4cCI6MjA4NTc0NDg0OX0.44etEz9FxC4USg-P5UN0LbSAA4U6NW0Dv2Awv3l1PBI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanup() {
  console.log('Fetching used URLs from database...');
  
  // 1. Get all used URLs from models and site_settings
  const { data: models, error: modelsError } = await supabase.from('models').select('*');
  if (modelsError) throw modelsError;

  const usedPaths = new Set();

  models.forEach(m => {
    if (m.avatar) usedPaths.add(extractPath(m.avatar));
    if (m.cover_image) m.cover_image.forEach(url => usedPaths.add(extractPath(url)));
    if (m.card_images) m.card_images.forEach(url => usedPaths.add(extractPath(url)));
    if (m.background_image) usedPaths.add(extractPath(m.background_image));
    if (m.posts) {
      const posts = Array.isArray(m.posts) ? m.posts : [];
      posts.forEach(p => {
        if (p.src) usedPaths.add(extractPath(p.src));
        if (p.images) p.images.forEach(img => usedPaths.add(extractPath(img)));
      });
    }
  });

  const { data: settings, error: settingsError } = await supabase.from('site_settings').select('*');
  if (settingsError) throw settingsError;
  settings.forEach(s => {
    if (s.value && s.value.includes('/models/')) {
      usedPaths.add(extractPath(s.value));
    }
  });

  console.log(`Found ${usedPaths.size} used paths.`);

  // 2. List all files in 'models' bucket
  console.log('Listing files in "models" bucket...');
  const allFiles = await listAllFiles('models');
  console.log(`Found ${allFiles.length} files in bucket.`);

  // 3. Identify unused files
  const unusedFiles = allFiles.filter(f => !usedPaths.has(f.name));
  
  const totalSize = unusedFiles.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
  console.log(`Identified ${unusedFiles.length} unused files, total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  if (unusedFiles.length === 0) {
    console.log('No unused files found.');
    return;
  }

  // 4. Delete unused files
  console.log('Deleting unused files...');
  // Delete in batches of 100
  for (let i = 0; i < unusedFiles.length; i += 100) {
    const batch = unusedFiles.slice(i, i + 100).map(f => f.name);
    console.log(`Deleting batch ${i / 100 + 1}...`);
    const { error } = await supabase.storage.from('models').remove(batch);
    if (error) {
      console.error('Delete error:', error.message);
    }
  }

  console.log('Cleanup completed.');
}

function extractPath(url) {
  if (!url) return null;
  const parts = url.split('/models/');
  if (parts.length > 1) {
    return decodeURIComponent(parts[1]);
  }
  return null;
}

async function listAllFiles(bucket, prefix = '') {
  let all = [];
  let { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    offset: 0
  });
  
  if (error) throw error;
  
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.metadata) {
      all.push({ ...item, name: fullPath });
    } else {
      // It's a folder
      const subFiles = await listAllFiles(bucket, fullPath);
      all = all.concat(subFiles);
    }
  }
  return all;
}

cleanup().catch(console.error);
