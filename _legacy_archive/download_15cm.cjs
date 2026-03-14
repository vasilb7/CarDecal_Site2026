const { chromium } = require('playwright-core');
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'public', 'Site_Pics', 'Decals', '15cm');
const URL_PAGE = 'https://sites.google.com/view/cardecor/15cm?authuser=0';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

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
    // Make sure path to edge/chrome is provided or playwright is fully installed
    // If running in environment without browsers installed, we might need a specific executable path
    // But since download_12cm.cjs ran, just use default chromium.launch
    const browser = await chromium.launch({ headless: true });
    
    const page = await browser.newPage();
    
    console.log('Navigating to Google Sites 15cm page...');
    await page.goto(URL_PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('Scrolling to load all images...');
    for (let i = 0; i < 200; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(200);
    }
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    for (let i = 0; i < 200; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(150);
    }
    
    console.log('Extracting image URLs...');
    const allUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img'))
            .map(img => img.src)
            .filter(src => src && src.includes('googleusercontent.com/sitesv/'));
    });
    
    console.log(`Total images on page: ${allUrls.length}`);
    
    await browser.close();
    
    // Save URLs to file for inspection
    fs.writeFileSync(path.join(__dirname, '15cm_urls.json'), JSON.stringify(allUrls, null, 2));
    console.log('Saved URLs to 15cm_urls.json');
    
    // Assume first 2 images are logos (like in 12cm)
    const productUrls = allUrls.slice(2);
    console.log(`Product images (assuming 2 initial logos skipped): ${productUrls.length}`);
    
    let success = 0;
    for (let i = 0; i < productUrls.length; i++) {
        const num = String(i + 1).padStart(2, '0');
        const filename = `15cm-${num}.jpg`;
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
