import fs from 'fs';
import https from 'https';
import path from 'path';

const data = JSON.parse(fs.readFileSync('e:/Antigravity/CarDecal3/scrape_data.json', 'utf8'));
const { texts, images } = data;

const prodImages = images.filter(i => i.height > 50 && i.src.includes('googleusercontent.com'));
const prodTexts = texts.filter(t => t.text.includes('5cm-') || t.text.includes('5x33cm-') || t.text.includes('5x33-'));

const products = [];

prodTexts.forEach(tNode => {
    let closestImg = null;
    let minDistance = Infinity;

    prodImages.forEach(img => {
        const dy = tNode.y - img.bottom;
        const dx = Math.abs(tNode.x - img.x);
        if (dy > -20 && dy < 300 && dx < 200) {
            const dist = dy + dx;
            if (dist < minDistance) {
                minDistance = dist;
                closestImg = img;
            }
        }
    });

    if (closestImg) {
        const lines = tNode.text.split('\n').map(l=>l.trim()).filter(l=>l);
        const name = lines[0].toUpperCase();
        const priceBgMatches = tNode.text.match(/([0-9.]+)ЛВ/);
        const price = priceBgMatches ? priceBgMatches[1] : '0.00';
        
        prodImages.splice(prodImages.indexOf(closestImg), 1);
        
        products.push({
            name,
            price,
            imgUrl: closestImg.src
        });
    }
});

const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/5cm';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Download images
const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                   .on('error', reject)
                   .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
};

(async () => {
    const tsObjects = [];
    
    for (const p of products) {
        const filename = `${p.name}.jpg`;
        const filepath = path.join(dir, filename);
        
        console.log(`Downloading ${filename}...`);
        try {
            await downloadImage(p.imgUrl, filepath);
            
            tsObjects.push({
                slug: p.name.toLowerCase(),
                name: p.name,
                nameBg: p.name,
                avatar: `/Site_Pics/Decals/5cm/${filename}`,
                coverImage: `/Site_Pics/Decals/5cm/${filename}`,
                categories: ['5cm', 'Пълни Комплекти'], // We can sort them later
                location: 'CarDecal HQ',
                dimensions: p.name.includes('33') ? '5cm x 33cm' : '5cm',
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
                price: `${p.price} BGN`,
                wholesalePrice: `${(parseFloat(p.price) / 2).toFixed(2)} BGN (MOQ 10)`
            });
        } catch (e) {
            console.error(`Failed to download ${filename}:`, e);
        }
    }

    const tsContent = `import type { Product, Post } from '../types';

export const productsData: Product[] = ${JSON.stringify(tsObjects, null, 2).replace(/"/g, "'")};
`;

    fs.writeFileSync('e:/Antigravity/CarDecal3/data/models.ts', tsContent);
    console.log('All done! Updated models.ts');
})();
