-- 2027-09: Privacy & consent (GDPR / CCPA)
-- Server-backed consent records so visitors who assert a choice can be
-- audited, consent can be withdrawn, and GDPR/CCPA data-rights requests
-- are servable. Consent preferences are bounded booleans plus a record of
-- how/when the choice was made. "Essential" is always true (session, auth,
-- cart, security cookies are required for the store to function).

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{"essential":true,"analytics":false,"marketing":false,"social":false}',
  method TEXT NOT NULL CHECK (method IN ('accept_all', 'reject_all', 'customize', 'withdraw')),
  source TEXT NOT NULL DEFAULT 'banner' CHECK (source IN ('banner', 'settings', 'footer')),
  region TEXT NOT NULL DEFAULT 'unknown',
  banner_version TEXT NOT NULL DEFAULT '1',
  privacy_policy_version TEXT NOT NULL DEFAULT '2.0',
  ip_hash TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_expires_at ON user_consents(expires_at);

CREATE TABLE IF NOT EXISTS consent_audit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  method TEXT,
  source TEXT NOT NULL DEFAULT 'banner',
  region TEXT NOT NULL DEFAULT 'unknown',
  previous JSONB,
  next JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_subject ON consent_audit(subject);
CREATE INDEX IF NOT EXISTS idx_consent_audit_created_at ON consent_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_audit_user_id ON consent_audit(user_id);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consent" ON user_consents;
CREATE POLICY "Users can view own consent"
  ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consent" ON user_consents;
CREATE POLICY "Users can insert own consent"
  ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own consent" ON user_consents;
CREATE POLICY "Users can update own consent"
  ON user_consents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all consents" ON user_consents;
CREATE POLICY "Admins can view all consents"
  ON user_consents FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can insert own consent audit" ON consent_audit;
CREATE POLICY "Users can insert own consent audit"
  ON consent_audit FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view consent audit" ON consent_audit;
CREATE POLICY "Admins can view consent audit"
  ON consent_audit FOR SELECT
  USING (public.is_admin());

DROP TRIGGER IF EXISTS update_user_consents_updated_at ON user_consents;
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();