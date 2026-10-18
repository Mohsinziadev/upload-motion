import { useState } from 'react';
import { presets, type PresetId } from 'upload-motion';
import pkg from '../package.json';
import { EngineLab } from './components/EngineLab';
import { Header } from './components/Header';
import { HeroDemo } from './components/HeroDemo';
import { Playground } from './components/Playground';
import { Showcase } from './components/Showcase';
import { CodeBlock, CopyButton, Section } from './components/ui';
import { useMode } from './lib/mode';

const VERSION = pkg.version;
const REPO = 'https://github.com/Mohsinziadev/upload-motion';
const NPM = 'https://www.npmjs.com/package/upload-motion';
const PACKAGES = 'https://www.m2toolkit.com/npm-packages';

const MANAGERS = {
  npm: 'npm install upload-motion',
  pnpm: 'pnpm add upload-motion',
  yarn: 'yarn add upload-motion',
  bun: 'bun add upload-motion',
} as const;
type Manager = keyof typeof MANAGERS;

const USAGE = [
  {
    id: 'ready',
    label: 'Ready-made',
    blurb: 'One component, any of the 17 presets.',
    file: 'Attachments.tsx',
    code: `import { FileUpload, createXhrUploader } from 'upload-motion';
import 'upload-motion/styles.css'; // once, anywhere in your app

const upload = createXhrUploader({ url: '/api/upload' });

export function Attachments() {
  return (
    <FileUpload
      preset="wave-bar"
      upload={upload}
      accept="image/*,.pdf"
      maxSize={25 * 1024 * 1024}
      onUploadSuccess={(file, response) => console.log(file.name, response)}
    />
  );
}`,
  },
  {
    id: 'composable',
    label: 'Composable',
    blurb: 'Your layout, our motion and logic.',
    file: 'MediaPanel.tsx',
    code: `import {
  Uploader, UploadDropzone, DropzoneContent,
  UploadFileList, UploadSummary, UploadRejections,
} from 'upload-motion';

export function MediaPanel({ upload }) {
  return (
    <Uploader upload={upload} accept="image/*,video/*" appearance={{ radius: 12 }}>
      <UploadSummary />
      <UploadDropzone>
        <DropzoneContent title="Drop media for your post" />
      </UploadDropzone>
      <UploadRejections />
      <UploadFileList layout="grid" progressVariant="ring" allowPause />
    </Uploader>
  );
}`,
  },
  {
    id: 'headless',
    label: 'Headless',
    blurb: 'State, actions and drag and drop. No UI.',
    file: 'MyDropzone.tsx',
    code: `import { useUploader, createXhrUploader } from 'upload-motion';

export function MyDropzone() {
  const { items, totals, dropzone, cancel, retry } = useUploader({
    upload: createXhrUploader({ url: '/api/upload' }),
    maxFiles: 5,
  });

  return (
    <div {...dropzone.getRootProps({ focusable: true })} className="my-zone">
      <input {...dropzone.getInputProps()} />
      {dropzone.isDragActive ? 'Drop it!' : 'Drag files or press Enter'}
      <progress value={totals.progress} />
      {items.map((item) => (
        <p key={item.id}>
          {item.name}: {item.status}
          {item.status === 'error' && <button onClick={() => retry(item.id)}>Retry</button>}
        </p>
      ))}
    </div>
  );
}`,
  },
] as const;

const PROPS: Array<[string, string, string, string]> = [
  ['preset', `"wave-bar" | "card-fan" | "hoop-shot" | … (17)`, '"essential"', 'Animation preset, or your own preset object.'],
  ['upload', 'UploadHandler', '–', 'Transport. Without one, files stay "selected" and are never reported as uploaded.'],
  ['accept', 'string | string[]', '–', 'Same syntax as the HTML accept attribute, e.g. "image/*,.pdf".'],
  ['maxSize / minSize', 'number', '–', 'Bytes per file. Messages read "report.pdf is 31 MB; the limit is 25 MB."'],
  ['maxFiles / multiple', 'number / boolean', '– / true', 'Queue limit; multiple={false} replaces the current file.'],
  ['validate', '(file, { items }) => string | null', '–', 'Custom rule; return a message to reject.'],
  ['autoUpload', 'boolean', 'true', 'Start on add. Card Fan and Hoop Shot default to manual start.'],
  ['concurrency', 'number', '3', 'Parallel uploads.'],
  ['retry', 'number | { attempts, delay }', '0', 'Automatic retries for retryable errors with exponential backoff.'],
  ['store', 'UploadStore', '–', 'Bring your own store so uploads survive unmounts.'],
  ['appearance', '{ theme, accent, radius, density, … }', '–', 'Theme tokens, all mapped to --um-* CSS variables.'],
  ['motion', '{ speed, intensity, particles, reducedMotion }', '–', 'Global motion controls. Reduced motion follows the OS by default.'],
  ['labels', 'Partial<UploadLabels>', '–', 'Override any string for i18n.'],
  ['renderFile / zoneContent', '(item, helpers) => ReactNode / ReactNode', '–', 'Replace the file card or the drop-zone content.'],
  ['onUploadSuccess …', 'callbacks', '–', 'onFilesAdded, onFilesRejected, onUploadStart, onUploadProgress, onUploadError, onUploadCancel, onQueueComplete…'],
];

const KEYS: Array<[string, string]> = [
  ['Tab', 'Every action is a labelled button: browse, upload, pause, cancel, retry, remove'],
  ['Enter / Space', 'Opens the file dialog on focusable drop zones'],
  ['⌘V / Ctrl+V', 'Pastes files into a focused drop zone'],
  ['Enter on a token', 'Hoop Shot takes the perfect shot, no aiming needed'],
  ['↑ ↓ Home End Esc', 'Navigate and close the Wave Bar actions menu'],
];

export function App() {
  const mode = useMode();
  const [manager, setManager] = useState<Manager>('npm');
  const [playgroundPreset, setPlaygroundPreset] = useState<PresetId>('essential');
  const [usage, setUsage] = useState<(typeof USAGE)[number]['id']>('ready');
  const usageTab = USAGE.find((item) => item.id === usage)!;

  const customize = (id: PresetId) => {
    setPlaygroundPreset(id);
    document.getElementById('playground')?.scrollIntoView({ block: 'start' });
  };

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header mode={mode} version={VERSION} repo={REPO} packagesUrl={PACKAGES} />

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              Uploads that <span className="hero-accent">show their work.</span>
            </h1>
            <p className="hero-lead">
              Animated, accessible file uploads for React. {presets.length} motion presets on a real upload engine: byte-level progress,
              retries, pause, cancel and validation, with zero dependencies.
            </p>

            <div className="install">
              <div className="install-tabs" role="group" aria-label="Package manager">
                {(Object.keys(MANAGERS) as Manager[]).map((m) => (
                  <button key={m} type="button" aria-pressed={manager === m} onClick={() => setManager(m)}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="install-cmd">
                <code>
                  <span className="prompt" aria-hidden="true">
                    $
                  </span>{' '}
                  {MANAGERS[manager]}
                </code>
                <CopyButton text={MANAGERS[manager]} />
              </div>
            </div>

            <div className="hero-ctas">
              <a href="#playground" className="btn btn-primary">
                Open the playground
              </a>
              <a href={NPM} className="btn btn-ghost" target="_blank" rel="noreferrer">
                View on npm
              </a>
            </div>

            <ul className="facts" aria-label="Package facts">
              <li>
                <b>0</b> runtime dependencies
              </li>
              <li>
                <b>{presets.length}</b> motion presets
              </li>
              <li>
                <b>≈ 9 kB</b> headless hook
              </li>
              <li>
                <b>TypeScript</b> · ESM + CJS · SSR
              </li>
            </ul>
          </div>
          <div className="hero-demo">
            <HeroDemo mode={mode} />
          </div>
        </section>

        <Section
          id="playground"
          eyebrow="Playground"
          title="Tune it live, copy the code"
          lead="Every control maps to a real prop on the real component. Drop your own files or generate samples in the browser, then copy a snippet that matches what you see."
        >
          <Playground preset={playgroundPreset} onPreset={setPlaygroundPreset} mode={mode} />
        </Section>

        <Section
          id="presets"
          eyebrow="Presets"
          title={`${presets.length} presets, one engine`}
          lead="From a quiet admin list to a basketball court. Presets only change presentation, so switching is one prop and your upload logic never changes."
        >
          <Showcase mode={mode} onCustomize={customize} />
        </Section>

        <Section
          id="engine"
          eyebrow="Engine"
          title="The motion is optional. The engine isn’t."
          lead="This lab uses only the headless useUploader hook and plain markup. Raise the failure rate, limit concurrency and watch the queue: waiting slots, backoff retries, pause and resume."
        >
          <EngineLab />
        </Section>

        <Section id="start" eyebrow="Quick start" title="Three ways in" lead="Import the stylesheet once. Works with Vite, Next.js (App and Pages Router), Remix and CRA, on React 18.2 or newer.">
          <div className="usage">
            <div className="usage-tabs" role="tablist" aria-label="Ways to use upload-motion">
              {USAGE.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`usage-${item.id}`}
                  aria-selected={item.id === usage}
                  aria-controls="usage-panel"
                  className="usage-tab"
                  onClick={() => setUsage(item.id)}
                >
                  <span className="usage-num">0{index + 1}</span>
                  <span>
                    <b>{item.label}</b>
                    <span className="usage-blurb">{item.blurb}</span>
                  </span>
                </button>
              ))}
              <ul className="checklist usage-notes">
                <li>
                  <b>Server components ready.</b> The React entry ships with <code>&quot;use client&quot;</code>, and{' '}
                  <code>upload-motion/core</code> is server-safe.
                </li>
                <li>
                  <b>Any backend.</b> Files arrive as multipart form data in the <code>file</code> field, or as a raw presigned PUT.
                </li>
              </ul>
            </div>
            <div id="usage-panel" role="tabpanel" aria-labelledby={`usage-${usage}`}>
              <CodeBlock code={usageTab.code} title={usageTab.file} />
            </div>
          </div>
        </Section>

        <Section
          id="accessibility"
          eyebrow="Accessibility"
          title="Keyboards, screen readers and calm"
          lead="Motion is the garnish, never the information. Every preset works without a mouse, announces what happens, and settles down when the OS asks for less motion."
        >
          <div className="a11y-grid">
            <table className="keys">
              <caption className="sr-only">Keyboard support</caption>
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {KEYS.map(([key, action]) => (
                  <tr key={key}>
                    <td>
                      <kbd>{key}</kbd>
                    </td>
                    <td>{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="checklist">
              <li>
                <b>Live announcements.</b> Additions, completions and cancellations are polite; errors and rejected files are assertive.
              </li>
              <li>
                <b>Real progressbars</b> with readable values such as &ldquo;42%, 3 seconds left&rdquo;.
              </li>
              <li>
                <b>Not colour alone.</b> Failures always carry an icon and a sentence, like &ldquo;report.pdf is 31 MB; the limit is 25 MB.&rdquo;
              </li>
              <li>
                <b>Reduced motion</b> collapses animations to instant state changes and removes particles; nothing is hidden.
              </li>
              <li>
                <b>Tidy resources.</b> Preview object URLs are revoked, requests abort on unmount, and progress renders once per frame.
              </li>
            </ul>
          </div>
        </Section>

        <Section id="api" eyebrow="API" title="Props at a glance" lead="Every option is typed. The README has the full reference, the composable parts and the headless API.">
          <div className="table-wrap">
            <table className="props">
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {PROPS.map(([name, type, def, desc]) => (
                  <tr key={name}>
                    <td>
                      <code>{name}</code>
                    </td>
                    <td>
                      <code className="type">{type}</code>
                    </td>
                    <td>{def === '–' ? <span className="muted">–</span> : <code>{def}</code>}</td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="api-more">
            Also exported: <code>Uploader</code>, <code>UploadDropzone</code>, <code>UploadFileList</code>, <code>UploadProgress</code>,{' '}
            <code>useUploader</code>, <code>createUploadStore</code>, <code>createXhrUploader</code> and the per-file visualizers.
          </p>
        </Section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>upload-motion · MIT licence · by Mohsin Zia</span>
          <nav aria-label="Footer" className="footer-links">
            <a href={REPO} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">
              Issues
            </a>
            <a href={NPM} target="_blank" rel="noreferrer">
              npm
            </a>
            <a href={PACKAGES}>More packages on M2Toolkit</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
