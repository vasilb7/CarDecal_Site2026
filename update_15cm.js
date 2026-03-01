import fs from 'fs';
import { execSync } from 'child_process';

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

// 1. Update 15cm_insert.sql
let sqlFile = fs.readFileSync('15cm_insert.sql', 'utf8');
const lines = sqlFile.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/^\('([^']+)'/);
  if (match) {
    const slug = match[1];
    if (updates[slug]) {
        const bgnPrice = updates[slug].toFixed(2);
        const eurPrice = (updates[slug] / BGN_TO_EUR).toFixed(2);
        
        // The values are around the end: ... true, 'price', 'wholesale', price_eur, wholesale_eur, '[]', NOW(), NOW()),
        // We can replace using a regex that matches the pricing section
        // true, 'X', 'Y', Z, W, '[]'
        lines[i] = line.replace(/true, '[^']+', '[^']+', [0-9.]+, [0-9.]+, '\[\]'/g, `true, '${bgnPrice}', '${bgnPrice}', ${eurPrice}, ${eurPrice}, '[]'`);
    }
  }
}

fs.writeFileSync('15cm_insert.sql', lines.join('\n'));
console.log('Fixed 15cm_insert.sql');

// 2. Output update queries for DB
const queries = [];
for (const [slug, price] of Object.entries(updates)) {
  const bgnPrice = price.toFixed(2);
  const eurPrice = (price / BGN_TO_EUR).toFixed(2);
  queries.push(`UPDATE products SET price='${bgnPrice}', wholesale_price='${bgnPrice}', price_eur=${eurPrice}, wholesale_price_eur=${eurPrice} WHERE slug='${slug}';`);
}
fs.writeFileSync('update_prices.sql', queries.join('\n'));
console.log('Generated update_prices.sql. Executing via psql...');

try {
   execSync('npx supabase db psql -f update_prices.sql');
   console.log('Database updated successfully.');
} catch(e) {
  console.error('Failed to update mapping to supabase DB. Please copy update_prices.sql contents and run manually if needed.');
}
