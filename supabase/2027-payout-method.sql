-- 2027-02: Seller payout method
-- Stores each seller's preferred payout method so the earnings page can
-- show real data instead of a hardcoded value and the payout request
-- modal can prefill the method + account details.

CREATE TABLE IF NOT EXISTS seller_payout_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_method VARCHAR(20) NOT NULL DEFAULT 'bank' CHECK (preferred_method IN ('bank', 'easypaisa', 'jazzcash')),
  bank_name VARCHAR(100),
  account_title VARCHAR(100),
  account_number VARCHAR(50),
  iban VARCHAR(50),
  easypaisa_phone VARCHAR(20),
  jazzcash_phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_payout_methods_seller_id ON seller_payout_methods(seller_id);

ALTER TABLE seller_payout_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view own payout method" ON seller_payout_methods;
CREATE POLICY "Sellers can view own payout method"
  ON seller_payout_methods FOR SELECT
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can insert own payout method" ON seller_payout_methods;
CREATE POLICY "Sellers can insert own payout method"
  ON seller_payout_methods FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can update own payout method" ON seller_payout_methods;
CREATE POLICY "Sellers can update own payout method"
  ON seller_payout_methods FOR UPDATE
  USING (auth.uid() = seller_id);

DROP TRIGGER IF EXISTS update_seller_payout_methods_updated_at ON seller_payout_methods;
CREATE TRIGGER update_seller_payout_methods_updated_at
  BEFORE UPDATE ON seller_payout_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();