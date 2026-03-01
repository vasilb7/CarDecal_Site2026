import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    console.log('Starting Playwright Image Downloader for 6cm...');
    
    // Read the precisely extracted mappings
    const data = fs.readFileSync('scrape_6cm_precise.json', 'utf8');
    const stickers = JSON.parse(data);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/6cm';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    try {
        console.log(`Downloading ${stickers.length} images...`);
        // Navigate to a blank page or google itself just to have a browser context with an origin
        // Sometimes you need the actual referer, so we go to the actual page one last time
        await page.goto('https://sites.google.com/view/cardecor/6cm?authuser=0', { waitUntil: 'domcontentloaded', timeout: 60000 });

        for (const item of stickers) {
            const filename = `${item.name.toLowerCase()}.jpg`;
            const filepath = path.join(dir, filename);
            
            try {
                const imgData = await page.evaluate(async (url) => {
                    const r = await fetch(url);
                    const b = await r.blob();
                    return new Promise(res => {
                        const f = new FileReader();
                        f.onloadend = () => res(f.result);
                        f.readAsDataURL(b);
                    });
                }, item.imgUrl);

                if (imgData && imgData.startsWith('data:image')) {
                    fs.writeFileSync(filepath, Buffer.from(imgData.split(',')[1], 'base64'));
                    console.log(`Downloaded ${filename} via Playwright`);
                } else {
                    console.error(`Invalid image data for ${filename}`);
                }
            } catch (err) {
                console.error(`Failed to download ${item.name}: ${err.message}`);
            }
        }

    } catch (e) {
        console.error(`Scrape failed: ${e.message}`);
    } finally {
        await browser.close();
    }
})();
