const fs = require('fs');
const path = require('path');

const textFile = path.join(__dirname, '15cm_text.txt');
const text = fs.readFileSync(textFile, 'utf8');

const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const products = [];
let pendingNames = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line is a product name
    const matchName = line.match(/^(15cm-\d+)$/i);
    if (matchName) {
        pendingNames.push(matchName[1].toLowerCase());
        continue;
    }

    // Check if line contains a price (e.g. "1.58ЛВ           0.81€")
    const matchPrice = line.match(/([\d.]+)ЛВ.*?([\d.]+)€/i) || line.match(/([\d.]+)€/i);
    if (matchPrice && pendingNames.length > 0) {
        let eurPriceStr = matchPrice.length === 3 ? matchPrice[2] : matchPrice[1];
        let eurPrice = parseFloat(eurPriceStr);
        let bgnPriceStr = matchPrice.length === 3 ? matchPrice[1] : (eurPrice * 1.95583).toFixed(2);
        
        for (const name of pendingNames) {
            products.push({
                name: name.toUpperCase(),
                slug: name,
                priceEur: eurPrice,
                priceBgn: bgnPriceStr
            });
        }
        pendingNames = [];
    }
}

// In case there are pending ones without price at the end, use a default (from last known price)
if (pendingNames.length > 0 && products.length > 0) {
    const lastPriceEur = products[products.length - 1].priceEur;
    const lastPriceBgn = products[products.length - 1].priceBgn;
    for (const name of pendingNames) {
        products.push({
            name: name.toUpperCase(),
            slug: name,
            priceEur: lastPriceEur,
            priceBgn: lastPriceBgn
        });
    }
}

console.log(`Parsed ${products.length} products.`);

// Generate SQL (Batch INSERT)
let sql = `INSERT INTO products (slug, name, name_bg, avatar, cover_image, categories, location, dimensions, size, finish, material, description, stock_status, is_best_seller, is_verified, price, wholesale_price, price_eur, wholesale_price_eur, card_images, created_at, updated_at) VALUES\n`;
const sqlValues = [];

// Generate TS fragment
let tsContent = `// --- 15cm Products (${products.length} products) ---\n`;

for (const p of products) {
    // Generate TS
    tsContent += `
  {
    slug: "${p.slug}",
    name: "${p.name}",
    nameBg: "${p.name}",
    avatar: "/Site_Pics/Decals/15cm/${p.slug}.jpg",
    coverImage: "/Site_Pics/Decals/15cm/${p.slug}.jpg",
    categories: ["15cm", "Стикери"],
    location: "CarDecal HQ",
    dimensions: "15cm",
    size: "15cm",
    finish: "Gloss / Matte",
    material: "High-Performance Vinyl",
    description: "Висококачествен винилов стикер от CarDecal.",
    stockStatus: "In Stock",
    highlights: [],
    posts: [],
    cardImages: [],
    isBestSeller: false,
    isVerified: true,
    price: "${p.priceBgn}",
    wholesalePrice: "${p.priceBgn}",
    price_eur: ${p.priceEur},
    wholesalePriceEur: ${p.priceEur},
  },`;

    // Generate SQL value
    sqlValues.push(`('${p.slug}', '${p.name}', '${p.name}', '/Site_Pics/Decals/15cm/${p.slug}.jpg', '/Site_Pics/Decals/15cm/${p.slug}.jpg', '["15cm","Стикери"]', 'CarDecal HQ', '15cm', '15cm', 'Gloss / Matte', 'High-Performance Vinyl', 'Висококачествен винилов стикер от CarDecal.', 'In Stock', false, true, '${p.priceBgn}', '${p.priceBgn}', ${p.priceEur}, ${p.priceEur}, '[]', NOW(), NOW())`);
}

sql += sqlValues.join(',\n') + ';\n';

fs.writeFileSync(path.join(__dirname, '15cm_insert.sql'), sql);
fs.writeFileSync(path.join(__dirname, '15cm_products.ts_bg'), tsContent);

console.log('Files generated: 15cm_insert.sql, 15cm_products.ts_bg');
