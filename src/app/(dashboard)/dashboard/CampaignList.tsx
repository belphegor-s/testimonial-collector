'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

type Campaign = {
  id: string;
  name: string;
  brand_color: string;
  created_at: string;
};

export default function CampaignList({ campaigns }: { campaigns: Campaign[] }) {
  const reduced = useReducedMotion();

  if (campaigns.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
          <div className="w-4 h-4 rounded-full bg-zinc-300" />
        </div>
        <p className="text-sm font-medium text-zinc-900">No campaigns yet</p>
        <p className="text-sm text-zinc-400 mt-1 mb-4">Create your first campaign to start collecting testimonials</p>
        <Link href="/dashboard/campaigns/new" className="inline-flex bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
          New campaign
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {campaigns.map((campaign, i) => (
        <motion.div
          key={campaign.id}
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={reduced ? undefined : { delay: i * 0.05, duration: 0.3 }}
          whileHover={reduced ? undefined : { y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
        >
          <Link
            href={`/dashboard/campaigns/${campaign.id}`}
            className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center justify-between hover:border-zinc-300 transition-colors group block"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: campaign.brand_color + '22' }}>
                <div className="w-full h-full rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: campaign.brand_color }} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{campaign.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">Created {new Date(campaign.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors flex items-center gap-2">
              View <ArrowRight size={14} />
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
