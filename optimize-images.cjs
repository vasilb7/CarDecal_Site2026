const sharp = require('sharp');
const path = require('path');

async function optimize() {
  const publicDir = path.join(__dirname, 'public');
  const heroPath = path.join(publicDir, 'hero_image.jpg');

  // Hero for mobile (1080px width - Retina displays)
  await sharp(heroPath)
    .resize(1080, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(publicDir, 'hero_mobile.webp'));
  console.log('Done: hero_mobile.webp');

  // Hero for desktop (1920px width for 4K/FullHD)
  await sharp(heroPath)
    .resize(1920, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(path.join(publicDir, 'hero_desktop.webp'));
  console.log('Done: hero_desktop.webp');

  // Also make footer images even smaller for mobile
  const footerDir = path.join(publicDir, 'Footer');
  await sharp(path.join(footerDir, '2026.webp'))
    .resize(600, null, { withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(path.join(footerDir, '2026_mobile.webp'));
  console.log('Done: 2026_mobile.webp');

  await sharp(path.join(footerDir, '2026red.webp'))
    .resize(600, null, { withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(path.join(footerDir, '2026red_mobile.webp'));
  console.log('Done: 2026red_mobile.webp');
}

optimize().catch(console.error);
