const fs = require('fs');

const scrapedFile = 'e:/Antigravity/CarDecal3/scraped_data.json';
const outputFile = 'e:/Antigravity/CarDecal3/data/models.ts';

if (!fs.existsSync(scrapedFile)) {
    console.error('No scraped_data.json found!');
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(scrapedFile, 'utf-8'));

// Some names might have weird spaces, Let's clean them
const products = [];

// Helper to sort nicely
rawData.sort((a, b) => {
    // Extract numbers from "5cm-01" to sort correctly
    const matchA = a.name.match(/\d+$/);
    const matchB = b.name.match(/\d+$/);
    const numA = matchA ? parseInt(matchA[0], 10) : 999;
    const numB = matchB ? parseInt(matchB[0], 10) : 999;
    return numA - numB;
});

// Since user wants strict ordering, but the sort will mostly handle it. 
// "5cm-0" and "5cm-1" was mistakenly scraped maybe? Let's filter invalid ones.
const validData = rawData.filter(item => {
    // skip if item.name is like "5cm-0" instead of "5cm-01"
    if (item.name === "5cm-0" || item.name === "5cm-1") return false;
    return true;
});

for (let i = 0; i < validData.length; i++) {
    const item = validData[i];
    const name = item.name.trim();
    // Parse priceText "0.90ЛВ 0.46€"
    const priceText = item.priceText || '';
    
    // We want the format "0.15€ / 0.30лв"
    let pBGN = "0.00";
    let pEUR = "0.00";
    
    // Attempt multiple parsing strategies depending on how text was extracted
    const matchBGN = priceText.match(/([0-9.]+)\s*(ЛВ|лв|BGN)/i);
    const matchEUR = priceText.match(/([0-9.]+)\s*(€|euro|EUR)/i);
    
    if (matchBGN) pBGN = matchBGN[1];
    if (matchEUR) pEUR = matchEUR[1];

    let formattedPrice = `${pEUR}€ / ${pBGN}лв`;
    if (!matchBGN && !matchEUR) {
        formattedPrice = priceText; // fallback if parser fails
    }

    products.push({
        slug: name.toLowerCase(),
        name: name,
        nameBg: name,
        avatar: `/Site_Pics/Decals/5cm/${name}.jpg`,
        coverImage: `/Site_Pics/Decals/5cm/${name}.jpg`,
        categories: ['JDM', '5cm'],
        location: 'CarDecal HQ',
        dimensions: name.includes('33') ? '5cm x 33cm' : '5cm',
        size: 'Small',
        finish: 'Gloss',
        material: 'High-Performance Vinyl',
        description: `Качествен стикер ${name}`,
        stockStatus: 'In Stock',
        highlights: [],
        posts: [],
        cardImages: [],
        isBestSeller: i < 4, // Make first 4 bestsellers for variety
        isVerified: true,
        price: formattedPrice,
        wholesalePrice: formattedPrice
    });
}

const fileContent = `import type { Product, Post } from '../types';

// Helper to generate fake posts for the "gallery" feel
const generatePosts = (productSlug: string, count: number): Post[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: \`\${productSlug}-p\${i}\`,
    src: \`/Site_Pics/Decals/\${productSlug}/\${i + 1}.jpeg\`, 
    type: 'image',
    caption: \`Customer showcase \${i + 1}\`,
    tags: ['sticker', 'car-decal', 'tuning'],
    likes: 50 + i * 10,
    date: new Date().toISOString()
  }));
};

export const productsData: Product[] = ${JSON.stringify(products, null, 2).replace(/"/g, "'")};
`;

fs.writeFileSync(outputFile, fileContent, 'utf-8');
console.log(`Generated models.ts with ${products.length} products`);
