'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { STATIC_ASSETS_BUCKET_NAME } from '@/data/constants';
import CampaignForm from '@/components/CampaignForm';

export default function CampaignSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();

  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(async ({ id }) => {
      setCampaignId(id);

      const { data } = await supabase.from('campaigns').select('*').eq('id', id).single();

      if (data) setData(data);
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
        const ext = formData.logoFile.name.split('.').pop();
        const path = `logos/${campaignId}.${ext}`;

        const { error } = await supabase.storage.from(STATIC_ASSETS_BUCKET_NAME).upload(path, formData.logoFile, { upsert: true });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from(STATIC_ASSETS_BUCKET_NAME).getPublicUrl(path);

        finalLogoUrl = publicUrl;
      }

      if (formData.removeLogo) {
        finalLogoUrl = null;
      }

      const { error } = await supabase
        .from('campaigns')
        .update({
          name: formData.name,
          brand_color: formData.brandColor,
          thank_you_message: formData.thankYouMessage,
          logo_url: finalLogoUrl,
        })
        .eq('id', campaignId);

      if (error) throw error;
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
  );
}
