const fs = require('fs');

const text = `
5cm-01
0.30ЛВ           0.15€
5cm-02
0.30ЛВ                0.15€
5cm-03
0.80ЛВ                0.41€
5x33-04
1.50ЛВ                0.77€
5cm-05
0.92ЛВ                0.47€
5cm-06
0.80ЛВ         0.41€
5cm-07
0.92ЛВ                0.47€
5cm-08
0.92ЛВ                0.47€
5x33cm-09
1.50ЛВ                0.77€
5x33cm-10
1.50ЛВ                0.77€
5cm-11
0.94ЛВ                0.48€
5cm-12
0.94ЛВ                0.48€
5cm-13
0.90ЛВ                0.46€
5x33cm-14
1.50ЛВ                0.77€
5cm-15
0.30ЛВ          0.15€
`;

const lines = text.split('\n').map(l => l.trim()).filter(l => l);
const products = [];

for (let i = 0; i < lines.length; i += 2) {
    const name = lines[i];
    const priceLine = lines[i+1];
    
    if (!name || !priceLine) continue;
    
    const matches = priceLine.match(/([0-9.]+)(ЛВ|лв).*?([0-9.]+)(€|euro)/i) || [];
    let priceString = priceLine;
    if (matches.length >= 4) {
        priceString = `${matches[3]}€ / ${matches[1]}лв`;
    } else {
        const p1 = priceLine.match(/([0-9.]+)ЛВ/i);
        const p2 = priceLine.match(/([0-9.]+)€/i);
        if(p1 && p2) {
            priceString = `${p2[1]}€ / ${p1[1]}лв`;
        }
    }

    // Default valid local path or logo placeholder
    const imgPath = `/Site_Pics/Decals/5cm/${name}.jpg`;

    products.push({
        slug: name.toLowerCase(),
        name: name,
        nameBg: name,
        avatar: imgPath,
        coverImage: imgPath,
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
        isBestSeller: i === 0,
        isVerified: true,
        price: priceString,
        wholesalePrice: priceString
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

fs.writeFileSync('e:/Antigravity/CarDecal3/data/models.ts', fileContent, 'utf-8');
console.log('Script ran successfully');
