-- ============================================================================
-- E-Mart Critical Fix Migrations (2026)
-- ----------------------------------------------------------------------------
-- APPLY THIS FILE IN THE SUPABASE SQL EDITOR (or via Supabase CLI).
-- This migration addresses the P0 blockers documented in the Final Build Report.
--
-- Contents:
--   1. Break infinite RLS recursion between orders <-> order_items
--   2. Add missing INSERT/DELETE policies on order_items
--   3. Allow sellers to manage their own coupons (RLS)
--   4. Add notification_preferences table (referenced by API but absent)
--   5. Seed helper notes for storage buckets (see storage-buckets.sql)
--   6. Migrate legacy settings JSON payouts into seller_payouts table
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. INFINITE RECURSION FIX (orders <-> order_items)
-- ----------------------------------------------------------------------------
-- PROBLEM:
--   orders policy "Sellers can view orders containing their products" subqueries
--   order_items. order_items policy "Users can view own order items" subqueries
--   orders. PostgreSQL must evaluate ALL policies (OR'd) on every row, so even a
--   simple customer order query triggers the loop => ERROR 42P17.
--
-- FIX: Use a SECURITY DEFINER function so the cross-table lookup bypasses RLS,
--   breaking the evaluation recursion chain. The function owner (postgres)
--   runs the internal query with full privileges, so no policy is re-evaluated.
-- ============================================================================

DROP POLICY IF EXISTS "Sellers can view orders containing their products" ON orders;

CREATE OR REPLACE FUNCTION public.user_can_view_order(target_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN vendors v ON oi.vendor_id = v.id
    WHERE oi.order_id = target_order_id
      AND v.user_id = auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.user_can_view_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_view_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_view_order(UUID) TO anon;

CREATE POLICY "Sellers can view orders containing their products"
  ON orders FOR SELECT
  USING (public.user_can_view_order(orders.id));

-- ----------------------------------------------------------------------------
-- 2. MISSING WRITE POLICIES ON order_items
-- ----------------------------------------------------------------------------
-- The order_items table previously had NO INSERT/UPDATE/DELETE policies, so
-- user-JWT writes silently failed (PostgREST returns 0 rows, no error).
-- These helpers allow a user to write order items that belong to their own
-- orders without re-triggering recursion (they only read orders by direct id).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_owns_order(target_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM orders
    WHERE id = target_order_id AND user_id = auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.user_owns_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_order(UUID) TO anon;

-- Users can insert order items belonging to their own orders
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (public.user_owns_order(order_id));

-- Users can delete order items belonging to their own orders (rollback)
DROP POLICY IF EXISTS "Users can delete own order items" ON order_items;
CREATE POLICY "Users can delete own order items"
  ON order_items FOR DELETE
  USING (public.user_owns_order(order_id));

-- ============================================================================
-- 3. COUPON RLS: ALLOW SELLERS TO MANAGE THEIR OWN COUPONS
-- ----------------------------------------------------------------------------
-- Previously only admins could INSERT/UPDATE/DELETE coupons. The seller API
-- already sets created_by server-side from auth.uid(), so seller_id = created_by.
-- ============================================================================

DROP POLICY IF EXISTS "Sellers can manage own coupons" ON coupons;

CREATE POLICY "Sellers can manage own coupons"
  ON coupons FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Sellers should also see their own (even inactive) coupons; the existing
-- "Active coupons are viewable by everyone" already covers active ones.
DROP POLICY IF EXISTS "Sellers can view own coupons" ON coupons;
CREATE POLICY "Sellers can view own coupons"
  ON coupons FOR SELECT
  USING (auth.uid() = created_by);

-- ============================================================================
-- 4. notification_preferences TABLE
-- ----------------------------------------------------------------------------
-- The notifications/preferences API reads/writes this table but it was never
-- created in schema.sql. Create it now to unbreak the preferences endpoints.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_orders BOOLEAN DEFAULT TRUE,
  email_promotions BOOLEAN DEFAULT TRUE,
  email_newsletter BOOLEAN DEFAULT TRUE,
  push_orders BOOLEAN DEFAULT TRUE,
  push_promotions BOOLEAN DEFAULT FALSE,
  sms_orders BOOLEAN DEFAULT TRUE,
  sms_promotions BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. MIGRATE LEGACY PAYOUTS FROM settings JSON BLOB -> seller_payouts TABLE
-- ----------------------------------------------------------------------------
-- Payouts were previously stored as JSON blobs in settings under
-- "payouts_{vendorId}". Migrate them into the real (RLS-protected)
-- seller_payouts table indexed & manageable by admins.
--
-- status mapping: JSON 'completed' -> seller_payouts 'completed',
--                 JSON 'pending'  -> seller_payouts 'pending', etc.
-- ============================================================================

-- Insert legacy payouts for every vendor settings blob found.
INSERT INTO public.seller_payouts (
  seller_id, amount, method, account_details, status, notes, processed_at, created_at, updated_at
)
SELECT
  v.user_id                       AS seller_id,
  (p.value ->> 'amount')::DECIMAL(10,2) AS amount,
  COALESCE(p.value ->> 'method', 'bank') AS method,
  COALESCE(p.value -> 'account_details', '{}'::jsonb) AS account_details,
  COALESCE(p.value ->> 'status', 'pending') AS status,
  p.value ->> 'notes'             AS notes,
  (p.value ->> 'processed_at')::timestamptz AS processed_at,
  COALESCE((p.value ->> 'created_at')::timestamptz, NOW()) AS created_at,
  COALESCE((p.value ->> 'updated_at')::timestamptz, NOW()) AS updated_at
FROM public.settings p
JOIN public.vendors v ON p.key = 'payouts_' || v.id::text
WHERE p.value ? 'amount'
  AND NOT EXISTS (
    SELECT 1 FROM public.seller_payouts sp WHERE sp.seller_id = v.user_id
  );

COMMIT;
