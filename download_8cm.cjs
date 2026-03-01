/**
 * Download 8cm product images from Google Sites
 * Skip 2 logos, skip duplicate 8cm-94 (at index 95), number 8cm-00 to 8cm-117
 */
const { chromium } = require('playwright-core');
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'public', 'Site_Pics', 'Decals', '8cm');
const URL_PAGE = 'https://sites.google.com/view/cardecor/8cm?authuser=0';

if (fs.existsSync(OUTPUT_DIR)) fs.rmSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                try { fs.unlinkSync(filepath); } catch(e) {}
                downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => { file.close(resolve); });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

async function main() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Navigating to Google Sites 8cm page...');
    await page.goto(URL_PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    console.log('Scrolling to load all images...');
    for (let i = 0; i < 50; i++) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(250);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    for (let i = 0; i < 50; i++) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(200);
    }
    
    console.log('Extracting image URLs...');
    const allUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img'))
            .map(img => img.src)
            .filter(src => src && src.includes('googleusercontent.com/sitesv/'));
    });
    
    console.log(`Total images on page: ${allUrls.length}`);
    await browser.close();
    
    // Skip first 2 (logos)
    const rawProductUrls = allUrls.slice(2);
    console.log(`Product images after logos: ${rawProductUrls.length}`);
    
    // Remove the duplicate at index 95 (second 8cm-94)
    const productUrls = [...rawProductUrls.slice(0, 95), ...rawProductUrls.slice(96)];
    console.log(`Product images after removing 8cm-94 duplicate: ${productUrls.length}`);
    console.log(`Expected: 118 (8cm-00 to 8cm-117)`);
    
    let success = 0;
    for (let i = 0; i < productUrls.length; i++) {
        const num = String(i).padStart(2, '0');
        const filename = `8cm-${num}.jpg`;
        const filepath = path.join(OUTPUT_DIR, filename);
        
        try {
            process.stdout.write(`[${i+1}/${productUrls.length}] ${filename}... `);
            await downloadFile(productUrls[i], filepath);
            const stats = fs.statSync(filepath);
            console.log(`OK (${(stats.size/1024).toFixed(1)}KB)`);
            success++;
            await new Promise(r => setTimeout(r, 50));
        } catch (err) {
            console.log(`FAILED: ${err.message}`);
        }
    }
    
    console.log(`\nDone! Downloaded ${success}/${productUrls.length}`);
}

main().catch(console.error);
