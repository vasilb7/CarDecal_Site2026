const sharp = require('sharp');
const path = require('path');

async function optimize() {
  const footerDir = path.join(__dirname, 'public', 'Footer');
  
  // 2026.png -> 2026.webp (5.34 MB -> ~100KB)
  await sharp(path.join(footerDir, '2026.png'))
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(footerDir, '2026.webp'));
  console.log('Done: 2026.webp');

  // 2026red.png -> 2026red.webp (6.15 MB -> ~100KB)
  await sharp(path.join(footerDir, '2026red.png'))
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(footerDir, '2026red.webp'));
  console.log('Done: 2026red.webp');

  // LOGO.png -> LOGO.webp
  await sharp(path.join(__dirname, 'public', 'LOGO.png'))
    .resize(400, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(path.join(__dirname, 'public', 'LOGO.webp'));
  console.log('Done: LOGO.webp');
}

optimize().catch(console.error);
