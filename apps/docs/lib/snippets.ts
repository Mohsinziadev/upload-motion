export const readyMadeSnippet = `import { FileUpload, createXhrUploader } from 'upload-motion';
import 'upload-motion/styles.css';

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
}`;

export const composableSnippet = `import {
  Uploader, UploadDropzone, DropzoneContent, UploadFileList,
  UploadSummary, UploadRejections, createXhrUploader,
} from 'upload-motion';

export function MediaPanel() {
  return (
    <Uploader
      upload={createXhrUploader({ url: '/api/media' })}
      accept="image/*,video/*"
      appearance={{ theme: 'dark', accent: '#22c55e', radius: 12 }}
    >
      <UploadSummary />
      <UploadDropzone>
        <DropzoneContent title="Drop media for your post" />
      </UploadDropzone>
      <UploadRejections />
      <UploadFileList layout="grid" progressVariant="ring" />
    </Uploader>
  );
}`;

export const headlessSnippet = `import { useUploader, createXhrUploader, formatBytes } from 'upload-motion';

export function MyDropzone() {
  const { items, totals, dropzone, cancel, retry } = useUploader({
    upload: createXhrUploader({ url: '/api/upload' }),
    maxFiles: 5,
  });

  return (
    <div {...dropzone.getRootProps({ focusable: true })} className="my-zone">
      <input {...dropzone.getInputProps()} />
      <p>{dropzone.isDragActive ? 'Drop it!' : 'Drag files or press Enter'}</p>
      <progress value={totals.progress} />
      {items.map((item) => (
        <div key={item.id}>
          {item.name} · {formatBytes(item.size)} · {item.status}
          {item.status === 'uploading' && <button onClick={() => cancel(item.id)}>Cancel</button>}
          {item.status === 'error' && <button onClick={() => retry(item.id)}>Retry</button>}
        </div>
      ))}
    </div>
  );
}`;

export function presetSnippet(id: string) {
  return `<FileUpload preset="${id}" upload={upload} />`;
}
