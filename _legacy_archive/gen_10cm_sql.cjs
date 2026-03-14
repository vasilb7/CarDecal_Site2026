/**
 * Generate SQL INSERT for 10cm products and execute via console output
 */
const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync(path.join(__dirname, '10cm_data.json'), 'utf8'));

// Generate SQL batches
const batchSize = 50;
const batches = [];
for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const values = batch.map(p => {
        const slug = p.n;
        const name = slug.toUpperCase();
        return `('${slug}','${name}','${name}','/Site_Pics/Decals/10cm/${slug}.jpg','/Site_Pics/Decals/10cm/${slug}.jpg','["10cm","Стикери"]','CarDecal HQ','10cm','10cm','Gloss / Matte','High-Performance Vinyl','Висококачествен винилов стикер от CarDecal.','In Stock',false,true,null,null,'[]','[]','[]',${p.e},${p.e})`;
    }).join(',\n');
    
    const sql = `INSERT INTO products (slug, name, name_bg, avatar, cover_image, categories, location, dimensions, size, finish, material, description, stock_status, is_best_seller, is_verified, price, wholesale_price, card_images, posts, highlights, price_eur, wholesale_price_eur) VALUES\n${values}\nON CONFLICT (slug) DO NOTHING;`;
    
    batches.push(sql);
}

// Write each batch to a file
batches.forEach((sql, i) => {
    const file = path.join(__dirname, `10cm_batch_${i+1}.sql`);
    fs.writeFileSync(file, sql);
    console.log(`Batch ${i+1}: ${file} (${products.slice(i * batchSize, (i+1) * batchSize).length} items)`);
});

console.log(`\nTotal: ${products.length} products in ${batches.length} batches`);
