'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setSiteTheme, useSiteTheme } from '@/lib/site-theme';
import { LogoMark } from './Logo';

const LINKS = [
  { href: '/gallery', label: 'Gallery' },
  { href: '/playground', label: 'Playground' },
  { href: '/docs', label: 'Docs' },
];

export function SiteHeader({ version }: { version: string }) {
  const pathname = usePathname();
  const theme = useSiteTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="site-header" data-scrolled={scrolled || undefined}>
      <div className="container">
        <Link href="/" className="brand" aria-label="upload-motion home">
          <span className="brand__mark">
            <LogoMark />
          </span>
          upload-motion
          <span className="brand__version">v{version}</span>
        </Link>
        <nav className="nav" id="site-nav" aria-label="Main" data-open={open || undefined}>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? 'page' : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => setSiteTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="icon-button menu-button"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
