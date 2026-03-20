import fs from 'fs';

const filePath = 'e:/Antigravity/CarDecal3/data/products.ts';
const slugsToDelete = [
  'sports-mind-powered-by-brand', 
  'skulls-multi-brand-collection', 
  'skulls-with-brand-logos', 
  '5x33cm-48'
];

async function run() {
  console.log("Filtering products.ts...");
  let content = fs.readFileSync(filePath, 'utf8');
  
  const startMarker = 'export const productsData: Product[] = [';
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return;
  
  const header = content.substring(0, startIndex + startMarker.length);
  const arrayString = content.substring(startIndex + startMarker.length);
  
  // This is tricky because it's a JS object literal.
  // I'll use a hack to parse and re-stringify or just use regex.
  // Simple regex-based approach:
  let products;
  try {
    // We add ']' to complete the array for eval
    // But then we need to handle the end of the file.
    // The file ends with '];\n'
    const closingIndex = arrayString.lastIndexOf('];');
    const fullArrayString = '[' + arrayString.substring(0, closingIndex + 1);
    products = new Function(`return ${fullArrayString};`)();
  } catch (e) {
    console.error("Eval failed:", e.message);
    return;
  }
  
  const filtered = products.filter(p => !slugsToDelete.includes(p.slug));
  console.log(`Removed ${products.length - filtered.length} products.`);
  
  const newContent = header + '\n' + filtered.map(p => `  ${JSON.stringify(p, null, 2)},`).join('\n') + '\n];\n';
  fs.writeFileSync(filePath, newContent);
  console.log("Updated products.ts");
}

run();
