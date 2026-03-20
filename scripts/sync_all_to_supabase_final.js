import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zfdbfuwqdgljpfozvxgo.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZGJmdXdxZGdsanBmb3p2eGdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY1NjQ5MywiZXhwIjoyMDg3MjMyNDkzfQ.EiX2i1RNlCr94f39rCVWDZYVFN-tAr5kBzbEHH35PBY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const filePath = 'e:/Antigravity/CarDecal3/data/products.ts';

async function run() {
  console.log("Reading products.ts content...");
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract only the array part
  const startMarker = 'export const productsData: Product[] = [';
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
    console.error("Could not find productsData array.");
    return;
  }
  
  let arrayString = content.substring(startIndex + startMarker.length - 1); // include the '['
  // Remove the trailing ';' if any
  arrayString = arrayString.trim();
  if (arrayString.endsWith(';')) {
    arrayString = arrayString.slice(0, -1);
  }
  
  // To evaluate this, we need to handle the fact it's not strictly JSON (has unquoted keys, etc.)
  // We'll use Function() to execute it safely within this script.
  let products;
  try {
    products = new Function(`return ${arrayString};`)();
  } catch (e) {
    console.error("Error evaluating products data:", e.message);
    // Fallback: simple manual parsing for very specific patterns if eval fails
    return;
  }
  
  console.log(`Successfully parsed ${products.length} products locally.`);
  
  // Batch processing
  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize).map(p => ({
      slug: p.slug,
      name: p.name,
      avatar: p.avatar,
      categories: p.categories,
      location: p.location,
      size: p.size,
      wholesale_price_eur: p.wholesalePriceEur,
      variants: p.variants
    }));
    
    console.log(`Syncing batch ${i / batchSize + 1}...`);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'slug' });
    
    if (error) {
      console.error(`Error in batch ${i / batchSize + 1}:`, error.message);
    }
  }
  
  console.log("Sync complete!");
}

run();
