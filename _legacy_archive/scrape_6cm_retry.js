import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    console.log('Starting 6cm Scraper (RETRY MISSING)...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const data = JSON.parse(fs.readFileSync('scrape_6cm.json', 'utf8'));
    const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/6cm';

    await page.goto('https://sites.google.com/view/cardecor/6cm?authuser=0', { waitUntil: 'networkidle', timeout: 90000 });

    for (const item of data) {
        const filename = `${item.name.toLowerCase()}.jpg`;
        const filepath = path.join(dir, filename);

        if (!fs.existsSync(filepath)) {
            console.log(`Retrying ${item.name}...`);
            // Scroll to find it
            await page.evaluate((text) => {
                const elements = Array.from(document.querySelectorAll('p, div, span'));
                const el = elements.find(e => e.innerText.includes(text));
                if (el) el.scrollIntoView();
            }, item.name);
            await page.waitForTimeout(1000);

            // Re-find image
            const imgUrl = await page.evaluate((text) => {
                const elements = Array.from(document.querySelectorAll('p, div, span'));
                const node = elements.find(e => e.innerText.includes(text));
                if (!node) return null;
                const rect = node.getBoundingClientRect();
                const images = Array.from(document.querySelectorAll('img')).filter(i => i.height > 50);
                let best = null;
                let minDist = Infinity;
                images.forEach(img => {
                    const iRect = img.getBoundingClientRect();
                    const dist = Math.abs(rect.top - iRect.bottom) + Math.abs(rect.left - iRect.left);
                    if (dist < 500 && dist < minDist) {
                        minDist = dist;
                        best = img.src;
                    }
                });
                return best;
            }, item.name);

            if (imgUrl) {
                try {
                    const response = await page.evaluate(async (url) => {
                        const r = await fetch(url);
                        const b = await r.blob();
                        return new Promise(res => {
                            const f = new FileReader();
                            f.onloadend = () => res(f.result);
                            f.readAsDataURL(b);
                        });
                    }, imgUrl);

                    if (response && response.startsWith('data:image')) {
                        fs.writeFileSync(filepath, Buffer.from(response.split(',')[1], 'base64'));
                        console.log(`Saved ${filename}`);
                    }
                } catch (e) {
                    console.error(`Failed ${item.name}: ${e.message}`);
                }
            }
        }
    }

    await browser.close();
    console.log('Retry finished.');
})();
