import Link from 'next/link';
import { presetCatalog as presets } from 'upload-motion/core';
import { highlight } from '@/components/Code';
import { HeroDemo } from '@/components/HeroDemo';
import { InstallCommand } from '@/components/InstallCommand';
import { WaveRule } from '@/components/Logo';
import { Showcase } from '@/components/Showcase';
import { UsageTabs } from '@/components/UsageTabs';
import { getBundleSizes, kb } from '@/lib/bundle-size';
import { composableSnippet, headlessSnippet, readyMadeSnippet } from '@/lib/snippets';
import './landing.css';

const FEATURES = [
  {
    title: 'Real progress, honestly reported',
    body: 'XMLHttpRequest transport with true upload progress, smoothed speed and ETA. Simulated transports are flagged and badged – fake progress can never pass as real.',
    icon: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  },
  {
    title: 'Bring any backend',
    body: 'A one-function handler contract. Built-ins for multipart POST and presigned PUT (S3, R2, GCS). Write your own for tus, chunking or SDKs.',
    icon: 'M4 7h16M4 12h16M4 17h10',
  },
  {
    title: 'Queue that behaves',
    body: 'Concurrency limits, manual or automatic start, pause/resume, cancel, retry with exponential backoff, single-file replace mode and max file counts.',
    icon: 'M5 6h14M5 12h14M5 18h8',
  },
  {
    title: 'Validation with real sentences',
    body: '“report.pdf is 31 MB; the limit is 25 MB.” Type, size, count and custom validators – messages announced to screen readers, never colour-only.',
    icon: 'M5 12.5l4.5 4.5L19 7.5',
  },
  {
    title: 'Accessible by default',
    body: 'Keyboard-operable zones and controls, focus rings, ARIA progressbars, live-region announcements, and full prefers-reduced-motion support.',
    icon: 'M12 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM5 10l7 2 7-2M12 12v8M9 20l3-6 3 6',
  },
  {
    title: 'Zero dependencies, SSR-safe',
    body: 'Only React as a peer. Browser APIs live in effects, the engine is importable on the server, and object URLs are always revoked.',
    icon: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z',
  },
];

export default async function HomePage() {
  const sizes = getBundleSizes();
  const tabs = [
    {
      id: 'ready',
      label: 'Ready-made',
      blurb: 'One component, any preset.',
      code: readyMadeSnippet,
      html: await highlight(readyMadeSnippet),
    },
    {
      id: 'composable',
      label: 'Composable',
      blurb: 'Arrange the parts yourself.',
      code: composableSnippet,
      html: await highlight(composableSnippet),
    },
    {
      id: 'headless',
      label: 'Headless',
      blurb: 'State and actions, your UI.',
      code: headlessSnippet,
      html: await highlight(headlessSnippet),
    },
  ];

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="eyebrow">
              <span className="eyebrow__dot">{presets.length} presets</span>
              React · TypeScript · Zero dependencies
            </span>
            <h1 className="display">
              File uploads that <em>move</em> people.
            </h1>
            <p className="lead">
              upload-motion is a production-ready upload engine wrapped in art-directed motion. Real progress, retries and validation
              underneath – waves, portals and swishing hoops on top.
            </p>
            <div className="hero__actions">
              <Link className="button button--primary" href="/playground">
                Open the playground
              </Link>
              <Link className="button button--ghost" href="/docs">
                Read the docs
              </Link>
            </div>
            <InstallCommand />
          </div>
          <HeroDemo />
        </div>
      </section>

      <div className="container">
        <WaveRule />
      </div>

      <section className="section" aria-labelledby="showcase-title">
        <div className="container">
          <div className="section-head">
            <span className="kicker">The collection</span>
            <h2 className="h2" id="showcase-title">
              Seventeen motions, <em>one</em> engine.
            </h2>
            <p className="lead">
              From a quiet admin-panel list to a basketball court. Every preset runs on the same queue, so switching is one prop – your
              upload logic never changes.
            </p>
          </div>
          <Showcase />
          <p className="section-foot">
            <Link href="/gallery">Browse every preset side by side →</Link>
          </p>
        </div>
      </section>

      <section className="section section--tinted" aria-labelledby="features-title">
        <div className="container">
          <div className="section-head">
            <span className="kicker">Under the motion</span>
            <h2 className="h2" id="features-title">
              Pretty is the easy part. <em>Reliable</em> is the product.
            </h2>
          </div>
          <div className="features">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="feature">
                <span className="feature__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={feature.icon} />
                  </svg>
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
          {sizes ? (
            <dl className="sizes" aria-label="Bundle sizes measured from the current build">
              <div>
                <dt>Full React package</dt>
                <dd>{kb(sizes.js)}</dd>
              </div>
              <div>
                <dt>Headless engine only</dt>
                <dd>{kb(sizes.core)}</dd>
              </div>
              <div>
                <dt>All preset styles</dt>
                <dd>{kb(sizes.css)}</dd>
              </div>
              <p className="sizes__note">gzip, measured from this build of the package. Runtime dependencies: none.</p>
            </dl>
          ) : null}
        </div>
      </section>

      <section className="section" aria-labelledby="usage-title">
        <div className="container">
          <div className="section-head">
            <span className="kicker">Three levels of control</span>
            <h2 className="h2" id="usage-title">
              Drop it in, <em>compose</em> it, or go headless.
            </h2>
          </div>
          <UsageTabs tabs={tabs} />
        </div>
      </section>

      <section className="section cta">
        <div className="container cta__inner">
          <h2 className="h2">
            Ship an upload experience <em>worth</em> showing off.
          </h2>
          <div className="hero__actions">
            <InstallCommand />
            <Link className="button button--primary" href="/docs">
              Get started
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
