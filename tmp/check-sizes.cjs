const fs = require('fs');
const content = fs.readFileSync('e:/Antigravity/CarDecal3/data/products.ts', 'utf8');

const regex = /size:\s*"([^"]+)"/g;
let match;
const sizes = new Set();
while ((match = regex.exec(content)) !== null) {
  sizes.add(match[1]);
}

const dimRegex = /dimensions:\s*"([^"]+)"/g;
const dims = new Set();
while ((match = dimRegex.exec(content)) !== null) {
  dims.add(match[1]);
}

console.log("Sizes:", Array.from(sizes));
console.log("Dimensions:", Array.from(dims));
