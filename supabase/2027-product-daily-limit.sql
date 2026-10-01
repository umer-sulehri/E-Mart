-- 2027-10: Daily product-upload limit — atomic enforcement
--
-- Adds the AUTHORITATIVE gate for the 10-products-per-seller-per-day rule that
-- lib/seller-quota.ts enforces in the application layer.
--
-- Why a trigger rather than an RPC:
--   The application check is check-then-insert, so two concurrent requests can
--   both observe "9 used" and both insert, taking the seller to 11. A BEFORE
--   INSERT trigger closes that race, and unlike an RPC it also covers paths
--   the app layer does not: a direct PostgREST insert from a client holding the
--   anon key, or a future import path. One rule, every entry point.
--
--   Note the trigger takes a per-vendor advisory lock before counting. A trigger
--   that only counted would still be check-then-insert, and would still lose the
--   race it exists to win; see step 3.
--
-- The window is a fixed calendar day in Asia/Karachi (PKT, UTC+05:00), matching
-- lib/seller-quota.ts. PKT has observed no DST since 2009, so the offset is
-- constant; it is still expressed as a rule rather than hardcoded arithmetic so
-- the two implementations stay legible side by side.
--
-- Rules:
--   - Creations only. This is a BEFORE INSERT trigger, so edits are untouched.
--   - Deleted products still count. The count has no status filter, so removing
--     a product and re-adding it cannot buy another slot.
--   - Counted per creator (vendor_id).
--   - created_at is overwritten with the server's NOW() on insert, so the quota
--     window cannot be dodged by supplying a timestamp from another day.
--   - Rows with a NULL vendor_id are not counted against anyone (products whose
--     vendor was deleted get vendor_id NULL via ON DELETE SET NULL). They are
--     allowed; a platform-owned row cannot be attributed to a seller.
--
-- The trigger raises SQLSTATE 'P0001' with a sentinel message containing
-- 'DAILY_PRODUCT_LIMIT'. lib/seller-quota.ts maps that message back to a 429
-- with the standard envelope (see isDailyLimitDatabaseError), so a rejected
-- insert surfaces to the seller as "Daily limit of 10 products reached" rather
-- than a 500.
--
-- Idempotent: safe to re-run.
--
-- NOTE: there is no migration runner in this repo. Run this manually in the
-- Supabase SQL editor before deploying the application code.

-- ---------------------------------------------------------------------------
-- 1. Settings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.app_settings IS
  'Runtime-tunable platform settings. Single source of truth for limits that '
  'would otherwise be magic numbers in application code.';

-- The limit itself. Kept in sync with MAX_PRODUCTS_PER_DAY in lib/seller-quota.ts;
-- the trigger reads this row so the limit can be changed without a redeploy.
INSERT INTO public.app_settings (key, value)
VALUES ('max_products_per_day', '10')
ON CONFLICT (key) DO NOTHING;

-- Whether admins bypass the daily allowance. Mirrors QUOTA_EXEMPT_ADMINS.
INSERT INTO public.app_settings (key, value)
VALUES ('exempt_admins_from_daily_product_limit', 'true')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Day-boundary helpers
-- ---------------------------------------------------------------------------

-- Start of the current Asia/Karachi calendar day.
CREATE OR REPLACE FUNCTION public.quota_day_start(at TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT date_trunc('day', at AT TIME ZONE 'Asia/Karachi') AT TIME ZONE 'Asia/Karachi';
$$;

COMMENT ON FUNCTION public.quota_day_start(TIMESTAMPTZ) IS
  'Midnight of the Asia/Karachi calendar day containing `at`, as an absolute instant.';

-- Next Asia/Karachi midnight — when a seller''s allowance frees up.
CREATE OR REPLACE FUNCTION public.quota_day_reset(at TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT (date_trunc('day', at AT TIME ZONE 'Asia/Karachi') + INTERVAL '1 day')
         AT TIME ZONE 'Asia/Karachi';
$$;

-- The configured daily allowance.
CREATE OR REPLACE FUNCTION public.max_products_per_day()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT value::INTEGER
       FROM public.app_settings
      WHERE key = 'max_products_per_day'),
    10
  );
$$;

COMMENT ON FUNCTION public.max_products_per_day() IS
  'Maximum products a seller may create per Asia/Karachi calendar day. Default 10.';

CREATE OR REPLACE FUNCTION public.admins_exempt_from_daily_product_limit()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT value::BOOLEAN
       FROM public.app_settings
      WHERE key = 'exempt_admins_from_daily_product_limit'),
    true
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. The gate
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_daily_product_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit    INTEGER := public.max_products_per_day();
  v_used     INTEGER;
  v_now      TIMESTAMPTZ := NOW();
  v_start    TIMESTAMPTZ := public.quota_day_start(v_now);
BEGIN
  -- Rows not attributable to a seller are not charged to any seller.
  IF NEW.vendor_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins are exempt by default so moderation and catalogue curation are never
  -- throttled. Resolved through the vendors -> profiles chain.
  IF public.admins_exempt_from_daily_product_limit()
     AND EXISTS (
       SELECT 1
         FROM public.vendors v
         JOIN public.profiles p ON p.id = v.user_id
        WHERE v.id = NEW.vendor_id
          AND p.role = 'admin'
     )
  THEN
    RETURN NEW;
  END IF;

  -- Serialise concurrent inserts by this one vendor. Without it the count below
  -- is still check-then-insert: two requests that arrive together both read the
  -- same v_used, both pass, and the seller ends up over the limit. The lock is
  -- transaction-scoped, so it is released automatically on commit or rollback and
  -- a failed insert cannot wedge the vendor's quota. Keyed on vendor_id, so
  -- unrelated vendors never contend and a busy catalogue does not serialise.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.vendor_id::TEXT, 0));

  -- Server-authoritative creation time. Left as the caller's value, a client
  -- could set created_at to yesterday and be counted in neither window: every
  -- row lands outside today's range, so the allowance would never be consumed
  -- and the limit could be bypassed entirely. Assigning here makes the value the
  -- quota is measured against the one the database observed.
  NEW.created_at := v_now;

  SELECT count(*) INTO v_used
    FROM public.products p
   WHERE p.vendor_id = NEW.vendor_id
     AND p.created_at >= v_start
     AND p.created_at <  public.quota_day_reset(v_now);

  IF v_used >= v_limit THEN
    RAISE EXCEPTION
      'DAILY_PRODUCT_LIMIT: seller % has created % of % products for % (resets at %)',
      NEW.vendor_id, v_used, v_limit, v_start, public.quota_day_reset(v_now)
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_daily_product_limit() IS
  'BEFORE INSERT gate for the daily seller product allowance. Raises '
  'DAILY_PRODUCT_LIMIT (SQLSTATE P0001) when the seller is already at the limit '
  'for the current Asia/Karachi calendar day. Enforces creations only, counts '
  'deleted products, and is scoped per vendor_id.';

DROP TRIGGER IF EXISTS products_daily_limit ON public.products;

CREATE TRIGGER products_daily_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_daily_product_limit();

-- ---------------------------------------------------------------------------
-- 4. Index
-- ---------------------------------------------------------------------------

-- The trigger's count is (vendor_id, created_at range) on every single product
-- insert. Without this composite index Postgres scans the vendor's whole
-- catalogue on each insert, which turns catalogue growth into a write-time
-- regression for every seller.
CREATE INDEX IF NOT EXISTS idx_products_vendor_created_at
  ON public.products(vendor_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Verification
-- ---------------------------------------------------------------------------
--
-- After applying, confirm with:
--
--   SELECT tgname, tgenabled FROM pg_trigger
--    WHERE tgrelid = 'public.products'::regclass AND NOT tgisinternal;
--
-- Expect one row: products_daily_limit | O
--
-- And confirm the settings landed:
--
--   SELECT key, value FROM public.app_settings ORDER BY key;
--
-- Then smoke-test the limit end to end as a seller: the 11th product of the day
-- should return HTTP 429 with error.code = 'DAILY_PRODUCT_LIMIT'.
--
-- To prove the concurrency guard rather than assume it, run two inserts for the
-- same vendor at once and check only one survives:
--
--   BEGIN;
--   -- seed a vendor with v_used = limit - 1, in a separate committed session
--   INSERT INTO public.products (name, vendor_id, /* ... */)
--   SELECT 'concurrent probe A', v_id FROM ...;
--   -- and the same from a second session, started before the first commits
--
-- Exactly one must succeed; the other must raise DAILY_PRODUCT_LIMIT. Without the
-- advisory lock both succeed and the seller is over the limit.

-- ---------------------------------------------------------------------------
-- 6. Required index for the lock
-- ---------------------------------------------------------------------------

-- hashtextextended over vendor_id is what the advisory lock keys on; the existing
-- (vendor_id, created_at DESC) index in step 4 already covers the count that
-- follows it, so no additional index is required here.