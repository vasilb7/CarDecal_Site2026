
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
    // 1. Log in the bot
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: botEmail,
      password: botPassword,
    });

    if (loginError) throw loginError;
    console.log('✅ Successfully logged in as bot:', data.user?.email);

    // 2. Perform a simple query to ensure DB activity
    // We'll just try to count products or something public
    const { count, error: queryError } = await supabase
      .from('products') // Assuming 'products' exists based on the codebase
      .select('*', { count: 'exact', head: true });

    if (queryError) {
      console.warn('⚠️ Query error (might be RLS), but login was successful:', queryError.message);
    } else {
      console.log('✅ DB Activity recorded. Product count:', count);
    }

    // 3. Log out (optional but clean)
    await supabase.auth.signOut();
    console.log('👋 Successfully logged out.');
    console.log('--- Heartbeat Complete ---');

  } catch (err) {
    console.error('❌ Error during keep-alive:', err.message);
    process.exit(1);
  }
}

keepAlive();
