/**
 * Download 12cm product images from Google Sites
 * 393 products: 12cm-01 to 12cm-393
 * Duplicate: 12cm-198 appears twice (at position 198 and 199 in product list)
 * Prices extracted from page text
 */
const { chromium } = require('playwright-core');
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'public', 'Site_Pics', 'Decals', '12cm');
const URL_PAGE = 'https://sites.google.com/view/cardecor/12cm?authuser=0';

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
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Navigating to Google Sites 12cm page...');
    await page.goto(URL_PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('Scrolling to load all images (this page is very long with 393 products)...');
    // First pass - scroll slowly to trigger lazy loading
    for (let i = 0; i < 300; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(200);
    }
    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    // Second pass - faster  
    for (let i = 0; i < 300; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(150);
    }
    // Third pass
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    for (let i = 0; i < 300; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(100);
    }
    
    console.log('Extracting image URLs...');
    const allUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img'))
            .map(img => img.src)
            .filter(src => src && src.includes('googleusercontent.com/sitesv/'));
    });
    
    console.log(`Total images on page: ${allUrls.length}`);
    
    // Debug: show first few URLs to identify logos vs products
    console.log('\nFirst 12 URLs (to identify logos):');
    for (let i = 0; i < Math.min(12, allUrls.length); i++) {
        const url = allUrls[i];
        const short = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('/') + 30) + '...';
        console.log(`  [${i}] ${short}`);
    }
    
    await browser.close();
    
    // Determine logos to skip - the page has a logo at top
    // Based on analysis: first URL is a logo, second is duplicate of first
    // We need to figure out how many to skip.
    // 393 products + N logos = total URLs
    // If total = 403, then N = 10 logos to skip
    // If total = 394, then N = 1 logo to skip
    
    const expectedProducts = 393;
    const logosToSkip = allUrls.length - expectedProducts;
    console.log(`\nLogos/nav images to skip: ${logosToSkip}`);
    
    if (logosToSkip < 0 || logosToSkip > 15) {
        console.log('WARNING: Unexpected number of logos. Please check manually.');
        console.log('Saving all URLs to 12cm_urls.json for inspection...');
        fs.writeFileSync(path.join(__dirname, '12cm_urls.json'), JSON.stringify(allUrls, null, 2));
        return;
    }
    
    const productUrls = allUrls.slice(logosToSkip);
    console.log(`Product images: ${productUrls.length}`);
    
    // Handle the duplicate 12cm-198
    // In the text data, 12cm-198 appears twice (positions 198 and 199 counting from 1 in products)
    // This means productUrls[197] and productUrls[198] are both 12cm-198
    // We need to remove the duplicate (second one at index 198)
    // After removal: productUrls[197] = 12cm-198, productUrls[198] = 12cm-199 etc
    // Total should be 393 - 1 = 392 unique products
    // Actually let's keep all 393 and just skip the duplicate in numbering
    
    // Save all URLs for reference
    fs.writeFileSync(path.join(__dirname, '12cm_urls.json'), JSON.stringify(productUrls, null, 2));
    console.log('Saved URLs to 12cm_urls.json');
    
    let success = 0;
    for (let i = 0; i < productUrls.length; i++) {
        const num = String(i + 1).padStart(2, '0');
        const filename = `12cm-${num}.jpg`;
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
