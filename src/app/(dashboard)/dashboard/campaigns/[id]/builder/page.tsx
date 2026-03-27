'use client';

import { useEffect, useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { FormBlock, BlockType, BLOCK_META, BLOCK_GROUPS, DEFAULT_SCHEMA } from '@/types/form';
import { SortableBlock } from '@/components/FormBuilder/SortableBlock';
import { FormPreview } from '@/components/FormBuilder/FormPreview';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Check, Eye, EyeOff, Type, AlignLeft, Mail, Link as LinkIcon, Hash, Calendar, Star, BarChart2, List, CheckSquare, Image, Minus, RotateCcw, ArrowLeft, ChevronDown } from 'lucide-react';
import { AnimatedDotGrid } from '@/components/AnimatedDotGrid';

const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  text: <Type size={13} />,
  textarea: <AlignLeft size={13} />,
  email: <Mail size={13} />,
  url: <LinkIcon size={13} />,
  number: <Hash size={13} />,
  date: <Calendar size={13} />,
  rating: <Star size={13} />,
  nps: <BarChart2 size={13} />,
  select: <List size={13} />,
  consent: <CheckSquare size={13} />,
  image: <Image size={13} />,
  section: <Minus size={13} />,
};

const BLOCK_COLORS: Record<BlockType, string> = {
  text: '#6366f1',
  textarea: '#8b5cf6',
  email: '#3b82f6',
  url: '#06b6d4',
  number: '#f97316',
  date: '#ec4899',
  rating: '#f59e0b',
  nps: '#0ea5e9',
  select: '#10b981',
  consent: '#f43f5e',
  image: '#14b8a6',
  section: '#71717a',
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [blocks, setBlocks] = useState<FormBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    params.then(async ({ id }) => {
      setCampaignId(id);
      const { data } = await supabase.from('campaigns').select('*').eq('id', id).single();
      if (!data) return;
      setCampaign(data);
      setBlocks(data.form_schema?.length ? data.form_schema : DEFAULT_SCHEMA);
    });
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oi = prev.findIndex((b) => b.id === active.id);
        const ni = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, oi, ni);
      });
    }
  }

  function addBlock(type: BlockType) {
    setBlocks((prev) => [
      ...prev,
      {
        id: generateId(),
        type,
        label: BLOCK_META[type].label,
        required: false,
        placeholder: '',
        options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
      },
    ]);
  }

  async function handleSave() {
    if (!campaignId) return;
    setSaving(true);
    await supabase.from('campaigns').update({ form_schema: blocks }).eq('id', campaignId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const activeBlock = blocks.find((b) => b.id === activeId);

  if (!campaign)
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-4 h-4 rounded-full bg-zinc-300" />
      </div>
    );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Topbar */}
      <div className="bg-white border-b border-zinc-200 px-5 h-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/dashboard/campaigns/${campaignId}`} className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 flex items-center gap-2">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="w-px h-4 bg-zinc-200 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center" style={{ backgroundColor: campaign.brand_color + '25' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: campaign.brand_color }} />
            </div>
            <p className="text-sm font-medium text-zinc-700 truncate">{campaign.name}</p>
            <span className="text-zinc-300 shrink-0">·</span>
            <p className="text-sm text-zinc-400 shrink-0">Form builder</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-400">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''}
          </span>

          <button onClick={() => setBlocks(DEFAULT_SCHEMA)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 transition-all">
            <RotateCcw size={11} /> Reset
          </button>

          <button
            onClick={() => setPreviewOnly((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all',
              previewOnly ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300',
            )}
          >
            {previewOnly ? <EyeOff size={11} /> : <Eye size={11} />}
            {previewOnly ? 'Edit' : 'Preview'}
          </button>

          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                  <Check size={11} className="text-emerald-400" /> Saved
                </motion.span>
              ) : (
                <motion.span key="u" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {saving ? 'Saving...' : 'Save form'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel */}
        <AnimatePresence>
          {!previewOnly && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="max-w border-r border-zinc-200 bg-white flex flex-col overflow-hidden shrink-0"
            >
              {/* Block palette — collapsible */}
              <div className="shrink-0 border-b border-zinc-100">
                <button
                  onClick={() => setPaletteOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:bg-zinc-50 transition-colors"
                >
                  Add blocks
                  <motion.div animate={{ rotate: paletteOpen ? 0 : -180 }} transition={{ duration: 0.15 }}>
                    <ChevronDown size={15} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {paletteOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 space-y-3">
                        {BLOCK_GROUPS.map((group) => (
                          <div key={group.key}>
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{group.label}</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {group.types.map((type) => (
                                <motion.button
                                  key={type}
                                  onClick={() => addBlock(type)}
                                  whileHover={{ scale: 1.03, y: -1 }}
                                  whileTap={{ scale: 0.96 }}
                                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all text-left"
                                >
                                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: BLOCK_COLORS[type] + '15', color: BLOCK_COLORS[type] }}>
                                    {BLOCK_ICONS[type]}
                                  </div>
                                  <span className="text-xs text-zinc-600 font-medium leading-tight truncate">{BLOCK_META[type].label}</span>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Blocks list */}
              <div className="flex-1 overflow-y-auto px-3 py-3">
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-center">
                    <p className="text-sm text-zinc-300">No blocks yet</p>
                    <p className="text-xs text-zinc-300 mt-0.5">Add one above</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(e) => setActiveId(e.active.id as string)}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveId(null)}
                  >
                    <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {blocks.map((block) => (
                            <SortableBlock
                              key={block.id}
                              block={block}
                              brandColor={campaign.brand_color}
                              onChange={(updated) => setBlocks((prev) => prev.map((b) => (b.id === block.id ? updated : b)))}
                              onRemove={() => setBlocks((prev) => prev.filter((b) => b.id !== block.id))}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </SortableContext>

                    <DragOverlay>
                      {activeBlock && (
                        <div className="bg-white rounded-xl border border-zinc-200 px-3 py-2.5 shadow-xl opacity-95 flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: BLOCK_COLORS[activeBlock.type] + '15', color: BLOCK_COLORS[activeBlock.type] }}
                          >
                            {BLOCK_ICONS[activeBlock.type]}
                          </div>
                          <span className="text-sm font-medium text-zinc-700">{activeBlock.label}</span>
                        </div>
                      )}
                    </DragOverlay>
                  </DndContext>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview panel */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-8 relative">
          <AnimatedDotGrid />
          <div className="max-w-sm mx-auto">
            <FormPreview blocks={blocks} brandColor={campaign.brand_color} />
          </div>
        </div>
      </div>
    </div>
  );
}
