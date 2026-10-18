import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { setMode, type Mode } from '../lib/mode';
import { copyText } from './ui';

const SECTIONS = [
  { id: 'playground', label: 'Playground' },
  { id: 'presets', label: 'Presets' },
  { id: 'engine', label: 'Engine' },
  { id: 'start', label: 'Quick start' },
  { id: 'api', label: 'API' },
] as const;

const INSTALL = 'npm i upload-motion';
const useIsoLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

function CopyInstall() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type="button"
      className="hdr-install"
      onClick={async () => setCopied(await copyText(INSTALL))}
      aria-label={copied ? 'Install command copied' : `Copy install command: ${INSTALL}`}
    >
      <span className="hdr-install-prompt" aria-hidden="true">
        $
      </span>
      <code>{INSTALL}</code>
      <span className="hdr-install-icon" aria-hidden="true" data-copied={copied || undefined}>
        {copied ? (
          <svg viewBox="0 0 16 16" width="13" height="13">
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="13" height="13">
            <rect x="5" y="5" width="8.5" height="8.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 3.2V3a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function Header({ mode, version, repo, packagesUrl }: { mode: Mode; version: string; repo: string; packagesUrl: string }) {
  const [active, setActive] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);
  const next: Mode = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';

  // "Scrolled" goes straight to the DOM, so scrolling only re-renders when the active section
  // changes: the last section whose top has passed a reading line below the header.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      header.toggleAttribute('data-scrolled', window.scrollY > 8);
      const line = header.getBoundingClientRect().bottom + window.innerHeight * 0.25;
      let current: string | null = null;
      for (const section of SECTIONS) {
        const node = document.getElementById(section.id);
        if (node && node.getBoundingClientRect().top <= line) current = section.id;
      }
      // At the very bottom the last section wins even if it is short.
      if (max > 0 && window.scrollY >= max - 2) current = SECTIONS[SECTIONS.length - 1]!.id;
      setActive((previous) => (previous === current ? previous : current));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Slide the underline to the active link.
  useIsoLayoutEffect(() => {
    const wrap = linksRef.current;
    const link = active ? wrap?.querySelector<HTMLElement>(`a[href="#${active}"]`) : null;
    setIndicator(link ? { x: link.offsetLeft, w: link.offsetWidth } : null);
    // Keep the active link visible in the scrollable mobile row.
    if (link && wrap && wrap.scrollWidth > wrap.clientWidth) {
      wrap.scrollTo({ left: link.offsetLeft - 16, behavior: 'smooth' });
    }
  }, [active]);

  return (
    <header className="hdr" ref={headerRef}>
      <div className="hdr-inner">
        <nav className="hdr-crumbs" aria-label="Breadcrumb">
          <a className="hdr-parent" href={packagesUrl}>
            npm packages
          </a>
          <span className="hdr-sep" aria-hidden="true">
            /
          </span>
          <a href="#top" className="hdr-brand" aria-current="page">
            <svg className="hdr-mark" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M12 13.5V4M7.8 8.2 12 4l4.2 4.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 19c1.5 0 1.5-1.8 3-1.8s1.5 1.8 3 1.8 1.5-1.8 3-1.8 1.5 1.8 3 1.8 1.5-1.8 3-1.8 1.5 1.8 3 1.8" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            upload-motion
          </a>
          <span className="hdr-version">{version}</span>
        </nav>

        <div className="hdr-links" ref={linksRef}>
          <nav aria-label="On this page" className="hdr-links-nav">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? 'location' : undefined}>
                {section.label}
              </a>
            ))}
          </nav>
          <span
            className="hdr-indicator"
            aria-hidden="true"
            style={indicator ? { transform: `translateX(${indicator.x}px)`, width: indicator.w, opacity: 1 } : { opacity: 0 }}
          />
        </div>

        <div className="hdr-actions">
          <CopyInstall />
          <button type="button" className="hdr-icon" onClick={() => setMode(next)} aria-label={`Colour mode: ${mode}. Switch to ${next}.`} title={`Colour mode: ${mode}`}>
            {mode === 'dark' ? (
              <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
                <path d="M16 12.3A6.5 6.5 0 0 1 7.7 4a6.5 6.5 0 1 0 8.3 8.3z" fill="currentColor" />
              </svg>
            ) : mode === 'light' ? (
              <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
                <circle cx="10" cy="10" r="3.5" fill="currentColor" />
                <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6L16 16M4 16l1.4-1.4M14.6 5.4L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
                <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />
              </svg>
            )}
          </button>
          <a className="hdr-icon" href={repo} target="_blank" rel="noreferrer" aria-label="upload-motion on GitHub">
            <svg viewBox="0 0 16 16" width="17" height="17" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
