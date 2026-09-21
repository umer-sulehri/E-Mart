import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
const env = {};
envText.split(/\r?\n/).forEach((line) => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
});

const host = new URL(env.NEXT_PUBLIC_SUPABASE_URL).host;
const res = await fetch(`https://${host}/rest/v1/`, {
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Accept: 'application/openapi+json',
  },
});
const spec = await res.json();
const defs = spec.definitions ?? {};

const wanted = ['products', 'coupons', 'seller_payouts', 'seller_payout_methods', 'reviews', 'settings', 'vendors', 'profiles', 'orders', 'order_items', 'sellers', 'brands', 'banners', 'categories', 'refunds', 'notifications', 'review_reports', 'review_helpful'];

for (const name of wanted) {
  const def = defs[name] || defs[`public.${name}`];
  if (!def) {
    console.log(`\n===== ${name} =====\n(MISSING)`);
    continue;
  }
  const cols = Object.keys(def.properties || {}).sort();
  console.log(`\n===== ${name} (${cols.length} cols) =====`);
  console.log(cols.join(', '));
}

console.log('\n\n===== products FK/property refs =====');
const pdef = defs['products'] || defs['public.products'];
if (pdef) {
  for (const [col, schema] of Object.entries(pdef.properties || {})) {
    console.log(col, '->', JSON.stringify(schema).slice(0, 260));
  }
}

console.log('\n\n===== all table names =====');
Object.keys(defs).forEach((k) => {
  const short = k.replace('public.', '');
  if (!short.includes('.')) console.log(short);
});