import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  // Auth check
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { campaignId, force } = await req.json();

  // Verify campaign ownership
  const { data: campaign } = await authClient
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('owner_id', user.id)
    .single();
  if (!campaign) return Response.json({ error: 'Not found' }, { status: 404 });

  const supabase = createAdminClient();

  // Fetch testimonials with text content
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('id, customer_name, text_content, rating, content_type, created_at')
    .eq('campaign_id', campaignId)
    .not('text_content', 'is', null)
    .order('created_at', { ascending: false });

  const textTestimonials = (testimonials ?? []).filter((t) => t.text_content?.trim());

  if (!textTestimonials.length) {
    return Response.json({ sentiments: [], aggregate: null, cached: false });
  }

  // Check cache unless force rerun
  if (!force) {
    const { data: cachedAggregate } = await supabase.from('sentiment_aggregate').select('*').eq('campaign_id', campaignId).single();

    if (cachedAggregate && cachedAggregate.analyzed_count >= textTestimonials.length) {
      // Cache is up to date — return cached results
      const { data: cachedSentiments } = await supabase.from('sentiment_cache').select('*').eq('campaign_id', campaignId);

      const sentiments = (cachedSentiments ?? []).map((s) => ({
        testimonialId: s.testimonial_id,
        sentiment: s.sentiment,
        score: s.score,
        keywords: s.keywords ?? [],
        emotion: s.emotion,
      }));

      return Response.json({
        sentiments,
        aggregate: {
          overall_sentiment: cachedAggregate.overall_sentiment,
          avg_score: cachedAggregate.avg_score,
          top_themes: cachedAggregate.top_themes ?? [],
          top_praise: cachedAggregate.top_praise ?? [],
          top_concerns: cachedAggregate.top_concerns ?? [],
          summary: cachedAggregate.summary,
        },
        cached: true,
      });
    }
  }

  // Fresh analysis — call Claude
  const analysisSlice = textTestimonials.slice(0, 30);
  const textsForAnalysis = analysisSlice.map((t, i) => `[${i}] (by ${t.customer_name}, rating: ${t.rating}/5): "${t.text_content}"`).join('\n\n');

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
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
      },
    ],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [], aggregate: null };

    // Map results to testimonial IDs
    const sentiments = (analysis.items || []).map((item: any) => ({
      testimonialId: analysisSlice[item.index]?.id,
      sentiment: item.sentiment,
      score: item.score,
      keywords: item.keywords || [],
      emotion: item.emotion,
    }));

    // Persist to DB — upsert sentiment_cache per testimonial
    for (const s of sentiments) {
      if (!s.testimonialId) continue;
      await supabase.from('sentiment_cache').upsert(
        {
          campaign_id: campaignId,
          testimonial_id: s.testimonialId,
          sentiment: s.sentiment,
          score: s.score,
          keywords: s.keywords,
          emotion: s.emotion,
        },
        { onConflict: 'testimonial_id' },
      );
    }

    // Persist aggregate
    const agg = analysis.aggregate;
    if (agg) {
      await supabase.from('sentiment_aggregate').upsert(
        {
          campaign_id: campaignId,
          overall_sentiment: agg.overall_sentiment,
          avg_score: agg.avg_score,
          top_themes: agg.top_themes || [],
          top_praise: agg.top_praise || [],
          top_concerns: agg.top_concerns || [],
          summary: agg.summary,
          analyzed_count: textTestimonials.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'campaign_id' },
      );
    }

    return Response.json({
      sentiments,
      aggregate: agg || null,
      cached: false,
    });
  } catch {
    return Response.json({ sentiments: [], aggregate: null, cached: false });
  }
}
