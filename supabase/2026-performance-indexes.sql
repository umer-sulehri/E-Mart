-- ============================================================================
-- E-Mart Performance Index Migration
-- Adds composite + full-text search indexes for production query performance.
-- Safe to re-run (all statements use IF NOT EXISTS).
-- ============================================================================

-- 1. Orders: user order history + status filters (dashboard, admin)
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at
  ON orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_id_status
  ON orders(user_id, status);

-- 2. Order items: order detail joins and vendor fulfillment lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_product
  ON order_items(order_id, product_id);

-- 3. Products: filtered category/brand listings with active flag
CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON products(category_id, is_active);

CREATE INDEX IF NOT EXISTS idx_products_category_active_rating
  ON products(category_id, is_active, rating DESC);

CREATE INDEX IF NOT EXISTS idx_products_brand_active
  ON products(brand_id, is_active);

-- 4. Full-text search on products (name + description + tags)
-- Adds tsvector column and GIN index for fast text search.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE products
  SET search_vector =
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C');

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING gin(search_vector);

-- Trigger to keep search_vector in sync on insert/update
DROP TRIGGER IF EXISTS trg_products_search_vector ON products;

CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, description, tags ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- 5. Reviews: product listing by status + moderation queue
CREATE INDEX IF NOT EXISTS idx_reviews_product_status_created
  ON reviews(product_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_status_created
  ON reviews(status, created_at DESC);

-- 6. Cart sync: prevent duplicate rows on user_id + product_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_user_product
  ON cart_items(user_id, product_id);

-- 7. Notifications: unread badge queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications(user_id, is_read, created_at DESC);

-- 8. Search history trending queries
CREATE INDEX IF NOT EXISTS idx_search_history_query_created
  ON search_history(query, created_at DESC);

-- ============================================================================
-- Analysis hint: keep planner stats fresh after bulk index changes
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE reviews;
ANALYZE cart_items;
ANALYZE notifications;
ANALYZE search_history;