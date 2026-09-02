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
-- `supabase_storage_admin` role, NOT `postgres`. Direct INSERT/ALTER/CREATE
-- POLICY from postgres fails with "42501: must be owner of table objects",
-- and the storage.create_bucket() helper is not present/exposed in every
-- project. postgres is a superuser, so it can SET ROLE to the storage admin
-- owner role and perform all storage DDL/inserts as that owner.
-- ============================================================================

BEGIN;

-- Run all storage operations as the table-owner role.
SET ROLE supabase_storage_admin;

-- ----------------------------------------------------------------------------
-- 1. Create public buckets (idempotent).
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products',       'products',       TRUE, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('blog',           'blog',           TRUE, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('vendor-assets',  'vendor-assets',  TRUE, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('avatars',        'avatars',        TRUE, 3145728, ARRAY['image/jpeg','image/png','image/webp']),
  ('uploads',        'uploads',        TRUE, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. storage.objects RLS policies.
-- ----------------------------------------------------------------------------
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
