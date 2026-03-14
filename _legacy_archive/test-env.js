import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log("Current Directory:", __dirname);
console.log("Environment Variables Loading Test:");
console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL ? "OK" : "MISSING");
console.log("VITE_CLOUDINARY_CLOUD_NAME:", process.env.VITE_CLOUDINARY_CLOUD_NAME ? "OK" : "MISSING");
console.log("VITE_CLOUDINARY_API_KEY:", process.env.VITE_CLOUDINARY_API_KEY ? "OK" : "MISSING");
console.log("VITE_CLOUDINARY_API_SECRET:", process.env.VITE_CLOUDINARY_API_SECRET ? "OK" : "MISSING");
