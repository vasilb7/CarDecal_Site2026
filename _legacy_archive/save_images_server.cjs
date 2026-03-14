const http = require('http');
const fs = require('fs');
const path = require('path');

const targetDir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/5cm';
const metaFile = 'e:/Antigravity/CarDecal3/scraped_data.json';

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

let allData = [];
if (fs.existsSync(metaFile)) {
    allData = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
}

const server = http.createServer((req, res) => {
    // Add CORS headers so the browser script can send requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { name, priceText, base64 } = data;
                if (!name || !base64) {
                    res.writeHead(400);
                    res.end('Missing name or base64');
                    return;
                }
                const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(path.join(targetDir, `${name}.jpg`), buffer);
                
                // Update meta
                const existingIndex = allData.findIndex(d => d.name === name);
                if (existingIndex !== -1) {
                    allData[existingIndex] = { name, priceText };
                } else {
                    allData.push({ name, priceText });
                }
                fs.writeFileSync(metaFile, JSON.stringify(allData, null, 2));

                console.log(`Saved ${name}.jpg with price ${priceText}`);
                res.writeHead(200);
                res.end('Saved');
            } catch (e) {
                console.error('Error parsing JSON', e);
                res.writeHead(500);
                res.end('Error');
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(9998, () => {
    console.log('Image upload server listening on port 9998');
});
