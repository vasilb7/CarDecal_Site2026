import crypto from 'crypto';

const CLOUD_NAME = "die68h4oh";
const API_KEY = "136596978215658";
const API_SECRET = "evNs20lxlERC54QmlDMGETOmySs";

// List all resources in Site_Pics and delete them in batches
async function run() {
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  
  console.log("Fetching all resources in 'Site_Pics'...");
  
  // Cloudinary Admin API: GET /v1_1/<cloud_name>/resources/image?prefix=Site_Pics/
  // Requires Basic Auth.
  
  let next_cursor = null;
  let totalDeleted = 0;
  
  do {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?prefix=Site_Pics/&max_results=500` + (next_cursor ? `&next_cursor=${next_cursor}` : '');
    
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    const data = await res.json();
    if (!data.resources || data.resources.length === 0) break;
    
    const publicIds = data.resources.map(r => r.public_id);
    console.log(`Deleting ${publicIds.length} resources...`);
    
    // DELETE /v1_1/<cloud_name>/resources/image
    const delRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`, {
      method: 'DELETE',
      headers: { 
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ public_ids: publicIds })
    });
    
    const delData = await delRes.json();
    totalDeleted += publicIds.length;
    console.log(`Deleted result: ${JSON.stringify(delData.deleted)}`);
    
    next_cursor = data.next_cursor;
    
  } while (next_cursor);
  
  console.log(`Total images deleted from Cloudinary: ${totalDeleted}`);
}

run();
