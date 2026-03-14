import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sync() {
    const productsPath = 'e:/Antigravity/CarDecal3/data/products.ts';
    const content = fs.readFileSync(productsPath, 'utf8');
    
    // Simple extraction for 12cm products
    // We look for objects with slug: "12cm-..."
    const products = [];
    
    // For 12cm products, we can find the start and end of the slice
    // We already know they are at the end of the file or we can find them by slug
    
    // Use regex to find all product objects in the array
    const productRegex = /\{\r?\n\s+slug:\s+"(12cm-\d+)"[\s\S]*?\r?\n\s+\}/g;
    let match;
    while ((match = productRegex.exec(content)) !== null) {
        const objText = match[0];
        try {
            // Clean up the object text to make it valid JS for eval
            // This is a bit risky but we know the format
            let dataText = objText
                .replace(/slug:/g, '"slug":')
                .replace(/name:/g, '"name":')
                .replace(/nameBg:/g, '"nameBg":')
                .replace(/avatar:/g, '"avatar":')
                .replace(/coverImage:/g, '"coverImage":')
                .replace(/categories:/g, '"categories":')
                .replace(/location:/g, '"location":')
                .replace(/dimensions:/g, '"dimensions":')
                .replace(/size:/g, '"size":')
                .replace(/finish:/g, '"finish":')
                .replace(/material:/g, '"material":')
                .replace(/description:/g, '"description":')
                .replace(/stockStatus:/g, '"stockStatus":')
                .replace(/highlights:/g, '"highlights":')
                .replace(/posts:/g, '"posts":')
                .replace(/cardImages:/g, '"cardImages":')
                .replace(/isBestSeller:/g, '"isBestSeller":')
                .replace(/isVerified:/g, '"isVerified":')
                .replace(/price:/g, '"price":')
                .replace(/wholesalePrice:/g, '"wholesalePrice":')
                .replace(/price_eur:/g, '"price_eur":')
                .replace(/wholesalePriceEur:/g, '"wholesalePriceEur":')
                .replace(/,\r?\n\s+\}/g, '\n  }'); // remove trailing comma
            
            const p = JSON.parse(dataText);
            products.push(p);
        } catch (e) {
            console.error(`Failed to parse product ${match[1]}:`, e.message);
        }
    }

    console.log(`Found ${products.length} 12cm products to sync.`);

    if (products.length === 0) return;

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
        is_best_seller: typeof p.isBestSeller === 'boolean' ? p.isBestSeller : false,
        is_verified: typeof p.isVerified === 'boolean' ? p.isVerified : false,
        price: p.price || null,
        wholesale_price: p.wholesalePrice || null,
        price_eur: p.price_eur || null,
        wholesale_price_eur: p.wholesalePriceEur || null,
        card_images: p.cardImages || [],
        posts: p.posts || [],
        highlights: p.highlights || []
    }));

    // Batch upsert
    const BATCH_SIZE = 50;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
            .from('products')
            .upsert(batch, { onConflict: 'slug' });
            
        if (error) {
            console.error(`Error in batch ${i}:`, error);
        } else {
            console.log(`Synced batch ${i} to ${i + batch.length - 1}`);
        }
    }

    console.log("Sync complete!");
}

sync();
