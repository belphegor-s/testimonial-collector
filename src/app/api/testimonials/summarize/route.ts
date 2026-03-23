import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const { id, text } = await req.json();

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

  const supabase = await createClient();
  await supabase.from('testimonials').update({ ai_summary: summary }).eq('id', id);

  return Response.json({ summary });
}
