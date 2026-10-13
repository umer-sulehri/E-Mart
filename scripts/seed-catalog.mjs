/**
 * E-Mart catalog seeder (2026)
 * ----------------------------------------------------------------------------
 * Seeds 100 original products spread across multiple SELLER ACCOUNTS / STORES,
 * CATEGORIES and BRANDS, each with a real, topically-matched, Creative-Commons
 * image from Wikimedia Commons (resolved via the keyless Openverse API).
 *
 * Idempotent: stores, brands and products are upserted on their unique slug, so
 * re-running only refreshes the affected rows.
 *
 * Usage:
 *   node scripts/seed-catalog.mjs            # seed for real
 *   node scripts/seed-catalog.mjs --images   # only (re)resolve + cache images
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
const env = {};
fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  });

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const HOST = new URL(SUPABASE_URL).host;
const IMAGE_CACHE = path.join(process.cwd(), 'data', 'seed-product-images.json');
const USER_AGENT = 'E-Mart-Catalog-Seeder/1.0 (https://emart.pk; dev@emart.pk)';

const rest = async (pathname, { method = 'GET', body, prefer } = {}) => {
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  if (body) headers['Content-Type'] = 'application/json';
  if (prefer) headers['Prefer'] = prefer;
  const res = await fetch(`https://${HOST}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error(`${method} ${pathname} -> ${res.status} ${text.slice(0, 300)}`);
  }
  return json;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Stores = seller accounts (profiles + vendors). New auth users auto-create a
// seller profile via the handle_new_user trigger.
// ---------------------------------------------------------------------------
const STORES = [
  { slug: 'sunrise-grocers', name: 'Sunrise Grocers', email: 'seller.sunrise@emart.com', first: 'Sunrise', last: 'Grocers', commission: 9, desc: 'Farm-fresh fruits and vegetables picked daily.' },
  { slug: 'dairy-direct', name: 'Dairy Direct Farms', email: 'seller.dairy@emart.com', first: 'Dairy', last: 'Direct', commission: 8, desc: 'Milk, cheese, yogurt and eggs straight from the farm.' },
  { slug: 'prime-cut', name: 'Prime Cut Meats', email: 'seller.meats@emart.com', first: 'Prime', last: 'Cut', commission: 11, desc: 'Butcher-fresh halal meat and poultry.' },
  { slug: 'ocean-catch', name: 'Ocean Catch Seafoods', email: 'seller.seafood@emart.com', first: 'Ocean', last: 'Catch', commission: 12, desc: 'Fresh and frozen seafood sourced daily.' },
  { slug: 'golden-crumb', name: 'Golden Crumb Bakery', email: 'seller.bakery@emart.com', first: 'Golden', last: 'Crumb', commission: 10, desc: 'Artisan breads, cakes and pastries baked fresh.' },
  { slug: 'pantry-pride', name: 'Pantry Pride', email: 'seller.pantry@emart.com', first: 'Pantry', last: 'Pride', commission: 9, desc: 'Canned goods, pantry staples, rice and spices.' },
  { slug: 'frostbite', name: 'Frostbite Frozen Foods', email: 'seller.frozen@emart.com', first: 'Frostbite', last: 'Foods', commission: 10, desc: 'Frozen meals, vegetables and treats.' },
  { slug: 'snack-attack', name: 'Snack Attack Mart', email: 'seller.snacks2@emart.com', first: 'Snack', last: 'Attack', commission: 12, desc: 'Snacks, chips, nuts and refreshing drinks.' },
  { slug: 'wellness-world', name: 'Wellness World', email: 'seller.wellness@emart.com', first: 'Wellness', last: 'World', commission: 13, desc: 'Health supplements, wellness and baby care.' },
  { slug: 'cleanhome-glow', name: 'CleanHome & Glow', email: 'seller.care@emart.com', first: 'CleanHome', last: 'Glow', commission: 11, desc: 'Household cleaners and personal care essentials.' },
  { slug: 'happy-paws', name: 'Happy Paws Supplies', email: 'seller.pets@emart.com', first: 'Happy', last: 'Paws', commission: 10, desc: 'Everything for your dogs, cats and pets.' },
];
const STORE_PASSWORD = 'Seller@2026#Emart';

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------
const BRANDS = [
  { slug: 'natures-best', name: "Nature's Best", desc: 'Sun-ripened produce from certified farms.' },
  { slug: 'daily-moo', name: 'Daily Moo', desc: 'Dairy made from pure, grass-fed milk.' },
  { slug: 'meadow-eggs', name: 'Meadow Eggs', desc: 'Free-range eggs from happy hens.' },
  { slug: 'prime-cut-select', name: 'Prime Cut Select', desc: 'Premium cuts, butchered fresh.' },
  { slug: 'ocean-catch-brand', name: 'Ocean Catch', desc: 'Sustainably sourced seafood.' },
  { slug: 'golden-crumb-brand', name: 'Golden Crumb', desc: 'Artisan bakery, baked daily.' },
  { slug: 'pantry-pride-brand', name: 'Pantry Pride', desc: 'Reliable pantry essentials.' },
  { slug: 'hearty-harvest', name: 'Hearty Harvest', desc: 'Grains, rice and breakfast staples.' },
  { slug: 'frostbite-brand', name: 'Frostbite', desc: 'Flash-frozen for peak freshness.' },
  { slug: 'crunch-time', name: 'Crunch Time', desc: 'Snacks that satisfy every craving.' },
  { slug: 'sip-fresh', name: 'Sip Fresh', desc: 'Refreshing juices and drinks.' },
  { slug: 'spice-route', name: 'Spice Route', desc: 'Aromatic spices ground for flavour.' },
  { slug: 'tiny-tots-brand', name: 'Tiny Tots', desc: 'Gentle nutrition for little ones.' },
  { slug: 'vital-life', name: 'Vital Life', desc: 'Vitamins and supplements you can trust.' },
  { slug: 'cleanhome-brand', name: 'CleanHome', desc: 'Tough on grime, kind to your home.' },
  { slug: 'glow-care', name: 'GlowCare', desc: 'Everyday personal care, made gentle.' },
  { slug: 'happy-paws-brand', name: 'Happy Paws', desc: 'Nutrition and care for pets.' },
];

// ---------------------------------------------------------------------------
// 100 products.  c=category  s=store  b=brand  p=price  d=discount(null)
// q=stock  r=rating  rc=reviewCount  f=featured  n=new  img=image keyword
// ---------------------------------------------------------------------------
const CAT = 'fruits-vegetables', DAIRY = 'dairy-eggs', MEAT = 'meat-poultry', SEA = 'seafood',
  BK = 'bakery', CAN = 'canned-goods', FRO = 'frozen-foods', PR = 'pasta-rice', BRK = 'breakfast',
  SN = 'snacks', BV = 'beverages', SP = 'spices-seasonings', BF = 'baby-food-formula',
  HW = 'health-wellness', HH = 'household-supplies', PC = 'personal-care', PET = 'pet-food-supplies';

const PRODUCTS = [
  // Fruits & Vegetables (8) — Sunrise Grocers
  { s: 'fresh-red-apples-1kg', n: 'Fresh Red Apples (1 kg)', c: CAT, st: 'sunrise-grocers', b: 'natures-best', sku: 'FV-101', p: 720, d: 649, q: 240, r: 4.7, rc: 186, f: true, nw: false, tags: ['fruits', 'apples', 'fresh'], img: 'red apples', desc: 'Sweet, crisp red apples hand-picked from Himalayan orchards — perfect for snacking and baking.' },
  { s: 'ripe-bananas-1-dozen', n: 'Ripe Bananas (1 dozen)', c: CAT, st: 'sunrise-grocers', b: 'natures-best', sku: 'FV-102', p: 360, d: null, q: 300, r: 4.6, rc: 214, f: false, nw: false, tags: ['fruits', 'bananas'], img: 'bananas', desc: 'Naturally ripened bananas rich in potassium and energy for your daily routine.' },
  { s: 'seedless-grapes-500g', n: 'Seedless Grapes (500 g)', c: CAT, st: 'sunrise-grocers', b: 'natures-best', sku: 'FV-103', p: 540, d: 480, q: 160, r: 4.5, rc: 92, f: false, nw: true, tags: ['fruits', 'grapes'], img: 'grapes', desc: 'Plump, juicy seedless grapes with a naturally sweet flavour.' },
  { s: 'fresh-carrots-1kg', n: 'Fresh Carrots (1 kg)', c: CAT, st: 'sunrise-grocers', b: 'natures-best', sku: 'FV-104', p: 260, d: null, q: 280, r: 4.4, rc: 74, f: false, nw: false, tags: ['vegetables', 'carrots'], img: 'carrots', desc: 'Crunchy, vitamin-A packed carrots ideal for salads, juices and curries.' },
  { s: 'green-capsicum-500g', n: 'Green Capsicum (500 g)', c: CAT, st: 'sunrise-grocers', b: 'natures-best', sku: 'FV-105', p: 300, d: null, q: 180, r: 4.3, rc: 51, f: false, nw: false, tags: ['vegetables', 'capsicum'], img: 'green bell pepper', desc: 'Firm, glossy green capsicum with a mild, refreshing crunch.' },
  { s: 'fresh-red-onions-2kg', n: 'Fresh Red Onions (2 kg)', c: CAT, st: 'sunrise-grocers', b: 'natures-best', sku: 'FV-106', p: 380, d: null, q: 320, r: 4.2, rc: 63, f: false, nw: false, tags: ['vegetables', 'onions'], img: 'red onions', desc: 'Everyday cooking onions with a bold flavour, sourced from local farms.' },
  { s: 'baby-spinach-250g', n: 'Baby Spinach (250 g)', c: CAT, st: 'sunrise-grocers', b: 'natures-best', sku: 'FV-107', p: 249, d: null, q: 140, r: 4.5, rc: 88, f: false, nw: true, tags: ['vegetables', 'spinach', 'organic'], img: 'spinach leaves', desc: 'Tender, pre-washed baby spinach leaves packed with iron and folate.' },
  { s: 'iceberg-lettuce-head', n: 'Iceberg Lettuce (1 head)', c: CAT, st: 'sunrise-grocers', b: 'natures-best', sku: 'FV-108', p: 220, d: null, q: 130, r: 4.1, rc: 37, f: false, nw: false, tags: ['vegetables', 'lettuce'], img: 'iceberg lettuce', desc: 'Crisp, refreshing iceberg lettuce for salads and burgers.' },

  // Dairy & Eggs (8) — Dairy Direct
  { s: 'full-cream-milk-1l', n: 'Full Cream Milk (1 L)', c: DAIRY, st: 'dairy-direct', b: 'daily-moo', sku: 'DE-101', p: 300, d: null, q: 500, r: 4.6, rc: 240, f: false, nw: false, tags: ['dairy', 'milk', 'fresh'], img: 'milk bottle', desc: 'Pasteurised full cream milk from grass-fed herds — rich, creamy and fresh.' },
  { s: 'creamy-plain-yogurt-500g', n: 'Creamy Plain Yogurt (500 g)', c: DAIRY, st: 'dairy-direct', b: 'daily-moo', sku: 'DE-102', p: 400, d: null, q: 220, r: 4.5, rc: 96, f: false, nw: false, tags: ['dairy', 'yogurt'], img: 'yogurt bowl', desc: 'Thick, creamy yogurt with live cultures and no added sugar.' },
  { s: 'desi-butter-200g', n: 'Desi Butter (200 g)', c: DAIRY, st: 'dairy-direct', b: 'daily-moo', sku: 'DE-103', p: 700, d: 640, q: 150, r: 4.7, rc: 112, f: true, nw: false, tags: ['dairy', 'butter'], img: 'butter', desc: 'Churned sweet cream butter with a rich, traditional taste.' },
  { s: 'mozzarella-cheese-250g', n: 'Mozzarella Cheese (250 g)', c: DAIRY, st: 'dairy-direct', b: 'daily-moo', sku: 'DE-104', p: 850, d: null, q: 120, r: 4.6, rc: 84, f: false, nw: true, tags: ['dairy', 'cheese'], img: 'mozzarella cheese', desc: 'Soft, stretchy mozzarella ideal for pizzas and pasta bakes.' },
  { s: 'free-range-eggs-12-pack', n: 'Free-Range Eggs (12 pack)', c: DAIRY, st: 'dairy-direct', b: 'meadow-eggs', sku: 'DE-105', p: 520, d: 470, q: 300, r: 4.7, rc: 198, f: true, nw: false, tags: ['eggs', 'protein'], img: 'eggs', desc: 'Free-range brown eggs, high in protein and freshly packed.' },
  { s: 'fresh-cream-200ml', n: 'Fresh Cream (200 ml)', c: DAIRY, st: 'dairy-direct', b: 'daily-moo', sku: 'DE-106', p: 480, d: null, q: 160, r: 4.4, rc: 58, f: false, nw: false, tags: ['dairy', 'cream'], img: 'cream', desc: 'Smooth whipping cream for desserts, coffee and cooking.' },
  { s: 'greek-yogurt-500g', n: 'Greek Yogurt (500 g)', c: DAIRY, st: 'dairy-direct', b: 'daily-moo', sku: 'DE-107', p: 420, d: null, q: 200, r: 4.5, rc: 70, f: false, nw: true, tags: ['dairy', 'yogurt', 'healthy'], img: 'greek yogurt', desc: 'Strained Greek yogurt with double the protein and a tangy finish.' },
  { s: 'cheddar-cheese-block-400g', n: 'Cheddar Cheese Block (400 g)', c: DAIRY, st: 'dairy-direct', b: 'daily-moo', sku: 'DE-108', p: 950, d: null, q: 110, r: 4.5, rc: 66, f: false, nw: false, tags: ['dairy', 'cheese', 'imported'], img: 'cheddar cheese', desc: 'Aged cheddar with a sharp, nutty flavour for sandwiches and sauces.' },

  // Meat & Poultry (7) — Prime Cut Meats
  { s: 'chicken-breast-1kg', n: 'Chicken Breast (1 kg)', c: MEAT, st: 'prime-cut', b: 'prime-cut-select', sku: 'MP-101', p: 1550, d: null, q: 180, r: 4.5, rc: 142, f: false, nw: false, tags: ['meat', 'chicken', 'fresh'], img: 'chicken breast', desc: 'Skinless, boneless chicken breast — lean, tender and versatile.' },
  { s: 'beef-steak-500g', n: 'Beef Steak (500 g)', c: MEAT, st: 'prime-cut', b: 'prime-cut-select', sku: 'MP-102', p: 1800, d: 1650, q: 90, r: 4.6, rc: 77, f: true, nw: false, tags: ['meat', 'beef', 'halal'], img: 'beef steak', desc: 'Choicely cut beef steaks, aged for tenderness and flavour.' },
  { s: 'mutton-chops-1kg', n: 'Mutton Chops (1 kg)', c: MEAT, st: 'prime-cut', b: 'prime-cut-select', sku: 'MP-103', p: 2600, d: null, q: 70, r: 4.5, rc: 54, f: false, nw: true, tags: ['meat', 'mutton', 'halal'], img: 'lamb chops', desc: 'Tender mutton chops, perfect for grilling and curries.' },
  { s: 'whole-chicken-1-2kg', n: 'Whole Chicken (1.2 kg)', c: MEAT, st: 'prime-cut', b: 'prime-cut-select', sku: 'MP-104', p: 1250, d: null, q: 140, r: 4.4, rc: 98, f: false, nw: false, tags: ['meat', 'chicken', 'halal'], img: 'whole chicken', desc: 'Whole dressed chicken, cleaned and ready to roast or curry.' },
  { s: 'chicken-wings-1kg', n: 'Chicken Wings (1 kg)', c: MEAT, st: 'prime-cut', b: 'prime-cut-select', sku: 'MP-105', p: 1050, d: 950, q: 130, r: 4.5, rc: 61, f: false, nw: true, tags: ['meat', 'chicken', 'snack'], img: 'chicken wings', desc: 'Juicy chicken wings ideal for frying, grilling and baking.' },
  { s: 'turkey-slices-250g', n: 'Turkey Slices (250 g)', c: MEAT, st: 'prime-cut', b: 'prime-cut-select', sku: 'MP-106', p: 950, d: null, q: 80, r: 4.3, rc: 34, f: false, nw: false, tags: ['meat', 'turkey', 'deli'], img: 'turkey slices', desc: 'Lean, oven-roasted turkey slices for sandwiches and platters.' },
  { s: 'beef-keema-500g', n: 'Beef Keema (500 g)', c: MEAT, st: 'prime-cut', b: 'prime-cut-select', sku: 'MP-107', p: 1150, d: null, q: 110, r: 4.4, rc: 72, f: false, nw: false, tags: ['meat', 'beef', 'mince'], img: 'minced meat', desc: 'Freshly ground beef mince, perfect for koftas, burgers and curries.' },

  // Seafood (5) — Ocean Catch
  { s: 'tiger-prawns-500g', n: 'Tiger Prawns (500 g)', c: SEA, st: 'ocean-catch', b: 'ocean-catch-brand', sku: 'SF-101', p: 2200, d: 1990, q: 60, r: 4.7, rc: 58, f: true, nw: false, tags: ['seafood', 'prawns'], img: 'prawns shrimp', desc: 'Plump, sweet tiger prawns, cleaned and deveined.' },
  { s: 'basa-fillet-1kg', n: 'Basa Fillet (1 kg)', c: SEA, st: 'ocean-catch', b: 'ocean-catch-brand', sku: 'SF-102', p: 1350, d: null, q: 80, r: 4.3, rc: 41, f: false, nw: false, tags: ['seafood', 'fish'], img: 'fish fillet', desc: 'Mild, flaky basa fillets that cook in minutes.' },
  { s: 'fresh-salmon-steak-400g', n: 'Fresh Salmon Steak (400 g)', c: SEA, st: 'ocean-catch', b: 'ocean-catch-brand', sku: 'SF-103', p: 3200, d: null, q: 40, r: 4.8, rc: 47, f: true, nw: true, tags: ['seafood', 'salmon', 'omega3'], img: 'salmon fillet', desc: 'Omega-3 rich salmon steaks, cut fresh to order.' },
  { s: 'sardines-500g', n: 'Fresh Sardines (500 g)', c: SEA, st: 'ocean-catch', b: 'ocean-catch-brand', sku: 'SF-104', p: 900, d: null, q: 90, r: 4.2, rc: 29, f: false, nw: false, tags: ['seafood', 'fish'], img: 'sardines', desc: 'Fresh sardines, great for frying and grilling.' },
  { s: 'crab-claws-500g', n: 'Crab Claws (500 g)', c: SEA, st: 'ocean-catch', b: 'ocean-catch-brand', sku: 'SF-105', p: 2400, d: null, q: 35, r: 4.6, rc: 26, f: false, nw: true, tags: ['seafood', 'crab'], img: 'crab claws', desc: 'Sweet, meaty crab claws delivered chilled.' },

  // Bakery (7) — Golden Crumb
  { s: 'sourdough-loaf-800g', n: 'Sourdough Loaf (800 g)', c: BK, st: 'golden-crumb', b: 'golden-crumb-brand', sku: 'BK-101', p: 650, d: null, q: 60, r: 4.6, rc: 73, f: false, nw: false, tags: ['bakery', 'bread'], img: 'sourdough bread', desc: 'Slow-fermented sourdough with a crackling crust and tangy crumb.' },
  { s: 'multigrain-bread-700g', n: 'Multigrain Bread (700 g)', c: BK, st: 'golden-crumb', b: 'golden-crumb-brand', sku: 'BK-102', p: 480, d: 430, q: 90, r: 4.5, rc: 61, f: false, nw: false, tags: ['bakery', 'bread', 'healthy'], img: 'multigrain bread', desc: 'Hearty multigrain loaf baked with seeds and whole grains.' },
  { s: 'chocolate-chip-cookies-300g', n: 'Chocolate Chip Cookies (300 g)', c: BK, st: 'golden-crumb', b: 'golden-crumb-brand', sku: 'BK-103', p: 550, d: null, q: 120, r: 4.6, rc: 88, f: true, nw: false, tags: ['bakery', 'cookies', 'dessert'], img: 'chocolate chip cookies', desc: 'Buttery cookies loaded with melting chocolate chips.' },
  { s: 'blueberry-muffins-6-pack', n: 'Blueberry Muffins (6 pack)', c: BK, st: 'golden-crumb', b: 'golden-crumb-brand', sku: 'BK-104', p: 720, d: null, q: 50, r: 4.5, rc: 44, f: false, nw: true, tags: ['bakery', 'muffins'], img: 'blueberry muffins', desc: 'Fluffy muffins bursting with juicy blueberries.' },
  { s: 'red-velvet-cake-1kg', n: 'Red Velvet Cake (1 kg)', c: BK, st: 'golden-crumb', b: 'golden-crumb-brand', sku: 'BK-105', p: 2500, d: 2200, q: 25, r: 4.8, rc: 132, f: true, nw: false, tags: ['bakery', 'cake', 'dessert'], img: 'red velvet cake', desc: 'Moist red velvet sponge layered with cream-cheese frosting.' },
  { s: 'french-baguette-400g', n: 'French Baguette (400 g)', c: BK, st: 'golden-crumb', b: 'golden-crumb-brand', sku: 'BK-106', p: 420, d: null, q: 70, r: 4.4, rc: 39, f: false, nw: false, tags: ['bakery', 'bread'], img: 'baguette', desc: 'Crisp French baguette with a soft, airy centre.' },
  { s: 'cinnamon-rolls-4-pack', n: 'Cinnamon Rolls (4 pack)', c: BK, st: 'golden-crumb', b: 'golden-crumb-brand', sku: 'BK-107', p: 680, d: null, q: 45, r: 4.7, rc: 66, f: false, nw: true, tags: ['bakery', 'dessert'], img: 'cinnamon rolls', desc: 'Warm, gooey cinnamon rolls glazed to perfection.' },

  // Canned Goods (5) — Pantry Pride
  { s: 'baked-beans-420g', n: 'Baked Beans (420 g)', c: CAN, st: 'pantry-pride', b: 'pantry-pride-brand', sku: 'CN-101', p: 420, d: null, q: 200, r: 4.3, rc: 55, f: false, nw: false, tags: ['canned', 'beans', 'pantry'], img: 'baked beans', desc: 'Beans slow-cooked in a rich tomato sauce, ready in minutes.' },
  { s: 'sweet-corn-400g', n: 'Sweet Corn (400 g)', c: CAN, st: 'pantry-pride', b: 'pantry-pride-brand', sku: 'CN-102', p: 380, d: null, q: 210, r: 4.2, rc: 42, f: false, nw: false, tags: ['canned', 'corn'], img: 'canned sweet corn', desc: 'Golden sweet corn kernels, perfect for salads and sides.' },
  { s: 'sliced-mushrooms-400g', n: 'Sliced Mushrooms (400 g)', c: CAN, st: 'pantry-pride', b: 'pantry-pride-brand', sku: 'CN-103', p: 450, d: null, q: 150, r: 4.3, rc: 36, f: false, nw: true, tags: ['canned', 'mushrooms'], img: 'canned mushrooms', desc: 'Tender sliced mushrooms, ready to toss into any recipe.' },
  { s: 'green-peas-400g', n: 'Green Peas (400 g)', c: CAN, st: 'pantry-pride', b: 'pantry-pride-brand', sku: 'CN-104', p: 360, d: null, q: 220, r: 4.2, rc: 31, f: false, nw: false, tags: ['canned', 'peas'], img: 'canned green peas', desc: 'Sweet garden peas preserved at their freshest.' },
  { s: 'corned-beef-340g', n: 'Corned Beef (340 g)', c: CAN, st: 'pantry-pride', b: 'pantry-pride-brand', sku: 'CN-105', p: 980, d: 890, q: 110, r: 4.5, rc: 88, f: true, nw: false, tags: ['canned', 'beef', 'protein'], img: 'corned beef', desc: 'Premium corned beef, a hearty pantry staple.' },

  // Frozen Foods (5) — Frostbite
  { s: 'frozen-green-peas-1kg', n: 'Frozen Green Peas (1 kg)', c: FRO, st: 'frostbite', b: 'frostbite-brand', sku: 'FR-101', p: 680, d: null, q: 160, r: 4.3, rc: 58, f: false, nw: false, tags: ['frozen', 'vegetables'], img: 'frozen peas', desc: 'Garden peas flash-frozen to lock in sweetness and colour.' },
  { s: 'frozen-french-fries-1kg', n: 'Frozen French Fries (1 kg)', c: FRO, st: 'frostbite', b: 'frostbite-brand', sku: 'FR-102', p: 750, d: 680, q: 200, r: 4.4, rc: 121, f: false, nw: false, tags: ['frozen', 'snack'], img: 'french fries', desc: 'Crispy-on-the-outside, fluffy-on-the-inside classic fries.' },
  { s: 'frozen-berry-mix-500g', n: 'Frozen Berry Mix (500 g)', c: FRO, st: 'frostbite', b: 'frostbite-brand', sku: 'FR-103', p: 1150, d: null, q: 90, r: 4.6, rc: 47, f: true, nw: true, tags: ['frozen', 'berries', 'healthy'], img: 'frozen berries', desc: 'A colourful mix of strawberries, blueberries and raspberries.' },
  { s: 'frozen-parathas-5-pack', n: 'Frozen Parathas (5 pack)', c: FRO, st: 'frostbite', b: 'frostbite-brand', sku: 'FR-104', p: 620, d: null, q: 130, r: 4.5, rc: 84, f: false, nw: false, tags: ['frozen', 'breakfast'], img: 'paratha flatbread', desc: 'Flaky layered parathas, cooked straight from frozen.' },
  { s: 'frozen-margherita-pizza', n: 'Frozen Margherita Pizza', c: FRO, st: 'frostbite', b: 'frostbite-brand', sku: 'FR-105', p: 950, d: null, q: 75, r: 4.4, rc: 63, f: false, nw: true, tags: ['frozen', 'pizza'], img: 'margherita pizza', desc: 'Stone-baked pizza base with mozzarella and tomato.' },

  // Pasta & Rice (6) — Pantry Pride
  { s: 'fusilli-pasta-500g', n: 'Fusilli Pasta (500 g)', c: PR, st: 'pantry-pride', b: 'hearty-harvest', sku: 'PR-101', p: 430, d: null, q: 240, r: 4.4, rc: 67, f: false, nw: false, tags: ['pasta', 'pantry'], img: 'fusilli pasta', desc: 'Durum wheat fusilli with spirals that hold every sauce.' },
  { s: 'brown-rice-2kg', n: 'Brown Rice (2 kg)', c: PR, st: 'pantry-pride', b: 'hearty-harvest', sku: 'PR-102', p: 1450, d: 1290, q: 150, r: 4.5, rc: 92, f: false, nw: false, tags: ['rice', 'healthy'], img: 'brown rice', desc: 'Wholesome wholegrain brown rice, high in fibre.' },
  { s: 'sella-basmati-rice-5kg', n: 'Sella Basmati Rice (5 kg)', c: PR, st: 'pantry-pride', b: 'hearty-harvest', sku: 'PR-103', p: 3600, d: null, q: 120, r: 4.8, rc: 205, f: true, nw: false, tags: ['rice', 'basmati', 'staple'], img: 'basmati rice', desc: 'Extra-long grain sella basmati, aged for perfect fluffiness.' },
  { s: 'egg-noodles-400g', n: 'Egg Noodles (400 g)', c: PR, st: 'pantry-pride', b: 'hearty-harvest', sku: 'PR-104', p: 480, d: null, q: 180, r: 4.3, rc: 48, f: false, nw: true, tags: ['noodles', 'pantry'], img: 'egg noodles', desc: 'Springy egg noodles, ready in three minutes.' },
  { s: 'vermicelli-200g', n: 'Vermicelli (200 g)', c: PR, st: 'pantry-pride', b: 'hearty-harvest', sku: 'PR-105', p: 220, d: null, q: 260, r: 4.2, rc: 39, f: false, nw: false, tags: ['pasta', 'dessert'], img: 'vermicelli', desc: 'Fine vermicelli for kheer, stir-fries and soups.' },
  { s: 'macaroni-500g', n: 'Macaroni (500 g)', c: PR, st: 'pantry-pride', b: 'hearty-harvest', sku: 'PR-106', p: 420, d: null, q: 220, r: 4.3, rc: 55, f: false, nw: false, tags: ['pasta', 'pantry'], img: 'macaroni', desc: 'Classic elbow macaroni for bakes, salads and mac & cheese.' },

  // Breakfast (5) — Golden Crumb
  { s: 'granola-mix-500g', n: 'Granola Mix (500 g)', c: BRK, st: 'golden-crumb', b: 'hearty-harvest', sku: 'BR-101', p: 980, d: null, q: 110, r: 4.5, rc: 72, f: true, nw: false, tags: ['breakfast', 'healthy'], img: 'granola', desc: 'Oats, nuts and honey baked into crunchy clusters.' },
  { s: 'peanut-butter-400g', n: 'Peanut Butter (400 g)', c: BRK, st: 'golden-crumb', b: 'hearty-harvest', sku: 'BR-102', p: 850, d: 780, q: 160, r: 4.6, rc: 104, f: false, nw: false, tags: ['breakfast', 'spread'], img: 'peanut butter', desc: 'Creamy, all-natural peanut butter with no added sugar.' },
  { s: 'strawberry-jam-400g', n: 'Strawberry Jam (400 g)', c: BRK, st: 'golden-crumb', b: 'hearty-harvest', sku: 'BR-103', p: 720, d: null, q: 140, r: 4.4, rc: 58, f: false, nw: false, tags: ['breakfast', 'spread'], img: 'strawberry jam', desc: 'Sweet strawberry jam made with real fruit.' },
  { s: 'muesli-750g', n: 'Muesli (750 g)', c: BRK, st: 'golden-crumb', b: 'hearty-harvest', sku: 'BR-104', p: 1250, d: null, q: 100, r: 4.5, rc: 61, f: false, nw: true, tags: ['breakfast', 'cereal', 'healthy'], img: 'muesli', desc: 'A wholesome blend of oats, dried fruit and seeds.' },
  { s: 'choco-spread-350g', n: 'Choco Spread (350 g)', c: BRK, st: 'golden-crumb', b: 'hearty-harvest', sku: 'BR-105', p: 950, d: null, q: 150, r: 4.6, rc: 97, f: false, nw: false, tags: ['breakfast', 'spread', 'dessert'], img: 'chocolate spread', desc: 'Smooth chocolate hazelnut spread kids adore.' },

  // Snacks (6) — Snack Attack Mart
  { s: 'salted-crackers-200g', n: 'Salted Crackers (200 g)', c: SN, st: 'snack-attack', b: 'crunch-time', sku: 'SN-101', p: 320, d: null, q: 260, r: 4.2, rc: 64, f: false, nw: false, tags: ['snacks', 'crackers'], img: 'crackers', desc: 'Light, crisp salted crackers for cheese and dips.' },
  { s: 'nacho-chips-150g', n: 'Nacho Chips (150 g)', c: SN, st: 'snack-attack', b: 'crunch-time', sku: 'SN-102', p: 380, d: null, q: 300, r: 4.3, rc: 88, f: false, nw: false, tags: ['snacks', 'chips'], img: 'nacho chips tortilla', desc: 'Crunchy tortilla chips with a hint of spice.' },
  { s: 'trail-mix-300g', n: 'Trail Mix (300 g)', c: SN, st: 'snack-attack', b: 'crunch-time', sku: 'SN-103', p: 950, d: 850, q: 140, r: 4.6, rc: 51, f: true, nw: false, tags: ['snacks', 'nuts', 'healthy'], img: 'trail mix nuts', desc: 'Nuts, raisins and seeds for an energy-boosting snack.' },
  { s: 'salted-popcorn-100g', n: 'Salted Popcorn (100 g)', c: SN, st: 'snack-attack', b: 'crunch-time', sku: 'SN-104', p: 280, d: null, q: 320, r: 4.2, rc: 73, f: false, nw: false, tags: ['snacks', 'popcorn'], img: 'popcorn', desc: 'Air-popped corn, lightly salted and ready to munch.' },
  { s: 'roasted-cashews-250g', n: 'Roasted Cashews (250 g)', c: SN, st: 'snack-attack', b: 'crunch-time', sku: 'SN-105', p: 1450, d: null, q: 110, r: 4.7, rc: 96, f: false, nw: true, tags: ['snacks', 'nuts'], img: 'cashews', desc: 'Creamy roasted cashews, lightly salted.' },
  { s: 'granola-bars-6-pack', n: 'Granola Bars (6 pack)', c: SN, st: 'snack-attack', b: 'crunch-time', sku: 'SN-106', p: 720, d: null, q: 170, r: 4.4, rc: 58, f: false, nw: false, tags: ['snacks', 'healthy'], img: 'granola bars', desc: 'Chewy oat and honey bars for on-the-go energy.' },

  // Beverages (6) — Snack Attack Mart
  { s: 'sparkling-water-1l', n: 'Sparkling Water (1 L)', c: BV, st: 'snack-attack', b: 'sip-fresh', sku: 'BV-101', p: 260, d: null, q: 400, r: 4.3, rc: 66, f: false, nw: false, tags: ['beverages', 'water'], img: 'sparkling water', desc: 'Crisp, naturally carbonated sparkling water.' },
  { s: 'mango-juice-1l', n: 'Mango Juice (1 L)', c: BV, st: 'snack-attack', b: 'sip-fresh', sku: 'BV-102', p: 380, d: 340, q: 260, r: 4.6, rc: 154, f: true, nw: false, tags: ['beverages', 'juice'], img: 'mango juice', desc: 'Thick, sweet mango nectar made from ripe mangoes.' },
  { s: 'apple-juice-1l', n: 'Apple Juice (1 L)', c: BV, st: 'snack-attack', b: 'sip-fresh', sku: 'BV-103', p: 360, d: null, q: 240, r: 4.4, rc: 81, f: false, nw: false, tags: ['beverages', 'juice'], img: 'apple juice', desc: '100% pressed apple juice with no added sugar.' },
  { s: 'cold-brew-coffee-330ml', n: 'Cold Brew Coffee (330 ml)', c: BV, st: 'snack-attack', b: 'sip-fresh', sku: 'BV-104', p: 520, d: null, q: 180, r: 4.7, rc: 92, f: true, nw: true, tags: ['beverages', 'coffee'], img: 'cold brew coffee', desc: 'Smooth, slow-steeped cold brew for a gentle caffeine lift.' },
  { s: 'lemonade-1-5l', n: 'Lemonade (1.5 L)', c: BV, st: 'snack-attack', b: 'sip-fresh', sku: 'BV-105', p: 300, d: null, q: 280, r: 4.3, rc: 74, f: false, nw: false, tags: ['beverages', 'juice'], img: 'lemonade', desc: 'Tangy-sweet lemonade, best served ice cold.' },
  { s: 'almond-milk-1l', n: 'Almond Milk (1 L)', c: BV, st: 'snack-attack', b: 'sip-fresh', sku: 'BV-106', p: 650, d: null, q: 150, r: 4.5, rc: 63, f: false, nw: true, tags: ['beverages', 'dairy-free', 'healthy'], img: 'almond milk', desc: 'Creamy unsweetened almond milk, dairy-free and light.' },

  // Spices & Seasonings (5) — Pantry Pride
  { s: 'red-chilli-powder-200g', n: 'Red Chilli Powder (200 g)', c: SP, st: 'pantry-pride', b: 'spice-route', sku: 'SP-101', p: 320, d: null, q: 280, r: 4.4, rc: 59, f: false, nw: false, tags: ['spices', 'cooking'], img: 'chili powder', desc: 'Vibrant, fiery red chilli powder ground from dried chillies.' },
  { s: 'cumin-seeds-200g', n: 'Cumin Seeds (200 g)', c: SP, st: 'pantry-pride', b: 'spice-route', sku: 'SP-102', p: 420, d: null, q: 240, r: 4.5, rc: 47, f: false, nw: false, tags: ['spices', 'cooking'], img: 'cumin seeds', desc: 'Earthy whole cumin seeds that bloom in hot oil.' },
  { s: 'coriander-powder-200g', n: 'Coriander Powder (200 g)', c: SP, st: 'pantry-pride', b: 'spice-route', sku: 'SP-103', p: 300, d: null, q: 250, r: 4.3, rc: 38, f: false, nw: false, tags: ['spices', 'cooking'], img: 'coriander powder', desc: 'Fragrant ground coriander, a base note of everyday curries.' },
  { s: 'cinnamon-sticks-100g', n: 'Cinnamon Sticks (100 g)', c: SP, st: 'pantry-pride', b: 'spice-route', sku: 'SP-104', p: 380, d: null, q: 190, r: 4.5, rc: 42, f: false, nw: true, tags: ['spices', 'baking'], img: 'cinnamon sticks', desc: 'Sweet, woody cinnamon sticks for baking and teas.' },
  { s: 'himalayan-pink-salt-1kg', n: 'Himalayan Pink Salt (1 kg)', c: SP, st: 'pantry-pride', b: 'spice-route', sku: 'SP-105', p: 260, d: 220, q: 300, r: 4.6, rc: 118, f: false, nw: false, tags: ['spices', 'salt'], img: 'pink himalayan salt', desc: 'Mineral-rich pink salt crystals sourced from the Himalayas.' },

  // Baby Food & Formula (4) — Wellness World
  { s: 'baby-oat-cereal-300g', n: 'Baby Oat Cereal (300 g)', c: BF, st: 'wellness-world', b: 'tiny-tots-brand', sku: 'BF-101', p: 850, d: null, q: 90, r: 4.6, rc: 48, f: false, nw: false, tags: ['baby', 'cereal'], img: 'baby cereal', desc: 'Iron-fortified oat cereal that is gentle on little tummies.' },
  { s: 'stage-2-fruit-puree-120g', n: 'Stage 2 Fruit Puree (120 g)', c: BF, st: 'wellness-world', b: 'tiny-tots-brand', sku: 'BF-102', p: 260, d: null, q: 160, r: 4.5, rc: 62, f: false, nw: true, tags: ['baby', 'puree'], img: 'baby food puree', desc: 'Smooth fruit puree with no added sugar or preservatives.' },
  { s: 'toddler-milk-formula-800g', n: 'Toddler Milk Formula (800 g)', c: BF, st: 'wellness-world', b: 'tiny-tots-brand', sku: 'BF-103', p: 4200, d: 3800, q: 60, r: 4.7, rc: 96, f: true, nw: false, tags: ['baby', 'formula', 'nutrition'], img: 'infant formula milk powder', desc: 'Complete growing-up milk with DHA and iron for toddlers.' },
  { s: 'baby-rusk-300g', n: 'Baby Rusk (300 g)', c: BF, st: 'wellness-world', b: 'tiny-tots-brand', sku: 'BF-104', p: 620, d: null, q: 110, r: 4.4, rc: 37, f: false, nw: false, tags: ['baby', 'snack'], img: 'baby biscuits rusk', desc: 'Gentle, easy-to-hold rusks for teething babies.' },

  // Health & Wellness (5) — Wellness World
  { s: 'vitamin-d3-tablets-60', n: 'Vitamin D3 Tablets (60 pack)', c: HW, st: 'wellness-world', b: 'vital-life', sku: 'HW-101', p: 1250, d: null, q: 120, r: 4.5, rc: 84, f: false, nw: false, tags: ['health', 'vitamins'], img: 'vitamin d tablets', desc: 'Daily vitamin D3 to support bones and immunity.' },
  { s: 'whey-protein-1kg', n: 'Whey Protein (1 kg)', c: HW, st: 'wellness-world', b: 'vital-life', sku: 'HW-102', p: 8500, d: 7800, q: 70, r: 4.7, rc: 143, f: true, nw: false, tags: ['health', 'protein', 'fitness'], img: 'whey protein powder', desc: 'Fast-absorbing whey protein with 24 g per scoop.' },
  { s: 'apple-cider-vinegar-500ml', n: 'Apple Cider Vinegar (500 ml)', c: HW, st: 'wellness-world', b: 'vital-life', sku: 'HW-103', p: 1100, d: null, q: 130, r: 4.4, rc: 67, f: false, nw: true, tags: ['health', 'wellness'], img: 'apple cider vinegar', desc: 'Raw, unfiltered apple cider vinegar with the mother.' },
  { s: 'probiotic-capsules-30', n: 'Probiotic Capsules (30 pack)', c: HW, st: 'wellness-world', b: 'vital-life', sku: 'HW-104', p: 1650, d: null, q: 90, r: 4.5, rc: 52, f: false, nw: false, tags: ['health', 'supplement'], img: 'probiotic capsules', desc: 'Multi-strain probiotics for a happy, healthy gut.' },
  { s: 'herbal-immunity-syrup-200ml', n: 'Herbal Immunity Syrup (200 ml)', c: HW, st: 'wellness-world', b: 'vital-life', sku: 'HW-105', p: 780, d: null, q: 140, r: 4.3, rc: 41, f: false, nw: true, tags: ['health', 'herbal'], img: 'herbal syrup bottle', desc: 'Soothing herbal blend of honey, ginger and tulsi.' },

  // Household Supplies (5) — CleanHome & Glow
  { s: 'floor-cleaner-1l', n: 'Floor Cleaner (1 L)', c: HH, st: 'cleanhome-glow', b: 'cleanhome-brand', sku: 'HS-101', p: 550, d: null, q: 220, r: 4.3, rc: 58, f: false, nw: false, tags: ['household', 'cleaning'], img: 'floor cleaner bottle', desc: 'Disinfecting floor cleaner that leaves a fresh, long-lasting scent.' },
  { s: 'glass-cleaner-500ml', n: 'Glass Cleaner (500 ml)', c: HH, st: 'cleanhome-glow', b: 'cleanhome-brand', sku: 'HS-102', p: 480, d: null, q: 200, r: 4.2, rc: 44, f: false, nw: false, tags: ['household', 'cleaning'], img: 'glass cleaner spray', desc: 'Streak-free spray for windows, mirrors and glass.' },
  { s: 'toilet-cleaner-750ml', n: 'Toilet Cleaner (750 ml)', c: HH, st: 'cleanhome-glow', b: 'cleanhome-brand', sku: 'HS-103', p: 520, d: null, q: 210, r: 4.3, rc: 51, f: false, nw: false, tags: ['household', 'cleaning'], img: 'toilet cleaner', desc: 'Thick toilet gel that clings and kills 99.9% of germs.' },
  { s: 'paper-towels-4-rolls', n: 'Paper Towels (4 rolls)', c: HH, st: 'cleanhome-glow', b: 'cleanhome-brand', sku: 'HS-104', p: 620, d: null, q: 180, r: 4.4, rc: 66, f: false, nw: true, tags: ['household', 'paper'], img: 'paper towel rolls', desc: 'Absorbent, 2-ply kitchen towels for everyday spills.' },
  { s: 'garbage-bags-30-pack', n: 'Garbage Bags (30 pack)', c: HH, st: 'cleanhome-glow', b: 'cleanhome-brand', sku: 'HS-105', p: 450, d: null, q: 260, r: 4.2, rc: 39, f: false, nw: false, tags: ['household', 'waste'], img: 'garbage bags', desc: 'Tear-resistant drawstring bin liners, medium size.' },

  // Personal Care (6) — CleanHome & Glow
  { s: 'body-lotion-400ml', n: 'Body Lotion (400 ml)', c: PC, st: 'cleanhome-glow', b: 'glow-care', sku: 'PC-101', p: 950, d: null, q: 170, r: 4.4, rc: 72, f: false, nw: false, tags: ['personal-care', 'skincare'], img: 'body lotion bottle', desc: 'Rich, fast-absorbing lotion for soft, hydrated skin.' },
  { s: 'face-wash-150ml', n: 'Face Wash (150 ml)', c: PC, st: 'cleanhome-glow', b: 'glow-care', sku: 'PC-102', p: 720, d: null, q: 200, r: 4.5, rc: 88, f: true, nw: false, tags: ['personal-care', 'skincare'], img: 'face wash', desc: 'Gentle foaming face wash that refreshes without drying.' },
  { s: 'deodorant-spray-150ml', n: 'Deodorant Spray (150 ml)', c: PC, st: 'cleanhome-glow', b: 'glow-care', sku: 'PC-103', p: 620, d: null, q: 240, r: 4.3, rc: 61, f: false, nw: false, tags: ['personal-care', 'hygiene'], img: 'deodorant spray', desc: 'Long-lasting freshness with a clean, subtle scent.' },
  { s: 'bath-soap-4-pack', n: 'Bath Soap (4 pack)', c: PC, st: 'cleanhome-glow', b: 'glow-care', sku: 'PC-104', p: 480, d: 420, q: 300, r: 4.4, rc: 77, f: false, nw: false, tags: ['personal-care', 'bath'], img: 'bar soap', desc: 'Nourishing bathing bars enriched with glycerine.' },
  { s: 'sunscreen-spf50-100ml', n: 'Sunscreen SPF50 (100 ml)', c: PC, st: 'cleanhome-glow', b: 'glow-care', sku: 'PC-105', p: 1350, d: null, q: 130, r: 4.6, rc: 94, f: true, nw: true, tags: ['personal-care', 'skincare'], img: 'sunscreen lotion', desc: 'Broad-spectrum SPF50 protection, light and non-greasy.' },
  { s: 'hair-conditioner-350ml', n: 'Hair Conditioner (350 ml)', c: PC, st: 'cleanhome-glow', b: 'glow-care', sku: 'PC-106', p: 880, d: null, q: 160, r: 4.4, rc: 55, f: false, nw: false, tags: ['personal-care', 'haircare'], img: 'hair conditioner bottle', desc: 'Deeply moisturising conditioner for soft, tangle-free hair.' },

  // Pet Food & Supplies (7) — Happy Paws
  { s: 'adult-dog-food-2kg', n: 'Adult Dog Food (2 kg)', c: PET, st: 'happy-paws', b: 'happy-paws-brand', sku: 'PF-101', p: 2400, d: 2100, q: 90, r: 4.5, rc: 66, f: true, nw: false, tags: ['pets', 'dog-food'], img: 'dog food kibble', desc: 'Complete, balanced chicken-flavour kibble for adult dogs.' },
  { s: 'cat-food-1-5kg', n: 'Cat Food (1.5 kg)', c: PET, st: 'happy-paws', b: 'happy-paws-brand', sku: 'PF-102', p: 1950, d: null, q: 80, r: 4.4, rc: 49, f: false, nw: false, tags: ['pets', 'cat-food'], img: 'cat food', desc: 'High-protein dry food for indoor and outdoor cats.' },
  { s: 'cat-litter-5kg', n: 'Cat Litter (5 kg)', c: PET, st: 'happy-paws', b: 'happy-paws-brand', sku: 'PF-103', p: 1650, d: null, q: 100, r: 4.3, rc: 38, f: false, nw: false, tags: ['pets', 'litter'], img: 'cat litter', desc: 'Clumping, low-dust litter with powerful odour control.' },
  { s: 'dog-dental-chews-180g', n: 'Dog Dental Chews (180 g)', c: PET, st: 'happy-paws', b: 'happy-paws-brand', sku: 'PF-104', p: 850, d: null, q: 120, r: 4.5, rc: 44, f: false, nw: true, tags: ['pets', 'dog-treats'], img: 'dog treats', desc: 'Chewy dental sticks that help keep teeth clean.' },
  { s: 'dog-leash-and-collar', n: 'Dog Leash & Collar', c: PET, st: 'happy-paws', b: 'happy-paws-brand', sku: 'PF-105', p: 1450, d: 1250, q: 70, r: 4.6, rc: 52, f: false, nw: false, tags: ['pets', 'accessories'], img: 'dog leash collar', desc: 'Durable nylon leash with a matching adjustable collar.' },
  { s: 'pet-shampoo-500ml', n: 'Pet Shampoo (500 ml)', c: PET, st: 'happy-paws', b: 'happy-paws-brand', sku: 'PF-106', p: 780, d: null, q: 110, r: 4.4, rc: 33, f: false, nw: true, tags: ['pets', 'grooming'], img: 'pet shampoo', desc: 'Gentle, pH-balanced shampoo for shiny, healthy coats.' },
  { s: 'wild-bird-seed-1kg', n: 'Wild Bird Seed (1 kg)', c: PET, st: 'happy-paws', b: 'happy-paws-brand', sku: 'PF-107', p: 890, d: null, q: 85, r: 4.3, rc: 27, f: false, nw: false, tags: ['pets', 'bird-food'], img: 'bird seed', desc: 'A nourishing blend of seeds and grains for wild birds.' },
];

// Category-appropriate fallbacks (already-whitelisted Unsplash host) if a
// Wikimedia image cannot be resolved.
const FALLBACK_IMG = {
  'fruits-vegetables': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf',
  'dairy-eggs': 'https://images.unsplash.com/photo-1550583724-b2692b85b150',
  'meat-poultry': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791',
  'seafood': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',
  'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
  'canned-goods': 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907',
  'frozen-foods': 'https://images.unsplash.com/photo-1546953304-5d96f43c2e94',
  'pasta-rice': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
  'breakfast': 'https://images.unsplash.com/photo-1484723091739-30a097e8f929',
  'snacks': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b',
  'beverages': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d',
  'spices-seasonings': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d',
  'baby-food-formula': 'https://images.unsplash.com/photo-1525253019412-b886ef778fc7',
  'health-wellness': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae',
  'household-supplies': 'https://images.unsplash.com/photo-1583947581927-78b40d7b60c1',
  'personal-care': 'https://images.unsplash.com/photo-1607006345348-407e454ba19f',
  'pet-food-supplies': 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd',
};

const imageCache = fs.existsSync(IMAGE_CACHE) ? JSON.parse(fs.readFileSync(IMAGE_CACHE, 'utf8')) : {};

async function resolveImage(product) {
  if (imageCache[product.s]) return imageCache[product.s];
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(product.img)}&page_size=8&source=wikimedia&license_type=all`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      const hit = (json.results || []).find(
        (r) => typeof r.url === 'string'
          && r.url.includes('upload.wikimedia.org')
          && /\.(jpe?g|png)(\?|$)/i.test(r.url)
      );
      if (hit) {
        imageCache[product.s] = hit.url;
        return hit.url;
      }
    } else if (res.status === 429) {
      console.warn(`  ! rate limited, using fallback for ${product.s}`);
    }
  } catch (err) {
    console.warn(`  ! image lookup failed for ${product.s}: ${err.message}`);
  }
  const fallback = FALLBACK_IMG[product.c];
  imageCache[product.s] = fallback;
  return fallback;
}

// ---------------------------------------------------------------------------
// Auth admin helpers
// ---------------------------------------------------------------------------
async function listAllUsers() {
  const users = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!res.ok) break;
    const json = await res.json();
    if (!json.users || json.users.length === 0) break;
    users.push(...json.users);
    if (json.users.length < 200) break;
  }
  return users;
}

async function ensureSeller(store, usersByEmail) {
  let user = usersByEmail.get(store.email);
  if (!user) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: store.email,
        password: STORE_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: store.first, last_name: store.last, role: 'seller' },
      }),
    });
    if (!res.ok) throw new Error(`create seller ${store.email} -> ${res.status} ${await res.text()}`);
    user = await res.json();
    usersByEmail.set(store.email, user);
    console.log(`  + seller account ${store.email}`);
    await sleep(400);
  }
  const userId = user.id;
  await rest('/rest/v1/vendors?on_conflict=slug', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: [{
      user_id: userId,
      name: store.name,
      slug: store.slug,
      description: store.desc,
      contact_email: store.email,
      status: 'approved',
      commission_rate: store.commission,
    }],
  });
  return userId;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing Supabase env vars in .env.local');

  console.log(`Seeding ${PRODUCTS.length} products across ${STORES.length} stores...`);
  if (PRODUCTS.length !== 100) console.warn(`  ! expected 100 products, found ${PRODUCTS.length}`);

  // Ensure all image URLs are resolved & cached first (rate-limited step).
  const onlyImages = process.argv.includes('--images');
  console.log('\n[1/4] Resolving images (Openverse -> Wikimedia)...');
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const had = !!imageCache[p.s];
    const url = await resolveImage(p);
    if (!had) {
      const host = (() => { try { return new URL(url).host; } catch { return 'invalid'; } })();
      console.log(`  ${had ? '=' : '+'} [${i + 1}/${PRODUCTS.length}] ${p.s} -> ${host}`);
      if (host === 'upload.wikimedia.org') await sleep(3200); // stay under 20/min
    }
  }
  fs.mkdirSync(path.dirname(IMAGE_CACHE), { recursive: true });
  fs.writeFileSync(IMAGE_CACHE, JSON.stringify(imageCache, null, 1));
  console.log(`  cached ${Object.keys(imageCache).length} image URLs -> ${path.relative(process.cwd(), IMAGE_CACHE)}`);
  if (onlyImages) return;

  console.log('\n[2/4] Ensuring seller accounts + stores...');
  const users = await listAllUsers();
  const usersByEmail = new Map(users.map((u) => [u.email, u]));
  const vendorIdBySlug = {};
  for (const store of STORES) {
    await ensureSeller(store, usersByEmail);
  }
  const vendors = await rest('/rest/v1/vendors?select=id,slug');
  vendors.forEach((v) => { vendorIdBySlug[v.slug] = v.id; });
  console.log(`  ${Object.keys(vendorIdBySlug).length} stores ready`);

  console.log('\n[3/4] Ensuring brands...');
  await rest('/rest/v1/brands?on_conflict=slug', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: BRANDS.map((b) => ({ name: b.name, slug: b.slug, description: b.desc, is_active: true })),
  });
  const brands = await rest('/rest/v1/brands?select=id,slug');
  const brandIdBySlug = {};
  brands.forEach((b) => { brandIdBySlug[b.slug] = b.id; });

  console.log('\n[4/4] Upserting products...');
  const categories = await rest('/rest/v1/categories?select=id,slug');
  const catIdBySlug = {};
  categories.forEach((c) => { catIdBySlug[c.slug] = c.id; });

  const rows = PRODUCTS.map((p) => ({
    vendor_id: vendorIdBySlug[p.st],
    name: p.n,
    slug: p.s,
    sku: p.sku,
    description: p.desc,
    short_description: p.desc.slice(0, 120),
    category_id: catIdBySlug[p.c] || null,
    brand_id: brandIdBySlug[p.b] || null,
    price: p.p,
    discount_price: p.d,
    stock_quantity: p.q,
    images: [imageCache[p.s]],
    tags: p.tags,
    status: 'active',
    moderation_status: 'approved',
    is_active: true,
    is_featured: !!p.f,
    is_new: !!p.nw,
    rating: p.r,
    review_count: p.rc,
  }));

  const missing = rows.filter((r) => !r.vendor_id || !r.category_id || !r.brand_id);
  if (missing.length) {
    console.warn('  ! some rows missing vendor/category/brand:', missing.map((m) => m.slug).join(', '));
  }

  const result = await rest('/rest/v1/products?on_conflict=slug', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: rows,
  });
  console.log(`  upserted ${result.length} products`);

  const active = await rest('/rest/v1/products?select=id&status=eq.active&is_active=eq.true&moderation_status=eq.approved', {
    // count only
  });
  console.log(`\nDone. Active, approved products now: ${active.length}`);
}

main().catch((err) => {
  console.error('\nSEED FAILED:', err.message);
  process.exit(1);
});
