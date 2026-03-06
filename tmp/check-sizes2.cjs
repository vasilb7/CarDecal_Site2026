const fs = require('fs');
const content = fs.readFileSync('e:/Antigravity/CarDecal3/data/products.ts', 'utf8');
const sizes = new Set(content.match(/size:\s*"([^"]+)"/g)?.map(m => m.split('"')[1] || ""));
console.log(Array.from(sizes));
