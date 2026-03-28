import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const campaignId = url.searchParams.get('campaignId');
  if (!campaignId) return Response.json({ error: 'campaignId required' }, { status: 400 });

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));
  const filter = url.searchParams.get('filter') || 'all';
  const sort = url.searchParams.get('sort') || 'created_at';
  const dir = url.searchParams.get('dir') === 'asc' ? true : false; // ascending?
  // Sanitize search: strip characters that have special meaning in PostgREST filter syntax
  const rawSearch = url.searchParams.get('search')?.trim() || '';
  const search = rawSearch.replace(/[,.()"\\]/g, '');

  // Build base query conditions
  function applyFilters(query: any) {
    query = query.eq('campaign_id', campaignId);
    if (filter === 'approved') query = query.eq('approved', true);
    if (filter === 'pending') query = query.eq('approved', false);
    if (filter === 'video') query = query.eq('content_type', 'video');
    if (filter === 'text') query = query.eq('content_type', 'text');
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,text_content.ilike.%${search}%,customer_title.ilike.%${search}%`,
      );
    }
    return query;
  }

  // Count query
  const countQuery = supabase
    .from('testimonials')
    .select('*', { count: 'exact', head: true });
  const { count } = await applyFilters(countQuery);

  // Data query
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const sortColumn = ['created_at', 'rating', 'customer_name'].includes(sort) ? sort : 'created_at';

  let dataQuery = supabase
    .from('testimonials')
    .select('*')
    .order(sortColumn, { ascending: dir })
    .range(from, to);

  dataQuery = applyFilters(dataQuery);

  const { data, error } = await dataQuery;

  if (error) {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }

  return Response.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
