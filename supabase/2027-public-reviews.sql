-- 2027-03: Public reviews
-- Reviews are public for everyone (guest, buyer, seller, admin). New reviews
-- are still stored as 'pending' for moderation, but they are immediately
-- visible; only explicitly 'rejected' reviews stay hidden from the public.
-- The product rating/count trigger is updated to match what shoppers see.

BEGIN;

-- 1) Public read policy: approved + pending are visible to everyone.
DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (status IN ('approved', 'pending') OR auth.uid() = user_id);

-- 2) Product rating/count should reflect the publicly visible reviews.
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
       WHERE product_id = target_product_id AND status IN ('approved', 'pending')),
      0
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = target_product_id AND status IN ('approved', 'pending')
    )
  WHERE id = target_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
