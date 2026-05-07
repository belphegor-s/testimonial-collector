type EmailPayload = {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const workerUrl = process.env.CLOUDFLARE_EMAIL_WORKER_URL;
  const secret = process.env.CLOUDFLARE_EMAIL_WORKER_SECRET;

  if (!workerUrl || !secret) {
    throw new Error('CF email worker not configured (CLOUDFLARE_EMAIL_WORKER_URL / CLOUDFLARE_EMAIL_WORKER_SECRET missing)');
  }

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  await Promise.all(
    recipients.map(async (to) => {
      const res = await fetch(`${workerUrl.replace(/\/$/, '')}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          to,
          from: payload.from,
          subject: payload.subject,
          html: payload.html,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Email send failed for ${to}: ${res.status} ${text}`);
      }
    }),
  );
}
