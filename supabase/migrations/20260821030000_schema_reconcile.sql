-- ============================================================================
-- Schema reconcile: make the database match what the application code reads.
-- Run once in Supabase Dashboard > SQL Editor (after 20260821010000).
-- Idempotent: safe to run multiple times.
--
-- Folds supabase/sync-app-schema.sql into the migration history and adds
-- columns the repositories expect but no migration provided:
--   - profiles.is_blocked        (admin block/unblock, login checks)
--   - products.tags / seller_id  (search filter, seller ownership)
--   - product_images.image_url   (code expects image_url, init had url)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PROFILES: is_blocked flag
-- (profiles.status stays for backwards compatibility; code uses is_blocked)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_blocked = true
WHERE status = 'blocked';

-- ---------------------------------------------------------------------------
-- PRODUCTS: search tags + seller ownership
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products (seller_id);

-- ---------------------------------------------------------------------------
-- PRODUCT IMAGES: url -> image_url (app-wide column name)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_images'
      AND column_name = 'url'
  ) THEN
    ALTER TABLE public.product_images RENAME COLUMN url TO image_url;
  END IF;
END $$;

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_blocked';

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products' AND column_name IN ('tags', 'seller_id');

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'product_images' AND column_name = 'image_url';
