import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(_: Request, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;

  const [campaign] = await db
    .select({
      name: schema.campaigns.name,
      brand_color: schema.campaigns.brandColor,
      logo_url: schema.campaigns.logoUrl,
    })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, campaignId));

  const rows = await db
    .select({
      id: schema.testimonials.id,
      customer_name: schema.testimonials.customerName,
      customer_title: schema.testimonials.customerTitle,
      text_content: schema.testimonials.textContent,
      ai_summary: schema.testimonials.aiSummary,
      rating: schema.testimonials.rating,
      video_url: schema.testimonials.videoUrl,
      content_type: schema.testimonials.contentType,
      created_at: schema.testimonials.createdAt,
    })
    .from(schema.testimonials)
    .where(eq(schema.testimonials.campaignId, campaignId))
    .orderBy(desc(schema.testimonials.createdAt))
    .limit(50);

  const testimonials = rows.map((t) => ({ ...t, created_at: t.created_at.toISOString() }));

  return Response.json(
    { campaign: campaign ?? null, testimonials },
    { headers: corsHeaders },
  );
}
