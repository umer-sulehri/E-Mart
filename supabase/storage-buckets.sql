-- ============================================================================
-- E-Mart Storage Bucket Creation + RLS Policies (2026)
-- ----------------------------------------------------------------------------
-- Create the storage buckets used by the app. Without these buckets, "Bucket
-- not found" errors occur on upload.
--
-- Buckets referenced by the codebase:
--   products       -> product images (components/seller/ProductForm.tsx)
--   blog           -> blog post images
--   vendor-assets  -> seller profile/store images
--   avatars        -> user profile pictures
--   uploads        -> generic fallback uploads (app/api/v1/uploads/route.ts)
--
-- WHY THIS VERSION: In Supabase the storage.* tables are owned by the
-- `supabase_storage_admin` role, NOT `postgres`. So directly INSERTing into
-- storage.buckets (`ON CONFLICT`) and issuing ALTER/CREATE POLICY on
-- storage.objects fails with "42501: must be owner of table objects".
--   * Buckets: created via storage.create_bucket() (callable as postgres).
--   * RLS policies: run under SET ROLE supabase_storage_admin (postgres is a
--     superuser, so it may SET ROLE to that role). RESET ROLE afterwards.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Create public buckets idempotently via the create_bucket() function.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  b RECORD;
BEGIN
  FOR b IN VALUES
    ('products',      5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('blog',          10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('vendor-assets', 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
    ('avatars',       3145728,  ARRAY['image/jpeg','image/png','image/webp']),
    ('uploads',       10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
  LOOP
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = b.column1) THEN
      PERFORM storage.create_bucket(
        b.column1,
        b.column1,
        jsonb_build_object(
          'public', TRUE,
          'file_size_limit', b.column2,
          'allowed_mime_types', b.column3
        )
      );
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. storage.objects RLS policies (run as storage admin).
-- ----------------------------------------------------------------------------
SET ROLE supabase_storage_admin;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload objects into our buckets
DROP POLICY IF EXISTS "Allow authenticated uploads to app buckets" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to app buckets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND bucket_id IN ('products','blog','vendor-assets','avatars','uploads')
  );

-- Allow public read of objects in our buckets
DROP POLICY IF EXISTS "Allow public read from app buckets" ON storage.objects;
CREATE POLICY "Allow public read from app buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('products','blog','vendor-assets','avatars','uploads'));

-- Allow object owners to update/delete their own uploads
DROP POLICY IF EXISTS "Allow owner update in app buckets" ON storage.objects;
CREATE POLICY "Allow owner update in app buckets"
  ON storage.objects FOR UPDATE
  USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Allow owner delete in app buckets" ON storage.objects;
CREATE POLICY "Allow owner delete in app buckets"
  ON storage.objects FOR DELETE
  USING (auth.uid() = owner);

RESET ROLE;

COMMIT;
