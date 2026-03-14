import fs from 'fs';
import path from 'path';
import https from 'https';

console.log("Starting HTML extract...");
const html = fs.readFileSync('CarDecor - 6cm.html', 'utf-8');

const sections = html.split('<section');
const items = new Map();

for (const sec of sections) {
    const imgMatch = sec.match(/<img[^>]*src="(https:\/\/lh3\.googleusercontent\.com\/[^"]+)"/);
    if (!imgMatch) continue;
    const src = imgMatch[1];
    
    // Add spaces for block elements to avoid concatenating "01" and "1.10"
    let text = sec.replace(/<\/(p|div)>|<br[^>]*>/gi, ' ');
    // Remove all remaining tags
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    
    // Now it should be "6cm-01 1.10ЛВ"
    const textMatch = text.match(/6cm-?\s*([0-9]+)/i);
    
    if (textMatch) {
        const id = textMatch[1].padStart(2, '0');
        const code = `6CM-${id}`;
        items.set(code, src);
        // console.log(`Found ${code}`);
    }
}

const results = Array.from(items.entries()).map(([code, src]) => ({ name: code, imgUrl: src }));
results.sort((a,b) => parseInt(a.name.split('-')[1]) - parseInt(b.name.split('-')[1]));
fs.writeFileSync('scrape_6cm_precise.json', JSON.stringify(results, null, 2));
console.log(`Found ${results.length} items`);

// Download images exactly like precise_scrape_6cm.js does
// Since some nodes might throw 403 using simple GET, let's use fetch instead of https
// Actually fetch is available in Node 18+
async function download() {
    const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/6cm';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    for (const item of results) {
        const filename = `${item.name.toLowerCase()}.jpg`;
        const filepath = path.join(dir, filename);
        try {
            const res = await fetch(item.imgUrl);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const buffer = await res.arrayBuffer();
            fs.writeFileSync(filepath, Buffer.from(buffer));
            console.log(`Downloaded ${filename}`);
        } catch (e) {
            console.error(`Failed ${filename}:`, e.message);
        }
    }
    console.log("All done!");
}

download();
