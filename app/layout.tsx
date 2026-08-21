import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Shell } from './Shell';
import { getDirection } from '@/lib/i18n';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

export const viewport: Viewport = {
  themeColor: '#7A9B76',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'E-Mart — Your Local Marketplace',
  description: 'Shop groceries, household essentials, and more. Delivered to your door.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'E-Mart',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const dir = getDirection();
  return (
    <html lang={dir === 'rtl' ? 'ur' : 'en'} dir={dir} suppressHydrationWarning>
      <body className={`${nunito.variable} font-sans bg-bg text-text-primary min-h-screen min-h-dvh`}>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
