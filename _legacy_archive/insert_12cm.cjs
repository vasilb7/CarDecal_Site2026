/**
 * Parse 12cm product data and generate SQL INSERT statements
 * Products: 12cm-01 to 12cm-393
 * Note: 12cm-198 appears twice in source text (with different prices)
 * First 8 products share the default price: 0.98 BGN / 0.50 EUR
 */

// Parsed from Google Sites page text
// Format: [productNumber, priceBGN, priceEUR]
// First 8 products have the default page price of 0.98 BGN / 0.50 EUR
const products = [];

// Products 1-8: default price 0.98 BGN / 0.50 EUR
for (let i = 1; i <= 8; i++) {
    products.push([i, 0.50]);
}

// Products 9 onwards with individual prices (EUR)
const pricesEur = [
    // 9 (actually labeled 12cm-02 with 1.82/0.93 but let me re-check)
    // Re-reading the text: the first 8 all show "0.98ЛВ 0.50€" then:
    // 12cm-01, 12cm-02, then 12cm-03 has 1.82/0.93, etc
    // Let me re-parse carefully
];

// Actually, let me re-read the text more carefully.
// The text starts with:
// "0.98ЛВ 0.50€" repeated 8 times (these are the default price headers, not products)
// Then the actual product listing begins:
// 12cm-01
// 12cm-02
// 1.82ЛВ 0.93€    <- this is the price for 12cm-03
// 12cm-03
// etc.

// So the first line of prices (8x "0.98ЛВ 0.50€") is just the page/category default.
// Products 12cm-01 and 12cm-02 don't have individual prices listed, so they use the default (0.50€).
// Starting from 12cm-03, each product has its own price.

// Let me build the full price map from the parsed text
const priceMap = {};
// Default price for products without explicit price
const defaultPriceEur = 0.50;

// Products with explicit prices (extracted from the page text)
// Mapping: product number -> EUR price
const explicitPrices = {
    1: 0.50, 2: 0.50, // Use default
    3: 0.93, 4: 0.64, 5: 0.64, 6: 0.64, 7: 0.64, 8: 0.55,
    9: 0.61, 10: 0.64, 11: 0.55, 12: 0.67, 13: 0.67, 14: 0.64,
    15: 0.64, 16: 0.64, 17: 0.64, 18: 0.78, 19: 0.59, 20: 0.78,
    21: 0.69, 22: 0.69, 23: 0.69, 24: 0.69, 25: 0.69, 26: 0.69,
    27: 0.50, 28: 2.56, 29: 0.67, 30: 0.67, 31: 0.67, 32: 0.67,
    33: 0.84, 34: 0.84, 35: 0.84, 36: 0.84, 37: 0.54, 38: 0.56,
    39: 0.80, 40: 0.50, 41: 2.20, 42: 0.89, 43: 0.89, 44: 0.55,
    45: 0.54, 46: 0.82, 47: 2.25, 48: 1.51, 49: 0.64, 50: 0.64,
    51: 0.64, 52: 0.64, 53: 0.64, 54: 0.64, 55: 0.64, 56: 0.64,
    57: 0.54, 58: 0.95, 59: 0.84, 60: 0.84, 61: 0.78, 62: 0.59,
    63: 0.54, 64: 0.54, 65: 0.59, 66: 0.59, 67: 0.89, 68: 0.89,
    69: 0.89, 70: 0.89, 71: 0.89, 72: 0.89, 73: 0.69, 74: 0.93,
    75: 0.51, 76: 0.59, 77: 0.59, 78: 0.56, 79: 0.93, 80: 0.54,
    81: 0.84, 82: 0.67, 83: 0.49, 84: 0.49, 85: 0.89, 86: 0.51,
    87: 0.51, 88: 0.50, 89: 0.59, 90: 0.49, 91: 0.89, 92: 0.80,
    93: 0.80, 94: 0.54, 95: 0.54, 96: 0.54, 97: 0.54, 98: 0.64,
    99: 0.45, 100: 0.54, 101: 0.54, 102: 0.64, 103: 0.64, 104: 0.64,
    105: 0.50, 106: 0.50, 107: 1.19, 108: 0.49, 109: 0.55, 110: 0.59,
    111: 1.38, 112: 0.84, 113: 0.84, 114: 0.84, 115: 0.84, 116: 0.84,
    117: 2.35, 118: 2.35, 119: 2.35, 120: 2.35, 121: 0.84, 122: 0.84,
    123: 0.84, 124: 0.84, 125: 0.84, 126: 0.84, 127: 0.71, 128: 0.71,
    129: 0.71, 130: 0.71, 131: 0.71, 132: 0.55, 133: 0.50, 134: 0.50,
    135: 0.89, 136: 0.89, 137: 0.59, 138: 0.56, 139: 0.35, 140: 0.50,
    141: 0.50, 142: 0.57, 143: 0.84, 144: 0.64, 145: 0.64, 146: 0.64,
    147: 0.64, 148: 0.64, 149: 0.64, 150: 0.64, 151: 0.78, 152: 0.64,
    153: 0.64, 154: 0.78, 155: 0.78, 156: 0.64, 157: 0.78, 158: 0.64,
    159: 0.64, 160: 0.64, 161: 0.64, 162: 0.78, 163: 0.64, 164: 0.64,
    165: 0.64, 166: 0.64, 167: 0.78, 168: 0.78, 169: 0.78, 170: 0.78,
    171: 0.64, 172: 0.64, 173: 0.84, 174: 0.84, 175: 0.84, 176: 0.84,
    177: 0.84, 178: 0.64, 179: 0.64, 180: 0.69, 181: 0.89, 182: 0.89,
    183: 0.89, 184: 0.60, 185: 0.56, 186: 0.48, 187: 0.72, 188: 0.72,
    189: 0.69, 190: 0.84, 191: 0.73, 192: 0.50, 193: 0.73, 194: 0.72,
    195: 0.73, 196: 0.54, 197: 0.51, 198: 0.73, 199: 0.50, 200: 0.45,
    201: 0.50, 202: 0.45, 203: 0.50, 204: 0.45, 205: 0.50, 206: 0.45,
    207: 0.45, 208: 0.50, 209: 0.45, 210: 0.50, 211: 0.84, 212: 0.69,
    213: 0.55, 214: 0.54, 215: 0.49, 216: 0.69, 217: 1.17, 218: 0.59,
    219: 0.89, 220: 0.56, 221: 0.54, 222: 0.64, 223: 0.51, 224: 1.51,
    225: 0.50, 226: 0.50, 227: 0.55, 228: 0.55, 229: 0.55, 230: 0.64,
    231: 0.50, 232: 0.50, 233: 0.50, 234: 0.89, 235: 0.59, 236: 0.59,
    237: 0.59, 238: 0.80, 239: 0.54, 240: 0.55, 241: 0.64, 242: 0.89,
    243: 0.89, 244: 0.50, 245: 0.50, 246: 0.61, 247: 1.38, 248: 1.38,
    249: 1.25, 250: 0.93, 251: 0.93, 252: 0.93, 253: 0.93, 254: 0.93,
    255: 0.93, 256: 0.93, 257: 1.25, 258: 0.89, 259: 0.89, 260: 0.89,
    261: 0.89, 262: 0.56, 263: 0.89, 264: 2.25, 265: 0.95, 266: 0.84,
    267: 1.38, 268: 1.38, 269: 1.38, 270: 1.25, 271: 2.35, 272: 1.38,
    273: 0.89, 274: 0.56, 275: 0.54, 276: 0.56, 277: 0.56, 278: 0.56,
    279: 0.56, 280: 0.56, 281: 0.69, 282: 0.89, 283: 0.54, 284: 0.56,
    285: 0.89, 286: 0.84, 287: 0.50, 288: 0.50, 289: 0.74, 290: 0.74,
    291: 0.74, 292: 0.59, 293: 0.72, 294: 1.38, 295: 0.56, 296: 0.56,
    297: 0.73, 298: 0.89, 299: 0.72, 300: 0.84, 301: 0.84, 302: 0.73,
    303: 0.77, 304: 0.60, 305: 0.59, 306: 0.57, 307: 1.97, 308: 1.97,
    309: 1.97, 310: 1.99, 311: 1.30, 312: 1.30, 313: 0.74, 314: 0.74,
    315: 0.84, 316: 0.84, 317: 0.84, 318: 0.69, 319: 1.51, 320: 1.51,
    321: 0.57, 322: 0.69, 323: 0.69, 324: 0.57, 325: 0.57, 326: 0.49,
    327: 0.93, 328: 0.89, 329: 0.89, 330: 0.89, 331: 0.89, 332: 0.89,
    333: 0.89, 334: 0.93, 335: 0.72, 336: 0.72, 337: 0.69, 338: 0.59,
    339: 0.59, 340: 0.51, 341: 0.50, 342: 0.51, 343: 0.54, 344: 0.73,
    345: 0.93, 346: 0.55, 347: 0.55, 348: 1.51, 349: 1.51, 350: 0.56,
    351: 0.89, 352: 0.59, 353: 0.64, 354: 0.60, 355: 0.93, 356: 0.93,
    357: 0.51, 358: 0.54, 359: 0.54, 360: 0.93, 361: 0.69, 362: 0.51,
    363: 0.89, 364: 1.38, 365: 1.30, 366: 0.61, 367: 0.59, 368: 0.84,
    369: 0.84, 370: 0.80, 371: 0.80, 372: 0.80, 373: 0.80, 374: 0.78,
    375: 0.55, 376: 0.56, 377: 0.56, 378: 0.64, 379: 0.56, 380: 0.64,
    381: 0.64, 382: 0.56, 383: 0.56, 384: 0.56, 385: 0.56, 386: 0.56,
    387: 0.56, 388: 0.89, 389: 0.89, 390: 0.89, 391: 0.56, 392: 0.56,
    393: 0.56,
};

// Generate SQL INSERT statements in batches
const BATCH_SIZE = 50;
const totalProducts = 393;
const batches = [];

for (let batchStart = 1; batchStart <= totalProducts; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalProducts);
    const values = [];
    
    for (let i = batchStart; i <= batchEnd; i++) {
        const num = String(i).padStart(2, '0');
        const name = `12CM-${num}`;
        const slug = `12cm-${num}`;
        const avatar = `/Site_Pics/Decals/12cm/12cm-${num}.jpg`;
        const priceEur = explicitPrices[i] || defaultPriceEur;
        
        values.push(`('${slug}', '${name}', '${name}', '${avatar}', '${avatar}', '["Стикери","12cm"]', '12cm', '12 x ? cm', 'Стикер', 'Vinyl', 'Декоративен стикер 12см', 'In Stock', false, false, ${priceEur})`);
    }
    
    const sql = `INSERT INTO products (slug, name, name_bg, avatar, cover_image, categories, dimensions, size, finish, material, description, stock_status, is_best_seller, is_verified, price_eur) VALUES\n${values.join(',\n')};`;
    
    batches.push({ start: batchStart, end: batchEnd, sql });
}

// Output the SQL
for (const batch of batches) {
    console.log(`\n-- Batch ${batch.start}-${batch.end}`);
    console.log(batch.sql);
}

console.log(`\nTotal: ${totalProducts} products in ${batches.length} batches`);
