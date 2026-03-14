/**
 * Script to generate product entries for 7cm items
 * and append them to data/products.ts
 */
const fs = require('fs');
const path = require('path');

// All 184 products from Google Sites with EUR prices
const products = [
  { id: "01", eur: 0.40 }, { id: "02", eur: 0.64 }, { id: "03", eur: 0.45 },
  { id: "04", eur: 0.38 }, { id: "05", eur: 0.25 }, { id: "06", eur: 0.25 },
  { id: "07", eur: 0.26 }, { id: "08", eur: 0.54 }, { id: "09", eur: 0.30 },
  { id: "10", eur: 0.59 }, { id: "11", eur: 0.30 }, { id: "12", eur: 0.59 },
  { id: "13", eur: 0.59 }, { id: "14", eur: 0.59 }, { id: "15", eur: 0.25 },
  { id: "16", eur: 0.38 }, { id: "17", eur: 0.28 }, { id: "18", eur: 0.28 },
  { id: "19", eur: 0.43 }, { id: "20", eur: 0.33 }, { id: "21", eur: 0.33 },
  { id: "22", eur: 0.43 }, { id: "23", eur: 0.43 }, { id: "24", eur: 0.43 },
  { id: "25", eur: 0.33 }, { id: "26", eur: 0.33 }, { id: "27", eur: 0.33 },
  { id: "28", eur: 0.19 }, { id: "29", eur: 0.33 }, { id: "30", eur: 0.47 },
  { id: "31", eur: 0.33 }, { id: "32", eur: 0.27 }, { id: "33", eur: 0.34 },
  { id: "34", eur: 0.46 }, { id: "35", eur: 0.46 }, { id: "36", eur: 0.46 },
  { id: "37", eur: 0.46 }, { id: "38", eur: 0.19 }, { id: "39", eur: 0.33 },
  { id: "40", eur: 0.34 }, { id: "41", eur: 0.35 }, { id: "42", eur: 0.35 },
  { id: "43", eur: 0.54 }, { id: "44", eur: 0.54 }, { id: "45", eur: 0.49 },
  { id: "46", eur: 0.61 }, { id: "47", eur: 0.27 }, { id: "48", eur: 0.21 },
  { id: "49", eur: 0.49 }, { id: "50", eur: 0.32 }, { id: "51", eur: 0.27 },
  { id: "52", eur: 0.27 }, { id: "53", eur: 0.18 }, { id: "54", eur: 0.20 },
  { id: "55", eur: 0.40 }, { id: "56", eur: 0.40 }, { id: "57", eur: 0.40 },
  { id: "58", eur: 0.64 }, { id: "59", eur: 0.27 }, { id: "60", eur: 0.64 },
  { id: "61", eur: 0.41 }, { id: "62", eur: 0.38 }, { id: "63", eur: 0.38 },
  { id: "64", eur: 0.38 }, { id: "65", eur: 0.38 }, { id: "66", eur: 0.38 },
  { id: "67", eur: 0.38 }, { id: "68", eur: 0.38 }, { id: "69", eur: 0.56 },
  { id: "70", eur: 0.19 }, { id: "71", eur: 0.34 }, { id: "72", eur: 0.41 },
  { id: "73", eur: 0.61 }, { id: "74", eur: 0.64 }, { id: "75", eur: 0.25 },
  { id: "76", eur: 0.56 }, { id: "77", eur: 0.27 }, { id: "78", eur: 0.64 },
  { id: "79", eur: 0.64 }, { id: "80", eur: 0.49 }, { id: "81", eur: 0.49 },
  { id: "82", eur: 0.49 }, { id: "83", eur: 0.49 }, { id: "84", eur: 0.49 },
  { id: "85", eur: 0.49 }, { id: "86", eur: 0.49 }, { id: "87", eur: 0.34 },
  { id: "88", eur: 0.59 }, { id: "89", eur: 0.59 }, { id: "90", eur: 0.21 },
  { id: "91", eur: 0.30 }, { id: "92", eur: 0.50 }, { id: "93", eur: 0.50 },
  { id: "94", eur: 0.38 }, { id: "95", eur: 0.27 }, { id: "96", eur: 0.59 },
  { id: "97", eur: 0.25 }, { id: "98", eur: 0.25 }, { id: "99", eur: 0.23 },
  { id: "100", eur: 0.38 }, { id: "101", eur: 0.32 }, { id: "102", eur: 0.28 },
  { id: "103", eur: 0.49 }, { id: "104", eur: 0.64 }, { id: "105", eur: 0.84 },
  { id: "106", eur: 0.46 }, { id: "107", eur: 0.46 }, { id: "108", eur: 0.59 },
  { id: "109", eur: 0.50 }, { id: "110", eur: 0.54 }, { id: "111", eur: 0.54 },
  { id: "112", eur: 0.19 }, { id: "113", eur: 0.56 }, { id: "114", eur: 0.21 },
  { id: "115", eur: 0.35 }, { id: "116", eur: 0.43 }, { id: "117", eur: 0.64 },
  { id: "118", eur: 0.34 }, { id: "119", eur: 0.43 }, { id: "120", eur: 0.43 },
  { id: "121", eur: 0.54 }, { id: "122", eur: 0.64 }, { id: "123", eur: 0.28 },
  { id: "124", eur: 0.33 }, { id: "125", eur: 0.64 }, { id: "126", eur: 0.25 },
  { id: "127", eur: 0.50 }, { id: "128", eur: 0.49 }, { id: "129", eur: 0.21 },
  { id: "130", eur: 0.27 }, { id: "131", eur: 0.35 }, { id: "132", eur: 0.30 },
  { id: "133", eur: 0.59 }, { id: "134", eur: 0.71 }, { id: "135", eur: 0.30 },
  { id: "136", eur: 0.59 }, { id: "137", eur: 0.33 }, { id: "138", eur: 0.56 },
  { id: "139", eur: 0.71 }, { id: "140", eur: 0.71 }, { id: "141", eur: 0.71 },
  { id: "142", eur: 0.71 }, { id: "143", eur: 0.71 }, { id: "144", eur: 0.71 },
  { id: "145", eur: 0.71 }, { id: "146", eur: 0.71 }, { id: "147", eur: 0.71 },
  { id: "148", eur: 0.71 }, { id: "149", eur: 0.71 }, { id: "150", eur: 0.71 },
  { id: "151", eur: 0.71 }, { id: "152", eur: 0.28 }, { id: "153", eur: 0.59 },
  { id: "154", eur: 0.59 }, { id: "155", eur: 0.71 }, { id: "156", eur: 0.59 },
  { id: "157", eur: 0.54 }, { id: "158", eur: 0.71 }, { id: "159", eur: 0.40 },
  { id: "160", eur: 0.35 }, { id: "161", eur: 0.81 }, { id: "162", eur: 0.81 },
  { id: "163", eur: 0.40 }, { id: "164", eur: 0.40 }, { id: "165", eur: 0.40 },
  { id: "166", eur: 0.28 }, { id: "167", eur: 0.28 }, { id: "168", eur: 0.22 },
  { id: "169", eur: 0.81 }, { id: "170", eur: 0.40 }, { id: "171", eur: 0.49 },
  { id: "172", eur: 0.43 }, { id: "173", eur: 0.71 }, { id: "174", eur: 0.71 },
  { id: "175", eur: 0.40 }, { id: "176", eur: 0.34 }, { id: "177", eur: 0.43 },
  { id: "178", eur: 0.43 }, { id: "179", eur: 0.43 }, { id: "180", eur: 0.40 },
  { id: "181", eur: 0.32 }, { id: "182", eur: 0.40 }, { id: "183", eur: 0.71 },
  { id: "184", eur: 0.71 },
];

// Generate product entries
const entries = products.map(p => {
  const paddedId = p.id.padStart(2, '0');
  return `  {
    slug: "7cm-${paddedId}",
    name: "7CM-${paddedId}",
    nameBg: "7CM-${paddedId}",
    avatar: "/Site_Pics/Decals/7cm/7cm-${paddedId}.jpg",
    coverImage: "/Site_Pics/Decals/7cm/7cm-${paddedId}.jpg",
    categories: ["7cm", "\u0421\u0442\u0438\u043a\u0435\u0440\u0438"],
    location: "CarDecal HQ",
    dimensions: "7cm",
    size: "7cm",
    finish: "Gloss / Matte",
    material: "High-Performance Vinyl",
    description: "\u0412\u0438\u0441\u043e\u043a\u043e\u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043d \u0432\u0438\u043d\u0438\u043b\u043e\u0432 \u0441\u0442\u0438\u043a\u0435\u0440 \u043e\u0442 CarDecal.",
    stockStatus: "In Stock",
    highlights: [],
    posts: [],
    cardImages: [],
    isBestSeller: false,
    isVerified: true,
    price: null,
    wholesalePrice: null,
    price_eur: ${p.eur},
    wholesalePriceEur: ${p.eur},
  }`;
});

const block = entries.join(',\n');

// Read existing file
const filePath = path.join(__dirname, 'data', 'products.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find last ]; and insert before it
const lastBracket = content.lastIndexOf('];');
if (lastBracket === -1) {
  console.error('Could not find end of products array');
  process.exit(1);
}

const before = content.substring(0, lastBracket);
const after = content.substring(lastBracket);

// Add comma after last entry if needed
const trimmedBefore = before.trimEnd();
const needsComma = !trimmedBefore.endsWith(',');

const newContent = trimmedBefore + (needsComma ? ',' : '') + '\n' + block + ',\n' + after;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log(`Added ${products.length} products to data/products.ts`);
console.log('Done!');
