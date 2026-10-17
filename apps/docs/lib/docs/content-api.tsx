import Link from 'next/link';
import { Code } from '@/components/Code';
import { Callout, H2, H3, PropTable, SimpleTable, type PropRow } from './ui';

const uploaderRows: PropRow[] = [
  { name: 'upload', type: 'UploadHandler', description: <>Transport for each file. Without one, files stay <em>pending</em> and are never reported as uploaded.</> },
  { name: 'accept', type: 'string | string[]', description: <>Allowed types using the HTML <code>accept</code> syntax, e.g. <code>&quot;image/*,.pdf&quot;</code>.</> },
  { name: 'maxSize', type: 'number', description: 'Maximum bytes per file.' },
  { name: 'minSize', type: 'number', description: 'Minimum bytes per file.' },
  { name: 'maxFiles', type: 'number', description: 'Maximum files in the queue at once (failed and canceled files count until removed).' },
  { name: 'multiple', type: 'boolean', default: 'true', description: <>Set to <code>false</code> for single-file mode: a new file replaces the current one.</> },
  { name: 'validate', type: '(file, { items }) => string | null', description: 'Custom rule. Return a message to reject the file.' },
  { name: 'autoUpload', type: 'boolean', default: 'true*', description: <>Start uploading as soon as files are added. *<code>card-fan</code> and <code>hoop-shot</code> default to manual start.</> },
  { name: 'concurrency', type: 'number', default: '3', description: 'Uploads running in parallel.' },
  { name: 'retry', type: 'number | { attempts, delay }', default: '0', description: 'Automatic retries for retryable errors, with exponential backoff (delay defaults to 800 ms).' },
  { name: 'store', type: 'UploadStore', description: <>Use a store you created yourself, so uploads survive unmounts or can be shared. See <Link href="/docs/headless">Headless</Link>.</> },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables selection and drag-and-drop.' },
  { name: 'capture', type: "'user' | 'environment'", description: 'Mobile camera hint for the file input.' },
  { name: 'preventWindowDrop', type: 'boolean', default: 'true', description: 'Stops the browser from opening files dropped outside a zone.' },
  { name: 'appearance', type: 'Appearance', description: <>Theme tokens. See <Link href="/docs/theming">Theming</Link>.</> },
  { name: 'motion', type: 'MotionOptions', description: <><code>{'{ speed, intensity, particles, reducedMotion }'}</code></> },
  { name: 'labels', type: 'Partial<UploadLabels>', description: 'Override any UI string (i18n).' },
  { name: 'className / style / id', type: '…', description: 'Applied to the root element.' },
];

const callbackRows: PropRow[] = [
  { name: 'onFilesAdded', type: '(items) => void', description: 'Files passed validation and joined the queue.' },
  { name: 'onFilesRejected', type: '(rejections) => void', description: 'Files failed validation. Each rejection has errors with a code and a human message.' },
  { name: 'onUploadStart', type: '(item) => void', description: 'An attempt started (including retries).' },
  { name: 'onUploadProgress', type: '(item) => void', description: 'Bytes were reported. Fires often, so keep it cheap.' },
  { name: 'onUploadSuccess', type: '(item, response) => void', description: 'The handler resolved. response is whatever your handler returned.' },
  { name: 'onUploadError', type: '(item, error: UploadError) => void', description: 'An attempt failed and no automatic retry is left.' },
  { name: 'onUploadCancel', type: '(item) => void', description: 'Canceled by the user or by unmounting.' },
  { name: 'onFileRemoved', type: '(item) => void', description: 'Removed from the queue.' },
  { name: 'onQueueComplete', type: '(items) => void', description: 'Every started upload has settled.' },
  { name: 'onChange', type: '(items) => void', description: 'Any change to the queue, including progress.' },
];

const presetRows: PropRow[] = [
  { name: 'preset', type: 'PresetId | UploadPreset', default: "'essential'", description: <>Built-in id or a custom preset object. See <Link href="/docs/presets">Presets</Link>.</> },
  { name: 'renderFile', type: '(item, helpers) => ReactNode', description: 'Replace the per-file card. helpers: remove, cancel, retry, pause, resume, start, labels.' },
  { name: 'zoneContent', type: 'ReactNode', description: 'Replace the drop zone’s default content.' },
  { name: 'title / description', type: 'ReactNode', description: 'Headline overrides for presets that show one.' },
  { name: 'progressVariant', type: "'bar' | 'ring' | 'wave' | 'beam'", description: 'Progress style for list-based presets.' },
  { name: 'layout', type: "'list' | 'grid'", default: "'list'", description: 'Queue layout for list-based presets.' },
  { name: 'fileAnimations', type: 'Partial<Record<FileKind, FileVisualizer>>', description: <>Per-type visualizers for the <code>adaptive</code> preset.</> },
  { name: 'showRejections', type: 'boolean', default: 'true', description: 'Show the list of files that failed validation.' },
  { name: 'classNames', type: '{ root, zone, list, item, progress, actions }', description: 'Extra class names for internal parts.' },
];

export async function ComponentsDoc() {
  return (
    <>
      <H2 id="file-upload">{'<FileUpload>'}</H2>
      <p>The ready-made component: an animated preset on top of a complete uploader. It accepts every Uploader prop plus the preset props.</p>
      <Code
        code={`<FileUpload
  preset="segment-ring"
  upload={createXhrUploader({ url: '/api/upload' })}
  accept={['image/*', '.pdf']}
  maxFiles={8}
  retry={{ attempts: 2 }}
  appearance={{ theme: 'system', accent: '#0ea5e9' }}
  onQueueComplete={(items) => toast(\`\${items.length} files done\`)}
/>`}
      />
      <H3 id="preset-props">Preset props</H3>
      <PropTable rows={presetRows} />
      <H3 id="uploader-props">Uploader props</H3>
      <PropTable rows={uploaderRows} />
      <H3 id="callbacks">Lifecycle callbacks</H3>
      <PropTable rows={callbackRows} />

      <H2 id="uploader">{'<Uploader>'} + composable parts</H2>
      <p>
        <code>{'<Uploader>'}</code> owns the store, the hidden file input, theme variables and the screen-reader announcer. Put any
        parts inside it, in any layout.
      </p>
      <Code
        code={`<Uploader upload={upload} accept="image/*" appearance={{ radius: 10 }}>
  <header>
    <UploadSummary />
    <TransportBadge />
  </header>
  <UploadDropzone trackPointer>
    <DropzoneContent title="Drop product photos" />
  </UploadDropzone>
  <UploadRejections />
  <UploadFileList layout="grid" progressVariant="ring" allowPause />
  <StartUploadButton />
</Uploader>`}
      />
      <SimpleTable
        head={['Component', 'Key props', 'Purpose']}
        rows={[
          [<code key="1">UploadDropzone</code>, 'focusable, trackPointer, children', 'Drop target. Click opens the dialog, paste works while focused.'],
          [<code key="2">DropzoneContent</code>, 'icon, title', 'Default icon + headline + browse button + limits hint.'],
          [<code key="3">BrowseButton</code>, "variant: 'solid' | 'soft' | 'link' | 'icon'", 'Keyboard-accessible trigger for the file dialog.'],
          [<code key="4">StartUploadButton</code>, 'children', 'Starts pending files in manual mode and fills with progress.'],
          [<code key="5">UploadFileList</code>, 'layout, progressVariant, renderFile, items, allowPause', 'Animated queue with enter/exit and FLIP re-layout.'],
          [<code key="6">FileCard</code>, 'item, progressVariant, media, allowPause, celebrate', 'Default animated file row.'],
          [<code key="7">ItemActions / ItemStatus</code>, 'item', 'Context-aware buttons and plain-language status.'],
          [<code key="8">UploadProgress</code>, "value, status, variant, label, valueText, size", 'Standalone accessible progress (bar, ring, wave, beam).'],
          [<code key="9">FilePreview / FileIcon</code>, 'item, size / kind, label', 'Thumbnail with automatic object-URL cleanup, or a typed icon.'],
          [<code key="10">UploadSummary</code>, '–', '“Uploading 3 files · 63% · 6.4 MB/s · 5 seconds left”.'],
          [<code key="11">UploadRejections</code>, '–', 'Dismissible validation messages.'],
          [<code key="12">TransportBadge</code>, '–', 'Shows “Simulated” when the handler fakes progress.'],
          [<code key="13">AnimatedCheck / Burst</code>, 'size / count, spread, shape', 'Success effects that respect reduced motion.'],
          [<code key="14">AnimatedList</code>, 'items, renderItem, layout', 'Generic presence + FLIP list for your own collections.'],
          [<code key="15">BloomVisual, PageVisual, FilmstripVisual, WaveformVisual, PixelVisual</code>, 'item', 'Per-file visualizers from the media presets.'],
        ]}
      />
      <H2 id="context">useUploaderContext()</H2>
      <p>
        Inside <code>{'<Uploader>'}</code> or <code>{'<FileUpload>'}</code>, this hook returns everything: <code>items</code>,{' '}
        <code>totals</code>, <code>rejections</code>, <code>transport</code>, <code>dropzone</code>, actions (<code>start</code>,{' '}
        <code>cancel</code>, <code>retry</code>, <code>pause</code>, <code>resume</code>, <code>remove</code>, <code>clear</code>,{' '}
        <code>openFileDialog</code>), plus <code>labels</code>, <code>motion</code> and the accept <code>hint</code>.
      </p>
      <Code
        code={`function QueueBadge() {
  const { totals, labels } = useUploaderContext();
  return <span aria-live="polite">{labels.summary(totals)}</span>;
}`}
      />
    </>
  );
}

export async function HeadlessDoc() {
  return (
    <>
      <H2 id="use-uploader">useUploader()</H2>
      <p>All the state and behaviour with no markup. It takes every Uploader option and returns a snapshot plus actions and drag-and-drop helpers.</p>
      <Code
        code={`const uploader = useUploader({ upload, accept: 'image/*', maxFiles: 4 });

uploader.items;        // UploadItem[] – id, name, size, kind, status, progress, speed, eta, error, response…
uploader.totals;       // { progress, loaded, size, speed, eta, uploading, success, error, isComplete, … }
uploader.rejections;   // FileRejection[]
uploader.transport;    // 'network' | 'simulated' | 'none'

uploader.addFiles(fileList);
uploader.start(id?); uploader.cancel(id?); uploader.retry(id?);
uploader.pause(id?); uploader.resume(id?); uploader.remove(id); uploader.clear('completed');

const { getRootProps, getInputProps, isDragActive, dragState, isWindowDrag, open } = uploader.dropzone;`}
      />
      <Callout tone="tip" title="Accessible by construction">
        <p>
          <code>getRootProps({'{ focusable: true }'})</code> makes the zone a keyboard button (Enter/Space opens the dialog). Leave it off
          when the zone contains its own buttons. <code>trackPointer</code> writes <code>--um-px</code>/<code>--um-py</code> CSS
          variables without re-rendering.
        </p>
      </Callout>

      <H2 id="item-statuses">Item statuses</H2>
      <SimpleTable
        head={['Status', 'Meaning']}
        rows={[
          [<code key="p">pending</code>, 'Selected, waiting for start() (manual mode or no handler).'],
          [<code key="q">queued</code>, 'Waiting for a concurrency slot or a scheduled automatic retry (retryAt).'],
          [<code key="u">uploading</code>, 'Request in flight. progress, loaded, speed and eta update.'],
          [<code key="pa">paused</code>, 'Aborted by pause(). resume() re-queues it.'],
          [<code key="s">success</code>, 'Handler resolved. response holds the result.'],
          [<code key="e">error</code>, 'Handler failed. error is an UploadError.'],
          [<code key="c">canceled</code>, 'Aborted by cancel() or unmount. Can be retried.'],
        ]}
      />

      <H2 id="store">createUploadStore() – the core</H2>
      <p>
        The engine is framework-agnostic and available on its own from <code>upload-motion/core</code>, which has no React and no
        client directive, so it's safe on servers and in workers. It's designed to sit under future Vue and vanilla adapters.
      </p>
      <Code
        code={`import { createUploadStore, createXhrUploader } from 'upload-motion/core';

// Module-level store: uploads keep running while components mount/unmount.
export const uploads = createUploadStore({
  upload: createXhrUploader({ url: '/api/upload' }),
  concurrency: 2,
});

uploads.subscribe(() => console.log(uploads.getSnapshot().totals.progress));
uploads.on('success', (item) => console.log('done', item.name));`}
      />
      <Code
        title="Share it with React"
        code={`<FileUpload preset="wave-bar" store={uploads} />
// or
const { items } = useUploader({ store: uploads });
// or just subscribe:
const snapshot = useUploadSnapshot(uploads);`}
      />
      <p>
        When you pass <code>store</code>, props such as <code>accept</code> or <code>maxSize</code> are layered over the options the store
        was created with. Uploads are <strong>not</strong> aborted on unmount, because the store belongs to you. Call{' '}
        <code>store.dispose()</code> when you're done with it.
      </p>
      <H2 id="utilities">Utilities</H2>
      <SimpleTable
        head={['Function', 'Returns']}
        rows={[
          [<code key="1">getFileKind(file)</code>, "'image' | 'video' | 'audio' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'archive' | 'code' | 'data' | 'text' | 'unknown'"],
          [<code key="2">getFileLabel(file)</code>, 'Badge text such as PDF, DOCX, MP4'],
          [<code key="3">parseAccept / isFileAccepted / describeAccept</code>, 'Accept parsing, matching and human descriptions'],
          [<code key="4">formatBytes / formatSpeed / formatDuration / formatPercent</code>, '“6.4 MB”, “6.4 MB/s”, “5 seconds”, “63%”'],
          [<code key="5">isUploadError / toUploadError</code>, 'Safe error checks across bundle copies'],
          [<code key="7">presetCatalog</code>, 'Server-safe preset metadata (id, name, description, category, bestFor, defaults) from upload-motion/core'],
          [<code key="6">useFilePreview / useVideoFrames / useAudioPeaks / useTextSnippet</code>, 'Local media analysis hooks with cleanup'],
        ]}
      />
    </>
  );
}

export async function ThemingDoc() {
  return (
    <>
      <H2 id="appearance">The appearance prop</H2>
      <Code
        code={`<FileUpload
  preset="beam"
  appearance={{
    theme: 'dark',            // 'light' | 'dark' | 'system'
    accent: '#22c55e',
    accentSecondary: '#06b6d4',
    radius: 12,               // number (px) or any CSS length
    density: 'compact',       // 'compact' | 'comfortable' | 'spacious'
    shadow: 'elevated',       // 'none' | 'soft' | 'elevated' | any box-shadow
    fontFamily: 'Inter, sans-serif',
    zoneHeight: 280,
    // surface, background, text, mutedText, border, success, danger
  }}
/>`}
      />
      <H2 id="css-variables">CSS variables</H2>
      <p>
        Every token is a custom property on <code>.um-root</code>, so you can theme from CSS too, including per-route or with your
        design system's variables:
      </p>
      <Code
        lang="css"
        title="globals.css"
        code={`.um-root {
  --um-accent: var(--brand-500);
  --um-accent-2: var(--brand-300);
  --um-radius: 10px;
  --um-font: var(--font-sans);
}
.um-root[data-um-theme='dark'] {
  --um-surface: #0f172a;
}`}
      />
      <SimpleTable
        head={['Variable', 'Controls']}
        rows={[
          ['--um-accent / --um-accent-2', 'Brand colour and gradient end'],
          ['--um-surface / --um-surface-2 / --um-bg', 'Panel, subtle fill and root background'],
          ['--um-text / --um-muted / --um-border', 'Text, secondary text and borders'],
          ['--um-success / --um-danger / --um-warning', 'Status colours'],
          ['--um-radius / --um-gap / --um-shadow / --um-font', 'Shape, spacing, depth and typography'],
          ['--um-zone-h', 'Minimum drop-zone height'],
          ['--um-time / --um-intensity / --um-particles', 'Motion duration multiplier, amplitude and particle density'],
        ].map(([name, purpose]) => [<code key={name}>{name}</code>, purpose])}
      />
      <H2 id="motion">Motion controls</H2>
      <Code code={`<FileUpload motion={{ speed: 1.5, intensity: 0.6, particles: 0, reducedMotion: 'user' }} />`} />
      <ul>
        <li>
          <code>speed</code> scales every duration (0.25–4). <code>intensity</code> scales tilt, bounce and wobble (0–1.5).
        </li>
        <li>
          <code>particles</code> sets burst density, and <code>0</code> turns particles off completely.
        </li>
        <li>
          <code>reducedMotion</code>: <code>&apos;user&apos;</code> follows the OS setting, <code>&apos;always&apos;</code> forces calm
          mode, and <code>&apos;never&apos;</code> ignores it (use with care).
        </li>
      </ul>
      <H2 id="labels">Labels & i18n</H2>
      <Code
        code={`<FileUpload
  labels={{
    dropTitle: 'Arrastra archivos aquí',
    browse: 'Explorar',
    status: { uploading: 'Subiendo', success: 'Subido', error: 'Error' },
    timeLeft: (duration) => \`quedan \${duration}\`,
    summary: (t) => \`\${t.success}/\${t.count} subidos\`,
  }}
/>`}
      />
      <H2 id="class-names">Class names & data attributes</H2>
      <p>
        Use <code>className</code>, <code>style</code> and <code>classNames={'{ root, zone, list, item }'}</code> to hook in your own
        CSS. State is exposed as data attributes for styling: <code>data-um-theme</code>, <code>data-um-motion</code>,{' '}
        <code>data-um-drag</code> (<code>idle | accept | reject</code>), <code>data-status</code> and <code>data-kind</code> on
        items.
      </p>
      <Code lang="css" code={`.my-uploader .um-card[data-status='error'] { outline: 2px dashed var(--um-danger); }`} />
    </>
  );
}
