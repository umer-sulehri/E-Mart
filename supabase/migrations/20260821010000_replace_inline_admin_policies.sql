-- ============================================================================
-- Replace all inline admin subqueries with public.is_admin()
-- Run once in Supabase Dashboard > SQL Editor.
-- Idempotent: safe to run multiple times.
--
-- Why: inline `EXISTS (SELECT 1 FROM profiles WHERE ... role='admin')` inside
-- a policy re-evaluates the profiles RLS stack on every check. is_admin() is
-- SECURITY DEFINER, so it bypasses RLS internally: cheaper and recursion-safe.
-- ============================================================================

-- Keep the helper authoritative (same definition as sync-app-schema.sql)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
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

-- customer_addresses
DROP POLICY IF EXISTS "Addresses: admin read" ON public.customer_addresses;
CREATE POLICY "Addresses: admin read"
  ON public.customer_addresses FOR SELECT
  USING (public.is_admin());

-- categories
DROP POLICY IF EXISTS "Categories: admin insert" ON public.categories;
CREATE POLICY "Categories: admin insert"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Categories: admin update" ON public.categories;
CREATE POLICY "Categories: admin update"
  ON public.categories FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Categories: admin delete" ON public.categories;
CREATE POLICY "Categories: admin delete"
  ON public.categories FOR DELETE
  USING (public.is_admin());

-- products
DROP POLICY IF EXISTS "Products: admin insert" ON public.products;
CREATE POLICY "Products: admin insert"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Products: admin update" ON public.products;
CREATE POLICY "Products: admin update"
  ON public.products FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Products: admin delete" ON public.products;
CREATE POLICY "Products: admin delete"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- product_variants
DROP POLICY IF EXISTS "Product variants: admin insert" ON public.product_variants;
CREATE POLICY "Product variants: admin insert"
  ON public.product_variants FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Product variants: admin update" ON public.product_variants;
CREATE POLICY "Product variants: admin update"
  ON public.product_variants FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Product variants: admin delete" ON public.product_variants;
CREATE POLICY "Product variants: admin delete"
  ON public.product_variants FOR DELETE
  USING (public.is_admin());

-- product_images
DROP POLICY IF EXISTS "Product images: admin insert" ON public.product_images;
CREATE POLICY "Product images: admin insert"
  ON public.product_images FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Product images: admin update" ON public.product_images;
CREATE POLICY "Product images: admin update"
  ON public.product_images FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Product images: admin delete" ON public.product_images;
CREATE POLICY "Product images: admin delete"
  ON public.product_images FOR DELETE
  USING (public.is_admin());

-- product_attributes
DROP POLICY IF EXISTS "Product attributes: admin insert" ON public.product_attributes;
CREATE POLICY "Product attributes: admin insert"
  ON public.product_attributes FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Product attributes: admin update" ON public.product_attributes;
CREATE POLICY "Product attributes: admin update"
  ON public.product_attributes FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Product attributes: admin delete" ON public.product_attributes;
CREATE POLICY "Product attributes: admin delete"
  ON public.product_attributes FOR DELETE
  USING (public.is_admin());

-- orders / order_items / payments
DROP POLICY IF EXISTS "Orders: admin full access" ON public.orders;
CREATE POLICY "Orders: admin full access"
  ON public.orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Order items: admin full access" ON public.order_items;
CREATE POLICY "Order items: admin full access"
  ON public.order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Payments: admin full access" ON public.payments;
CREATE POLICY "Payments: admin full access"
  ON public.payments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- wishlists
DROP POLICY IF EXISTS "Wishlists: admin read" ON public.wishlists;
CREATE POLICY "Wishlists: admin read"
  ON public.wishlists FOR SELECT
  USING (public.is_admin());

-- product_reviews
DROP POLICY IF EXISTS "Reviews: admin delete" ON public.product_reviews;
CREATE POLICY "Reviews: admin delete"
  ON public.product_reviews FOR DELETE
  USING (public.is_admin());

-- translations
DROP POLICY IF EXISTS "Translations: admin insert" ON public.translations;
CREATE POLICY "Translations: admin insert"
  ON public.translations FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Translations: admin update" ON public.translations;
CREATE POLICY "Translations: admin update"
  ON public.translations FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Translations: admin delete" ON public.translations;
CREATE POLICY "Translations: admin delete"
  ON public.translations FOR DELETE
  USING (public.is_admin());

-- social_links
DROP POLICY IF EXISTS "Social links: admin insert" ON public.social_links;
CREATE POLICY "Social links: admin insert"
  ON public.social_links FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Social links: admin update" ON public.social_links;
CREATE POLICY "Social links: admin update"
  ON public.social_links FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Social links: admin delete" ON public.social_links;
CREATE POLICY "Social links: admin delete"
  ON public.social_links FOR DELETE
  USING (public.is_admin());

-- Legacy JWT-claim policy from create_social_links migration (never matched:
-- auth.jwt() 'role' claim is the Postgres role, not the profile role)
DROP POLICY IF EXISTS "Admins have full access to social links" ON public.social_links;

-- notification_preferences
DROP POLICY IF EXISTS "Notification prefs: admin read" ON public.notification_preferences;
CREATE POLICY "Notification prefs: admin read"
  ON public.notification_preferences FOR SELECT
  USING (public.is_admin());

-- email_logs / sms_logs (audit migration)
DROP POLICY IF EXISTS "Email logs: admin full access" ON public.email_logs;
CREATE POLICY "Email logs: admin full access"
  ON public.email_logs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "SMS logs: admin full access" ON public.sms_logs;
CREATE POLICY "SMS logs: admin full access"
  ON public.sms_logs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- analytics_events (audit migration)
DROP POLICY IF EXISTS "Analytics events: admin full access" ON public.analytics_events;
CREATE POLICY "Analytics events: admin full access"
  ON public.analytics_events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- seller_payouts (audit migration)
DROP POLICY IF EXISTS "Seller payouts: admin full access" ON public.seller_payouts;
CREATE POLICY "Seller payouts: admin full access"
  ON public.seller_payouts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- order_tracking (audit migration)
DROP POLICY IF EXISTS "Order tracking: admin full access" ON public.order_tracking;
CREATE POLICY "Order tracking: admin full access"
  ON public.order_tracking FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Verify: no policy should still inline the profiles subquery
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%profiles%'
ORDER BY tablename, policyname;
