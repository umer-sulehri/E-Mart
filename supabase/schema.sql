-- ============================================================
-- E-Mart - Complete Supabase Database Schema
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer', 'admin', 'seller');
  END IF;
END
$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending', 'confirmed', 'processing', 'shipped',
      'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'pending', 'processing', 'completed', 'failed',
      'refunded', 'partially_refunded'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM (
      'credit_card', 'debit_card', 'paypal', 'stripe',
      'cash_on_delivery', 'bank_transfer',
      'cod', 'easypaisa', 'jazzcash', 'card'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_type') THEN
    CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'banner_position') THEN
    CREATE TYPE banner_position AS ENUM (
      'home_top', 'home_middle', 'home_bottom', 'category_page', 'sidebar'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blog_status') THEN
    CREATE TYPE blog_status AS ENUM ('draft', 'published', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'order_placed', 'order_shipped', 'order_delivered', 'order_cancelled',
      'payment_received', 'payment_failed', 'promo', 'system', 'review_received'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_status') THEN
    CREATE TYPE vendor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    CREATE TYPE product_status AS ENUM ('active', 'inactive', 'draft', 'archived');
  END IF;
END
$$;

-- ============================================================
-- TABLES
-- ============================================================

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'customer',
  profile_image_url TEXT,
  date_of_birth DATE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors / Sellers
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  status vendor_status DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  verified_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  sku TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  discount_price DECIMAL(10,2) CHECK (discount_price >= 0),
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  weight DECIMAL(8,2),
  dimensions JSONB,
  images TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status product_status DEFAULT 'draft',
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
is_active BOOLEAN DEFAULT TRUE,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'removed')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Tags
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  images TEXT[] DEFAULT '{}',
is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'rejected')),
  seller_reply TEXT,
  seller_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT DEFAULT 'Home',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Pakistan',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type coupon_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  maximum_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  per_user_limit INTEGER,
  applicable_product_ids UUID[] DEFAULT '{}',
  applicable_category_ids UUID[] DEFAULT '{}',
  exclude_product_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  payment_method payment_method NOT NULL,
  payment_intent_id TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  shipping_address_id UUID REFERENCES addresses(id),
  billing_address_id UUID REFERENCES addresses(id),
  tracking_number TEXT,
  shipping_carrier TEXT,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  position banner_position NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  status blog_status DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Comments
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (key-value store for platform settings)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL LINKS
-- ============================================
CREATE TABLE IF NOT EXISTS social_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEARCH HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SELLER PAYOUTS
-- ============================================
CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  account_details JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSLATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS translations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, locale)
);

-- ============================================================
-- REVIEW HELPFUL VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS review_helpful (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- ============================================================
-- REVIEW REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  reporter_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, reporter_user_id)
);

-- ============================================================
-- REFUNDS
-- ============================================================
CREATE TABLE IF NOT EXISTS refunds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  reason TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN LOGS (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- brands
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);

-- vendors
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);

-- products
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_products_images ON products USING gin(images);

-- product_tags
CREATE INDEX IF NOT EXISTS idx_product_tags_slug ON product_tags(slug);

-- reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default);

-- cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- wishlist_items
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);

-- coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);

-- banners
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_priority ON banners(priority DESC);

-- blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING gin(tags);

-- blog_comments
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- newsletter_subscribers
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- social_links
CREATE INDEX IF NOT EXISTS idx_social_links_is_active ON social_links(is_active);
CREATE INDEX IF NOT EXISTS idx_social_links_display_order ON social_links(display_order);

-- search_history
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- seller_payouts
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_id ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(status);

-- review_helpful
CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_user_id ON review_helpful(user_id);

-- review_reports
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

-- refunds
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at DESC);

-- admin_logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity_type, entity_id);

-- translations
CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON translations(locale);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY HELPERS (see supabase/2028-security-hardening.sql)
-- ============================================================

-- Canonical admin predicate. SECURITY DEFINER so policies and triggers can
-- ask "is this caller an admin?" without tripping the profiles self-recursion
-- (ERROR 42P17) that a plain subquery causes.
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

-- True when the current transaction contains a write already authorised by
-- one of the SECURITY DEFINER guard triggers (e.g. the orders trigger
-- incrementing coupons.used_count). Only our triggers set this GUC.
CREATE OR REPLACE FUNCTION public.trusted_write()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('emart.trusted_write', true), '') = 'on';
$$;

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Column-level SELECT lockdown: the row policies still decide *which* rows
-- are visible (public name/avatar for everyone), while column grants decide
-- *which columns* exist for each role. email, phone and date_of_birth are
-- PII: hidden from anon and from other authenticated users. Routes needing
-- PII switch to the service-role client behind an ownership/admin check.
-- The REVOKE/GRANT statements run at the end of this file (they reference
-- the is_blocked column, which is added there) — see the SECURITY HARDENING
-- section and supabase/2028-security-hardening.sql.

-- ============================================================
-- RLS POLICIES: categories
-- ============================================================

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: brands
-- ============================================================

DROP POLICY IF EXISTS "Brands are viewable by everyone" ON brands;
CREATE POLICY "Brands are viewable by everyone"
  ON brands FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage brands" ON brands;
CREATE POLICY "Admins can manage brands"
  ON brands FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: vendors
-- ============================================================

DROP POLICY IF EXISTS "Active vendors are viewable by everyone" ON vendors;
CREATE POLICY "Active vendors are viewable by everyone"
  ON vendors FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create vendor applications" ON vendors;
CREATE POLICY "Users can create vendor applications"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vendors can update own vendor profile" ON vendors;
CREATE POLICY "Vendors can update own vendor profile"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all vendors" ON vendors;
CREATE POLICY "Admins can manage all vendors"
  ON vendors FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: products
-- ============================================================

DROP POLICY IF EXISTS "Active products are viewable by everyone" ON products;
CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT
  USING (
    (is_active = true AND moderation_status = 'approved')
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Sellers can insert own products" ON products;
CREATE POLICY "Sellers can insert own products"
  ON products FOR INSERT
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Sellers can update own products" ON products;
CREATE POLICY "Sellers can update own products"
  ON products FOR UPDATE
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Sellers can delete own products" ON products;
CREATE POLICY "Sellers can delete own products"
  ON products FOR DELETE
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: product_tags
-- ============================================================

DROP POLICY IF EXISTS "Product tags are viewable by everyone" ON product_tags;
CREATE POLICY "Product tags are viewable by everyone"
  ON product_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage product tags" ON product_tags;
CREATE POLICY "Admins can manage product tags"
  ON product_tags FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: reviews
-- ============================================================

DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON reviews;
CREATE POLICY "Approved reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
CREATE POLICY "Admins can manage all reviews"
  ON reviews FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: addresses
-- ============================================================

DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: cart_items
-- ============================================================

DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: wishlist_items
-- ============================================================

DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist_items;
CREATE POLICY "Users can view own wishlist"
  ON wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist_items;
CREATE POLICY "Users can manage own wishlist"
  ON wishlist_items FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: coupons
-- ============================================================

DROP POLICY IF EXISTS "Active coupons are viewable by everyone" ON coupons;
CREATE POLICY "Active coupons are viewable by everyone"
  ON coupons FOR SELECT
  USING (is_active = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (
    public.is_admin()
  );

-- Sellers manage coupons they created (the seller API sets created_by
-- server-side from auth.uid(), so seller_id = created_by).
DROP POLICY IF EXISTS "Sellers can manage own coupons" ON coupons;
CREATE POLICY "Sellers can manage own coupons"
  ON coupons FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Sellers see their own (even inactive) coupons; active ones are already
-- covered by the public SELECT policy above.
DROP POLICY IF EXISTS "Sellers can view own coupons" ON coupons;
CREATE POLICY "Sellers can view own coupons"
  ON coupons FOR SELECT
  USING (auth.uid() = created_by);

-- ============================================================
-- RLS POLICIES: orders
-- ============================================================

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (
    public.is_admin()
  );

-- Buyers update their own orders (COD confirmation, cancellation, etc.)
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Buyers delete their own orders (transaction rollback in the create-order route)
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
CREATE POLICY "Users can delete own orders"
  ON orders FOR DELETE
  USING (auth.uid() = user_id);

-- Break the recursive order_items <-> orders dependency: a SECURITY DEFINER
-- function runs the cross-table lookup with the definer's privileges so RLS
-- is not re-evaluated, avoiding PostgreSQL ERROR 42P17 (infinite recursion).
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

DROP POLICY IF EXISTS "Sellers can view orders containing their products" ON orders;
CREATE POLICY "Sellers can view orders containing their products"
  ON orders FOR SELECT
  USING (public.user_can_view_order(orders.id));

-- Sellers update order/status rows containing their products (seller dashboard,
-- fulfillment flow). Admin and buyer policies are defined above.
DROP POLICY IF EXISTS "Sellers can update orders containing their products" ON orders;
CREATE POLICY "Sellers can update orders containing their products"
  ON orders FOR UPDATE
  USING (public.user_can_view_order(orders.id));

-- ----------------------------------------------------------------------------
-- order_items write helpers (SECURITY DEFINER, non-recursive)
-- ----------------------------------------------------------------------------
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

-- Users can insert/delete order items belonging to their own orders (rollback)
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (public.user_owns_order(order_id));

DROP POLICY IF EXISTS "Users can delete own order items" ON order_items;
CREATE POLICY "Users can delete own order items"
  ON order_items FOR DELETE
  USING (public.user_owns_order(order_id));

-- ============================================================
-- RLS POLICIES: order_items
-- ============================================================

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (public.user_owns_order(order_id));

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Sellers can view their order items" ON order_items;
CREATE POLICY "Sellers can view their order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors WHERE id = vendor_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: banners
-- ============================================================

DROP POLICY IF EXISTS "Active banners are viewable by everyone" ON banners;
CREATE POLICY "Active banners are viewable by everyone"
  ON banners FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage banners" ON banners;
CREATE POLICY "Admins can manage banners"
  ON banners FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: blog_posts
-- ============================================================

DROP POLICY IF EXISTS "Published blog posts are viewable by everyone" ON blog_posts;
CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Blog posts are curated content: the application has no user-facing blog
-- write path, so writes are admin-only (was: any authenticated user could
-- insert/update posts, including status = 'published').
DROP POLICY IF EXISTS "Authenticated users can create blog posts" ON blog_posts;
CREATE POLICY "Admins can create blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authors can update own blog posts" ON blog_posts;
CREATE POLICY "Admins can update blog posts"
  ON blog_posts FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all blog posts" ON blog_posts;
CREATE POLICY "Admins can manage all blog posts"
  ON blog_posts FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: blog_comments
-- ============================================================

DROP POLICY IF EXISTS "Blog comments are viewable by everyone" ON blog_comments;
CREATE POLICY "Blog comments are viewable by everyone"
  ON blog_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON blog_comments;
CREATE POLICY "Authenticated users can create comments"
  ON blog_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON blog_comments;
CREATE POLICY "Users can update own comments"
  ON blog_comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON blog_comments;
CREATE POLICY "Users can delete own comments"
  ON blog_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: notifications
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- WITH CHECK (true) let any session push notifications to any user_id;
-- the application writes notifications through the service role.
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- notification_preferences (per-user opt-in/out flags)
-- ============================================================

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

-- ============================================================
-- RLS POLICIES: settings
-- ============================================================

-- Public by default, but never for key-shaped rows: a secret dropped into
-- this table (API key, token, SMTP password) must not become world-readable
-- just because the table is. Admins keep the blanket policy below.
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

DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: newsletter_subscribers
-- ============================================================

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can view subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can manage subscribers"
  ON newsletter_subscribers FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: contact_submissions
-- ============================================================

DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view contact submissions" ON contact_submissions;
CREATE POLICY "Admins can view contact submissions"
  ON contact_submissions FOR SELECT
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage contact submissions" ON contact_submissions;
CREATE POLICY "Admins can manage contact submissions"
  ON contact_submissions FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: social_links
-- ============================================================

DROP POLICY IF EXISTS "Active social links are viewable by everyone" ON social_links;
CREATE POLICY "Active social links are viewable by everyone"
  ON social_links FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all social links" ON social_links;
CREATE POLICY "Admins can view all social links"
  ON social_links FOR SELECT
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage social links" ON social_links;
CREATE POLICY "Admins can manage social links"
  ON social_links FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: search_history
-- ============================================================

DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own search history" ON search_history;
CREATE POLICY "Users can insert own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own search history" ON search_history;
CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all search history" ON search_history;
CREATE POLICY "Admins can view all search history"
  ON search_history FOR SELECT
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: seller_payouts
-- ============================================================

DROP POLICY IF EXISTS "Sellers can view own payouts" ON seller_payouts;
CREATE POLICY "Sellers can view own payouts"
  ON seller_payouts FOR SELECT
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can create own payouts" ON seller_payouts;
CREATE POLICY "Sellers can create own payouts"
  ON seller_payouts FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Admins can view all payouts" ON seller_payouts;
CREATE POLICY "Admins can view all payouts"
  ON seller_payouts FOR SELECT
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage all payouts" ON seller_payouts;
CREATE POLICY "Admins can manage all payouts"
  ON seller_payouts FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: translations
-- ============================================================

DROP POLICY IF EXISTS "Translations are viewable by everyone" ON translations;
CREATE POLICY "Translations are viewable by everyone"
  ON translations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage translations" ON translations;
CREATE POLICY "Admins can manage translations"
  ON translations FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: review_helpful
-- ============================================================

DROP POLICY IF EXISTS "Review helpful votes are viewable by everyone" ON review_helpful;
CREATE POLICY "Review helpful votes are viewable by everyone"
  ON review_helpful FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can toggle own helpful vote" ON review_helpful;
CREATE POLICY "Users can toggle own helpful vote"
  ON review_helpful FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own helpful vote" ON review_helpful;
CREATE POLICY "Users can remove own helpful vote"
  ON review_helpful FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: review_reports
-- ============================================================

DROP POLICY IF EXISTS "Users can create review reports" ON review_reports;
CREATE POLICY "Users can create review reports"
  ON review_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

DROP POLICY IF EXISTS "Users can view own review reports" ON review_reports;
CREATE POLICY "Users can view own review reports"
  ON review_reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

DROP POLICY IF EXISTS "Admins can manage review reports" ON review_reports;
CREATE POLICY "Admins can manage review reports"
  ON review_reports FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: refunds
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage refunds" ON refunds;
CREATE POLICY "Admins can manage refunds"
  ON refunds FOR ALL
  USING (
    public.is_admin()
  );

-- ============================================================
-- RLS POLICIES: admin_logs
-- ============================================================

DROP POLICY IF EXISTS "Admins can view admin logs" ON admin_logs;
CREATE POLICY "Admins can view admin logs"
  ON admin_logs FOR SELECT
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;
CREATE POLICY "Admins can insert admin logs"
  ON admin_logs FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_comments_updated_at ON blog_comments;
CREATE TRIGGER update_blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_links_updated_at ON social_links;
CREATE TRIGGER update_social_links_updated_at
  BEFORE UPDATE ON social_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seller_payouts_updated_at ON seller_payouts;
CREATE TRIGGER update_seller_payouts_updated_at
  BEFORE UPDATE ON seller_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_translations_updated_at ON translations;
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Role is always 'customer': signup metadata must never be able to mint
  -- an admin/seller (it previously could). Elevated roles are assigned
  -- after the fact through the service role (admin user creation, demo
  -- seeding), which bypasses this gate. See supabase/2028-security-hardening.sql.
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ORDER NUMBER GENERATION
-- ============================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val INTEGER;
  order_num TEXT;
BEGIN
  SELECT COALESCE(
    (SELECT MAX(
      CAST(SUBSTRING(order_number FROM 5) AS INTEGER)
    ) FROM orders),
    0
  ) + 1 INTO seq_val;

  order_num := 'EM-' || LPAD(seq_val::TEXT, 6, '0');
  NEW.order_number := order_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- RECALCULATE PRODUCT RATING ON REVIEW CHANGE
-- ============================================================

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE products
  SET
    rating = COALESCE(
      (SELECT ROUND(AVG(rating)::NUMERIC, 2)
       FROM reviews
       WHERE product_id = target_product_id AND status = 'approved'),
      0
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = target_product_id AND status = 'approved'
    )
  WHERE id = target_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ============================================================
-- CLEANUP CART/WISHLIST ON ORDER
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_cart_after_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    DELETE FROM cart_items
    WHERE user_id = NEW.user_id
    AND product_id IN (
      SELECT product_id FROM order_items WHERE order_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_confirmed ON orders;
CREATE TRIGGER on_order_confirmed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION cleanup_cart_after_order();

-- ============================================================
-- VIEWS (useful for dashboard queries)
-- ============================================================

CREATE OR REPLACE VIEW product_summary AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.price,
  p.discount_price,
  p.stock_quantity,
  p.status,
  p.rating,
  p.review_count,
  p.is_active,
  p.is_featured,
  p.is_new,
  p.images,
  p.created_at,
  c.name AS category_name,
  c.slug AS category_slug,
  b.name AS brand_name,
  v.name AS vendor_name,
  v.slug AS vendor_slug
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN vendors v ON p.vendor_id = v.id;

CREATE OR REPLACE VIEW order_summary AS
SELECT
  o.id,
  o.order_number,
  o.status,
  o.payment_status,
  o.payment_method,
  o.subtotal,
  o.shipping_cost,
  o.tax,
  o.discount,
  o.total,
  o.created_at,
  p.first_name || ' ' || p.last_name AS customer_name,
  p.email AS customer_email,
  p.phone AS customer_phone,
  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id;

CREATE OR REPLACE VIEW seller_dashboard AS
SELECT
  v.id AS vendor_id,
  v.name AS store_name,
  v.rating,
  v.total_sales,
  v.commission_rate,
  (SELECT COUNT(*) FROM products WHERE vendor_id = v.id AND is_active = true) AS active_products,
  (SELECT COUNT(*) FROM products WHERE vendor_id = v.id) AS total_products,
  (SELECT COALESCE(SUM(oi.total), 0)
   FROM order_items oi
   JOIN orders o ON oi.order_id = o.id
   WHERE oi.vendor_id = v.id AND o.status IN ('delivered', 'shipped')
  ) AS total_revenue,
  (SELECT COUNT(DISTINCT o.id)
   FROM order_items oi
   JOIN orders o ON oi.order_id = o.id
   WHERE oi.vendor_id = v.id AND o.status = 'pending'
  ) AS pending_orders
FROM vendors v;

-- ============================================================
-- ADDITIONAL COLUMNS (for Phase E API routes)
-- ============================================================

-- Track product page views (used by POST /api/v1/products/[slug]/views)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- User blocking (used by POST /api/v1/admin/users/[id]/block)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Vendor verification/suspension timestamps (used by seller verify/suspend routes)
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- ============================================================
-- SECURITY HARDENING (2028)
-- Mirrors supabase/2028-security-hardening.sql so a fresh install that only
-- runs this file still gets the column lockdown, guard triggers and
-- constraints. The migration file stays the source of truth for existing
-- projects; both are idempotent.
-- ============================================================

-- --- profiles: column-level SELECT lockdown (PII) -------------------------
-- Requires is_blocked, added above. Row visibility is still governed by the
-- profiles RLS policies; these grants narrow each role's visible columns.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, first_name, last_name, profile_image_url, created_at
) ON public.profiles TO anon;

GRANT SELECT (
  id, first_name, last_name, profile_image_url, role,
  is_email_verified, is_blocked, created_at, updated_at
) ON public.profiles TO authenticated;

-- --- unused views expose customer PII; API roles must not read them ------
REVOKE ALL ON public.product_summary, public.order_summary, public.seller_dashboard
  FROM anon, authenticated;

-- --- profiles: privilege-escalation guards --------------------------------
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

-- --- vendors: no self-approval --------------------------------------------
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

-- --- reviews: moderation + counters are server-authoritative --------------
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

-- --- coupons: value constraints + creator/used_count protection -----------
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

-- --- orders: server-authoritative money + role-scoped transitions ---------
CREATE OR REPLACE FUNCTION public.orders_guard_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub     numeric;
  v_tax     numeric;
  v_ship    numeric;
  v_disc    numeric := 0;
  v_coupon  public.coupons%ROWTYPE;
  v_code    text;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  NEW.user_id := auth.uid();
  NEW.created_at := NOW();
  NEW.status := 'pending';
  NEW.payment_status := 'pending';

  v_sub := GREATEST(0, COALESCE(NEW.subtotal, 0));
  -- Mirrors checkout (app/api/v1/orders/route.ts); keep constants in step.
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
    ELSE
      v_disc := 0;
      v_ship := 0;
    END IF;

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

  NEW.id := OLD.id;
  NEW.user_id := OLD.user_id;
  NEW.order_number := OLD.order_number;
  NEW.created_at := OLD.created_at;

  -- Only after the identity clamp above, so a user_id swap cannot masquerade
  -- as the owner below.
  v_is_owner := (NEW.user_id = auth.uid());

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    IF v_is_owner AND NEW.payment_status IN ('processing', 'failed')
       AND OLD.payment_status IN ('pending', 'processing') THEN
      NULL;
    ELSE
      NEW.payment_status := OLD.payment_status;
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('cancelled', 'returned', 'refunded') THEN
      NEW.status := OLD.status;
    ELSIF v_is_owner THEN
      IF NOT (
           (NEW.status = 'processing'    AND OLD.status IN ('pending', 'confirmed'))
        OR (NEW.status = 'cancelled'     AND OLD.status IN ('pending', 'confirmed', 'processing'))
        OR (NEW.status = 'returned'      AND OLD.status IN ('shipped', 'out_for_delivery', 'delivered'))
      ) THEN
        NEW.status := OLD.status;
      END IF;
    ELSIF public.user_can_view_order(NEW.id) THEN
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

-- --- order_items: price/stock/vendor authority + parent recompute ---------
CREATE OR REPLACE FUNCTION public.order_item_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner     uuid;
  v_status    public.order_status;
  v_price     numeric;
  v_sale      numeric;
  v_stock     integer;
  v_vendor    uuid;
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

-- --- seller_payouts: positive amount, forced pending ----------------------
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
