import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Providers } from '@/lib/providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'FemmeLux Beauty - Premium B2B Wholesale Beauty Marketplace',
    template: '%s | FemmeLux Beauty',
  },
  description:
    'Premium B2B wholesale beauty marketplace connecting retailers with top beauty brands. Exclusive wholesale pricing, verified brands, and seamless ordering.',
  keywords: [
    'wholesale beauty',
    'B2B beauty',
    'beauty marketplace',
    'cosmetics wholesale',
    'skincare wholesale',
    'beauty brands',
  ],
  authors: [{ name: 'FemmeLux Beauty' }],
  creator: 'FemmeLux Beauty',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://femmelux.com',
    siteName: 'FemmeLux Beauty',
    title: 'FemmeLux Beauty - Premium B2B Wholesale Beauty Marketplace',
    description:
      'Premium B2B wholesale beauty marketplace connecting retailers with top beauty brands.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FemmeLux Beauty',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FemmeLux Beauty - Premium B2B Wholesale Beauty Marketplace',
    description:
      'Premium B2B wholesale beauty marketplace connecting retailers with top beauty brands.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-white text-secondary-800 antialiased flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
