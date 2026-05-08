'use server';

import { randomBytes } from 'crypto';
import { promises as dns } from 'dns';
import { revalidatePath } from 'next/cache';
import { eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { auth } from '@/auth';
import { getActiveOrg } from '@/lib/org';

const MAX_DOMAINS_PER_ORG = 5;
const HOSTNAME_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))+$/i;

async function authedProOrg() {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated');
  const org = await getActiveOrg(session.user.id!);
  if (!org) throw new Error('No active organization');
  if (org.plan !== 'pro') throw new Error('Custom domains require the Pro plan.');
  return { user: session.user, org };
}

export async function addDomainAction(formData: FormData) {
  const { org } = await authedProOrg();
  const hostnameRaw = String(formData.get('hostname') || '').trim().toLowerCase();
  const campaignId = String(formData.get('campaignId') || '').trim();

  if (!HOSTNAME_RE.test(hostnameRaw)) {
    return { ok: false, error: 'That does not look like a valid hostname.' };
  }
  if (hostnameRaw.endsWith('kudoso.io')) {
    return { ok: false, error: 'You cannot use kudoso.io as a custom domain.' };
  }
  if (!campaignId) return { ok: false, error: 'Choose a campaign.' };

  const [campaign] = await db
    .select({ id: schema.campaigns.id })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, campaignId));
  if (!campaign) return { ok: false, error: 'Campaign not found.' };

  const [countRow] = await db
    .select({ value: count() })
    .from(schema.customDomains)
    .where(eq(schema.customDomains.organizationId, org.id));
  if ((countRow?.value ?? 0) >= MAX_DOMAINS_PER_ORG) {
    return { ok: false, error: `You can add up to ${MAX_DOMAINS_PER_ORG} custom domains. Remove one first.` };
  }

  const [existing] = await db
    .select({ id: schema.customDomains.id })
    .from(schema.customDomains)
    .where(eq(schema.customDomains.hostname, hostnameRaw));
  if (existing) return { ok: false, error: 'That hostname is already in use.' };

  const verification_token = randomBytes(16).toString('hex');
  try {
    await db.insert(schema.customDomains).values({
      organizationId: org.id,
      campaignId,
      hostname: hostnameRaw,
      verificationToken: verification_token,
    });
  } catch (e: any) {
    return { ok: false, error: e.message };
  }

  revalidatePath('/dashboard/settings/domains');
  return { ok: true };
}

export async function verifyDomainAction(domainId: string) {
  const { org } = await authedProOrg();

  const [row] = await db
    .select()
    .from(schema.customDomains)
    .where(eq(schema.customDomains.id, domainId));
  if (!row || row.organizationId !== org.id) return { ok: false, error: 'Domain not found' };

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
      if (flat.includes(row.verificationToken ?? '')) verified = true;
    } catch {}
  }

  if (!verified) {
    return { ok: false, error: 'Could not verify DNS yet. Make sure the record has propagated (can take a few minutes), then try again.' };
  }

  await db.update(schema.customDomains).set({ verifiedAt: new Date() }).where(eq(schema.customDomains.id, domainId));
  revalidatePath('/dashboard/settings/domains');
  return { ok: true };
}

export async function deleteDomainAction(domainId: string) {
  const { org } = await authedProOrg();
  try {
    await db.delete(schema.customDomains)
      .where(eq(schema.customDomains.id, domainId));
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  revalidatePath('/dashboard/settings/domains');
  return { ok: true };
}
