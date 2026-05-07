import { createClient } from '@/lib/supabase/server';
import { canAccessCampaign } from '@/lib/org';

const ALLOWED_SORT = new Set(['created_at', 'rating', 'customer_name']);

type Testimonial = {
  id: string;
  campaign_id: string;
  customer_name: string;
  customer_title: string | null;
  content_type: 'video' | 'text';
  text_content: string | null;
  video_url: string | null;
  rating: number;
  approved: boolean;
  created_at: string;
};

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);

    const campaignId = url.searchParams.get('campaignId');
    if (!campaignId) {
      return Response.json({ error: 'campaignId required' }, { status: 400 });
    }

    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));

    const filter = url.searchParams.get('filter') || 'all';
    const sortParam = url.searchParams.get('sort') || 'created_at';
    const sort = ALLOWED_SORT.has(sortParam) ? sortParam : 'created_at';
    const ascending = url.searchParams.get('dir') === 'asc';

    const rawSearch = url.searchParams.get('search')?.trim() || '';
    const search = rawSearch.replace(/[,.()"\\]/g, '');

    const access = await canAccessCampaign(user.id, campaignId);
    if (!access.ok) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applyFilters = (query: any) => {
      query = query.eq('campaign_id', campaignId);

      if (filter === 'approved') query = query.eq('approved', true);
      if (filter === 'pending') query = query.eq('approved', false);
      if (filter === 'video') query = query.eq('content_type', 'video');
      if (filter === 'text') query = query.eq('content_type', 'text');

      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,text_content.ilike.%${search}%,customer_title.ilike.%${search}%`);
      }

      return query;
    };

    const countPromise = applyFilters(supabase.from('testimonials').select('*', { count: 'exact', head: true }));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const dataPromise = applyFilters(
      supabase
        .from('testimonials')
        .select('*')
        .order(sort as keyof Testimonial, { ascending })
        .range(from, to),
    );

    const [{ count }, { data, error }] = await Promise.all([countPromise, dataPromise]);

    if (error) {
      console.error('DB_FETCH_ERROR:', error);
      return Response.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
    }

    const rows = (data || []) as Testimonial[];

    return Response.json({
      data: rows,
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('UNCAUGHT_ERROR:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
