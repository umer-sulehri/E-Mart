-- 2027-remove-notifications.sql
-- Notifications feature removed from the buyer dashboard (Issue #12).
--   - Buyer dashboard sidebar link removed
--   - /dashboard/notifications page removed
--   - /api/v1/notifications/* routes removed
--   - components/ui/NotificationBell.tsx removed (orphaned)
--
-- The `notifications` table is intentionally KEPT as an audit trail for any
-- historical rows. `notification_preferences` has no remaining consumers and
-- is dropped.
--
-- This migration is reversible: restore by re-creating notification_preferences
-- and (optionally) restoring the archived table created below.

-- 1. Archive old notification rows (optional safety net; keeps audit data).
CREATE TABLE IF NOT EXISTS notifications_archived_2027 AS TABLE notifications WITH NO DATA;
INSERT INTO notifications_archived_2027
  SELECT * FROM notifications WHERE created_at < (now() - interval '1 year');
DELETE FROM notifications WHERE created_at < (now() - interval '1 year');

-- 2. Drop notification preferences (no remaining consumers).
DROP TABLE IF EXISTS notification_preferences CASCADE;