# E-Mart Bug Register

Living log of bugs found and their fixes. Each entry links the resolving commit.

## Scope: 5-issue production-readiness pass (2026)

### 1. Product detail 404 on any non-localhost host — CRITICAL

- **Found:** Product pages returned the site 404 for products that existed, whenever the site was reached through any host other than `http://localhost:3000`.
- **Root cause:** No site-URL helper existed. `app/(public)/products/[slug]/page.tsx` `fetchProductBySlug`/`fetchRelatedProducts` self-fetched against a hard-coded/env base URL that was unset or pointed at `localhost`; the broad `catch` converted every failure (including these self-fetch failures) into `notFound()`, so a transient network error looked identical to a missing product.
- **Fix:** Added `lib/absolute-url.ts` (`getSiteUrl()` from the request `host`/`x-forwarded-host`, with env/dev fallback), `encodeURIComponent(slug)` on all fetches, distinct 404 vs. infra-error handling (`notFound()` only on real misses), plus `loading.tsx`/`error.tsx` and a search-enabled 404 page (`app/not-found.tsx`, `components/ui/NotFoundSearch.tsx`). Event tracking via `lib/analytics.ts`.
- **Commit:** `b81784d`

### 2. Shop filter API ignored category/brand multi-select; price slider had fixed bounds

- **Found:** `/api/v1/products/search` only honored a single `category` (by leaf id/wrong column semantics) and ignored `brands` entirely; the price filter slider used static bounds instead of actual catalog prices.
- **Root cause:** Query builder had no `.in("categories.slug", ...)` / brand join; the range endpoint and dynamic bounds didn't exist.
- **Fix:** Multi-select `categories`/`brands` filtering via `.in()` + `brands!inner`, new `/api/v1/products/price-range`, filters driven by real `{min,max}` and responsive shop UI (cards, pagination, touch targets, stock states). 20 regression tests in `lib/__tests__/filter-params.test.ts`.
- **Commit:** `c969f19`

### 3. Reviews had no moderation — enabling explicit self-approval (security) and dead rating counts

- **Found:** `reviews.status` defaulted to `approved` and the CHECK excluded `rejected`. The RLS update policy (`Users can update own reviews`) had a `USING` clause only — **no `WITH CHECK`** — so a buyer could `UPDATE reviews SET status='approved' WHERE id = own_id` and self-approve any of their reviews, bypassing moderation entirely. Post-insert rating recompute and the product rating breakdown counted non-approved rows, so ratings drifted the instant a review was submitted (before any approval).
- **Fix:** `supabase/2026-reviews-moderation.sql`: add `rejected`, default `pending`, index `(user_id, created_at DESC)`, and a `WITH CHECK (auth.uid() = user_id AND status = 'pending')` policy so a buyer's update must end in `pending`. API hardening: POST queues as `pending`, PATCH validates via `reviewSchema`, blocks edits of `rejected` reviews and reviews older than 30 days, re-queues edits to `pending`; all rating math (recompute, breakdown, list, trigger) is `approved`-only. Admin moderation gains a **Reject** action and `rejected` filter. Buyer dashboard split into Ordered Products / My Reviews / Pending Moderation tabs.
- **Commit:** `507f195`
- **Schema.sql drift note:** `supabase/schema.sql` was updated to match (new default/CHECK/policy) so fresh installs and migrations stay consistent.

### 4. Auth dropdown clutter: profile preview, dead `/account` stub, no keyboard handling

- **Found:** The logged-in `UserMenu` showed a name/role header block (corrupted on small screens, redundant with the avatar), a "My Account" item pointing at `/account`, which itself is a redirect stub to `/dashboard` (three hops to the same destination as "Dashboard"), and none of the menus closed on Escape.
- **Fix:** Removed the profile preview; "My Account" now links directly to `/dashboard` (in `UserMenu`, the header "Pages" menu, and `MobileNav`); Escape closes the menu and restores focus to the trigger; kept the role-gated Admin/Seller links.
- **Commit:** `7afbeb8`

## Earlier fixes (pre-5-issue pass, retained on `main`)

- **Settings blob read-modify-write race:** translations/social-links merged stale blobs, losing writes. `0748e66`
- **Uploads masking failures:** catch blocks logged generic messages, hiding the real cause of 500s. `2eeb8ab`

## FIX session 2026-09-14 (uncommitted)

### A. Phantom category filter resurrected after "Clear all" — shop search/preview

- **Found:** Landing on `/products?category=fruits-vegetables` then pressing "Clear all filters" still returned only that category's products, even though the URL no longer carried the param and no chip was shown.
- **Root cause:** `ProductsPageClient.tsx` captured `initialCategory` from the first render's query params and re-added `params.category = initialCategory` to the API request whenever `filters.categories` was empty — so the cleaned URL was overridden with a stale value.
- **Fix:** Removed the `initialCategory` state/fallback/effect-dependency entirely. The legacy `category`/`brand` params are already handled by `lib/filterParams.ts` (`filtersFromSearchParams`), so clearing filters no longer resurrects them.
- **Commit:** pending.

### B. Login dropdown duplicated navigation targets

- **Found:** The `UserMenu` in `Header.tsx` showed "Dashboard" (role-mapped path) *and* "My Account" (`/dashboard`); for customers both resolved to `/dashboard`, and seller/admin roles got an extra near-duplicate in their role links.
- **Fix:** Removed the "Dashboard" row (and its now-unused `LayoutDashboard` import). Menu is now: role links (Admin Panel / Seller Dashboard, role-gated) + "My Account" (`/dashboard`) + "Logout"; every item has an `aria-label`.
- **Commit:** pending.

### C. Dashboard quick actions were inconsistent plain links

- **Found:** "Start Shopping" was a large solid-green pill while Re-Order / Track Order / Write Review were small outline buttons; all four were simple links with no disabled states, and Re-Order/Track didn't reflect real order data.
- **Fix:** Added `components/ui/ActionButton.tsx` (unified gradient card styling, Link-or-button, `disabled`/`loading`, 44px+ targets, `active:scale-95`). Rebuilt the dashboard Quick Actions as a responsive `grid-cols-2 sm:grid-cols-4` block. Re-Order now re-adds the last order's items to the cart (per-item `cartStore.addToServer` + `syncWithServer`, then routes to `/cart`), Track links to the latest order detail, Write Review links to `/dashboard/reviews`; all three disable until a matching order exists (`lib/dashboard.ts` `getQuickActionState`, pure, unit-tested).
- **Commit:** pending.

### D. Shop feature & import hardening

- **Found:** The `featuredOnly` filter had state/URL/chip support but no control in the sidebar; both product API routes parsed `page`/`limit`/price/rating with unchecked `parseInt`/`parseFloat`, so malformed query values could send `NaN` to PostgREST; a product related to multiple matching categories/brands could surface twice.
- **Fix:** Added a "Featured Only" checkbox to `ProductFilters.tsx`; `app/api/v1/products/route.ts` and `products/search/route.ts` now clamp `page`/`limit` (1–100), guard price/rating with `Number.isFinite`, and de-duplicate results by `id`. The category sidebar and active-filter chips now use live `/api/v1/categories` data (with static-catalog fallback) instead of only the hardcoded list.
- **Commit:** pending.

### E. Product card interaction & a11y polish

- **Found:** The quick-view control was an eye icon with no text label on any viewport, buttons lacked press feedback, and there was no way to keyboard-jump past the header.
- **Fix:** Quick view now shows "View" text from `sm:` up (icon only below); `active:scale-95` press feedback and `focus-visible` rings added to cart/view/wishlist buttons; product grid capped at `xl:grid-cols-4`; skip-to-content link + `#main-content` anchor added to the public layout.
- **Commit:** pending.