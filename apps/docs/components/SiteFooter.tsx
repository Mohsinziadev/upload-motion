import Link from 'next/link';
import { LogoMark, WaveRule } from './Logo';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <WaveRule />
      <div className="container" style={{ marginTop: 32 }}>
        <div className="stack-sm">
          <Link href="/" className="brand" style={{ fontSize: 15 }}>
            <span className="brand__mark" style={{ width: 26, height: 26 }}>
              <LogoMark size={15} />
            </span>
            upload-motion
          </Link>
          <p style={{ margin: 0, maxWidth: 360 }}>
            Animated, accessible file uploads for React. MIT licensed. Built with React, TypeScript and a lot of easing curves.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/gallery">Gallery</Link>
          <Link href="/playground">Playground</Link>
          <Link href="/docs">Getting started</Link>
          <Link href="/docs/components">API</Link>
          <Link href="/docs/upload-handlers">Upload handlers</Link>
          <Link href="/docs/accessibility">Accessibility</Link>
          <Link href="/docs/troubleshooting">Troubleshooting</Link>
        </nav>
      </div>
    </footer>
  );
}
