'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormBlock, BlockType, BLOCK_META } from '@/types/form';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GripVertical, ChevronDown, X, Check, Type, AlignLeft, Mail, Link, Hash, Calendar, Star, BarChart2, List, CheckSquare, Image, Minus, Plus, Trash2 } from 'lucide-react';

const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  text: <Type size={13} />,
  textarea: <AlignLeft size={13} />,
  email: <Mail size={13} />,
  url: <Link size={13} />,
  number: <Hash size={13} />,
  date: <Calendar size={13} />,
  rating: <Star size={13} />,
  nps: <BarChart2 size={13} />,
  select: <List size={13} />,
  consent: <CheckSquare size={13} />,
  image: <Image size={13} />,
  section: <Minus size={13} />,
};

const BLOCK_COLORS: Record<BlockType, { bg: string; text: string; border: string }> = {
  text: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  textarea: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  email: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  url: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  number: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  date: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  rating: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  nps: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  select: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  consent: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  image: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  section: { bg: 'bg-zinc-100', text: 'text-zinc-500', border: 'border-zinc-200' },
};

interface Props {
  block: FormBlock;
  onChange: (block: FormBlock) => void;
  onRemove: () => void;
  brandColor: string;
}

export function SortableBlock({ block, onChange, onRemove, brandColor }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const style = { transform: CSS.Transform.toString(transform), transition };
  const colors = BLOCK_COLORS[block.type];

  function addOption() {
    onChange({ ...block, options: [...(block.options ?? []), `Option ${(block.options?.length ?? 0) + 1}`] });
  }
  function updateOption(i: number, val: string) {
    const opts = [...(block.options ?? [])];
    opts[i] = val;
    onChange({ ...block, options: opts });
  }
  function removeOption(i: number) {
    const opts = [...(block.options ?? [])];
    opts.splice(i, 1);
    onChange({ ...block, options: opts });
  }

  const isLayout = block.type === 'section';

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.4 : 1,
      }}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18 }}
      className="bg-white rounded-xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-zinc-300 hover:text-zinc-500 !cursor-grab active:cursor-grabbing touch-none transition-colors shrink-0 p-0.5 rounded hover:bg-zinc-100"
          tabIndex={-1}
        >
          <GripVertical size={14} />
        </button>

        {/* Type badge */}
        <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-md border shrink-0', colors.bg, colors.text, colors.border)}>
          {BLOCK_ICONS[block.type]}
          <span className="text-xs font-medium">{BLOCK_META[block.type].label}</span>
        </div>

        {/* Label */}
        {isLayout ? (
          <input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            className="flex-1 text-sm font-semibold text-zinc-500 bg-transparent focus:outline-none italic"
            placeholder="Section heading..."
          />
        ) : (
          <input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            className="flex-1 text-sm font-medium text-zinc-800 bg-transparent focus:outline-none placeholder:text-zinc-300"
            placeholder="Question label..."
          />
        )}

        {/* Required pill — not shown for section/image */}
        {!isLayout && block.type !== 'image' && (
          <button
            type="button"
            onClick={() => onChange({ ...block, required: !block.required })}
            className={cn(
              'shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium transition-all',
              block.required ? 'bg-red-50 border-red-200 text-red-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-500',
            )}
          >
            {block.required ? 'Required' : 'Optional'}
          </button>
        )}

        {/* Expand */}
        {!isLayout && (
          <button onClick={() => setExpanded((v) => !v)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-400 transition-all">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.18 }}>
              <ChevronDown size={13} />
            </motion.div>
          </button>
        )}

        {/* Delete */}
        <AnimatePresence mode="wait">
          {confirmDelete ? (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 shrink-0">
              <button onClick={onRemove} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                <Check size={10} /> Yes
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-md hover:bg-zinc-200 transition-colors">
                No
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="del"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(true)}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-zinc-300 hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded settings */}
      <AnimatePresence>
        {expanded && !isLayout && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-100 bg-zinc-50/80 px-4 py-4 space-y-4 rounded-b-xl">
              {/* Placeholder — text, textarea, email, url, number */}
              {['text', 'textarea', 'email', 'url', 'number'].includes(block.type) && (
                <Field label="Placeholder text">
                  <input value={block.placeholder ?? ''} onChange={(e) => onChange({ ...block, placeholder: e.target.value })} className="input" placeholder="e.g. Enter your answer..." />
                </Field>
              )}

              {/* Textarea rows */}
              {block.type === 'textarea' && (
                <Field label="Rows">
                  <div className="flex gap-1.5">
                    {[2, 3, 4, 5, 6].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onChange({ ...block, options: [String(r), ...(block.options?.slice(1) ?? [])] })}
                        className={cn(
                          'w-9 h-9 rounded-lg text-sm border transition-all font-medium',
                          (block.options?.[0] ?? '4') === String(r) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300',
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {/* Number min/max */}
              {block.type === 'number' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Min value">
                    <input type="number" value={block.min ?? ''} onChange={(e) => onChange({ ...block, min: Number(e.target.value) })} className="input" placeholder="0" />
                  </Field>
                  <Field label="Max value">
                    <input type="number" value={block.max ?? ''} onChange={(e) => onChange({ ...block, max: Number(e.target.value) })} className="input" placeholder="100" />
                  </Field>
                </div>
              )}

              {/* Rating scale */}
              {block.type === 'rating' && (
                <Field label="Scale">
                  <div className="flex gap-1.5">
                    {[3, 5, 10].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onChange({ ...block, options: [String(s)] })}
                        className={cn(
                          'px-3 h-9 rounded-lg text-sm border transition-all font-medium',
                          (block.options?.[0] ?? '5') === String(s) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300',
                        )}
                      >
                        {s} ★
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {/* NPS labels */}
              {block.type === 'nps' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Low end label">
                    <input value={block.options?.[0] ?? 'Not likely'} onChange={(e) => onChange({ ...block, options: [e.target.value, block.options?.[1] ?? 'Very likely'] })} className="input" />
                  </Field>
                  <Field label="High end label">
                    <input value={block.options?.[1] ?? 'Very likely'} onChange={(e) => onChange({ ...block, options: [block.options?.[0] ?? 'Not likely', e.target.value] })} className="input" />
                  </Field>
                </div>
              )}

              {/* Select options */}
              {block.type === 'select' && (
                <Field label="Answer options">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {(block.options ?? []).map((opt, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 shrink-0" />
                          <input value={opt} onChange={(e) => updateOption(i, e.target.value)} className="flex-1 input" />
                          <button onClick={() => removeOption(i)} className="text-zinc-300 hover:text-red-400 transition-colors shrink-0">
                            <X size={13} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <button onClick={addOption} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors mt-1">
                      <Plus size={12} /> Add option
                    </button>
                  </div>

                  {/* Multi-select toggle */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200">
                    <span className="text-xs text-zinc-500">Allow multiple selections</span>
                    <Toggle value={block.placeholder === 'multi'} onChange={(v) => onChange({ ...block, placeholder: v ? 'multi' : '' })} brandColor={brandColor} />
                  </div>
                </Field>
              )}

              {/* Consent text */}
              {block.type === 'consent' && (
                <Field label="Consent statement">
                  <textarea
                    value={block.placeholder ?? 'I agree to have my testimonial published publicly'}
                    onChange={(e) => onChange({ ...block, placeholder: e.target.value })}
                    rows={2}
                    className="input resize-none"
                  />
                </Field>
              )}

              {/* Image — accepted types */}
              {block.type === 'image' && (
                <Field label="Accepted formats">
                  <div className="flex gap-2">
                    {['JPG', 'PNG', 'WEBP', 'GIF'].map((fmt) => (
                      <span key={fmt} className="text-xs px-2 py-1 bg-zinc-100 text-zinc-500 rounded-md">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </Field>
              )}

              {/* Helper text — all types */}
              <Field
                label={
                  <span>
                    Helper text <span className="text-zinc-400 font-normal">(optional)</span>
                  </span>
                }
              >
                <input
                  value={block.options?.find((o) => o.startsWith('help:'))?.replace('help:', '') ?? ''}
                  onChange={(e) => {
                    const filtered = (block.options ?? []).filter((o) => !o.startsWith('help:'));
                    onChange({ ...block, options: e.target.value ? [...filtered, `help:${e.target.value}`] : filtered });
                  }}
                  className="input"
                  placeholder="Shown below the field as a hint"
                />
              </Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, brandColor }: { value: boolean; onChange: (v: boolean) => void; brandColor: string }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="relative w-9 h-5 rounded-full transition-colors shrink-0" style={{ backgroundColor: value ? brandColor : '#d4d4d8' }}>
      <motion.div animate={{ x: value ? 16 : 2 }} transition={{ duration: 0.15, type: 'spring', stiffness: 500, damping: 30 }} className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}
