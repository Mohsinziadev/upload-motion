import { UploadError, httpErrorMessage } from './errors';
import type { UploadContext, UploadHandler, UploadItem } from './types';

type MaybePromise<T> = T | Promise<T>;
type PerItem<T> = T | ((item: UploadItem) => MaybePromise<T>);

export interface XhrUploaderOptions<TResponse = unknown> {
  /** Endpoint, or a function returning one (e.g. a presigned URL). */
  url: PerItem<string>;
  /** Default `POST`. Use `PUT` with `body: 'raw'` for S3/GCS presigned URLs. */
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: PerItem<Record<string, string>>;
  /** `form-data` (default) sends multipart; `raw` sends the file bytes as the body. */
  body?: 'form-data' | 'raw';
  /** Multipart field name for the file. Default `"file"`. */
  fieldName?: string;
  /** Extra multipart fields. */
  formData?: PerItem<Record<string, string | Blob>>;
  withCredentials?: boolean;
  /** Request timeout in ms. 0 / undefined disables it. */
  timeout?: number;
  /** Turn the finished XHR into your response type. Defaults to JSON when possible, else text. */
  parseResponse?: (xhr: XMLHttpRequest) => TResponse;
  /** Which statuses count as success. Default 2xx. */
  isSuccess?: (status: number) => boolean;
}

function resolve<T>(value: PerItem<T>, item: UploadItem): MaybePromise<T> {
  return typeof value === 'function' ? (value as (item: UploadItem) => MaybePromise<T>)(item) : value;
}

function defaultParse(xhr: XMLHttpRequest): unknown {
  const text = xhr.responseText;
  const type = xhr.getResponseHeader('content-type') ?? '';
  if (type.includes('json') || /^\s*[[{]/.test(text)) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

/**
 * Real network transport built on `XMLHttpRequest`, the only browser API that
 * reports upload progress for request bodies on HTTP/1.1.
 */
export function createXhrUploader<TResponse = unknown>(options: XhrUploaderOptions<TResponse>): UploadHandler<TResponse> {
  const {
    method = 'POST',
    body = 'form-data',
    fieldName = 'file',
    withCredentials = false,
    timeout = 0,
    parseResponse = defaultParse as (xhr: XMLHttpRequest) => TResponse,
    isSuccess = (status: number) => status >= 200 && status < 300,
  } = options;

  return async function xhrUpload({ file, item, signal, onProgress }: UploadContext<TResponse>): Promise<TResponse> {
    const [url, headers, fields] = await Promise.all([
      resolve(options.url, item as UploadItem),
      options.headers ? resolve(options.headers, item as UploadItem) : undefined,
      options.formData ? resolve(options.formData, item as UploadItem) : undefined,
    ]);
    if (signal.aborted) throw new UploadError('aborted', 'Upload aborted', { retryable: false });

    return new Promise<TResponse>((resolvePromise, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.withCredentials = withCredentials;
      xhr.timeout = timeout;
      for (const [key, value] of Object.entries(headers ?? {})) xhr.setRequestHeader(key, value);

      const onAbort = () => xhr.abort();
      signal.addEventListener('abort', onAbort, { once: true });
      const cleanup = () => signal.removeEventListener('abort', onAbort);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded, event.total);
      };
      xhr.onload = () => {
        cleanup();
        if (isSuccess(xhr.status)) {
          try {
            resolvePromise(parseResponse(xhr));
          } catch (error) {
            reject(new UploadError('invalid-response', 'Could not read the server response', { cause: error, retryable: false }));
          }
          return;
        }
        let response: unknown;
        try {
          response = defaultParse(xhr);
        } catch {
          response = undefined;
        }
        const serverMessage =
          typeof response === 'object' && response !== null && typeof (response as { error?: unknown }).error === 'string'
            ? (response as { error: string }).error
            : undefined;
        reject(
          new UploadError('http', serverMessage ?? httpErrorMessage(xhr.status), {
            status: xhr.status,
            response,
          }),
        );
      };
      xhr.onerror = () => {
        cleanup();
        reject(new UploadError('network', 'Network error – check your connection and try again'));
      };
      xhr.ontimeout = () => {
        cleanup();
        reject(new UploadError('timeout', 'The upload timed out'));
      };
      xhr.onabort = () => {
        cleanup();
        reject(new UploadError('aborted', 'Upload aborted', { retryable: false }));
      };

      if (body === 'raw') {
        xhr.send(file);
      } else {
        const form = new FormData();
        for (const [key, value] of Object.entries(fields ?? {})) form.append(key, value);
        form.append(fieldName, file, file.name);
        xhr.send(form);
      }
    });
  };
}

export interface SimulatedUploaderOptions {
  /** Simulated throughput in bytes per second. A `[min, max]` range picks a random speed per file. Default `[1.5 MB, 6 MB]`. */
  speed?: number | readonly [number, number];
  /** Minimum duration in ms so tiny files still show motion. Default 1400. */
  minDuration?: number;
  /** 0..1 probability that an attempt fails midway. Default 0. */
  failureRate?: number;
  /** Delay before the first byte, in ms. Default 250. */
  latency?: number;
}

/**
 * Demo transport: no bytes leave the browser. The returned handler is flagged
 * `simulated: true` so built-in components display a "Simulated" badge.
 */
export function createSimulatedUploader(options: SimulatedUploaderOptions = {}): UploadHandler<{ simulated: true; name: string; size: number }> {
  const { speed = [1_500_000, 6_000_000], minDuration = 1400, failureRate = 0, latency = 250 } = options;

  const handler = ({ file, signal, onProgress }: UploadContext<{ simulated: true; name: string; size: number }>) =>
    new Promise<{ simulated: true; name: string; size: number }>((resolvePromise, reject) => {
      const bytesPerSecond = Array.isArray(speed)
        ? speed[0] + Math.random() * (speed[1] - speed[0])
        : (speed as number);
      const total = Math.max(file.size, 1);
      const duration = Math.max(minDuration, (total / bytesPerSecond) * 1000);
      const failAt = Math.random() < failureRate ? 0.25 + Math.random() * 0.5 : Infinity;
      let elapsed = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const tickMs = 80;

      const abort = () => {
        if (timer !== undefined) clearTimeout(timer);
        reject(new UploadError('aborted', 'Upload aborted', { retryable: false }));
      };
      if (signal.aborted) return abort();
      signal.addEventListener('abort', abort, { once: true });

      const tick = () => {
        // Jitter makes the speed readout and wave motion feel like a real link.
        elapsed += tickMs * (0.55 + Math.random() * 0.9);
        const fraction = Math.min(elapsed / duration, 1);
        if (fraction >= failAt) {
          signal.removeEventListener('abort', abort);
          reject(new UploadError('network', 'Simulated network failure'));
          return;
        }
        onProgress(Math.round(fraction * total), total);
        if (fraction >= 1) {
          signal.removeEventListener('abort', abort);
          resolvePromise({ simulated: true, name: file.name, size: file.size });
          return;
        }
        timer = setTimeout(tick, tickMs);
      };
      timer = setTimeout(tick, latency);
    });

  return Object.assign(handler, { simulated: true as const });
}
