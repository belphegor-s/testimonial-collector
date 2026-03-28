import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  // Auth check
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, text } = await req.json();

  // Verify the testimonial belongs to a campaign the user owns
  const { data: testimonial } = await authClient
    .from('testimonials')
    .select('id, campaign_id')
    .eq('id', id)
    .single();
  if (!testimonial) return Response.json({ error: 'Not found' }, { status: 404 });

  const { data: campaign } = await authClient
    .from('campaigns')
    .select('id')
    .eq('id', testimonial.campaign_id)
    .eq('owner_id', user.id)
    .single();
  if (!campaign) return Response.json({ error: 'Not found' }, { status: 404 });

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `Summarize this testimonial in one punchy sentence for use in marketing copy. Return only the sentence, nothing else.\n\n${text}`,
      },
    ],
  });

  const summary = msg.content[0].type === 'text' ? msg.content[0].text : '';

  const supabase = createAdminClient();
  await supabase.from('testimonials').update({ ai_summary: summary }).eq('id', id);

  return Response.json({ summary });
}
