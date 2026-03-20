import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CLOUD_NAME = "die68h4oh";
const API_KEY = "136596978215658";
const API_SECRET = "evNs20lxlERC54QmlDMGETOmySs";

const BACKUP_FILE = 'e:/Antigravity/CarDecal3/data/products_backup_20260320_020828.ts.bak';
const SOURCE_DIR = 'E:/Decals/Сървърна_папка/Decals/5cm';

// 1. Build Price Map from Backup
console.log("Building price map from backup...");
const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
const priceMap = {}; // slug or name -> price

// Rough parsing of Product objects (slug, price_eur)
const productMatches = backupContent.matchAll(/slug:\s*["'](.*?)["'],[\s\S]*?price_eur:\s*(.*?),/g);
for (const match of productMatches) {
  priceMap[match[1]] = parseFloat(match[2]);
}

// 2. Scan Folders
const results = [];
const brandsDir = path.join(SOURCE_DIR, 'Марки');

async function uploadFile(filePath, cloudinaryFolder) {
  const fileData = fs.readFileSync(filePath);
  const timestamp = Math.round(new Date().getTime() / 1000);
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Signature
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
    if (data.secure_url) {
      console.log(`Uploaded ${fileName}: ${data.secure_url}`);
      return data.secure_url;
    } else {
      console.error(`Failed to upload ${fileName}:`, data.error?.message);
    }
  } catch (e) {
    console.error(`Upload error ${fileName}:`, e.message);
  }
  return null;
}

async function processFolder() {
  // Read Root items
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
        results.push({
          slug: slug,
          name: `Стикер 5см - ${slug.toUpperCase()}`,
          avatar: imageUrl,
          categories: ["5cm", "Стикери"],
          location: "CarDecal",
          dimensions: "5cm",
          size: "Small",
          price_eur: price,
           wholesalePriceEur: price
        });
      }
    } else if (stats.isDirectory() && item === 'Марки') {
      const brandFolders = fs.readdirSync(fullPath);
      for (const bFolder of brandFolders) {
        const bPath = path.join(fullPath, bFolder);
        if (fs.statSync(bPath).isDirectory()) {
          console.log(`Processing Brand Folder: ${bFolder}`);
          const bFiles = fs.readdirSync(bPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
          
          if (bFiles.length === 0) continue;
          
          // First file is CATALOG
          const catalogFile = bFiles.find(f => f.includes('CATALOG')) || bFiles[0];
          const cPath = path.join(bPath, catalogFile);
          const cUrl = await uploadFile(cPath, `Site_Pics/Decals/5cm/${bFolder}`);
          
          const variants = [];
          for (const bf of bFiles) {
            if (bf === catalogFile) continue;
            const bfPath = path.join(bPath, bf);
            const bfUrl = await uploadFile(bfPath, `Site_Pics/Decals/5cm/${bFolder}`);
            if (bfUrl) {
              variants.push({
                name: path.basename(bf, path.extname(bf)),
                avatar: bfUrl
              });
            }
          }
          
          results.push({
            slug: bFolder.toLowerCase().replace(/\s+/g, '-'),
            name: bFolder,
            avatar: cUrl,
            categories: ["5cm", "Стикери", "Марки"],
            location: "CarDecal",
            dimensions: "5cm",
            size: "Small",
            price_eur: 0.47, // Default for brands
            wholesalePriceEur: 0.47,
            variants: variants
          });
        }
      }
    }
  }
  
  // 3. Write to products.ts
  const outputFilePath = 'e:/Antigravity/CarDecal3/data/products.ts';
  const currentContent = fs.readFileSync(outputFilePath, 'utf8');
  
  // Find where the array ends (usually at the end of file before exports if any, or just before last ]; )
  // We already cleared 5cm items, so we just append them or prepend.
  
  const arrayStart = currentContent.indexOf('export const productsData: Product[] = [');
  if (arrayStart === -1) {
    console.error("Could not find productsData array in target file.");
    return;
  }
  
  const part1 = currentContent.substring(0, arrayStart + 'export const productsData: Product[] = ['.length);
  const part2 = currentContent.substring(arrayStart + 'export const productsData: Product[] = ['.length);
  
  const newItemsStr = results.map(r => `  ${JSON.stringify(r, null, 2)},`).join('\n');
  
  const finalFile = part1 + '\n' + newItemsStr + part2;
  fs.writeFileSync(outputFilePath, finalFile);
  console.log("Migration complete! Products added to products.ts");
}

processFolder();
