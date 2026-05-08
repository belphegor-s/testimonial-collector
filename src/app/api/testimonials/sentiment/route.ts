import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import { eq, isNotNull, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { checkAiAccess, deductAiCredit } from '@/lib/ai';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { campaignId, force } = await req.json();

  const aiAccess = await checkAiAccess(session.user.id!, campaignId);
  if (!aiAccess.ok) return Response.json({ error: aiAccess.reason }, { status: 402 });

  const allTestimonials = await db
    .select({ id: schema.testimonials.id, customerName: schema.testimonials.customerName, textContent: schema.testimonials.textContent, rating: schema.testimonials.rating, contentType: schema.testimonials.contentType, createdAt: schema.testimonials.createdAt })
    .from(schema.testimonials)
    .where(eq(schema.testimonials.campaignId, campaignId))
    .orderBy(desc(schema.testimonials.createdAt));

  const textTestimonials = allTestimonials.filter((t) => t.textContent?.trim());

  if (!textTestimonials.length) {
    return Response.json({ sentiments: [], aggregate: null, cached: false });
  }

  if (!force) {
    const [cachedAggregate] = await db
      .select()
      .from(schema.sentimentAggregate)
      .where(eq(schema.sentimentAggregate.campaignId, campaignId));

    if (cachedAggregate && cachedAggregate.analyzedCount >= textTestimonials.length) {
      const cachedSentiments = await db
        .select()
        .from(schema.sentimentCache)
        .where(eq(schema.sentimentCache.campaignId, campaignId));

      const sentiments = cachedSentiments.map((s) => ({
        testimonialId: s.testimonialId,
        sentiment: s.sentiment,
        score: s.score,
        keywords: s.keywords ?? [],
        emotion: s.emotion,
      }));

      return Response.json({
        sentiments,
        aggregate: {
          overall_sentiment: cachedAggregate.overallSentiment,
          avg_score: cachedAggregate.avgScore,
          top_themes: cachedAggregate.topThemes ?? [],
          top_praise: cachedAggregate.topPraise ?? [],
          top_concerns: cachedAggregate.topConcerns ?? [],
          summary: cachedAggregate.summary,
        },
        cached: true,
      });
    }
  }

  const analysisSlice = textTestimonials.slice(0, 30);
  const textsForAnalysis = analysisSlice.map((t, i) => `[${i}] (by ${t.customerName}, rating: ${t.rating}/5): "${t.textContent}"`).join('\n\n');

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyze the sentiment of these customer testimonials. For each one, provide a sentiment label and score. Also provide an aggregate analysis.

Return ONLY valid JSON in this exact format:
{
  "items": [
    { "index": 0, "sentiment": "positive"|"neutral"|"negative"|"mixed", "score": 0.0-1.0, "keywords": ["word1", "word2"], "emotion": "joy"|"trust"|"gratitude"|"frustration"|"disappointment"|"neutral" }
  ],
  "aggregate": {
    "overall_sentiment": "positive"|"neutral"|"negative"|"mixed",
    "avg_score": 0.0-1.0,
    "top_themes": ["theme1", "theme2", "theme3"],
    "top_praise": ["praise1", "praise2"],
    "top_concerns": ["concern1", "concern2"],
    "summary": "One paragraph summary of overall customer sentiment and key insights"
  }
}

Testimonials:
${textsForAnalysis}`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [], aggregate: null };

    const sentiments = (analysis.items || []).map((item: any) => ({
      testimonialId: analysisSlice[item.index]?.id,
      sentiment: item.sentiment,
      score: item.score,
      keywords: item.keywords || [],
      emotion: item.emotion,
    }));

    for (const s of sentiments) {
      if (!s.testimonialId) continue;
      await db.insert(schema.sentimentCache).values({
        campaignId,
        testimonialId: s.testimonialId,
        sentiment: s.sentiment,
        score: s.score,
        keywords: s.keywords,
        emotion: s.emotion,
      }).onConflictDoUpdate({ target: schema.sentimentCache.testimonialId, set: { sentiment: s.sentiment, score: s.score, keywords: s.keywords, emotion: s.emotion } });
    }

    const agg = analysis.aggregate;
    if (agg) {
      await db.insert(schema.sentimentAggregate).values({
        campaignId,
        overallSentiment: agg.overall_sentiment,
        avgScore: agg.avg_score,
        topThemes: agg.top_themes || [],
        topPraise: agg.top_praise || [],
        topConcerns: agg.top_concerns || [],
        summary: agg.summary,
        analyzedCount: textTestimonials.length,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: schema.sentimentAggregate.campaignId,
        set: { overallSentiment: agg.overall_sentiment, avgScore: agg.avg_score, topThemes: agg.top_themes || [], topPraise: agg.top_praise || [], topConcerns: agg.top_concerns || [], summary: agg.summary, analyzedCount: textTestimonials.length, updatedAt: new Date() },
      });
    }

    await deductAiCredit(aiAccess.orgId!, 'sentiment', campaignId);

    return Response.json({ sentiments, aggregate: agg || null, cached: false });
  } catch {
    return Response.json({ sentiments: [], aggregate: null, cached: false });
  }
}
