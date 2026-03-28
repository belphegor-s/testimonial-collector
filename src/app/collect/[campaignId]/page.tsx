'use client';

import { useState, useEffect } from 'react';
import { FormBlock, DEFAULT_SCHEMA } from '@/types/form';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload } from 'lucide-react';
import Image from 'next/image';
import VideoRecorder from '@/components/VideoRecorder';

export default function CollectPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [schema, setSchema] = useState<FormBlock[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    params.then(async ({ campaignId: id }) => {
      setCampaignId(id);
      const res = await fetch(`/api/collect/${id}`);
      if (!res.ok) { setError('Campaign not found'); return; }
      const data = await res.json();
      setCampaign(data);
      setSchema(data?.form_schema?.length ? data.form_schema : DEFAULT_SCHEMA);
    });
  }, []);

  function set(id: string, val: any) {
    setFormValues((v) => ({ ...v, [id]: val }));
    if (fieldErrors[id]) setFieldErrors((e) => { const next = { ...e }; delete next[id]; return next; });
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const block of schema) {
      if (!block.required || block.type === 'section') continue;
      const val = formValues[block.id];
      if (block.type === 'consent') {
        if (!val) errors[block.id] = 'This field is required';
      } else if (block.type === 'rating') {
        if (val == null || val === 0) errors[block.id] = 'Please select a rating';
      } else if (block.type === 'nps') {
        if (val == null) errors[block.id] = 'Please select a score';
      } else if (block.type === 'select') {
        const isMulti = block.placeholder === 'multi';
        if (isMulti ? !val?.length : !val) errors[block.id] = 'Please select an option';
      } else if (block.type === 'number') {
        if (val === '' || val == null) {
          errors[block.id] = 'This field is required';
        } else {
          const num = Number(val);
          if (block.min != null && num < block.min) errors[block.id] = `Minimum value is ${block.min}`;
          if (block.max != null && num > block.max) errors[block.id] = `Maximum value is ${block.max}`;
        }
      } else {
        if (!val || (typeof val === 'string' && !val.trim())) errors[block.id] = 'This field is required';
      }
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campaignId) return;

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const body = new FormData();
      body.append('formValues', JSON.stringify(formValues));
      body.append('schema', JSON.stringify(schema));
      if (videoFile) body.append('video', videoFile);

      const res = await fetch(`/api/collect/${campaignId}`, { method: 'POST', body });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit testimonial');
      }

      setStep('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!campaign)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-4 h-4 rounded-full bg-zinc-300 animate-pulse" />
      </div>
    );

  const brandColor = campaign.brand_color;

  if (step === 'done')
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: brandColor + '20' }}>
            {campaign.logo_url ? (
              <Image src={campaign.logo_url} alt="" width={40} height={40} className="rounded-lg object-contain" />
            ) : (
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: brandColor }} />
            )}
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">Thank you!</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">{campaign.thank_you_message}</p>
        </motion.div>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: `linear-gradient(135deg, ${brandColor}08 0%, #f9fafb 50%, ${brandColor}05 100%)` }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* Header — matches preview exactly */}
          <div className="px-6 pt-6 pb-5 text-center" style={{ background: `linear-gradient(135deg, ${brandColor}08, ${brandColor}04)` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm" style={{ backgroundColor: brandColor + '20' }}>
              {campaign.logo_url ? (
                <Image src={campaign.logo_url} alt="" width={32} height={32} className="rounded-lg object-contain" />
              ) : (
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: brandColor }} />
              )}
            </div>
            <p className="text-sm font-semibold text-zinc-900">Share your experience</p>
            <p className="text-xs text-zinc-400 mt-0.5">It only takes a minute</p>
          </div>

          <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${brandColor}33, transparent)` }} />

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <AnimatePresence mode="popLayout">
              {schema.map((block) => (
                <motion.div key={block.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
                  {/* Section break */}
                  {block.type === 'section' && (
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-zinc-100" />
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{block.label || 'Section'}</span>
                      <div className="flex-1 h-px bg-zinc-100" />
                    </div>
                  )}

                  {block.type !== 'section' && (
                    <>
                      <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                        {block.label}
                        {block.required && (
                          <span className="ml-0.5" style={{ color: brandColor }}>
                            *
                          </span>
                        )}
                      </label>

                      {block.type === 'text' && (
                        <input
                          required={block.required}
                          value={formValues[block.id] ?? ''}
                          onChange={(e) => set(block.id, e.target.value)}
                          placeholder={block.placeholder}
                          className="collect-input"
                          onFocus={(e) => (e.target.style.borderColor = brandColor)}
                          onBlur={(e) => (e.target.style.borderColor = '')}
                        />
                      )}

                      {block.type === 'email' && (
                        <input
                          type="email"
                          required={block.required}
                          value={formValues[block.id] ?? ''}
                          onChange={(e) => set(block.id, e.target.value)}
                          placeholder={block.placeholder || 'you@company.com'}
                          className="collect-input"
                          onFocus={(e) => (e.target.style.borderColor = brandColor)}
                          onBlur={(e) => (e.target.style.borderColor = '')}
                        />
                      )}

                      {block.type === 'url' && (
                        <input
                          type="url"
                          required={block.required}
                          value={formValues[block.id] ?? ''}
                          onChange={(e) => set(block.id, e.target.value)}
                          placeholder={block.placeholder || 'https://'}
                          className="collect-input"
                          onFocus={(e) => (e.target.style.borderColor = brandColor)}
                          onBlur={(e) => (e.target.style.borderColor = '')}
                        />
                      )}

                      {block.type === 'number' && (
                        <input
                          type="number"
                          required={block.required}
                          value={formValues[block.id] ?? ''}
                          onChange={(e) => set(block.id, e.target.value)}
                          min={block.min}
                          max={block.max}
                          placeholder={block.placeholder || '0'}
                          className="collect-input"
                          onFocus={(e) => (e.target.style.borderColor = brandColor)}
                          onBlur={(e) => (e.target.style.borderColor = '')}
                        />
                      )}

                      {block.type === 'date' && (
                        <input
                          type="date"
                          required={block.required}
                          value={formValues[block.id] ?? ''}
                          onChange={(e) => set(block.id, e.target.value)}
                          className="collect-input"
                          onFocus={(e) => (e.target.style.borderColor = brandColor)}
                          onBlur={(e) => (e.target.style.borderColor = '')}
                        />
                      )}

                      {block.type === 'textarea' && (
                        <textarea
                          required={block.required}
                          value={formValues[block.id] ?? ''}
                          onChange={(e) => set(block.id, e.target.value)}
                          placeholder={block.placeholder}
                          rows={parseInt(block.options?.[0] ?? '4')}
                          className="collect-input resize-none"
                          onFocus={(e) => (e.target.style.borderColor = brandColor)}
                          onBlur={(e) => (e.target.style.borderColor = '')}
                        />
                      )}

                      {block.type === 'rating' && (
                        <>
                          <div className="flex gap-1">
                            {Array.from({ length: parseInt(block.options?.[0] ?? '5') }, (_, i) => i + 1).map((star) => (
                              <motion.button key={star} type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.9 }} onClick={() => set(block.id, star)}>
                                <Star
                                  size={24}
                                  fill={star <= (formValues[block.id] ?? 0) ? brandColor : 'none'}
                                  stroke={star <= (formValues[block.id] ?? 0) ? brandColor : '#d4d4d8'}
                                  strokeWidth={1.5}
                                />
                              </motion.button>
                            ))}
                          </div>
                          {fieldErrors[block.id] && <p className="text-xs text-red-500 mt-1">{fieldErrors[block.id]}</p>}
                        </>
                      )}

                      {block.type === 'nps' && (
                        <div>
                          <div className="flex gap-1 flex-wrap">
                            {Array.from({ length: 11 }, (_, i) => (
                              <motion.button
                                key={i}
                                type="button"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => set(block.id, i)}
                                className="w-8 h-8 rounded-lg text-xs font-medium border transition-colors"
                                style={{
                                  background: formValues[block.id] === i ? brandColor : 'white',
                                  borderColor: formValues[block.id] === i ? brandColor : '#e4e4e7',
                                  color: formValues[block.id] === i ? 'white' : '#71717a',
                                }}
                              >
                                {i}
                              </motion.button>
                            ))}
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-xs text-zinc-400">{block.options?.[0] ?? 'Not likely'}</span>
                            <span className="text-xs text-zinc-400">{block.options?.[1] ?? 'Very likely'}</span>
                          </div>
                          {fieldErrors[block.id] && <p className="text-xs text-red-500 mt-1">{fieldErrors[block.id]}</p>}
                        </div>
                      )}

                      {block.type === 'select' && (
                        <>
                          <div className="space-y-2">
                            {(block.options?.filter((o) => !o.startsWith('help:')) ?? []).map((opt, i) => {
                              const isMulti = block.placeholder === 'multi';
                              const selected = isMulti ? (formValues[block.id] ?? []).includes(opt) : formValues[block.id] === opt;
                              return (
                                <motion.div
                                  key={i}
                                  whileHover={{ x: 2 }}
                                  onClick={() => {
                                    if (isMulti) {
                                      const cur: string[] = formValues[block.id] ?? [];
                                      set(block.id, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
                                    } else {
                                      set(block.id, opt);
                                    }
                                  }}
                                  className="flex items-center gap-2.5 cursor-pointer"
                                >
                                  <div
                                    className={`w-4 h-4 ${isMulti ? 'rounded' : 'rounded-full'} border-2 shrink-0 flex items-center justify-center transition-all`}
                                    style={{ borderColor: selected ? brandColor : '#d4d4d8', backgroundColor: selected ? brandColor : 'white' }}
                                  >
                                    {selected && <div className={`${isMulti ? 'w-1.5 h-1.5 rounded-sm' : 'w-1.5 h-1.5 rounded-full'} bg-white`} />}
                                  </div>
                                  <span className="text-sm text-zinc-600">{opt}</span>
                                </motion.div>
                              );
                            })}
                          </div>
                          {fieldErrors[block.id] && <p className="text-xs text-red-500 mt-1">{fieldErrors[block.id]}</p>}
                        </>
                      )}

                      {block.type === 'consent' && (
                        <>
                          <div onClick={() => set(block.id, !formValues[block.id])} className="flex items-start gap-2.5 cursor-pointer">
                            <div
                              className="w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all"
                              style={{
                                borderColor: fieldErrors[block.id] ? '#ef4444' : formValues[block.id] ? brandColor : '#d4d4d8',
                                backgroundColor: formValues[block.id] ? brandColor : 'white',
                              }}
                            >
                              {formValues[block.id] && (
                                <span className="text-white" style={{ fontSize: 9 }}>
                                  ✓
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-zinc-600 leading-snug">{block.placeholder ?? 'I agree to have my testimonial published publicly'}</span>
                          </div>
                          {fieldErrors[block.id] && <p className="text-xs text-red-500 mt-1">{fieldErrors[block.id]}</p>}
                        </>
                      )}

                      {block.type === 'image' && (
                        <div className="border-2 border-dashed border-zinc-200 rounded-xl p-4 text-center hover:border-zinc-300 transition-colors cursor-pointer">
                          <Upload size={18} className="mx-auto text-zinc-300 mb-1.5" />
                          <p className="text-xs text-zinc-400">Click to upload photo</p>
                          <p className="text-xs text-zinc-300 mt-0.5">JPG, PNG, WEBP up to 5MB</p>
                        </div>
                      )}

                      {block.options?.find((o) => o.startsWith('help:')) && <p className="text-xs text-zinc-400 mt-1.5">{block.options.find((o) => o.startsWith('help:'))?.replace('help:', '')}</p>}
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Video testimonial — record or upload */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Video testimonial <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <VideoRecorder brandColor={brandColor} onVideoReady={setVideoFile} currentFile={videoFile} />
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm disabled:opacity-40 transition-all"
              style={{ backgroundColor: brandColor }}
            >
              {loading ? 'Submitting...' : 'Submit testimonial'}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-4">
          Powered by <span className="font-medium text-zinc-500">Testimonial Collector</span>
        </p>
      </div>
    </div>
  );
}
