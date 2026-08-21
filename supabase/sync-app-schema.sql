-- ============================================================================
-- Sync live schema with application code expectations.
-- Run once in Supabase Dashboard > SQL Editor.
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- products.tags: array of search tags used by filters (tags.cs.{term})
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[];

-- products.seller_id: optional owner reference used by seller endpoints
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- product_images: app code reads/writes image_url (was url in initial migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_images' AND column_name = 'url'
  ) THEN
    ALTER TABLE public.product_images RENAME COLUMN url TO image_url;
  END IF;
END $$;

-- GIN index for tag containment queries
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products (seller_id);

-- ============================================================================
-- FIX: "infinite recursion detected in policy" on profiles.
-- The admin policy queried profiles from within its own policy. Replace it
-- with a SECURITY DEFINER helper that bypasses RLS internally.
-- ============================================================================
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

DROP POLICY IF EXISTS "Profiles: admin full access" ON public.profiles;
CREATE POLICY "Profiles: admin full access"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
