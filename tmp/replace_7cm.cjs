const fs = require('fs');
const content = fs.readFileSync('e:/Antigravity/CarDecal3/data/products.ts', 'utf8');

let newContent = content.replace(/size:\s*"7cm"/g, 'size: "7 см"');
newContent = newContent.replace(/dimensions:\s*"7cm"/g, 'dimensions: "7 см"');

fs.writeFileSync('e:/Antigravity/CarDecal3/data/products.ts', newContent, 'utf8');
console.log('Replaced 7cm sizes with 7 см');
