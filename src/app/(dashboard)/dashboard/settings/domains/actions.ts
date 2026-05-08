'use server';

import { randomBytes } from 'crypto';
import { promises as dns } from 'dns';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveOrg } from '@/lib/org';

const MAX_DOMAINS_PER_ORG = 5;
const HOSTNAME_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))+$/i;

async function authedProOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const org = await getActiveOrg(user.id);
  if (!org) throw new Error('No active organization');
  if (org.plan !== 'pro') throw new Error('Custom domains require the Pro plan.');
  return { user, org };
}

export async function addDomainAction(formData: FormData) {
  const { user, org } = await authedProOrg();
  const hostnameRaw = String(formData.get('hostname') || '').trim().toLowerCase();
  const campaignId = String(formData.get('campaignId') || '').trim();

  if (!HOSTNAME_RE.test(hostnameRaw)) {
    return { ok: false, error: 'That does not look like a valid hostname.' };
  }
  if (hostnameRaw.endsWith('kudoso.io')) {
    return { ok: false, error: 'You cannot use kudoso.io as a custom domain.' };
  }
  if (!campaignId) return { ok: false, error: 'Choose a campaign.' };

  const sb = createAdminClient();

  const { data: campaign } = await sb.from('campaigns').select('id').eq('id', campaignId).eq('organization_id', org.id).maybeSingle();
  if (!campaign) return { ok: false, error: 'Campaign not found.' };

  const { count } = await sb.from('custom_domains').select('*', { count: 'exact', head: true }).eq('organization_id', org.id);
  if ((count ?? 0) >= MAX_DOMAINS_PER_ORG) {
    return { ok: false, error: `You can add up to ${MAX_DOMAINS_PER_ORG} custom domains. Remove one first.` };
  }

  const { data: existing } = await sb.from('custom_domains').select('id').eq('hostname', hostnameRaw).maybeSingle();
  if (existing) return { ok: false, error: 'That hostname is already in use.' };

  const verification_token = randomBytes(16).toString('hex');
  const { error } = await sb.from('custom_domains').insert({
    organization_id: org.id,
    user_id: user.id,
    campaign_id: campaignId,
    hostname: hostnameRaw,
    verification_token,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/settings/domains');
  return { ok: true };
}

export async function verifyDomainAction(domainId: string) {
  const { org } = await authedProOrg();
  const sb = createAdminClient();

  const { data: row } = await sb.from('custom_domains').select('*').eq('id', domainId).eq('organization_id', org.id).maybeSingle();
  if (!row) return { ok: false, error: 'Domain not found' };

  let verified = false;

  try {
    const cname = await dns.resolveCname(row.hostname).catch(() => [] as string[]);
    if (cname.some((c) => c.toLowerCase().replace(/\.$/, '') === 'proxy.kudoso.io' || c.toLowerCase().replace(/\.$/, '') === 'kudoso.io')) {
      verified = true;
    }
  } catch {}

  if (!verified) {
    try {
      const txt = await dns.resolveTxt(`_kudoso-verify.${row.hostname}`).catch(() => [] as string[][]);
      const flat = txt.map((arr) => arr.join('')).map((v) => v.trim());
      if (flat.includes(row.verification_token)) verified = true;
    } catch {}
  }

  if (!verified) {
    return { ok: false, error: 'Could not verify DNS yet. Make sure the record has propagated (can take a few minutes), then try again.' };
  }

  await sb.from('custom_domains').update({ verified_at: new Date().toISOString() }).eq('id', domainId);
  revalidatePath('/dashboard/settings/domains');
  return { ok: true };
}

export async function deleteDomainAction(domainId: string) {
  const { org } = await authedProOrg();
  const sb = createAdminClient();
  const { error } = await sb.from('custom_domains').delete().eq('id', domainId).eq('organization_id', org.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/settings/domains');
  return { ok: true };
}
