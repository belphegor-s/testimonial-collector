import { createClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('testimonials')
    .select('customer_name, customer_title, text_content, ai_summary, rating, video_url, content_type')
    .eq('campaign_id', campaignId)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(12);

  return Response.json(data ?? [], {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
