import { auth } from '@/auth';
import { eq, and, or, ilike, desc, asc, count, SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { canAccessCampaign } from '@/lib/org';

const ALLOWED_SORT = new Set(['created_at', 'rating', 'customer_name']);

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaignId');
    if (!campaignId) return Response.json({ error: 'campaignId required' }, { status: 400 });

    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
    const filter = url.searchParams.get('filter') || 'all';
    const sortParam = url.searchParams.get('sort') || 'created_at';
    const sort = ALLOWED_SORT.has(sortParam) ? sortParam : 'created_at';
    const ascending = url.searchParams.get('dir') === 'asc';
    const rawSearch = url.searchParams.get('search')?.trim() || '';
    const search = rawSearch.replace(/[,.()"\\]/g, '');

    const access = await canAccessCampaign(session.user.id!, campaignId);
    if (!access.ok) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const conditions: SQL[] = [eq(schema.testimonials.campaignId, campaignId)];
    if (filter === 'approved') conditions.push(eq(schema.testimonials.approved, true));
    if (filter === 'pending') conditions.push(eq(schema.testimonials.approved, false));
    if (filter === 'video') conditions.push(eq(schema.testimonials.contentType, 'video'));
    if (filter === 'text') conditions.push(eq(schema.testimonials.contentType, 'text'));
    if (search) {
      conditions.push(or(
        ilike(schema.testimonials.customerName, `%${search}%`),
        ilike(schema.testimonials.textContent, `%${search}%`),
        ilike(schema.testimonials.customerTitle, `%${search}%`),
      ) as SQL);
    }

    const where = and(...conditions);

    const orderCol = sort === 'rating' ? schema.testimonials.rating
      : sort === 'customer_name' ? schema.testimonials.customerName
      : schema.testimonials.createdAt;
    const orderBy = ascending ? asc(orderCol) : desc(orderCol);

    const from = (page - 1) * pageSize;

    const [totalResult, rows] = await Promise.all([
      db.select({ value: count() }).from(schema.testimonials).where(where),
      db.select().from(schema.testimonials).where(where).orderBy(orderBy).limit(pageSize).offset(from),
    ]);

    const normalized = rows.map((t) => ({
      id: t.id,
      campaign_id: t.campaignId,
      customer_name: t.customerName,
      customer_title: t.customerTitle,
      content_type: t.contentType,
      text_content: t.textContent,
      video_url: t.videoUrl,
      rating: t.rating,
      approved: t.approved,
      ai_summary: t.aiSummary,
      created_at: t.createdAt.toISOString(),
    }));

    return Response.json({ data: normalized, total: totalResult[0]?.value ?? 0, page, pageSize });
  } catch (err) {
    console.error('UNCAUGHT_ERROR:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
