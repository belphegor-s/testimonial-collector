'use client';

import { useEffect, useState } from 'react';
import CampaignForm from '@/components/CampaignForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CampaignSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(async ({ id }) => {
      setCampaignId(id);
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave(formData: any) {
    if (!campaignId) return;
    setSaving(true);
    setError('');

    try {
      let finalLogoUrl = data.logo_url;

      if (formData.logoFile) {
        const fd = new FormData();
        fd.set('file', formData.logoFile);
        fd.set('campaignId', campaignId);
        const res = await fetch('/api/upload/logo', { method: 'POST', body: fd });
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j.error ?? 'Logo upload failed');
        }
        const { url } = await res.json();
        finalLogoUrl = url;
      }

      if (formData.removeLogo) finalLogoUrl = null;

      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          brand_color: formData.brandColor,
          thank_you_message: formData.thankYouMessage,
          logo_url: finalLogoUrl,
        }),
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-4 h-4 rounded-full bg-zinc-300 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/dashboard/campaigns/${campaignId}`}
        className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 flex items-center gap-2 mb-4"
      >
        <ArrowLeft size={14} /> Back
      </Link>
      <CampaignForm
        mode="edit"
        loading={loading}
        saving={saving}
        error={error}
        initialValues={{
          name: data?.name,
          brandColor: data?.brand_color,
          thankYouMessage: data?.thank_you_message,
          logoUrl: data?.logo_url,
        }}
        onSubmit={handleSave}
      />
    </div>
  );
}
