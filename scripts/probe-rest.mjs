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
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function probe(label, pathname) {
  const res = await fetch(`https://${host}${pathname}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  console.log(`\n=== ${label} => ${res.status} ===`);
  console.log(text.slice(0, 900));
}

await probe('products fk embed category/subcategory', '/rest/v1/products?select=*,category:categories!products_category_id_fkey(id,name,slug),subcategory:categories!products_subcategory_id_fkey(id,name,slug)&limit=2');

await probe('reviews join products+profiles', '/rest/v1/reviews?select=*,products(id,name,slug,images,vendor_id),profiles(first_name,last_name,profile_image_url)&limit=2');

await probe('seller_payouts join profiles', '/rest/v1/seller_payouts?select=*,profiles(first_name,last_name,email)&limit=2');

await probe('orders join profiles etc', '/rest/v1/orders?select=*,order_items(*),profiles(first_name,last_name)&limit=1');

await probe('product_summary view exists', '/rest/v1/product_summary?select=*&limit=2');

await probe('seller_dashboard view exists', '/rest/v1/seller_dashboard?select=*&limit=2');

await probe('order_summary view', '/rest/v1/order_summary?select=*&limit=2');