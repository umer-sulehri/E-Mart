# E-Mart Testing Checklist

Automated tests and manual QA sign-off for the platform.

## Commands

| Check | Command |
|-------|---------|
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Unit tests | `npm test` (Vitest) |

Expected baseline: **7 test files, 67 tests, all passing.**

| File | Coverage |
|------|----------|
| `lib/__tests__/filter-params.test.ts` | 20 — shop search/query parsing, multi-select categories/brands, clearing filters preserving sort+search |
| `lib/__tests__/search-safe.test.ts` | 13 — user-search input sanitization |
| `lib/__tests__/utils.test.ts` | 10 — formatting/helpers |
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

### Buyer dashboard quick action (Issue #3)

- [ ] `/dashboard` first quick action is a prominent "Start Shopping" (green) button → `/products`.
- [ ] Click fires `cta_click`/`start_shopping` analytics event; touch target large on mobile.

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

### Auth dropdown (Issue #5)

- [ ] Logged-in header menu has no name/role header block.
- [ ] Menu: Dashboard (role-based) + role-gated Admin/Seller link + My Account → `/dashboard` + Logout.
- [ ] Escape closes menu and returns focus to the trigger; click-outside closes.

### Regression

- [ ] Cart, wishlist, orders, checkout, seller panel, admin panel smoke test after header changes.
- [ ] Public product reviews page still lists only approved reviews.