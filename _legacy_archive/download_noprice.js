import fs from 'fs';
import path from 'path';

(async () => {
    console.log('Reading parsed_decals.json...');
    const decals = JSON.parse(fs.readFileSync('parsed_decals.json', 'utf8'));

    const noPriceItems = decals.filter(d => !d.hasPrice);
    console.log(`Found ${noPriceItems.length} items without price.`);

    const dir = 'e:/Antigravity/CarDecal3/public/Site_Pics/Decals/Noprice/15cm';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const unretrievable = [];

    for (const item of noPriceItems) {
        // Name to lowercase, e.g., 15cm-07
        const name = item.name.toLowerCase();

        if (!item.imgUrl) {
            console.log(`No image URL found for ${name}`);
            unretrievable.push(name);
            continue;
        }

        const filename = `${name}.jpg`;
        const filepath = path.join(dir, filename);
        
        try {
            const response = await fetch(item.imgUrl);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                // Basic validation
                if (buffer.length > 2000) {
                    fs.writeFileSync(filepath, buffer);
                    console.log(`Downloaded ${filename}`);
                } else {
                    console.warn(`Downloaded file for ${name} is too small. Considering it failed.`);
                    unretrievable.push(name);
                }
            } else {
                console.error(`Failed to download ${name}, status: ${response.status}`);
                unretrievable.push(name);
            }
        } catch (e) {
            console.error(`Error downloading ${name}:`, e.message);
            unretrievable.push(name);
        }
    }

    // Write missing ones to namenoprice.txt
    if (unretrievable.length > 0) {
        fs.writeFileSync(path.join(dir, 'namenoprice.txt'), unretrievable.join('\n'));
        console.log(`Wrote ${unretrievable.length} models without images to namenoprice.txt`);
    } else {
        // Delete if exists and it's empty
        const missedP = path.join(dir, 'namenoprice.txt');
        if (fs.existsSync(missedP)) fs.unlinkSync(missedP);
    }

    console.log('Script entirely finished.');
})();
