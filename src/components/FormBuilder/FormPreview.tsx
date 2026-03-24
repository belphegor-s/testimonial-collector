'use client';

import { FormBlock } from '@/types/form';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Star } from 'lucide-react';

interface Props {
  blocks: FormBlock[];
  brandColor: string;
}

export function FormPreview({ blocks, brandColor }: Props) {
  const [values, setValues] = useState<Record<string, any>>({});
  function set(id: string, val: any) {
    setValues((v) => ({ ...v, [id]: val }));
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 text-center" style={{ background: `linear-gradient(135deg, ${brandColor}08, ${brandColor}04)` }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm" style={{ backgroundColor: brandColor + '20' }}>
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: brandColor }} />
        </div>
        <p className="text-sm font-semibold text-zinc-900">Share your experience</p>
        <p className="text-xs text-zinc-400 mt-0.5">It only takes a minute</p>
      </div>

      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${brandColor}33, transparent)` }} />

      <div className="px-6 py-5 space-y-5">
        <AnimatePresence mode="popLayout">
          {blocks.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-zinc-300 py-8">
              Add blocks to see preview
            </motion.p>
          ) : (
            blocks.map((block) => (
              <motion.div key={block.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
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
                      {block.label || <span className="text-zinc-300">Untitled</span>}
                      {block.required && (
                        <span className="ml-0.5" style={{ color: brandColor }}>
                          *
                        </span>
                      )}
                    </label>

                    {/* Short text */}
                    {block.type === 'text' && (
                      <input
                        value={values[block.id] ?? ''}
                        onChange={(e) => set(block.id, e.target.value)}
                        placeholder={block.placeholder}
                        className="preview-input"
                        onFocus={(e) => (e.target.style.borderColor = brandColor)}
                        onBlur={(e) => (e.target.style.borderColor = '')}
                      />
                    )}

                    {/* Email */}
                    {block.type === 'email' && (
                      <input
                        type="email"
                        value={values[block.id] ?? ''}
                        onChange={(e) => set(block.id, e.target.value)}
                        placeholder={block.placeholder || 'you@company.com'}
                        className="preview-input"
                        onFocus={(e) => (e.target.style.borderColor = brandColor)}
                        onBlur={(e) => (e.target.style.borderColor = '')}
                      />
                    )}

                    {/* URL */}
                    {block.type === 'url' && (
                      <input
                        type="url"
                        value={values[block.id] ?? ''}
                        onChange={(e) => set(block.id, e.target.value)}
                        placeholder={block.placeholder || 'https://'}
                        className="preview-input"
                        onFocus={(e) => (e.target.style.borderColor = brandColor)}
                        onBlur={(e) => (e.target.style.borderColor = '')}
                      />
                    )}

                    {/* Number */}
                    {block.type === 'number' && (
                      <input
                        type="number"
                        value={values[block.id] ?? ''}
                        onChange={(e) => set(block.id, e.target.value)}
                        min={block.min}
                        max={block.max}
                        placeholder={block.placeholder || '0'}
                        className="preview-input"
                        onFocus={(e) => (e.target.style.borderColor = brandColor)}
                        onBlur={(e) => (e.target.style.borderColor = '')}
                      />
                    )}

                    {/* Date */}
                    {block.type === 'date' && (
                      <input
                        type="date"
                        value={values[block.id] ?? ''}
                        onChange={(e) => set(block.id, e.target.value)}
                        className="preview-input"
                        onFocus={(e) => (e.target.style.borderColor = brandColor)}
                        onBlur={(e) => (e.target.style.borderColor = '')}
                      />
                    )}

                    {/* Textarea */}
                    {block.type === 'textarea' && (
                      <textarea
                        value={values[block.id] ?? ''}
                        onChange={(e) => set(block.id, e.target.value)}
                        placeholder={block.placeholder}
                        rows={parseInt(block.options?.[0] ?? '4')}
                        className="preview-input resize-none"
                        onFocus={(e) => (e.target.style.borderColor = brandColor)}
                        onBlur={(e) => (e.target.style.borderColor = '')}
                      />
                    )}

                    {/* Star rating */}
                    {block.type === 'rating' && (
                      <div className="flex gap-1">
                        {Array.from({ length: parseInt(block.options?.[0] ?? '5') }, (_, i) => i + 1).map((star) => (
                          <motion.button key={star} type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.9 }} onClick={() => set(block.id, star)}>
                            <Star size={22} fill={star <= (values[block.id] ?? 0) ? brandColor : 'none'} stroke={star <= (values[block.id] ?? 0) ? brandColor : '#d4d4d8'} strokeWidth={1.5} />
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* NPS */}
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
                                background: values[block.id] === i ? brandColor : 'white',
                                borderColor: values[block.id] === i ? brandColor : '#e4e4e7',
                                color: values[block.id] === i ? 'white' : '#71717a',
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
                      </div>
                    )}

                    {/* Select */}
                    {block.type === 'select' && (
                      <div className="space-y-2">
                        {(block.options?.filter((o) => !o.startsWith('help:')) ?? []).map((opt, i) => {
                          const isMulti = block.placeholder === 'multi';
                          const selected = isMulti ? (values[block.id] ?? []).includes(opt) : values[block.id] === opt;
                          return (
                            <motion.div
                              key={i}
                              whileHover={{ x: 2 }}
                              onClick={() => {
                                if (isMulti) {
                                  const cur: string[] = values[block.id] ?? [];
                                  set(block.id, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
                                } else {
                                  set(block.id, opt);
                                }
                              }}
                              className="flex items-center gap-2.5 cursor-pointer group"
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
                    )}

                    {/* Consent */}
                    {block.type === 'consent' && (
                      <div onClick={() => set(block.id, !values[block.id])} className="flex items-start gap-2.5 cursor-pointer">
                        <div
                          className="w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all"
                          style={{ borderColor: values[block.id] ? brandColor : '#d4d4d8', backgroundColor: values[block.id] ? brandColor : 'white' }}
                        >
                          {values[block.id] && (
                            <span className="text-white" style={{ fontSize: 9 }}>
                              ✓
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-zinc-600 leading-snug">{block.placeholder ?? 'I agree to have my testimonial published publicly'}</span>
                      </div>
                    )}

                    {/* Image upload */}
                    {block.type === 'image' && (
                      <div className="border-2 border-dashed border-zinc-200 rounded-xl p-4 text-center hover:border-zinc-300 transition-colors cursor-pointer">
                        <Upload size={18} className="mx-auto text-zinc-300 mb-1.5" />
                        <p className="text-xs text-zinc-400">Click to upload photo</p>
                        <p className="text-xs text-zinc-300 mt-0.5">JPG, PNG, WEBP up to 5MB</p>
                      </div>
                    )}

                    {/* Helper text */}
                    {block.options?.find((o) => o.startsWith('help:')) && <p className="text-xs text-zinc-400 mt-1.5">{block.options.find((o) => o.startsWith('help:'))?.replace('help:', '')}</p>}
                  </>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {blocks.length > 0 && (
          <motion.button
            layout
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm mt-2"
            style={{ backgroundColor: brandColor }}
          >
            Submit testimonial
          </motion.button>
        )}
      </div>
    </div>
  );
}
