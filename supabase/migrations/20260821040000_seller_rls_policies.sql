-- ============================================================================
-- Seller RLS: let sellers manage their own products and see orders that
-- contain them. Run once in Supabase Dashboard > SQL Editor.
-- Idempotent: safe to run multiple times.
--
-- Requires products.seller_id (added by 20260821030000_schema_reconcile.sql).
--
-- Note on recursion: an orders policy referencing order_items while the
-- order_items policy references orders triggers "infinite recursion detected
-- in policy". The helper below is SECURITY DEFINER, so its internal reads
-- bypass RLS and the chain terminates (same pattern as public.is_admin()).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_order_visible_to_seller(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
      AND p.seller_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- PRODUCTS: full ownership for the selling seller
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Products: seller insert own" ON public.products;
CREATE POLICY "Products: seller insert own"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Products: seller update own" ON public.products;
CREATE POLICY "Products: seller update own"
  ON public.products FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Products: seller delete own" ON public.products;
CREATE POLICY "Products: seller delete own"
  ON public.products FOR DELETE
  USING (auth.uid() = seller_id);

-- ---------------------------------------------------------------------------
-- PRODUCT IMAGES: managed through the parent product's owner
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Product images: seller insert" ON public.product_images;
CREATE POLICY "Product images: seller insert"
  ON public.product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id AND p.seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Product images: seller update" ON public.product_images;
CREATE POLICY "Product images: seller update"
  ON public.product_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id AND p.seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Product images: seller delete" ON public.product_images;
CREATE POLICY "Product images: seller delete"
  ON public.product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id AND p.seller_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- ORDER ITEMS: sellers read the lines that contain their products
-- (references products only — no cycle)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Order items: seller read own products" ON public.order_items;
CREATE POLICY "Order items: seller read own products"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = order_items.product_id AND p.seller_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- ORDERS: sellers read/update orders containing their products
-- (via SECURITY DEFINER helper to avoid mutual recursion)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Orders: seller read containing own products" ON public.orders;
CREATE POLICY "Orders: seller read containing own products"
  ON public.orders FOR SELECT
  USING (public.is_order_visible_to_seller(id));

DROP POLICY IF EXISTS "Orders: seller update status" ON public.orders;
CREATE POLICY "Orders: seller update status"
  ON public.orders FOR UPDATE
  USING (public.is_order_visible_to_seller(id))
  WITH CHECK (public.is_order_visible_to_seller(id));

-- Verify final policy set
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products', 'product_images', 'orders', 'order_items')
ORDER BY tablename, policyname;
