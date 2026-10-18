# upload-motion

**[Live demo and playground →](https://www.m2toolkit.com/npm-packages/upload-motion)**

Animated, accessible file uploads for React: 17 art-directed motion presets on top of a real upload engine with byte-level progress, retries, cancellation and validation.

- **Real uploads.** XHR transport with true progress, speed and ETA. Supports presigned PUTs to S3/R2/GCS, or bring your own handler.
- **17 presets.** Wave Bar, Card Fan, Hoop Shot, Segment Ring, Portal, Liquid Fill, Orbit, Image Bloom, Filmstrip, Audio Waveform and more.
- **A queue that behaves.** Concurrency, manual or auto start, pause/resume, cancel, retry with exponential backoff, single-file mode.
- **Validation in plain sentences.** For example: “report.pdf is 31 MB; the limit is 25 MB.” Messages are announced to screen readers.
- **Accessible.** Keyboard operable, ARIA progressbars, live-region announcements, and `prefers-reduced-motion` support.
- **Lightweight.** React is the only peer dependency, and there are no runtime dependencies. SSR-safe. A framework-agnostic core lives at `upload-motion/core`.
- **Honest.** Without a handler, files stay “selected”. Simulated transports are flagged and badged, so fake progress never passes as real.

## Install

```bash
npm install upload-motion
```

Import the stylesheet once (app entry or root layout):

```ts
import 'upload-motion/styles.css';
```

## Quick start

```tsx
'use client';

import { FileUpload, createXhrUploader } from 'upload-motion';

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
}
```

The file arrives as multipart form data in the `file` field. Any non-2xx response becomes an error, and a JSON `{ "error": "…" }` body is shown to the user.

> **Server components:** handlers and callbacks are functions, so render `<FileUpload>` from a `'use client'` file. `upload-motion/core` has no client directive and is safe to import on the server.

## Three ways to use it

### 1. Ready-made

```tsx
<FileUpload
  preset="segment-ring"
  upload={upload}
  maxFiles={8}
  retry={{ attempts: 2 }}
  appearance={{ theme: 'system', accent: '#0ea5e9', radius: 12 }}
  motion={{ speed: 1.2, particles: 0.5 }}
/>
```

### 2. Composable

```tsx
import { Uploader, UploadDropzone, DropzoneContent, UploadFileList, UploadSummary, UploadRejections } from 'upload-motion';

<Uploader upload={upload} accept="image/*,video/*">
  <UploadSummary />
  <UploadDropzone>
    <DropzoneContent title="Drop media for your post" />
  </UploadDropzone>
  <UploadRejections />
  <UploadFileList layout="grid" progressVariant="ring" allowPause />
</Uploader>;
```

### 3. Headless

```tsx
import { useUploader } from 'upload-motion';

const { items, totals, dropzone, cancel, retry } = useUploader({ upload, maxFiles: 5 });

<div {...dropzone.getRootProps({ focusable: true })}>
  <input {...dropzone.getInputProps()} />
  {dropzone.isDragActive ? 'Drop it!' : 'Drag files or press Enter'}
</div>;
```

Or use the engine without React:

```ts
import { createUploadStore, createXhrUploader } from 'upload-motion/core';

const store = createUploadStore({ upload: createXhrUploader({ url: '/api/upload' }) });
store.subscribe(() => console.log(store.getSnapshot().totals.progress));
store.addFiles(fileList);
```

## Presets

| Preset | Character | Best for |
| --- | --- | --- |
| `card-fan` | Media cards fan out as files approach; manual Upload button | Media libraries, CMS |
| `wave-bar` | Compact pill with a travelling wave and pause/cancel/expand | Dashboards, cloud storage |
| `hoop-shot` | Aim and shoot files into a hoop with real physics; keyboard “Shoot all” | Consumer apps, onboarding |
| `essential` | Quiet, professional list | Admin panels, forms |
| `segment-ring` | One dial, one arc per file | Batch uploads |
| `beam` | Rotating gradient border beam | Dev tools, dark UIs |
| `magnetic` | Pointer-reactive dot field | Landing pages |
| `portal` | Files spiral into a rotating portal | Consumer, creative |
| `liquid` | The zone fills like a vessel | Single large uploads |
| `stack` | 3D deck with a done tray | Review queues |
| `orbit` | Files orbit and fall into a core | Multi-file batches |
| `bloom` | Images bloom from blur to colour | Photo galleries |
| `page-reveal` | Pages inked by a scan line (real text for text files) | Document management |
| `filmstrip` | Real frames extracted from videos | Video platforms |
| `waveform` | Real decoded audio waveform with preview playback | Podcasts, music |
| `pixel` | Files assemble from 64 flying pixels | Creative tools |
| `adaptive` | Picks a per-file motion by type (`fileAnimations` to override) | Mixed media |

## Upload handlers

```ts
type UploadHandler<T> = (ctx: {
  file: File;
  item: UploadItem;
  signal: AbortSignal; // aborted on cancel/pause/remove/unmount
  attempt: number;
  onProgress: (loaded: number, total?: number) => void;
}) => Promise<T>;
```

Built-ins:

- `createXhrUploader({ url, method, body: 'form-data' | 'raw', headers, formData, fieldName, timeout, withCredentials, parseResponse })`
- `createSimulatedUploader({ speed, failureRate })` (demos only, always badged as simulated)

Presigned upload example:

```ts
const upload = createXhrUploader({
  method: 'PUT',
  body: 'raw',
  url: async (item) => (await fetch('/api/presign', { method: 'POST', body: JSON.stringify({ name: item.name }) }).then((r) => r.json())).url,
  headers: (item) => ({ 'Content-Type': item.type || 'application/octet-stream' }),
});
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `upload` | – | Transport. Without it, files stay `pending`. |
| `accept` | – | `"image/*,.pdf"` or an array |
| `maxSize` / `minSize` | – | Bytes per file |
| `maxFiles` | – | Max files in the queue |
| `multiple` | `true` | `false` = single file that replaces the current one |
| `validate` | – | `(file, { items }) => string \| null` |
| `autoUpload` | `true` (`card-fan`, `hoop-shot`: `false`) | Start on add |
| `concurrency` | `3` | Parallel uploads |
| `retry` | `0` | `number` or `{ attempts, delay }` with exponential backoff |
| `store` | – | External store (uploads survive unmount) |
| `appearance` | – | `{ theme, accent, accentSecondary, radius, density, shadow, fontFamily, zoneHeight, … }` |
| `motion` | – | `{ speed, intensity, particles, reducedMotion: 'user' \| 'always' \| 'never' }` |
| `labels` | – | Override any string (i18n) |
| `renderFile`, `zoneContent`, `classNames`, `progressVariant`, `layout`, `fileAnimations` | – | Preset customisation |

Callbacks: `onFilesAdded`, `onFilesRejected`, `onUploadStart`, `onUploadProgress`, `onUploadSuccess`, `onUploadError`, `onUploadCancel`, `onFileRemoved`, `onQueueComplete`, `onChange`.

## Theming

Every token is a CSS custom property on `.um-root` (`--um-accent`, `--um-accent-2`, `--um-surface`, `--um-text`, `--um-radius`, `--um-time`, …), so you can theme with the `appearance` prop or plain CSS. State is exposed as data attributes (`data-um-theme`, `data-um-drag`, `data-status`, `data-kind`).

## Size

| What you import | Added to a production app (min + gzip) |
| --- | --- |
| `upload-motion/core` only (no React) | ≈ 8 kB |
| `useUploader` (headless) | ≈ 9 kB |
| `Uploader` + dropzone + file list | ≈ 15 kB |
| `FileUpload` with all 17 presets | ≈ 28 kB |
| `styles.css` (all presets) | ≈ 15 kB |

Measured for v0.1.0 in a Vite 8 production build, compared with a React-only baseline.

## Browser support

The latest two versions of Chrome, Edge, Firefox and Safari (2024+). Some effects use `color-mix()`, `@property`, container queries and `linear()` easing, and degrade gracefully where those are missing.

## License

MIT
