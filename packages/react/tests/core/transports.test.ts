import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSimulatedUploader, createUploadStore, createXhrUploader, isUploadError } from '../../src/core';
import { flush, makeFile } from '../helpers';

class FakeXhr {
  static instances: FakeXhr[] = [];
  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: unknown;
  status = 0;
  responseText = '';
  timeout = 0;
  withCredentials = false;
  responseHeaders: Record<string, string> = {};
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  aborted = false;

  constructor() {
    FakeXhr.instances.push(this);
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }
  getResponseHeader(key: string) {
    return this.responseHeaders[key.toLowerCase()] ?? null;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
  progress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total } as ProgressEvent);
  }
  respond(status: number, body: string, contentType = 'application/json') {
    this.status = status;
    this.responseText = body;
    this.responseHeaders['content-type'] = contentType;
    this.onload?.();
  }
}

const OriginalXhr = globalThis.XMLHttpRequest;
function installFakeXhr() {
  FakeXhr.instances = [];
  globalThis.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest;
}
afterEach(() => {
  globalThis.XMLHttpRequest = OriginalXhr;
});

describe('createXhrUploader', () => {
  it('posts multipart form data and reports real progress', async () => {
    installFakeXhr();
    const store = createUploadStore({
      upload: createXhrUploader({ url: '/api/upload', headers: { 'x-token': 't' }, formData: { folder: 'docs' } }),
    });
    store.addFiles([makeFile('a.pdf', 1000, 'application/pdf')]);
    await flush();
    const xhr = FakeXhr.instances[0]!;
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('/api/upload');
    expect(xhr.headers['x-token']).toBe('t');
    expect(xhr.body).toBeInstanceOf(FormData);
    const form = xhr.body as FormData;
    expect(form.get('folder')).toBe('docs');
    expect((form.get('file') as File).name).toBe('a.pdf');

    xhr.progress(250, 1000);
    expect(store.getSnapshot().items[0]!.progress).toBeCloseTo(0.25);
    xhr.respond(200, '{"id":"abc"}');
    await flush();
    expect(store.getSnapshot().items[0]!.status).toBe('success');
    expect(store.getSnapshot().items[0]!.response).toEqual({ id: 'abc' });
    expect(store.getSnapshot().transport).toBe('network');
  });

  it('sends raw bodies to per-file URLs (presigned PUT)', async () => {
    installFakeXhr();
    const store = createUploadStore({
      upload: createXhrUploader({ url: async (item) => `https://bucket/${item.name}?sig=1`, method: 'PUT', body: 'raw' }),
    });
    const file = makeFile('photo.png', 10, 'image/png');
    store.addFiles([file]);
    await flush();
    await flush();
    const xhr = FakeXhr.instances[0]!;
    expect(xhr.method).toBe('PUT');
    expect(xhr.url).toBe('https://bucket/photo.png?sig=1');
    expect(xhr.body).toBe(file);
  });

  it('maps HTTP failures to UploadError, preferring a server message', async () => {
    installFakeXhr();
    const store = createUploadStore({ upload: createXhrUploader({ url: '/u' }) });
    store.addFiles([makeFile('a.txt')]);
    await flush();
    FakeXhr.instances[0]!.respond(413, '{"error":"Max 10 MB"}');
    await flush();
    const { error, status } = store.getSnapshot().items[0]!;
    expect(status).toBe('error');
    expect(isUploadError(error)).toBe(true);
    expect(error?.code).toBe('http');
    expect(error?.status).toBe(413);
    expect(error?.message).toBe('Max 10 MB');
    expect(error?.retryable).toBe(false);
  });

  it('maps network errors', async () => {
    installFakeXhr();
    const store = createUploadStore({ upload: createXhrUploader({ url: '/u' }) });
    store.addFiles([makeFile('a.txt')]);
    await flush();
    FakeXhr.instances[0]!.onerror?.();
    await flush();
    expect(store.getSnapshot().items[0]!.error?.code).toBe('network');
  });

  it('aborts the request on cancel', async () => {
    installFakeXhr();
    const store = createUploadStore({ upload: createXhrUploader({ url: '/u' }) });
    store.addFiles([makeFile('a.txt')]);
    await flush();
    store.cancel();
    await flush();
    expect(FakeXhr.instances[0]!.aborted).toBe(true);
    expect(store.getSnapshot().items[0]!.status).toBe('canceled');
  });
});

describe('createSimulatedUploader', () => {
  it('is flagged as simulated and completes', async () => {
    vi.useFakeTimers();
    try {
      const handler = createSimulatedUploader({ minDuration: 200, latency: 0, speed: 1e9 });
      expect(handler.simulated).toBe(true);
      const store = createUploadStore({ upload: handler });
      store.addFiles([makeFile('a.txt', 1000)]);
      await vi.advanceTimersByTimeAsync(2000);
      expect(store.getSnapshot().items[0]!.status).toBe('success');
    } finally {
      vi.useRealTimers();
    }
  });

  it('can fail on purpose to demo error recovery', async () => {
    vi.useFakeTimers();
    try {
      const store = createUploadStore({ upload: createSimulatedUploader({ failureRate: 1, latency: 0, minDuration: 200 }) });
      store.addFiles([makeFile('a.txt', 1000)]);
      await vi.advanceTimersByTimeAsync(2000);
      expect(store.getSnapshot().items[0]!.status).toBe('error');
      expect(store.getSnapshot().items[0]!.error?.message).toMatch(/Simulated/);
    } finally {
      vi.useRealTimers();
    }
  });
});
