import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { themeScript } from '@/lib/theme-script';
import pkg from 'upload-motion/package.json';
import 'upload-motion/styles.css';
import './globals.css';

const sans = Geist({ subsets: ['latin'], variable: '--font-sans' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['italic'], variable: '--font-serif' });

const version: string = pkg.version;

export const metadata: Metadata = {
  title: { default: 'upload-motion – animated file uploads for React', template: '%s · upload-motion' },
  description:
    'Production-ready React file uploads with 17 motion presets, real progress, retries, cancellation, validation and first-class accessibility.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbfd' },
    { media: '(prefers-color-scheme: dark)', color: '#08080e' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="backdrop" aria-hidden="true" />
        <SiteHeader version={version} />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
