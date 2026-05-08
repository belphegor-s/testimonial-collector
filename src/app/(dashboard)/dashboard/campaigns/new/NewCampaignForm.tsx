'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CampaignForm from '@/components/CampaignForm';

export default function NewCampaignForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(data: { name: string; brandColor: string; thankYouMessage: string }) {
    setLoading(true);
    setError('');

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        brand_color: data.brandColor,
        thank_you_message: data.thankYouMessage,
        organization_id: organizationId,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Failed to create campaign');
      setLoading(false);
    } else {
      router.push(`/dashboard/campaigns/${json.id}`);
    }
  }

  return <CampaignForm mode="create" saving={loading} error={error} onSubmit={handleCreate} />;
}
