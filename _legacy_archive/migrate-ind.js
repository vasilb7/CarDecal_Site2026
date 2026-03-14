import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.VITE_CLOUDINARY_API_SECRET
});

const IND_DIR = './public/Indvidual';

async function migrate() {
  if (!fs.existsSync(IND_DIR)) {
    console.log('Indvidual folder not found.');
    return;
  }

  const files = fs.readdirSync(IND_DIR);
  const mapping = {};

  for (const file of files) {
    if (file.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
      const filePath = path.join(IND_DIR, file);
      const publicId = `Indvidual/${path.parse(file).name}`;
      
      console.log(`Uploading ${file}...`);
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          public_id: public_id_safe(publicId),
          folder: 'Indvidual'
        });
        mapping[`/Indvidual/${file}`] = result.secure_url;
      } catch (e) {
        console.error(`Failed to upload ${file}:`, e.message);
      }
    }
  }

  fs.writeJsonSync('individual_mapping.json', mapping, { spaces: 2 });
  console.log('Mapping saved to individual_mapping.json');
}

function public_id_safe(id) {
  return id.replace(/\s+/g, '_').replace(/[()]/g, '');
}

migrate();
