const fs = require('fs');

const bgnToEur = 1.95583;

// 5cm Data from user input
const fiveCmPrices = JSON.parse(fs.readFileSync('e:/Antigravity/CarDecal3/real_5cm_prices.json', 'utf8'));

// 6cm Data from user input
const sixCmPrices = JSON.parse(fs.readFileSync('e:/Antigravity/CarDecal3/real_6cm_prices.json', 'utf8'));

const priceMap = {};

// Add 5cm
for(const [slug, price] of Object.entries(fiveCmPrices)) {
    priceMap[slug.toLowerCase()] = price;
}

// Add 6cm
for(const [slug, price] of Object.entries(sixCmPrices)) {
    priceMap[slug.toLowerCase()] = price;
}

// Fixed others (Universal rates)
priceMap['speed-hunter-banner'] = 12.78; // 25 BGN -> 12.78 EUR
priceMap['drift-king-slap'] = 6.14; // 12 BGN -> 6.14 EUR
priceMap['stay-humble'] = 9.20; // 18 BGN -> 9.20 EUR
priceMap['mountain-explorer'] = 43.46; // 85 BGN -> 43.46 EUR
priceMap['custom-instagram-tag'] = 5.11; // 10 BGN -> 5.11 EUR

// Update models.ts
const modelsPath = 'e:/Antigravity/CarDecal3/data/models.ts';
const content = fs.readFileSync(modelsPath, 'utf8');
const arrayStartMarker = 'export const productsData: Product[] = ';
const arrayStart = content.indexOf(arrayStartMarker);
const preamble = content.substring(0, arrayStart + arrayStartMarker.length);
const arrayText = content.substring(arrayStart + arrayStartMarker.length);
const products = eval(arrayText);

const updatedProducts = products.map(p => {
    const slug = p.slug.toLowerCase();
    const price = priceMap[slug] || p.price_eur || 1.00;
    return {
        ...p,
        price: null,
        wholesalePrice: null,
        price_eur: price,
        wholesalePriceEur: price
    };
});

fs.writeFileSync(modelsPath, `${preamble}${JSON.stringify(updatedProducts, null, 2).replace(/"/g, "'")};`);

// Generate SQL
let sql = '-- PRECISE PRICE UPDATE (5cm and 6cm)\n';
for (const p of updatedProducts) {
    sql += `UPDATE products SET price_eur = ${p.price_eur}, wholesale_price_eur = ${p.wholesalePriceEur}, price = null, wholesale_price = null WHERE slug = '${p.slug}';\n`;
}
fs.writeFileSync('e:/Antigravity/CarDecal3/PRICE_UPDATE.sql', sql);

console.log('Successfully updated models.ts and PRICE_UPDATE.sql with ALL precise prices (5cm & 6cm).');

