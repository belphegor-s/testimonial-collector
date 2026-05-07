import { Polar } from '@polar-sh/sdk';

const POLAR_PLAN_KEY = 'kudoso_plan';
const POLAR_ADDON_KEY = 'kudoso_addon';

export type PolarPlanKey = 'pro_monthly' | 'pro_yearly';
export type ProductIds = Record<PolarPlanKey, string>;
export type AddonProductIds = Record<'credits_50' | 'credits_200' | 'credits_500', string>;

let cachedClient: Polar | null = null;
let cachedProducts: ProductIds | null = null;
let cachedAddonProducts: AddonProductIds | null = null;

export function polar() {
  if (!cachedClient) {
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('POLAR_ACCESS_TOKEN is not set');
    }
    const server = (process.env.POLAR_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
    cachedClient = new Polar({ accessToken, server });
  }
  return cachedClient;
}

export async function ensureProducts(): Promise<ProductIds> {
  if (cachedProducts) return cachedProducts;

  const client = polar();
  const orgId = process.env.POLAR_ORGANIZATION_ID || undefined;

  const existing: Record<string, string> = {};
  const iterator = await client.products.list({
    organizationId: orgId,
    isRecurring: true,
    isArchived: false,
    limit: 100,
  });

  for await (const page of iterator) {
    for (const product of page.result.items) {
      const planKey = (product.metadata as Record<string, unknown> | null | undefined)?.[POLAR_PLAN_KEY];
      if (typeof planKey === 'string' && (planKey === 'pro_monthly' || planKey === 'pro_yearly')) {
        existing[planKey] = product.id;
      }
    }
  }

  if (!existing.pro_monthly) {
    const product = await client.products.create({
      name: 'Kudoso Pro (Monthly)',
      description: 'Unlimited campaigns and testimonials, custom domains, priority support.',
      recurringInterval: 'month',
      metadata: { [POLAR_PLAN_KEY]: 'pro_monthly' },
      prices: [{ amountType: 'fixed', priceAmount: 1900, priceCurrency: 'usd' }],
      organizationId: orgId,
    });
    existing.pro_monthly = product.id;
  }

  if (!existing.pro_yearly) {
    const product = await client.products.create({
      name: 'Kudoso Pro (Yearly)',
      description: 'Unlimited campaigns and testimonials, custom domains, priority support. Save ~17% with annual billing.',
      recurringInterval: 'year',
      metadata: { [POLAR_PLAN_KEY]: 'pro_yearly' },
      prices: [{ amountType: 'fixed', priceAmount: 19000, priceCurrency: 'usd' }],
      organizationId: orgId,
    });
    existing.pro_yearly = product.id;
  }

  cachedProducts = {
    pro_monthly: existing.pro_monthly,
    pro_yearly: existing.pro_yearly,
  };
  return cachedProducts;
}

export async function ensureAddonProducts(): Promise<AddonProductIds> {
  if (cachedAddonProducts) return cachedAddonProducts;

  const client = polar();
  const orgId = process.env.POLAR_ORGANIZATION_ID || undefined;

  const existing: Record<string, string> = {};
  const iterator = await client.products.list({
    organizationId: orgId,
    isArchived: false,
    limit: 100,
  });

  for await (const page of iterator) {
    for (const product of page.result.items) {
      const addonKey = (product.metadata as Record<string, unknown> | null | undefined)?.[POLAR_ADDON_KEY];
      if (typeof addonKey === 'string' && addonKey.startsWith('credits_')) {
        existing[addonKey] = product.id;
      }
    }
  }

  const addonDefs: Array<{ key: string; name: string; amount: number; credits: number }> = [
    { key: 'credits_50', name: 'Kudoso AI Credits (50)', amount: 500, credits: 50 },
    { key: 'credits_200', name: 'Kudoso AI Credits (200)', amount: 1500, credits: 200 },
    { key: 'credits_500', name: 'Kudoso AI Credits (500)', amount: 2900, credits: 500 },
  ];

  for (const def of addonDefs) {
    if (!existing[def.key]) {
      const product = await client.products.create({
        name: def.name,
        description: `${def.credits} AI credits for summaries and sentiment analysis on Kudoso.`,
        metadata: { [POLAR_ADDON_KEY]: def.key, credits: String(def.credits) },
        prices: [{ amountType: 'fixed', priceAmount: def.amount, priceCurrency: 'usd' }],
        organizationId: orgId,
      });
      existing[def.key] = product.id;
    }
  }

  cachedAddonProducts = {
    credits_50: existing.credits_50,
    credits_200: existing.credits_200,
    credits_500: existing.credits_500,
  };
  return cachedAddonProducts;
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export type RecentOrder = {
  id: string;
  createdAt: Date;
  totalAmount: number;
  currency: string;
  status: string;
  productName: string;
  invoiceNumber: string | null;
};

export async function getRecentOrders(externalCustomerId: string, limit = 10): Promise<RecentOrder[]> {
  if (!externalCustomerId) return [];
  try {
    const iterator = await polar().orders.list({
      externalCustomerId,
      limit,
      sorting: ['-created_at'] as unknown as never,
    });
    const orders: RecentOrder[] = [];
    for await (const page of iterator) {
      for (const o of page.result.items as Array<{
        id: string;
        createdAt: Date;
        totalAmount: number;
        currency: string;
        status: string;
        invoiceNumber?: string | null;
        product?: { name: string };
      }>) {
        orders.push({
          id: o.id,
          createdAt: o.createdAt,
          totalAmount: o.totalAmount,
          currency: o.currency,
          status: o.status,
          productName: o.product?.name ?? 'Subscription',
          invoiceNumber: o.invoiceNumber ?? null,
        });
        if (orders.length >= limit) return orders;
      }
      if (orders.length >= limit) break;
    }
    return orders;
  } catch (err) {
    console.error('[polar] getRecentOrders failed', err);
    return [];
  }
}
