-- ============================================================================
-- E-Mart Storage Buckets — SETUP GUIDE
-- ----------------------------------------------------------------------------
-- NOTE (2026): The storage.* tables in this project are owned by the
-- `supabase_storage_admin` role, and the SQL-editor role (`postgres`) does NOT
-- have permission to insert into storage.buckets, call storage.create_bucket(),
-- or SET ROLE to supabase_storage_admin. Attempting these from the SQL editor
-- fails with "42501: must be owner" / "permission denied to set role".
--
-- => Create the buckets through the Storage Dashboard UI instead (it uses the
--    service role internally). The app only needs the buckets to EXIST and be
--    PUBLIC. Steps + the RLS policy SQL you may paste into the Dashboard's
--    "Policies" editor for storage.objects are below.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1 — Create the buckets (Dashboard: Storage -> New Bucket)
-- ----------------------------------------------------------------------------
-- For EACH of the following, click "New bucket", name it, and set "Public
-- bucket" = ON:
--
--   products      5 MB   (image/jpeg, png, webp, gif)   <- product images
--   blog          10 MB  (image/jpeg, png, webp, gif)   <- blog images
--   vendor-assets 5 MB   (image/jpeg, png, webp, gif)   <- seller store images
--   avatars       3 MB   (image/jpeg, png, webp)        <- user avatars
--   uploads       10 MB  (image/jpeg, png, webp, gif, application/pdf)
--
-- (File-size/mime limits are optional; leave defaults if preferred.)

-- ----------------------------------------------------------------------------
-- STEP 2 — Add storage.objects policies (Dashboard: Storage -> Policies)
-- ----------------------------------------------------------------------------
-- Public buckets already allow anonymous reads. To let signed-in users upload,
-- add an INSERT policy on storage.objects. In the Dashboard, open "Storage" ->
-- "Policies", then run these (the Dashboard policy editor uses a privileged
-- role, so it can create policies here even though the SQL editor cannot):
--
-- SELECT (for public read — usually already provided by making the bucket public):
CREATE POLICY "Allow public read from app buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('products','blog','vendor-assets','avatars','uploads'));

-- INSERT (authenticated uploads):
CREATE POLICY "Allow authenticated uploads to app buckets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND bucket_id IN ('products','blog','vendor-assets','avatars','uploads')
  );

-- UPDATE / DELETE (owners manage their own objects):
CREATE POLICY "Allow owner update in app buckets"
  ON storage.objects FOR UPDATE
  USING (auth.uid() = owner);

CREATE POLICY "Allow owner delete in app buckets"
  ON storage.objects FOR DELETE
  USING (auth.uid() = owner);

-- ----------------------------------------------------------------------------
-- ONE-LINE VERIFICATION (SQL editor, read-only — safe to run):
--   SELECT id, public FROM storage.buckets ORDER BY id;
-- Expect all five buckets listed with public = true.
-- ============================================================================
