-- ============================================================================
-- E-Mart Deploy Fixes (2026)
-- ----------------------------------------------------------------------------
-- APPLY THIS FILE IN THE SUPABASE SQL EDITOR of the NEW project
-- (qybkdcxopgftupmdqtfr) BEFORE deploying the app to production.
--
-- Contents:
--   1. orders RLS: buyers update/delete own orders, sellers update orders
--      containing their products (unblocks COD confirm, cancel, fulfillment)
--   2. reviews: add seller_reply columns (used by the seller reply API)
--   3. review_reports: UNIQUE(review_id, reporter_user_id) + view own reports
--   4. search_history: users can delete own history (dedupe/trim)
--
-- This file mirrors the matching changes already applied to supabase/schema.sql
-- so the running database and the canonical schema stay in sync.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ORDERS WRITE POLICIES
-- ----------------------------------------------------------------------------
-- Buyers confirm COD orders and cancel their own orders; sellers advance
-- fulfillment status. Both were previously admin-only (silent 0-row updates).
-- NOTE: these policies rely on public.user_owns_order / public.user_can_view_order
-- which were created by 2026-fix-migrations.sql (already applied).
-- ============================================================================

-- Buyers update their own orders (COD confirmation, cancellation, etc.)
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Buyers delete their own orders (transaction rollback in create-order route)
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
CREATE POLICY "Users can delete own orders"
  ON orders FOR DELETE
  USING (auth.uid() = user_id);

-- Sellers update order/status rows containing their products (fulfillment)
DROP POLICY IF EXISTS "Sellers can update orders containing their products" ON orders;
CREATE POLICY "Sellers can update orders containing their products"
  ON orders FOR UPDATE
  USING (public.user_can_view_order(orders.id));

-- ============================================================================
-- 2. REVIEWS: SELLER REPLY COLUMNS
-- ----------------------------------------------------------------------------
-- The seller reply API updates seller_reply / seller_reply_at, which were
-- referenced by the route but missing from the table.
-- ============================================================================

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS seller_reply TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS seller_reply_at TIMESTAMPTZ;

-- ============================================================================
-- 3. REVIEW REPORTS: UNIQUE + VIEW OWN
-- ----------------------------------------------------------------------------
-- One report per review/user (the API depends on insert-or-reject semantics),
-- plus a SELECT policy so a user's duplicate check isn't blocked by RLS.
-- ============================================================================

-- Defensive cleanup before the unique index (in case duplicate rows exist).
DELETE FROM review_reports a
USING review_reports b
WHERE a.id < b.id
  AND a.review_id = b.review_id
  AND a.reporter_user_id = b.reporter_user_id;

-- The UNIQUE constraint exists in schema.sql; add it here for parity. If it
-- already exists (fresh install via schema.sql), this no-ops.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'review_reports_review_id_reporter_user_id_key'
  ) THEN
    ALTER TABLE review_reports
      ADD CONSTRAINT review_reports_review_id_reporter_user_id_key
      UNIQUE (review_id, reporter_user_id);
  END IF;
END;
$$;

DROP POLICY IF EXISTS "Users can view own review reports" ON review_reports;
CREATE POLICY "Users can view own review reports"
  ON review_reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

-- ============================================================================
-- 4. SEARCH HISTORY: DELETE OWN
-- ----------------------------------------------------------------------------
-- The search history API dedupes/trims a user's rows; DELETE was missing.
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own search history" ON search_history;
CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;