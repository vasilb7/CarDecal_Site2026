import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXCHANGE_RATE = 1.95583;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order, items, shippingDetails } = await req.json()

    if (!shippingDetails?.email || !items || !order) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!BREVO_API_KEY) {
        throw new Error("Missing BREVO_API_KEY environment credential");
    }

    const itemsHtml = items.map((item: any) => `
      <tr style="border-bottom: 1px solid #333333;">
        <td style="padding: 12px 0;">
          <div style="font-weight: bold; color: #ffffff;">${item.name_bg || item.name}</div>
          <div style="font-size: 12px; color: #888888;">${item.variant || ''}</div>
        </td>
        <td style="padding: 12px 0; text-align: center; color: #cccccc;">x${item.quantity}</td>
        <td style="padding: 12px 0; text-align: right; color: #ffffff;">
          ${(item.price / EXCHANGE_RATE).toFixed(2)} &euro; / ${item.price.toFixed(2)} лв.
        </td>
      </tr>
    `).join('')

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="bg">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #111111; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #1a1a1a; border: 1px solid #333333; border-radius: 12px; overflow: hidden; }
        .header { background-color: #000000; padding: 30px 20px; text-align: center; border-bottom: 2px solid #dc2626; }
        .content { padding: 40px 30px; }
        .footer { background-color: #0a0a0a; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #333333; }
        .btn { display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; text-transform: uppercase; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; color:#dc2626; letter-spacing:2px;">CARDECAL</h1>
        </div>
        <div class="content">
          <h2 style="color:#ffffff;">Благодарим ви за поръчката!</h2>
          <p style="color:#cccccc; line-height:1.6;">Здравейте, ${shippingDetails.fullName}, вашата поръчка беше приета успешно и в момента се обработва.</p>
          
          <div style="margin: 30px 0; padding: 20px; background: #222222; border-radius: 8px; border: 1px solid #444444;">
            <h3 style="margin-top:0; color:#dc2626; font-size:14px; text-transform:uppercase;">Поръчка #${order.id.slice(0,8)}</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
            </table>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #333333; text-align: right;">
              <span style="color:#888888; font-size: 14px;">Обща сума:</span>
              <div style="color:#dc2626; font-size: 20px; font-weight: bold;">
                ${(order.total_amount / EXCHANGE_RATE).toFixed(2)} &euro; / ${order.total_amount.toFixed(2)} лв.
              </div>
            </div>
          </div>

          <div style="color:#888888; font-size: 13px;">
            <strong>Доставка до:</strong><br>
            ${shippingDetails.city}, ${shippingDetails.officeName || shippingDetails.streetAddress}<br>
            Телефон: ${shippingDetails.phone}
          </div>

          <div style="text-align: center;">
            <a href="https://cardecal.bg" class="btn">Към магазина</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CarDecal. Всички права запазени.
        </div>
      </div>
    </body>
    </html>
    `;

    // Send via Brevo SMTP API
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
           sender: { name: 'CarDecal', email: 'cardecal@abv.bg' },
           to: [{ email: shippingDetails.email, name: shippingDetails.fullName }],
           subject: `Потвърждение на поръчка | CarDecal`,
           htmlContent: htmlContent,
        }),
    });
    
    if (!res.ok) {
        const data = await res.json();
        console.error("Brevo API issue:", data);
        throw new Error(data.message || 'Error communicating with Brevo');
    }

    return new Response(JSON.stringify({ success: true }), {
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
