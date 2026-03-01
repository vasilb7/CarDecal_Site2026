import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 

// Note: ANON_KEY might not have rights to run ALTER TABLE without bypass RLS or executing via proxy if no postgrest endpoint exists.
// BUT we can use pg or ask user to do it. Wait, I can try doing insert silently in BookingPage.
