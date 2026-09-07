# BUGS_FOUND.md

Bug findings, root causes, and fixes from the comprehensive fix & enhancement pass.

## Phase 1 — Admin Dashboard

### 1.1 `socialLinks.map is not a function` (settings page)
- **File:** `app/admin/settings/page.tsx` (~line 775, `fetchSocialLinks`)
- **Root cause:** The API `/api/v1/admin/social-links` returns `{ success, data: [...] }`, but the
  frontend parsed `data.links || data || []`. `data.links` is `undefined`, so it fell through to the
  whole **response object** (`{ success, data }`), which is truthy but not an array →
  `socialLinks.map` crashed on render.
- **Fix:** Defensive array parsing — read `data.data`, fall back to `data.links`, `data`, else `[]`.

### 1.2 `Cannot read properties of undefined (reading 'toLocaleString')` (reports page)
- **File:** `app/admin/reports/page.tsx` (`formatCurrency`, fetch handler)
- **Root cause:** `/api/v1/admin/reports` returns `{ success, data: {...reportData} }` but the page
  stored the **whole response** via `setSalesData(data)`. `salesData.totalRevenue` etc. were
  `undefined`; `amount.toLocaleString()` threw. The render guards (`salesData && ...`) passed because
  the object was truthy.
- **Fix:** Unwrap `data.data ?? data` before storing, and made `formatCurrency` null-safe
  (`Number.isFinite` guard, displays `₨0`).

### 1.3 Admin reviews: `column profiles.avatar_url does not exist`
- **File:** `app/api/v1/admin/reviews/route.ts` (SELECT join)
- **Root cause:** `profiles` table has `profile_image_url`; there is **no** `avatar_url` column.
  Supabase aborts the whole join query if any selected column is missing.
- **Fix:** Changed the join to use `profile_image_url` (matches all other consumers:
  `app/api/v1/reviews`, `seller/reviews`, `products/[slug]/reviews`, blog routes).

### 1.4 Admin settings never load saved values
- **File:** `app/admin/settings/page.tsx` (`fetchSettings`)
- **Root cause:** API returns `{ success, data: { general, payments, shipping } }`, frontend read
  top-level `data.general` → always `undefined` → page always rendered defaults, so saves appeared
  to "not persist".
- **Fix:** Read `data.data ?? data` before accessing sections.

### 1.5 Admin CRUD audit (coupons, settings, social links)
- Verified create/update/delete payloads match API schemas end-to-end (no Zod mismatches; proper
  `res.ok` handling; admin-log writes on mutations). No code changes required for coupons.
- `settings.value` is JSONB; `social_links` are stored under `settings.key = 'social_links'`
  (`{ links: [...] }`). No DB migration needed.

## Phase 2 — Buyer

### 2.1 Wishlist heart state out of sync on home / product listings
- **Files:** `components/product/ProductCard.tsx`, `components/product/QuickViewModal.tsx`
- **Root cause:** `useAddToWishlist` only seeds `isWishlisted` from the server when
  `isAuthenticated` is passed. `ProductDetailClient` passed it; `ProductCard` and `QuickViewModal`
  did not → hearts on grids/home/quick-view never reflected the user's saved items ("wishlist not
  working/displaying correctly").
- **Fix:** Passed `{ isAuthenticated }` from `useAuthStore` in both components.
- Backend `/api/v1/wishlist` GET/POST/DELETE verified correct; page (`app/(public)/wishlist`,
  `app/dashboard/wishlist`) handles auth-gate, empty state, loading skeleton, move-to-cart, remove.

### 2.2 Write Review routing
- Verified: dashboard quick action and order detail button both route to
  `/dashboard/orders/[orderId]/write-review`; the form page is dynamic, pre-fills order context,
  validates rating/title/comment, and only renders "Write Review" buttons for
  delivered/shipped/out_for_delivery orders. No change required (fixed in an earlier session).

## Phase 3 — Seller

### 3.1 Duplicate "Home > Seller Dashboard" breadcrumb
- **Files:** `app/seller/layout.tsx`, `app/admin/layout.tsx`, `app/seller/page.tsx`,
  `app/admin/page.tsx`, sub-pages `products/new`, `products/[id]/edit`, `blog/new`, `blog/[id]`
- **Root cause:** Layout rendered `Home > <Dashboard>` on every page **and** the sub-pages rendered
  their own full breadcrumb **including** the same first two crumbs → "Home > Seller Dashboard >
  Home > Seller Dashboard".
- **Fix:** Removed the shared breadcrumb from both layouts; added `Home > X` breadcrumbs to the
  seller and admin **home** pages. Now exactly one breadcrumb trail per page.

### 3.2 Payout available-balance inconsistent with request validation
- **Files:** `app/api/v1/seller/payout/route.ts` (GET), `app/api/v1/seller/payout/request/route.ts`
  (POST)
- **Root cause:** GET counted only `completed` payouts as "paid", while POST rejected requests once
  `pending + processing + completed` exceeded net earnings. UI could show a balance that the server
  then rejected as "Insufficient balance" — surfaced as "payout not working".
- **Fix:** GET now reserves `pending + processing + completed` in `pending_balance`, matching POST.
  Full flow verified: approved-vendor gate, min `Rs. 5,000`, method/account validation, balance
  check, `seller_payouts` insert + list refresh.

## Phase 5 — Theme

### 5.1 Organic template alignment
- Tailwind tokens (`tailwind.config.ts`) already implement the Organic palette exactly:
  primary `#6BB252`, hover `#f7a422`, secondary `#364127`, danger `#F95F09`, success `#a3be4c`,
  muted `#747474`, border `#F7F7F7`, cream `#FFF9EB`/`#EEF5E4` scale.
- Fonts match the template: Nunito (`--font-heading`) + Open Sans (`--font-body`) via
  `next/font/google` in `app/layout.tsx`.
- No token changes required. Deeper audit items (55-component sweep, dark mode, GA4, Swagger,
  Lighthouse) remain open scope and are tracked separately.