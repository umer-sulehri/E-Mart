-- ============================================================================
-- E-Mart Product Seed Data (2026)
-- ----------------------------------------------------------------------------
-- Populates real product data so the storefront does not rely on mock data.
-- Idempotent (safe to run multiple times) and uses plain top-level DML (no
-- plpgsql DO block) so it runs as the SQL-editor role (postgres/superuser),
-- bypassing RLS.
--
-- PREREQUISITE: a seller profile + approved vendor must exist. Update the
-- email below to match your demo seller (profiles.email -> vendors). The first
-- approved vendor is used as a fallback.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ensure base categories exist
-- ----------------------------------------------------------------------------
INSERT INTO categories (name, slug, description, is_active, display_order) VALUES
  ('Electronics', 'electronics', 'Electronic devices, gadgets and accessories', TRUE, 1),
  ('Fashion', 'fashion', 'Clothing, shoes and accessories', TRUE, 2),
  ('Home & Garden', 'home-garden', 'Home decor, kitchen and outdoor products', TRUE, 3),
  ('Groceries', 'groceries', 'Everyday groceries and pantry staples', TRUE, 4),
  ('Beauty', 'beauty', 'Cosmetics, skincare and personal care', TRUE, 5)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = TRUE;

-- Ensure a brand exists for the sample products.
INSERT INTO brands (name, slug, description, is_active) VALUES
  ('E-Mart Essentials', 'e-mart-essentials', 'Everyday essentials curated by E-Mart', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Resolve the target vendor (edit the email to match your demo seller).
--    Plain CTE: try email match first, fall back to any approved vendor.
-- ----------------------------------------------------------------------------
WITH vendor_resolution AS (
  SELECT COALESCE(
    (
      SELECT v.id FROM vendors v
      JOIN profiles p ON p.id = v.user_id
      WHERE p.email = 'seller@demo.com' AND v.status = 'approved'
      LIMIT 1
    ),
    (
      SELECT id FROM vendors WHERE status = 'approved' ORDER BY created_at ASC LIMIT 1
    )
  ) AS vendor_id
),

-- ----------------------------------------------------------------------------
-- 3. Seed sample products referencing resolved IDs.
--    No-op when no vendor is found (the LEFT JOIN yields a NULL vendor_id).
-- ----------------------------------------------------------------------------
seeded AS (
  INSERT INTO products (
    vendor_id, name, slug, sku, description, price, discount_price, stock_quantity,
    category_id, brand_id, images, is_active, status, rating, review_count,
    is_featured, is_new, tags
  )
  SELECT
    vr.vendor_id,
    p.name,
    p.slug,
    p.sku,
    p.description,
    p.price,
    p.discount_price,
    p.stock_quantity,
    c.id   AS category_id,
    b.id   AS brand_id,
    p.images,
    p.is_active,
    p.status::product_status AS status,
    p.rating,
    p.review_count,
    p.is_featured,
    p.is_new,
    p.tags
  FROM (VALUES
    (
      'Wireless Noise-Cancelling Headphones', 'wireless-noise-cancelling-headphones',
      'WHP-001',
      'Premium over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.',
      24999.00, 24999.00, 50, 'electronics',
      ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
      TRUE, 'active', 4.5, 128, TRUE, TRUE, ARRAY['audio','wireless','electronics']
    ),
    (
      'Organic Cotton T-Shirt', 'organic-cotton-t-shirt', 'TEE-001',
      'Soft, breathable organic cotton t-shirt in neutral tones. Machine washable.',
      1899.00, 1899.00, 200, 'fashion',
      ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'],
      TRUE, 'active', 4.2, 45, FALSE, TRUE, ARRAY['fashion','apparel','organic']
    ),
    (
      'Ceramic Plant Pot Set', 'ceramic-plant-pot-set', 'HOM-001',
      'Aesthetic set of three ceramic plant pots with drainage holes, ideal for indoor plants.',
      3499.00, 3499.00, 30, 'home-garden',
      ARRAY['https://images.unsplash.com/photo-1485955900006-10f4d324d411'],
      TRUE, 'active', 4.7, 82, TRUE, FALSE, ARRAY['home','decor','garden']
    ),
    (
      'Artisan Roasted Coffee Beans 500g', 'artisan-roasted-coffee-beans-500g', 'GRC-001',
      'Single-origin medium roast coffee beans, freshly roasted and vacuum packed.',
      2999.00, 2999.00, 150, 'groceries',
      ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e'],
      TRUE, 'active', 4.8, 210, TRUE, TRUE, ARRAY['groceries','coffee','beverages']
    ),
    (
      'Vitamin C Brightening Serum', 'vitamin-c-brightening-serum', 'BEA-001',
      'Lightweight facial serum with Vitamin C, hyaluronic acid and vitamin E for radiant skin.',
      2499.00, 2499.00, 90, 'beauty',
      ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be'],
      TRUE, 'active', 4.4, 67, FALSE, TRUE, ARRAY['beauty','skincare','serum']
    )
  ) AS p(
    name, slug, sku, description, price, discount_price, stock_quantity,
    category_slug, images, is_active, status, rating, review_count, is_featured, is_new, tags
  )
  JOIN categories c ON c.slug = p.category_slug
  JOIN brands b        ON b.slug  = 'e-mart-essentials'
  CROSS JOIN vendor_resolution vr
  WHERE vr.vendor_id IS NOT NULL
  ON CONFLICT (slug) DO NOTHING
)
SELECT count(*) AS products_seeded FROM seeded;

COMMIT;
