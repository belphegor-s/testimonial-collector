import { sendEmail } from '@/lib/cloudflare-email';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { escapeHtml } from '@/lib/utils';
import { FROM_EMAIL } from '@/lib/email';
import { canAccessCampaign } from '@/lib/org';

export async function POST(req: Request) {
  // Auth check
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { testimonialId } = await req.json();

  const supabase = createAdminClient();

  const { data: testimonial } = await supabase.from('testimonials').select('*, campaigns(name, organization_id)').eq('id', testimonialId).single();

  if (!testimonial) return Response.json({ error: 'Not found' }, { status: 404 });

  const access = await canAccessCampaign(user.id, testimonial.campaign_id);
  if (!access.ok) return Response.json({ error: 'Not found' }, { status: 404 });

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/campaigns/${testimonial.campaign_id}`;

  await sendEmail({
    from: FROM_EMAIL,
    to: user.email ?? '',
    subject: `New testimonial from ${escapeHtml(testimonial.customer_name)}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 4px;">New testimonial received</h1>
        <p style="font-size:13px;color:#a1a1aa;margin:0 0 24px;">Campaign: ${escapeHtml(testimonial.campaigns.name)}</p>
        <div style="background:#f4f4f5;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="font-size:14px;font-weight:600;color:#18181b;margin:0 0 4px;">${escapeHtml(testimonial.customer_name)}${testimonial.customer_title ? ` · ${escapeHtml(testimonial.customer_title)}` : ''}</p>
          <p style="font-size:14px;color:#52525b;line-height:1.6;margin:8px 0 0;">${escapeHtml(testimonial.text_content || '[Video testimonial]')}</p>
        </div>
        <a href="${dashboardUrl}" style="display:inline-block;background:#18181b;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Review in dashboard
        </a>
      </div>
    `,
  });

  return Response.json({ success: true });
}
