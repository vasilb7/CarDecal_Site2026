import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    // 1. Scrape layout
    console.log('Starting 20cm Scraper...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let elements = [];
    try {
        await page.goto('https://sites.google.com/view/cardecor/20cm?authuser=0', { waitUntil: 'networkidle', timeout: 60000 });
        
        for (let i = 0; i < 40; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await page.waitForTimeout(500);
        }

        elements = await page.evaluate(() => {
            const els = [];
            
            // Get all text
            const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let n;
            while (n = walk.nextNode()) {
                const text = n.nodeValue.trim();
                if (text && n.parentElement && n.parentElement.tagName !== 'SCRIPT' && n.parentElement.tagName !== 'STYLE') {
                    const rect = n.parentElement.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        els.push({ type: 'text', text: text, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height } });
                    }
                }
            }

            // Get all images
            document.querySelectorAll('img').forEach(img => {
                const rect = img.getBoundingClientRect();
                if (rect.width > 20 && rect.height > 20) {
                    els.push({ type: 'image', src: img.src, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height } });
                }
            });

            return els;
        });
        console.log('Done mapping layout');
    } catch (e) {
        console.error('Error in Playwright:', e.message);
    } finally {
        await browser.close();
    }

    if (elements.length === 0) return;

    // 2. Parse layout
    const validElements = elements.filter(e => e.rect.width > 0 && e.rect.height > 0);

    // Group by top-ish (y value)
    let lines = [];
    let sortedByVer = [...validElements].sort((a,b) => a.rect.top - b.rect.top);

    let currentLine = { top: sortedByVer[0].rect.top, elements: [sortedByVer[0]] };
    lines.push(currentLine);

    for (let i = 1; i < sortedByVer.length; i++) {
        const el = sortedByVer[i];
        if (Math.abs(el.rect.top - currentLine.top) < 15) { 
            currentLine.elements.push(el);
        } else {
            currentLine = { top: el.rect.top, elements: [el] };
            lines.push(currentLine);
        }
    }

    const rows = lines.map(line => {
        line.elements.sort((a,b) => a.rect.left - b.rect.left);
        let images = line.elements.filter(e => e.type === 'image');
        let texts = line.elements.filter(e => e.type === 'text');
        let lineStr = texts.map(t => t.text).join('').replace(/\s+/g, '');
        
        return {
            top: line.top,
            textStr: lineStr,
            images: images,
            rect: {
                top: Math.min(...line.elements.map(e => e.rect.top)),
                bottom: Math.max(...line.elements.map(e => e.rect.bottom)),
                left: Math.min(...line.elements.map(e => e.rect.left)),
                right: Math.max(...line.elements.map(e => e.rect.right)),
            }
        };
    });

    const decals = [];
    const allImages = validElements.filter(e => e.type === 'image');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const match = row.textStr.match(/20cm-?([0-9]+)/i);
        
        if (match) {
            let name = match[0].toUpperCase();
            
            let hasPrice = false;
            for (let j = i + 1; j < Math.min(i + 8, rows.length); j++) {
                if (/ЛВ/i.test(rows[j].textStr)) {
                    hasPrice = true;
                    break;
                }
                if (/20cm/i.test(rows[j].textStr)) {
                    break; // Next decal started
                }
            }
            
            let bestImg = null;
            let minDist = Infinity;
            
            allImages.forEach(img => {
                const dy = Math.abs(row.top - img.rect.bottom);
                const dx = Math.abs(row.rect.left - img.rect.left);
                const dist = dy + dx;
                
                if (dist < 400) { 
                    if (dy < minDist) {
                        minDist = dy;
                        bestImg = img.src;
                    }
                }
            });

            if (!decals.find(d => d.name === name)) {
                decals.push({
                    name: name,
                    hasPrice,
                    imgUrl: bestImg,
                    originalText: row.textStr
                });
            }
        }
    }

    console.log(`Found ${decals.length} unique 20cm decals.`);
    const noPriceItems = decals.filter(d => !d.hasPrice);
    console.log(`Found ${noPriceItems.length} items without price.`);

    // 3. Download images
    const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/Noprice/20cm';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const unretrievable = [];

    for (const item of noPriceItems) {
        const name = item.name.toLowerCase();

        if (!item.imgUrl) {
            unretrievable.push(name);
            continue;
        }

        const filename = `${name}.jpg`;
        const filepath = path.join(dir, filename);
        
        try {
            const response = await fetch(item.imgUrl);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                if (buffer.length > 2000) {
                    fs.writeFileSync(filepath, buffer);
                    console.log(`Downloaded ${filename}`);
                } else {
                    unretrievable.push(name);
                }
            } else {
                unretrievable.push(name);
            }
        } catch (e) {
            console.error(`Error downloading ${name}:`, e.message);
            unretrievable.push(name);
        }
    }

    if (unretrievable.length > 0) {
        fs.writeFileSync(path.join(dir, 'namenoprice.txt'), unretrievable.join('\n'));
        console.log(`Wrote ${unretrievable.length} models without images to namenoprice.txt`);
    } else {
        const missedP = path.join(dir, 'namenoprice.txt');
        if (fs.existsSync(missedP)) fs.unlinkSync(missedP);
    }

    console.log('Script finished.');
})();
