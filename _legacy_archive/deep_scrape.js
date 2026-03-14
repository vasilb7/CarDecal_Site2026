import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    console.log('Starting Playwright Deep Scraper...');
    const browser = await chromium.launch();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    await page.goto('https://sites.google.com/view/cardecor/5cm?authuser=0', { waitUntil: 'domcontentloaded', timeout: 90000 });

    console.log('Scrolling to bottom...');
    for (let i = 0; i < 30; i++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(400);
    }

    const data = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('p, div, span'))
            .filter(el => /5(cm|x33)(cm)?-?[0-9]+/i.test(el.innerText))
            .map(el => {
                const rect = el.getBoundingClientRect();
                return { text: el.innerText, x: rect.x, y: rect.y, bottom: rect.bottom };
            });

        const imgs = Array.from(document.querySelectorAll('img'))
            .filter(img => img.height > 20)
            .map(img => {
                const rect = img.getBoundingClientRect();
                return { src: img.src, x: rect.x, y: rect.y, height: rect.height, bottom: rect.bottom };
            });

        return { nodes, imgs };
    });

    console.log(`Found ${data.nodes.length} nodes and ${data.imgs.length} images.`);

    const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/5cm';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (const node of data.nodes) {
        const match = node.text.match(/5(cm|x33)(cm)?-?([0-9]+)/i);
        if (!match) continue;
        
        const type = match[1].toLowerCase();
        const num = match[3];
        const slug = `${type === 'cm' ? '5cm' : '5x33cm'}-${num.padStart(2, '0')}`;
        
        const filename = `${slug}.jpg`;
        const filepath = path.join(dir, filename);
        
        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 5000) continue;

        // Find closest image
        let closestImg = null;
        let minDist = Infinity;
        data.imgs.forEach(img => {
            const dy = Math.abs(node.y - img.bottom);
            const dx = Math.abs(node.x - img.x);
            if (dy < 300 && dx < 300) {
                const d = dy + dx;
                if (d < minDist) {
                    minDist = d;
                    closestImg = img;
                }
            }
        });

        if (closestImg) {
            console.log(`Downloading for ${slug}...`);
            try {
                // Fetch in browser context to bypass 403
                const base64 = await page.evaluate(async (url) => {
                    try {
                        const r = await fetch(url);
                        const b = await r.blob();
                        return new Promise(res => {
                            const f = new FileReader();
                            f.onloadend = () => res(f.result);
                            f.readAsDataURL(b);
                        });
                    } catch(e) { return null; }
                }, closestImg.src);
                
                if (base64 && base64.startsWith('data:image')) {
                    fs.writeFileSync(filepath, Buffer.from(base64.split(',')[1], 'base64'));
                    console.log(`Saved ${filename}`);
                }
            } catch (e) {
                console.error(`Failed ${slug}: ${e.message}`);
            }
        }
    }

    await browser.close();
    console.log('Deep scrape finished.');
})();
