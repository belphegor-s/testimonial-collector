import { sendEmail } from '@/lib/cloudflare-email';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { escapeHtml } from '@/lib/utils';
import { FROM_EMAIL } from '@/lib/email';
import { canAccessCampaign } from '@/lib/org';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { testimonialId } = await req.json();

  const [row] = await db
    .select({
      id: schema.testimonials.id,
      campaignId: schema.testimonials.campaignId,
      customerName: schema.testimonials.customerName,
      customerTitle: schema.testimonials.customerTitle,
      textContent: schema.testimonials.textContent,
      campaignName: schema.campaigns.name,
    })
    .from(schema.testimonials)
    .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.testimonials.campaignId))
    .where(eq(schema.testimonials.id, testimonialId));

  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

  const access = await canAccessCampaign(session.user.id!, row.campaignId);
  if (!access.ok) return Response.json({ error: 'Not found' }, { status: 404 });

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/campaigns/${row.campaignId}`;

  await sendEmail({
    from: FROM_EMAIL,
    to: session.user.email ?? '',
    subject: `New testimonial from ${escapeHtml(row.customerName)}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h1 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 4px;">New testimonial received</h1>
        <p style="font-size:13px;color:#a1a1aa;margin:0 0 24px;">Campaign: ${escapeHtml(row.campaignName)}</p>
        <div style="background:#f4f4f5;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="font-size:14px;font-weight:600;color:#18181b;margin:0 0 4px;">${escapeHtml(row.customerName)}${row.customerTitle ? ` · ${escapeHtml(row.customerTitle)}` : ''}</p>
          <p style="font-size:14px;color:#52525b;line-height:1.6;margin:8px 0 0;">${escapeHtml(row.textContent || '[Video testimonial]')}</p>
        </div>
        <a href="${dashboardUrl}" style="display:inline-block;background:#18181b;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Review in dashboard
        </a>
      </div>
    `,
  });

  return Response.json({ success: true });
}
