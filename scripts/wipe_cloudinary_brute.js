import crypto from 'crypto';

const CLOUD_NAME = "die68h4oh";
const API_KEY = "136596978215658";
const API_SECRET = "evNs20lxlERC54QmlDMGETOmySs";

async function run() {
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  console.log("Brute force deleting ALL images in Cloudinary...");
  let next_cursor = null;
  let total = 0;
  
  do {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?max_results=500` + (next_cursor ? `&next_cursor=${next_cursor}` : '');
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    const data = await res.json();
    
    if (!data.resources || data.resources.length === 0) break;
    
    const ids = data.resources.map(r => r.public_id);
    console.log(`Deleting ${ids.length} resources...`);
    
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`, {
      method: 'DELETE',
      headers: { 
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ public_ids: ids })
    });
    total += ids.length;
    next_cursor = data.next_cursor;
  } while (next_cursor);
  
  console.log(`Total images deleted from Cloudinary: ${total}`);
}

run();
