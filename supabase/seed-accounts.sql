-- ============================================================================
-- E-Mart Seed Accounts (Direct DB Insert — GoTrue-independent)
-- ----------------------------------------------------------------------------
-- USE THIS IN THE SUPABASE SQL EDITOR when the Auth Admin API fails
-- ("Database error creating/finding users"). It inserts straight into the
-- auth + public tables as the postgres role, which ALWAYS works.
--
-- Creates 16 role-based test accounts:
--   3 admin, 5 seller (incl. 1 pending), 8 customer
--
-- ✱ SAFETY: These are DUMMY dev credentials. Do NOT run in a prod database.
--   Idempotent (safe to re-run): skips existing emails.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. AUTH USERS (auth.users)
--    Passwords hashed the same way GoTrue does (bcrypt cost 10).
--    email_confirmed_at set => accounts are email-verified.
-- ============================================================================
WITH new_users (id, email, password, first_name, last_name, role) AS (
  VALUES
    ('a0000001-0000-0000-0000-000000000001', 'admin.super@emart.com',    'SuperAdmin@E2025#',  'Ahmed',  'Malik',            'admin'),
    ('a0000001-0000-0000-0000-000000000002', 'admin.content@emart.com',  'ContentAdmin@E2025#','Fatima', 'Khan',             'admin'),
    ('a0000001-0000-0000-0000-000000000003', 'admin.ops@emart.com',      'OpsAdmin@E2025#',    'Hassan', 'Raza',             'admin'),
    ('a0000001-0000-0000-0000-000000000004', 'seller.organic@emart.com', 'SellerOrganic@2025#', 'Ayesha', 'Organic Farms',    'seller'),
    ('a0000001-0000-0000-0000-000000000005', 'seller.snacks@emart.com',  'SellerSnacks@2025#', 'Muhammad', 'Imran Trading',  'seller'),
    ('a0000001-0000-0000-0000-000000000006', 'seller.household@emart.com','SellerHouse@2025#', 'Clean',  'Solutions Pakistan', 'seller'),
    ('a0000001-0000-0000-0000-000000000007', 'seller.electronics@emart.com','SellerElectro@2025#','TechHub','Pakistan Ltd',   'seller'),
    ('a0000001-0000-0000-0000-000000000008', 'seller.new@emart.com',     'SellerNew@2025#',    'Nida',   'Artisan Crafts',   'seller'),
    ('a0000001-0000-0000-0000-000000000009', 'buyer.health@emart.com',   'BuyerHealth@2025#',  'Sara',   'Ahmed',            'customer'),
    ('a0000001-0000-0000-0000-000000000010', 'buyer.family@emart.com',   'BuyerFamily@2025#',  'Rabia',  'Fatima',           'customer'),
    ('a0000001-0000-0000-0000-000000000011', 'buyer.tech@emart.com',     'BuyerTech@2025#',    'Ali',    'Hassan Khan',      'customer'),
    ('a0000001-0000-0000-0000-000000000012', 'buyer.occasional@emart.com','BuyerOccas@2025#',  'Zara',   'Malik',            'customer'),
    ('a0000001-0000-0000-0000-000000000013', 'buyer.bulk@emart.com',     'BuyerBulk@2025#',    'Usman',  'Traders',          'customer'),
    ('a0000001-0000-0000-0000-000000000014', 'buyer.vip@emart.com',      'BuyerVIP@2025#',     'Bilal',  'Siddiqui',         'customer'),
    ('a0000001-0000-0000-0000-000000000015', 'buyer.lapsed@emart.com',   'BuyerLapsed@2025#',  'Nida',   'Khan',             'customer'),
    ('a0000001-0000-0000-0000-000000000016', 'buyer.guest@emart.com',    'BuyerGuest@2025#',   'Tariq',  'Hassan',           'customer')
)
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
   email_change, phone_change_token, phone_change, reauthentication_token, email_change_confirm_status)
SELECT
  '00000000-0000-0000-0000-000000000000',
  nu.id::uuid, 'authenticated', 'authenticated', nu.email,
  crypt(nu.password, gen_salt('bf', 10)),
  now(), now(),
  jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', nu.role),
  jsonb_build_object('first_name', nu.first_name, 'last_name', nu.last_name, 'role', nu.role),
  now(), now(),
  '', '', '', '', '', '', '', '', 0
FROM new_users nu
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = nu.email);

-- ============================================================================
-- 2. AUTH IDENTITIES (auth.identities)
--    Required so signInWithPassword works (GoTrue matches providers by this).
-- ============================================================================
WITH new_users (id, email) AS (
  VALUES
    ('a0000001-0000-0000-0000-000000000001', 'admin.super@emart.com'),
    ('a0000001-0000-0000-0000-000000000002', 'admin.content@emart.com'),
    ('a0000001-0000-0000-0000-000000000003', 'admin.ops@emart.com'),
    ('a0000001-0000-0000-0000-000000000004', 'seller.organic@emart.com'),
    ('a0000001-0000-0000-0000-000000000005', 'seller.snacks@emart.com'),
    ('a0000001-0000-0000-0000-000000000006', 'seller.household@emart.com'),
    ('a0000001-0000-0000-0000-000000000007', 'seller.electronics@emart.com'),
    ('a0000001-0000-0000-0000-000000000008', 'seller.new@emart.com'),
    ('a0000001-0000-0000-0000-000000000009', 'buyer.health@emart.com'),
    ('a0000001-0000-0000-0000-000000000010', 'buyer.family@emart.com'),
    ('a0000001-0000-0000-0000-000000000011', 'buyer.tech@emart.com'),
    ('a0000001-0000-0000-0000-000000000012', 'buyer.occasional@emart.com'),
    ('a0000001-0000-0000-0000-000000000013', 'buyer.bulk@emart.com'),
    ('a0000001-0000-0000-0000-000000000014', 'buyer.vip@emart.com'),
    ('a0000001-0000-0000-0000-000000000015', 'buyer.lapsed@emart.com'),
    ('a0000001-0000-0000-0000-000000000016', 'buyer.guest@emart.com')
)
INSERT INTO auth.identities
  (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT nu.email, nu.id::uuid,
       jsonb_build_object('sub', nu.id, 'email', nu.email),
       'email', now(), now(), now()
FROM new_users nu
WHERE NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.provider_id = nu.email);

-- ============================================================================
-- 3. PUBLIC PROFILES (public.profiles)
--    role uses the user_role enum: 'customer' | 'admin' | 'seller'
-- ============================================================================
WITH new_profiles (id, email, first_name, last_name, role) AS (
  VALUES
    ('a0000001-0000-0000-0000-000000000001', 'admin.super@emart.com',    'Ahmed',  'Malik',            'admin'),
    ('a0000001-0000-0000-0000-000000000002', 'admin.content@emart.com',  'Fatima', 'Khan',             'admin'),
    ('a0000001-0000-0000-0000-000000000003', 'admin.ops@emart.com',      'Hassan', 'Raza',             'admin'),
    ('a0000001-0000-0000-0000-000000000004', 'seller.organic@emart.com', 'Ayesha', 'Organic Farms',    'seller'),
    ('a0000001-0000-0000-0000-000000000005', 'seller.snacks@emart.com',  'Muhammad', 'Imran Trading',  'seller'),
    ('a0000001-0000-0000-0000-000000000006', 'seller.household@emart.com','Clean',  'Solutions Pakistan', 'seller'),
    ('a0000001-0000-0000-0000-000000000007', 'seller.electronics@emart.com','TechHub','Pakistan Ltd',   'seller'),
    ('a0000001-0000-0000-0000-000000000008', 'seller.new@emart.com',     'Nida',   'Artisan Crafts',   'seller'),
    ('a0000001-0000-0000-0000-000000000009', 'buyer.health@emart.com',   'Sara',   'Ahmed',            'customer'),
    ('a0000001-0000-0000-0000-000000000010', 'buyer.family@emart.com',   'Rabia',  'Fatima',           'customer'),
    ('a0000001-0000-0000-0000-000000000011', 'buyer.tech@emart.com',     'Ali',    'Hassan Khan',      'customer'),
    ('a0000001-0000-0000-0000-000000000012', 'buyer.occasional@emart.com','Zara',   'Malik',            'customer'),
    ('a0000001-0000-0000-0000-000000000013', 'buyer.bulk@emart.com',     'Usman',  'Traders',          'customer'),
    ('a0000001-0000-0000-0000-000000000014', 'buyer.vip@emart.com',      'Bilal',  'Siddiqui',         'customer'),
    ('a0000001-0000-0000-0000-000000000015', 'buyer.lapsed@emart.com',   'Nida',   'Khan',             'customer'),
    ('a0000001-0000-0000-0000-000000000016', 'buyer.guest@emart.com',    'Tariq',  'Hassan',           'customer')
)
INSERT INTO public.profiles (id, email, first_name, last_name, role, is_email_verified)
SELECT np.id::uuid, np.email, np.first_name, np.last_name, np.role::public.user_role, true
FROM new_profiles np
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  is_email_verified = true;

-- ============================================================================
-- 4. VENDOR ROWS (public.vendors) for the 5 seller accounts
-- ============================================================================
WITH new_vendors (user_id, name, slug, contact_email, status, commission_rate) AS (
  VALUES
    ('a0000001-0000-0000-0000-000000000004', 'Fresh Organic Valley',      'fresh-organic-valley',    'seller.organic@emart.com',    'approved', 8),
    ('a0000001-0000-0000-0000-000000000005', 'Desi Delight Snacks',       'desi-delight-snacks',     'seller.snacks@emart.com',     'approved', 10),
    ('a0000001-0000-0000-0000-000000000006', 'HomeCare Essentials',       'homecare-essentials',     'seller.household@emart.com',  'approved', 12),
    ('a0000001-0000-0000-0000-000000000007', 'TechHub Pro Store',         'techhub-pro-store',       'seller.electronics@emart.com','approved', 7),
    ('a0000001-0000-0000-0000-000000000008', 'Nida''s Crafts Studio',     'nidas-crafts-studio',     'seller.new@emart.com',        'pending',  15)
)
INSERT INTO public.vendors (user_id, name, slug, contact_email, status, commission_rate)
SELECT nv.user_id::uuid, nv.name, nv.slug, nv.contact_email, nv.status::public.vendor_status, nv.commission_rate::numeric
FROM new_vendors nv
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendors v WHERE v.slug = nv.slug
);

COMMIT;

-- ============================================================================
-- VERIFY — run separately after the above:
--   SELECT email, role FROM public.profiles ORDER BY role, email;
--   SELECT count(*) AS auth_users FROM auth.users;
--   SELECT count(*) AS identities FROM auth.identities;
-- ============================================================================