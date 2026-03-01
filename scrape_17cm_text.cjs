const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const URL_PAGE = 'https://sites.google.com/view/cardecor/17cm?authuser=0';
    console.log('Navigating to Google Sites 17cm page...');
    await page.goto(URL_PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    console.log('Scrolling to load content...');
    for (let i = 0; i < 200; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(100);
    }
    
    // Extract textual content
    const textData = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(path.join(__dirname, '17cm_text.txt'), textData);
    console.log('Saved page text to 17cm_text.txt');
    
    await browser.close();
}

main().catch(console.error);
