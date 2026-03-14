import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    console.log('Starting 6cm Scraper (AGGRESSIVE REDOWNLOAD)...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/6cm';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await page.goto('https://sites.google.com/view/cardecor/6cm?authuser=0', { waitUntil: 'networkidle', timeout: 90000 });

    console.log('Scrolling slowly to load all images...');
    for (let i = 0; i < 40; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(400);
    }

    const data = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('p, div, span'))
            .filter(el => /6cm-?[0-9]+/i.test(el.innerText));
        const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.height > 40);
        
        return nodes.map(node => {
            const rect = node.getBoundingClientRect();
            let best = null;
            let minDist = Infinity;
            imgs.forEach(img => {
                const iRect = img.getBoundingClientRect();
                const d = Math.abs(rect.top - iRect.bottom) + Math.abs(rect.left - iRect.left);
                if (d < 500 && d < minDist) {
                    minDist = d;
                    best = img.src;
                }
            });
            return { name: node.innerText.trim().toUpperCase().match(/6CM-?[0-9]+/)[0], imgUrl: best };
        });
    });

    console.log(`Extracted ${data.length} candidates.`);

    for (const item of data) {
        if (!item.imgUrl) continue;
        const filename = `${item.name.toLowerCase().replace(' ', '')}.jpg`;
        const filepath = path.join(dir, filename);
        
        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 2000) continue;

        try {
            const response = await page.evaluate(async (url) => {
                const r = await fetch(url);
                const b = await r.blob();
                return new Promise(res => {
                    const f = new FileReader();
                    f.onloadend = () => res(f.result);
                    f.readAsDataURL(b);
                });
            }, item.imgUrl);

            if (response && response.startsWith('data:image')) {
                fs.writeFileSync(filepath, Buffer.from(response.split(',')[1], 'base64'));
                console.log(`Saved ${filename}`);
            }
        } catch (e) {}
    }

    await browser.close();
    console.log('Finished.');
})();
