# E-Mart API Reference

Auto-generated from the Next.js App Router route handlers under `app/api/v1`.

Base path: `/api/v1`. All handlers return JSON.

## Response envelope

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether the request succeeded |
| `data` | `any` | Payload on success (list/detail/created record) |
| `error` | `string \| object` | Message on failure. Most routes send a bare string; documented limit/rate-limit responses send `{ code, message }` so the client can branch on `code` instead of matching text |
| `meta` | `object` | Pagination: `currentPage`, `totalPages`, `totalItems`, `itemsPerPage`, `hasNextPage`, `hasPreviousPage`. Quota responses reuse `meta` for `limit`, `used`, `remaining`, `resetAt` |
| `summary` | `object[]` | Aggregates where applicable (e.g. orders) |

## Daily product upload limit

A seller may create at most **10 products per calendar day**. The day window is
fixed: it starts at midnight `Asia/Karachi` (PKT, UTC+05:00) and ends at the
next PKT midnight. `resetAt` is always that instant.

Rules:

- **Creations only.** `PUT`/`PATCH` on a product never consumes a slot.
- **Deleted products still count.** The count has no status filter, so deleting
  a product and re-adding it does not free a slot. Drafts and archived products
  count too.
- **Counted per creator** (`vendor_id`); vendors never share an allowance.
- **Admins are exempt** by default (`QUOTA_EXEMPT_ADMINS` / the
  `exempt_admins_from_daily_product_limit` setting).
- Enforced on `POST /api/v1/seller/products` and
  `POST /api/v1/seller/products/import`, plus a Postgres `BEFORE INSERT`
  trigger as the authoritative race-safe gate.

Single source of truth: `MAX_PRODUCTS_PER_DAY` in `lib/product-limit.ts`
(client-safe) and `lib/seller-quota.ts` (server, re-exports it); the
authoritative copy is `app_settings.max_products_per_day`, read by the trigger
via `supabase/2027-product-daily-limit.sql`.

### Limit response

`429` with `error.code = "DAILY_PRODUCT_LIMIT"`:

```json
{
  "success": false,
  "error": {
    "code": "DAILY_PRODUCT_LIMIT",
    "message": "Daily limit of 10 products reached. Try again tomorrow."
  },
  "meta": {
    "limit": 10,
    "used": 10,
    "remaining": 0,
    "resetAt": "2026-03-15T19:00:00.000Z"
  }
}
```

Headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset`.

If the allowance cannot be read, routes fail closed with `503` and
`Retry-After: 30` rather than granting an unaccounted slot.

### CSV import over quota

`POST /api/v1/seller/products/import` imports the rows that fit and **names
every row it refused** rather than dropping them silently. A partial import that
hit the ceiling returns `429` with `data.rejectedOverQuota` and a
`rowErrors[]` entry per refused row.

The `row` field is the 1-based line in the uploaded CSV, header included, so the
seller can open the file at exactly that line.

```json
{
  "success": true,
  "data": {
    "imported": 3,
    "totalParsed": 10,
    "skippedDuplicates": 0,
    "rejectedOverQuota": 7,
    "rowErrors": [
      { "row": 8, "error": "\"Widget\" not imported: daily limit of 10 products reached. Try again tomorrow." }
    ]
  },
  "meta": { "limit": 10, "used": 10, "remaining": 0, "resetAt": "2026-03-15T19:00:00.000Z" }
}
```

Note the envelope: a partial import is still a `success`, because rows were
written and `data` reports what landed. The `429` status and `Retry-After` are
what tell the client the seller is now blocked for the rest of the day. Clients
must therefore branch on the status code, not on `success`, to decide whether to
disable the upload control.

## Pagination

Every list route pages the same way, through `parsePagination` /
`buildPaginationMeta` in `lib/pagination.ts`.

| Query param | Default | Notes |
|-------------|---------|-------|
| `page` | `1` | 1-based. Anything that is not a positive integer is read as 1 |
| `limit` | `PAGE_SIZE` (10) | Clamped server-side; a client cannot ask for the whole table |

The response `meta` is always the full block — `currentPage`, `totalPages`,
`totalItems`, `itemsPerPage`, `hasNextPage`, `hasPreviousPage` — never a bare
`{ totalItems }`, because that is what `<Pagination>` reads. There are no
per-route `defaultLimit` overrides: an override was the reason one admin table
quietly served 50 rows while the pager assumed 10.

Rows whose joined parent has since been deleted join back as `null`. Clients are
expected to drop those rows rather than render a blank card.

Ordering is always `ORDER BY <sort>, id`. The `id` tiebreaker is not optional:
several of these sort columns (`created_at` on two comments written in the same
second, `name` on two brands sharing a name) are not unique, so without it a row
can be served twice across a page boundary or skipped entirely.

Client-side, the page number lives in `?page=` rather than in React state —
`hooks/usePageParam.ts` — so every paginated view is shareable, survives a
refresh, and cooperates with browser back/forward. Changing a filter drops the
stale page automatically.

Supporting indexes: `supabase/2027-pagination-indexes.sql` (run once in the
Supabase SQL editor; it is idempotent).

## Auth

- Public routes need no session (e.g. `products`, `blog-posts`, `sellers`, `banners`, `reviews` GET).
- Buyer routes require a logged-in **buyer** session (e.g. `cart`, `orders`, `wishlist`, `addresses`).
- Seller routes require a **seller** session and verified vendor (e.g. `seller/*`).
- Admin routes require the **admin** role (e.g. `admin/*`).
- Session is resolved server-side via Supabase cookies; endpoints return `401` when missing.

## /addresses

Buyer shipping addresses.

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/auth/addresses |
| POST | /api/v1/addresses |

`GET /api/v1/auth/addresses` is paginated and orders defaults first, then newest.

## /admin

Administrator operations (auth: admin role).

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/admin/analytics/dashboard |
| GET | /api/v1/admin/analytics/orders |
| GET, POST | /api/v1/admin/blog-posts |
| DELETE, GET, PUT | /api/v1/admin/blog-posts/[id] |
| GET, POST | /api/v1/admin/brands |
| DELETE, PUT | /api/v1/admin/brands/[id] |
| GET, POST, PUT | /api/v1/admin/categories |
| DELETE, PUT | /api/v1/admin/categories/[id] |
| GET | /api/v1/admin/contact |
| PATCH | /api/v1/admin/contact/[id] |
| GET, POST | /api/v1/admin/coupons |
| DELETE, PUT | /api/v1/admin/coupons/[id] |
| GET | /api/v1/admin/export/orders |
| GET | /api/v1/admin/export/products |
| GET | /api/v1/admin/export/users |
| GET | /api/v1/admin/logs |
| GET | /api/v1/admin/consent-audit |
| GET | /api/v1/admin/orders |
| GET, PATCH | /api/v1/admin/orders/[id] |
| GET, PATCH | /api/v1/admin/products |
| POST | /api/v1/admin/products/bulk |
| DELETE, GET, PUT | /api/v1/admin/products/[id] |
| PUT | /api/v1/admin/products/[id]/moderation |
| GET | /api/v1/admin/reports |
| GET | /api/v1/admin/reviews |
| DELETE, PATCH | /api/v1/admin/reviews/[id] |
| GET | /api/v1/admin/sellers |
| POST | /api/v1/admin/sellers/[id]/reject |
| POST | /api/v1/admin/sellers/[id]/suspend |
| POST | /api/v1/admin/sellers/[id]/verify |
| GET, PUT | /api/v1/admin/settings |
| GET, POST | /api/v1/admin/social-links |
| DELETE, PATCH, PUT | /api/v1/admin/social-links/[id] |
| GET | /api/v1/admin/stats |
| GET, POST | /api/v1/admin/translations |
| GET, PATCH | /api/v1/admin/users |
| DELETE, GET, PATCH | /api/v1/admin/users/[id] |
| POST | /api/v1/admin/users/[id]/block |
| POST | /api/v1/admin/users/[id]/unblock |

## /auth

Authentication and account management.

| Method(s) | Endpoint |
|-----------|----------|
| GET, POST | /api/v1/auth/addresses |
| DELETE, PUT | /api/v1/auth/addresses/[id] |
| POST | /api/v1/auth/change-password |
| POST | /api/v1/auth/delete-account |
| POST | /api/v1/auth/demo |
| POST | /api/v1/auth/demo/seed-all |
| POST | /api/v1/auth/forgot-password |
| POST | /api/v1/auth/login |
| POST | /api/v1/auth/logout |
| GET | /api/v1/auth/me |
| GET, PUT | /api/v1/auth/profile |
| POST | /api/v1/auth/register |
| POST | /api/v1/auth/resend-verification |
| POST | /api/v1/auth/reset-password |
| GET | /api/v1/auth/reviews |
| POST | /api/v1/auth/verify-email |

## /banners

Homepage hero banners (public GET, admin CRUD).

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/banners |

## /blog-posts

Blog articles (public GET, admin/seller CRUD).

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/blog-posts |
| GET | /api/v1/blog-posts/[id] |
| GET, POST | /api/v1/blog-posts/[id]/comments |

Comments are paginated, newest first. `GET /api/v1/blog-posts` orders published
articles by `published_at`.

## /brands

Endpoints in the brands group.

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/brands |

## /cart

Buyer cart (server-backed, keyed by user).

| Method(s) | Endpoint |
|-----------|----------|
| GET, POST | /api/v1/cart/items |
| DELETE, PATCH | /api/v1/cart/items/[id] |

## /categories

Product taxonomy.

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/categories |
| GET | /api/v1/categories/[id]/children |

`GET /api/v1/admin/categories` is paginated over **top-level categories only**
(`parent_id IS NULL`), with each row's `subcategories` fetched in one follow-up
query. Paging the flat table would split a parent from its children, and
`totalItems` would count children that are not independently listed. The response
also carries `stats` (`totalCategories`, `activeCategories`, `totalProducts`)
because the admin stat cards cannot be derived from one page.

## /contact

Public contact form.

| Method(s) | Endpoint |
|-----------|----------|
| POST | /api/v1/contact |

## /coupons

Discount coupons.

| Method(s) | Endpoint |
|-----------|----------|
| POST | /api/v1/coupons/validate |

## /newsletter

Newsletter subscriptions.

| Method(s) | Endpoint |
|-----------|----------|
| POST | /api/v1/newsletter/subscribe |

## /orders

Buyer orders and lifecycle actions.

| Method(s) | Endpoint |
|-----------|----------|
| GET, POST | /api/v1/orders |
| GET | /api/v1/orders/[id] |
| POST | /api/v1/orders/[id]/cancel |
| POST | /api/v1/orders/[id]/refund |
| POST | /api/v1/orders/[id]/return |
| GET | /api/v1/orders/[id]/track |

## /payments

Payment providers (Easypaisa, JazzCash, Stripe, COD).

| Method(s) | Endpoint |
|-----------|----------|
| POST | /api/v1/payments/cod |
| POST | /api/v1/payments/easypaisa/initiate |
| POST | /api/v1/payments/easypaisa/webhook |
| POST | /api/v1/payments/jazzcash/initiate |
| POST | /api/v1/payments/jazzcash/webhook |
| POST | /api/v1/payments/stripe/initiate |
| POST | /api/v1/payments/stripe/webhook |
| GET | /api/v1/payments/[id]/receipt |

## /products

Product catalog and merchandising.

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/products |
| GET | /api/v1/products/price-range |
| GET | /api/v1/products/search |
| GET | /api/v1/products/[slug] |
| GET | /api/v1/products/[slug]/related |
| GET, POST | /api/v1/products/[slug]/reviews |
| PATCH | /api/v1/products/[slug]/stock |
| POST | /api/v1/products/[slug]/views |

## /reviews

Product reviews.

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/reviews |
| DELETE, PATCH | /api/v1/reviews/[id] |
| POST | /api/v1/reviews/[id]/helpful |
| POST | /api/v1/reviews/[id]/report |

## /search

Search, autocomplete, trending and search history. Voice search is performed
entirely in the browser via the Web Speech API and is sent to the same
`/api/v1/search/history` endpoint as a typed query, so there is no separate
voice endpoint.

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/search/autocomplete |
| GET, POST | /api/v1/search/history |
| GET | /api/v1/search/suggestions |
| GET | /api/v1/search/trending |

## /seller

Seller dashboard operations (auth: seller/vendor).

| Method(s) | Endpoint |
|-----------|----------|
| GET, POST | /api/v1/seller/coupons |
| DELETE, PATCH | /api/v1/seller/coupons/[id] |
| GET | /api/v1/seller/earnings |
| GET | /api/v1/seller/earnings/trend |
| GET | /api/v1/seller/orders |
| GET, PATCH | /api/v1/seller/orders/[id] |
| GET | /api/v1/seller/payout |
| POST | /api/v1/seller/payout/request |
| GET, POST | /api/v1/seller/products |
| POST | /api/v1/seller/products/import |
| GET | /api/v1/seller/products/quota |
| DELETE, GET, PUT | /api/v1/seller/products/[id] |
| GET, PUT | /api/v1/seller/profile |
| GET | /api/v1/seller/reviews |
| POST | /api/v1/seller/reviews/[id] |

## /sellers

Public storefront data.

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/sellers |
| GET | /api/v1/sellers/[slug] |

## /settings

Store settings (general, layout, payments, seo).

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/settings/public |

## /social-links

Public social links.

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/social-links |

## /uploads

File/image uploads.

| Method(s) | Endpoint |
|-----------|----------|
| POST | /api/v1/uploads |

## /wishlist

Buyer wishlist.

| Method(s) | Endpoint |
|-----------|----------|
| GET, POST | /api/v1/wishlist |
| GET | /api/v1/wishlist/summary |
| POST | /api/v1/wishlist/share |
| DELETE | /api/v1/wishlist/[productId] |

### GET /api/v1/wishlist

Paginated. Each row is `{ id, product_id, created_at, products }` where
`products` is the joined product, or `null` if it has since been deleted or
deactivated — clients must drop those rows rather than render them.

`?productId=` switches to the legacy single-row membership probe and returns
`{ saved: boolean }` instead. Prefer `/wishlist/summary`: the probe costs one
request per product card on a grid.

### GET /api/v1/wishlist/summary

One request for everything the header badge and every product-card heart need:
the total count and the full set of saved product ids.

```json
{ "success": true, "data": { "count": 12, "productIds": ["…", "…"] } }
```

No pagination — this is deliberately the whole set, because the client uses it
to answer "is this product saved?" in memory. It is a single indexed scan of the
caller's own rows, capped by how many products one shopper has saved.

## Review status semantics

Product reviews are moderation-first. Every new or edited review starts as `pending` and only becomes visible publicly after an admin approves it.

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting admin approval; not counted in product rating/breakdown |
| `approved` | Publicly visible and counted in product ratings |
| `rejected` | Denied by an admin; owners can delete but can no longer edit the row |
| `flagged` | Flagged for review (admin/moderation); reduced visibility through RLS |

Enforced in the API and by RLS:

- `POST /api/v1/products/[slug]/reviews` inserts with `status = 'pending'` and returns `requires_approval: true`.
- `PATCH /api/v1/reviews/[id]` validates with the review schema, rejects edits of `rejected` reviews and edits older than 30 days, and re-queues the review (`status -> 'pending'`). RLS guarantees a buyer can only end a review in `pending`, so self-approval is impossible.
- `PATCH /api/v1/admin/reviews/[id]` accepts `pending | approved | flagged | rejected` (admin only).
- Product rating, rating breakdown, and `review_count` only count `approved` reviews (see the `update_product_rating()` trigger).

`GET /api/v1/products/price-range` returns `{ min, max }` across active products to bound the shop's price filter slider.

