import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    console.log('Starting 15cm Scraper...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://sites.google.com/view/cardecor/15cm?authuser=0', { waitUntil: 'networkidle', timeout: 60000 });
        
        console.log('Scrolling to load elements...');
        // Scroll to the very bottom to ensure all images load
        let previousHeight = 0;
        for (let i = 0; i < 60; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await page.waitForTimeout(800);
            const currentHeight = await page.evaluate(() => document.body.scrollHeight);
            if (currentHeight === previousHeight && i > 10) {
                // Wait another second and check if more loaded
                await page.waitForTimeout(1000);
                const checkHeight = await page.evaluate(() => document.body.scrollHeight);
                if (checkHeight === currentHeight) break;
            }
            previousHeight = currentHeight;
        }

        const data = await page.evaluate(() => {
            const results = [];
            const processedNodes = new Set();

            const nodes = Array.from(document.querySelectorAll('p, div, span'))
                .filter(el => /15cm-?[0-9]+/i.test(el.innerText));

            const images = Array.from(document.querySelectorAll('img'))
                .filter(img => img.height > 50);

            nodes.forEach(node => {
                // Only consider nodes where the text itself matches closely
                const text = node.innerText.trim();
                const match = text.match(/15cm-?([0-9]+)/i);
                if (!match) return;

                const code = match[0].toUpperCase();
                if (processedNodes.has(code)) return;

                // Stop huge container divs from being processed as the smallest element
                if (text.length > 30) return;
                
                processedNodes.add(code);

                const rect = node.getBoundingClientRect();
                
                let bestImg = null;
                let minDist = Infinity;

                images.forEach(img => {
                    const iRect = img.getBoundingClientRect();
                    const dy = Math.abs(rect.top - iRect.bottom);
                    const dx = Math.abs(rect.left - iRect.left);
                    const dist = dy + dx;
                    if (dist < 500 && dist < minDist) {
                        minDist = dist;
                        bestImg = img.src;
                    }
                });

                // Find price nearby by looking at next elements or parent sibling inner text
                let hasPrice = false;
                
                // Method 1: Check sibling node text
                let current = node;
                // Go up one or two levels to see if we can catch the text "ЛВ" nearby
                for (let k = 0; k < 3; k++) {
                    if (current && current.parentElement) {
                        const parentText = current.parentElement.innerText;
                        // Match xx.xx ЛВ or xxx.xxЛВ
                        if (/[0-9.]+\s*ЛВ/i.test(parentText)) {
                            hasPrice = true;
                            break;
                        }
                        current = current.parentElement;
                    }
                }

                results.push({
                    name: code,
                    hasPrice: hasPrice,
                    imgUrl: bestImg,
                    debugText: node.innerText.trim()
                });
            });

            return results.sort((a,b) => {
               const numA = parseInt(a.name.split('-')[1]);
               const numB = parseInt(b.name.split('-')[1]);
               return numA - numB;
            });
        });

        console.log(`Found ${data.length} stickers.`);
        fs.writeFileSync('scrape_15cm_debug.json', JSON.stringify(data, null, 2));

        const noPriceItems = data.filter(item => !item.hasPrice);
        console.log(`Found ${noPriceItems.length} items with NO price.`);

        const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/Noprice/15cm';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const reportLines = [];

        for (const item of noPriceItems) {
            const filename = `${item.name.toLowerCase()}.jpg`;
            reportLines.push(filename);
            
            if (!item.imgUrl) {
                console.log(`No image URL for ${item.name}`);
                continue;
            }
            
            const filepath = path.join(dir, filename);
            if (fs.existsSync(filepath) && fs.statSync(filepath).size > 2048) {
                console.log(`Skipping ${filename} (already exists)`);
                continue;
            }
            
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
        
        fs.writeFileSync(path.join(dir, 'noprice_list.txt'), reportLines.join('\n'));
        console.log(`Saved list to: ${path.join(dir, 'noprice_list.txt')}`);
        console.log('Done!');

    } catch (e) {
        console.error(`Scrape failed: ${e.message}`);
    } finally {
        await browser.close();
    }
})();
