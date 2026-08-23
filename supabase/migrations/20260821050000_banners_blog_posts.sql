-- ============================================================================
-- Site banners + blog posts: fully admin-managed content for the storefront.
-- Run once in Supabase Dashboard > SQL Editor. Idempotent.
-- ============================================================================

-- ---------------------------------------------------------------- banners --
CREATE TABLE IF NOT EXISTS public.site_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot TEXT NOT NULL DEFAULT 'hero'
    CHECK (slot IN ('hero', 'promo-small', 'promo-wide')),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  badge_text TEXT,
  cta_label TEXT,
  cta_href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Banners: public read active" ON public.site_banners;
CREATE POLICY "Banners: public read active"
  ON public.site_banners FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Banners: admin write" ON public.site_banners;
CREATE POLICY "Banners: admin write"
  ON public.site_banners FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------ blog posts --
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_urdu TEXT,
  excerpt TEXT NOT NULL DEFAULT '',
  excerpt_urdu TEXT,
  content TEXT NOT NULL DEFAULT '',
  content_urdu TEXT,
  author TEXT NOT NULL DEFAULT 'E-Mart Team',
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  cover_image TEXT NOT NULL DEFAULT '/images/post-thumb-1.jpg',
  read_time INTEGER NOT NULL DEFAULT 4,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog: public read published" ON public.blog_posts;
CREATE POLICY "Blog: public read published"
  ON public.blog_posts FOR SELECT
  USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Blog: admin write" ON public.blog_posts;
CREATE POLICY "Blog: admin write"
  ON public.blog_posts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------- seeds --
INSERT INTO public.site_banners (slot, title, subtitle, description, image_url, badge_text, cta_label, cta_href, sort_order)
VALUES
  ('hero', 'Fresh Smoothie & Summer Juice', '100% natural', 'Freshly pressed juices and smoothies delivered to your door every morning.', '/images/product-thumb-1.png', NULL, 'Shop Now', '/products', 0),
  ('hero', 'Heinz Tomato Ketchup', '100% natural', 'Classic rich taste — now 15% off this week only.', '/images/product-thumb-2.png', NULL, 'Shop Collection', '/products', 1),
  ('promo-small', 'Fruits & Vegetables', '20% off', NULL, NULL, '20% off', 'Shop Collection', '/categories', 2),
  ('promo-wide', 'Baked Products', '15% off', NULL, NULL, '15% off', 'Shop Collection', '/products?search=bakery', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.blog_posts (slug, title, excerpt, content, author, category, tags, cover_image, read_time)
VALUES
  ('fresh-picks-this-week', 'Top 10 fresh picks to add to your cart this week',
   'Our grocery experts round up the freshest arrivals of the season.',
   E'From crisp seasonal vegetables to farm-fresh dairy, this week''s arrivals are all about quality.\n\nVisit the shop section to explore the full range and grab them before they run out.',
   'E-Mart Team', 'tips & tricks', ARRAY['grocery','fresh'], '/images/post-thumb-1.jpg', 4),
  ('smart-shopping-guide', 'Latest trends of smart online grocery shopping',
   'How to save more while shopping smarter on E-Mart.',
   E'Bundle deals, flash sales and loyalty discounts can cut your monthly bill significantly.\n\nEnable notifications so you never miss a price drop.',
   'E-Mart Team', 'trending', ARRAY['shopping','savings'], '/images/post-thumb-2.jpg', 5),
  ('kitchen-inspiration', '10 quick & healthy meal ideas for busy families',
   'Simple recipes using everyday items already in your kitchen.',
   E'Weeknight dinners do not need to be complicated. With a well-stocked pantry you can put together healthy meals in under 30 minutes.',
   'E-Mart Team', 'inspiration', ARRAY['recipes','family'], '/images/post-thumb-3.jpg', 6)
ON CONFLICT (slug) DO NOTHING;
