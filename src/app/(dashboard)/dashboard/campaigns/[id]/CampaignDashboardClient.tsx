'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CopyButton } from '@/components/CopyButton';
import Toggle from '@/components/Toggle';
import {
  LayoutGrid,
  Table,
  BarChart3,
  Code,
  X,
  ChevronDown,
  ChevronUp,
  Video,
  FileText,
  Star,
  Check,
  Clock,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Eye,
  Sun,
  Moon,
  Columns3,
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Search,
  Play,
  Pause,
  Zap,
} from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

// ── Helpers ──────────────────────────────────────────────
const ACCENT_PRESETS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const SAMPLE_TESTIMONIALS = [
  {
    id: 's1',
    customer_name: 'Sarah Johnson',
    customer_title: 'Product Manager',
    text_content: 'This product has completely transformed our workflow. The team is more productive and collaborative than ever before.',
    rating: 5,
    approved: true,
    created_at: '2025-03-15T00:00:00Z',
    content_type: 'text',
    video_url: null,
  },
  {
    id: 's2',
    customer_name: 'Alex Chen',
    customer_title: 'CTO at Streamline',
    text_content: 'Incredible tool. We saw a 40% increase in customer engagement within the first month of launching.',
    rating: 5,
    approved: true,
    created_at: '2025-03-10T00:00:00Z',
    content_type: 'text',
    video_url: null,
  },
  {
    id: 's3',
    customer_name: 'Maria Garcia',
    customer_title: 'Marketing Director',
    text_content: 'The best investment we made this year. Simple to set up and the results speak for themselves.',
    rating: 4,
    approved: true,
    created_at: '2025-03-05T00:00:00Z',
    content_type: 'text',
    video_url: null,
  },
  {
    id: 's4',
    customer_name: 'James Wilson',
    customer_title: 'Founder & CEO',
    text_content: 'Outstanding support team and a product that just works. Highly recommend to any growing business.',
    rating: 5,
    approved: true,
    created_at: '2025-02-28T00:00:00Z',
    content_type: 'text',
    video_url: null,
  },
  {
    id: 's5',
    customer_name: 'Emily Davis',
    customer_title: 'Head of Sales',
    text_content: 'Social proof on our landing page increased conversions by 25%. This tool made it effortless to collect and display.',
    rating: 5,
    approved: true,
    created_at: '2025-02-20T00:00:00Z',
    content_type: 'text',
    video_url: null,
  },
  {
    id: 's6',
    customer_name: 'David Kim',
    customer_title: 'Lead Designer',
    text_content: 'Beautiful, customizable widgets that match our brand perfectly. Love the attention to detail and polish.',
    rating: 4,
    approved: true,
    created_at: '2025-02-15T00:00:00Z',
    content_type: 'text',
    video_url: null,
  },
];

// ── Types ────────────────────────────────────────────────
type Testimonial = {
  id: string;
  customer_name: string;
  customer_title: string | null;
  text_content: string | null;
  ai_summary: string | null;
  rating: number;
  video_url: string | null;
  content_type: string;
  approved: boolean;
  form_data: any;
  created_at: string;
};

type SentimentItem = {
  testimonialId: string;
  sentiment: string;
  score: number;
  keywords: string[];
  emotion: string;
};

type SentimentAggregate = {
  overall_sentiment: string;
  avg_score: number;
  top_themes: string[];
  top_praise: string[];
  top_concerns: string[];
  summary: string;
};

type Tab = 'overview' | 'table' | 'analytics' | 'embed';
type ViewFilter = 'all' | 'approved' | 'pending' | 'video' | 'text';
type SortField = 'created_at' | 'rating' | 'customer_name';

interface Props {
  campaign: any;
  initialData: Testimonial[];
  initialTotal: number;
  stats: { total: number; approved: number; pending: number; video: number; avgRating: string };
  appUrl: string;
}

// ── Main Component ───────────────────────────────────────
export default function CampaignDashboardClient({ campaign, initialData, initialTotal, stats, appUrl }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL params with defaults
  const paramTab = (searchParams.get('tab') as Tab) || 'overview';
  const paramFilter = (searchParams.get('filter') as ViewFilter) || 'all';
  const paramSort = (searchParams.get('sort') as SortField) || 'created_at';
  const paramDir = (searchParams.get('dir') as 'asc' | 'desc') || 'desc';
  const paramPage = parseInt(searchParams.get('page') || '1', 10);
  const paramPageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const paramSearch = searchParams.get('search') || '';

  // Local state
  const [tab, setTabState] = useState<Tab>(paramTab);
  const [filter, setFilterState] = useState<ViewFilter>(paramFilter);
  const [sortField, setSortFieldState] = useState<SortField>(paramSort);
  const [sortDir, setSortDirState] = useState<'asc' | 'desc'>(paramDir);
  const [page, setPageState] = useState(paramPage);
  const [pageSize, setPageSizeState] = useState(paramPageSize);
  const [searchInput, setSearchInput] = useState(paramSearch);
  const [searchQuery, setSearchQuery] = useState(paramSearch);

  const [testimonials, setTestimonials] = useState(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Embed config — initialize with defaults, then hydrate from localStorage
  const [embedTheme, setEmbedTheme] = useState<'light' | 'dark'>('light');
  const [embedLayout, setEmbedLayout] = useState<'masonry' | 'carousel' | 'list'>('masonry');
  const [embedColumns, setEmbedColumns] = useState('3');
  const [embedMax, setEmbedMax] = useState('12');
  const [embedShowRating, setEmbedShowRating] = useState(true);
  const [embedShowDate, setEmbedShowDate] = useState(false);
  const [embedAnimation, setEmbedAnimation] = useState<'none' | 'fade' | 'marquee'>('none');
  const [embedAutoplay, setEmbedAutoplay] = useState(false);
  const [embedSpeed, setEmbedSpeed] = useState('18');
  const [embedDirection, setEmbedDirection] = useState<'left' | 'right'>('left');
  const [embedPauseHover, setEmbedPauseHover] = useState(true);
  const [embedAccent, setEmbedAccent] = useState(campaign.brand_color || '#6366f1');

  // Hydrate embed config from localStorage on mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`embed-config-${campaign.id}`);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.theme) setEmbedTheme(s.theme);
      if (s.layout) setEmbedLayout(s.layout);
      if (s.columns) setEmbedColumns(s.columns);
      if (s.max) setEmbedMax(s.max);
      if (s.showRating !== undefined) setEmbedShowRating(s.showRating);
      if (s.showDate !== undefined) setEmbedShowDate(s.showDate);
      if (s.animation) setEmbedAnimation(s.animation);
      if (s.autoplay !== undefined) setEmbedAutoplay(s.autoplay);
      if (s.speed) setEmbedSpeed(s.speed);
      if (s.direction) setEmbedDirection(s.direction);
      if (s.pauseHover !== undefined) setEmbedPauseHover(s.pauseHover);
      if (s.accent) setEmbedAccent(s.accent);
    } catch {}
  }, [campaign.id]);

  // Persist embed config (debounced to avoid jank during slider drag)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          `embed-config-${campaign.id}`,
          JSON.stringify({
            theme: embedTheme,
            layout: embedLayout,
            columns: embedColumns,
            max: embedMax,
            showRating: embedShowRating,
            showDate: embedShowDate,
            animation: embedAnimation,
            autoplay: embedAutoplay,
            speed: embedSpeed,
            direction: embedDirection,
            pauseHover: embedPauseHover,
            accent: embedAccent,
          }),
        );
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [embedTheme, embedLayout, embedColumns, embedMax, embedShowRating, embedShowDate, embedAnimation, embedAutoplay, embedSpeed, embedDirection, embedPauseHover, embedAccent, campaign.id]);

  // Embed iframe preview
  const [iframeHeight, setIframeHeight] = useState(400);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for height messages from the preview iframe
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === 'tcw-preview-height' && typeof e.data.height === 'number') {
        setIframeHeight(Math.max(200, e.data.height + 16));
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Build preview srcdoc — uses actual embed.js via fetch override for sample data
  const previewSrcdoc = useMemo(() => {
    // Build the same data-attributes as the embed code but with a preview campaign ID
    const previewAttrs = [
      `data-testimonial-campaign="preview"`,
      `data-origin="${appUrl}"`,
      `data-theme="${embedTheme}"`,
      `data-layout="${embedAnimation === 'marquee' ? 'masonry' : embedLayout}"`,
      embedLayout === 'masonry' && embedAnimation !== 'marquee' ? `data-columns="${embedColumns}"` : '',
      `data-max="${embedMax}"`,
      `data-show-rating="${embedShowRating}"`,
      `data-show-date="${embedShowDate}"`,
      embedAnimation !== 'none' ? `data-animation="${embedAnimation}"` : '',
      embedAnimation === 'marquee' ? `data-speed="${55 - parseInt(embedSpeed)}"` : '',
      embedAnimation === 'marquee' && embedDirection === 'right' ? `data-direction="right"` : '',
      embedAccent !== (campaign.brand_color || '#6366f1') ? `data-accent="${embedAccent}"` : '',
      embedAutoplay && embedLayout === 'carousel' ? `data-autoplay="3000"` : '',
      !embedPauseHover ? `data-pause-hover="false"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const sampleData = JSON.stringify({ testimonials: SAMPLE_TESTIMONIALS, campaign: { brand_color: embedAccent } });

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',sans-serif;background:${embedTheme === 'dark' ? '#09090b' : 'transparent'};overflow-x:hidden;padding:16px;}</style>
</head><body>
<div ${previewAttrs}></div>
<script>
var _sd=${sampleData};
var _rf=window.fetch;
window.fetch=function(u){
  if(typeof u==='string'&&u.includes('/api/embed/'))
    return Promise.resolve(new Response(JSON.stringify(_sd),{headers:{'Content-Type':'application/json'}}));
  return _rf.apply(this,arguments);
};
</script>
<script src="${appUrl}/embed.js"><\/script>
<script>
new ResizeObserver(function(){
  window.parent.postMessage({type:'tcw-preview-height',height:document.body.scrollHeight},'*');
}).observe(document.body);
</script>
</body></html>`;
  }, [embedTheme, embedLayout, embedColumns, embedMax, embedShowRating, embedShowDate, embedAnimation, embedSpeed, embedDirection, embedAccent, embedAutoplay, appUrl, campaign.brand_color]);

  // Sentiment
  const [sentiments, setSentiments] = useState<SentimentItem[]>([]);
  const [aggregate, setAggregate] = useState<SentimentAggregate | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentLoaded, setSentimentLoaded] = useState(false);
  const [sentimentCached, setSentimentCached] = useState(false);

  const brandColor = campaign.brand_color || '#6366f1';
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── URL param sync ─────────────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === '') params.delete(k);
        else params.set(k, v);
      }
      // Clean defaults
      if (params.get('tab') === 'overview') params.delete('tab');
      if (params.get('filter') === 'all') params.delete('filter');
      if (params.get('sort') === 'created_at') params.delete('sort');
      if (params.get('dir') === 'desc') params.delete('dir');
      if (params.get('page') === '1') params.delete('page');
      if (params.get('pageSize') === '20') params.delete('pageSize');
      const qs = params.toString();
      router.replace(pathname + (qs ? '?' + qs : ''), { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // State setters that also update URL
  function setTab(v: Tab) {
    setTabState(v);
    updateParams({ tab: v });
  }
  function setFilter(v: ViewFilter) {
    setFilterState(v);
    setPageState(1);
    updateParams({ filter: v, page: undefined });
  }
  function setSort(field: SortField) {
    if (sortField === field) {
      const newDir = sortDir === 'asc' ? 'desc' : 'asc';
      setSortDirState(newDir);
      updateParams({ dir: newDir });
    } else {
      setSortFieldState(field);
      setSortDirState('desc');
      updateParams({ sort: field, dir: 'desc' });
    }
  }
  function setPage(v: number) {
    setPageState(v);
    updateParams({ page: String(v) });
  }
  function setPageSize(v: number) {
    setPageSizeState(v);
    setPageState(1);
    updateParams({ pageSize: String(v), page: undefined });
  }

  // Debounced search
  function handleSearchInput(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPageState(1);
      updateParams({ search: value || undefined, page: undefined });
    }, 300);
  }

  // ── Server-side data fetching ──────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        campaignId: campaign.id,
        page: String(page),
        pageSize: String(pageSize),
        filter,
        sort: sortField,
        dir: sortDir,
        ...(searchQuery ? { search: searchQuery } : {}),
      });
      const res = await fetch('/api/testimonials/list?' + params.toString());
      const json = await res.json();
      setTestimonials(json.data || []);
      setTotal(json.total || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [campaign.id, page, pageSize, filter, sortField, sortDir, searchQuery]);

  // Fetch when params change (skip initial load since server provides it)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchData();
  }, [fetchData]);

  // Auto-load cached sentiment when analytics tab is active (e.g. on page refresh with ?tab=analytics)
  useEffect(() => {
    if (tab === 'analytics' && !sentimentLoaded && !sentimentLoading) {
      loadSentiment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Approval toggle ────────────────────────────────────
  async function toggleApproval(id: string) {
    const t = testimonials.find((x) => x.id === id);
    if (!t) return;
    const newApproved = !t.approved;
    setTestimonials((prev) => prev.map((x) => (x.id === id ? { ...x, approved: newApproved } : x)));
    await fetch('/api/testimonials/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved: newApproved }),
    }).catch(() => {
      setTestimonials((prev) => prev.map((x) => (x.id === id ? { ...x, approved: !newApproved } : x)));
    });
  }

  // ── Sentiment ──────────────────────────────────────────
  async function loadSentiment(force = false) {
    if (sentimentLoading) return;
    if (sentimentLoaded && !force) return;
    setSentimentLoading(true);
    try {
      const res = await fetch('/api/testimonials/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, force }),
      });
      const data = await res.json();
      setSentiments(data.sentiments || []);
      setAggregate(data.aggregate || null);
      setSentimentCached(data.cached ?? false);
      setSentimentLoaded(true);
    } catch {
      /* ignore */
    } finally {
      setSentimentLoading(false);
    }
  }

  // Computed
  const selected = selectedId ? testimonials.find((t) => t.id === selectedId) : null;
  const sentimentForSelected = selectedId ? sentiments.find((s) => s.testimonialId === selectedId) : null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const tabDefs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutGrid },
    { key: 'table', label: 'Table', icon: Table },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'embed', label: 'Embed', icon: Code },
  ];

  // Embed code
  const embedAttrs = [
    `data-testimonial-campaign="${campaign.id}"`,
    `data-origin="${appUrl}"`,
    `data-theme="${embedTheme}"`,
    `data-layout="${embedAnimation === 'marquee' ? 'masonry' : embedLayout}"`,
    embedLayout === 'masonry' && embedAnimation !== 'marquee' ? `data-columns="${embedColumns}"` : null,
    `data-max="${embedMax}"`,
    `data-show-rating="${embedShowRating}"`,
    `data-show-date="${embedShowDate}"`,
    embedAnimation !== 'none' ? `data-animation="${embedAnimation}"` : null,
    embedAnimation === 'marquee' ? `data-speed="${55 - parseInt(embedSpeed)}"` : null,
    embedAnimation === 'marquee' && embedDirection === 'right' ? `data-direction="right"` : null,
    embedAccent !== (campaign.brand_color || '#6366f1') ? `data-accent="${embedAccent}"` : null,
    embedAutoplay && embedLayout === 'carousel' ? `data-autoplay="3000"` : null,
    embedAnimation === 'marquee' && !embedPauseHover ? `data-pause-hover="false"` : null,
  ].filter(Boolean);
  const embedCode = `<div\n  ${embedAttrs.join('\n  ')}\n></div>\n<script src="${appUrl}/embed.js"></script>`;

  return (
    <div>
      {/* ── Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: MessageSquare, color: '#6366f1' },
          { label: 'Approved', value: stats.approved, icon: Check, color: '#10b981' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
          { label: 'Videos', value: stats.video, icon: Video, color: '#8b5cf6' },
          { label: 'Avg Rating', value: stats.avgRating, icon: Star, color: '#f59e0b' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}>
                <stat.icon size={14} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-zinc-900">{stat.value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ───────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1 mb-6">
        {tabDefs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              if (t.key === 'analytics') loadSentiment();
            }}
            className={`flex flex-1 items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            <t.icon size={15} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Filter & search bar ───────────────────────── */}
      {(tab === 'overview' || tab === 'table') && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
          <div className="flex items-center gap-0.5 bg-white border border-zinc-200 rounded-lg p-0.5 overflow-x-auto shrink-0">
            {(['all', 'approved', 'pending', 'video', 'text'] as ViewFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize whitespace-nowrap ${filter === f ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search testimonials..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full text-sm border border-zinc-200 rounded-lg pl-9 pr-9 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    handleSearchInput('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{total} results</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Overview (card grid) ──────────────────────── */}
      {tab === 'overview' && (
        <>
          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testimonials.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-zinc-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-zinc-300 transition-all flex flex-col h-full"
                  onClick={() => setSelectedId(t.id)}
                >
                  {/* Top: badges & content */}
                  <div className="flex items-start justify-between gap-3 mb-auto">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>{t.approved ? 'Approved' : 'Pending'}</span>
                        {t.content_type === 'video' && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Video</span>}
                      </div>
                      {t.rating > 0 && (
                        <div className="flex gap-0.5 mb-2">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} size={13} fill={i < t.rating ? '#f59e0b' : 'none'} stroke={i < t.rating ? '#f59e0b' : '#d4d4d8'} strokeWidth={1.5} />
                          ))}
                        </div>
                      )}
                      {t.ai_summary && (
                        <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5 mb-2 italic line-clamp-2">
                          <Sparkles size={10} className="inline mr-1" />
                          {t.ai_summary}
                        </p>
                      )}
                      {t.text_content && <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3">{t.text_content}</p>}
                      {t.video_url && !t.text_content && (
                        <div className="mt-2 rounded-lg overflow-hidden bg-black relative">
                          <video src={t.video_url} className="w-full max-h-40 object-cover" preload="metadata" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <Play size={16} className="text-zinc-700 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleApproval(t.id);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                        t.approved ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {t.approved ? 'Unapprove' : 'Approve'}
                    </button>
                  </div>
                  {/* Bottom: author — always at card bottom */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-zinc-100">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}aa)` }}
                    >
                      {t.customer_name
                        ?.split(' ')
                        .map((w: string) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{t.customer_name}</p>
                      {t.customer_title && <p className="text-xs text-zinc-400 truncate">{t.customer_title}</p>}
                    </div>
                    <p className="text-xs text-zinc-300 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} />
        </>
      )}

      {/* ── Table ─────────────────────────────────────── */}
      {tab === 'table' && (
        <>
          {testimonials.length > 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      {[
                        { key: 'customer_name' as const, label: 'Customer' },
                        { key: 'rating' as const, label: 'Rating' },
                        { key: 'created_at' as const, label: 'Date' },
                      ].map((col) => (
                        <th key={col.key} className="text-left text-xs font-medium text-zinc-500 px-4 py-3 cursor-pointer hover:text-zinc-700 select-none" onClick={() => setSort(col.key)}>
                          <div className="flex items-center gap-1">
                            {col.label}
                            {sortField === col.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                          </div>
                        </th>
                      ))}
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Content</th>
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Type</th>
                      <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Status</th>
                      <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testimonials.map((t) => (
                      <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 cursor-pointer transition-colors" onClick={() => setSelectedId(t.id)}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-zinc-900">{t.customer_name}</p>
                          {t.customer_title && <p className="text-xs text-zinc-400">{t.customer_title}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} size={12} fill={i < t.rating ? '#f59e0b' : 'none'} stroke={i < t.rating ? '#f59e0b' : '#d4d4d8'} strokeWidth={1.5} />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-zinc-600 truncate max-w-[280px]">{t.text_content || t.ai_summary || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.content_type === 'video' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                            {t.content_type === 'video' ? 'Video' : 'Text'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                            {t.approved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(t.id);
                              }}
                              className="text-xs text-zinc-400 hover:text-zinc-600"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleApproval(t.id);
                              }}
                              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${t.approved ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                            >
                              {t.approved ? 'Unapprove' : 'Approve'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} />
        </>
      )}

      {/* ── Analytics ─────────────────────────────────── */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Charts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rating distribution */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 col-span-2">
              <h3 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                <Star size={14} className="text-amber-500" /> Rating Distribution
              </h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.total > 0 ? initialData.filter((t) => t.rating === star).length : 0;
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-14">
                        <span className="text-xs font-medium text-zinc-600">{star}</span>
                        <Star size={11} fill="#f59e0b" stroke="#f59e0b" />
                      </div>
                      <div className="flex-1 h-6 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: (5 - star) * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: brandColor }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-16 text-right">
                        {count} ({Math.round(pct)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content type */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                <FileText size={14} className="text-blue-500" /> Content Type
              </h3>
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e4e4e7" strokeWidth="12" />
                    {stats.total > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={brandColor}
                        strokeWidth="12"
                        strokeDasharray={`${((stats.total - stats.video) / stats.total) * 251.3} 251.3`}
                        strokeLinecap="round"
                      />
                    )}
                    {stats.video > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="12"
                        strokeDasharray={`${(stats.video / stats.total) * 251.3} 251.3`}
                        strokeDashoffset={`${-((stats.total - stats.video) / stats.total) * 251.3}`}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-zinc-800">{stats.total}</span>
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brandColor }} />
                    <span className="text-zinc-600">Text ({stats.total - stats.video})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-zinc-600">Video ({stats.video})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval rate */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-500" /> Approval Rate
              </h3>
              <div className="flex flex-col items-center gap-2">
                <div className="text-4xl font-bold" style={{ color: brandColor }}>
                  {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                </div>
                <p className="text-xs text-zinc-400">of testimonials approved</p>
                <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: stats.total > 0 ? `${(stats.approved / stats.total) * 100}%` : '0%' }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
                <div className="flex justify-between w-full text-xs text-zinc-400 mt-1">
                  <span>{stats.approved} approved</span>
                  <span>{stats.pending} pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Sentiment */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-500" /> AI Sentiment Analysis
                {sentimentLoaded && sentimentCached && <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-400 font-normal">Cached</span>}
              </h3>
              <div className="flex items-center gap-2">
                {sentimentLoaded && (
                  <button
                    onClick={() => loadSentiment(true)}
                    disabled={sentimentLoading}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} className={sentimentLoading ? 'animate-spin' : ''} /> Rerun
                  </button>
                )}
                {!sentimentLoaded && (
                  <button
                    onClick={() => loadSentiment()}
                    disabled={sentimentLoading}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    style={{ backgroundColor: brandColor }}
                  >
                    {sentimentLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap size={12} /> Run Analysis
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {sentimentLoading && !sentimentLoaded && (
              <div className="flex items-center justify-center py-12 gap-3">
                <Loader2 size={18} className="animate-spin text-purple-500" />
                <span className="text-sm text-zinc-500">Claude is analyzing your testimonials...</span>
              </div>
            )}

            {sentimentLoaded && aggregate && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Overall Sentiment</p>
                    <p className="text-lg font-bold text-purple-800 capitalize">{aggregate.overall_sentiment}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${aggregate.avg_score * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-purple-600">{(aggregate.avg_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Top Praise</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aggregate.top_praise.map((p, i) => (
                        <span key={i} className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Concerns</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aggregate.top_concerns.length > 0 ? (
                        aggregate.top_concerns.map((c, i) => (
                          <span key={i} className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-amber-500">None identified</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">AI Summary</p>
                  <p className="text-sm text-zinc-700 leading-relaxed">{aggregate.summary}</p>
                </div>

                {aggregate.top_themes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Key Themes</p>
                    <div className="flex flex-wrap gap-2">
                      {aggregate.top_themes.map((theme, i) => (
                        <span key={i} className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {sentiments.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Individual Scores</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {sentiments.map((s) => {
                        const t = testimonials.find((x) => x.id === s.testimonialId) || initialData.find((x) => x.id === s.testimonialId);
                        if (!t) return null;
                        const sc = s.sentiment === 'positive' ? '#10b981' : s.sentiment === 'negative' ? '#ef4444' : s.sentiment === 'mixed' ? '#f59e0b' : '#71717a';
                        return (
                          <div
                            key={s.testimonialId}
                            className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 hover:border-zinc-200 cursor-pointer transition-colors"
                            onClick={() => setSelectedId(t.id)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-zinc-800">{t.customer_name}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium capitalize" style={{ backgroundColor: sc + '15', color: sc }}>
                                {s.sentiment}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${s.score * 100}%`, backgroundColor: sc }} />
                              </div>
                              <span className="text-xs text-zinc-400">{(s.score * 100).toFixed(0)}%</span>
                            </div>
                            {s.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {s.keywords.slice(0, 3).map((kw, i) => (
                                  <span key={i} className="text-[10px] bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-zinc-500">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sentimentLoaded && !aggregate && <p className="text-sm text-zinc-400 text-center py-8">No text testimonials to analyze.</p>}
            {!sentimentLoaded && !sentimentLoading && <p className="text-sm text-zinc-400 text-center py-8">Click &ldquo;Run Analysis&rdquo; to get AI-powered sentiment insights.</p>}
          </div>
        </div>
      )}

      {/* ── Embed customizer ──────────────────────────── */}
      {tab === 'embed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Options panel */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6">
            <h3 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <SlidersHorizontal size={14} /> Customize Embed
            </h3>

            {/* Theme */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2.5 block">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'light' as const, label: 'Light', icon: Sun, desc: 'Clean white cards' },
                  { key: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Dark background' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setEmbedTheme(t.key)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      embedTheme === t.key ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${embedTheme === t.key ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                      <t.icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{t.label}</p>
                      <p className="text-xs text-zinc-400">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout */}
            <div className={embedAnimation === 'marquee' ? 'opacity-40 pointer-events-none' : ''}>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2.5 block">
                Layout {embedAnimation === 'marquee' && <span className="normal-case font-normal text-zinc-400">(overridden by marquee)</span>}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'masonry' as const, label: 'Masonry', icon: LayoutGrid },
                  { key: 'carousel' as const, label: 'Carousel', icon: Columns3 },
                  { key: 'list' as const, label: 'List', icon: List },
                ].map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setEmbedLayout(l.key)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      embedLayout === l.key ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'
                    }`}
                  >
                    <l.icon size={18} className={embedLayout === l.key ? 'text-zinc-800' : 'text-zinc-400'} />
                    <span className={`text-xs font-medium ${embedLayout === l.key ? 'text-zinc-800' : 'text-zinc-500'}`}>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Animation */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2.5 block">Animation</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'none' as const, label: 'None', icon: Pause },
                  { key: 'fade' as const, label: 'Fade In', icon: Eye },
                  { key: 'marquee' as const, label: 'Marquee', icon: Play },
                ].map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setEmbedAnimation(a.key)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      embedAnimation === a.key ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'
                    }`}
                  >
                    <a.icon size={18} className={embedAnimation === a.key ? 'text-zinc-800' : 'text-zinc-400'} />
                    <span className={`text-xs font-medium ${embedAnimation === a.key ? 'text-zinc-800' : 'text-zinc-500'}`}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Marquee options */}
            {embedAnimation === 'marquee' && (
              <div className="space-y-4 pl-1">
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Speed</label>
                  <div className="flex gap-2">
                    {[
                      { label: 'Slow', dur: '30' },
                      { label: 'Normal', dur: '18' },
                      { label: 'Fast', dur: '10' },
                      { label: 'Turbo', dur: '5' },
                    ].map((s) => (
                      <button
                        key={s.dur}
                        onClick={() => setEmbedSpeed(s.dur)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${embedSpeed === s.dur ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Direction</label>
                  <div className="flex gap-2">
                    {[
                      { key: 'left' as const, label: 'Right to Left', icon: ChevronLeft },
                      { key: 'right' as const, label: 'Left to Right', icon: ChevronRight },
                    ].map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setEmbedDirection(d.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          embedDirection === d.key ? 'border-zinc-900 bg-zinc-50 text-zinc-800' : 'border-zinc-100 text-zinc-500 hover:border-zinc-200'
                        }`}
                      >
                        <d.icon size={14} /> {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Toggle checked={embedPauseHover} onChange={setEmbedPauseHover} label="Pause on hover" />
              </div>
            )}

            {/* Columns (masonry only, not marquee) */}
            {embedLayout === 'masonry' && embedAnimation !== 'marquee' && (
              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2.5 block">Columns</label>
                <div className="flex gap-2">
                  {['2', '3', '4'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setEmbedColumns(c)}
                      className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                        embedColumns === c ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-100 text-zinc-500 hover:border-zinc-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Max testimonials */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2.5 block">Max testimonials</label>
              <input
                type="number"
                value={embedMax}
                onChange={(e) => setEmbedMax(e.target.value)}
                min="1"
                max="50"
                className="w-24 border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all"
              />
            </div>

            {/* Accent color */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2.5 block">Accent Color</label>
              <div className="flex items-center gap-2 mb-3">
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEmbedAccent(c)}
                    className={`w-7 h-7 rounded-full transition-all ${embedAccent === c ? 'ring-2 ring-offset-2 ring-zinc-400 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="relative w-9 h-9 rounded-lg overflow-hidden cursor-pointer border border-zinc-200 hover:scale-105 transition-transform">
                  <div className="w-full h-full" style={{ backgroundColor: embedAccent }} />
                  <input type="color" value={embedAccent} onChange={(e) => setEmbedAccent(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </label>
                <span className="text-xs text-zinc-500 font-mono">{embedAccent}</span>
                {embedAccent !== (campaign.brand_color || '#6366f1') && (
                  <button onClick={() => setEmbedAccent(campaign.brand_color || '#6366f1')} className="text-[10px] text-zinc-400 hover:text-zinc-600 underline">
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4 pt-2 border-t border-zinc-100">
              <Toggle checked={embedShowRating} onChange={setEmbedShowRating} label="Show star ratings" />
              <Toggle checked={embedShowDate} onChange={setEmbedShowDate} label="Show dates" />
              {embedLayout === 'carousel' && embedAnimation !== 'marquee' && <Toggle checked={embedAutoplay} onChange={setEmbedAutoplay} label="Autoplay carousel" />}
            </div>
          </div>

          {/* Code + preview */}
          <div className="space-y-4">
            {/* Code block */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-zinc-50">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-xs text-zinc-400 font-mono ml-2">embed-code.html</span>
                </div>
                <CopyButton text={embedCode} />
              </div>
              <Highlight theme={themes.nightOwl} code={embedCode.trimEnd()} language="html">
                {({ style, tokens, getTokenProps }) => (
                  <pre className="text-xs font-mono leading-relaxed p-5 overflow-x-auto m-0" style={{ ...style, borderRadius: 0 }}>
                    {tokens.map((line, i) => (
                      <div key={i} style={{ display: 'flex' }}>
                        <span
                          style={{ width: '1.5rem', textAlign: 'right', marginRight: '1rem', userSelect: 'none', opacity: 0.5, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
                          className="text-zinc-500"
                        >
                          {i + 1}
                        </span>
                        <span style={{ whiteSpace: 'pre' }}>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </span>
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>

            {/* Live preview — uses actual embed.js in an iframe */}
            <div className={`border rounded-xl overflow-hidden ${embedTheme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className={`px-5 py-3 border-b ${embedTheme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${embedTheme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Live Preview</p>
              </div>
              <iframe ref={iframeRef} srcDoc={previewSrcdoc} className="w-full border-0 p-2" style={{ height: iframeHeight, display: 'block' }} sandbox="allow-scripts" title="Embed preview" />
            </div>
          </div>
        </div>
      )}

      {/* ── Detail modal ──────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}
                  >
                    {selected.customer_name
                      ?.split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{selected.customer_name}</h3>
                    {selected.customer_title && <p className="text-xs text-zinc-400">{selected.customer_title}</p>}
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
                  <X size={18} className="text-zinc-400" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${selected.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                    {selected.approved ? 'Approved' : 'Pending'}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${selected.content_type === 'video' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {selected.content_type === 'video' ? 'Video' : 'Text'}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {selected.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={18} fill={i < selected.rating ? '#f59e0b' : 'none'} stroke={i < selected.rating ? '#f59e0b' : '#d4d4d8'} strokeWidth={1.5} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-zinc-600">{selected.rating}/5</span>
                  </div>
                )}

                {selected.ai_summary && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Sparkles size={12} /> AI Summary
                    </p>
                    <p className="text-sm text-emerald-800 italic">{selected.ai_summary}</p>
                  </div>
                )}

                {selected.text_content && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Testimonial</p>
                    <p className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 rounded-xl p-4 border border-zinc-100">{selected.text_content}</p>
                  </div>
                )}

                {selected.video_url && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Video</p>
                    <video src={selected.video_url} controls playsInline className="w-full rounded-xl bg-black" />
                  </div>
                )}

                {sentimentForSelected && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4">
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Sparkles size={12} /> Sentiment
                    </p>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-purple-800 capitalize">{sentimentForSelected.sentiment}</span>
                      <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${sentimentForSelected.score * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-purple-600">{(sentimentForSelected.score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-500">Emotion:</span>
                      <span className="text-xs font-medium text-purple-700 capitalize">{sentimentForSelected.emotion}</span>
                    </div>
                    {sentimentForSelected.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sentimentForSelected.keywords.map((kw, i) => (
                          <span key={i} className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selected.form_data && Object.keys(selected.form_data).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">All Form Responses</p>
                    <div className="bg-zinc-50 rounded-xl border border-zinc-100 divide-y divide-zinc-100">
                      {Object.entries(selected.form_data).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-3 px-4 py-2.5">
                          <span className="text-xs text-zinc-400 min-w-[100px] pt-0.5">{key.replace(/^default-/, '').replace(/-/g, ' ')}</span>
                          <span className="text-sm text-zinc-700 flex-1">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : Array.isArray(value) ? value.join(', ') : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => toggleApproval(selected.id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${selected.approved ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'text-white'}`}
                    style={!selected.approved ? { backgroundColor: brandColor } : undefined}
                  >
                    {selected.approved ? 'Unapprove' : 'Approve'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pagination ───────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  setPage,
  setPageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
}) {
  if (total <= 10) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Generate visible page numbers
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400">
          Showing {from}-{to} of {total}
        </span>
        <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))} className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 bg-white text-zinc-600 focus:outline-none">
          {[10, 20, 50].map((s) => (
            <option key={s} value={s}>
              {s} per page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:border-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={'e' + i} className="w-8 h-8 flex items-center justify-center text-xs text-zinc-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p as number)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${page === p ? 'bg-zinc-900 text-white' : 'border border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:border-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-10 text-center">
      <p className="text-sm font-medium text-zinc-900">No testimonials match</p>
      <p className="text-sm text-zinc-400 mt-1">Try adjusting your filters or share the collection link</p>
    </div>
  );
}
