
import fs from 'fs';
import path from 'path';

const manifest = JSON.parse(fs.readFileSync('./public/site-manifest.json', 'utf8'));
const STORAGE_BASE = 'https://mkgtkxigomsihrfyhdrb.supabase.co/storage/v1/object/public/models';

let sql = "DELETE FROM models;\n\n";

manifest.forEach((model, mIdx) => {
    const slug = model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Avatar
    const avatarUrl = `${STORAGE_BASE}/${slug}/avatar.jpg`;
    
    // Cover Images
    const coverUrls = model.cover_images.map((img, i) => {
        const ext = path.extname(img) || '.jpg';
        return `${STORAGE_BASE}/${slug}/cover_${i}${ext}`;
    });

    // Posts
    const posts = model.posts.map((img, i) => {
        const ext = path.extname(img) || '.jpg';
        return {
            id: `post_${Date.now()}_${mIdx}_${i}`,
            src: `${STORAGE_BASE}/${slug}/post_${i}${ext}`,
            type: 'image',
            caption: '',
            liked_by_users: [],
            comments: [],
            date: new Date().toISOString(),
            tags: []
        };
    });

    // SQL Formatting
    const categoriesSQL = `ARRAY['${model.category}']`;
    const coverImageSQL = `ARRAY[${coverUrls.map(u => `'${u}'`).join(',')}]`;
    const postsJSON = JSON.stringify(posts).replace(/'/g, "''");

    sql += `INSERT INTO models (
        name, slug, categories, location, avatar, 
        cover_image, card_images, posts, 
        is_top_model, is_verified, bio,
        height, measurements, hair_color, eye_color, availability, gender
    ) VALUES (
        '${model.name.replace(/'/g, "''")}',
        '${slug}',
        ${categoriesSQL},
        'Sofia, BG',
        '${avatarUrl}',
        ${coverImageSQL},
        ${coverImageSQL}, -- card_images as fallback
        '${postsJSON}'::jsonb,
        ${['Top Model', 'Trending'].includes(model.category)},
        true,
        'Official portfolio of ${model.name.replace(/'/g, "''")}. Represented by Antigravity Agency.',
        '175cm',
        '88-60-88',
        'Blonde',
        'Blue',
        'Available',
        'Female'
    );\n\n`;
});

fs.writeFileSync('./scripts/final-seed.sql', sql);
console.log('Final SQL generated in ./scripts/final-seed.sql');
