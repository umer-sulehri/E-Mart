-- ============================================================================
-- E-Mart Audit Features Migration
-- Adds: payment gateway fields, email/sms logs, search analytics,
--       admin analytics events, seller payouts, order tracking, FTS index
-- ============================================================================

-- ============================================================================
-- PAYMENTS: extend for multi-gateway support (Stripe / JazzCash / EasyPaisa / COD)
-- ============================================================================
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_reference TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_payments_provider ON public.payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_provider_reference ON public.payments(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ============================================================================
-- EMAIL LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_address TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Email logs: owner read"
  ON public.email_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Email logs: admin full access"
  ON public.email_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- SMS LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  provider TEXT DEFAULT 'twilio',
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON public.sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs(created_at DESC);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SMS logs: owner read"
  ON public.sms_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "SMS logs: admin full access"
  ON public.sms_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- SEARCH HISTORY + TRENDING SEARCHES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON public.search_history(query);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Search history: owner full access"
  ON public.search_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.trending_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT UNIQUE NOT NULL,
  hit_count BIGINT NOT NULL DEFAULT 1,
  last_searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trending_searches_hits ON public.trending_searches(hit_count DESC);

ALTER TABLE public.trending_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trending searches: public read"
  ON public.trending_searches FOR SELECT
  USING (true);

-- Service-role writes happen from API routes; anon increments go through RPC.
CREATE OR REPLACE FUNCTION public.record_trending_search(p_query TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.trending_searches (query, hit_count, last_searched_at)
  VALUES (lower(trim(p_query)), 1, now())
  ON CONFLICT (query)
  DO UPDATE SET hit_count = public.trending_searches.hit_count + 1, last_searched_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ANALYTICS EVENTS (page views, add-to-cart, purchases, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics events: insert any"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Analytics events: admin full access"
  ON public.analytics_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- SELLER PAYOUTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (method IN ('bank_transfer','stripe_connect','jazzcash')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','processing','paid','rejected')),
  reference TEXT,
  note TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_id ON public.seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON public.seller_payouts(status);

ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seller payouts: owner select own"
  ON public.seller_payouts FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Seller payouts: owner insert own"
  ON public.seller_payouts FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Seller payouts: admin full access"
  ON public.seller_payouts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- ORDER TRACKING (status timeline per order)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at DESC);

ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order tracking: owner select"
  ON public.order_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Order tracking: admin full access"
  ON public.order_tracking FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- FULL-TEXT SEARCH on products (name weighted A, description weighted B)
-- ============================================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(name_urdu, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products USING GIN (search_vector);
