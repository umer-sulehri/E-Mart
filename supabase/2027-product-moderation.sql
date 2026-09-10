-- ============================================================================
-- E-Mart Product Moderation Fix (2027)
-- ----------------------------------------------------------------------------
-- APPLY THIS FILE IN THE SUPABASE SQL EDITOR (or via Supabase CLI).
--
-- The admin moderation UI (badges, flagged-count banner, approve/flag/remove
-- buttons) is driven by products.moderation_status, but the column never
-- existed in the database -- it only lived in the TS type. Approve/flag/remove
-- still flipped status/is_active, so the core actions worked, but the
-- moderation state itself was never persisted: a product you flagged was never
-- marked "flagged", and the flag/removal badges could never render.
--
-- This migration adds the missing column (also declared in schema.sql for
-- fresh installs). The admin moderation routes now persist it.
-- ============================================================================

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'
  CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'removed'));

COMMIT;