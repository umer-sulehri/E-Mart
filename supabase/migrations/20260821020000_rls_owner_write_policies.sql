-- ============================================================================
-- RLS fixes: let buyers actually place / cancel orders and record payments.
-- Run once in Supabase Dashboard > SQL Editor.
-- Idempotent: safe to run multiple times.
--
-- Before this migration, orders/order_items/payments only had owner-SELECT +
-- admin-ALL policies, so every non-admin INSERT/UPDATE was rejected:
--   - POST /api/v1/orders            -> order + items inserts blocked
--   - POST /api/v1/orders/[id]/cancel-> owner UPDATE blocked
--   - payment initiation             -> payments insert blocked
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Orders: owner insert" ON public.orders;
CREATE POLICY "Orders: owner insert"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owners may only transition their own order while it can still be cancelled.
DROP POLICY IF EXISTS "Orders: owner cancel" ON public.orders;
CREATE POLICY "Orders: owner cancel"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'confirmed'))
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ORDER ITEMS (insert allowed while writing your own pending order)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Order items: owner insert" ON public.order_items;
CREATE POLICY "Order items: owner insert"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- PAYMENTS (owner may open a payment record against their own order;
-- gateway webhook status updates go through the service-role client)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Payments: owner insert" ON public.payments;
CREATE POLICY "Payments: owner insert"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Verify final policy set
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items', 'payments')
ORDER BY tablename, policyname;
