
import fs from 'fs';
import path from 'path';

const manifest = JSON.parse(fs.readFileSync('./public/site-manifest.json', 'utf8'));
const BASE_URL = 'https://mkgtkxigomsihrfyhdrb.supabase.co/storage/v1/object/public/models';

let sql = "DELETE FROM models;\n";

manifest.forEach(model => {
   const slug = model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
   
   // Avatar
   const avatarUrl = `${BASE_URL}/${slug}/avatar.jpg`;
   
   // Gallery
   const cardImages = model.images.map((img, idx) => {
      const ext = path.extname(img) || '.jpg';
      return `'${BASE_URL}/${slug}/gallery_${idx}${ext}'`;
   });

   const isTopModel = model.category === 'Top Model';
   const categoriesArr = `ARRAY['${model.category}']`;
   const cardImagesArr = `ARRAY[${cardImages.join(',')}]`;

   sql += `INSERT INTO models (name, slug, categories, location, avatar, card_images, is_top_model, is_verified, bio) 
VALUES (
  '${model.name.replace(/'/g, "''")}', 
  '${slug}', 
  ${categoriesArr}, 
  'Sofia, BG', 
  '${avatarUrl}', 
  ${cardImagesArr}, 
  ${isTopModel}, 
  true, 
  'Official portfolio of ${model.name.replace(/'/g, "''")}. Represented by Antigravity Agency.'
);\n`;
});

fs.writeFileSync('./scripts/seed-data.sql', sql);
console.log('SQL generated in ./scripts/seed-data.sql');
