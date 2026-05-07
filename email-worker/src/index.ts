import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

interface Env {
  EMAIL_WORKER_SECRET: string;
  SEB: SendEmail;
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
      body = (await req.json()) as EmailBody;
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const { to, from = 'noreply@kudoso.io', subject, html } = body;

    if (!to || !subject || !html) {
      return new Response('Missing required fields: to, subject, html', { status: 400 });
    }

    try {
      // Parse "Display Name <email>" or bare "email"
      const addrMatch = from.match(/<([^>]+)>/);
      const emailAddr = addrMatch ? addrMatch[1] : from;
      const displayName = addrMatch ? from.split('<')[0].trim().replace(/^"|"$/g, '') || 'Kudoso' : 'Kudoso';

      const msg = createMimeMessage();
      msg.setSender({ name: displayName, addr: emailAddr });
      msg.setRecipient(to);
      msg.setSubject(subject);
      msg.addMessage({ contentType: 'text/html', data: html });

      const message = new EmailMessage(from, to, msg.asRaw());
      await env.SEB.send(message);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error('Email send error:', err);
      return new Response(`Email send failed: ${err}`, { status: 502 });
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  },
};
