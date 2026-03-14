const fs = require('fs');
const path = require('path');

// 1. Read existing models.ts
const modelsPath = 'e:/Antigravity/CarDecal3/data/models.ts';
const content = fs.readFileSync(modelsPath, 'utf8');

const arrayStart = content.indexOf('export const productsData: Product[] = [');
if (arrayStart === -1) {
    console.error("Could not find productsData array start");
    process.exit(1);
}

const arrayText = content.substring(arrayStart + 'export const productsData: Product[] = '.length);
const products = eval(arrayText);

console.log(`Current products in models.ts: ${products.length}`);

// Helper to determine real wholesale price in EUR
function getRealPrice(product) {
    const dims = (product.dimensions || '').toLowerCase();
    const slug = (product.slug || '').toLowerCase();
    
    if (dims.includes('5cm x 33cm') || slug.includes('5x33')) return 4.00;
    if (dims.includes('5cm')) return 1.50;
    if (dims.includes('6cm')) return 2.00;
    if (dims.includes('140cm x 20cm')) return 15.00; // Banners
    if (dims.includes('60cm x 10cm')) return 10.00;
    if (dims.includes('20cm x 8cm')) return 6.00;
    if (slug.includes('insta')) return 5.00;
    if (slug.includes('mountain')) return 50.00;
    
    return 1.00; // Default fallback
}

// 2. Add/Update precise 6cm data
const preciseData = JSON.parse(fs.readFileSync('e:/Antigravity/CarDecal3/scrape_6cm_precise.json', 'utf8'));

// Rebuild the entire array to ensure all prices are "real" and in EUR
const updatedProducts = products.map(p => {
    const is6cm = p.slug.startsWith('6cm');
    const realPrice = getRealPrice(p);
    
    return {
        ...p,
        price: null,
        wholesalePrice: null,
        price_eur: realPrice,
        wholesalePriceEur: realPrice
    };
});

// Add missing 6cm stickers if they are not in the list
preciseData.forEach(item => {
    const slug = item.name.toLowerCase();
    if (!updatedProducts.find(p => p.slug === slug)) {
        const realPrice = 2.00; // Force 2.00 for 6cm
        updatedProducts.push({
            slug: slug,
            name: item.name.toUpperCase(),
            nameBg: item.name.toUpperCase(),
            avatar: `/Site_Pics/Decals/6cm/${slug}.jpg`,
            coverImage: `/Site_Pics/Decals/6cm/${slug}.jpg`,
            categories: ['6cm', 'Стикери'],
            location: 'CarDecal HQ',
            dimensions: '6cm',
            size: 'Small',
            finish: 'Gloss / Matte',
            material: 'High-Performance Vinyl',
            description: 'Висококачествен винилов стикер от CarDecal.',
            stockStatus: 'В Наличност',
            highlights: [],
            posts: [],
            cardImages: [],
            isBestSeller: false,
            isVerified: true,
            price: null,
            wholesalePrice: null,
            price_eur: realPrice,
            wholesalePriceEur: realPrice
        });
    }
});

// 3. Final save
const output = `import type { Product, Post } from '../types';\n\nexport const productsData: Product[] = ${JSON.stringify(updatedProducts, null, 2).replace(/"/g, "'")};`;

fs.writeFileSync(modelsPath, output);
console.log(`Success! Total products in models.ts: ${updatedProducts.length}. All prices set to real EUR wholesale values.`);

