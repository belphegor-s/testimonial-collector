import { Polar } from '@polar-sh/sdk';

const POLAR_PLAN_KEY = 'kudoso_plan';

export type PolarPlanKey = 'pro_monthly' | 'pro_yearly';
export type ProductIds = Record<PolarPlanKey, string>;

let cachedClient: Polar | null = null;
let cachedProducts: ProductIds | null = null;

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

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
