import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const CLOUD_NAME = "die68h4oh";
const API_KEY = "136596978215658";
const API_SECRET = "evNs20lxlERC54QmlDMGETOmySs";

const SUPABASE_URL = "https://zfdbfuwqdgljpfozvxgo.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZGJmdXdxZGdsanBmb3p2eGdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY1NjQ5MywiZXhwIjoyMDg3MjMyNDkzfQ.EiX2i1RNlCr94f39rCVWDZYVFN-tAr5kBzbEHH35PBY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BACKUP_FILE = 'e:/Antigravity/CarDecal3/data/products_backup_20260320_020828.ts.bak';
const SOURCE_DIR = 'E:/Decals/Сървърна_папка/Decals/5cm';

// 1. Build Price Map from Backup
console.log("Building price map from backup...");
const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
const priceMap = {};
const productMatches = backupContent.matchAll(/slug:\s*['"](.*?)['"],[\s\S]*?price_eur:\s*([\d.]+),/g);
for (const match of productMatches) {
    priceMap[match[1]] = parseFloat(match[2]);
}

async function uploadFile(filePath, cloudinaryFolder) {
    const fileData = fs.readFileSync(filePath);
    const timestamp = Math.round(new Date().getTime() / 1000);
    const fileName = path.basename(filePath, path.extname(filePath));

    const params = { folder: cloudinaryFolder, timestamp };
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    const signature = crypto.createHash('sha1').update(sortedParams + API_SECRET).digest('hex');

    const formData = new FormData();
    formData.append('file', new Blob([fileData]));
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', cloudinaryFolder);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        return data.secure_url || null;
    } catch (e) {
        console.error(`Upload error ${fileName}:`, e.message);
    }
    return null;
}

const finalProducts = [];

async function syncToSupabase(product) {
    // Only use columns verified in Step 875
    const { error } = await supabase.from('products').upsert({
        slug: product.slug,
        name: product.name,
        avatar: product.avatar,
        categories: product.categories,
        location: product.location,
        size: product.size,
        wholesale_price_eur: product.wholesalePriceEur,
        variants: product.variants
    }, { onConflict: 'slug' });

    if (error) {
        console.error(`Supabase error for ${product.slug}:`, error.message);
    } else {
        console.log(`Synced to Supabase: ${product.slug}`);
    }
}

async function run() {
    const items = fs.readdirSync(SOURCE_DIR);
    
    for (const item of items) {
        const fullPath = path.join(SOURCE_DIR, item);
        const stats = fs.statSync(fullPath);

        if (stats.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(item)) {
            const slug = path.basename(item, path.extname(item));
            const price = priceMap[slug] || 0.47;
            console.log(`Processing standalone: ${slug}`);
            
            const imageUrl = await uploadFile(fullPath, 'Site_Pics/Decals/5cm');
            if (imageUrl) {
                const product = {
                    slug: slug.toLowerCase(),
                    name: `Стикер 5см - №${slug.split('-')[1] || slug.toUpperCase()}`,
                    avatar: imageUrl,
                    categories: ["5cm", "Стикери"],
                    location: "CarDecal",
                    size: "Small",
                    wholesalePriceEur: price,
                    variants: []
                };
                finalProducts.push(product);
                await syncToSupabase(product);
            }
        } else if (stats.isDirectory() && item === 'Марки') {
            const brandFolders = fs.readdirSync(fullPath);
            for (const bFolder of brandFolders) {
                const bPath = path.join(fullPath, bFolder);
                if (fs.statSync(bPath).isDirectory()) {
                    console.log(`Processing Brand Folder: ${bFolder}`);
                    const bFiles = fs.readdirSync(bPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
                    if (bFiles.length === 0) continue;

                    const catalogFile = bFiles.find(f => f.includes('CATALOG')) || bFiles[0];
                    const cUrl = await uploadFile(path.join(bPath, catalogFile), `Site_Pics/Decals/5cm/${bFolder}`);
                    
                    if (cUrl) {
                        const variants = [];
                        for (const bf of bFiles) {
                            if (bf === catalogFile) continue;
                            const bfUrl = await uploadFile(path.join(bPath, bf), `Site_Pics/Decals/5cm/${bFolder}`);
                            if (bfUrl) {
                                variants.push({
                                    name: path.basename(bf, path.extname(bf)),
                                    avatar: bfUrl
                                });
                            }
                        }

                        const product = {
                            slug: bFolder.toLowerCase().replace(/\s+/g, '-'),
                            name: bFolder,
                            avatar: cUrl,
                            categories: ["5cm", "Стикери", "Марки"],
                            location: "CarDecal",
                            size: "Small",
                            wholesalePriceEur: 0.47,
                            variants: variants
                        };
                        finalProducts.push(product);
                        await syncToSupabase(product);
                    }
                }
            }
        }
    }

    // Update local products.ts
    const outputFilePath = 'e:/Antigravity/CarDecal3/data/products.ts';
    let content = fs.readFileSync(outputFilePath, 'utf8');
    const startMarker = 'export const productsData: Product[] = [';
    const markerIndex = content.indexOf(startMarker);
    if (markerIndex !== -1) {
        const injectionPoint = markerIndex + startMarker.length;
        const newPart = '\n' + finalProducts.map(p => `  ${JSON.stringify(p, null, 2)},`).join('\n') + '\n';
        content = content.slice(0, injectionPoint) + newPart + content.slice(injectionPoint);
        fs.writeFileSync(outputFilePath, content);
        console.log("Local products.ts updated.");
    }
}

run();
