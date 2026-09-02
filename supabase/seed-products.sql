-- ============================================================================
-- E-Mart Product Seed Data (2026)
-- ----------------------------------------------------------------------------
-- Use this to populate real product data so the storefront does not rely on
-- mock data. Idempotent (safe to run multiple times).
--
-- PREREQUISITES:
--   - A seller profile + approved vendor must exist. Update the email below
--     to match your demo seller's registered email (profiles.email) OR provide
--     a vendor by slug. The script falls back: email match on profiles -> vendors,
--     otherwise the first active vendor.
--   - Categories are created or matched by slug.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ensure base categories exist (Electronics, Fashion, Home & Garden)
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
-- 2. Resolve the target vendor (edit the email to match your demo seller)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  target_vendor_id UUID;
  target_email TEXT := 'seller@demo.com';
  cat_elec UUID;
  cat_fash UUID;
  cat_home UUID;
  cat_groc UUID;
  cat_beau UUID;
  brand_id UUID;
BEGIN
  -- Try to resolve vendor by seller email -> profiles -> vendors
  SELECT v.id INTO target_vendor_id
  FROM vendors v
  JOIN profiles p ON p.id = v.user_id
  WHERE p.email = target_email
  LIMIT 1;

  -- Fallback: any approved vendor
  IF target_vendor_id IS NULL THEN
    SELECT id INTO target_vendor_id FROM vendors WHERE status = 'approved' LIMIT 1;
  END IF;

  IF target_vendor_id IS NULL THEN
    RAISE NOTICE 'No vendor found. Create a seller/vendor first, or update target_email.';
    RETURN;
  END IF;

  SELECT id INTO cat_elec FROM categories WHERE slug = 'electronics';
  SELECT id INTO cat_fash FROM categories WHERE slug = 'fashion';
  SELECT id INTO cat_home FROM categories WHERE slug = 'home-garden';
  SELECT id INTO cat_groc FROM categories WHERE slug = 'groceries';
  SELECT id INTO cat_beau FROM categories WHERE slug = 'beauty';
  SELECT id INTO brand_id FROM brands WHERE slug = 'e-mart-essentials';

  -- ----------------------------------------------------------------------------
  -- 3. Insert sample products
  -- ----------------------------------------------------------------------------
  INSERT INTO products (
    vendor_id, name, slug, sku, description, price, cost, stock_quantity,
    category_id, brand_id, images, is_active, status, rating, review_count,
    is_featured, is_new, tags
  ) VALUES
    (
      target_vendor_id, 'Wireless Noise-Cancelling Headphones',
      'wireless-noise-cancelling-headphones', 'WHP-001',
      'Premium over-ear Bluetooth headphones with active noise cancellation and 30-hour battery life.',
      24999.00, 12000.00, 50, cat_elec, brand_id,
      ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
      TRUE, 'active', 4.5, 128, TRUE, TRUE, ARRAY['audio','wireless','electronics']
    ),
    (
      target_vendor_id, 'Organic Cotton T-Shirt',
      'organic-cotton-t-shirt', 'TEE-001',
      'Soft, breathable organic cotton t-shirt in neutral tones. Machine washable.',
      1899.00, 700.00, 200, cat_fash, brand_id,
      ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'],
      TRUE, 'active', 4.2, 45, FALSE, TRUE, ARRAY['fashion','apparel','organic']
    ),
    (
      target_vendor_id, 'Ceramic Plant Pot Set',
      'ceramic-plant-pot-set', 'HOM-001',
      'Aesthetic set of three ceramic plant pots with drainage holes, ideal for indoor plants.',
      3499.00, 1500.00, 30, cat_home, brand_id,
      ARRAY['https://images.unsplash.com/photo-1485955900006-10f4d324d411'],
      TRUE, 'active', 4.7, 82, TRUE, FALSE, ARRAY['home','decor','garden']
    ),
    (
      target_vendor_id, 'Artisan Roasted Coffee Beans 500g',
      'artisan-roasted-coffee-beans-500g', 'GRC-001',
      'Single-origin medium roast coffee beans, freshly roasted and vacuum packed.',
      2999.00, 1100.00, 150, cat_groc, brand_id,
      ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e'],
      TRUE, 'active', 4.8, 210, TRUE, TRUE, ARRAY['groceries','coffee','beverages']
    ),
    (
      target_vendor_id, 'Vitamin C Brightening Serum',
      'vitamin-c-brightening-serum', 'BEA-001',
      'Lightweight facial serum with Vitamin C, hyaluronic acid and vitamin E for radiant skin.',
      2499.00, 900.00, 90, cat_beau, brand_id,
      ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be'],
      TRUE, 'active', 4.4, 67, FALSE, TRUE, ARRAY['beauty','skincare','serum']
    )
  ON CONFLICT (sku) DO NOTHING;
END $$;

COMMIT;
