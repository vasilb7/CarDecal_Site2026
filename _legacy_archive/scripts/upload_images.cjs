
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://mkgtkxigomsihrfyhdrb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZ3RreGlnb21zaWhyZnloZHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjg4NDksImV4cCI6MjA4NTc0NDg0OX0.44etEz9FxC4USg-P5UN0LbSAA4U6NW0Dv2Awv3l1PBI'; // Anon key
const BUCKET_NAME = 'images';
const ROOT_DIR = path.resolve(__dirname, '../public/Site_Pics'); // Adjust if needed

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadFile(filePath) {
    const fileContent = fs.readFileSync(filePath);
    // Calculate relative path for bucket: e.g., Site_Pics/Contact_Page/image.png
    // We want the path in bucket to start with Site_Pics/...
    const relativePath = path.relative(path.resolve(__dirname, '../public'), filePath);
    // Replace windows backslashes with forward slashes
    const supabasePath = relativePath.split(path.sep).join('/');

    console.log(`Uploading: ${supabasePath}`);

    const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(supabasePath, fileContent, {
            upsert: true,
            contentType: getContentType(filePath)
        });

    if (error) {
        console.error(`Error uploading ${supabasePath}:`, error.message);
    } else {
        console.log(`Success: ${supabasePath}`);
    }
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.svg') return 'image/svg+xml';
    if (ext === '.gif') return 'image/gif';
    if (ext === '.webp') return 'image/webp';
    return 'application/octet-stream';
}

async function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            await walkDir(filePath);
        } else {
            await uploadFile(filePath);
        }
    }
}

async function main() {
    console.log("Starting upload...");
    if (!fs.existsSync(ROOT_DIR)) {
        console.error(`Directory not found: ${ROOT_DIR}`);
        return;
    }
    await walkDir(ROOT_DIR);
    console.log("Upload complete.");
}

main();
