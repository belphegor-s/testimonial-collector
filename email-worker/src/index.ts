interface Env {
  EMAIL_WORKER_SECRET: string;
  DKIM_PRIVATE_KEY: string;
}

interface EmailBody {
  to: string;
  from?: string;
  subject: string;
  html: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);

    if (url.pathname !== '/send' || req.method !== 'POST') {
      return new Response('Not Found', { status: 404 });
    }

    const auth = req.headers.get('Authorization');
    if (auth !== `Bearer ${env.EMAIL_WORKER_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    let body: EmailBody;
    try {
      body = await req.json() as EmailBody;
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const { to, from = 'noreply@kudoso.io', subject, html } = body;

    if (!to || !subject || !html) {
      return new Response('Missing required fields: to, subject, html', { status: 400 });
    }

    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            dkim_domain: 'kudoso.io',
            dkim_selector: 'mailchannels',
            dkim_private_key: env.DKIM_PRIVATE_KEY,
          },
        ],
        from: { email: from, name: 'Kudoso' },
        subject,
        content: [{ type: 'text/html; charset=utf-8', value: html }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('MailChannels error:', res.status, text);
      return new Response(`Email send failed: ${text}`, { status: 502 });
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  },
};
