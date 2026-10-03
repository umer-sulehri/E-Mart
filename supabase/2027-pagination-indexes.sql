-- ============================================================================
-- E-Mart Pagination Index Migration (2027)
--
-- Every list route now pages with a stable `ORDER BY ... , id` and a
-- `count: 'exact'` alongside it. That is correct but not free: without a
-- matching index Postgres has to sort the whole filtered set before it can
-- skip to row 500, and `count: 'exact'` re-scans it again. On the admin tables
-- this is the difference between a fast page change and a timeout.
--
-- The indexes below mirror the exact WHERE + ORDER BY of each route. A partial
-- index is preferred over a composite one wherever the route always filters on
-- a constant (`is_active`, `status = 'published'`), because it stays small as
-- the table grows.
--
-- Safe to re-run: every statement is `IF NOT EXISTS`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Wishlist (public + dashboard share these columns)
-- GET /api/v1/wishlist       WHERE user_id = ? ORDER BY created_at DESC, id DESC
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_created
  ON wishlist_items(user_id, created_at DESC, id DESC);

-- The `?productId=` membership probe and the POST duplicate check both hit this
-- pair. The wishlist itself is unique per (user_id, product_id), but older rows
-- predate that constraint, so a plain index is used rather than a unique one.
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_product
  ON wishlist_items(user_id, product_id);

-- ----------------------------------------------------------------------------
-- Reviews
-- GET /api/v1/reviews                    ORDER BY created_at DESC [, rating, helpful_count]
-- GET /api/v1/products/[slug]/reviews    WHERE product_id = ? ORDER BY <sort>
-- GET /api/v1/admin/reviews               WHERE status = ? ORDER BY created_at DESC
-- GET /api/v1/auth/reviews                WHERE user_id = ? ORDER BY <sort>
-- ----------------------------------------------------------------------------
-- Public list with an optional rating filter. Kept as a plain composite so the
-- planner can also use it when `rating` is absent.
CREATE INDEX IF NOT EXISTS idx_reviews_created_id
  ON reviews(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_rating_created
  ON reviews(rating, created_at DESC, id DESC);

-- Already present as idx_reviews_product_status_created from the 2026 migration
-- for the status moderation ordering; this covers the default public sort on a
-- single product, which is what the product page's review tab pages through.
CREATE INDEX IF NOT EXISTS idx_reviews_product_created
  ON reviews(product_id, created_at DESC, id DESC);

-- "My reviews" on the dashboard, ordered by whichever sort the user picked.
CREATE INDEX IF NOT EXISTS idx_reviews_user_created
  ON reviews(user_id, created_at DESC, id DESC);

-- ----------------------------------------------------------------------------
-- Blog
-- GET /api/v1/blog-posts               WHERE status = 'published' ORDER BY published_at DESC
-- GET /api/v1/blog-posts               (admin) ORDER BY created_at DESC
-- GET /api/v1/blog-posts/[id]/comments WHERE post_id = ? ORDER BY created_at DESC, id DESC
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published
  ON blog_posts(published_at DESC, id DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_blog_posts_created
  ON blog_posts(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_created
  ON blog_comments(post_id, created_at DESC, id DESC);

-- ----------------------------------------------------------------------------
-- Catalogue
-- GET /api/v1/categories              WHERE is_active ORDER BY display_order
-- GET /api/v1/admin/categories        WHERE parent_id IS NULL ORDER BY display_order, id
-- GET /api/v1/admin/brands            ORDER BY name, id
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_categories_active_display
  ON categories(display_order, id)
  WHERE is_active;

-- `parent_id IS NULL` as a partial predicate keeps the top-level browse index
-- from being padded by the (much larger) set of subcategory rows.
CREATE INDEX IF NOT EXISTS idx_categories_roots_display
  ON categories(display_order, id)
  WHERE parent_id IS NULL;

-- The admin table orders by name with `id` as the tiebreaker, because `name` is
-- not unique and a shared name would otherwise straddle a page boundary.
CREATE INDEX IF NOT EXISTS idx_brands_name_id
  ON brands(name, id);

-- Subcategory fetch for the admin category page: `WHERE parent_id = ANY(...)`.
CREATE INDEX IF NOT EXISTS idx_categories_parent
  ON categories(parent_id, display_order, id);

-- GET /api/v1/products already has idx_products_category_active; these cover the
-- sort columns that page's `?sort=` switch chooses between, on a partial index
-- so inactive products never enter the structure.
--
-- These rely on `products.is_active`, which is present in the deployed schema
-- (the 2026 migration and `schema.sql`'s own idx_products_is_active both
-- reference it) but is missing from the `CREATE TABLE` in `schema.sql` — that
-- file is stale on this column, not the database.
CREATE INDEX IF NOT EXISTS idx_products_active_price
  ON products(price, id)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_products_active_rating
  ON products(rating DESC, review_count DESC, id DESC)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON products(created_at DESC, id DESC)
  WHERE is_active;

-- `?sort=name`, which is a text collation sort and therefore not covered by any
-- of the above.
CREATE INDEX IF NOT EXISTS idx_products_active_name
  ON products(name)
  WHERE is_active;

-- ---------------------------------------------------------------------------
-- Sellers
-- GET /api/v1/sellers          WHERE status = 'approved' ORDER BY total_sales DESC, id DESC
-- GET /api/v1/sellers/[slug]   ORDER BY created_at DESC
-- GET /api/v1/admin/sellers    ORDER BY created_at DESC [WHERE status = ?]
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vendors_approved_sales
  ON vendors(total_sales DESC, id DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_vendors_created
  ON vendors(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_vendors_status_created
  ON vendors(status, created_at DESC, id DESC);

-- ---------------------------------------------------------------------------
-- Coupons
-- GET /api/v1/seller/coupons    WHERE created_by = ? ORDER BY created_at DESC
-- GET /api/v1/admin/coupons     ORDER BY created_at DESC
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_coupons_created_by_created
  ON coupons(created_by, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_coupons_created
  ON coupons(created_at DESC, id DESC);

-- ---------------------------------------------------------------------------
-- Payouts
-- GET /api/v1/seller/payout    WHERE seller_id = ? ORDER BY created_at DESC
-- GET /api/v1/admin/payouts    WHERE status = ? ORDER BY created_at DESC
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_created
  ON seller_payouts(seller_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_seller_payouts_status_created
  ON seller_payouts(status, created_at DESC, id DESC);

-- ---------------------------------------------------------------------------
-- Addresses (dashboard address book)
-- WHERE user_id = ? ORDER BY is_default DESC, created_at DESC, id DESC
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_addresses_user_default
  ON addresses(user_id, is_default DESC, created_at DESC, id DESC);

-- ---------------------------------------------------------------------------
-- Admin: audit log, contact inbox, consent audit
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_admin_logs_created
  ON admin_logs(created_at DESC, id DESC);

-- The inbox is tabbed open/resolved, so `is_resolved` leads the index.
CREATE INDEX IF NOT EXISTS idx_contact_submissions_resolved_created
  ON contact_submissions(is_resolved, created_at DESC, id DESC);

-- consent_audit already has idx_consent_audit_created_at from the 2027 privacy
-- migration; this adds the `id` tiebreaker so a same-second pair of writes
-- cannot straddle a page boundary.
CREATE INDEX IF NOT EXISTS idx_consent_audit_created_id
  ON consent_audit(created_at DESC, id DESC);

-- ---------------------------------------------------------------------------
-- Analysis hint: keep planner statistics fresh after the bulk index build.
-- Without this the planner can keep choosing a sequential scan for a while.
-- ---------------------------------------------------------------------------
ANALYZE wishlist_items;
ANALYZE reviews;
ANALYZE blog_posts;
ANALYZE blog_comments;
ANALYZE categories;
ANALYZE brands;
ANALYZE products;
ANALYZE vendors;
ANALYZE coupons;
ANALYZE seller_payouts;
ANALYZE addresses;
ANALYZE admin_logs;
ANALYZE contact_submissions;
ANALYZE consent_audit;