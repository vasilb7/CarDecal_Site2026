import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    console.log('Starting 6cm Scraper...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://sites.google.com/view/cardecor/6cm?authuser=0', { waitUntil: 'networkidle', timeout: 60000 });
        
        console.log('Scrolling to load elements...');
        for (let i = 0; i < 20; i++) {
            await page.evaluate(() => window.scrollBy(0, 1000));
            await page.waitForTimeout(500);
        }

        const data = await page.evaluate(() => {
            const results = [];
            const processedNodes = new Set();

            // Broad search for 6cm products
            const nodes = Array.from(document.querySelectorAll('p, div, span'))
                .filter(el => /6cm-?[0-9]+/i.test(el.innerText));

            const images = Array.from(document.querySelectorAll('img'))
                .filter(img => img.height > 50);

            nodes.forEach(node => {
                const text = node.innerText.trim();
                const match = text.match(/6cm-?([0-9]+)/i);
                if (!match) return;

                const code = match[0].toUpperCase();
                if (processedNodes.has(code)) return;
                processedNodes.add(code);

                const rect = node.getBoundingClientRect();
                
                // Find closest image above or next to text
                let bestImg = null;
                let minDist = Infinity;

                images.forEach(img => {
                    const iRect = img.getBoundingClientRect();
                    const dy = Math.abs(rect.top - iRect.bottom);
                    const dx = Math.abs(rect.left - iRect.left);
                    const dist = dy + dx;
                    if (dist < 400 && dist < minDist) {
                        minDist = dist;
                        bestImg = img.src;
                    }
                });

                // Find price nearby
                let price = "1.00 BGN"; // Default
                const siblingText = node.parentElement?.innerText || "";
                const priceMatch = siblingText.match(/([0-9.]+)\s*ЛВ/i);
                if (priceMatch) {
                    price = priceMatch[1] + " BGN";
                }

                results.push({
                    name: code,
                    price: price,
                    imgUrl: bestImg
                });
            });

            return results;
        });

        console.log(`Found ${data.length} stickers.`);
        fs.writeFileSync('scrape_6cm.json', JSON.stringify(data, null, 2));

        // Download images
        const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/6cm';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        for (const item of data) {
            if (!item.imgUrl) continue;
            const filename = `${item.name.toLowerCase()}.jpg`;
            const filepath = path.join(dir, filename);

            try {
                const response = await page.evaluate(async (url) => {
                    const r = await fetch(url);
                    const b = await r.blob();
                    return new Promise(resolve => {
                        const f = new FileReader();
                        f.onloadend = () => resolve(f.result);
                        f.readAsDataURL(b);
                    });
                }, item.imgUrl);

                if (response && response.startsWith('data:image')) {
                    fs.writeFileSync(filepath, Buffer.from(response.split(',')[1], 'base64'));
                    console.log(`Downloaded ${filename}`);
                }
            } catch (e) {
                console.error(`Failed to download ${item.name}: ${e.message}`);
            }
        }

    } catch (e) {
        console.error(`Scrape failed: ${e.message}`);
    } finally {
        await browser.close();
    }
})();
