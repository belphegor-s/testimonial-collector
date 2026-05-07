#!/usr/bin/env node
// Run: node scripts/bootstrap-polar.mjs
// Creates Polar products (Pro monthly/yearly + AI credit add-ons) if they don't exist.
// Reads POLAR_ACCESS_TOKEN and POLAR_ENVIRONMENT from .env

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env
const envPath = resolve(__dirname, '../.env');
const env = {};
try {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
} catch {
  console.error('Could not read .env');
  process.exit(1);
}

const token = env.POLAR_ACCESS_TOKEN;
const server = env.POLAR_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

if (!token) {
  console.error('POLAR_ACCESS_TOKEN not set in .env');
  process.exit(1);
}

const BASE = server === 'production'
  ? 'https://api.polar.sh'
  : 'https://sandbox-api.polar.sh';

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Polar API ${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function listProducts() {
  const data = await api('GET', '/v1/products?limit=100&is_archived=false');
  return data.items ?? [];
}

const PLAN_KEY = 'kudoso_plan';
const ADDON_KEY = 'kudoso_addon';

const plans = [
  {
    key: 'pro_monthly',
    name: 'Kudoso Pro (Monthly)',
    description: 'Unlimited campaigns and testimonials, custom domains, AI credits, team members.',
    recurringInterval: 'month',
    price: 1900,
  },
  {
    key: 'pro_yearly',
    name: 'Kudoso Pro (Yearly)',
    description: 'Unlimited campaigns and testimonials, custom domains, AI credits, team members. Save ~17% vs monthly.',
    recurringInterval: 'year',
    price: 19000,
  },
];

const addons = [
  { key: 'credits_50',  name: 'Kudoso AI Credits (50)',  credits: 50,  price: 500  },
  { key: 'credits_200', name: 'Kudoso AI Credits (200)', credits: 200, price: 1500 },
  { key: 'credits_500', name: 'Kudoso AI Credits (500)', credits: 500, price: 2900 },
];

console.log(`\nPolar env: ${server} (${BASE})\n`);

const existing = await listProducts();
const byPlanKey = {};
const byAddonKey = {};
for (const p of existing) {
  const meta = p.metadata ?? {};
  if (meta[PLAN_KEY]) byPlanKey[meta[PLAN_KEY]] = p;
  if (meta[ADDON_KEY]) byAddonKey[meta[ADDON_KEY]] = p;
}

console.log('── Subscription plans ──');
for (const plan of plans) {
  if (byPlanKey[plan.key]) {
    console.log(`  ✓ ${plan.name} already exists (${byPlanKey[plan.key].id})`);
    continue;
  }
  const created = await api('POST', '/v1/products', {
    name: plan.name,
    description: plan.description,
    recurring_interval: plan.recurringInterval,
    metadata: { [PLAN_KEY]: plan.key },
    prices: [{ amount_type: 'fixed', price_amount: plan.price, price_currency: 'usd' }],
  });
  console.log(`  + Created ${plan.name} → ${created.id}`);
}

console.log('\n── AI credit add-ons ──');
for (const addon of addons) {
  if (byAddonKey[addon.key]) {
    console.log(`  ✓ ${addon.name} already exists (${byAddonKey[addon.key].id})`);
    continue;
  }
  const created = await api('POST', '/v1/products', {
    name: addon.name,
    description: `${addon.credits} AI credits for summaries and sentiment analysis on Kudoso.`,
    metadata: { [ADDON_KEY]: addon.key, credits: String(addon.credits) },
    prices: [{ amount_type: 'fixed', price_amount: addon.price, price_currency: 'usd' }],
  });
  console.log(`  + Created ${addon.name} → ${created.id}`);
}

console.log('\nDone.\n');
