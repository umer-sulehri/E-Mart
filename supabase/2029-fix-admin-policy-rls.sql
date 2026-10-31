-- ============================================================================
-- E-Mart Security Fix (2029)
-- ----------------------------------------------------------------------------
-- APPLY THIS FILE IN THE SUPABASE SQL EDITOR (or via the Supabase CLI).
-- Idempotent: safe to re-run.
--
-- 2028 revoked SELECT on public.profiles from anon/authenticated to protect
-- PII. Several older RLS policies still evaluated `profiles.role` inline,
-- which made every anonymous query against those tables fail with:
--
--   permission denied for table profiles
--
-- This migration rewrites every affected policy to use the SECURITY DEFINER
-- helper public.is_admin() instead. The helper already bypasses profiles RLS
-- and is granted to both anon and authenticated.
-- ============================================================================

BEGIN;

-- Rewrite each `EXISTS (...)` whose body checks profiles.role = 'admin'.
-- A balanced-parenthesis scanner is used instead of a regex because policies
-- can contain nested parentheses, casts such as `::user_role`, and an outer
-- wrapper like `(EXISTS (...))`.
CREATE OR REPLACE FUNCTION pg_temp.rewrite_admin_exists(expr text)
RETURNS text
LANGUAGE plpgsql
AS $fn$
DECLARE
  src text := expr;
  result text := '';
  exists_pos integer;
  open_pos integer;
  close_pos integer;
  depth integer;
  i integer;
  ch text;
  next_ch text;
  in_squote boolean := false;
  in_dquote boolean := false;
  sub text;
BEGIN
  IF src IS NULL THEN
    RETURN NULL;
  END IF;

  LOOP
    exists_pos := strpos(upper(src), 'EXISTS');
    IF exists_pos = 0 THEN
      result := result || src;
      EXIT;
    END IF;

    result := result || substr(src, 1, exists_pos - 1);

    open_pos := strpos(substr(src, exists_pos), '(');
    IF open_pos = 0 THEN
      result := result || substr(src, exists_pos);
      EXIT;
    END IF;
    open_pos := exists_pos + open_pos - 1;

    depth := 0;
    close_pos := 0;
    in_squote := false;
    in_dquote := false;
    i := open_pos;

    WHILE i <= length(src) LOOP
      ch := substr(src, i, 1);
      next_ch := substr(src, i + 1, 1);

      IF ch = '''' THEN
        IF in_squote AND next_ch = '''' THEN
          i := i + 2;
          CONTINUE;
        END IF;
        in_squote := NOT in_squote;
      ELSIF ch = '"' AND NOT in_squote THEN
        IF in_dquote AND next_ch = '"' THEN
          i := i + 2;
          CONTINUE;
        END IF;
        in_dquote := NOT in_dquote;
      ELSIF NOT in_squote AND NOT in_dquote THEN
        IF ch = '(' THEN
          depth := depth + 1;
        ELSIF ch = ')' THEN
          depth := depth - 1;
          IF depth = 0 THEN
            close_pos := i;
            EXIT;
          END IF;
        END IF;
      END IF;

      i := i + 1;
    END LOOP;

    IF close_pos = 0 THEN
      result := result || substr(src, exists_pos);
      EXIT;
    END IF;

    sub := substr(src, exists_pos, close_pos - exists_pos + 1);

    IF sub ~* '\mprofiles\M' AND sub ~* '\mrole\M\s*=\s*''admin''' THEN
      result := result || 'public.is_admin()';
    ELSE
      result := result || sub;
    END IF;

    src := substr(src, close_pos + 1);
  END LOOP;

  RETURN result;
END;
$fn$;

DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual ~* 'profiles.*role\s*=\s*''admin'''
        OR with_check ~* 'profiles.*role\s*=\s*''admin'''
      )
  LOOP
    IF p.qual IS NOT NULL THEN
      new_qual := pg_temp.rewrite_admin_exists(p.qual);
      IF new_qual IS DISTINCT FROM p.qual THEN
        EXECUTE format(
          'ALTER POLICY %I ON %I.%I USING (%s)',
          p.policyname, p.schemaname, p.tablename, new_qual
        );
      END IF;
    END IF;

    IF p.with_check IS NOT NULL THEN
      new_check := pg_temp.rewrite_admin_exists(p.with_check);
      IF new_check IS DISTINCT FROM p.with_check THEN
        EXECUTE format(
          'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
          p.policyname, p.schemaname, p.tablename, new_check
        );
      END IF;
    END IF;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS pg_temp.rewrite_admin_exists(text);

-- Fail loudly, with the exact policy and expression, if any inline admin
-- profile lookup survived. The transaction rolls back so the database is never
-- left half-migrated.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual ~* 'profiles.*role\s*=\s*''admin'''
        OR with_check ~* 'profiles.*role\s*=\s*''admin'''
      )
  LOOP
    RAISE EXCEPTION
      'Admin policy rewrite incomplete on %.% (%). USING=%, WITH CHECK=%',
      r.tablename, r.policyname, r.cmd, r.qual, r.with_check;
  END LOOP;
END $$;

COMMIT;
