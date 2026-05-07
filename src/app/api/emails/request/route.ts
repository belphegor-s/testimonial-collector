import { sendEmail } from '@/lib/cloudflare-email';
import { createClient } from '@/lib/supabase/server';
import { FROM_EMAIL } from '@/lib/email';
import { escapeHtml } from '@/lib/utils';
import { canAccessCampaign } from '@/lib/org';

export async function POST(req: Request) {
  const { campaignId, customerEmail, customerName } = await req.json();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await canAccessCampaign(user.id, campaignId);
  if (!access.ok) return Response.json({ error: 'Campaign not found' }, { status: 404 });

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

  const collectionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/collect/${campaignId}`;

  await sendEmail({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `${user.email} would love your feedback`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <div style="width:40px;height:40px;border-radius:10px;background:${campaign.brand_color}22;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
          <div style="width:16px;height:16px;border-radius:50%;background:${campaign.brand_color};"></div>
        </div>
        <h1 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 8px;">Hi${customerName ? ` ${escapeHtml(customerName)}` : ''},</h1>
        <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 24px;">We'd love to hear about your experience. It only takes a minute and helps us a lot.</p>
        <a href="${collectionUrl}" style="display:inline-block;background:${campaign.brand_color};color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Share your experience
        </a>
        <p style="font-size:12px;color:#a1a1aa;margin-top:32px;">You received this because someone who values your opinion reached out.</p>
      </div>
    `,
  });

  return Response.json({ success: true });
}
