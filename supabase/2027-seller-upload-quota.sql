-- 2027-09: Seller daily product-upload quota (10 per rolling 24h)
--
-- No new table is required for the quota itself: Redis (@vercel/kv) is the fast
-- path and a count over `products` is the authoritative fallback. What this
-- migration adds is the composite index that makes that count cheap.
--
-- The quota check counts a seller's products with
--   vendor_id = $1 AND created_at > now() - interval '24 hours'
-- and orders by created_at ascending to find the oldest row in the window.
-- Only `idx_products_vendor_id` (single column) exists today, so Postgres
-- would have to filter the vendor's entire catalogue by created_at to answer
-- it. This index turns the check into a bounded range scan over the 24h slice
-- only — the same query runs on every product POST and on the quota GET.
--
-- Add seller_quota_events (optional, phase 2) for a per-seller audit trail.
-- NOTE: vendors uses `user_id`, not `owner_id` — see docs/DESIGN_SYSTEM.md.

CREATE INDEX IF NOT EXISTS idx_products_vendor_created_at
  ON products(vendor_id, created_at DESC);
