const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:postgres@127.0.0.1:54322/postgres'); // If local, it's port 54322
  console.log("URL:", process.env.VITE_SUPABASE_URL); // Let's check if it's external or local
}
main();
