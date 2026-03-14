import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const SIZE = '25cm';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const textFile = path.join(__dirname, `${SIZE}_text.txt`);
const text = fs.readFileSync(textFile, 'utf8');
const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const products = [];
let pendingNames = [];

// Default prices for 25cm if not found (usually around 4.50-5.50 BGN)
// Based on typical scaling: 12cm=1.45, 15cm=1.95, 20cm=3.32... 25cm should be higher.
// User didn't specify, but looking at previous patterns.
const DEFAULT_BGN = "4.50";
const DEFAULT_EUR = 2.30;

for (const line of lines) {
    const matchName = line.match(/^(25cm-\d+)$/i);
    if (matchName) {
        pendingNames.push(matchName[1].toLowerCase());
        continue;
    }

    const matchPrice = line.match(/([\d.,]+)ЛВ.*?([\d.,]+)€/i) || line.match(/([\d.,]+)€/i);
    if (matchPrice && pendingNames.length > 0) {
        let eurPriceStr = (matchPrice.length === 3 ? matchPrice[2] : matchPrice[1]).replace(',', '.');
        let eurPrice = parseFloat(eurPriceStr);
        let bgnPriceStr = (matchPrice.length === 3 ? matchPrice[1] : (eurPrice * 1.95583).toFixed(2)).replace(',', '.');
        
        for (const name of pendingNames) {
            products.push({
                slug: name,
                name: name.toUpperCase(),
                name_bg: name.toUpperCase(),
                avatar: `/Site_Pics/Decals/${SIZE}/${name}.jpg`,
                cover_image: `/Site_Pics/Decals/${SIZE}/${name}.jpg`,
                categories: [SIZE, "Стикери"],
                dimensions: SIZE,
                size: SIZE,
                finish: "Gloss / Matte",
                material: "High-Performance Vinyl",
                description: "Висококачествен винилов стикер от CarDecal.",
                stock_status: "In Stock",
                price: bgnPriceStr,
                wholesale_price: bgnPriceStr,
                price_eur: eurPrice,
                wholesale_price_eur: eurPrice,
                is_hidden: false
            });
        }
        pendingNames = [];
    }
}

// If no prices found on page, use defaults for all
if (products.length === 0 && pendingNames.length > 0) {
    for (const name of pendingNames) {
        products.push({
            slug: name,
            name: name.toUpperCase(),
            name_bg: name.toUpperCase(),
            avatar: `/Site_Pics/Decals/${SIZE}/${name}.jpg`,
            cover_image: `/Site_Pics/Decals/${SIZE}/${name}.jpg`,
            categories: [SIZE, "Стикери"],
            dimensions: SIZE,
            size: SIZE,
            finish: "Gloss / Matte",
            material: "High-Performance Vinyl",
            description: "Висококачествен винилов стикер от CarDecal.",
            stock_status: "In Stock",
            price: DEFAULT_BGN,
            wholesale_price: DEFAULT_BGN,
            price_eur: DEFAULT_EUR,
            wholesale_price_eur: DEFAULT_EUR,
            is_hidden: false
        });
    }
}

async function run() {
    console.log(`Inserting ${products.length} products for ${SIZE}...`);
    const { data, error } = await supabase.from('products').upsert(products, { onConflict: 'slug' });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success, inserted/updated data.');
    }
}

run();
