-- ============================================================================
-- E-Mart User CRUD Fixes (2027)
-- ----------------------------------------------------------------------------
-- APPLY THIS FILE IN THE SUPABASE SQL EDITOR (or via Supabase CLI).
--
-- Context: Admin "Users Management" could not delete a user, and admin
-- block/unblock/role updates silently failed. Fixes here make the data layer
-- match the (now service-role backed) API:
--
--   1. coupons.created_by -> profiles(id) ON DELETE SET NULL
--      Deleting an auth user cascades to profiles, which cascades to most
--      user-owned rows -- BUT `coupons.created_by` pointed at profiles(id)
--      with the default NO ACTION, so deleting a user who ever created a
--      coupon failed with a foreign-key violation. Null the reference out.
--
--   2. profiles admin UPDATE + DELETE policies
--      profiles only had "Users can update own profile" (auth.uid() = id), so
--      admin mutations were blocked by RLS. These policies use a SECURITY
--      DEFINER is_admin() helper to avoid the infinite-recursion error that
--      occurs when a policy on a table subqueries that same table.
--
-- The API routes also use the service-role client for admin user mutations
-- (defense in depth), so they work whether or not this file is applied; the
-- coupons FK fix below is REQUIRED for deletion to succeed in any case.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADMIN HELPER (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
-- Bypasses RLS for the inner lookup to prevent "infinite recursion detected
-- in policy for relation profiles".
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
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

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;

-- ============================================================================
-- 2. coupons.created_by FK -> ON DELETE SET NULL
-- ============================================================================

DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_class ref ON ref.oid = con.confrelid
  WHERE rel.relname = 'coupons'
    AND ref.relname = 'profiles'
    AND con.contype = 'f';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.coupons DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.coupons
  ADD CONSTRAINT coupons_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- ============================================================================
-- 3. PROFILES ADMIN POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (public.is_admin());

COMMIT;