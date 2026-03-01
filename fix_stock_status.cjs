const fs = require('fs');
const path = 'e:/Antigravity/CarDecal3/data/models.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replaceAll("'stockStatus': 'В Наличност'", "'stockStatus': 'In Stock'");
fs.writeFileSync(path, content);
console.log('Fixed all stockStatus values.');
