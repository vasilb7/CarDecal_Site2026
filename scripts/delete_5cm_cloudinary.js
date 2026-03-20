import crypto from 'crypto';

const CLOUD_NAME = "die68h4oh";
const API_KEY = "136596978215658";
const API_SECRET = "evNs20lxlERC54QmlDMGETOmySs";

// The data from the SQL query (first few items, I'll add the rest or just use a pattern)
const urlsToDelete = [
  "Site_Pics/Decals/5cm/5cm-75",
  "Site_Pics/Decals/5cm/5cm-06",
  "Site_Pics/Decals/5cm/5cm-05",
  "Site_Pics/Decals/5cm/5cm-82",
  "Site_Pics/Decals/5cm/5cm-28",
  "Site_Pics/Decals/5cm/5cm-70",
  "Site_Pics/Decals/5cm/5cm-86",
  "Site_Pics/Decals/5cm/5cm-22",
  "Site_Pics/Decals/5cm/5cm-58",
  "Site_Pics/Decals/5cm/5cm-78",
  "Site_Pics/Decals/5cm/5cm-80",
  "Site_Pics/Decals/5cm/5cm-15",
  "Site_Pics/Decals/5cm/5cm-19",
  "Site_Pics/Decals/5cm/5cm-54",
  "Site_Pics/Decals/5cm/5cm-59",
  "Site_Pics/Decals/5cm/5x33cm-09",
  "Site_Pics/Decals/5cm/5cm-72",
  "Site_Pics/Decals/5cm/5cm-90",
  "Site_Pics/Decals/5cm/5cm-83",
  "Site_Pics/Decals/5cm/5x33cm-68",
  "Site_Pics/Decals/5cm/5cm-69",
  "Site_Pics/Decals/5cm/5cm-47",
  "Site_Pics/Decals/5cm/5cm-73",
  "Site_Pics/Decals/5cm/5cm-88",
  "Site_Pics/Decals/5cm/5cm-87",
  "Site_Pics/Decals/5cm/5cm-92",
  "Site_Pics/Decals/5cm/5cm-71",
  "Site_Pics/Decals/5cm/5cm-16",
  "Site_Pics/Decals/5cm/5cm-77",
  "Site_Pics/Decals/5cm/5cm-85",
  "Site_Pics/Decals/5cm/5cm-36",
  "Site_Pics/Decals/5cm/5cm-52",
  "Site_Pics/Decals/5cm/5cm-61",
  "Site_Pics/Decals/5cm/5cm-65",
  "Site_Pics/Decals/5cm/5cm-62",
  "Site_Pics/Decals/5cm/5x33cm-48",
  "Site_Pics/Decals/5cm/5x33cm-56",
  "Site_Pics/Decals/5cm/5cm-30",
  "Site_Pics/Decals/5cm/5cm-37",
  "Site_Pics/Decals/5cm/5cm-91",
  "Site_Pics/Decals/5cm/5cm-13",
  "Site_Pics/Decals/5cm/5cm-11",
  "Site_Pics/Decals/5cm/5cm-07",
  "Site_Pics/Decals/5cm/5cm-03",
  "Site_Pics/Decals/5cm/5cm-32",
  "Site_Pics/Decals/5cm/5cm-31",
  "Site_Pics/Decals/5cm/5cm-26",
  "Site_Pics/Decals/5cm/5cm-29",
  "Site_Pics/Decals/5cm/5cm-27",
  "Site_Pics/Decals/5cm/5cm-24",
  "Site_Pics/Decals/5cm/5cm-23",
  "Site_Pics/Decals/5cm/5cm-20",
  "Site_Pics/Decals/5cm/5cm-21",
  "Site_Pics/Decals/5cm/5cm-35",
  "Site_Pics/Decals/5cm/5cm-44",
  "Site_Pics/Decals/5cm/5cm-41",
  "Site_Pics/Decals/5cm/5cm-33",
  "Site_Pics/Decals/5cm/5cm-39",
  "Site_Pics/Decals/5cm/5cm-45",
  "Site_Pics/Decals/5cm/5cm-40",
  "Site_Pics/Decals/5cm/5cm-51",
  "Site_Pics/Decals/5cm/5cm-43",
  "Site_Pics/Decals/5cm/5cm-34",
  "Site_Pics/Decals/5cm/5cm-50",
  "Site_Pics/Decals/5cm/5cm-57",
  "Site_Pics/Decals/5cm/5cm-60",
  "Site_Pics/Decals/5cm/5cm-63",
  "Site_Pics/Decals/5cm/5cm-64",
  "Site_Pics/Decals/5cm/5cm-67",
  "Site_Pics/Decals/5cm/5cm-76",
  "Site_Pics/Decals/5cm/5cm-79",
  "Site_Pics/Decals/5cm/5cm-17",
  "Site_Pics/Decals/5cm/5cm-84",
  "Site_Pics/Decals/5cm/5cm-74",
  "Site_Pics/Decals/5cm/5cm-93",
  "Site_Pics/Decals/5cm/5cm-89",
  "Site_Pics/Decals/5cm/5cm-94",
  "Site_Pics/Decals/5cm/5x33cm-14",
  "Site_Pics/Decals/5cm/5x33-04",
  "Site_Pics/Decals/5cm/5x33cm-42",
  "Site_Pics/Decals/5cm/5x33cm-66",
  "Site_Pics/Decals/5cm/5cm-49",
  "Site_Pics/Decals/5cm/5cm-18",
  "Site_Pics/Decals/5cm/5cm-46",
  "Site_Pics/Decals/5cm/5cm-38",
  "Site_Pics/Decals/5cm/5cm-25",
  "Site_Pics/Decals/5cm/5cm-53",
  "Site_Pics/Decals/5cm/5cm-81",
  "Site_Pics/Decals/5cm/5cm-12",
  "Site_Pics/Decals/5cm/5x33cm-10",
  "Site_Pics/Decals/5cm/5cm-55"
];

async function deleteImage(publicId) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signatureString = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new URLSearchParams();
  formData.append('public_id', publicId);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log(`Deleted ${publicId}: ${data.result}`);
  } catch (e) {
    console.error(`Error deleting ${publicId}:`, e.message);
  }
}

async function run() {
  console.log(`Deleting ${urlsToDelete.length} images...`);
  for (const pid of urlsToDelete) {
    await deleteImage(pid);
    await new Promise(r => setTimeout(r, 100));
  }
  console.log("Cleanup finished.");
}

run();
