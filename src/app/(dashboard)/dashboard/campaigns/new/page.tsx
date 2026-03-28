'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import CampaignForm from '@/components/CampaignForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCampaignPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(data: any) {
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

  return (
    <div>
      <Link href={`/dashboard`} className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 flex items-center gap-2 mb-4">
        <ArrowLeft size={14} /> Back
      </Link>
      <CampaignForm mode="create" saving={loading} error={error} onSubmit={handleCreate} />
    </div>
  );
}
