import fs from 'fs';
import path from 'path';

const SIZE = '25cm';
const dir = `public/Site_Pics/Decals/${SIZE}`;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();

let html = `<html><body style="background:#222;color:#eee;font-family:sans-serif;">`;
html += `<h1>Scan Decals - ${SIZE}</h1>`;
html += `<div style="display:flex;flex-wrap:wrap;gap:20px;">`;

for (const file of files) {
    html += `<div style="border:1px solid #444;padding:10px;text-align:center;">`;
    html += `<h3>${file}</h3>`;
    // We use absolute file path for the browser subagent to access locally if needed,
    // or just a relative path if we open the file from the root.
    html += `<img src="${dir}/${file}" style="max-width:400px;display:block;">`;
    html += `</div>`;
}

html += `</div></body></html>`;

fs.writeFileSync('scan_gallery.html', html);
console.log('Created scan_gallery.html');
