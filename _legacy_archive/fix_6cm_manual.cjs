const fs = require('fs');
const path = require('path');

const fixedDir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/fixed_6cm';
const destDir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/6cm';
const modelsPath = 'e:/Antigravity/CarDecal3/data/models.ts';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(fixedDir);
const fixedMap = new Map();

for (const file of files) {
    const ext = path.extname(file);
    const num = path.basename(file, ext); // e.g. "06", "16"
    
    // The slug is always starting with 6cm- followed by the number
    const slug = `6cm-${num}`;
    const destName = `${slug}${ext}`;
    const destPath = path.join(destDir, destName);
    
    fs.copyFileSync(path.join(fixedDir, file), destPath);
    console.log(`Copied ${file} to ${destName}`);
    
    fixedMap.set(slug, `/Site_Pics/Decals/6cm/${destName}`);
}

const content = fs.readFileSync(modelsPath, 'utf8');
const arrayStart = content.indexOf('export const productsData: Product[] = [');
if (arrayStart === -1) {
    console.error("Could not find productsData array start");
    process.exit(1);
}

const arrayText = content.substring(arrayStart + 'export const productsData: Product[] = '.length);
let products = eval(arrayText);

let addedCount = 0;
let modifiedCount = 0;

for (const [slug, imgPath] of fixedMap.entries()) {
    let found = false;
    for (const p of products) {
        if (p.slug === slug) {
            p.avatar = imgPath;
            p.coverImage = imgPath;
            found = true;
            modifiedCount++;
            break;
        }
    }
    
    if (!found) {
        // Create new item since it was missing
        const code = slug.toUpperCase();
        products.push({
            slug: slug,
            name: code,
            nameBg: code,
            avatar: imgPath,
            coverImage: imgPath,
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
            price: '1.00 BGN',
            wholesalePrice: '0.50 BGN (MOQ 10)'
        });
        addedCount++;
    }
}

// Ensure 5cm and 6cm are somewhat ordered? 
// No strict sorting requirement, but nice to map them.
// Let's just output them as JSON.
const output = `import type { Product, Post } from '../types';\n\nexport const productsData: Product[] = ${JSON.stringify(products, null, 2).replace(/"/g, "'")};`;

fs.writeFileSync(modelsPath, output);
console.log(`Fixed ${modifiedCount} existing and added ${addedCount} new models.`);
