import type { Metadata, Viewport } from 'next';
import { Nunito, Open_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import CookieConsent from '@/components/ui/CookieConsent';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { SITE_URL } from '@/lib/seo';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '700', '800', '900'],
  variable: '--font-heading',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
  display: 'swap',
});

// Comes from `@/lib/seo`, which falls back to the live host rather than
// localhost: `metadataBase` seeds every relative OG/canonical URL, so a
// localhost fallback emits unusable absolute links across the whole site.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // The homepage had no canonical, so every variant that resolves to it
  // (trailing slash, non-www) was indexable as a separate URL. Pages with
  // their own metadata override this, which is why the static content pages
  // go through `generatePageMetadata`.
  alternates: { canonical: '/' },
  title: {
    default: 'E-Mart - Organic Foods at your Doorsteps',
    template: '%s | E-Mart - Organic Grocery Store',
  },
  description:
    'Fresh organic groceries delivered to your doorstep. Shop from a wide variety of fruits, vegetables, dairy, meat, and everyday essentials.',
  keywords: [
    'grocery',
    'organic',
    'fresh food',
    'online shopping',
    'delivery',
    'Pakistan',
    'organic produce',
    'vegetables',
    'fruits',
    'dairy',
    'meat',
    'household essentials',
  ],
  authors: [{ name: 'E-Mart', url: SITE_URL }],
  creator: 'E-Mart',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'E-Mart - Organic Grocery Store',
    title: 'E-Mart - Organic Foods at your Doorsteps',
    description:
      'Fresh organic groceries delivered to your doorstep. Shop from a wide variety of fruits, vegetables, dairy, meat, and everyday essentials.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'E-Mart - Organic Grocery Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-Mart - Organic Foods at your Doorsteps',
    description:
      'Fresh organic groceries delivered to your doorstep. Shop from a wide variety of fruits, vegetables, dairy, meat, and everyday essentials.',
    images: ['/images/og-image.jpg'],
  },
  icons: {
    // Square PNG rather than /images/logo.webp: that file is a 241x54
    // wordmark, which browsers either letterbox into a box or stretch, and
    // iOS does not accept WebP for apple-touch-icon at all.
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // Without this the layout viewport is inset to the safe area, so a sticky
  // header or a fixed mobile bar cannot reach under the notch or the home
  // indicator, and `env(safe-area-inset-*)` resolves to 0 everywhere.
  viewportFit: 'cover',
  themeColor: '#6BB252',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Organization markup for the whole site. Product and BreadcrumbList are
  // emitted per page; without this the brand itself is only inferable from the
  // domain, which is what a knowledge-panel candidate needs.
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'E-Mart',
    url: SITE_URL,
    // 512px square rather than the 241x54 wordmark: Google's knowledge-panel
    // guidance asks for a logo at least 112x112 that represents the brand
    // mark, and a wide wordmark is a poor fit for that slot.
    logo: `${SITE_URL}/icons/icon-512.png`,
    description:
      'Multi-vendor marketplace for organic groceries and everyday essentials, delivered across Pakistan.',
    sameAs: [],
  };

  return (
    <html lang="en" className={`${nunito.variable} ${openSans.variable}`}>
      <body className="font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <Providers>
          <div id="main-content">{children}</div>
          <ImpersonationBanner />
          <CookieConsent />
          {/* Fixed bottom nav for phones. Rendered at the root so it exists on
              every page (public, dashboard, seller, admin, auth), not just the
              public storefront. Each layout below leaves bottom padding so
              content is not hidden behind it. */}
          <MobileBottomNav />
        </Providers>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
