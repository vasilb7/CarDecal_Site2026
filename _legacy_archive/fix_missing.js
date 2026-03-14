import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    const productsData = [
        '5x33cm-09', '5x33cm-10', '5x33cm-14', '5x33cm-42', '5x33cm-48',
        '5cm-78', '5cm-88', '5cm-89', '5cm-70', '5cm-67', '5cm-44', '5cm-45', '5cm-46', '5cm-49', '5cm-94'
    ]; // I'll check all from the previous "Missing" list + current logo ones

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to site...');
    await page.goto('https://sites.google.com/view/cardecor/5cm?authuser=0', { waitUntil: 'domcontentloaded' });
    
    // Slow scroll to load images
    for (let i = 0; i < 25; i++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(500);
    }

    console.log('Extracting and downloading missing images...');
    
    const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/5cm';

    for (const slug of productsData) {
        console.log(`Processing ${slug}...`);
        
        const imageData = await page.evaluate(async (targetSlug) => {
            const regex = new RegExp(targetSlug.replace('x', '.?x.?').replace('cm', '(cm)?'), 'i');
            
            // Find text node
            const nodes = Array.from(document.querySelectorAll('p, div, span'));
            const targetNode = nodes.find(n => regex.test(n.innerText));
            
            if (!targetNode) return null;
            
            const tr = targetNode.getBoundingClientRect();
            
            // Find closest image
            const imgs = Array.from(document.querySelectorAll('img'))
                .filter(img => img.height > 20);
                
            let closestImg = null;
            let minDist = Infinity;
            
            imgs.forEach(img => {
                const ir = img.getBoundingClientRect();
                const dy = Math.abs(tr.top - ir.bottom);
                const dx = Math.abs(tr.left - ir.left);
                const dist = dy + dx;
                if (dist < 400 && dist < minDist) {
                    minDist = dist;
                    closestImg = img;
                }
            });
            
            if (!closestImg) return null;
            
            // Fetch as base64 to avoid context issues
            try {
                const res = await fetch(closestImg.src);
                const blob = await res.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                return null;
            }
        }, slug);

        if (imageData && imageData.startsWith('data:image')) {
            const base64Data = imageData.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `${slug.toLowerCase()}.jpg`;
            fs.writeFileSync(path.join(dir, filename), buffer);
            console.log(`Successfully downloaded ${filename} (${buffer.length} bytes)`);
        } else {
            console.log(`Could not find or download image for ${slug}`);
        }
    }

    await browser.close();
    console.log('Done.');
})();
