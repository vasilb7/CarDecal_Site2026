import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TURNSTILE_SECRET_KEY = Deno.env.get("TURNSTILE_SECRET_KEY") || "1x0000000000000000000000000000000AA";

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "No Turnstile token provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify token with Cloudflare
    const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const formData = new FormData();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    
    const remoteIp = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for");
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const result = await fetch(verifyUrl, {
      method: "POST",
      body: formData,
    });

    const outcome = await result.json();

    if (outcome.success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.error("Turnstile verification failed:", outcome["error-codes"]);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Verification failed", 
          codes: outcome["error-codes"] 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
