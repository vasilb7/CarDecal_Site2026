import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://sites.google.com/view/cardecor/5cm?authuser=0', { waitUntil: 'networkidle' });

    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(500);
    }

    const data = await page.evaluate(() => {
        const texts = Array.from(document.querySelectorAll('p, div, span'))
            .filter(el => /5(cm|x33)-[0-9]+/i.test(el.innerText))
            .map(el => {
                const rect = el.getBoundingClientRect();
                return { text: el.innerText, x: rect.x, y: rect.y, bottom: rect.bottom };
            });

        const images = Array.from(document.querySelectorAll('img'))
            .map(img => {
                const rect = img.getBoundingClientRect();
                return { src: img.src, x: rect.x, y: rect.y, height: rect.height, bottom: rect.bottom };
            });

        return { texts, images };
    });

    fs.writeFileSync('e:/Antigravity/CarDecal3/scrape_data.json', JSON.stringify(data, null, 2));
    
    await browser.close();
})();
