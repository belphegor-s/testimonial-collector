'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CampaignForm from '@/components/CampaignForm';
import { createClient } from '@/lib/supabase/client';

export default function NewCampaignForm() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(data: { name: string; brandColor: string; thankYouMessage: string }) {
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: res, error } = await supabase
      .from('campaigns')
      .insert({
        name: data.name,
        brand_color: data.brandColor,
        thank_you_message: data.thankYouMessage,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(`/dashboard/campaigns/${res.id}`);
    }
  }

  return <CampaignForm mode="create" saving={loading} error={error} onSubmit={handleCreate} />;
}
