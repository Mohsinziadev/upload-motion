import { useMemo, useState, type CSSProperties } from 'react';
import { formatBytes, formatDuration, formatSpeed, useUploader, type UploadItem } from 'upload-motion';
import { createSampleSet, type SampleKind } from '../lib/samples';
import { createDemoUploader } from './demo';
import { CodeBlock, Segmented } from './ui';

const BATCH: SampleKind[] = ['image', 'pdf', 'csv', 'audio', 'json', 'zip', 'text'];

const HEADLESS_CODE = `import { useUploader, createXhrUploader, formatBytes } from 'upload-motion';

export function Queue() {
  const { items, totals, dropzone, pause, resume, cancel, retry } = useUploader({
    upload: createXhrUploader({ url: '/api/upload' }),
    concurrency: 2,
    retry: { attempts: 2 },          // 800 ms, then 1.6 s backoff
  });

  return (
    <div {...dropzone.getRootProps({ focusable: true })}>
      <input {...dropzone.getInputProps()} />
      <progress value={totals.progress} />
      {items.map((item) => (
        <Row key={item.id} item={item} onRetry={() => retry(item.id)} />
      ))}
    </div>
  );
}`;

const STATUS_LABEL: Record<UploadItem['status'], string> = {
  pending: 'Pending',
  queued: 'Queued',
  uploading: 'Uploading',
  paused: 'Paused',
  success: 'Done',
  error: 'Failed',
  canceled: 'Canceled',
};

function Row({ item, onRetry, onCancel }: { item: UploadItem; onRetry: () => void; onCancel: () => void }) {
  const retrying = item.status === 'queued' && item.retryAt !== null;
  const detail =
    item.status === 'uploading'
      ? [formatSpeed(item.speed), item.eta ? `${formatDuration(item.eta)} left` : ''].filter(Boolean).join(' · ')
      : retrying
        ? `Retrying in ${Math.max(1, Math.ceil(((item.retryAt ?? 0) - Date.now()) / 1000))}s · ${item.error?.message ?? ''}`
        : item.status === 'error'
          ? item.error?.message
          : item.status === 'queued'
            ? 'Waiting for a free slot'
            : formatBytes(item.size);
  return (
    <li className="lab-row" data-status={retrying ? 'retrying' : item.status}>
      <span className="lab-status">{retrying ? 'Retrying' : STATUS_LABEL[item.status]}</span>
      <span className="lab-name" title={item.name}>
        {item.name}
      </span>
      <span className="lab-detail">{detail}</span>
      <span
        className="lab-bar"
        role="progressbar"
        aria-label={item.name}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(item.progress * 100)}
        style={{ '--p': item.status === 'success' ? 1 : item.progress } as CSSProperties}
      />
      <span className="lab-actions">
        {item.status === 'error' || item.status === 'canceled' ? (
          <button type="button" className="btn btn-ghost btn-xs" onClick={onRetry} aria-label={`Retry ${item.name}`}>
            Retry
          </button>
        ) : item.status === 'uploading' || item.status === 'queued' || item.status === 'paused' ? (
          <button type="button" className="btn btn-ghost btn-xs" onClick={onCancel} aria-label={`Cancel ${item.name}`}>
            Cancel
          </button>
        ) : null}
      </span>
    </li>
  );
}

export function EngineLab() {
  const [concurrency, setConcurrency] = useState<'1' | '2' | '4'>('2');
  const [failure, setFailure] = useState<'0' | '0.3' | '0.6'>('0.3');
  const [retries, setRetries] = useState<'0' | '2'>('2');
  const [loading, setLoading] = useState(false);
  const upload = useMemo(() => createDemoUploader(Number(failure)), [failure]);
  const uploader = useUploader({
    upload,
    concurrency: Number(concurrency),
    retry: { attempts: Number(retries), delay: 800 },
  });
  const { items, totals } = uploader;

  const addBatch = async () => {
    setLoading(true);
    try {
      uploader.addFiles(await createSampleSet(BATCH));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lab">
      <div className="lab-panel">
        <div className="lab-controls">
          <Segmented label="Concurrency" value={concurrency} onChange={setConcurrency} options={[{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '4', label: '4' }]} />
          <Segmented label="Failure rate" value={failure} onChange={setFailure} options={[{ value: '0', label: '0%' }, { value: '0.3', label: '30%' }, { value: '0.6', label: '60%' }]} />
          <Segmented label="Auto retries" value={retries} onChange={setRetries} options={[{ value: '0', label: 'Off' }, { value: '2', label: '2×' }]} />
        </div>

        <div className="lab-summary">
          <div className="lab-total" role="progressbar" aria-label="Whole batch" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(totals.progress * 100)}>
            <span style={{ '--p': totals.progress } as CSSProperties} />
          </div>
          <dl className="lab-stats">
            <div>
              <dt>Uploading</dt>
              <dd>{totals.uploading}</dd>
            </div>
            <div>
              <dt>Queued</dt>
              <dd>{totals.queued}</dd>
            </div>
            <div>
              <dt>Done</dt>
              <dd>{totals.success}</dd>
            </div>
            <div>
              <dt>Failed</dt>
              <dd>{totals.error}</dd>
            </div>
            <div>
              <dt>Speed</dt>
              <dd>{totals.speed > 0 ? formatSpeed(totals.speed) : '–'}</dd>
            </div>
          </dl>
        </div>

        <div
          {...uploader.dropzone.getRootProps({ 'aria-label': 'Engine lab queue' })}
          className="lab-queue"
          data-drag={uploader.dropzone.dragState}
        >
          <input {...uploader.dropzone.getInputProps()} />
          {items.length === 0 ? (
            <div className="lab-empty">
              <p>Load a batch of seven files and watch the queue work.</p>
              <p className="muted">Or drop your own files here.</p>
            </div>
          ) : (
            <ol className="lab-rows">
              {items.map((item) => (
                <Row key={item.id} item={item} onRetry={() => uploader.retry(item.id)} onCancel={() => uploader.cancel(item.id)} />
              ))}
            </ol>
          )}
        </div>

        <div className="lab-actions-bar">
          <button type="button" className="btn btn-primary btn-sm" onClick={addBatch} disabled={loading}>
            {loading ? 'Generating…' : 'Load 7 files'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => uploader.pause()} disabled={totals.active === 0}>
            Pause all
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => uploader.resume()} disabled={totals.paused === 0}>
            Resume
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => uploader.retry()} disabled={totals.error + totals.canceled === 0}>
            Retry failed
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => uploader.clear()} disabled={items.length === 0}>
            Clear
          </button>
        </div>
      </div>

      <div className="lab-side">
        <CodeBlock code={HEADLESS_CODE} title="Queue.tsx" />
        <ul className="checklist">
          <li>
            <b>Honest by design.</b> No handler, no “uploaded”. Simulated transports are flagged and badged.
          </li>
          <li>
            <b>Progress never runs backwards</b> within an attempt, and 100% waits for the server before it says done.
          </li>
          <li>
            <b>Retries with backoff</b> only for retryable failures: network, timeouts, 5xx, 408 and 429.
          </li>
          <li>
            <b>Bring any backend.</b> Multipart POST, presigned S3/R2/GCS PUTs, or your own handler.
          </li>
        </ul>
      </div>
    </div>
  );
}
