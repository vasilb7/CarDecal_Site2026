import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const SIZE = '30x40';
const FOLDER = '30cm';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const nomenclatures = [
    "30cm-01", "30cm-02", "30cm-03", "30cm-04", "30cm-05",
    "30cm-06", "30cm-07", "30cm-08", "30cm-09", "30cm-10", "30cm-11"
];

const products = nomenclatures.map(name => ({
    slug: name.toLowerCase(),
    name: name.toUpperCase(),
    name_bg: name.toUpperCase(),
    avatar: `/Site_Pics/Decals/${FOLDER}/${name}.jpg`,
    cover_image: `/Site_Pics/Decals/${FOLDER}/${name}.jpg`,
    categories: [SIZE, "Стикери"],
    dimensions: SIZE,
    size: SIZE,
    finish: "Gloss / Matte",
    material: "High-Performance Vinyl",
    description: "Висококачествен винилов стикер от CarDecal.",
    stock_status: "In Stock",
    price: "0.00",
    wholesale_price: "0.00",
    price_eur: 0.0,
    wholesale_price_eur: 0.0,
    is_hidden: false
}));

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
