import Link from 'next/link';
import { Code } from '@/components/Code';
import { Callout, H2, H3, SimpleTable } from './ui';

export async function UploadHandlersDoc() {
  return (
    <>
      <p>
        A handler is one async function per file. upload-motion owns the queue, state and UI. You own where the bytes go.
      </p>
      <Code
        code={`type UploadHandler<T> = (ctx: {
  file: File;
  item: UploadItem;               // id, name, size, kind, attempts…
  signal: AbortSignal;            // aborted on cancel / pause / remove / unmount
  attempt: number;                // 1-based
  onProgress: (loaded: number, total?: number) => void;
}) => Promise<T>;                 // resolve = success, reject/throw = error`}
      />
      <H2 id="xhr">Multipart POST – createXhrUploader</H2>
      <Code
        code={`const upload = createXhrUploader({
  url: '/api/upload',
  fieldName: 'file',                          // default
  headers: async () => ({ Authorization: \`Bearer \${await getToken()}\` }),
  formData: (item) => ({ folder: 'avatars', clientId: item.id }),
  withCredentials: false,
  timeout: 120_000,
  parseResponse: (xhr) => JSON.parse(xhr.responseText) as { url: string },
});`}
      />
      <p>
        It uses <code>XMLHttpRequest</code> on purpose: it's the only browser API with upload progress events for request bodies
        over HTTP/1.1 and HTTP/2. Non-2xx responses become <code>UploadError</code>s, and a JSON <code>{'{ "error": "…" }'}</code> body is
        shown to users as the message.
      </p>
      <H2 id="presigned">Direct-to-storage with presigned URLs (S3, R2, GCS)</H2>
      <p>Ask your server for a signed URL per file, then PUT the raw bytes. Large files never touch your server.</p>
      <Code
        code={`const upload = createXhrUploader({
  method: 'PUT',
  body: 'raw',
  url: async (item) => {
    const res = await fetch('/api/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: item.name, type: item.type, size: item.size }),
    });
    if (!res.ok) throw new Error('Could not prepare the upload');
    return (await res.json()).url;
  },
  headers: (item) => ({ 'Content-Type': item.type || 'application/octet-stream' }),
  parseResponse: (xhr) => ({ etag: xhr.getResponseHeader('ETag') }),
});`}
      />
      <Callout tone="warn" title="CORS">
        <p>
          Your bucket's CORS policy must allow your origin, the <code>PUT</code> method and the <code>Content-Type</code> header, and it
          must expose <code>ETag</code> if you read it.
        </p>
      </Callout>
      <H2 id="custom">Write your own handler</H2>
      <p>Anything that returns a promise works: SDKs, GraphQL, tus, WebSockets. Report progress, respect the signal, throw on failure:</p>
      <Code
        title="chunked-upload.ts"
        code={`import { UploadError, type UploadHandler } from 'upload-motion';

const CHUNK = 5 * 1024 * 1024;

export const chunkedUpload: UploadHandler<{ id: string }> = async ({ file, signal, onProgress }) => {
  const { id, offset: resumeFrom } = await fetch('/api/uploads', {
    method: 'POST',
    body: JSON.stringify({ name: file.name, size: file.size }),
    signal,
  }).then((r) => r.json());

  // Resuming after pause/retry: the server tells us how much it already has.
  for (let offset = resumeFrom; offset < file.size; offset += CHUNK) {
    const res = await fetch(\`/api/uploads/\${id}?offset=\${offset}\`, {
      method: 'PATCH',
      body: file.slice(offset, offset + CHUNK),
      signal,
    });
    if (!res.ok) throw new UploadError('http', \`Chunk failed (HTTP \${res.status})\`, { status: res.status });
    onProgress(Math.min(offset + CHUNK, file.size), file.size);
  }
  return { id };
};`}
      />
      <H2 id="simulated">Simulated transport (demos only)</H2>
      <Code code={`const upload = createSimulatedUploader({ speed: [1e6, 4e6], failureRate: 0.2 });`} />
      <p>
        Nothing is sent. The handler is flagged <code>simulated: true</code>, <code>transport</code> becomes{' '}
        <code>&apos;simulated&apos;</code> and every built-in preset shows a <strong>Simulated</strong> badge. Use it for prototypes and
        demos, never in production.
      </p>
      <H2 id="no-handler">No handler at all</H2>
      <p>
        Without <code>upload</code>, the component is a validated file picker: files stay <code>pending</code> and show
        “Selected – no upload handler configured”. That's handy when you submit files with a form yourself. Read them from{' '}
        <code>onChange</code> or a store.
      </p>
    </>
  );
}

export async function ProgressDoc() {
  return (
    <>
      <H2 id="what-is-measured">What progress means</H2>
      <ul>
        <li>
          <strong>progress</strong> (0–1) is the fraction of request bytes your handler reported through <code>onProgress</code>. It never
          moves backwards within an attempt.
        </li>
        <li>
          <strong>speed</strong> is an exponentially smoothed bytes/second sample (every 250 ms or more), and <strong>eta</strong> is the
          remaining bytes divided by speed.
        </li>
        <li>
          <strong>totals.progress</strong> is weighted by file size across queued, uploading, paused and finished files. Failed and
          canceled files are excluded so the bar doesn't stall.
        </li>
        <li>
          At 100% the file stays <code>uploading</code> until the server responds, and the UI says “Finishing…”. Success is only shown after
          your handler resolves.
        </li>
      </ul>
      <H2 id="network-reality">Network realities</H2>
      <p>
        Browsers report bytes handed to the network stack. On localhost or fast links small files can jump straight to 100%. Proxies
        that buffer request bodies can also make progress look instant, followed by a long “Finishing…”. Both are accurate reports of
        what the browser saw.
      </p>
      <Callout tone="tip" title="See real progress in the playground">
        <p>
          Switch the <Link href="/playground">playground</Link> to <strong>Real network</strong> and lower the server read throttle.
          The demo endpoint reads the body slowly, TCP backpressure slows the browser, and the progress you watch is genuine.
        </p>
      </Callout>
      <H2 id="render-cost">Rendering cost</H2>
      <p>
        Progress ticks are batched into one store notification per animation frame. Status changes notify immediately. Built-in
        animations use transforms, opacity and clip-path driven by a single <code>--um-p</code> CSS variable per element.
      </p>
      <H2 id="standalone">Standalone progress indicators</H2>
      <Code
        code={`<UploadProgress value={0.42} variant="ring" label="avatar.png" valueText="42%, 3 seconds left" />
<UploadProgress value={totals.progress} variant="wave" status={totals.isComplete ? 'success' : 'uploading'} />`}
      />
    </>
  );
}

export async function ValidationDoc() {
  return (
    <>
      <Code
        code={`<FileUpload
  accept="image/*,.pdf,application/json"
  maxSize={10 * 1024 * 1024}
  minSize={1}
  maxFiles={6}
  validate={(file, { items }) =>
    items.some((item) => item.name === file.name) ? \`\${file.name} is already in the list\` : null
  }
  onFilesRejected={(rejections) => track('upload_rejected', rejections.map((r) => r.errors[0].code))}
/>`}
      />
      <H2 id="rules">Rules and messages</H2>
      <SimpleTable
        head={['Code', 'When', 'Example message']}
        rows={[
          [<code key="1">file-invalid-type</code>, 'Doesn’t match accept', '“notes.txt isn’t an accepted file type (Images, PDF, JSON).”'],
          [<code key="2">file-too-large</code>, 'size > maxSize', '“raw.mov is 61.2 MB; the limit is 10 MB.”'],
          [<code key="3">file-too-small</code>, 'size < minSize', '“empty.csv is smaller than the 1 B minimum.”'],
          [<code key="4">too-many-files</code>, 'Queue full / single mode', '“You can add up to 6 files – photo.png was skipped.”'],
          [<code key="5">custom</code>, 'validate returned a string', 'Your message'],
        ]}
      />
      <p>
        Sizes in messages use 1024-based units, so <code>maxSize={'{10 * 1024 * 1024}'}</code> reads back as “10 MB”.
      </p>
      <p>
        <code>accept</code> follows the browser's rules: <code>.ext</code> matches extensions, <code>type/*</code> matches MIME
        prefixes, and full MIME types match exactly. While a file is being dragged, MIME-only rules give instant “can't drop this”
        feedback (<code>data-um-drag=&quot;reject&quot;</code>). Extension rules are checked on drop, because browsers hide file names
        during a drag.
      </p>
      <Callout title="Not colour alone">
        <p>
          Rejections render as text with an icon, are announced through an assertive live region, and can be dismissed with the keyboard.
          Validation runs on the client for UX. Always validate again on the server.
        </p>
      </Callout>
    </>
  );
}

export async function MultipleFilesDoc() {
  return (
    <>
      <H2 id="queue">The queue</H2>
      <p>
        Files upload in the order they were added, at most <code>concurrency</code> at a time (default 3). Each file has its own status,
        progress, error and response, and one failure never blocks the rest.
      </p>
      <Code
        code={`<FileUpload
  preset="essential"
  upload={upload}
  concurrency={2}
  maxFiles={20}
  autoUpload={false}         // files wait as "pending" until started
/>`}
      />
      <H2 id="manual">Manual start</H2>
      <p>
        With <code>autoUpload={'{false}'}</code>, users review files first. <code>{'<StartUploadButton>'}</code> (built into{' '}
        <code>card-fan</code>) calls <code>start()</code>. Per-file upload buttons call <code>start(id)</code>. <code>hoop-shot</code>{' '}
        starts a file when it scores.
      </p>
      <H2 id="single">Single-file mode</H2>
      <p>
        <code>multiple={'{false}'}</code> limits the queue to one file, and choosing another replaces it (aborting any upload in progress). Good for
        avatars and documents.
      </p>
      <H2 id="manage">Removing and clearing</H2>
      <Code
        code={`const { remove, clear } = useUploaderContext();
remove(item.id);          // aborts if needed, animates out
clear('completed');       // 'all' | 'completed' | 'failed' | 'canceled'`}
      />
      <H3 id="persist">Keeping uploads alive across pages</H3>
      <p>
        Create the store at module level and pass it as <code>store</code>. Navigation unmounts components but not the store, so uploads
        continue and any component can show them. See <Link href="/docs/headless#store">Headless</Link>.
      </p>
    </>
  );
}

export async function ErrorsDoc() {
  return (
    <>
      <H2 id="upload-error">UploadError</H2>
      <SimpleTable
        head={['code', 'Typical cause', 'Retryable by default']}
        rows={[
          [<code key="1">network</code>, 'Offline, DNS, connection reset, CORS failure', 'Yes'],
          [<code key="2">timeout</code>, 'Request exceeded timeout', 'Yes'],
          [<code key="3">http</code>, 'Non-2xx response (status set)', '5xx, 408 and 429 yes, other 4xx no'],
          [<code key="4">handler</code>, 'Your handler threw a non-UploadError', 'Yes'],
          [<code key="5">invalid-response</code>, 'parseResponse threw', 'No'],
          [<code key="6">aborted</code>, 'Signal aborted (treated as canceled)', 'No'],
        ]}
      />
      <Code
        code={`throw new UploadError('http', 'Quota exceeded – upgrade your plan', { status: 402, retryable: false });`}
      />
      <H2 id="retries">Automatic retries</H2>
      <Code code={`<FileUpload upload={upload} retry={{ attempts: 3, delay: 1000 }} /> // waits 1s, 2s, 4s`} />
      <p>
        While a retry is scheduled the file is <code>queued</code> with <code>retryAt</code> set, and the UI says “Retrying in 2s…”
        along with the last error. Only after the final attempt fails do <code>error</code> status and <code>onUploadError</code>{' '}
        happen.
      </p>
      <H2 id="manual-retry">Manual retry, cancel, remove</H2>
      <ul>
        <li>
          <strong>Cancel</strong> aborts the request through <code>AbortSignal</code> and leaves the file as <code>canceled</code>, so it can be retried.
        </li>
        <li>
          <strong>Retry</strong> re-queues <code>error</code> or <code>canceled</code> files from zero and resets the automatic-retry budget.
        </li>
        <li>
          <strong>Remove</strong> aborts and deletes the file from the queue.
        </li>
        <li>
          <strong>Unmounting</strong> an uploader that owns its store aborts its uploads. Use an external store to keep them running.
        </li>
      </ul>
      <H2 id="pause">Pause and resume</H2>
      <p>
        <code>pause()</code> aborts the in-flight request and marks the file <code>paused</code>. The last progress is kept for display.{' '}
        <code>resume()</code> re-queues it, and the handler runs again with <code>attempt + 1</code>. HTTP can't resume a request body
        by itself, so byte-level resumption needs a resumable protocol: see the <Link href="/docs/upload-handlers#custom">chunked
        handler example</Link>. Otherwise the transfer restarts and the progress bar honestly rewinds.
      </p>
      <H2 id="ui">How errors look</H2>
      <p>
        Failed files show an alert icon, the word “Failed” for screen readers, the message in text, a red outline and a short shake
        (skipped under reduced motion). Retry is always the first action.
      </p>
    </>
  );
}

export async function AccessibilityDoc() {
  return (
    <>
      <H2 id="keyboard">Keyboard</H2>
      <ul>
        <li>Every preset has a real button for opening the file dialog. Focusable zones also respond to Enter and Space.</li>
        <li>Every per-file action is a labelled button, such as “Retry report.pdf” or “Cancel clip.mp4”.</li>
        <li>Menus support arrow keys, Home/End and Escape, and focus returns to the trigger.</li>
        <li>Hoop Shot: Enter on the file token takes a perfect shot, and “Shoot all” uploads everything without aiming.</li>
        <li>Paste files with Ctrl/⌘+V while a zone is focused.</li>
      </ul>
      <H2 id="screen-readers">Screen readers</H2>
      <ul>
        <li>A polite live region announces additions, starts, completions and cancellations. An assertive one announces errors and rejections.</li>
        <li>Progress uses <code>role=&quot;progressbar&quot;</code> with <code>aria-valuenow</code> and readable <code>aria-valuetext</code> (“42%, 3 seconds left”).</li>
        <li>Decorative layers (particles, orbits, duplicated liquid text) are <code>aria-hidden</code>. Off-screen deck cards are <code>inert</code>.</li>
        <li>Errors are never shown with colour alone: there's always text and an icon.</li>
      </ul>
      <H2 id="reduced-motion">Reduced motion</H2>
      <p>
        With <code>prefers-reduced-motion: reduce</code> (or <code>motion={'{{ reducedMotion: "always" }}'}</code>), the root gets{' '}
        <code>data-um-motion=&quot;reduced&quot;</code>. Animations and transitions collapse to instant state changes, particles are
        removed, list exits and FLIP are skipped, and the hoop shot scores instantly. All information stays.
      </p>
      <H2 id="custom-renderers">When you customise</H2>
      <ul>
        <li>
          Use <code>ItemActions</code>, <code>ItemStatus</code> and <code>UploadProgress</code> in <code>renderFile</code> to keep the
          labels and ARIA wiring.
        </li>
        <li>Don't nest buttons inside a focusable zone. Use <code>focusable</code> only for zones without inner controls.</li>
        <li>Keep a visible focus style if you override <code>:focus-visible</code>.</li>
      </ul>
    </>
  );
}

export async function PerformanceDoc() {
  return (
    <>
      <H2 id="rendering">Rendering strategy</H2>
      <ul>
        <li>Progress notifications are batched per animation frame and pause in background tabs.</li>
        <li>Items are immutable, so <code>FileCard</code>, <code>VisualRow</code> and tiles are memoised and only the file that changed re-renders.</li>
        <li>Animations use transform, opacity and clip-path. Pointer tracking writes CSS variables without React renders.</li>
        <li>List items use <code>content-visibility: auto</code>, so off-screen rows in long queues skip layout and paint.</li>
        <li>Pixel Assembly animates 64 cells from one CSS variable, with no per-cell React updates.</li>
      </ul>
      <H2 id="large-queues">Large queues</H2>
      <p>
        Hundreds of files work, but for thousands use <code>useUploader</code> with a virtualised list (for example{' '}
        <code>@tanstack/react-virtual</code>) and render <code>UploadProgress</code> per visible row. Keep <code>concurrency</code>{' '}
        modest (2–4). Browsers allow about 6 connections per origin over HTTP/1.1.
      </p>
      <H2 id="media">Previews and media analysis</H2>
      <SimpleTable
        head={['Feature', 'Limit / behaviour']}
        rows={[
          ['Image thumbnails', 'Object URLs for previewable images up to 25 MB, revoked on unmount. Lazy, async decoding.'],
          ['Video frames', 'Six 160px JPEG frames per video, seeked locally. Unsupported codecs fall back to icons.'],
          ['Audio waveforms', 'Decoded with Web Audio for files up to 30 MB, sampling every 16th value. Larger files get a stable pseudo-waveform.'],
          ['Text snippets', 'First 2 KB of text, CSV, JSON or code files under 2 MB.'],
        ]}
      />
      <H2 id="bundle">Bundle size</H2>
      <p>
        No runtime dependencies. The headless engine is a separate entry (<code>upload-motion/core</code>), and all preset styles are a
        single CSS file. The <Link href="/">home page</Link> shows gzip sizes measured from the current build. ESM and CJS builds are
        both provided, with <code>sideEffects</code> limited to CSS so bundlers can tree-shake unused exports.
      </p>
      <SimpleTable
        head={['What you import', 'Added to a production app (min + gzip)']}
        rows={[
          [<code key="1">upload-motion/core</code>, '≈ 8 kB'],
          [<code key="2">useUploader</code>, '≈ 9 kB'],
          [<code key="3">Uploader + UploadDropzone + UploadFileList</code>, '≈ 15 kB'],
          [<code key="4">FileUpload (all 17 presets)</code>, '≈ 28 kB'],
          [<code key="5">styles.css</code>, '≈ 15 kB'],
        ]}
      />
      <p className="muted">Measured for v0.1.0 in a Vite 8 production build, compared with a React-only baseline.</p>
    </>
  );
}

export async function ExamplesDoc() {
  return (
    <>
      <H2 id="nextjs">Next.js App Router</H2>
      <Code
        title="app/upload/page.tsx"
        code={`import { Uploader } from './uploader';
export default function Page() {
  return <Uploader />;   // server component renders the client uploader
}`}
      />
      <Code
        title="app/upload/uploader.tsx"
        code={`'use client';
import { FileUpload, createXhrUploader } from 'upload-motion';

const upload = createXhrUploader<{ url: string }>({ url: '/api/upload' });

export function Uploader() {
  return <FileUpload preset="adaptive" upload={upload} maxSize={50 * 1024 * 1024} />;
}`}
      />
      <H2 id="express">Express + multer</H2>
      <Code
        lang="js"
        title="server.js"
        code={`import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 25 * 1024 * 1024 } });

app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ id: req.file.filename, name: req.file.originalname });
});

app.use((err, req, res, next) => {
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500).json({ error: err.message });
});`}
      />
      <H2 id="presign-route">Presign route (S3 / R2)</H2>
      <Code
        title="app/api/presign/route.ts"
        code={`import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(request: Request) {
  const { name, type, size } = await request.json();
  if (size > 500 * 1024 * 1024) return Response.json({ error: 'Max 500 MB' }, { status: 413 });
  const key = \`uploads/\${crypto.randomUUID()}-\${name}\`;
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: process.env.BUCKET, Key: key, ContentType: type }), {
    expiresIn: 600,
  });
  return Response.json({ url, key });
}`}
      />
      <p>
        Pair it with the presigned handler in <Link href="/docs/upload-handlers#presigned">Upload handlers</Link>. The AWS SDK is only
        needed on your server.
      </p>
      <H2 id="forms">Inside a form</H2>
      <Code
        code={`function ProfileForm() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  return (
    <form action={saveProfile}>
      <FileUpload
        preset="liquid"
        multiple={false}
        accept="image/*"
        upload={createXhrUploader<{ url: string }>({ url: '/api/avatar' })}
        onUploadSuccess={(_, res) => setAvatarUrl(res.url)}
        onFileRemoved={() => setAvatarUrl(null)}
      />
      <input type="hidden" name="avatarUrl" value={avatarUrl ?? ''} />
      <button disabled={!avatarUrl}>Save</button>
    </form>
  );
}`}
      />
      <H2 id="vite">Vite / CRA / Remix</H2>
      <p>
        Nothing framework-specific is required. Import <code>upload-motion/styles.css</code> once and render the component. The package
        works anywhere React 18.2+ runs.
      </p>
    </>
  );
}

export async function TroubleshootingDoc() {
  return (
    <>
      <H3 id="unstyled">The uploader is unstyled</H3>
      <p>
        Import <code>upload-motion/styles.css</code> once, in your root layout or entry file. CSS-in-JS setups also need the file
        loaded globally.
      </p>
      <H3 id="functions-server">“Functions cannot be passed directly to Client Components”</H3>
      <p>
        You passed <code>upload</code> or a callback from a Server Component. Move the uploader into a <code>&apos;use client&apos;</code>{' '}
        file and create the handler there.
      </p>
      <H3 id="drop-ignored">Dropping files opens them in the browser or does nothing</H3>
      <p>
        Another library may be handling <code>dragover</code>/<code>drop</code> on the window. upload-motion prevents navigation for
        drops outside zones unless <code>preventWindowDrop={'{false}'}</code>. Make sure no overlay with{' '}
        <code>pointer-events</code> sits above the zone.
      </p>
      <H3 id="instant">Progress jumps straight to 100%</H3>
      <p>
        Expected for small files on fast networks or behind buffering proxies. See <Link href="/docs/progress#network-reality">Progress</Link>.
      </p>
      <H3 id="413">Uploads fail with HTTP 413 on serverless hosting</H3>
      <p>
        Many serverless platforms cap request bodies at a few megabytes. Upload directly to object storage with presigned URLs instead.
      </p>
      <H3 id="cors">Presigned uploads fail with a network error</H3>
      <p>
        That's almost always CORS on the bucket. Allow <code>PUT</code>, your origin and the <code>Content-Type</code> header.
      </p>
      <H3 id="frames">No video frames or waveform</H3>
      <p>
        The browser must be able to decode the file. HEVC <code>.mov</code> files often can't be decoded in Chrome, and audio over 30 MB
        uses a pseudo-waveform on purpose. Uploading is unaffected.
      </p>
      <H3 id="testing">Testing components that use upload-motion</H3>
      <p>
        Use jsdom with <code>@testing-library/react</code>. Pass a handler that returns a promise you control, or create a store and
        call <code>store.addFiles()</code> directly. <code>matchMedia</code> and <code>ResizeObserver</code> may need simple stubs in
        jsdom.
      </p>
      <Callout tone="tip" title="Still stuck?">
        <p>
          Reproduce it in the <Link href="/playground">playground</Link>. Its lifecycle log shows every callback and error message as it
          happens.
        </p>
      </Callout>
    </>
  );
}
