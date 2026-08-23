-- Seller order tracking numbers + seller replies to product reviews.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS seller_reply text;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS replied_at timestamptz;
