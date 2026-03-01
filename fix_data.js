const fs = require('fs');

const origText = `5cm-01\n0.30ЛВ\n5cm-02\n0.30ЛВ\n5cm-03\n0.80ЛВ\n5x33-04\n1.50ЛВ\n5cm-05\n0.92ЛВ\n5cm-06\n0.80ЛВ\n5cm-07\n0.92ЛВ\n5cm-08\n0.92ЛВ\n5x33cm-09\n1.50ЛВ\n5x33cm-10\n1.50ЛВ\n5cm-11\n0.94ЛВ\n5cm-12\n0.94ЛВ\n5cm-13\n0.90ЛВ\n5x33cm-14\n1.50ЛВ\n5cm-15\n0.30ЛВ\n5cm-16\n0.56ЛВ\n5cm-17\n0.56ЛВ\n5cm-18\n0.90ЛВ\n5cm-19\n0.94ЛВ\n5cm-20\n1.00ЛВ\n5cm-21\n0.94ЛВ\n5cm-22\n0.90ЛВ\n5cm-23\n0.90ЛВ\n5cm-24\n0.90ЛВ\n5cm-25\n0.90ЛВ\n5cm-26\n1.50ЛВ\n5cm-27\n0.90ЛВ\n5cm-28\n0.90ЛВ\n5cm-29\n0.90ЛВ\n5cm-30\n0.30ЛВ\n5cm-31\n0.90ЛВ\n5cm-32\n0.90ЛВ\n5cm-33\n0.90ЛВ\n5cm-34\n0.90ЛВ\n5cm-35\n0.90ЛВ\n5cm-36\n0.90ЛВ\n5cm-37\n1.50ЛВ\n5cm-38\n0.94ЛВ\n5cm-39\n1.50ЛВ\n5cm-40\n0.30ЛВ\n5cm-41\n0.90ЛВ\n5x33cm-42\n1.50ЛВ\n5cm-43\n0.90ЛВ\n5cm-44\n0.90ЛВ\n5cm-45\n0.90ЛВ\n5cm-46\n0.90ЛВ\n5cm-47\n0.90ЛВ\n5x33cm-48\n1.50ЛВ\n5cm-49\n0.90ЛВ\n5cm-50\n0.90ЛВ\n5cm-51\n0.90ЛВ\n5cm-52\n0.80ЛВ\n5cm-53\n0.90ЛВ\n5cm-54\n0.90ЛВ\n5cm-55\n0.90ЛВ\n5x33cm-56\n1.50ЛВ\n5cm-57\n0.90ЛВ\n5cm-58\n0.95ЛВ\n5cm-59\n0.90ЛВ\n5cm-60\n0.90ЛВ\n5cm-61\n0.90ЛВ\n5cm-62\n0.90ЛВ\n5cm-63\n0.90ЛВ\n5cm-64\n0.90ЛВ\n5cm-65\n0.90ЛВ\n5x33cm-66\n1.50ЛВ\n5cm-67\n0.90ЛВ\n5x33cm-68\n1.50ЛВ\n5cm-69\n0.90ЛВ\n5cm-70\n0.90ЛВ\n5cm-71\n0.90ЛВ\n5cm-72\n0.94ЛВ\n5cm-73\n1.50ЛВ\n5cm-74\n0.90ЛВ\n5cm-75\n0.90ЛВ\n5cm-76\n0.90ЛВ\n5cm-77\n0.92ЛВ\n5cm-78\n0.90ЛВ\n5cm-79\n0.90ЛВ\n5cm-80\n0.90ЛВ\n5cm-81\n0.80ЛВ\n5cm-82\n0.90ЛВ\n5cm-83\n0.90ЛВ\n5cm-84\n0.90ЛВ\n5cm-85\n0.90ЛВ\n5cm-86\n0.90ЛВ\n5cm-87\n0.90ЛВ\n5cm-88\n0.90ЛВ\n5cm-89\n0.90ЛВ\n5cm-90\n0.90ЛВ\n5cm-91\n1.80ЛВ\n5cm-92\n0.94ЛВ\n5cm-93\n0.94ЛВ\n5cm-94\n1.50ЛВ`;

function fix() {
    const lines = origText.split('\n').map(l => l.trim()).filter(l => l !== '');
    const scraped = JSON.parse(fs.readFileSync('e:/Antigravity/CarDecal3/scrape_data_v2.json', 'utf8'));

    const tsObjects = [];
    for(let i=0; i<lines.length; i+=2) {
        const rawName = lines[i];
        const rawPriceLine = lines[i+1];
        if(!rawName) continue;
        
        const priceMatch = rawPriceLine.match(/([0-9.]+)ЛВ/);
        const price = priceMatch ? parseFloat(priceMatch[1]).toFixed(2) : '0.90';
        
        // Find image
        let imgUrl = `/Site_Pics/Decals/5cm/${rawName.toLowerCase()}.jpg`;
        if(!fs.existsSync(`e:/Antigravity/CarDecal3/public${imgUrl}`)) {
            const sc = scraped.find(s => s.name === rawName.toLowerCase());
            if(sc) {
                imgUrl = sc.imgUrl; // fallback to external url if local missing
            } else {
                imgUrl = `https://res.cloudinary.com/die68h4oh/image/upload/v1772381179/Site_Pics/Decals/5cm/5cm-01.jpg`; // duplicate a known good image as placeholder
            }
        }

        tsObjects.push({
            slug: rawName.toLowerCase(),
            name: rawName.toUpperCase(),
            nameBg: rawName.toUpperCase(),
            avatar: imgUrl,
            coverImage: imgUrl,
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

    const originalModels = [
      {
        slug: 'speed-hunter-banner',
        name: 'Speed Hunter Banner',
        nameBg: 'Speed Hunter Банер',
        avatar: '/Site_Pics/Decals/speed-hunter.jpg',
        coverImage: '/Site_Pics/Decals/speed-hunter-cover.jpg',
        categories: ['JDM', 'Windshield Banners', 'Best Sellers'],
        location: 'CarDecal HQ',
        dimensions: '140cm x 20cm',
        size: 'Universal',
        finish: 'Gloss / Matte',
        material: 'High-Performance Vinyl',
        description: 'Classic JDM style windshield banner. Durable, weather-resistant, and easy to apply.',
        stockStatus: 'In Stock',
        highlights: [],
        posts: [],
        cardImages: [],
        isBestSeller: true,
        isVerified: true,
        price: '25.00 BGN',
        wholesalePrice: '15.00 BGN (MOQ 10)'
      },
      {
        slug: 'drift-king-slap',
        name: 'Drift King Slap',
        nameBg: 'Drift King Стикер',
        avatar: '/Site_Pics/Decals/drift-king.jpg',
        coverImage: '/Site_Pics/Decals/drift-king.jpg',
        categories: ['Drifting', 'Slaps', 'New'],
        location: 'CarDecal HQ',
        dimensions: '20cm x 8cm',
        size: 'Standard',
        finish: 'Holographic',
        material: 'Reflective Vinyl',
        description: 'Iconic Drift King slap sticker. Perfect for windows and bumpers.',
        stockStatus: 'In Stock',
        highlights: [],
        posts: [],
        cardImages: [],
        isBestSeller: false,
        isVerified: true,
        price: '12.00 BGN',
        wholesalePrice: '6.00 BGN (MOQ 20)'
      },
      {
        slug: 'stay-humble',
        name: 'Stay Humble',
        nameBg: 'Stay Humble',
        avatar: '/Site_Pics/Decals/stay-humble.jpg',
        coverImage: '/Site_Pics/Decals/stay-humble.jpg',
        categories: ['Stance', 'Minimalist'],
        location: 'CarDecal HQ',
        dimensions: '60cm x 10cm',
        size: 'Large',
        finish: 'Matte White',
        material: 'Oracal 651',
        description: 'Clean and simple Stay Humble banner for stance builds.',
        stockStatus: 'Low Stock',
        highlights: [],
        posts: [],
        cardImages: [],
        isVerified: true,
        price: '18.00 BGN',
        wholesalePrice: '10.00 BGN (MOQ 10)'
      },
      {
        slug: 'mountain-explorer',
        name: 'Mountain Explorer Kit',
        nameBg: 'Mountain Explorer Комплект',
        avatar: '/Site_Pics/Decals/mountain.jpg',
        coverImage: '/Site_Pics/Decals/mountain.jpg',
        categories: ['Off-Road', '4x4', 'Kits'],
        location: 'CarDecal HQ',
        dimensions: 'Various',
        size: 'Side Door Kit',
        finish: 'Matte Black',
        material: 'Vehicle Wrap Vinyl',
        description: 'Full side door mountain graphic kit for SUVs and trucks.',
        stockStatus: 'In Stock',
        highlights: [],
        posts: [],
        cardImages: [],
        isBestSeller: true,
        isVerified: true,
        price: '85.00 BGN',
        wholesalePrice: '50.00 BGN (MOQ 5)'
      },
      {
        slug: 'custom-instagram-tag',
        name: 'Custom Insta Tag',
        nameBg: 'Персонален Instagram Таг',
        avatar: '/Site_Pics/Decals/insta.jpg',
        coverImage: '/Site_Pics/Decals/insta.jpg',
        categories: ['Custom', 'Social Media'],
        location: 'Custom Order',
        dimensions: 'Width up to 30cm',
        size: 'Custom',
        finish: 'Any',
        material: 'Vinyl',
        description: 'Custom cut vinyl decal of your Instagram handle. Choose font and color.',
        stockStatus: 'In Stock',
        highlights: [],
        posts: [],
        cardImages: [],
        isVerified: true,
        price: '10.00 BGN',
        wholesalePrice: '5.00 BGN (MOQ 50)'
      }
    ];

    const finalData = [...originalModels, ...tsObjects];
    const fileContent = `import type { Product, Post } from '../types';\n\nexport const productsData: Product[] = ${JSON.stringify(finalData, null, 2)};`;

    fs.writeFileSync('e:/Antigravity/CarDecal3/data/models.ts', fileContent.replace(/"/g, "'"));
    console.log('Fixed models.ts with exactly ' + finalData.length + ' products.');
}

fix();
