import { createAdminClient } from '@/lib/supabase/admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const supabase = createAdminClient();

  // Fetch campaign brand info for themed embeds
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name, brand_color, logo_url')
    .eq('id', campaignId)
    .single();

  const { data } = await supabase
    .from('testimonials')
    .select('id, customer_name, customer_title, text_content, ai_summary, rating, video_url, content_type, created_at')
    .eq('campaign_id', campaignId)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(50);

  return Response.json(
    {
      campaign: campaign ?? null,
      testimonials: data ?? [],
    },
    { headers: corsHeaders },
  );
}
