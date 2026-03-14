import { chromium } from 'playwright';
import fs from 'fs';
import https from 'https';
import path from 'path';

(async () => {
    console.log('Starting Playwright...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://sites.google.com/view/cardecor/5cm?authuser=0', { waitUntil: 'domcontentloaded', timeout: 90000 });

    console.log('Loaded base page. Scrolling down slowly to lazy-load all 94 images...');
    
    // Scroll down multiple times to ensure everything is rendered
    for (let i = 0; i < 20; i++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(500);
    }
    await page.waitForTimeout(2000); // give it a final moment

    console.log('Extracting data...');
    const data = await page.evaluate(() => {
        // Collect all paragraph-like tags containing exactly something like "5cm-01", etc.
        const nodes = Array.from(document.querySelectorAll('p, div, span'))
            .filter(el => /5(cm|x33)(cm)?-[0-9]+/i.test(el.innerText))
            .map(el => {
                const rect = el.getBoundingClientRect();
                return { text: el.innerText, x: rect.x, y: rect.y, bottom: rect.bottom };
            });

        // Collect all images
        const imgs = Array.from(document.querySelectorAll('img'))
            .filter(img => img.height > 20 && img.src.includes('googleusercontent.com'))
            .map(img => {
                const rect = img.getBoundingClientRect();
                return { src: img.src, x: rect.x, y: rect.y, height: rect.height, bottom: rect.bottom };
            });

        return { nodes, imgs };
    });

    console.log(`Found ${data.nodes.length} text nodes and ${data.imgs.length} images.`);

    const products = [];
    const prodImages = [...data.imgs];

    // Filter relevant texts and sort them by vertical position (Y coordinate)
    const prodTexts = data.nodes
    	.filter(t => t.text.includes('5cm-') || t.text.includes('5x33cm-') || t.text.includes('5x33-'))
    	.sort((a, b) => a.y - b.y);

    // Try to match each text to the closest image vertically
    prodTexts.forEach(tNode => {
        let closestImg = null;
        let minDistance = Infinity;

        prodImages.forEach(img => {
            const dy = tNode.y - img.bottom;
            const absoluteDy = Math.abs(dy); // Image can be above or slightly below
            const dx = Math.abs(tNode.x - img.x);
            
            // Allow more flexible matching visually
            if (absoluteDy < 300 && dx < 300) {
                const dist = dx + absoluteDy;
                if (dist < minDistance) {
                    minDistance = dist;
                    closestImg = img;
                }
            }
        });

        if (closestImg) {
            const lines = tNode.text.split('\n').map(l => l.trim()).filter(l => l);
            const rawName = lines[0];
            // Format name nicely, 5cm-01 instead of 5CM-01 might be better, let's keep it lowercase
            const name = rawName.toLowerCase();
            const priceBgMatches = tNode.text.match(/([0-9.]+)ЛВ/);
            const price = priceBgMatches ? priceBgMatches[1] : '0.00';
            
            prodImages.splice(prodImages.indexOf(closestImg), 1);
            
            // Prevent exact duplicates
            if (!products.find(p => p.name === name)) {
                products.push({
                    name,
                    price,
                    imgUrl: closestImg.src
                });
            }
        }
    });

    // Make sure we sort products by their number (5cm-01, 5cm-02...)
    products.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+$/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+$/)?.[0] || '0');
        return numA - numB;
    });

    console.log(`Matched ${products.length} products.`);
    fs.writeFileSync('e:/Antigravity/CarDecal3/scrape_data_v2.json', JSON.stringify(products, null, 2));
    
    await browser.close();
})();
