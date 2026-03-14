/**
 * Script to extract image URLs from Google Sites 7cm page
 * and download them locally using Playwright
 */
const { chromium } = require('playwright-core');
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'public', 'Site_Pics', 'Decals', '7cm');
const URL = 'https://sites.google.com/view/cardecor/7cm?authuser=0';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(filepath);
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
    
    console.log('Navigating to Google Sites 7cm page...');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Scroll through to load all lazy images
    console.log('Scrolling to load all images...');
    for (let i = 0; i < 40; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(300);
    }
    // Scroll back to top and down again to ensure all loaded
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    for (let i = 0; i < 40; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(200);
    }
    
    console.log('Extracting image URLs...');
    const urls = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
            .map(img => img.src)
            .filter(src => src && src.includes('googleusercontent.com/sitesv/'));
    });
    
    console.log(`Found ${urls.length} product images`);
    
    await browser.close();
    
    // Save URLs to JSON
    fs.writeFileSync(
        path.join(__dirname, '7cm_urls.json'), 
        JSON.stringify(urls, null, 2)
    );
    console.log('Saved URLs to 7cm_urls.json');
    
    // Download each
    for (let i = 0; i < urls.length; i++) {
        const num = String(i + 1).padStart(2, '0');
        const filename = `7cm-${num}.jpg`;
        const filepath = path.join(OUTPUT_DIR, filename);
        
        if (fs.existsSync(filepath)) {
            console.log(`[${i+1}/${urls.length}] Skipping ${filename} (exists)`);
            continue;
        }
        
        try {
            process.stdout.write(`[${i+1}/${urls.length}] ${filename}... `);
            await downloadFile(urls[i], filepath);
            const stats = fs.statSync(filepath);
            console.log(`OK (${(stats.size/1024).toFixed(1)}KB)`);
            await new Promise(r => setTimeout(r, 50));
        } catch (err) {
            console.log(`FAILED: ${err.message}`);
        }
    }
    
    console.log('\nDone! All images saved to:', OUTPUT_DIR);
}

main().catch(console.error);
