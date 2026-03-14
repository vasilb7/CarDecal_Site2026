const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    // We need to parse models.ts
    // For simplicity, we can read the raw text and extract productsData via eval.
    const modelsPath = 'e:/Antigravity/CarDecal3/data/models.ts';
    const content = fs.readFileSync(modelsPath, 'utf8');
    const arrayStart = content.indexOf('export const productsData: Product[] = [');
    if (arrayStart === -1) {
        console.error("Could not find productsData array start");
        process.exit(1);
    }
    const arrayText = content.substring(arrayStart + 'export const productsData: Product[] = '.length);
    let products = eval(arrayText);

    console.log(`Uploading ${products.length} products...`);
    
    // Convert to snake_case structure
    const toInsert = products.map(p => ({
        slug: p.slug,
        name: p.name,
        name_bg: p.nameBg || null,
        avatar: p.avatar,
        cover_image: p.coverImage || null,
        categories: p.categories || [],
        location: p.location || null,
        dimensions: p.dimensions || null,
        size: p.size || null,
        finish: p.finish || null,
        material: p.material || null,
        description: p.description || null,
        stock_status: p.stockStatus || 'In Stock',
        is_best_seller: p.isBestSeller || false,
        is_verified: p.isVerified || false,
        price: p.price || null,
        wholesale_price: p.wholesalePrice || null,
        card_images: p.cardImages || [],
        posts: p.posts || [],
        highlights: p.highlights || []
    }));

    // Insert in batches of 50 to avoid size limits just in case
    for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50);
        const { data, error } = await supabase
            .from('products')
            .upsert(batch, { onConflict: 'slug' });
            
        if (error) {
            console.error('Error inserting batch:', error);
            process.exit(1);
        }
        console.log(`Inserted batch ${i} to ${i + batch.length - 1}`);
    }

    console.log("Upload complete!");
}

main().catch(console.error);
