import fs from 'fs';

const origText = `5cm-01\n0.30ЛВ\n5cm-02\n0.30ЛВ\n5cm-03\n0.80ЛВ\n5x33-04\n1.50ЛВ\n5cm-05\n0.92ЛВ\n5cm-06\n0.80ЛВ\n5cm-07\n0.92ЛВ\n5cm-08\n0.92ЛВ\n5x33cm-09\n1.50ЛВ\n5x33cm-10\n1.50ЛВ\n5cm-11\n0.94ЛВ\n5cm-12\n0.94ЛВ\n5cm-13\n0.90ЛВ\n5x33cm-14\n1.50ЛВ\n5cm-15\n0.30ЛВ\n5cm-16\n0.56ЛВ\n5cm-17\n0.56ЛВ\n5cm-18\n0.90ЛВ\n5cm-19\n0.94ЛВ\n5cm-20\n1.00ЛВ\n5cm-21\n0.94ЛВ\n5cm-22\n0.90ЛВ\n5cm-23\n0.90ЛВ\n5cm-24\n0.90ЛВ\n5cm-25\n0.90ЛВ\n5cm-26\n1.50ЛВ\n5cm-27\n0.90ЛВ\n5cm-28\n0.90ЛВ\n5cm-29\n0.90ЛВ\n5cm-30\n0.30ЛВ\n5cm-31\n0.90ЛВ\n5cm-32\n0.90ЛВ\n5cm-33\n0.90ЛВ\n5cm-34\n0.90ЛВ\n5cm-35\n0.90ЛВ\n5cm-36\n0.90ЛВ\n5cm-37\n1.50ЛВ\n5cm-38\n0.94ЛВ\n5cm-39\n1.50ЛВ\n5cm-40\n0.30ЛВ\n5cm-41\n0.90ЛВ\n5x33cm-42\n1.50ЛВ\n5cm-43\n0.90ЛВ\n5cm-44\n0.90ЛВ\n5cm-45\n0.90ЛВ\n5cm-46\n0.90ЛВ\n5cm-47\n0.90ЛВ\n5x33cm-48\n1.50ЛВ\n5cm-49\n0.90ЛВ\n5cm-50\n0.90ЛВ\n5cm-51\n0.90ЛВ\n5cm-52\n0.80ЛВ\n5cm-53\n0.90ЛВ\n5cm-54\n0.90ЛВ\n5cm-55\n0.90ЛВ\n5x33cm-56\n1.50ЛВ\n5cm-57\n0.90ЛВ\n5cm-58\n0.95ЛВ\n5cm-59\n0.90ЛВ\n5cm-60\n0.90ЛВ\n5cm-61\n0.90ЛВ\n5cm-62\n0.90ЛВ\n5cm-63\n0.90ЛВ\n5cm-64\n0.90ЛВ\n5cm-65\n0.90ЛВ\n5x33cm-66\n1.50ЛВ\n5cm-67\n0.90ЛВ\n5x33cm-68\n1.50ЛВ\n5cm-69\n0.90ЛВ\n5cm-70\n0.90ЛВ\n5cm-71\n0.90ЛВ\n5cm-72\n0.94ЛВ\n5cm-73\n1.50ЛВ\n5cm-74\n0.90ЛВ\n5cm-75\n0.90ЛВ\n5cm-76\n0.90ЛВ\n5cm-77\n0.92ЛВ\n5cm-78\n0.90ЛВ\n5cm-79\n0.90ЛВ\n5cm-80\n0.90ЛВ\n5cm-81\n0.80ЛВ\n5cm-82\n0.90ЛВ\n5cm-83\n0.90ЛВ\n5cm-84\n0.90ЛВ\n5cm-85\n0.90ЛВ\n5cm-86\n0.90ЛВ\n5cm-87\n0.90ЛВ\n5cm-88\n0.90ЛВ\n5cm-89\n0.90ЛВ\n5cm-90\n0.90ЛВ\n5cm-91\n1.80ЛВ\n5cm-92\n0.94ЛВ\n5cm-93\n0.94ЛВ\n5cm-94\n1.50ЛВ`;

const lines = origText.split('\n').map(l => l.trim()).filter(l => l !== '');
const tsObjects = [];

const imageDir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/5cm';
const availableFiles = fs.readdirSync(imageDir).map(f => f.toLowerCase());

for(let i=0; i<lines.length; i+=2) {
    const rawName = lines[i];
    const rawPriceLine = lines[i+1];
    if(!rawName || !rawPriceLine) continue;
    
    const priceMatch = rawPriceLine.match(/([0-9.]+)ЛВ/);
    const price = priceMatch ? parseFloat(priceMatch[1]).toFixed(2) : '0.90';
    
    const baseSlug = rawName.toLowerCase();
    
    // Find best matching file
    let bestFile = availableFiles.find(f => f === baseSlug + '.jpg');
    if(!bestFile) bestFile = availableFiles.find(f => f === baseSlug.replace('5x33-', '5x33cm-') + '.jpg');
    if(!bestFile) bestFile = availableFiles.find(f => f.includes(baseSlug.split('-')[1]) && f.startsWith(baseSlug.split('-')[0]));
    
    const finalPath = bestFile ? `/Site_Pics/Decals/5cm/${bestFile}` : '/LOGO.png';

    tsObjects.push({
        slug: baseSlug,
        name: rawName.toUpperCase(),
        nameBg: rawName.toUpperCase(),
        avatar: finalPath,
        coverImage: finalPath,
        categories: ['5cm', 'Стикери'],
        location: 'CarDecal HQ',
        dimensions: rawName.includes('33') ? '5cm x 33cm' : '5cm',
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
    });
}

const fileContent = `import type { Product, Post } from '../types';\n\nexport const productsData: Product[] = ${JSON.stringify(tsObjects, null, 2)};`;

fs.writeFileSync('e:/Antigravity/CarDecal3/data/models.ts', fileContent.replace(/"/g, "'"));
console.log('Final models.ts generated with ' + tsObjects.length + ' products.');
console.log('Missing images for: ' + tsObjects.filter(o => o.avatar === '/LOGO.png').map(o => o.slug).join(', '));
