-- 2027-09: Seller daily product-upload quota (10 per rolling 24h)
--
-- SUPERSEDED by 2027-product-daily-limit.sql, which additionally installs the
-- authoritative BEFORE INSERT trigger and switches the window from a rolling
-- 24 hours to a fixed Asia/Karachi calendar day.
--
-- Kept because the index below is still required by that trigger's count; it is
-- applied by both files via CREATE INDEX IF NOT EXISTS, so running either is
-- safe.
--
-- No new table is required for the quota itself: Redis (@vercel/kv) is the fast
-- path and a count over `products` is the authoritative fallback. What this
-- migration adds is the composite index that makes that count cheap.
--
-- The quota check counts a seller's products with
--   vendor_id = $1 AND created_at >= quota_day_start(now())
-- Only `idx_products_vendor_id` (single column) exists in schema.sql, so
-- Postgres would otherwise have to filter the vendor's entire catalogue by
-- created_at to answer it. This index turns the check into a bounded range scan
-- over today's slice only.
--
-- NOTE: vendors uses `user_id`, not `owner_id` — see docs/DESIGN_SYSTEM.md.

CREATE INDEX IF NOT EXISTS idx_products_vendor_created_at
  ON products(vendor_id, created_at DESC);
