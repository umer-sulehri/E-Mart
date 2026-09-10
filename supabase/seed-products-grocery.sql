-- ============================================================================
-- E-Mart Grocery Catalog Seed Data (2026)
-- ----------------------------------------------------------------------------
-- Adds a realistic grocery catalog across the 17 top-level categories used by
-- the shop filter sidebar (see lib/constants.ts) so category, brand, price,
-- rating and stock filters return meaningful results.
--
-- Idempotent (safe to run multiple times) and uses plain top-level DML (no
-- plpgsql DO block) so it runs as the SQL-editor role, bypassing RLS.
--
-- PREREQUISITE: an approved vendor must exist (see seed-products.sql). The
-- first approved vendor is used as the seller for these products.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ensure additional brands exist (E-Mart Essentials comes from seed-products).
-- ----------------------------------------------------------------------------
INSERT INTO brands (name, slug, description, is_active) VALUES
  ('Organic Farms', 'organic-farms', 'Locally grown organic produce', TRUE),
  ('Pure & Fresh', 'pure-fresh', 'Fresh dairy, bakery and beverages', TRUE),
  ('Harvest Valley', 'harvest-valley', 'Pantry staples, canned goods and grains', TRUE),
  ('Wellness Plus', 'wellness-plus', 'Health, supplements and personal care', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Resolve the target vendor (fall back to any approved vendor).
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
-- 3. Seed grocery products referencing resolved IDs.
--    No-op when no vendor is found.
-- ----------------------------------------------------------------------------
seeded AS (
  INSERT INTO products (
    vendor_id, name, slug, sku, description, price, discount_price, stock_quantity,
    category_id, brand_id, images, is_active, status, moderation_status, rating,
    review_count, is_featured, is_new, tags
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
    'approved'::text AS moderation_status,
    p.rating,
    p.review_count,
    p.is_featured,
    p.is_new,
    p.tags
  FROM (VALUES
    -- Fruits & Vegetables ----------------------------------------------------
    (
      'Fresh Organic Bananas (1 dozen)', 'fresh-organic-bananas-dozen', 'FV-001',
      'Hand-picked ripe bananas, naturally ripened and rich in potassium.',
      349.00, 349.00, 300, 'fruits-vegetables', 'organic-farms',
      ARRAY['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e'],
      TRUE, 'active', 4.6, 214, FALSE, FALSE, ARRAY['fruits','bananas','organic']
    ),
    (
      'Seasonal Apples (1 kg)', 'seasonal-apples-1kg', 'FV-002',
      'Crisp, juicy seasonal apples. Ideal for snacking and baking.',
      699.00, 599.00, 250, 'fruits-vegetables', 'organic-farms',
      ARRAY['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6'],
      TRUE, 'active', 4.7, 168, TRUE, FALSE, ARRAY['fruits','apples','organic']
    ),
    (
      'Fresh Tomatoes (500 g)', 'fresh-tomatoes-500g', 'FV-003',
      'Ripe, vine-grown tomatoes full of flavour for salads and curries.',
      299.00, 299.00, 400, 'fruits-vegetables', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1592924357228-91a4daadcfea'],
      TRUE, 'active', 4.4, 96, FALSE, TRUE, ARRAY['vegetables','tomatoes','fresh']
    ),
    (
      'Baby Spinach (250 g)', 'baby-spinach-250g', 'FV-004',
      'Tender, pre-washed baby spinach leaves packed with iron and vitamins.',
      249.00, 249.00, 180, 'fruits-vegetables', 'organic-farms',
      ARRAY['https://images.unsplash.com/photo-1576045057995-568f588f82fb'],
      TRUE, 'active', 4.5, 73, FALSE, FALSE, ARRAY['vegetables','spinach','organic']
    ),

    -- Dairy & Eggs -----------------------------------------------------------
    (
      'Fresh Whole Milk (1 L)', 'fresh-whole-milk-1l', 'DE-001',
      'Pasteurized whole milk from local dairy farms. Rich and creamy.',
      250.00, 250.00, 500, 'dairy-eggs', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1550583724-b2692b85b150'],
      TRUE, 'active', 4.6, 240, FALSE, FALSE, ARRAY['dairy','milk','fresh']
    ),
    (
      'Farm Eggs (12 pack)', 'farm-eggs-12-pack', 'DE-002',
      'Free-range farm eggs, high in protein and great for any meal.',
      480.00, 420.00, 350, 'dairy-eggs', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1506976785307-8732e854ad03'],
      TRUE, 'active', 4.7, 198, TRUE, FALSE, ARRAY['eggs','protein','fresh']
    ),
    (
      'Cheddar Cheese Block (400 g)', 'cheddar-cheese-block-400g', 'DE-003',
      'Aged cheddar with a sharp, rich flavour. Perfect for sandwiches and cooking.',
      950.00, 950.00, 120, 'dairy-eggs', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d'],
      TRUE, 'active', 4.5, 88, FALSE, FALSE, ARRAY['dairy','cheese','imported']
    ),
    (
      'Greek Yogurt (500 g)', 'greek-yogurt-500g', 'DE-004',
      'Thick, creamy Greek yogurt with live cultures and no added sugar.',
      420.00, 420.00, 220, 'dairy-eggs', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1488477181946-6428a0291777'],
      TRUE, 'active', 4.4, 65, FALSE, TRUE, ARRAY['dairy','yogurt','healthy']
    ),

    -- Meat & Poultry ---------------------------------------------------------
    (
      'Chicken Breast (500 g)', 'chicken-breast-500g', 'MP-001',
      'Skinless, boneless chicken breast. Lean, tender and versatile.',
      850.00, 850.00, 180, 'meat-poultry', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1604503468506-a8da13d82791'],
      TRUE, 'active', 4.5, 142, FALSE, FALSE, ARRAY['meat','chicken','fresh']
    ),
    (
      'Beef Mince (500 g)', 'beef-mince-500g', 'MP-002',
      'Freshly ground beef mince, perfect for koftas, burgers and curries.',
      1200.00, 1200.00, 140, 'meat-poultry', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1603048297172-c92544798d5a'],
      TRUE, 'active', 4.3, 89, FALSE, FALSE, ARRAY['meat','beef','fresh']
    ),
    (
      'Chicken Leg Quarters (1 kg)', 'chicken-leg-quarters-1kg', 'MP-003',
      'Whole chicken leg quarters, juicy and flavourful for roasting or grilling.',
      980.00, 880.00, 160, 'meat-poultry', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1587593810167-a84920ea0781'],
      TRUE, 'active', 4.4, 77, TRUE, FALSE, ARRAY['meat','chicken','grill']
    ),

    -- Seafood ---------------------------------------------------------------
    (
      'Frozen Salmon Fillet (400 g)', 'frozen-salmon-fillet-400g', 'SF-001',
      'Rich, omega-3 packed salmon fillets, individually frozen for freshness.',
      2800.00, 2800.00, 60, 'seafood', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2'],
      TRUE, 'active', 4.8, 54, TRUE, TRUE, ARRAY['seafood','salmon','frozen']
    ),
    (
      'White Fish Fillets (500 g)', 'white-fish-fillets-500g', 'SF-002',
      'Mild, flaky white fish fillets. Great for frying, baking or curries.',
      1650.00, 1650.00, 70, 'seafood', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62'],
      TRUE, 'active', 4.4, 41, FALSE, FALSE, ARRAY['seafood','fish','fresh']
    ),

    -- Bakery -------------------------------------------------------------
    (
      'Whole Wheat Bread', 'whole-wheat-bread', 'BK-001',
      'Soft whole wheat sandwich loaf baked fresh daily with no preservatives.',
      280.00, 240.00, 90, 'bakery', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1509440159596-0249088772ff'],
      TRUE, 'active', 4.5, 132, FALSE, FALSE, ARRAY['bakery','bread','fresh']
    ),
    (
      'Butter Croissants (4 pack)', 'butter-croissants-4-pack', 'BK-002',
      'Flaky, buttery croissants baked fresh every morning.',
      650.00, 650.00, 45, 'bakery', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1555507036-ab1f4038808a'],
      TRUE, 'active', 4.7, 83, TRUE, FALSE, ARRAY['bakery','croissant','fresh']
    ),
    (
      'Chocolate Brownie (6 pack)', 'chocolate-brownie-6-pack', 'BK-003',
      'Dense, fudgy chocolate brownies with a gooey centre.',
      1200.00, 990.00, 50, 'bakery', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1606313564200-e75d5e30476c'],
      TRUE, 'active', 4.6, 61, FALSE, TRUE, ARRAY['bakery','brownie','dessert']
    ),

    -- Canned Goods -----------------------------------------------------------
    (
      'Canned Chickpeas (400 g)', 'canned-chickpeas-400g', 'CN-001',
      'Convenient, ready-to-use chickpeas in lightly salted water.',
      350.00, 350.00, 200, 'canned-goods', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1517686469429-8bdb88b9f907'],
      TRUE, 'active', 4.3, 58, FALSE, FALSE, ARRAY['canned','chickpeas','pantry']
    ),
    (
      'Crushed Tomatoes (400 g)', 'crushed-tomatoes-400g', 'CN-002',
      'Sun-ripened crushed tomatoes, ideal for sauces and stews.',
      320.00, 320.00, 220, 'canned-goods', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1488462237308-ecaa28b729d7'],
      TRUE, 'active', 4.2, 47, FALSE, FALSE, ARRAY['canned','tomatoes','pantry']
    ),
    (
      'Tuna in Oil (185 g)', 'tuna-in-oil-185g', 'CN-003',
      'Premium skipjack tuna packed in sunflower oil. A pantry staple.',
      780.00, 720.00, 130, 'canned-goods', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1606791405792-1004f1718d0c'],
      TRUE, 'active', 4.4, 39, FALSE, TRUE, ARRAY['canned','tuna','protein']
    ),

    -- Frozen Foods -----------------------------------------------------------
    (
      'Frozen Mixed Vegetables (1 kg)', 'frozen-mixed-vegetables-1kg', 'FR-001',
      'Garden vegetables flash-frozen at peak freshness.',
      640.00, 640.00, 120, 'frozen-foods', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1546953304-5d96f43c2e94'],
      TRUE, 'active', 4.3, 71, FALSE, FALSE, ARRAY['frozen','vegetables','convenient']
    ),
    (
      'Vanilla Ice Cream (1 L)', 'vanilla-ice-cream-1l', 'FR-002',
      'Creamy classic vanilla ice cream made with real vanilla beans.',
      1250.00, 990.00, 80, 'frozen-foods', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1497034825429-c343d7c6a68f'],
      TRUE, 'active', 4.7, 150, TRUE, FALSE, ARRAY['frozen','ice-cream','dessert']
    ),
    (
      'Frozen Chicken Nuggets (500 g)', 'frozen-chicken-nuggets-500g', 'FR-003',
      'Crispy, oven-baked chicken nuggets kids and grown-ups love.',
      890.00, 890.00, 110, 'frozen-foods', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1562967914-608f82629710'],
      TRUE, 'active', 4.2, 66, FALSE, FALSE, ARRAY['frozen','nuggets','snack']
    ),

    -- Pasta & Rice -----------------------------------------------------------
    (
      'Penne Pasta (500 g)', 'penne-pasta-500g', 'PR-001',
      'Durum wheat penne with ridges that hold sauce beautifully.',
      420.00, 420.00, 260, 'pasta-rice', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1551183053-bf91a1d81141'],
      TRUE, 'active', 4.4, 84, FALSE, FALSE, ARRAY['pasta','italian','pantry']
    ),
    (
      'Basmati Rice (5 kg)', 'basmati-rice-5kg', 'PR-002',
      'Extra-long grain basmati rice, aged for perfect fluffiness.',
      3200.00, 2800.00, 150, 'pasta-rice', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1586201375761-83865001e31c'],
      TRUE, 'active', 4.8, 230, TRUE, FALSE, ARRAY['rice','basmati','staple']
    ),
    (
      'Spaghetti (500 g)', 'spaghetti-500g', 'PR-003',
      'Classic durum wheat spaghetti, prefect with any sauce.',
      410.00, 410.00, 240, 'pasta-rice', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9'],
      TRUE, 'active', 4.3, 52, FALSE, TRUE, ARRAY['pasta','spaghetti','pantry']
    ),

    -- Breakfast --------------------------------------------------------------
    (
      'Corn Flakes (750 g)', 'corn-flakes-750g', 'BR-001',
      'Crunchy toasted corn flakes, a wholesome start to your day.',
      1150.00, 1150.00, 130, 'breakfast', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1484723091739-30a097e8f929'],
      TRUE, 'active', 4.3, 78, FALSE, FALSE, ARRAY['breakfast','cereal','family']
    ),
    (
      'Quick Oats (1 kg)', 'quick-oats-1kg', 'BR-002',
      '100% wholegrain oats, ready in minutes. High in fibre.',
      890.00, 890.00, 160, 'breakfast', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1517673400267-0251440c45dc'],
      TRUE, 'active', 4.5, 92, TRUE, FALSE, ARRAY['breakfast','oats','healthy']
    ),
    (
      'Pure Honey (500 g)', 'pure-honey-500g', 'BR-003',
      'Unfiltered, raw honey sourced from local beekeepers.',
      1450.00, 1250.00, 95, 'breakfast', 'organic-farms',
      ARRAY['https://images.unsplash.com/photo-1587049352846-4a222e784d38'],
      TRUE, 'active', 4.8, 205, FALSE, TRUE, ARRAY['honey','organic','breakfast']
    ),

    -- Snacks -----------------------------------------------------------------
    (
      'Potato Chips (150 g)', 'potato-chips-150g', 'SN-001',
      'Lightly salted, crispy potato chips for snacking any time.',
      350.00, 350.00, 400, 'snacks', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1566478989037-eec170784d0b'],
      TRUE, 'active', 4.2, 110, FALSE, FALSE, ARRAY['snacks','chips','fun']
    ),
    (
      'Roasted Almonds (250 g)', 'roasted-almonds-250g', 'SN-002',
      'Lightly salted roasted almonds, a nutritious energy-boosting snack.',
      1250.00, 1090.00, 140, 'snacks', 'organic-farms',
      ARRAY['https://images.unsplash.com/photo-1508061253366-f7da158b6d46'],
      TRUE, 'active', 4.6, 87, TRUE, FALSE, ARRAY['snacks','almonds','healthy']
    ),
    (
      'Dark Chocolate Bar (100 g)', 'dark-chocolate-bar-100g', 'SN-003',
      '70% cocoa dark chocolate with bold, intense flavour.',
      550.00, 550.00, 210, 'snacks', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1549007994-cb92caebd54b'],
      TRUE, 'active', 4.5, 64, FALSE, TRUE, ARRAY['chocolate','snacks','dessert']
    ),

    -- Beverages --------------------------------------------------------------
    (
      'Mineral Water (1.5 L)', 'mineral-water-1.5l', 'BV-001',
      'Natural spring mineral water, purified and bottled for freshness.',
      180.00, 180.00, 600, 'beverages', 'pure-fresh',
      ARRAY['https://images.unsplash.com/photo-1548839140-29a749e1cf4d'],
      TRUE, 'active', 4.5, 320, FALSE, FALSE, ARRAY['water','beverages','hydrating']
    ),
    (
      'Fresh Orange Juice (1 L)', 'fresh-orange-juice-1l', 'BV-002',
      'Pure squeezed orange juice with no added sugar or preservatives.',
      890.00, 790.00, 180, 'beverages', 'organic-farms',
      ARRAY['https://images.unsplash.com/photo-1600271886742-f049cd451bba'],
      TRUE, 'active', 4.6, 143, TRUE, FALSE, ARRAY['juice','beverages','fresh']
    ),
    (
      'Cola (1.5 L)', 'cola-1.5l', 'BV-003',
      'Classic cola with its signature fizz. Great chilled.',
      320.00, 320.00, 350, 'beverages', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1581636625402-29b2a704ef13'],
      TRUE, 'active', 4.1, 175, FALSE, FALSE, ARRAY['soda','beverages','fizz']
    ),
    (
      'Black Tea (250 g)', 'black-tea-250g', 'BV-004',
      'Robust, full-bodied black tea leaves for a strong daily brew.',
      980.00, 850.00, 190, 'beverages', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9'],
      TRUE, 'active', 4.7, 156, TRUE, FALSE, ARRAY['tea','beverages','refresh']
    ),
    (
      'Green Tea Bags (25 pack)', 'green-tea-bags-25-pack', 'BV-005',
      'Antioxidant-rich green tea in convenient pyramid bags.',
      720.00, 720.00, 170, 'beverages', 'wellness-plus',
      ARRAY['https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5'],
      TRUE, 'active', 4.4, 68, FALSE, TRUE, ARRAY['tea','green-tea','healthy']
    ),

    -- Spices & Seasonings ----------------------------------------------------
    (
      'Turmeric Powder (100 g)', 'turmeric-powder-100g', 'SP-001',
      'Bright, high-curcumin turmeric powder, free of artificial colour.',
      260.00, 260.00, 280, 'spices-seasonings', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1615485500704-8e990f9900f7'],
      TRUE, 'active', 4.4, 59, FALSE, FALSE, ARRAY['spices','turmeric','cooking']
    ),
    (
      'Garam Masala (100 g)', 'garam-masala-100g', 'SP-002',
      'Aromatic blend of roasted whole spices for rich, warm flavour.',
      480.00, 480.00, 240, 'spices-seasonings', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d'],
      TRUE, 'active', 4.5, 73, FALSE, TRUE, ARRAY['spices','masala','cooking']
    ),
    (
      'Black Pepper (100 g)', 'black-pepper-100g', 'SP-003',
      'Whole black peppercorns, freshly packed for full aroma.',
      720.00, 720.00, 220, 'spices-seasonings', 'harvest-valley',
      ARRAY['https://images.unsplash.com/photo-1570114187231-9a2e5a1f7ec2'],
      TRUE, 'active', 4.3, 44, FALSE, FALSE, ARRAY['spices','pepper','cooking']
    ),

    -- Baby Food & Formula ----------------------------------------------------
    (
      'Baby Rice Cereal (300 g)', 'baby-rice-cereal-300g', 'BF-001',
      'Iron-fortified rice cereal for babies, easy to digest and prepare.',
      940.00, 940.00, 80, 'baby-food-formula', 'wellness-plus',
      ARRAY['https://images.unsplash.com/photo-1525253019412-b886ef778fc7'],
      TRUE, 'active', 4.6, 51, FALSE, FALSE, ARRAY['baby','cereal','formula']
    ),
    (
      'Infant Formula Stage 1 (400 g)', 'infant-formula-stage-1-400g', 'BF-002',
      'Complete nutrition milk formula for infants from birth.',
      3200.00, 2900.00, 60, 'baby-food-formula', 'wellness-plus',
      ARRAY['https://images.unsplash.com/photo-1555252333-9f8e92e65df9'],
      TRUE, 'active', 4.7, 88, TRUE, FALSE, ARRAY['baby','formula','nutrition']
    ),

    -- Health & Wellness ------------------------------------------------------
    (
      'Vitamin C Tablets (60 pack)', 'vitamin-c-tablets-60-pack', 'HW-001',
      'Daily immunity support with 1000mg Vitamin C per tablet.',
      1350.00, 1150.00, 110, 'health-wellness', 'wellness-plus',
      ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae'],
      TRUE, 'active', 4.5, 96, TRUE, FALSE, ARRAY['health','vitamins','immunity']
    ),
    (
      'Multivitamin Gummies (60 pack)', 'multivitamin-gummies-60-pack', 'HW-002',
      'Delicious daily multivitamin gummies for overall wellness.',
      1650.00, 1650.00, 90, 'health-wellness', 'wellness-plus',
      ARRAY['https://images.unsplash.com/photo-1584017911766-d451b3d0e843'],
      TRUE, 'active', 4.4, 62, FALSE, TRUE, ARRAY['health','vitamins','gummies']
    ),
    (
      'Omega-3 Fish Oil (30 softgels)', 'omega-3-fish-oil-30-softgels', 'HW-003',
      'High-potency fish oil to support heart, brain and joint health.',
      1850.00, 1850.00, 85, 'health-wellness', 'wellness-plus',
      ARRAY['https://images.unsplash.com/photo-1587854692152-cbe660dbde88'],
      TRUE, 'active', 4.5, 47, FALSE, FALSE, ARRAY['health','omega3','supplement']
    ),

    -- Household Supplies -----------------------------------------------------
    (
      'Dishwashing Liquid (1 L)', 'dishwashing-liquid-1l', 'HS-001',
      'Tough on grease, gentle on hands. Lemon fresh scent.',
      480.00, 480.00, 260, 'household-supplies', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1583947581927-78b40d7b60c1'],
      TRUE, 'active', 4.3, 55, FALSE, FALSE, ARRAY['household','cleaning','kitchen']
    ),
    (
      'All-Purpose Cleaner (750 ml)', 'all-purpose-cleaner-750ml', 'HS-002',
      'Surface cleaner for floors, tiles and countertops. Antibacterial.',
      590.00, 590.00, 200, 'household-supplies', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1563453392212-326f5e854473'],
      TRUE, 'active', 4.2, 38, FALSE, FALSE, ARRAY['household','cleaner','antibacterial']
    ),
    (
      'Laundry Detergent (1 kg)', 'laundry-detergent-1kg', 'HS-003',
      'Deep-clean detergent with a fresh fragrance that lasts.',
      780.00, 720.00, 190, 'household-supplies', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1610557892470-55d9e80c0bce'],
      TRUE, 'active', 4.4, 71, FALSE, TRUE, ARRAY['household','laundry','clean']
    ),

    -- Personal Care ----------------------------------------------------------
    (
      'Hand Wash (500 ml)', 'hand-wash-500ml', 'PC-001',
      'Gentle antibacterial hand wash with a soft floral scent.',
      520.00, 520.00, 240, 'personal-care', 'wellness-plus',
      ARRAY['https://images.unsplash.com/photo-1607006345348-407e454ba19f'],
      TRUE, 'active', 4.4, 64, FALSE, FALSE, ARRAY['personal-care','handwash','hygiene']
    ),
    (
      'Aloe Vera Shampoo (350 ml)', 'aloe-vera-shampoo-350ml', 'PC-002',
      'Nourishing shampoo with aloe vera for soft, hydrated hair.',
      840.00, 720.00, 180, 'personal-care', 'wellness-plus',
      ARRAY['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881'],
      TRUE, 'active', 4.4, 52, TRUE, FALSE, ARRAY['personal-care','shampoo','haircare']
    ),
    (
      'Toothpaste (150 g)', 'toothpaste-150g', 'PC-003',
      'Cavity protection toothpaste with fluoride and mint fresh taste.',
      480.00, 480.00, 300, 'personal-care', 'wellness-plus',
      ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be'],
      TRUE, 'active', 4.3, 83, FALSE, TRUE, ARRAY['personal-care','toothpaste','oral-care']
    ),

    -- Pet Food & Supplies ----------------------------------------------------
    (
      'Dog Food (2 kg)', 'dog-food-2kg', 'PF-001',
      'Complete and balanced nutrition for adult dogs. Chicken flavour.',
      2400.00, 2100.00, 90, 'pet-food-supplies', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1568640347023-a616a30bc3bd'],
      TRUE, 'active', 4.5, 46, TRUE, FALSE, ARRAY['pets','dog-food','nutrition']
    ),
    (
      'Cat Food (1.5 kg)', 'cat-food-1.5kg', 'PF-002',
      'High-protein dry cat food for indoor and outdoor cats.',
      1950.00, 1950.00, 80, 'pet-food-supplies', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1589924691995-400dc9ecc119'],
      TRUE, 'active', 4.4, 39, FALSE, FALSE, ARRAY['pets','cat-food','nutrition']
    ),
    (
      'Cat Litter (5 kg)', 'cat-litter-5kg', 'PF-003',
      'Clumping, low-dust cat litter with odour control.',
      1650.00, 1650.00, 100, 'pet-food-supplies', 'e-mart-essentials',
      ARRAY['https://images.unsplash.com/photo-1543941890-1673122457de'],
      TRUE, 'active', 4.3, 33, FALSE, TRUE, ARRAY['pets','litter','supplies']
    )
  ) AS p(
    name, slug, sku, description, price, discount_price, stock_quantity,
    category_slug, brand_slug, images, is_active, status, rating, review_count,
    is_featured, is_new, tags
  )
  JOIN categories c ON c.slug = p.category_slug
  JOIN brands b        ON b.slug  = p.brand_slug
  CROSS JOIN vendor_resolution vr
  WHERE vr.vendor_id IS NOT NULL
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
)
SELECT count(*) AS products_seeded FROM seeded;

COMMIT;