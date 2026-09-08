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
- **Root cause:** `/api/v1/admin/reports` returns a compact **snake_case** object per type
  (`total_orders`, `total_revenue`, ...) but the page UI consumes a rich **camelCase** shape
  (`totalOrders`, `totalRevenue`, `topProducts`, `dailyRevenue`, ...). Assigning the raw response
  meant `salesData.totalOrders` etc. stayed `undefined`, so `salesData.totalOrders.toLocaleString()`
  / `salesData.dailyRevenue.map(...)` threw at render time. The `salesData && ...` guards passed
  because the object was truthy.
- **Fix:** Added per-type normalizers (`normalizeSales`/`normalizeProducts`/`normalizeUsers`) that
  map the snake_case response into the exact camelCase UI shape with safe numeric/array defaults, so
  no `.map`/`.toLocaleString` call ever hits an undefined value. `formatCurrency` remains null-safe
  (`Number.isFinite` guard, displays `₨0`). Moved the fallback demo sets to module scope and kept
  them as a catch-branch so the page still renders meaningful content if the API is unreachable.
- **Enhancement (continuation):** `/api/v1/admin/reports` now also returns the derived display
  arrays the UI renders — `daily_revenue`, `top_products` (sales); `low_stock_alerts`, `top_rated`,
  `category_breakdown` (products); `user_growth`, `top_buyers`, `new_users_change` (users). Each
  supplementary query is wrapped defensively so a failure degrades to an empty array rather than a 500.
  Frontend normalizers read both camelCase and snake_case keys.

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
- `app/dashboard/wishlist/page.tsx` also mis-mapped the API rows (read `entry.productId`/
  `entry.product`/camelCase props, but the API returns `product_id`/`products`/snake_case), so the
  dashboard grid rendered empty. Now maps each row into the camelCase `WishlistEntry`/`Product`
  shape; `hooks/useAddToWishlist.ts` seed detection likewise now matches `products` on the row
  (`entry?.products?.id`) instead of `entry?.product`.
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

## Phase 5 — SEO & Analytics additions

### 5.2 Missing per-page SEO on seller pages
- **Files:** `app/(public)/sellers/page.tsx`, `app/(public)/sellers/[slug]/page.tsx`
- **Root cause:** Both were client-only components — App Router cannot export `metadata` /
  `generateMetadata` from `'use client'` modules, so `/sellers` and `/sellers/[slug]` had no
  per-page title/description/OG tags (fell back to the generic root template).
- **Fix:** Split each into a server wrapper (`page.tsx` exporting metadata) + client component
  (`SellersClient.tsx`, `SellerStoreClient.tsx`). The storefront's `generateMetadata` does a
  server-side `vendors` lookup by slug (name, description, logo) and calls `notFound()` for
  unknown slugs; transient DB errors fall back to the client render so the page never breaks.

### 5.3 Google Analytics 4
- **File:** `components/analytics/GoogleAnalytics.tsx` (added to `app/layout.tsx`)
- Gated behind `NEXT_PUBLIC_GA_ID` (added to `.env.example`); renders `next/script`
  `gtag` with `anonymize_ip` when set, no-op otherwise. Nothing loads when unset.

## Phase 4 — Flow audit results

Extended source-level audit of the highest-traffic flows following the Phase 1–3
fixes. **No new defects found** in the audited paths:

- **Checkout (`app/(public)/checkout/CheckoutPageClient.tsx`)** — verified end to
  end against the APIs it calls:
  - Address creation: `POST /api/v1/addresses` destructures exactly the fields the
    client sends (`firstName`, `lastName`, `addressLine1`, `phone`, ..., `isDefault`).
  - Order creation: `POST /api/v1/orders` accepts `shippingAddressId`, `paymentMethod`,
    `couponCode`; the extra client `discountAmount` is intentionally ignored and the
    discount is recomputed server-side from the validated coupon (client-total drift is
    safe). Payment-method whitelist includes `stripe` and `cod` as mapped by the client.
  - Initiators: Easypaisa/JazzCash (`orderId, mobileNumber, amount`) and Stripe
    (`orderId, successUrl, cancelUrl`) match their request bodies; redirect field names
    (`paymentUrl`/`redirectUrl`/`url`) match what the client reads.
  - Cart clear: COD branch clears immediately; non-COD defers to the success page, whose
    `CartClear` component clears the cart on mount. `/invoice/[orderId]` (server page) and
    `/dashboard/orders` links from the success page exist.
  - `GET /api/v1/orders` returns orders + `meta` + `summary`; buyer dashboard consumes
    `data.data`/`summary` correctly.
- **Reviews** (`app/dashboard/orders/[orderId]/write-review` + `POST
  /api/v1/products/[slug]/reviews`) — payload (`rating`, `title`, `comment`) matches the
  zod `reviewSchema`; API dedupes per user/product, marks verified purchases against
  delivered orders, and updates the product rating aggregation.
- **Seller products** — create/edit payloads (`name`, `price`, `sku`, `categoryId`,
  `shortDescription`, `discountPrice`, `stockQuantity`, `isActive`, `images`, ...) match
  the `POST /api/v1/seller/products` destructuring; brand upsert-by-name mirrors on both
  create and update.
- **Admin analytics/dashboard** (`app/admin/page.tsx`, `app/admin/analytics/page.tsx`,
  `GET /api/v1/admin/analytics/dashboard|orders`) — response `data` shape matches the
  `DashboardData`/`MonthlyPoint` client interfaces field-for-field; series items use
  `label`/`revenue`/`orders`.
- **Uploads** (`components/seller/ProductForm` + `POST /api/v1/uploads`) — FormData `file`
  / `bucket` / `folder` and the returned `data.url` match the client contract.
- **API reference** — all 124 `/api/v1` route handlers enumerated with methods in
  `docs/API_REFERENCE.md` (auto-generated by `docs/generate-api-doc.ps1`); a column-name
  sweep re-confirmed `profile_image_url` is used consistently (no `avatar_url` residuals).

## Phase 5 — Accessibility fixes (code-level sweep)

Keyboard/dialog/AT audits of shared components. Confirmed already-correct: form `Input`s
are label-associated via `htmlFor`/`id` (checkout shipping form, selects, etc.); icon-only
buttons carry `aria-label`; `ConfirmDialog` has `role="dialog"`/`aria-modal`; header
account + mobile-menu toggles expose `aria-expanded`; hero `<img>` is a labelled LCP hint.

Fixed:
- **Quick view modal** (`components/product/QuickViewModal.tsx`) — added `role="dialog"`,
  `aria-modal`, labelled via `aria-label={product.name}`, ESC-to-close, and focus on open.
- **Cart drawer** (`components/cart/CartSidebar.tsx`) — added `role="dialog"`,
  `aria-modal="true"`, `aria-hidden` when closed, and ESC-to-close (WCAG 2.1.1/2.1.2).
- **Mobile nav** (`components/layout/MobileNav.tsx`) — drawer was permanently mounted, so
  its links stayed in the keyboard tab order when closed; now `invisible` when closed
  (removes tab stops + AT exposure), plus body scroll-lock and ESC-to-close while open.
- **Notification dropdown** (`components/ui/NotificationBell.tsx`) — toggle now exposes
  `aria-expanded`/`aria-haspopup`; ESC closes the panel.
- **Star rating** (`components/ui/StarRating.tsx`) — decorative SVGs now carry `role="img"`
  + `aria-label` ("Rated X out of 5 stars").
- **Product card quantity input** (`components/product/ProductCard.tsx`) — missing
  accessible name; added `aria-label`.
- **Shared `Input`** (`components/ui/Input.tsx`) — form fields with validation errors now
  expose `aria-invalid` and `aria-describedby` wired to the error/helper text element ids
  (WCAG 3.3.1 Error Identification + 4.1.2 Name/Value/State). Benefits every labelled form
  (checkout, dashboard profile/orders, etc.), not just this component.