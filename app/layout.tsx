import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: {
    default: 'E-Mart - Organic Foods at your Doorsteps',
    template: '%s | E-Mart',
  },
  description: 'Fresh organic groceries delivered to your doorstep. Shop from a wide variety of fruits, vegetables, dairy, meat, and more.',
  keywords: ['grocery', 'organic', 'fresh food', 'online shopping', 'delivery'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'E-Mart',
  },
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
