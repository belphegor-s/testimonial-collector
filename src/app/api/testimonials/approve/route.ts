import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, approved } = await req.json();

  // RLS ensures user can only update their own campaigns' testimonials.
  const { data, error } = await supabase
    .from('testimonials')
    .update({ approved })
    .eq('id', id)
    .select('id');

  if (error) {
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
