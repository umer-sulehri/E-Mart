# E-Mart Seed Accounts — Seeding Guide

All credentials live in `data/seed-accounts.json` (gitignored — contains passwords).

## Quick Start

1. Ensure `.env.local` has:
   ```
   NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Start dev server: `npm run dev`

3. Seed all 16 accounts at once:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/demo/seed-all \
     -H "Content-Type: application/json"
   ```

4. Or log in individually via the login page demo buttons.

---

## All Dummy Credentials

### Admin Accounts (3)

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `admin.super@emart.com` | `SuperAdmin@E2025#` | super_admin | Platform founder, full system access |
| `admin.content@emart.com` | `ContentAdmin@E2025#` | content_admin | Marketing, content, customer engagement |
| `admin.ops@emart.com` | `OpsAdmin@E2025#` | ops_admin | Orders, refunds, support escalations |

### Seller Accounts (5)

| Email | Password | Store | Commission |
|-------|----------|-------|------------|
| `seller.organic@emart.com` | `SellerOrganic@2025#` | Fresh Organic Valley | 8% |
| `seller.snacks@emart.com` | `SellerSnacks@2025#` | Desi Delight Snacks | 10% |
| `seller.household@emart.com` | `SellerHouse@2025#` | HomeCare Essentials | 12% |
| `seller.electronics@emart.com` | `SellerElectro@2025#` | TechHub Pro Store | 7% |
| `seller.new@emart.com` | `SellerNew@2025#` | Nida's Crafts Studio | 15% (pending) |

### Buyer Accounts (8)

| Email | Password | Persona |
|-------|----------|---------|
| `buyer.health@emart.com` | `BuyerHealth@2025#` | Health-conscious doctor |
| `buyer.family@emart.com` | `BuyerFamily@2025#` | Budget family shopper |
| `buyer.tech@emart.com` | `BuyerTech@2025#` | Tech-savvy professional |
| `buyer.occasional@emart.com` | `BuyerOccas@2025#` | Occasional impulse buyer |
| `buyer.bulk@emart.com` | `BuyerBulk@2025#` | Small business bulk buyer |
| `buyer.vip@emart.com` | `BuyerVIP@2025#` | VIP Platinum customer |
| `buyer.lapsed@emart.com` | `BuyerLapsed@2025#` | Lapsed/inactive customer |
| `buyer.guest@emart.com` | `BuyerGuest@2025#` | Guest checkout converter |

---

## API Endpoints

### Single account login
```bash
# Login as first buyer
curl -X POST http://localhost:3000/api/v1/auth/demo \
  -H "Content-Type: application/json" \
  -d '{ "role": "buyer" }'

# Login as specific account
curl -X POST http://localhost:3000/api/v1/auth/demo \
  -H "Content-Type: application/json" \
  -d '{ "email": "buyer.vip@emart.com" }'
```

### Bulk seed all accounts
```bash
curl -X POST http://localhost:3000/api/v1/auth/demo/seed-all \
  -H "Content-Type: application/json"
```

---

## Files

| File | Purpose |
|------|---------|
| `data/seed-accounts.json` | All 16 accounts with credentials (gitignored) |
| `app/api/v1/auth/demo/route.ts` | Single login + shorthand role support |
| `app/api/v1/auth/demo/seed-all/route.ts` | Bulk create all accounts |

---

## How It Works

1. `POST /api/v1/auth/demo` or `/seed-all` uses the **Supabase Admin SDK** (`createAdminClient`) to create auth users with hashed passwords
2. A DB trigger auto-creates a `profiles` row — the route ensures the role is set correctly
3. For seller accounts, a `vendors` row is also created (with `vendorStatus: "pending"` for the unverified seller)
4. Passwords are hashed by Supabase Auth (bcrypt) — never stored in plaintext in the database
5. The `seed-accounts.json` file contains plaintext passwords for reference only — it is gitignored
