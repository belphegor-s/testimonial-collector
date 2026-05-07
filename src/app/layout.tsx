import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Kudoso  | Collect testimonials your customers will brag about',
    template: '%s  | Kudoso',
  },
  description: 'Beautiful, embeddable testimonial pages for indie SaaS founders, agencies, and creators. Collect text + video proof in minutes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kudoso.io'),
  openGraph: {
    title: 'Kudoso  | Collect testimonials your customers will brag about',
    description: 'Beautiful, embeddable testimonial pages. Free to start, $19/mo for unlimited + custom domains.',
    url: '/',
    siteName: 'Kudoso',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kudoso',
    description: 'Beautiful, embeddable testimonial pages.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextTopLoader color="#00bc7d" showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
