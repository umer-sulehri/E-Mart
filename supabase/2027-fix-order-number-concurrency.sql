-- ============================================================================
-- Fix: "duplicate key value violates unique constraint orders_order_number_key"
-- ============================================================================
-- The original generate_order_number() trigger computed `MAX(order_number)+1`
-- on every insert. Under concurrent checkout requests two inserts would read the
-- same MAX, both generate the same number, and one insert failed with a unique
-- violation on orders_order_number.
--
-- This migration replaces that read-modify-write logic with a real PostgreSQL
-- sequence (nextval()), which is atomic and safe under concurrency.
--
-- Apply: Supabase Dashboard -> SQL Editor -> run this file once.
-- ============================================================================

-- 1) Create a dedicated sequence for order numbers (safe to re-run).
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START 1;

-- 2) Seed the sequence from the highest existing sequential number so new orders
--    continue where the previous generator left off. Non-sequential / external
--    order numbers (e.g. EM-D<timestamp> fallbacks) are ignored here.
SELECT setval(
  'orders_order_number_seq',
  GREATEST(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 1)
       FROM orders
      WHERE order_number ~ '^EM-[0-9]+$'),
    1
  ),
  true
);

-- 3) Rewrite the generator to use the sequence. nextval() is atomic — concurrent
--    inserts each receive a distinct value, eliminating the duplicate error.
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  order_num TEXT;
BEGIN
  order_num := 'EM-' || LPAD(nextval('orders_order_number_seq')::TEXT, 6, '0');
  NEW.order_number := order_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Keep the existing BEFORE INSERT trigger. It only fills order_number when the
--    application did not supply one, which remains the concurrency-safe default.
DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();