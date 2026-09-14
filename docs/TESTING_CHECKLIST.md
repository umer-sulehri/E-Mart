# E-Mart Testing Checklist

Automated tests and manual QA sign-off for the platform.

## Commands

| Check | Command |
|-------|---------|
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Unit tests | `npm test` (Vitest) |

Expected baseline: **8 test files, 81 tests, all passing.**

| File | Coverage |
|------|----------|
| `lib/__tests__/filter-params.test.ts` | 25 — shop search/query parsing, multi-select categories/brands, clearing filters preserving sort+search, combined AND filters, malformed-param edge cases |
| `lib/__tests__/search-safe.test.ts` | 13 — user-search input sanitization |
| `lib/__tests__/utils.test.ts` | 10 — formatting/helpers |
| `lib/__tests__/dashboard.test.ts` | 9 — order-item normalization, quick-action eligibility (reorder/track/review) for empty/active/cancelled/delivered orders |
| `lib/__tests__/csv.test.ts` | 8 — CSV export escaping |
| `lib/__tests__/cart-metrics.test.ts` | 6 — cart totals/counts |
| `lib/__tests__/sanitize-html.test.ts` | 6 — HTML sanitization |
| `lib/__tests__/settings-merge.test.ts` | 4 — settings read-modify-write merge |

## DB migrations to apply

Apply before manual testing (new DB or existing):

1. `supabase/seed-products-grocery.sql` — 51 grocery products across 17 categories (idempotent).
2. `supabase/2026-reviews-moderation.sql` — adds `rejected` status, default `pending`, owned-reviews index, and the RLS update policy forcing new status to `pending`.

## Manual QA

### Product detail (Issue #1)

- [ ] Open two products A→B: no 404, correct product, related products render.
- [ ] Deep-link/refresh a product URL on a non-`localhost` host/port (e.g. `--hostname 0.0.0.0 --port 3001` — directly hitting the network hostname).
- [ ] Visit a nonexistent slug (`/products/does-not-exist`) → styled 404 page with search box.
- [ ] With API down, product page shows the error recovery UI (not a blank 404).
- [ ] `loading.tsx` skeleton appears during navigation.

### Shop filters + responsive (Issue #2)

- [ ] `/products` loads; sidebar lists 17 grocery categories + brands.
- [ ] Select multiple categories → combined product results (`search?categories=x,y`).
- [ ] Select multiple brands → results restricted to those brands.
- [ ] Price slider bounds match real catalog min/max (`/api/v1/products/price-range`).
- [ ] Apply price range → only in-range products shown; clearing filters keeps sort + search text.
- [ ] Mobile (≈390px): cards full-width, touch targets ≥ 44px, low-stock bead, page-number pagination hidden, prev/next usable; shop text scales.
- [ ] Product back-link shows "Out of stock" and disables add-to-cart when `stock=0`.

### Buyer dashboard quick actions (unified ActionButton pass)

- [ ] `/dashboard` shows 4 cards in a `grid-cols-2 sm:grid-cols-4` layout, all with identical gradient styling, radius, and icon sizes.
- [ ] "Start Shopping" → `/products`; click fires `cta_click`/`start_shopping` analytics event; touch target large on mobile.
- [ ] "Re-Order" disabled when the user has no eligible (non-cancelled) order; enabled otherwise → re-adds last order items to cart, toast, redirect to `/cart`.
- [ ] "Track Order" disabled with no trackable (confirmed/processing/shipped/out_for_delivery) order; enabled → links to the latest order detail.
- [ ] "Write Review" disabled without a delivered order; enabled → `/dashboard/reviews`.
- [ ] All four cards: Tab-reachable, Enter/Space activates, `disabled` cards skipped in the tab order (links) / `disabled` (buttons), visible focus ring.

### Reviews moderation + CRUD (Issue #4)

DB/applies via migration above.

- [ ] Buyer writes a review for a delivered/shipped order → success toast says "pending approval"; appears in **Pending Moderation** tab; product rating/review_count unchanged.
- [ ] Admin approves it (`/admin/reviews`) → review becomes public on product page; rating/count update; status badge now "Approved".
- [ ] Admin Reject → review shows "Rejected"; **Edit is disabled**; Delete still allowed.
- [ ] Admin Flag → "Flagged" badge; not publicly visible (RLS).
- [ ] Edit an approved review → re-queued to Pending, rating interim drop expected until re-approval.
- [ ] Try editing a review older than 30 days → 403 message.
- [ ] Try `PATCH /api/v1/reviews/[id]` setting `status:"approved"` directly → rejected (RLS `WITH CHECK`); no self-approval possible.
- [ ] Editing an already-rejected review → API 403.
- [ ] Delete any own review (ConfirmDialog) → hard delete, empty-state returns.
- [ ] "My Reviews" tab: sort (recent/highest/lowest) + pagination work with `status` filter; "Pending Moderation" tab filters `status=pending` only.
- [ ] Unauthenticated GET `/api/v1/auth/reviews` → 401.

### Auth dropdown (Issue #5 + dup-navigation pass)

- [ ] Logged-in header menu has no name/role header block.
- [ ] Menu shows: role-gated Admin/Seller link (admin/seller only) + My Account → `/dashboard` + Logout. **No "Dashboard" row.**
- [ ] Absent roles see exactly two items: My Account + Logout.
- [ ] Clicking My Account → `/dashboard`; clicking Logout clears session, redirects home, protected routes blocked.
- [ ] Escape closes menu and returns focus to the trigger; click-outside closes.

### Shop filters + responsive (2026 pass additions)

- [ ] Category sidebar lists live `/api/v1/categories` (sub-categories indented); active-filter chips use live names.
- [ ] "Featured Only" checkbox filters `is_featured=true` and renders a removable "Featured" chip.
- [ ] Land on `/products?category=X`, apply more filters, then "Clear all" → **no products remain filtered** (no phantom category re-added).
- [ ] Malformed params (`page=abc`, `limit=99999`, `minPrice=foo`) return valid pagination/defaults, never 500.
- [ ] Landing on the long category/product list never shows duplicate cards.
- [ ] Keyboard focus: quick-view/view, cart, and wishlist buttons show a visible focus ring; "View" label appears at ≥640px; grid is 1/2/3/4 columns across 320/640/1024/1280px.
- [ ] Tab-through: first Tab focuses "Skip to main content" link which jumps to content past the header.

### Regression

- [ ] Cart, wishlist, orders, checkout, seller panel, admin panel smoke test after header changes.
- [ ] Public product reviews page still lists only approved reviews.