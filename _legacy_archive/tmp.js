const fs = require('fs');
const html = fs.readFileSync('y.html', 'utf8');
const titleMatch = html.match(/<title>(.*?)<\/title>/);
const descMatch = html.match(/"shortDescription":"(.*?)"/);
console.log('Title:', titleMatch ? titleMatch[1] : 'N/A');
console.log('Desc:', descMatch ? descMatch[1] : 'N/A');
