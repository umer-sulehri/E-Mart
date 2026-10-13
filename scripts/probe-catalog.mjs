import fs from 'fs';
import path from 'path';

const envText = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = {};
envText.split(/\r?\n/).forEach((line) => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
});
const host = new URL(env.NEXT_PUBLIC_SUPABASE_URL).host;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function count(table, query = 'select=id') {
  const res = await fetch(`https://${host}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact', Range: '0-0' },
  });
  const range = res.headers.get('content-range');
  const total = range ? range.split('/')[1] : '?';
  console.log(`${table.padEnd(16)} ${res.status}  count=${total}`);
  return res;
}

async function list(table, select, extra = '') {
  const res = await fetch(`https://${host}/rest/v1/${table}?select=${select}${extra}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const json = await res.json();
  console.log(`\n== ${table} ==`);
  console.log(JSON.stringify(json, null, 1).slice(0, 2500));
}

await count('products');
await count('categories');
await count('brands');
await count('vendors');
await count('profiles');
console.log('');
await list('vendors', 'id,name,slug,status,user_id', '&limit=20');
await list('brands', 'id,name,slug', '&limit=30');
await list('categories', 'id,name,slug,parent_id', '&limit=30');
await list('products', 'id,name,category_id,vendor_id,status,is_active,images', '&limit=3');
