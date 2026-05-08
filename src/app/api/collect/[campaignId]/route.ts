import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/cloudflare-email';
import { FROM_EMAIL } from '@/lib/email';
import Anthropic from '@anthropic-ai/sdk';
import { FormBlock } from '@/types/form';
import { escapeHtml } from '@/lib/utils';
import { assertCanAcceptTestimonial, getOrgPlan } from '@/lib/plan';
import { deductAiCredit, getAiCredits } from '@/lib/ai';
import { rateLimit } from '@/lib/rate-limit';
import { uploadToStream } from '@/lib/cloudflare-stream';

const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi'];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const anthropic = new Anthropic();

export async function GET(_: Request, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase.from('campaigns').select('id, name, brand_color, logo_url, thank_you_message, form_schema').eq('id', campaignId).single();

  if (error || !data) {
    return Response.json({ error: 'Campaign not found' }, { status: 404 });
  }

  return Response.json(data);
}

export async function POST(req: Request, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = await rateLimit(`collect:${ip}:${campaignId}`, 5, 60);
  if (!rl.ok) {
    return Response.json({ error: 'Too many submissions. Please wait a moment.' }, { status: 429 });
  }

  const supabase = createAdminClient();

  const { data: campaign } = await supabase.from('campaigns').select('id, name, organization_id').eq('id', campaignId).single();

  if (!campaign) {
    return Response.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Plan gate: free-tier owners cap at 10 testimonials per campaign
  const gate = await assertCanAcceptTestimonial(campaignId);
  if (!gate.ok) {
    return Response.json({ error: gate.reason ?? 'Submissions are paused for this campaign.' }, { status: 403 });
  }

  const formData = await req.formData();

  let formValues: Record<string, any>;
  let schema: FormBlock[];
  try {
    formValues = JSON.parse(formData.get('formValues') as string);
    schema = JSON.parse(formData.get('schema') as string);
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const videoFile = formData.get('video') as File | null;

  let video_url = null;

  // Handle video upload
  if (videoFile && videoFile.size > 0) {
    if (videoFile.size > MAX_VIDEO_SIZE) {
      return Response.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }
    const ext = (videoFile.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
      return Response.json({ error: 'Invalid file type. Allowed: mp4, mov, webm, avi.' }, { status: 400 });
    }
    if (videoFile.type && !ALLOWED_VIDEO_MIMES.includes(videoFile.type)) {
      return Response.json({ error: 'Invalid video MIME type.' }, { status: 400 });
    }
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    const { hlsUrl } = await uploadToStream(buffer, videoFile.type || 'video/mp4');
    video_url = hlsUrl;
  }

  // Extract fields from schema
  const nameBlock = schema.find((b) => b.type === 'text' && b.label.toLowerCase().includes('name'));
  const textBlock = schema.find((b) => b.type === 'textarea');
  const ratingBlock = schema.find((b) => b.type === 'rating');
  const titleBlock = schema.find((b) => b.type === 'text' && !b.label.toLowerCase().includes('name'));

  const textContent = formValues[textBlock?.id ?? ''] || null;

  // Insert testimonial
  const { data: testimonial, error: insertError } = await supabase
    .from('testimonials')
    .insert({
      campaign_id: campaignId,
      customer_name: formValues[nameBlock?.id ?? ''] ?? '',
      customer_title: formValues[titleBlock?.id ?? ''] ?? '',
      content_type: videoFile && videoFile.size > 0 ? 'video' : 'text',
      text_content: textContent,
      video_url,
      rating: formValues[ratingBlock?.id ?? ''] ?? 5,
      form_data: formValues,
    })
    .select()
    .single();

  if (insertError) {
    return Response.json({ error: 'Failed to submit testimonial' }, { status: 500 });
  }

  // Auto-summarize with AI for Pro orgs with available credits (non-blocking)
  if (textContent && campaign.organization_id) {
    try {
      const orgPlan = await getOrgPlan(campaign.organization_id);
      const credits = orgPlan === 'pro' ? await getAiCredits(campaign.organization_id) : 0;
      if (orgPlan === 'pro' && credits > 0) {
        const msg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: `Summarize this testimonial in one punchy sentence for use in marketing copy. Return only the sentence, nothing else.\n\n${textContent}`,
            },
          ],
        });
        const summary = msg.content[0].type === 'text' ? msg.content[0].text : '';
        await supabase.from('testimonials').update({ ai_summary: summary }).eq('id', testimonial.id);
        await deductAiCredit(campaign.organization_id, 'summary', testimonial.id);
      }
    } catch {}
  }

  // Send notification email to all org owners + admins (non-blocking)
  try {
    const { data: campaignFull } = await supabase.from('campaigns').select('organization_id').eq('id', campaignId).single();

    const recipients: string[] = [];
    if (campaignFull?.organization_id) {
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', campaignFull.organization_id)
        .in('role', ['owner', 'admin']);
      const userIds = (members ?? []).map((m) => m.user_id);
      for (const uid of userIds) {
        const { data: u } = await supabase.auth.admin.getUserById(uid);
        if (u.user?.email) recipients.push(u.user.email);
      }
    }

    if (recipients.length) {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/campaigns/${campaignId}`;
      await sendEmail({
        from: FROM_EMAIL,
        to: recipients,
        subject: `New testimonial from ${escapeHtml(testimonial.customer_name)}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
            <h1 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 4px;">New testimonial received</h1>
            <p style="font-size:13px;color:#a1a1aa;margin:0 0 24px;">Campaign: ${escapeHtml(campaign.name)}</p>
            <div style="background:#f4f4f5;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="font-size:14px;font-weight:600;color:#18181b;margin:0 0 4px;">${escapeHtml(testimonial.customer_name)}${testimonial.customer_title ? ` · ${escapeHtml(testimonial.customer_title)}` : ''}</p>
              <p style="font-size:14px;color:#52525b;line-height:1.6;margin:8px 0 0;">${escapeHtml(textContent || '[Video testimonial]')}</p>
            </div>
            <a href="${dashboardUrl}" style="display:inline-block;background:#18181b;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Review in dashboard
            </a>
          </div>
        `,
      });
    }
  } catch {}

  return Response.json({ success: true, testimonialId: testimonial.id });
}
