/**
 * Re-download 7cm images: skip first 2 logos, download rest as 7cm-01 to 7cm-184
 */
const { chromium } = require("playwright-core");
const https = require("https");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "public", "Site_Pics", "Decals", "7cm");
const URL_PAGE = "https://sites.google.com/view/cardecor/7cm?authuser=0";

// Clean and recreate
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true });
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          try {
            fs.unlinkSync(filepath);
          } catch (e) {}
          downloadFile(response.headers.location, filepath)
            .then(resolve)
            .catch(reject);
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navigating to Google Sites 7cm page...");
  await page.goto(URL_PAGE, { waitUntil: "networkidle", timeout: 60000 });

  console.log("Scrolling to load all images...");
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

  console.log("Extracting image URLs...");
  const allUrls = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .map((img) => img.src)
      .filter((src) => src && src.includes("googleusercontent.com/sitesv/"));
  });

  console.log(`Total images on page: ${allUrls.length}`);
  await browser.close();

  // Skip first 2 (logos) and last extra ones if over 186 (2 logos + 184 products)
  const productUrls = allUrls.slice(2, 2 + 184);
  console.log(`Product images to download: ${productUrls.length}`);

  // Download each
  let success = 0;
  for (let i = 0; i < productUrls.length; i++) {
    const num = String(i + 1).padStart(2, "0");
    const filename = `7cm-${num}.jpg`;
    const filepath = path.join(OUTPUT_DIR, filename);

    try {
      process.stdout.write(`[${i + 1}/${productUrls.length}] ${filename}... `);
      await downloadFile(productUrls[i], filepath);
      const stats = fs.statSync(filepath);
      console.log(`OK (${(stats.size / 1024).toFixed(1)}KB)`);
      success++;
      await new Promise((r) => setTimeout(r, 50));
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }

  console.log(
    `\nDone! Downloaded ${success}/${productUrls.length} images to ${OUTPUT_DIR}`,
  );
}

main().catch(console.error);
