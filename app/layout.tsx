import type { Metadata, Viewport } from 'next';
import { Inter, Nunito } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
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
  themeColor: '#6BB252',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable}`}>
      <body className="font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
