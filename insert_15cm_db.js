import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const textFile = path.join(__dirname, '15cm_text.txt');
const text = fs.readFileSync(textFile, 'utf8');
const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const products = [];
let pendingNames = [];

for (const line of lines) {
    const matchName = line.match(/^(15cm-\d+)$/i);
    if (matchName) {
        pendingNames.push(matchName[1].toLowerCase());
        continue;
    }

    const matchPrice = line.match(/([\d.]+)ЛВ.*?([\d.]+)€/i) || line.match(/([\d.]+)€/i);
    if (matchPrice && pendingNames.length > 0) {
        let eurPriceStr = matchPrice.length === 3 ? matchPrice[2] : matchPrice[1];
        let eurPrice = parseFloat(eurPriceStr);
        let bgnPriceStr = matchPrice.length === 3 ? matchPrice[1] : (eurPrice * 1.95583).toFixed(2);
        
        for (const name of pendingNames) {
            products.push({
                slug: name,
                name: name.toUpperCase(),
                name_bg: name.toUpperCase(),
                avatar: `/Site_Pics/Decals/15cm/${name}.jpg`,
                cover_image: `/Site_Pics/Decals/15cm/${name}.jpg`,
                categories: ["15cm", "Стикери"],
                location: "CarDecal HQ",
                dimensions: "15cm",
                size: "15cm",
                finish: "Gloss / Matte",
                material: "High-Performance Vinyl",
                description: "Висококачествен винилов стикер от CarDecal.",
                stock_status: "In Stock",
                is_best_seller: false,
                is_verified: true,
                price: bgnPriceStr,
                wholesale_price: bgnPriceStr,
                price_eur: eurPrice,
                wholesale_price_eur: eurPrice,
                card_images: []
            });
        }
        pendingNames = [];
    }
}

if (pendingNames.length > 0 && products.length > 0) {
    const lastPriceEur = products[products.length - 1].price_eur;
    const lastPriceBgn = products[products.length - 1].price;
    for (const name of pendingNames) {
        products.push({
            slug: name,
            name: name.toUpperCase(),
            name_bg: name.toUpperCase(),
            avatar: `/Site_Pics/Decals/15cm/${name}.jpg`,
            cover_image: `/Site_Pics/Decals/15cm/${name}.jpg`,
            categories: ["15cm", "Стикери"],
            location: "CarDecal HQ",
            dimensions: "15cm",
            size: "15cm",
            finish: "Gloss / Matte",
            material: "High-Performance Vinyl",
            description: "Висококачествен винилов стикер от CarDecal.",
            stock_status: "In Stock",
            is_best_seller: false,
            is_verified: true,
            price: lastPriceBgn,
            wholesale_price: lastPriceBgn,
            price_eur: lastPriceEur,
            wholesale_price_eur: lastPriceEur,
            card_images: []
        });
    }
}

async function run() {
    console.log(`Inserting ${products.length} products...`);
    const { data, error } = await supabase.from('products').upsert(products, { onConflict: 'slug' });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success, inserted/updated data.');
    }
}

run();
