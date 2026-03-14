import fs from 'fs';

const elements = JSON.parse(fs.readFileSync('layout_debug.json', 'utf8'));

// Filter out header stuff, only elements below a certain point if needed (but sorting helps)
const validElements = elements.filter(e => e.rect.width > 0 && e.rect.height > 0);

// Group by top-ish (y value)
let lines = [];
let sortedByVer = [...validElements].sort((a,b) => a.rect.top - b.rect.top);

let currentLine = { top: sortedByVer[0].rect.top, elements: [sortedByVer[0]] };
lines.push(currentLine);

for (let i = 1; i < sortedByVer.length; i++) {
    const el = sortedByVer[i];
    // if within 5px of the line top, it's the same line
    if (Math.abs(el.rect.top - currentLine.top) < 15) { 
        currentLine.elements.push(el);
    } else {
        currentLine = { top: el.rect.top, elements: [el] };
        lines.push(currentLine);
    }
}

// Now join text for each line, sorting horizontally
const rows = lines.map(line => {
    line.elements.sort((a,b) => a.rect.left - b.rect.left);
    let images = line.elements.filter(e => e.type === 'image');
    let texts = line.elements.filter(e => e.type === 'text');
    
    // Join text strings that are close horizontally
    let lineStr = texts.map(t => t.text).join('').replace(/\s+/g, '');
    
    return {
        top: line.top,
        textStr: lineStr,
        images: images,
        rect: {
            top: Math.min(...line.elements.map(e => e.rect.top)),
            bottom: Math.max(...line.elements.map(e => e.rect.bottom)),
            left: Math.min(...line.elements.map(e => e.rect.left)),
            right: Math.max(...line.elements.map(e => e.rect.right)),
        }
    };
});

const decals = [];
const allImages = validElements.filter(e => e.type === 'image');

for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const match = row.textStr.match(/15cm-?([0-9]+)/i);
    
    if (match) {
        let name = match[0].toUpperCase();
        // The text string might be like 15cm-01 or just 15cm-0... 
        // Let's actually check full string to confirm
        
        let hasPrice = false;
        for (let j = i + 1; j < Math.min(i + 8, rows.length); j++) {
            if (/ЛВ/i.test(rows[j].textStr)) {
                hasPrice = true;
                break;
            }
            if (/15cm/i.test(rows[j].textStr)) {
                break; // Next decal started
            }
        }
        
        let bestImg = null;
        let minDist = Infinity;
        
        // Image logic: find the image directly above it
        allImages.forEach(img => {
            const dy = Math.abs(row.top - img.rect.bottom);
            const dx = Math.abs(row.rect.left - img.rect.left);
            const dist = dy + dx;
            
            // Limit distance
            if (dist < 400) { 
                if (dy < minDist) {
                    minDist = dy;
                    bestImg = img.src;
                }
            }
        });

        // Try to fix name if it's "15CM-0" but we have a number right after it
        if (!decals.find(d => d.name === name)) {
            decals.push({
                name: name,
                hasPrice,
                imgUrl: bestImg,
                originalText: row.textStr
            });
        }
    }
}

console.log(`Found ${decals.length} unique decals.`);
fs.writeFileSync('parsed_decals.json', JSON.stringify(decals, null, 2));

const noPrice = decals.filter(d => !d.hasPrice);
console.log(`Found ${noPrice.length} without price:`);
noPrice.forEach(d => console.log(d.name));
