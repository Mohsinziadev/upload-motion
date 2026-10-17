import Link from 'next/link';
import { presetCatalog as presets } from 'upload-motion/core';
import { Code } from '@/components/Code';
import { DemoUploader } from '@/components/DemoUploader';
import { Callout, H2, SimpleTable } from './ui';

export async function GettingStarted() {
  return (
    <>
      <H2 id="install">Install</H2>
      <p>
        upload-motion ships as one package with React 18.2+ (including React 19) as its only peer dependency. It has no runtime
        dependencies.
      </p>
      <Code lang="bash" title="terminal" code={`npm install upload-motion\n# or: pnpm add upload-motion · yarn add upload-motion · bun add upload-motion`} />

      <H2 id="styles">Import the stylesheet once</H2>
      <p>
        All presets share one stylesheet. Import it in your app entry or root layout. In Next.js that is <code>app/layout.tsx</code>.
      </p>
      <Code code={`import 'upload-motion/styles.css';`} />

      <H2 id="quick-start">Render an uploader</H2>
      <p>
        Pick a preset and give it an upload handler. <code>createXhrUploader</code> sends each file as multipart form data and reports
        real byte-level progress:
      </p>
      <Code
        title="Attachments.tsx"
        code={`'use client';

import { FileUpload, createXhrUploader } from 'upload-motion';

const upload = createXhrUploader({ url: '/api/upload' });

export function Attachments() {
  return (
    <FileUpload
      preset="wave-bar"
      upload={upload}
      accept="image/*,.pdf"
      maxSize={25 * 1024 * 1024}
      onUploadSuccess={(file, response) => console.log('Stored', file.name, response)}
    />
  );
}`}
      />
      <div className="doc-demo">
        <DemoUploader preset="wave-bar" samples={['image', 'pdf']} />
      </div>
      <Callout tone="warn" title="Server components">
        <p>
          Handlers and callbacks are functions, and React can't pass functions from a Server Component to a Client Component. Put
          your <code>{'<FileUpload>'}</code> in a file that starts with <code>&apos;use client&apos;</code>, like the example above.
          Everything else (styles, the <code>upload-motion/core</code> helpers) works on the server.
        </p>
      </Callout>

      <H2 id="backend">Receive the files</H2>
      <p>
        Any endpoint that accepts multipart form data will work. With the default settings the file arrives in a field named{' '}
        <code>file</code>. Here is a minimal Next.js route handler:
      </p>
      <Code
        title="app/api/upload/route.ts"
        code={`export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file received' }, { status: 400 });
  }
  // Store it wherever you like (S3, disk, database…)
  return Response.json({ name: file.name, size: file.size });
}`}
      />
      <p>
        A JSON <code>{'{ error }'}</code> in a failed response becomes the message the user sees. For large files or serverless hosts
        with body limits, upload straight to object storage instead. See <Link href="/docs/upload-handlers">Upload handlers</Link>.
      </p>

      <H2 id="three-ways">Three levels of control</H2>
      <SimpleTable
        head={['Layer', 'Use it when…', 'Start with']}
        rows={[
          ['Ready-made', 'You want a polished uploader with one component.', <code key="a">{'<FileUpload preset="…" />'}</code>],
          [
            'Composable',
            'You want your own layout while keeping the motion and logic.',
            <code key="b">{'<Uploader>'} + parts</code>,
          ],
          ['Headless', 'You have a design system and only need state, actions and drag-and-drop.', <code key="c">useUploader()</code>],
        ]}
      />
      <p>
        All three share the same engine. Read on with <Link href="/docs/presets">Animation presets</Link> or jump to the{' '}
        <Link href="/docs/components">component API</Link>.
      </p>
    </>
  );
}

const SUPPORTS: Record<string, string> = {
  'card-fan': 'title, zoneContent, renderFile, progressVariant, layout, classNames',
  'wave-bar': 'title, zoneContent (idle state), renderFile (drawer), progressVariant, layout',
  'hoop-shot': 'title, description, zoneContent, renderFile, progressVariant, layout',
  essential: 'title, zoneContent, renderFile, progressVariant, layout, classNames',
  'segment-ring': 'title, zoneContent, renderFile, progressVariant, layout',
  beam: 'title, zoneContent, renderFile, progressVariant, layout',
  magnetic: 'title, zoneContent, renderFile, progressVariant, layout',
  portal: 'title, zoneContent, renderFile, progressVariant, layout',
  liquid: 'title, zoneContent, renderFile, progressVariant, layout',
  stack: 'title, zoneContent (empty deck), renderFile (deck cards + list)',
  orbit: 'title, zoneContent, renderFile, progressVariant, layout',
  bloom: 'title, renderFile, classNames',
  'page-reveal': 'title, renderFile, classNames',
  filmstrip: 'title, zoneContent, renderFile',
  waveform: 'title, zoneContent, renderFile',
  pixel: 'title, renderFile, classNames',
  adaptive: 'title, zoneContent, renderFile, fileAnimations',
};

export async function PresetsDoc() {
  return (
    <>
      <p>
        Pass a preset id to <code>{'<FileUpload preset="…">'}</code>. Presets only change presentation, so you can switch at runtime
        and the queue, uploads and callbacks carry on untouched. Try them live in the <Link href="/gallery">gallery</Link>.
      </p>
      <H2 id="all-presets">All presets</H2>
      <ul className="preset-list">
        {presets.map((preset) => (
          <li key={preset.id}>
            <h3>
              {preset.name} <code>{preset.id}</code>
              {preset.defaults?.autoUpload === false ? <span className="pill">manual start</span> : null}
            </h3>
            <p>{preset.description}</p>
            <p className="preset-props">
              Best for: {preset.bestFor.join(', ')} · Customise with: {SUPPORTS[preset.id] ?? 'renderFile'}
            </p>
          </li>
        ))}
      </ul>
      <H2 id="reference-presets">The three signature presets</H2>
      <p>The first three presets recreate the reference animations this library started from:</p>
      <ul>
        <li>
          <strong>Wave Bar</strong>: a compact pill. A soft fill sweeps behind the summary (“Uploading 3 files · 63% · 6.4 MB/s · 5
          seconds left”) while a sine wave travels along the edge. The wave flattens into a straight line on success. Pause, cancel,
          expand and a “more” menu are built in.
        </li>
        <li>
          <strong>Card Fan</strong>: a dashed, tinted zone with three tilted media cards and curved arrows. The cards fan out as soon as
          files are dragged anywhere over the window, open wider over the zone, and re-deal on drop. The Upload button starts
          uploads manually and fills with progress.
        </li>
        <li>
          <strong>Hoop Shot</strong>: pull a file token back, aim with the dotted trajectory and release. Real gravity, rim bounces and
          bank shots decide whether it scores. Only files that score start uploading. Keyboard users press Enter on the token, and
          “Shoot all” takes perfect shots for everyone.
        </li>
      </ul>
      <H2 id="per-file">File-specific animations</H2>
      <p>
        The media presets (<code>bloom</code>, <code>page-reveal</code>, <code>filmstrip</code>, <code>waveform</code>,{' '}
        <code>pixel</code>) give each file a visual based on its content. They decode real frames and waveforms in the browser.{' '}
        <code>adaptive</code> picks one per file type, and you can override the mapping:
      </p>
      <Code
        code={`<FileUpload
  preset="adaptive"
  upload={upload}
  fileAnimations={{ pdf: 'pixel', archive: 'card', image: 'bloom' }}
/>`}
      />
      <p>
        Available visualizers: <code>bloom</code>, <code>page</code>, <code>filmstrip</code>, <code>waveform</code>, <code>pixel</code>{' '}
        and <code>card</code>. They're also exported as components (<code>BloomVisual</code>, <code>WaveformVisual</code>, …) for
        your own layouts.
      </p>
      <H2 id="custom-presets">Custom presets</H2>
      <p>
        A preset is an object with a <code>Component</code> that reads state from <code>useUploaderContext()</code>. Pass the object
        instead of an id:
      </p>
      <Code
        code={`import { FileUpload, UploadDropzone, UploadFileList, type UploadPreset } from 'upload-motion';

const minimalPreset: UploadPreset = {
  id: 'my-minimal',
  name: 'My minimal',
  description: 'House style uploader',
  category: 'professional',
  bestFor: ['Internal tools'],
  Component: ({ renderFile }) => (
    <>
      <UploadDropzone focusable />
      <UploadFileList renderFile={renderFile} progressVariant="ring" />
    </>
  ),
};

<FileUpload preset={minimalPreset} upload={upload} />;`}
      />
    </>
  );
}
