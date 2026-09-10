-- ============================================================================
-- E-Mart Review Moderation + CRUD support (2026)
-- ----------------------------------------------------------------------------
-- . Adds 'rejected' to the reviews.status check constraint
-- . New review submissions default to 'pending' (admin-approved before public)
-- . Composite index for the buyer "My Reviews" dashboard queries
-- ============================================================================

BEGIN;

-- 1) Allow an explicit 'rejected' state so admins can deny a review while
--    preserving the row for the buyer's dashboard (cannot be edited again).
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'flagged'));

-- 2) Moderation-first: new reviews are queued until an admin approves them.
ALTER TABLE reviews ALTER COLUMN status SET DEFAULT 'pending';

-- 3) Serve the buyer dashboard (own reviews ordered by recency) and spot
--    pending-approval lists without a sequential scan.
CREATE INDEX IF NOT EXISTS idx_reviews_user_id_created_at
  ON reviews (user_id, created_at DESC);

-- 4) Buyers may edit their own reviews, but an edit must re-queue the review
--    for moderation. Status is stored as a CHECK'd column and RLS now forces
--    the new row to status = 'pending', so buyers can never self-approve.
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

COMMIT;