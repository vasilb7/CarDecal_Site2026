const fs = require('fs');
const path = require('path');

// 1. Read existing 5cm data to keep them
const modelsPath = 'e:/Antigravity/CarDecal3/data/models.ts';
const content = fs.readFileSync(modelsPath, 'utf8');

// Simple parser for the existing array
const arrayMatch = content.match(/export const productsData: Product\[\] = (\[[\s\S]+\]);/);
if (!arrayMatch) {
    console.error("Could not find productsData array in models.ts");
    process.exit(1);
}

// Convert back to objects (approximate, since it's TS text)
// We'll use the 94 5cm products we know we have
const existingProducts = eval(arrayMatch[1].replace(/import type \{ Product, Post \} from '\.\.\/types';/, ''));

// 2. Add 6cm products
const scraped6cm = JSON.parse(fs.readFileSync('e:/Antigravity/CarDecal3/scrape_6cm.json', 'utf8'));
const image6cmDir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/6cm';
const available6cmFiles = fs.readdirSync(image6cmDir).map(f => f.toLowerCase());

const new6cmProducts = scraped6cm.map(item => {
    const slug = item.name.toLowerCase();
    const filename = available6cmFiles.find(f => f === slug + '.jpg') || '6cm-0.jpg'; // fallback
    const priceStr = item.price.replace(' BGN', '');
    const price = parseFloat(priceStr).toFixed(2);

    return {
        slug: slug,
        name: item.name.toUpperCase(),
        nameBg: item.name.toUpperCase(),
        avatar: `/Site_Pics/Decals/6cm/${filename}`,
        coverImage: `/Site_Pics/Decals/6cm/${filename}`,
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
        price: `${price} BGN`,
        wholesalePrice: `${(parseFloat(price)/2).toFixed(2)} BGN (MOQ 10)`
    };
});

// 3. Combine and Write
const finalProducts = [...existingProducts, ...new6cmProducts];
const newContent = `import type { Product, Post } from '../types';\n\nexport const productsData: Product[] = ${JSON.stringify(finalProducts, null, 2).replace(/"/g, "'")};`;

fs.writeFileSync(modelsPath, newContent);
console.log(`Updated models.ts with ${existingProducts.length} (5cm) + ${new6cmProducts.length} (6cm) = ${finalProducts.length} products.`);
