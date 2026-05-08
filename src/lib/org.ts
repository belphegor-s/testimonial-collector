import 'server-only';
import { cookies } from 'next/headers';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';

export const ACTIVE_ORG_COOKIE = 'kudoso-active-org';

export type OrgRole = 'owner' | 'admin' | 'member';
export type OrgPlan = 'free' | 'pro';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: OrgPlan;
  polar_customer_id: string | null;
  polar_subscription_id: string | null;
  plan_renews_at: string | null;
  is_personal: boolean;
  created_at: string;
};

export type ActiveOrg = Organization & { role: OrgRole };

export async function createPersonalOrg(userId: string, email: string): Promise<void> {
  const baseSlug = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'workspace';

  let slug = baseSlug;
  let i = 0;
  while (true) {
    const [existing] = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, slug));
    if (!existing) break;
    i++;
    slug = `${baseSlug}-${userId.replace(/-/g, '').slice(0, 4)}${i > 1 ? i : ''}`;
  }

  const [org] = await db.insert(schema.organizations).values({
    name: email.split('@')[0] || 'My workspace',
    slug,
    ownerId: userId,
    isPersonal: true,
  }).returning({ id: schema.organizations.id });

  if (!org) return;

  await db.insert(schema.organizationMembers).values({
    organizationId: org.id,
    userId,
    role: 'owner',
  }).onConflictDoNothing();

  // Auto-accept any pending invitations for this email
  const pendingInvites = await db
    .select({
      organizationId: schema.organizationInvitations.organizationId,
      role: schema.organizationInvitations.role,
      id: schema.organizationInvitations.id,
    })
    .from(schema.organizationInvitations)
    .where(and(
      eq(schema.organizationInvitations.email, email.toLowerCase()),
      isNull(schema.organizationInvitations.acceptedAt),
    ));

  for (const inv of pendingInvites) {
    await db.insert(schema.organizationMembers).values({
      organizationId: inv.organizationId,
      userId,
      role: inv.role,
    }).onConflictDoNothing();
    await db.update(schema.organizationInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(schema.organizationInvitations.id, inv.id));
  }

  await db.insert(schema.profiles).values({ id: userId }).onConflictDoNothing();
}

export async function listMyOrgs(userId: string): Promise<ActiveOrg[]> {
  const rows = await db
    .select({
      role: schema.organizationMembers.role,
      id: schema.organizations.id,
      name: schema.organizations.name,
      slug: schema.organizations.slug,
      ownerId: schema.organizations.ownerId,
      plan: schema.organizations.plan,
      polarCustomerId: schema.organizations.polarCustomerId,
      polarSubscriptionId: schema.organizations.polarSubscriptionId,
      planRenewsAt: schema.organizations.planRenewsAt,
      isPersonal: schema.organizations.isPersonal,
      createdAt: schema.organizations.createdAt,
    })
    .from(schema.organizationMembers)
    .innerJoin(schema.organizations, eq(schema.organizationMembers.organizationId, schema.organizations.id))
    .where(eq(schema.organizationMembers.userId, userId));

  return rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      owner_id: row.ownerId,
      plan: (row.plan as OrgPlan) ?? 'free',
      polar_customer_id: row.polarCustomerId ?? null,
      polar_subscription_id: row.polarSubscriptionId ?? null,
      plan_renews_at: row.planRenewsAt ? row.planRenewsAt.toISOString() : null,
      is_personal: row.isPersonal,
      created_at: row.createdAt.toISOString(),
      role: row.role as OrgRole,
    }))
    .sort((a, b) => {
      if (a.is_personal && !b.is_personal) return -1;
      if (!a.is_personal && b.is_personal) return 1;
      return a.name.localeCompare(b.name);
    });
}

export async function getActiveOrg(userId: string): Promise<ActiveOrg | null> {
  const orgs = await listMyOrgs(userId);
  if (orgs.length === 0) return null;

  const cookieStore = await cookies();
  const slug = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  if (slug) {
    const match = orgs.find((o) => o.slug === slug);
    if (match) return match;
  }
  return orgs[0];
}

export async function getOrgBySlug(slug: string, userId: string): Promise<ActiveOrg | null> {
  const orgs = await listMyOrgs(userId);
  return orgs.find((o) => o.slug === slug) ?? null;
}

export async function getOrgById(id: string): Promise<Organization | null> {
  const [row] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, id));
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    owner_id: row.ownerId,
    plan: (row.plan as OrgPlan) ?? 'free',
    polar_customer_id: row.polarCustomerId ?? null,
    polar_subscription_id: row.polarSubscriptionId ?? null,
    plan_renews_at: row.planRenewsAt ? row.planRenewsAt.toISOString() : null,
    is_personal: row.isPersonal,
    created_at: row.createdAt.toISOString(),
  };
}

export async function isMember(orgId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ userId: schema.organizationMembers.userId })
    .from(schema.organizationMembers)
    .where(and(eq(schema.organizationMembers.organizationId, orgId), eq(schema.organizationMembers.userId, userId)));
  return !!row;
}

export async function getMemberRole(orgId: string, userId: string): Promise<OrgRole | null> {
  const [row] = await db
    .select({ role: schema.organizationMembers.role })
    .from(schema.organizationMembers)
    .where(and(eq(schema.organizationMembers.organizationId, orgId), eq(schema.organizationMembers.userId, userId)));
  return (row?.role as OrgRole) ?? null;
}

export async function requireRole(orgId: string, userId: string, allowed: OrgRole[]): Promise<OrgRole> {
  const role = await getMemberRole(orgId, userId);
  if (!role) throw new Error('Not a member of this organization');
  if (!allowed.includes(role)) throw new Error('Insufficient permissions');
  return role;
}

export async function canAccessCampaign(userId: string, campaignId: string): Promise<{ ok: boolean; orgId?: string; role?: OrgRole }> {
  const [campaign] = await db
    .select({ organizationId: schema.campaigns.organizationId })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, campaignId));
  if (!campaign) return { ok: false };
  const role = await getMemberRole(campaign.organizationId, userId);
  if (!role) return { ok: false };
  return { ok: true, orgId: campaign.organizationId, role };
}
