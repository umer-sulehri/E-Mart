# E-Mart API Reference

Auto-generated from the Next.js App Router route handlers under `app/api/v1`.

Base path: `/api/v1`. All handlers return JSON.

## Response envelope

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether the request succeeded |
| `data` | `any` | Payload on success (list/detail/created record) |
| `error` | `string` | Message on failure (or `none` when no data field) |
| `meta` | `object` | Pagination: `currentPage`, `totalPages`, `totalItems`, `itemsPerPage`, `hasNextPage`, `hasPreviousPage` |
| `summary` | `object[]` | Aggregates where applicable (e.g. orders) |

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
| POST | /api/v1/addresses |

## /admin

Administrator operations (auth: admin role).

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/admin/analytics/dashboard |
| GET | /api/v1/admin/analytics/orders |
| GET, POST | /api/v1/admin/banners |
| DELETE, PUT | /api/v1/admin/banners/[id] |
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

## /notifications

In-app + email/SMS notifications.

| Method(s) | Endpoint |
|-----------|----------|
| GET, PATCH | /api/v1/notifications |
| POST | /api/v1/notifications/email/send |
| POST | /api/v1/notifications/mark-all-read |
| GET, PUT | /api/v1/notifications/preferences |
| POST | /api/v1/notifications/sms/send |

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

Search, autocomplete, trending, voice.

| Method(s) | Endpoint |
|-----------|----------|
| GET | /api/v1/search/autocomplete |
| GET, POST | /api/v1/search/history |
| GET | /api/v1/search/suggestions |
| GET | /api/v1/search/trending |
| POST | /api/v1/search/voice |

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
| POST | /api/v1/wishlist/share |
| DELETE | /api/v1/wishlist/[productId] |

