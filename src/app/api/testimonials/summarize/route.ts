import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { checkAiAccess, deductAiCredit } from '@/lib/ai';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, text } = await req.json();

  const [testimonial] = await db
    .select({ id: schema.testimonials.id, campaignId: schema.testimonials.campaignId })
    .from(schema.testimonials)
    .where(eq(schema.testimonials.id, id));
  if (!testimonial) return Response.json({ error: 'Not found' }, { status: 404 });

  const aiAccess = await checkAiAccess(session.user.id!, testimonial.campaignId);
  if (!aiAccess.ok) return Response.json({ error: aiAccess.reason }, { status: 402 });

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{ role: 'user', content: `Summarize this testimonial in one punchy sentence for use in marketing copy. Return only the sentence, nothing else.\n\n${text}` }],
  });

  const summary = msg.content[0].type === 'text' ? msg.content[0].text : '';

  await db.update(schema.testimonials).set({ aiSummary: summary }).where(eq(schema.testimonials.id, id));
  await deductAiCredit(aiAccess.orgId!, 'summary', id);

  return Response.json({ summary });
}
