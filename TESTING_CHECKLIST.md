# TESTING_CHECKLIST.md

Manual QA checklist covering recent production-readiness work across all four phases.

## 1. Automated Gates (run first)

```bash
npm run test      # vitest unit tests (lib/__tests__)
npm run typecheck # tsc --noEmit
npm run lint      # next lint (expect zero warnings)
npm run build     # next build
```

All four must pass before shipping a build.

## 2. Runtime Console Errors (dev server)

Start `npm run dev` and open the browser console on each page. Target: **zero errors/warnings** (React key warnings, hydration mismatches, failed fetches).

- [ ] Buyer home `/`
- [ ] Product listing `/products`
- [ ] Product detail `/products/[slug]` (with variation selection + add to cart)
- [ ] Cart `/cart` (add/remove/qty, coupon)
- [ ] Compare `/compare`
- [ ] Wishlist `/wishlist`
- [ ] Checkout `/checkout` (all 3 steps + all 4 payment methods)
- [ ] Order success
- [ ] Admin dashboards `/admin/*` (orders, products, categories, coupons, users, reviews, blog)
- [ ] Seller dashboards `/seller/*` (orders, products, coupons, reviews, payouts)
- [ ] Buyer dashboard `/dashboard/*` (orders, profile, addresses, wishlist)

## 3. Phase 1 — Header & Theme

- [ ] Buyer header: no bell icon, no hardcoded "3" badge, no "Track Order" link in dropdown
- [ ] Theme hex colors consistent across `Footer`, `PopularTags`, `FeaturesStrip` (admin theme colors)
- [ ] Dark/light mode toggle still works on all pages

## 4. Phase 2 — Dialogs & Boundary/Error Handling

`confirm()`/`window.confirm()` should be gone everywhere — all destructive actions use `ConfirmDialog`:

- [ ] Admin coupons delete
- [ ] Admin categories delete
- [ ] Seller products delete
- [ ] Seller coupons delete
- [ ] Order cancel + return (buyer, `/dashboard/orders/[orderId]`)
- [ ] Delete account (`/dashboard/profile`) — confirm dialog, then auth sign-out
- [ ] Cancel still accessible via Escape + click outside; focus returns on close

Error/not-found boundaries:

- [ ] Visit `/admin/nonexistent` → admin not-found UI (not white screen)
- [ ] Visit `/seller/nonexistent` → seller not-found UI
- [ ] Force an error in an admin/seller server component → error.tsx UI with "Try again"

## 5. Phase 2 — Payouts

- [ ] Vendor with `pending`/`suspended` status sees payouts disabled (not just blocked by amount)
- [ ] Request below `MIN_PAYOUT_AMOUNT` (5000) rejected client-side and server-side
- [ ] Request above threshold passes and creates `pending` record
- [ ] Summary cards (available/paid/pending) match ledger

## 6. Phase 3 — Review Flow

- [ ] Only delivered / shipped / out_for_delivery orders show "Write Review" (buyer orders page)
- [ ] Review submit works and immediately appears on product page (optimistic)
- [ ] Vendor `reviews` join (`vendors(name)`) populates correctly
- [ ] Can't review comments on a non-delivered order via direct POST

## 7. Phase 4 — Logger

- [ ] Payment initiate/webhook routes log via `logger.info("StripeWebhook", ...)`; client output clear of prefixed quotes
- [ ] `LOG_LEVEL` env filters server logs (e.g. `LOG_LEVEL=warn` suppresses info)
- [ ] No raw `console.log` remains outside `lib/logger.ts`

## 8. Phase 4 — Typed Data (Row/API types)

- [ ] Admin coupons list shows correct `discount_type`/`discount_value` (fixed camelCase bug); edit dialog pre-fills correctly; `fixed_amount` maps to "Fixed"
- [ ] Admin users blocked toggle reflects real `is_blocked` column
- [ ] Admin categories shows product counts for categories + subcategories
- [ ] Seller orders shows per-item totals (`total_price` fallback)
- [ ] Product detail page additional images render (no `as any` crash)
- [ ] Move-to-cart from wishlist works

## 9. Phase 4 — Checkout (restored monolithic flow)

Checkout lives in `app/(public)/checkout/CheckoutPageClient.tsx` (self-contained; no
`lib/checkout.ts` / `components/checkout/*`):

- [ ] Step flow: Shipping → Payment → Review, with Edit/Back navigation
- [ ] Validation errors per-field on each step; clearing on change
- [ ] All 4 payment methods: Easypaisa, JazzCash, Stripe card, COD
- [ ] Review totals match cart summary; hydrate/no-hydrate states consistent
- [ ] Place order path for each method (mock redirects for EP/JC/Stripe, success push for COD)

## 10. Regression — CRUD Mutations

- [ ] Admin: create/edit/delete product, category, coupon, blog post
- [ ] Seller: create/edit product with images, toggle active, stock edit
- [ ] Order status transitions (placed → confirmed → shipped → delivered / cancelled / returned)
- [ ] Coupon apply/remove in cart; discount appears in checkout totals

## 11. Regression — Auth

- [ ] Signup → email/phone verify → login → logout
- [ ] Demo login off (no `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`): demo buttons hidden
- [ ] Role-based access: buyer cannot reach admin/seller routes; admin cannot reach seller

## 12. Comprehensive Fix Pass (see BUGS_FOUND.md)

- [ ] Admin Settings: social links list renders (no `map` crash); save → reload persists
- [ ] Admin Reports: all 3 tabs render currency without `toLocaleString` crash
- [ ] Admin Reviews: table loads (profiles join no longer references `avatar_url`)
- [ ] Admin Coupons: create/edit/delete persist; list refreshes
- [ ] Home/product-grid hearts reflect saved wishlist for a signed-in user (seed on mount)
- [ ] Quick-view modal heart reflects saved wishlist state too
- [ ] Seller + Admin pages show exactly one breadcrumb trail (no duplicate Home)
- [ ] Seller Payouts: available balance matches server-side `Insufficient balance` check

## 13. SEO & Analytics

- [ ] `/sellers` page has its own title/description/OG metadata
- [ ] `/sellers/[slug]` has dynamic metadata (seller name/description/logo) and 404s on unknown slugs
- [ ] Setting `NEXT_PUBLIC_GA_ID` injects the gtag snippet; leaving it unset loads nothing