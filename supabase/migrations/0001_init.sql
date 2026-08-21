-- ============================================================================
-- E-Mart Supabase Backend - Initial Migration
-- ============================================================================

-- ============================================================================
-- PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  role TEXT CHECK (role IN ('buyer', 'admin', 'seller')) DEFAULT 'buyer',
  status TEXT DEFAULT 'active',
  language_preference TEXT DEFAULT 'en',
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CUSTOMER ADDRESSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  province TEXT,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_urdu TEXT,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  image TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  path TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PRODUCTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_urdu TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_urdu TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  stock INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PRODUCT VARIANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT,
  sku TEXT,
  price NUMERIC,
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- PRODUCT IMAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false
);

-- ============================================================================
-- PRODUCT ATTRIBUTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL
);

-- ============================================================================
-- CARTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CART ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ORDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status TEXT CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')) DEFAULT 'pending',
  total NUMERIC NOT NULL DEFAULT 0,
  address TEXT,
  payment_method TEXT,
  estimated_delivery DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ORDER ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT,
  product_image TEXT,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- WISHLISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ============================================================================
-- PRODUCT REVIEWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TRANSLATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  en TEXT,
  ur TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SOCIAL LINKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  label TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);

-- ============================================================================
-- TRIGGER: Auto-create profile on auth.users INSERT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, email, name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'email', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER set_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER set_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER set_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER set_social_links_updated_at
  BEFORE UPDATE ON social_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- FUNCTION: create_order_from_cart
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id UUID,
  p_address TEXT,
  p_payment_method TEXT
)
RETURNS UUID AS $$
DECLARE
  v_cart_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_total NUMERIC := 0;
  v_cart_item RECORD;
BEGIN
  -- Get user's cart
  SELECT id INTO v_cart_id
  FROM public.carts
  WHERE user_id = p_user_id;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'No cart found for user %', p_user_id;
  END IF;

  -- Generate unique order number
  v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  -- Create order
  INSERT INTO public.orders (id, order_number, user_id, status, total, address, payment_method)
  VALUES (gen_random_uuid(), v_order_number, p_user_id, 'pending', 0, p_address, p_payment_method)
  RETURNING id INTO v_order_id;

  -- Copy cart items into order items and calculate total
  FOR v_cart_item IN
    SELECT
      ci.product_id,
      ci.quantity,
      p.name AS product_name,
      p.price AS price,
      COALESCE(
        (SELECT url FROM public.product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
        (SELECT url FROM public.product_images WHERE product_id = p.id LIMIT 1),
        p.description
      ) AS product_image
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart_id
  LOOP
    INSERT INTO public.order_items (id, order_id, product_id, product_name, product_image, price, quantity)
    VALUES (
      gen_random_uuid(),
      v_order_id,
      v_cart_item.product_id,
      v_cart_item.product_name,
      v_cart_item.product_image,
      v_cart_item.price,
      v_cart_item.quantity
    );

    v_total := v_total + (v_cart_item.price * v_cart_item.quantity);

    -- Decrease stock
    UPDATE public.products
    SET stock = stock - v_cart_item.quantity
    WHERE id = v_cart_item.product_id;
  END LOOP;

  -- Update order total
  UPDATE public.orders
  SET total = v_total
  WHERE id = v_order_id;

  -- Clear the cart
  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
  UPDATE public.carts SET updated_at = now() WHERE id = v_cart_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Profiles: owner can select own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Profiles: owner can update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Profiles: admin full access"
  ON profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Customer Addresses
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addresses: owner select own"
  ON customer_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Addresses: owner insert own"
  ON customer_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Addresses: owner update own"
  ON customer_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Addresses: owner delete own"
  ON customer_addresses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Addresses: admin read"
  ON customer_addresses FOR SELECT
  USING (public.is_admin());

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories: public read"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Categories: admin insert"
  ON categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Categories: admin update"
  ON categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Categories: admin delete"
  ON categories FOR DELETE
  USING (public.is_admin());

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products: public read"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Products: admin insert"
  ON products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Products: admin update"
  ON products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Products: admin delete"
  ON products FOR DELETE
  USING (public.is_admin());

-- Product Variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product variants: public read"
  ON product_variants FOR SELECT
  USING (true);

CREATE POLICY "Product variants: admin insert"
  ON product_variants FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Product variants: admin update"
  ON product_variants FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Product variants: admin delete"
  ON product_variants FOR DELETE
  USING (public.is_admin());

-- Product Images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images: public read"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Product images: admin insert"
  ON product_images FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Product images: admin update"
  ON product_images FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Product images: admin delete"
  ON product_images FOR DELETE
  USING (public.is_admin());

-- Product Attributes
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product attributes: public read"
  ON product_attributes FOR SELECT
  USING (true);

CREATE POLICY "Product attributes: admin insert"
  ON product_attributes FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Product attributes: admin update"
  ON product_attributes FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Product attributes: admin delete"
  ON product_attributes FOR DELETE
  USING (public.is_admin());

-- Carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carts: owner read"
  ON carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Carts: owner insert"
  ON carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Carts: owner update"
  ON carts FOR UPDATE
  USING (auth.uid() = user_id);

-- Cart Items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cart items: owner read"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Cart items: owner insert"
  ON cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Cart items: owner update"
  ON cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Cart items: owner delete"
  ON cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders: owner select"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Orders: admin full access"
  ON orders FOR ALL
  USING (public.is_admin());

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items: owner select"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Order items: admin full access"
  ON order_items FOR ALL
  USING (public.is_admin());

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments: owner select own"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Payments: admin full access"
  ON payments FOR ALL
  USING (public.is_admin());

-- Wishlists
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wishlists: owner select own"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Wishlists: owner insert own"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Wishlists: owner delete own"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Wishlists: admin read"
  ON wishlists FOR SELECT
  USING (public.is_admin());

-- Product Reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews: public read"
  ON product_reviews FOR SELECT
  USING (true);

CREATE POLICY "Reviews: owner insert own"
  ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reviews: owner update own"
  ON product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Reviews: owner delete own"
  ON product_reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Reviews: admin delete"
  ON product_reviews FOR DELETE
  USING (public.is_admin());

-- Translations
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Translations: public read"
  ON translations FOR SELECT
  USING (true);

CREATE POLICY "Translations: admin insert"
  ON translations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Translations: admin update"
  ON translations FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Translations: admin delete"
  ON translations FOR DELETE
  USING (public.is_admin());

-- Social Links
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social links: public read"
  ON social_links FOR SELECT
  USING (true);

CREATE POLICY "Social links: admin insert"
  ON social_links FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Social links: admin update"
  ON social_links FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Social links: admin delete"
  ON social_links FOR DELETE
  USING (public.is_admin());

-- Notification Preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notification prefs: owner select own"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Notification prefs: owner insert own"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Notification prefs: owner update own"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Notification prefs: owner delete own"
  ON notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Notification prefs: admin read"
  ON notification_preferences FOR SELECT
  USING (public.is_admin());
