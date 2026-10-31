-- ============================================================================
-- E-Mart Security Hardening (2028)
-- ----------------------------------------------------------------------------
-- APPLY THIS FILE IN THE SUPABASE SQL EDITOR (or via the Supabase CLI).
-- Idempotent: safe to re-run.
--
-- This is the database half of the P1 security remediation. The matching
-- application-side changes (admin-client reads for PII, coupon increment
-- removal, blocked-user enforcement) live in the Next.js code and must be
-- deployed together with this file.
--
-- Contents:
--   1.  helpers: public.is_admin() made canonical
--   2.  profiles: column-level SELECT lockdown (PII hidden from anon and
--       other authenticated users) + privilege-escalation trigger
--   3.  handle_new_user(): signup metadata can no longer set role
--   4.  vendors: no self-approval / self-reinstatement / commission edits
--   5.  reviews: moderation cannot be bypassed on insert; counters and
--       verification flag are server-authoritative
--   6.  blog_posts: only admins can create/publish posts
--   7.  notifications: no cross-user spam inserts
--   8.  app_settings: RLS enabled (deny-by-default)
--   9.  coupons: value constraints + creator/used_count protection
--   10. orders: money is server-authoritative, status transitions are
--       role-scoped, payment_status cannot be self-marked complete
--   11. order_items: price/stock/vendor authority + parent-order recompute
--   12. seller_payouts: positive amount, forced pending status
--   13. settings: secret-shaped keys hidden from the public SELECT policy
--
-- NOTE: there is no migration runner in this repo. Run this manually in the
-- Supabase SQL editor before deploying the application code.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. HELPERS
-- ----------------------------------------------------------------------------
-- Canonical admin predicate. SECURITY DEFINER so policies and triggers can
-- ask "is this caller an admin?" without tripping the profiles self-recursion
-- (ERROR 42P17) that a plain subquery causes.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- True when the current transaction contains a write that one of this file's
-- SECURITY DEFINER triggers has already authorised (e.g. the orders trigger
-- incrementing coupons.used_count). Guards run as the request role, so
-- without this flag the nested write would be frozen out by its own
-- protection trigger. Only our triggers set this GUC; it is not reachable
-- through PostgREST because pg_catalog.set_config is not an exposed RPC.
CREATE OR REPLACE FUNCTION public.trusted_write()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('emart.trusted_write', true), '') = 'on';
$$;

-- ============================================================================
-- 2. PROFILES: COLUMN-LEVEL SELECT LOCKDOWN
-- ----------------------------------------------------------------------------
-- The old policy "Public profiles are viewable by everyone" made every
-- column of every profile — email, phone, date of birth — enumerable by
-- anyone, authenticated or not (a full PII dump via PostgREST).
--
-- Public surfaces (review authors, blog authors, vendor bylines) only ever
-- display id / name / avatar, so SELECT is narrowed to exactly those columns
-- for anon, plus role/is_email_verified/is_blocked for the signed-in app
-- (login gating, middleware, dashboard guards). Full row SELECT remains
-- available to the service role, which owns the table.
--
-- Routes that legitimately need a user's own or a customer's PII (profile,
-- orders, admin exports, seller order contact) were switched to the
-- service-role client behind an explicit ownership/admin check. Because
-- column privileges are role-wide, this single pair of grants replaces the
-- per-row policy for PII and does not disturb the public name/avatar
-- embeds that RLS still governs.
-- ============================================================================

REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, first_name, last_name, profile_image_url, created_at
) ON public.profiles TO anon;

GRANT SELECT (
  id, first_name, last_name, profile_image_url, role,
  is_email_verified, is_blocked, created_at, updated_at
) ON public.profiles TO authenticated;

-- Roles keep INSERT/UPDATE/DELETE exactly where they were: the existing
-- "own row" policies still bound *which* rows a caller can touch; the
-- trigger below now also bounds *which columns* they can change.
-- The service role is untouched by the REVOKE above (it holds Supabase's
-- default table-level grant, which covers every column).

-- Privilege escalation: a user could UPDATE their own row and set
-- role = 'admin' / is_blocked = false / is_email_verified = true, because
-- the old UPDATE policy only checked auth.uid() = id. Admin mutations run
-- through the service role (auth.uid() IS NULL) or an actual admin session,
-- both of which pass through untouched here.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.email := OLD.email;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
    NEW.is_blocked := OLD.is_blocked;
  END IF;
  IF NEW.is_email_verified IS DISTINCT FROM OLD.is_email_verified THEN
    NEW.is_email_verified := OLD.is_email_verified;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- Direct profile INSERT (only reachable if a profile row is missing while
-- the auth user exists): never let the caller seed their own privileges.
-- handle_new_user() and every seed path run as the service role and are
-- exempt via auth.uid() IS NULL.
CREATE OR REPLACE FUNCTION public.protect_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.id := auth.uid();
  NEW.role := 'customer';
  NEW.is_blocked := FALSE;
  NEW.is_email_verified := FALSE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_insert ON public.profiles;
CREATE TRIGGER protect_profile_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_insert();

-- ============================================================================
-- 3. SIGNUP: METADATA NO LONGER SETS ROLE
-- ----------------------------------------------------------------------------
-- Old: COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
-- which let any self-signup call arrive with role = 'admin'. Role assignment
-- now happens only after the fact, through the service role (admin user
-- creation, demo seeding), which bypasses this function's gate.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    LEFT(COALESCE(NEW.raw_user_meta_data->>'first_name', ''), 100),
    LEFT(COALESCE(NEW.raw_user_meta_data->>'last_name', ''), 100),
    'customer'::public.user_role
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. VENDORS: NO SELF-APPROVAL
-- ----------------------------------------------------------------------------
-- Old INSERT policy (auth.uid() = user_id) let anyone insert a vendor row
-- with status = 'approved' directly, and the UPDATE policy let a rejected
-- or suspended seller flip themselves back to 'approved'. Both are now
-- forced to 'pending' for non-admin callers; status/verification/commission
-- changes are admin-only.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.protect_vendor_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.user_id := auth.uid();
    NEW.status := 'pending';
    NEW.verified_at := NULL;
    NEW.suspended_at := NULL;
  ELSE
    NEW.user_id := OLD.user_id;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.status := OLD.status;
    END IF;
    NEW.verified_at := OLD.verified_at;
    NEW.suspended_at := OLD.suspended_at;
    IF NEW.commission_rate IS DISTINCT FROM OLD.commission_rate THEN
      NEW.commission_rate := OLD.commission_rate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_vendor_fields ON public.vendors;
CREATE TRIGGER protect_vendor_fields
  BEFORE INSERT OR UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.protect_vendor_fields();

-- ============================================================================
-- 5. REVIEWS: MODERATION + COUNTERS ARE SERVER-AUTHORITATIVE
-- ----------------------------------------------------------------------------
-- The INSERT policy only checked auth.uid() = user_id, so a direct insert
-- could carry status = 'approved', is_verified_purchase = true, or an
-- inflated helpful_count. Editing keeps its existing "back to pending"
-- behaviour (the reviews/[id] PATCH route depends on it).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.protect_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.user_id := auth.uid();
    NEW.status := 'pending';
    NEW.helpful_count := 0;
    NEW.seller_reply := NULL;
    NEW.seller_reply_at := NULL;
    NEW.created_at := NOW();
    -- "Verified purchase" is derived, never asserted: only a delivered
    -- order by this user for this product earns the badge.
    NEW.is_verified_purchase := EXISTS (
      SELECT 1
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = NEW.product_id
        AND o.user_id = auth.uid()
        AND o.status = 'delivered'
    );
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.product_id := OLD.product_id;
    NEW.helpful_count := OLD.helpful_count;
    NEW.is_verified_purchase := OLD.is_verified_purchase;
    NEW.seller_reply := OLD.seller_reply;
    NEW.seller_reply_at := OLD.seller_reply_at;
    NEW.created_at := OLD.created_at;
    -- Status may only move back to 'pending' (re-moderation on edit);
    -- never forward to approved/rejected by the review's owner.
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_review_fields ON public.reviews;
CREATE TRIGGER protect_review_fields
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.protect_review_fields();

-- ============================================================================
-- 6. BLOG POSTS: ADMIN-ONLY WRITES
-- ----------------------------------------------------------------------------
-- The app has no user-facing blog write path (the public routes are
-- read-only), so "any authenticated user may insert a published post" was
-- pure attack surface. Writes go through admins/service only.
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON blog_posts;
CREATE POLICY "Admins can create blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authors can update own blog posts" ON blog_posts;
CREATE POLICY "Admins can update blog posts"
  ON blog_posts FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 7. NOTIFICATIONS: NO CROSS-USER SPAM
-- ----------------------------------------------------------------------------
-- "WITH CHECK (true)" let any session push notifications to any user_id.
-- The application inserts notifications through the service role, so the
-- caller-scoped policy loses nothing.
-- ============================================================================

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id OR public.is_admin());

-- ============================================================================
-- 8. APP_SETTINGS: DENY BY DEFAULT
-- ----------------------------------------------------------------------------
-- 2027-product-daily-limit.sql created this table with RLS never enabled.
-- It only feeds SECURITY DEFINER quota functions, so no client role needs
-- rows: enable RLS (zero policies = deny) and revoke base privileges.
-- ============================================================================

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_settings FROM anon, authenticated;
DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings"
  ON public.app_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 9. COUPONS: VALUE CONSTRAINTS + CREATOR PROTECTION
-- ----------------------------------------------------------------------------
-- RLS allowed sellers to manage their own coupons column-for-column: they
-- could edit used_count to reset redemption limits, or rewrite created_by.
-- CHECKs bound the discount maths; the trigger pins identity/usage columns.
-- ============================================================================

DO $$
DECLARE
  c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.coupons'::regclass
     AND conname = 'coupons_percentage_value_le_100';
  IF c IS NULL THEN
    ALTER TABLE public.coupons
      ADD CONSTRAINT coupons_percentage_value_le_100
      CHECK (discount_type <> 'percentage' OR discount_value <= 100);
  END IF;

  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.coupons'::regclass
     AND conname = 'coupons_minimum_order_nonnegative';
  IF c IS NULL THEN
    ALTER TABLE public.coupons
      ADD CONSTRAINT coupons_minimum_order_nonnegative
      CHECK (minimum_order_amount IS NULL OR minimum_order_amount >= 0);
  END IF;

  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.coupons'::regclass
     AND conname = 'coupons_usage_limit_positive';
  IF c IS NULL THEN
    ALTER TABLE public.coupons
      ADD CONSTRAINT coupons_usage_limit_positive
      CHECK (usage_limit IS NULL OR usage_limit > 0);
  END IF;

  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.coupons'::regclass
     AND conname = 'coupons_per_user_limit_positive';
  IF c IS NULL THEN
    ALTER TABLE public.coupons
      ADD CONSTRAINT coupons_per_user_limit_positive
      CHECK (per_user_limit IS NULL OR per_user_limit > 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.protect_coupon_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip for service-role writes, admins, and writes already authorised by
  -- the orders trigger (which owns used_count during order creation).
  IF auth.uid() IS NULL OR public.is_admin() OR public.trusted_write() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.used_count := 0;
  ELSE
    NEW.created_by := OLD.created_by;
    IF NEW.used_count IS DISTINCT FROM OLD.used_count THEN
      NEW.used_count := OLD.used_count;
    END IF;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_coupon_fields ON public.coupons;
CREATE TRIGGER protect_coupon_fields
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.protect_coupon_fields();

-- ============================================================================
-- 10. ORDERS: SERVER-AUTHORITATIVE MONEY + ROLE-SCOPED TRANSITIONS
-- ----------------------------------------------------------------------------
-- Two BEFORE triggers (insert and update) guarded by auth.uid():
--   * INSERT: caller becomes user_id, status/payment_status are pinned to
--     'pending', shipping/tax follow the checkout formula, and any discount
--     is re-derived from a locked, revalidated coupon row — with used_count
--     incremented atomically (this replaces the application-side increment,
--     which was a racy read-modify-write).
--   * UPDATE: identity columns are immutable; payment_status can only move
--     pending -> processing (gateway initiation) by the owner — never to
--     'completed', which is webhook/service territory; status transitions
--     are scoped per role; money columns are recomputed from order_items +
--     the coupon row whenever a non-admin changes them.
--   * DELETE: only while still pending (matches the checkout rollback
--     paths); the coupon increment is refunded.
--
-- Service-role and admin writes bypass all of it by design.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.orders_guard_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub       numeric;
  v_tax       numeric;
  v_ship      numeric;
  v_disc      numeric := 0;
  v_coupon    public.coupons%ROWTYPE;
  v_code      text;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  NEW.user_id := auth.uid();
  NEW.created_at := NOW();
  NEW.status := 'pending';
  NEW.payment_status := 'pending';

  v_sub := GREATEST(0, COALESCE(NEW.subtotal, 0));
  -- Mirrors checkout (app/api/v1/orders/route.ts): tax = round(subtotal *
  -- 0.05), shipping = 0 at/above Rs. 2000 else Rs. 150, waived entirely by
  -- a free_shipping coupon. Keep the three constants in step with the route.
  v_tax := ROUND(v_sub * 0.05);
  v_ship := CASE WHEN v_sub >= 2000 THEN 0 ELSE 150 END;

  v_code := NULLIF(BTRIM(COALESCE(NEW.coupon_code, '')), '');

  IF v_code IS NULL THEN
    v_disc := 0;
    NEW.coupon_code := NULL;
  ELSE
    SELECT * INTO v_coupon
      FROM public.coupons
     WHERE UPPER(code) = UPPER(v_code)
     FOR UPDATE;

    IF NOT FOUND
       OR NOT v_coupon.is_active
       OR (v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > NOW())
       OR (v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW())
       OR (v_coupon.usage_limit IS NOT NULL
           AND COALESCE(v_coupon.used_count, 0) >= v_coupon.usage_limit)
       OR (COALESCE(v_coupon.minimum_order_amount, 0) > v_sub)
    THEN
      RAISE EXCEPTION 'INVALID_COUPON'
        USING ERRCODE = 'P0001',
              HINT = 'Coupon is missing, inactive, expired, exhausted, or below its minimum order amount.';
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_disc := (v_sub * v_coupon.discount_value) / 100;
      IF v_coupon.maximum_discount_amount IS NOT NULL
         AND v_disc > v_coupon.maximum_discount_amount THEN
        v_disc := v_coupon.maximum_discount_amount;
      END IF;
    ELSIF v_coupon.discount_type = 'fixed_amount' THEN
      v_disc := v_coupon.discount_value;
    ELSE -- free_shipping
      v_disc := 0;
      v_ship := 0;
    END IF;

    -- Atomic redemption counter (row is locked by the SELECT ... FOR UPDATE).
    UPDATE public.coupons
       SET used_count = COALESCE(used_count, 0) + 1
     WHERE id = v_coupon.id;
  END IF;

  NEW.subtotal := v_sub;
  NEW.tax := v_tax;
  NEW.shipping_cost := v_ship;
  NEW.discount := v_disc;
  NEW.total := GREATEST(0, v_sub + v_tax + v_ship - FLOOR(v_disc));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_guard_insert ON public.orders;
CREATE TRIGGER orders_guard_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_guard_insert();

CREATE OR REPLACE FUNCTION public.orders_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub      numeric;
  v_tax      numeric;
  v_ship     numeric;
  v_disc     numeric := 0;
  v_coupon   public.coupons%ROWTYPE;
  v_code     text;
  v_is_owner boolean;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Identity columns are immutable for everyone but the service role.
  NEW.id := OLD.id;
  NEW.user_id := OLD.user_id;
  NEW.order_number := OLD.order_number;
  NEW.created_at := OLD.created_at;

  -- Evaluated only AFTER the identity clamp above, otherwise an UPDATE that
  -- swapped user_id to auth.uid() could masquerade as the owner below.
  v_is_owner := (NEW.user_id = auth.uid());

  -- payment_status: the owner may only open a payment attempt
  -- (pending -> processing, or pending/processing -> failed after a gateway
  -- decline). Settlement/refund states are webhook- or admin-only.
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    IF v_is_owner AND NEW.payment_status IN ('processing', 'failed')
       AND OLD.payment_status IN ('pending', 'processing') THEN
      NULL; -- allowed
    ELSE
      NEW.payment_status := OLD.payment_status;
    END IF;
  END IF;

  -- status: role-scoped transition table.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('cancelled', 'returned', 'refunded') THEN
      NEW.status := OLD.status; -- terminal for non-admins
    ELSIF v_is_owner THEN
      -- buyer flows: checkout confirm (COD), cancellation, return request
      IF NOT (
           (NEW.status = 'processing'    AND OLD.status IN ('pending', 'confirmed'))
        OR (NEW.status = 'cancelled'     AND OLD.status IN ('pending', 'confirmed', 'processing'))
        OR (NEW.status = 'returned'      AND OLD.status IN ('shipped', 'out_for_delivery', 'delivered'))
      ) THEN
        NEW.status := OLD.status;
      END IF;
    ELSIF public.user_can_view_order(NEW.id) THEN
      -- seller fulfillment: forward movement only, never out of a terminal
      -- or delivered state, never into refunded/returned.
      IF NOT (
           NEW.status IN ('confirmed', 'processing', 'shipped',
                          'out_for_delivery', 'delivered', 'cancelled')
           AND OLD.status NOT IN ('cancelled', 'returned', 'refunded', 'delivered')
      ) THEN
        NEW.status := OLD.status;
      END IF;
    ELSE
      NEW.status := OLD.status;
    END IF;
  END IF;

  -- Money: recomputed from order_items + the coupon row whenever a
  -- non-admin touches a money column or the coupon code. A status-only
  -- update (buyer cancel, seller fulfillment) leaves money untouched, so
  -- totals never drift after the fact.
  IF (NEW.subtotal, NEW.tax, NEW.shipping_cost, NEW.discount, NEW.total,
      NEW.coupon_code)
     IS DISTINCT FROM
     (OLD.subtotal, OLD.tax, OLD.shipping_cost, OLD.discount, OLD.total,
      OLD.coupon_code)
  THEN
    SELECT COALESCE(SUM(price * quantity), 0)
      INTO v_sub
      FROM public.order_items
     WHERE order_id = NEW.id;

    v_tax := ROUND(v_sub * 0.05);
    v_ship := CASE WHEN v_sub >= 2000 THEN 0 ELSE 150 END;

    v_code := NULLIF(BTRIM(COALESCE(NEW.coupon_code, '')), '');
    IF v_code IS NULL THEN
      NEW.coupon_code := NULL;
    ELSE
      SELECT * INTO v_coupon
        FROM public.coupons
       WHERE UPPER(code) = UPPER(v_code)
       LIMIT 1;

      IF FOUND
         AND v_coupon.is_active
         AND (v_coupon.starts_at IS NULL OR v_coupon.starts_at <= NOW())
         AND (v_coupon.expires_at IS NULL OR v_coupon.expires_at >= NOW())
         AND COALESCE(v_coupon.minimum_order_amount, 0) <= v_sub
      THEN
        IF v_coupon.discount_type = 'percentage' THEN
          v_disc := (v_sub * v_coupon.discount_value) / 100;
          IF v_coupon.maximum_discount_amount IS NOT NULL
             AND v_disc > v_coupon.maximum_discount_amount THEN
            v_disc := v_coupon.maximum_discount_amount;
          END IF;
        ELSIF v_coupon.discount_type = 'fixed_amount' THEN
          v_disc := v_coupon.discount_value;
        ELSE
          v_disc := 0;
          v_ship := 0;
        END IF;
      END IF;
    END IF;

    NEW.subtotal := v_sub;
    NEW.tax := v_tax;
    NEW.shipping_cost := v_ship;
    NEW.discount := v_disc;
    NEW.total := GREATEST(0, v_sub + v_tax + v_ship - FLOOR(v_disc));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_guard_update ON public.orders;
CREATE TRIGGER orders_guard_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_guard_update();

CREATE OR REPLACE FUNCTION public.orders_guard_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN OLD;
  END IF;

  -- Non-admins may only remove an order that checkout has not finished with
  -- (the rollback paths in app/api/v1/orders/route.ts). Completed history
  -- is not deletable from a client session.
  IF OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'ORDER_DELETE_DENIED'
      USING ERRCODE = 'P0001',
            HINT = 'Only pending orders can be deleted by their owner.';
  END IF;

  IF OLD.coupon_code IS NOT NULL AND BTRIM(OLD.coupon_code) <> '' THEN
    PERFORM set_config('emart.trusted_write', 'on', true);
    UPDATE public.coupons
       SET used_count = GREATEST(0, COALESCE(used_count, 0) - 1)
     WHERE UPPER(code) = UPPER(OLD.coupon_code);
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS orders_guard_delete ON public.orders;
CREATE TRIGGER orders_guard_delete
  BEFORE DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_guard_delete();

-- ============================================================================
-- 11. ORDER_ITEMS: PRICE / STOCK / PARENT AUTHORITY
-- ----------------------------------------------------------------------------
-- item rows carry the money that fulfillment ships against, so for
-- non-service callers the unit price must equal the product's current
-- effective price, the stock must cover the quantity, the vendor must match
-- the product, and the parent order must be the caller's own pending order.
-- A recompute of the parent order follows every insert/delete so the stored
-- subtotal always equals SUM(price * quantity).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.order_item_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner   uuid;
  v_status  public.order_status;
  v_price   numeric;
  v_sale    numeric;
  v_stock   integer;
  v_vendor  uuid;
  v_effective numeric;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT user_id, status
    INTO v_owner, v_status
    FROM public.orders
   WHERE id = NEW.order_id;

  IF NOT FOUND OR v_owner <> auth.uid() OR v_status <> 'pending' THEN
    RAISE EXCEPTION 'ORDER_ITEM_INSERT_DENIED'
      USING ERRCODE = 'P0001',
            HINT = 'Order items may only be added to your own pending order.';
  END IF;

  IF NEW.product_id IS NULL THEN
    RAISE EXCEPTION 'ORDER_ITEM_PRODUCT_REQUIRED'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT price, discount_price, stock_quantity, vendor_id
    INTO v_price, v_sale, v_stock, v_vendor
    FROM public.products
   WHERE id = NEW.product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_ITEM_PRODUCT_MISSING'
      USING ERRCODE = 'P0001';
  END IF;

  -- Server-authoritative pricing: the item price must be the product's
  -- current effective price (sale price when one applies).
  v_effective := COALESCE(v_sale, v_price);
  IF NEW.price IS DISTINCT FROM v_effective THEN
    RAISE EXCEPTION 'ORDER_ITEM_PRICE_MISMATCH'
      USING ERRCODE = 'P0001',
            HINT = 'Item price does not match the current product price.';
  END IF;

  IF COALESCE(v_stock, 0) < NEW.quantity THEN
    RAISE EXCEPTION 'ORDER_ITEM_INSUFFICIENT_STOCK'
      USING ERRCODE = 'P0001';
  END IF;

  IF NEW.vendor_id IS DISTINCT FROM v_vendor THEN
    NEW.vendor_id := v_vendor;
  END IF;

  NEW.total := NEW.price * NEW.quantity;
  NEW.discount := 0;
  NEW.created_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_item_guard ON public.order_items;
CREATE TRIGGER order_item_guard
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.order_item_guard();

-- Recompute the parent order's subtotal after every item write. If the
-- subtotal actually changes, orders_guard_update re-derives tax, discount
-- and total from it; for the normal checkout path the value is identical
-- to what the route computed, so this is a no-op.
CREATE OR REPLACE FUNCTION public.order_item_recompute_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  v_order := CASE TG_OP
    WHEN 'DELETE' THEN OLD.order_id
    ELSE NEW.order_id
  END;

  UPDATE public.orders
     SET subtotal = (
       SELECT COALESCE(SUM(price * quantity), 0)
         FROM public.order_items
        WHERE order_id = v_order
     )
   WHERE id = v_order;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS order_item_recompute_insert ON public.order_items;
CREATE TRIGGER order_item_recompute_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.order_item_recompute_order();

DROP TRIGGER IF EXISTS order_item_recompute_delete ON public.order_items;
CREATE TRIGGER order_item_recompute_delete
  AFTER DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.order_item_recompute_order();

-- ============================================================================
-- 12. SELLER_PAYOUTS: POSITIVE AMOUNT, FORCED PENDING
-- ----------------------------------------------------------------------------
-- Sellers could insert payouts with amount 0/negative or an already
-- 'completed' status (RLS only checked seller_id = auth.uid()).
-- ============================================================================

DO $$
DECLARE
  c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.seller_payouts'::regclass
     AND conname = 'seller_payouts_amount_positive';
  IF c IS NULL THEN
    ALTER TABLE public.seller_payouts
      ADD CONSTRAINT seller_payouts_amount_positive
      CHECK (amount > 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.protect_payout_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.seller_id := auth.uid();
    NEW.status := 'pending';
    NEW.processed_at := NULL;
  ELSE
    -- Sellers have no UPDATE policy today; this keeps that true
    -- column-for-column if one is ever added.
    NEW.seller_id := OLD.seller_id;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.status := OLD.status;
    END IF;
    NEW.amount := OLD.amount;
    NEW.processed_at := OLD.processed_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_payout_fields ON public.seller_payouts;
CREATE TRIGGER protect_payout_fields
  BEFORE INSERT OR UPDATE ON public.seller_payouts
  FOR EACH ROW EXECUTE FUNCTION public.protect_payout_fields();

-- ============================================================================
-- 13. SETTINGS: SECRET-SHAPED KEYS HIDDEN FROM THE PUBLIC POLICY
-- ----------------------------------------------------------------------------
-- "Settings are viewable by everyone" is correct for site_name, tax_rate,
-- payment toggles — and catastrophic for anything key-shaped that a future
-- integration drops into the same table. Deny by pattern instead of by
-- trust; admins keep the blanket policy.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.settings_key_is_public(p_key text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_key !~* '(secret|password|passwd|private|api_?key|token|credential|webhook_?secret|smtp|salt)';
$$;

DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
CREATE POLICY "Settings are viewable by everyone"
  ON settings FOR SELECT
  USING (public.settings_key_is_public(key));

-- ============================================================================
-- 14. UNUSED REPORTING VIEWS EXPOSE CUSTOMER PII
-- ----------------------------------------------------------------------------
-- product_summary / order_summary / seller_dashboard are plain (owner-run)
-- views that join profiles.email/phone, so Supabase's default table grants
-- made every customer's contact details readable by anon through PostgREST.
-- Nothing in the application queries them; the API roles lose access and
-- the service role keeps it.
-- ============================================================================

REVOKE ALL ON public.product_summary, public.order_summary, public.seller_dashboard
  FROM anon, authenticated;

-- ============================================================================
-- 15. PRODUCTS: MODERATION GATE FOR PUBLIC VISIBILITY
-- ----------------------------------------------------------------------------
-- products.moderation_status was added with DEFAULT 'pending' but was never
-- backfilled and never enforced, so visibility was driven purely by is_active.
-- Public reads (anon/authenticated under RLS) now require
-- moderation_status = 'approved'; owners and admins still see everything.
-- Existing live products are backfilled to 'approved' so this change does not
-- hide the catalog. New products keep the 'pending' default and stay out of the
-- public catalog until an admin approves them.
-- ============================================================================

ALTER TABLE public.products ALTER COLUMN moderation_status SET DEFAULT 'pending';

UPDATE public.products
   SET moderation_status = 'approved'
 WHERE is_active = true
   AND (moderation_status IS NULL OR moderation_status = 'pending');

DROP POLICY IF EXISTS "Active products are viewable by everyone" ON products;
CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT
  USING (
    (is_active = true AND moderation_status = 'approved')
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR public.is_admin()
  );

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ----------------------------------------------------------------------------
-- After applying:
--
--   -- PII must be invisible to the API roles:
--   SELECT email FROM public.profiles LIMIT 1;   -- expect permission denied
--                                                 -- when run as `authenticated`
--
--   -- Triggers present (expect 11 rows: protect_profile_privileges,
--   -- protect_profile_insert, protect_vendor_fields, protect_review_fields,
--   -- protect_coupon_fields, orders_guard_insert, orders_guard_update,
--   -- orders_guard_delete, order_item_guard, order_item_recompute_insert,
--   -- order_item_recompute_delete, protect_payout_fields):
--   SELECT tgname FROM pg_trigger
--    WHERE tgrelid::regclass::text IN
--          ('public.profiles','public.vendors','public.reviews',
--           'public.coupons','public.orders','public.order_items',
--           'public.seller_payouts')
--      AND NOT tgisinternal;
--
--   -- Smoke tests, as an authenticated non-admin session:
--   -- 1. UPDATE profiles SET role='admin' WHERE id = auth.uid();
--   --    -> role stays 'customer'
--   -- 2. INSERT INTO vendors (user_id, name, slug, status)
--   --    VALUES (auth.uid(), 'X', 'x', 'approved');
--   --    -> status becomes 'pending'
--   -- 3. Direct signup with user_metadata.role='admin' -> profile is customer
--   -- 4. Order + coupon flow end to end (checkout still succeeds; coupon
--   --    used_count increments exactly once and rolls back on checkout
--   --    failure).
--   -- 5. SELECT * FROM products;  (as anon) -> only is_active = true rows with
--   --    moderation_status = 'approved'; pre-existing live products were
--   --    backfilled, new seller products are hidden until approved.
-- ============================================================================
