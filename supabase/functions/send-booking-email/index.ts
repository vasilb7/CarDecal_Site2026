import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { email, firstName, lastName, phone, width, height, quantity, description } = body

    if (!email || !firstName) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, firstName' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!RESEND_API_KEY) {
        throw new Error("Missing RESEND_API_KEY environment credential");
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="bg">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Потвърждение за Запитване - CarDecal</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #111111;
          color: #ffffff;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #1a1a1a;
          border: 1px solid #333333;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
          background-color: #000000;
          padding: 30px 20px;
          text-align: center;
          border-bottom: 2px solid #cebc89;
        }
        .header h1 {
          margin: 0;
          color: #cebc89;
          font-size: 24px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #ffffff;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #cccccc;
          margin-bottom: 30px;
        }
        .details-card {
          background: linear-gradient(145deg, #222222, #181818);
          border: 1px solid #444444;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .details-card h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #cebc89;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .detail-row {
          display: flex;
          margin-bottom: 10px;
          font-size: 15px;
        }
        .detail-label {
          color: #888888;
          width: 120px;
          font-weight: 500;
        }
        .detail-value {
          color: #ffffff;
          flex: 1;
        }
        .description-box {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px dashed #444444;
        }
        .footer {
          background-color: #0a0a0a;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #666666;
          border-top: 1px solid #333333;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(to bottom, #cebc89, #a8945f);
          color: #000000;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 6px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CARDECAL</h1>
        </div>
        <div class="content">
          <div class="greeting">Здравейте, ${firstName}!</div>
          <div class="message">
            Получихме вашето запитване за индивидуален проект. Нашият екип от дизайнери ще се запознае с детайлите и ще се свърже с вас във възможната най-кратка срочност.
          </div>
          
          <div class="details-card">
            <h3>Детайли на запитването</h3>
            
            <div class="detail-row">
              <div class="detail-label">Име:</div>
              <div class="detail-value">${firstName} ${lastName || ''}</div>
            </div>
            
            <div class="detail-row">
              <div class="detail-label">Телефон:</div>
              <div class="detail-value">${phone || 'Не е посочен'}</div>
            </div>
            
            ${(width || height) ? `
            <div class="detail-row">
              <div class="detail-label">Размери:</div>
              <div class="detail-value">${width ? width + 'см' : '-'} x ${height ? height + 'см' : '-'}</div>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <div class="detail-label">Бройки:</div>
              <div class="detail-value">${quantity || 'Не е посочен'}</div>
            </div>
            
            ${description ? `
            <div class="detail-row description-box">
              <div class="detail-label">Описание:</div>
              <div class="detail-value" style="font-style: italic;">"${description}"</div>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="https://cardecal.bg" class="btn">Към магазина</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CarDecal. Всички права запазени.<br>
          Това е автоматично генерирано съобщение, моля не отговаряйте на него.
        </div>
      </div>
    </body>
    </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
           from: 'CarDecal <onboarding@resend.dev>', // Update this when domain is verified -> 'CarDecal <noreply@cardecal.bg>'
           to: email,
           subject: 'Успешно запитване за индивидуален проект | CarDecal',
           html: htmlContent,
        }),
    });
    
    const data = await res.json();

    if (!res.ok) {
        console.error("Resend API issue:", data);
        throw new Error(data.message || 'Error communicating with Resend');
    }

    return new Response(JSON.stringify({ success: true, data }), {
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
