import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    const products = JSON.parse(fs.readFileSync('e:/Antigravity/CarDecal3/scrape_data_v2.json', 'utf8'));
    const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/5cm';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const browser = await chromium.launch();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log(`Starting download of ${products.length} images...`);

    for (const p of products) {
        const filename = `${p.name}.jpg`.toLowerCase();
        const filepath = path.join(dir, filename);
        
        // Skip if already exists and large enough (>2KB)
        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 2048) {
            console.log(`Skipping ${filename} (already exists)`);
            continue;
        }

        console.log(`Downloading ${filename}...`);
        try {
            const response = await page.goto(p.imgUrl, { timeout: 30000 });
            if (response && response.status() === 200) {
                const buffer = await response.body();
                fs.writeFileSync(filepath, buffer);
                console.log(`Saved ${filename} (${buffer.length} bytes)`);
            } else {
                console.error(`Failed to download ${filename}: Status ${response ? response.status() : 'null'}`);
            }
        } catch (e) {
            console.error(`Error downloading ${filename}:`, e.message);
        }
    }

    await browser.close();
    console.log('All downloads finished.');
})();
