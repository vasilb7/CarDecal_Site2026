
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const botEmail = process.env.SUPABASE_BOT_EMAIL;
const botPassword = process.env.SUPABASE_BOT_PASSWORD;

if (!supabaseUrl || !supabaseAnonKey || !botEmail || !botPassword) {
  console.error('Missing environment variables. Requires: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_BOT_EMAIL, SUPABASE_BOT_PASSWORD');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
  console.log('--- Supabase Keep-Alive Heartbeat ---');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Perform a simple query to a public or active table to ensure DB activity
    // Reading data is enough to keep the project active and avoids Turnstile/Captcha issues with Auth
    const { data, error } = await supabase
      .from('products') 
      .select('id')
      .limit(1);

    if (error) {
      // If 'products' fails (e.g. RLS or table renamed), try another one or just log the error
      console.warn('⚠️ Query to products failed:', error.message);
      
      // Fallback to a common system query if needed
      const { error: healthError } = await supabase.from('profiles').select('id').limit(1);
      if (healthError) throw healthError;
    } 

    console.log('✅ DB Activity recorded successfully.');
    console.log('--- Heartbeat Complete ---');

  } catch (err) {
    console.error('❌ Error during keep-alive:', err.message);
    process.exit(1);
  }
}

keepAlive();
