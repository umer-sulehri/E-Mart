# E-Mart — Organic Grocery E-Commerce Platform

[![CI](https://github.com/your-org/e-mart/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/e-mart/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

A production-grade multi-vendor e-commerce platform for organic groceries, built on the **Next.js 14 App Router**, **Supabase (PostgreSQL)**, and **Tailwind CSS**.

## Overview

E-Mart implements the full retail lifecycle with four role-based experiences:

| Role | Access | Capabilities |
|------|--------|-------------|
| Guest / Customer | Public site | Browse, search, compare, wishlist, cart, checkout, track orders |
| Customer | `/dashboard` | Profile, addresses, orders, wishlist, change password, reviews |
| Seller / Vendor | `/seller` | Products, orders, coupons, earnings, payouts, reviews, storefront |
| Admin | `/admin` | Products, orders, users, sellers, categories, banners, blog, coupons, analytics, settings |

## Tech Stack

- **Framework:** Next.js 14.2 (App Router, SSR, route groups)
- **Language:** TypeScript 5.6 (strict)
- **Styling:** Tailwind CSS 3.4
- **Backend:** Supabase (PostgreSQL) with RLS + server-side auth
- **State:** Zustand (cart, auth, compare, UI)
- **Validation:** Zod + React Hook Form
- **Charts:** Recharts · **Carousels:** Swiper · **Icons:** Lucide
- **Testing:** Vitest

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> e-mart
cd e-mart
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your Supabase URL + anon key + service role key

# 3. Seed the database (see supabase/SEEDING_GUIDE.md or docs/SEEDING_GUIDE.md)
#    Run supabase/schema.sql then supabase/seed*.sql against your project.

# 4. Run locally
npm run dev

# 5. Verify
npm run lint
npm run typecheck
npm run test
npm run build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (backend) | Service-role key, server-only |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical public URL |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Optional | Comma-separated admin allow-list for OAuth escalation |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | Optional | `true` to enable demo-account login |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Optional | Enables real Stripe payments |
| `JAZZCASH_MERCHANT_ID` / `EASYPAISA_MERCHANT_ID` | Optional | Enables local gateway demo |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics 4 measurement ID |

See `.env.example` for the complete list.

## Project Structure

```
app/                    # Next.js App Router
  (public)/             # Customer-facing store pages
  (auth)/               # Login / register / password flows
  admin/                # Admin dashboard (17+ modules)
  seller/               # Seller dashboard (8 modules)
  dashboard/            # Customer dashboard
  api/v1/               # REST API (127 route handlers)
components/             # Reusable UI + feature components
lib/                    # API client, utils, validators, security helpers
hooks/                  # Custom React hooks
store/                  # Zustand stores (cart, auth, compare, ui)
types/                  # Shared TypeScript types
supabase/               # schema.sql, seeds, migrations, RLS policies
middleware.ts           # Route protection / role guard
```

## Database

Full schema lives in `supabase/schema.sql` (~1,700 lines): 28+ tables with
Row-Level Security on every table, `updated_at` triggers, and `SECURITY DEFINER`
helpers for cross-role queries.

To apply the performance indexes + full-text search:

```bash
# Run in the Supabase SQL editor
supabase/2026-performance-indexes.sql
```

Backup every RLS policy via `supabase/schema.sql` (version-controlled).

## API

REST API under `/api/v1/` — see `docs/API_REFERENCE.md` for the complete endpoint list.

Key resources: `auth`, `products`, `categories`, `cart`, `orders`, `payments`,
`reviews`, `wishlist`, `search`, `seller/*`, `admin/*`.

All list endpoints support `page` + `limit` pagination (default 20, max 100).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (Next.js) |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint + autofix |
| `npm run typecheck` | `tsc --noEmit` strict check |
| `npm run test` | Run Vitest suite (143 tests) |

## Deployment (Vercel)

1. Push `main` to your Vercel-connected GitHub repo (auto-deploys).
2. Add all env vars listed above in **Vercel → Project → Settings → Environment Variables**.
3. Security headers + redirects are configured in `next.config.js` and `vercel.json`.
4. Point your custom domain at Vercel and test the auth callback URL.

Recommended branch flow: `develop` → `staging` → `main` (Vercel can auto-deploy each).

## Documentation

- `E-MART_PROJECT_SUMMARY.md` — full project report
- `docs/API_REFERENCE.md` — REST API reference
- `docs/SEEDING_GUIDE.md` — fresh-project database setup
- `docs/BUGS_FOUND.md` — bug register + fixes
- `PAYMENTS.md` — payment gateway status & enabling guide
- `TESTING_CHECKLIST.md` — manual QA checklist

## License

Private / proprietary.