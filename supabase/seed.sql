-- ============================================================
-- E-Mart - Seed Data
-- ============================================================

-- ============================================================
-- DEFAULT PLATFORM SETTINGS
-- ============================================================

INSERT INTO settings (key, value) VALUES
  ('site_name', '"E-Mart"'),
  ('site_url', '"https://emart.pk"'),
  ('site_description', '"Fresh groceries delivered to your doorstep"'),
  ('support_email', '"support@emart.pk"'),
  ('support_phone', '"+92-300-1234567"'),
  ('currency', '"PKR"'),
  ('currency_symbol', '"Rs."'),
  ('tax_rate', '17'),
  ('free_shipping_threshold', '2000'),
  ('standard_shipping_cost', '0'),
  ('express_shipping_cost', '150'),
  ('same_day_shipping_cost', '250'),
  ('min_order_amount', '500'),
  ('max_order_amount', '50000'),
  ('default_commission_rate', '10'),
  ('seller_payout_schedule', '"weekly"'),
  ('max_cart_items', '50'),
  ('max_address_count', '10'),
  ('allow_guest_checkout', 'false'),
  ('maintenance_mode', 'false'),
  ('social_links', '{"facebook": "https://facebook.com/emart", "twitter": "https://twitter.com/emart", "instagram": "https://instagram.com/emart"}'),
  ('payment_methods', '["cod", "easypaisa", "jazzcash", "stripe"]'),
  ('shipping_methods', '{"standard": {"name": "Standard Delivery", "days": "3-5 days", "price": 0}, "express": {"name": "Express Delivery", "days": "1-2 days", "price": 150}, "same_day": {"name": "Same Day Delivery", "days": "Within 24 hours", "price": 250}}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED CATEGORIES (17 grocery categories)
-- ============================================================

INSERT INTO categories (id, name, slug, description, image_url, display_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Fruits & Vegetables', 'fruits-vegetables', 'Fresh fruits and vegetables', '/images/categories/fruits-vegetables.jpg', 1),
  ('a0000001-0000-0000-0000-000000000002', 'Dairy & Eggs', 'dairy-eggs', 'Milk, cheese, yogurt, and eggs', '/images/categories/dairy-eggs.jpg', 2),
  ('a0000001-0000-0000-0000-000000000003', 'Meat & Poultry', 'meat-poultry', 'Fresh and frozen meat and poultry', '/images/categories/meat-poultry.jpg', 3),
  ('a0000001-0000-0000-0000-000000000004', 'Seafood', 'seafood', 'Fresh and frozen seafood', '/images/categories/seafood.jpg', 4),
  ('a0000001-0000-0000-0000-000000000005', 'Bakery', 'bakery', 'Bread, pastries, and baked goods', '/images/categories/bakery.jpg', 5),
  ('a0000001-0000-0000-0000-000000000006', 'Canned Goods', 'canned-goods', 'Canned foods and preserved items', '/images/categories/canned-goods.jpg', 6),
  ('a0000001-0000-0000-0000-000000000007', 'Frozen Foods', 'frozen-foods', 'Frozen meals, snacks, and ice cream', '/images/categories/frozen-foods.jpg', 7),
  ('a0000001-0000-0000-0000-000000000008', 'Pasta & Rice', 'pasta-rice', 'Pasta, rice, and grains', '/images/categories/pasta-rice.jpg', 8),
  ('a0000001-0000-0000-0000-000000000009', 'Breakfast', 'breakfast', 'Cereals, oatmeal, and breakfast items', '/images/categories/breakfast.jpg', 9),
  ('a0000001-0000-0000-0000-000000000010', 'Snacks', 'snacks', 'Chips, nuts, and snack foods', '/images/categories/snacks.jpg', 10),
  ('a0000001-0000-0000-0000-000000000011', 'Beverages', 'beverages', 'Water, juice, soda, and drinks', '/images/categories/beverages.jpg', 11),
  ('a0000001-0000-0000-0000-000000000012', 'Spices & Seasonings', 'spices-seasonings', 'Spices, herbs, and seasonings', '/images/categories/spices-seasonings.jpg', 12),
  ('a0000001-0000-0000-0000-000000000013', 'Baby Food & Formula', 'baby-food-formula', 'Baby food and formula', '/images/categories/baby-food-formula.jpg', 13),
  ('a0000001-0000-0000-0000-000000000014', 'Health & Wellness', 'health-wellness', 'Vitamins, supplements, and health products', '/images/categories/health-wellness.jpg', 14),
  ('a0000001-0000-0000-0000-000000000015', 'Household Supplies', 'household-supplies', 'Cleaning and household essentials', '/images/categories/household-supplies.jpg', 15),
  ('a0000001-0000-0000-0000-000000000016', 'Personal Care', 'personal-care', 'Hygiene and personal care products', '/images/categories/personal-care.jpg', 16),
  ('a0000001-0000-0000-0000-000000000017', 'Pet Food & Supplies', 'pet-food-supplies', 'Food and supplies for pets', '/images/categories/pet-food-supplies.jpg', 17)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED BEVERAGE SUBCATEGORIES
-- ============================================================

INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Water', 'water', 'a0000001-0000-0000-0000-000000000011', 1),
  ('Juice', 'juice', 'a0000001-0000-0000-0000-000000000011', 2),
  ('Soda', 'soda', 'a0000001-0000-0000-0000-000000000011', 3),
  ('Tea', 'tea', 'a0000001-0000-0000-0000-000000000011', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED SAMPLE BANNERS
-- ============================================================

INSERT INTO banners (title, subtitle, image_url, position, is_active, priority) VALUES
  ('Welcome to E-Mart', 'Fresh groceries delivered to your doorstep', '/images/banners/hero-banner.jpg', 'home_top', true, 1),
  ('Daily Fresh Deals', 'Save up to 30% on fresh produce', '/images/banners/fresh-deals.jpg', 'home_middle', true, 2),
  ('Free Delivery', 'On orders above Rs. 2000', '/images/banners/free-delivery.jpg', 'home_bottom', true, 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED SAMPLE PRODUCT TAGS
-- ============================================================

INSERT INTO product_tags (name, slug) VALUES
  ('Organic', 'organic'),
  ('Fresh', 'fresh'),
  ('Imported', 'imported'),
  ('Local', 'local'),
  ('Halal', 'halal'),
  ('Gluten Free', 'gluten-free'),
  ('Vegan', 'vegan'),
  ('Sugar Free', 'sugar-free'),
  ('Best Seller', 'best-seller'),
  ('New Arrival', 'new-arrival')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ADMIN ACCOUNT — created via Supabase Auth (not seedable).
-- Default credentials (set these in Supabase Dashboard -> Auth -> Users):
--   Email:    admin@emart.com
--   Password: W@fa04batool
-- Google admin login: admins sign in with the Admin button on /login,
-- which routes to /admin. New Google admins get role='admin' automatically.
-- To create an admin profile after Auth signup, run:
--   INSERT INTO profiles (id, email, first_name, last_name, role, is_email_verified)
--   SELECT id, email, 'Admin', 'E-Mart', 'admin', true FROM auth.users WHERE email='admin@emart.com'
--   ON CONFLICT (id) DO UPDATE SET role = 'admin';
-- ============================================================

-- ============================================================
-- SEED SOCIAL LINKS
-- ============================================================

INSERT INTO social_links (platform, url, icon, is_active, display_order) VALUES
  ('facebook', 'https://facebook.com/emart', 'facebook', true, 1),
  ('twitter', 'https://twitter.com/emart', 'twitter', true, 2),
  ('instagram', 'https://instagram.com/emart', 'instagram', true, 3),
  ('youtube', 'https://youtube.com/emart', 'youtube', true, 4),
  ('whatsapp', 'https://wa.me/923001234567', 'message-circle', true, 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED TRANSLATIONS
-- ============================================================

INSERT INTO translations (key, locale, value) VALUES
  ('common.home', 'en', 'Home'),
  ('common.products', 'en', 'Products'),
  ('common.categories', 'en', 'Categories'),
  ('common.blog', 'en', 'Blog'),
  ('common.about', 'en', 'About Us'),
  ('common.contact', 'en', 'Contact'),
  ('common.cart', 'en', 'Cart'),
  ('common.checkout', 'en', 'Checkout'),
  ('common.search', 'en', 'Search'),
  ('common.login', 'en', 'Login'),
  ('common.register', 'en', 'Register'),
  ('common.profile', 'en', 'Profile'),
  ('common.orders', 'en', 'Orders'),
  ('common.wishlist', 'en', 'Wishlist'),
  ('common.logout', 'en', 'Logout'),
  ('common.add_to_cart', 'en', 'Add to Cart'),
  ('common.buy_now', 'en', 'Buy Now'),
  ('common.out_of_stock', 'en', 'Out of Stock'),
  ('common.in_stock', 'en', 'In Stock'),
  ('common.free_shipping', 'en', 'Free Shipping'),
  ('home.hero_title', 'en', 'Fresh Groceries Delivered'),
  ('home.hero_subtitle', 'en', 'Quality organic products at your doorstep'),
  ('home.shop_now', 'en', 'Shop Now'),
  ('home.best_sellers', 'en', 'Best Sellers'),
  ('home.featured_products', 'en', 'Featured Products'),
  ('home.new_arrivals', 'en', 'New Arrivals'),
  ('common.view_all', 'en', 'View All'),
  ('common.no_results', 'en', 'No results found'),
  ('common.loading', 'en', 'Loading...'),
  ('common.save', 'en', 'Save'),
  ('common.cancel', 'en', 'Cancel'),
  ('common.delete', 'en', 'Delete'),
  ('common.edit', 'en', 'Edit'),
  ('common.submit', 'en', 'Submit'),
  ('common.back', 'en', 'Back'),
  ('common.next', 'en', 'Next'),
  ('common.previous', 'en', 'Previous')
ON CONFLICT (key, locale) DO NOTHING;
