const fs = require('fs');
const content = fs.readFileSync('e:/Antigravity/CarDecal3/data/products.ts', 'utf8');

// Replace "Various" and "Различни Размери" and "Small" with "7 см" where appropriate.
// Wait, user said: "Various където са да са правилните размери да не е Various примерно да си е 7см те са си еднакви в размери"
// Let's replace literally size: "Various" and size: "Различни Размери" with size: "7 см". Wait, should I also replace dimensions?
let newContent = content.replace(/size:\s*"Various"/g, 'size: "7 см"');
newContent = newContent.replace(/size:\s*"Различни Размери"/g, 'size: "7 см"');
newContent = newContent.replace(/dimensions:\s*"Various"/g, 'dimensions: "7 см"');
newContent = newContent.replace(/dimensions:\s*"Различни Размери"/g, 'dimensions: "7 см"');
newContent = newContent.replace(/size:\s*"Различни"/g, 'size: "7 см"');
// Wait, the user said "Various където са да са правилните размери да не е Various примерно да си е 7см те са си еднакви в размери". They literally want 7см. What about dimension?
newContent = newContent.replace(/dimensions:\s*"Различни"/g, 'dimensions: "7 см"');

fs.writeFileSync('e:/Antigravity/CarDecal3/data/products.ts', newContent, 'utf8');
console.log('Replaced Various sizes with 7 см');
