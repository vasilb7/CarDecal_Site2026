import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const MY_SUPABASE_URL = Deno.env.get('MY_SUPABASE_URL')
const MY_SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('MY_SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subject, html } = await req.json()

    if (!subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields: subject, html' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!RESEND_API_KEY || !MY_SUPABASE_URL || !MY_SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Missing environment credentials");
    }

    // Initialize Supabase admin client to bypass RLS and get all profiles
    const supabase = createClient(MY_SUPABASE_URL, MY_SUPABASE_SERVICE_ROLE_KEY)
    
    // Fetch all profiles with emails
    const { data: profiles, error: dbError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .not('email', 'is', null)

    if (dbError) throw dbError;

    const emails = profiles.map(p => p.email).filter(Boolean);
    if (emails.length === 0) {
        return new Response(JSON.stringify({ message: "No active users found." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const BATCH_SIZE = 50;
    const allResponses = [];

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        
        const res = await fetch('https://api.resend.com/emails/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify(
                batch.map(email => ({
                    from: 'CarDecal <onboarding@resend.dev>', // Change to your verified domain later e.g. 'CarDecal <noreply@cardecal.bg>'
                    to: email,
                    subject,
                    html,
                }))
            ),
        });

        const data = await res.json();
        allResponses.push(data);
    }

    return new Response(JSON.stringify({ success: true, responses: allResponses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
    })
  }
})
