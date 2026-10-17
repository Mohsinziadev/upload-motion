export type UploadErrorCode =
  | 'network'
  | 'timeout'
  | 'http'
  | 'aborted'
  | 'invalid-response'
  | 'handler';

const BRAND = Symbol.for('upload-motion.UploadError');

export interface UploadErrorInit {
  status?: number;
  retryable?: boolean;
  response?: unknown;
  cause?: unknown;
}

/** Error type produced by built-in transports and by the store when wrapping handler failures. */
export class UploadError extends Error {
  readonly code: UploadErrorCode;
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly response: unknown;
  readonly [BRAND] = true;

  constructor(code: UploadErrorCode, message: string, init: UploadErrorInit = {}) {
    super(message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = 'UploadError';
    this.code = code;
    this.status = init.status;
    this.response = init.response;
    this.retryable = init.retryable ?? defaultRetryable(code, init.status);
  }
}

function defaultRetryable(code: UploadErrorCode, status?: number): boolean {
  if (code === 'network' || code === 'timeout') return true;
  if (code === 'http' && status !== undefined) return status >= 500 || status === 408 || status === 429;
  return code === 'handler';
}

/** Works across bundle copies (no `instanceof` pitfalls). */
export function isUploadError(value: unknown): value is UploadError {
  return typeof value === 'object' && value !== null && (value as Record<symbol, unknown>)[BRAND] === true;
}

export function httpErrorMessage(status: number): string {
  if (status === 401 || status === 403) return `Not allowed to upload (HTTP ${status})`;
  if (status === 404) return 'Upload endpoint not found (HTTP 404)';
  if (status === 408) return 'The server timed out (HTTP 408)';
  if (status === 413) return 'File is too large for the server (HTTP 413)';
  if (status === 415) return 'The server rejected this file type (HTTP 415)';
  if (status === 429) return 'Too many uploads – try again shortly (HTTP 429)';
  if (status >= 500) return `Server error (HTTP ${status})`;
  return `Upload failed (HTTP ${status})`;
}

export function toUploadError(error: unknown): UploadError {
  if (isUploadError(error)) return error;
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new UploadError('aborted', 'Upload aborted', { cause: error, retryable: false });
  }
  const message = error instanceof Error && error.message ? error.message : 'Upload failed';
  return new UploadError('handler', message, { cause: error });
}
