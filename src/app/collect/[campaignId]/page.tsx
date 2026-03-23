/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CollectPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const supabase = createClient();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [type, setType] = useState<'text' | 'video'>('text');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resolve params and load campaign
  useEffect(() => {
    params.then(async ({ campaignId: id }) => {
      setCampaignId(id);
      const { data } = await supabase.from('campaigns').select('*').eq('id', id).single();
      setCampaign(data);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campaignId) return;
    setLoading(true);
    setError('');

    try {
      let video_url = null;

      if (type === 'video' && videoFile) {
        const ext = videoFile.name.split('.').pop();
        const path = `${campaignId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('testimonial-videos').upload(path, videoFile);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from('testimonial-videos').getPublicUrl(path);
        video_url = publicUrl;
      }

      // Save testimonial
      const { data: testimonial, error: insertError } = await supabase
        .from('testimonials')
        .insert({
          campaign_id: campaignId,
          customer_name: name,
          customer_title: title,
          content_type: type,
          text_content: type === 'text' ? text : null,
          video_url,
          rating,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Generate AI summary for text testimonials
      if (type === 'text' && text) {
        await fetch('/api/testimonials/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: testimonial.id, text }),
        });
      }

      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-4 h-4 rounded-full bg-zinc-300 animate-pulse" />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: campaign.brand_color + '22' }}>
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: campaign.brand_color }} />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Thank you!</h2>
          <p className="text-sm text-zinc-500">{campaign.thank_you_message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: campaign.brand_color + '22' }}>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: campaign.brand_color }} />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">Share your experience</h1>
          <p className="text-sm text-zinc-400 mt-1">It only takes a minute and means a lot</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          {/* Type toggle */}
          <div className="flex gap-2 mb-5 bg-zinc-100 rounded-lg p-1">
            {(['text', 'video'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === t ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                {t === 'text' ? '✍️ Written' : '🎥 Video'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Your name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': campaign.brand_color } as any}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Role / company</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="CEO at Acme"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="text-xl transition-transform hover:scale-110">
                    <span style={{ color: star <= rating ? campaign.brand_color : '#d4d4d8' }}>★</span>
                  </button>
                ))}
              </div>
            </div>

            {type === 'text' ? (
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Your testimonial *</label>
                <textarea
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="Share what you loved about working with us..."
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Video testimonial *</label>
                <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-zinc-200 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-300 transition-colors">
                  {videoFile ? (
                    <p className="text-sm text-zinc-700 font-medium">{videoFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-500">Click to upload a video</p>
                      <p className="text-xs text-zinc-400 mt-1">MP4, MOV up to 50MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
              </div>
            )}

            {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-40 transition-colors"
              style={{ backgroundColor: campaign.brand_color }}
            >
              {loading ? 'Submitting...' : 'Submit testimonial'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
