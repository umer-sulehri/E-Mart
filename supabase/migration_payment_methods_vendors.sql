-- ============================================================================
-- Migration: Add payment methods and vendors status timestamps
-- ----------------------------------------------------------------------------
-- Applies the incremental changes introduced for the buyer checkout + admin
-- seller-management fixes to an ALREADY-DEPLOYED database.
--
-- These changes are already part of supabase/schema.sql for fresh installs, so
-- this file is ONLY needed if your database was created before those fixes.
--
-- IMPORTANT: ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
-- This whole script must be executed as a single script in the Supabase SQL
-- editor with autocommit (paste all and run), NOT wrapped in BEGIN/COMMIT.
-- Runs are idempotent.
--
-- Requires PostgreSQL >= 12 (standard for Supabase projects).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Extend the payment_method enum with cod / easypaisa / jazzcash / card
-- ----------------------------------------------------------------------------

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'cod';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'easypaisa';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'jazzcash';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'card';

-- ----------------------------------------------------------------------------
-- 2) Add missing vendors status timestamp columns used by the admin
--    verify / suspend / reject routes.
-- ----------------------------------------------------------------------------

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
