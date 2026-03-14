import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://sites.google.com/view/cardecor/15cm?authuser=0', { waitUntil: 'networkidle', timeout: 60000 });
        
        let previousHeight = 0;
        for (let i = 0; i < 40; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await page.waitForTimeout(500);
        }

        const data = await page.evaluate(() => {
            const elements = [];
            
            // Get all text
            const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let n;
            while (n = walk.nextNode()) {
                const text = n.nodeValue.trim();
                if (text && n.parentElement && n.parentElement.tagName !== 'SCRIPT' && n.parentElement.tagName !== 'STYLE') {
                    const rect = n.parentElement.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        elements.push({ type: 'text', text: text, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height } });
                    }
                }
            }

            // Get all images
            document.querySelectorAll('img').forEach(img => {
                const rect = img.getBoundingClientRect();
                if (rect.width > 20 && rect.height > 20) {
                    elements.push({ type: 'image', src: img.src, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height } });
                }
            });

            return elements;
        });

        fs.writeFileSync('layout_debug.json', JSON.stringify(data, null, 2));
        console.log('Done mapping layout');
        
    } catch (e) {
        console.error(e.message);
    } finally {
        await browser.close();
    }
})();
