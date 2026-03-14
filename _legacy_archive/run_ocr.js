import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const size = '25cm';
const dir = path.join(__dirname, 'public', 'Site_Pics', 'Decals', size);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();

async function processImages() {
  const map = {};
  const missed = [];
  
  // Test the first 5 to see if text is correctly recognized
  for (let file of files.slice(0, 5)) {
     console.log('Processing', file);
     const imgPath = path.join(dir, file);
     
     try {
       // Crop top left
       const image = await Jimp.read(imgPath);
       // The number is top left.
       const w = image.bitmap.width;
       const topPart = image.crop({ x: 0, y: 0, w, h: 50 }); // top 50 pixels
       
       const buffer = await topPart.getBuffer('image/jpeg');
       
       const result = await Tesseract.recognize(buffer, 'eng');
       const text = result.data.text;
       
       // sometimes 640004 or similar. Let's find 640\d\d\d
       const match = text.match(/640\d{3}/);
       if (match) {
          map[file.replace('.jpg', '')] = match[0];
          console.log(`Found ${match[0]} in ${file}`);
       } else {
          console.log(`Missed ${file}, text was: ${text.trim()}`);
          missed.push(file);
       }
     } catch(e) {
       console.error(`Error on ${file}:`, e.message);
       missed.push(file);
     }
  }
  
  console.log('MAP:', map);
  console.log('MISSED:', missed);
}

processImages().catch(console.error);
