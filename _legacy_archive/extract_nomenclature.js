import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docPath = path.join(__dirname, 'public', 'Site_Pics', 'Decals', 'Nomenklaturafinalst  ybaveno2026.doc');

async function extractPrices() {
    const data = fs.readFileSync(docPath);
    // DOC files often store text in UTF-16LE. 
    // We clean it up by removing null bytes and non-printable characters except basics.
    const text = data.toString('utf16le').replace(/[\x00]/g, '');
    
    // Regex to find 640xxx followed by a price like 8.60лв
    const regex = /(64[0-9]{3,5}).*?([\d.,]+)\s*лв/g;
    const map = {};
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        const id = match[1];
        const bgn = parseFloat(match[2].replace(',', '.'));
        const eur = parseFloat((bgn / 1.95583).toFixed(2));
        map[id] = { bgn: bgn.toFixed(2), eur };
    }
    
    fs.writeFileSync(path.join(__dirname, 'nomenclature_map.json'), JSON.stringify(map, null, 2));
    console.log(`Extracted ${Object.keys(map).length} prices into nomenclature_map.json`);
    
    // Sample some to verify
    console.log('Sample data:', Object.entries(map).slice(0, 5));
}

extractPrices().catch(console.error);
