import fs from 'fs';

function generateSqlBatches() {
    const productsPath = 'e:/Antigravity/CarDecal3/data/products.ts';
    const content = fs.readFileSync(productsPath, 'utf8');
    
    const productRegex = /\{\r?\n\s+slug:\s+"(12cm-\d+)"[\s\S]*?\r?\n\s+\}/g;
    let match;
    const products = [];
    while ((match = productRegex.exec(content)) !== null) {
        const objText = match[0];
        try {
            // Very basic parser for the common fields
            const getField = (name) => {
                const reg = new RegExp(`${name}:\\s+("[^"]*"|'[^']*'|\\[[^\\]]*\\]|\\d+\\.?\\d*|true|false)`, 'g');
                const m = reg.exec(objText);
                if (m) {
                    let val = m[1];
                    if (val.startsWith('"') || val.startsWith("'")) return val.slice(1, -1);
                    if (val.startsWith('[')) return JSON.parse(val.replace(/'/g, '"'));
                    if (val === 'true') return true;
                    if (val === 'false') return false;
                    return parseFloat(val);
                }
                return null;
            };

            const p = {
                slug: match[1],
                name: getField('name'),
                nameBg: getField('nameBg'),
                avatar: getField('avatar'),
                coverImage: getField('coverImage'),
                categories: getField('categories'),
                description: getField('description'),
                price_eur: getField('price_eur'),
                cardImages: getField('cardImages')
            };
            products.push(p);
        } catch (e) {}
    }

    console.log(`Found ${products.length} products`);

    const BATCH_SIZE = 100;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        let sql = "";
        batch.forEach(p => {
            sql += `UPDATE products SET 
                name = '${p.name.replace(/'/g, "''")}',
                name_bg = '${(p.nameBg || p.name).replace(/'/g, "''")}',
                avatar = '${p.avatar}',
                cover_image = '${(p.coverImage || p.avatar)}',
                categories = '${JSON.stringify(p.categories)}',
                description = '${(p.description || '').replace(/'/g, "''")}',
                price_eur = ${p.price_eur || 'NULL'},
                card_images = '${JSON.stringify(p.cardImages || [])}',
                updated_at = NOW()
                WHERE slug = '${p.slug}';\n`;
        });
        fs.writeFileSync(`e:/Antigravity/CarDecal3/scripts/batch_${Math.floor(i/BATCH_SIZE) + 1}.sql`, sql, 'utf8');
    }
}

generateSqlBatches();
