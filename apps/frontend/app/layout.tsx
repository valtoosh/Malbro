// apps/frontend/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Inter_Tight, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  weight: ['700', '900'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'The Marlbro Foundation',
    template: '%s · The Marlbro Foundation',
  },
  description:
    'The Marlbro Foundation provides discretionary subsidies to qualifying applicants pursuant to Schedule R-7.',
  metadataBase: new URL('https://marlbro.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
