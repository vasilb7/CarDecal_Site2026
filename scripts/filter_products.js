import fs from 'fs';

const filePath = 'e:/Antigravity/CarDecal3/data/products.ts';
const content = fs.readFileSync(filePath, 'utf8');

// The file looks like:
// import type { Product, Post } from "../types";
// export const productsData: Product[] = [
//   { ... },
//   ...
// ];

// We want to remove objects where categories contain "5cm"
// Since it's a JS file, a regex might be tricky for nested objects.
// But we can parse it if we remove the 'export const' part and the import.

const stripPrefix = content.replace(/import.*?;\s*export const productsData: Product\[\] = /, '');
const finalContent = stripPrefix.replace(/];\s*$/, '');

// This is still fragile. Let's try a safer regex to match individual product blocks.
// Product blocks start with { and end with },
// A product block has slug: "5cm-..." or categories: ["5cm", ...]

try {
  // A better way: read the file, identify blocks, and filter.
  // But 18000 lines...
  
  // Let's just create a NEW products.ts with a fresh implementation.
  // No, the user might have other products (like 10cm, decals, etc.) that he wants to KEEP.
  
  console.log("Identifying 5cm products in products.ts...");
  
  // I'll read the file line by line and find the start/end of products to remove.
  const lines = content.split('\n');
  const newLines = [];
  let inProduct = false;
  let currentProductLines = [];
  let is5cm = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === '{') {
      inProduct = true;
      currentProductLines = [line];
      is5cm = false;
    } else if (inProduct) {
      currentProductLines.push(line);
      if (line.includes('"5cm"') || line.includes("'5cm'")) {
        is5cm = true;
      }
      if (line.trim().startsWith('},')) {
        inProduct = false;
        if (!is5cm) {
          newLines.push(...currentProductLines);
        } else {
          console.log(`Removed product: ${currentProductLines.find(l => l.includes('name:'))?.trim() || 'unknown'}`);
        }
        currentProductLines = [];
      }
    } else {
      newLines.push(line);
    }
  }
  
  fs.writeFileSync(filePath, newLines.join('\n'));
  console.log("Local products.ts updated.");
} catch (e) {
  console.error("Failed to update products.ts:", e.message);
}
