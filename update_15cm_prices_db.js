import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = {
  "15cm-05": 2.28,
  "15cm-06": 2.28,
  "15cm-07": 2.28,
  "15cm-18": 2.00,
  "15cm-19": 1.85,
  "15cm-20": 1.85,
  "15cm-39": 2.53,
  "15cm-40": 2.53,
  "15cm-52": 2.65,
  "15cm-54": 2.65,
  "15cm-55": 2.65,
  "15cm-56": 2.65,
  "15cm-69": 2.00,
  "15cm-70": 2.00,
  "15cm-71": 2.00,
  "15cm-74": 2.00,
  "15cm-77": 2.28,
  "15cm-89": 2.00,
  "15cm-93": 1.82,
  "15cm-94": 1.85,
  "15cm-95": 1.80,
  "15cm-96": 1.80,
  "15cm-97": 1.80,
  "15cm-98": 1.80,
  "15cm-99": 1.80,
  "15cm-100": 1.80,
  "15cm-117": 1.55,
  "15cm-118": 1.55,
  "15cm-119": 1.55,
  "15cm-120": 2.95,
  "15cm-121": 2.95,
  "15cm-122": 2.95,
  "15cm-123": 2.95
};

const BGN_TO_EUR = 1.95583;

async function run() {
    console.log(`Updating ${Object.keys(updates).length} products...`);
    let errors = 0;
    
    for (const [slug, price] of Object.entries(updates)) {
        const bgnPrice = price.toFixed(2);
        const eurPrice = parseFloat((price / BGN_TO_EUR).toFixed(2));
        
        const { error } = await supabase
            .from('products')
            .update({
                price: bgnPrice,
                wholesale_price: bgnPrice,
                price_eur: eurPrice,
                wholesale_price_eur: eurPrice
            })
            .eq('slug', slug);
            
        if (error) {
            console.error(`Error updating ${slug}:`, error.message);
            errors++;
        } else {
            console.log(`Updated ${slug} -> BGN: ${bgnPrice}, EUR: ${eurPrice}`);
        }
    }
    
    console.log(`Done. ${errors} errors.`);
}

run();
