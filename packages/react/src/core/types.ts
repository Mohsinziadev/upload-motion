/**
 * Framework-agnostic types for the upload engine.
 *
 * Nothing in `src/core` may import React or touch the DOM beyond the standard
 * `File`, `AbortController` and `XMLHttpRequest` globals. This keeps the engine
 * reusable for future Vue / vanilla adapters.
 */
import type { UploadError } from './errors';

export type FileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'data'
  | 'text'
  | 'unknown';

/**
 * Lifecycle of a single file in the queue.
 *
 * - `pending`   selected locally, waiting for `start()` (manual mode or no handler)
 * - `queued`    waiting for a free concurrency slot
 * - `uploading` request in flight
 * - `paused`    request aborted by `pause()`; `resume()` re-queues it
 * - `success`   handler resolved
 * - `error`     handler rejected (see `item.error`)
 * - `canceled`  aborted by `cancel()`; can be retried
 */
export type UploadStatus =
  | 'pending'
  | 'queued'
  | 'uploading'
  | 'paused'
  | 'success'
  | 'error'
  | 'canceled';

export interface UploadItem<TResponse = unknown> {
  readonly id: string;
  readonly file: File;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  /** Lower-case extension without the dot, e.g. `"pdf"`. Empty string when absent. */
  readonly extension: string;
  readonly kind: FileKind;
  readonly status: UploadStatus;
  /** 0..1 fraction of bytes reported as sent by the upload handler. */
  readonly progress: number;
  readonly loaded: number;
  /** Smoothed transfer speed in bytes per second (0 when idle). */
  readonly speed: number;
  /** Estimated seconds remaining, or `null` when unknown. */
  readonly eta: number | null;
  /** Number of times an upload has been attempted. */
  readonly attempts: number;
  readonly error: UploadError | null;
  readonly response: TResponse | undefined;
  readonly addedAt: number;
  readonly startedAt: number | null;
  readonly completedAt: number | null;
  /** Timestamp of the next automatic retry, when one is scheduled. */
  readonly retryAt: number | null;
}

export type RejectionCode =
  | 'file-invalid-type'
  | 'file-too-large'
  | 'file-too-small'
  | 'too-many-files'
  | 'custom';

export interface RejectionReason {
  code: RejectionCode;
  message: string;
}

export interface FileRejection {
  readonly id: string;
  readonly file: File;
  readonly errors: readonly RejectionReason[];
  readonly at: number;
}

export interface UploadContext<TResponse = unknown> {
  file: File;
  item: UploadItem<TResponse>;
  /** Aborted when the upload is canceled, paused, removed or the store is disposed. */
  signal: AbortSignal;
  /** 1-based attempt number. */
  attempt: number;
  /** Report bytes sent. `total` defaults to `file.size`. */
  onProgress: (loaded: number, total?: number) => void;
}

/**
 * Sends one file somewhere and resolves with the server response.
 * Reject (or throw) to mark the upload as failed. Must honour `ctx.signal`.
 */
export type UploadHandler<TResponse = unknown> = ((ctx: UploadContext<TResponse>) => Promise<TResponse>) & {
  /** Set by `createSimulatedUploader` so UIs can label fake progress honestly. */
  readonly simulated?: boolean;
};

export type CustomValidator = (
  file: File,
  context: { items: readonly UploadItem[] },
) => string | null | undefined | false;

export interface RetryOptions {
  /** Automatic retries for retryable errors (network, timeout, 5xx). Default 0. */
  attempts?: number;
  /** Base delay in ms, doubled each attempt. Default 800. */
  delay?: number;
}

export interface UploaderOptions<TResponse = unknown> {
  /** Transport. Without one, files stay `pending` – nothing is ever claimed as uploaded. */
  upload?: UploadHandler<TResponse>;
  /** Same syntax as the `accept` attribute: `"image/*,.pdf"` or `['image/*', '.pdf']`. */
  accept?: string | readonly string[];
  /** Max bytes per file. */
  maxSize?: number;
  /** Min bytes per file. */
  minSize?: number;
  /** Max files held in the queue at once (canceled/failed files count until removed). */
  maxFiles?: number;
  /** Allow selecting several files. `false` replaces the current file. Default true. */
  multiple?: boolean;
  validate?: CustomValidator;
  /** Start uploading as soon as files are added. Default true. */
  autoUpload?: boolean;
  /** Parallel uploads. Default 3. */
  concurrency?: number;
  retry?: number | RetryOptions;

  onFilesAdded?: (items: UploadItem<TResponse>[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  onUploadStart?: (item: UploadItem<TResponse>) => void;
  onUploadProgress?: (item: UploadItem<TResponse>) => void;
  onUploadSuccess?: (item: UploadItem<TResponse>, response: TResponse) => void;
  onUploadError?: (item: UploadItem<TResponse>, error: UploadError) => void;
  onUploadCancel?: (item: UploadItem<TResponse>) => void;
  onFileRemoved?: (item: UploadItem<TResponse>) => void;
  /** Fires once every started upload has settled (success, error or canceled). */
  onQueueComplete?: (items: UploadItem<TResponse>[]) => void;
  onChange?: (items: UploadItem<TResponse>[]) => void;
}

export interface UploadTotals {
  count: number;
  /** 0..1 across files that are in flight or done (excludes pending, failed, canceled). */
  progress: number;
  loaded: number;
  size: number;
  speed: number;
  eta: number | null;
  pending: number;
  queued: number;
  uploading: number;
  paused: number;
  success: number;
  error: number;
  canceled: number;
  /** queued + uploading */
  active: number;
  isUploading: boolean;
  /** At least one success and nothing pending, queued, uploading or paused. */
  isComplete: boolean;
}

export interface UploadSnapshot<TResponse = unknown> {
  readonly items: readonly UploadItem<TResponse>[];
  readonly rejections: readonly FileRejection[];
  readonly totals: UploadTotals;
  /** `'simulated'` when the handler fakes progress, `'none'` without a handler. */
  readonly transport: 'network' | 'simulated' | 'none';
}

export interface UploadEventMap<TResponse = unknown> {
  added: UploadItem<TResponse>[];
  rejected: FileRejection[];
  start: UploadItem<TResponse>;
  success: UploadItem<TResponse>;
  error: UploadItem<TResponse>;
  cancel: UploadItem<TResponse>;
  removed: UploadItem<TResponse>;
  complete: UploadItem<TResponse>[];
}

export type ClearFilter = 'all' | 'completed' | 'failed' | 'canceled';
