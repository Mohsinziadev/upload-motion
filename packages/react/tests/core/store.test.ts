import { describe, expect, it, vi } from 'vitest';
import { createUploadStore, UploadError } from '../../src/core';
import { controlledHandler, flush, makeFile } from '../helpers';

describe('createUploadStore', () => {
  it('keeps files pending when no upload handler is configured', () => {
    const store = createUploadStore();
    store.addFiles([makeFile('a.png', 10, 'image/png')]);
    const { items, transport, totals } = store.getSnapshot();
    expect(items[0]!.status).toBe('pending');
    expect(transport).toBe('none');
    expect(totals.isComplete).toBe(false);
  });

  it('queues and uploads files with auto upload, reporting progress and success', async () => {
    const { handler, calls } = controlledHandler();
    const onSuccess = vi.fn();
    const onComplete = vi.fn();
    const store = createUploadStore({ upload: handler, onUploadSuccess: onSuccess, onQueueComplete: onComplete });
    store.addFiles([makeFile('a.pdf', 1000)]);
    await flush();
    expect(calls).toHaveLength(1);
    expect(store.getSnapshot().items[0]!.status).toBe('uploading');

    calls[0]!.ctx.onProgress(500, 1000);
    const midway = store.getSnapshot().items[0]!;
    expect(midway.progress).toBeCloseTo(0.5);
    expect(midway.loaded).toBe(500);
    expect(store.getSnapshot().totals.progress).toBeCloseTo(0.5);

    calls[0]!.resolve({ url: '/a.pdf' });
    await flush();
    const done = store.getSnapshot().items[0]!;
    expect(done.status).toBe('success');
    expect(done.progress).toBe(1);
    expect(done.response).toEqual({ url: '/a.pdf' });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(store.getSnapshot().totals.isComplete).toBe(true);
  });

  it('never moves progress backwards within an attempt', async () => {
    const { handler, calls } = controlledHandler();
    const store = createUploadStore({ upload: handler });
    store.addFiles([makeFile('a.bin', 100)]);
    await flush();
    calls[0]!.ctx.onProgress(80, 100);
    calls[0]!.ctx.onProgress(40, 100);
    expect(store.getSnapshot().items[0]!.progress).toBeCloseTo(0.8);
  });

  it('respects the concurrency limit', async () => {
    const { handler, calls } = controlledHandler();
    const store = createUploadStore({ upload: handler, concurrency: 2 });
    store.addFiles([makeFile('1.txt'), makeFile('2.txt'), makeFile('3.txt')]);
    await flush();
    expect(calls).toHaveLength(2);
    expect(store.getSnapshot().totals.queued).toBe(1);
    calls[0]!.resolve();
    await flush();
    await flush();
    expect(calls).toHaveLength(3);
  });

  it('waits for start() in manual mode', async () => {
    const { handler, calls } = controlledHandler();
    const store = createUploadStore({ upload: handler, autoUpload: false });
    store.addFiles([makeFile('a.txt'), makeFile('b.txt')]);
    await flush();
    expect(calls).toHaveLength(0);
    expect(store.getSnapshot().totals.pending).toBe(2);
    const first = store.getSnapshot().items[0]!.id;
    store.start(first);
    await flush();
    expect(calls).toHaveLength(1);
    store.start();
    await flush();
    expect(calls).toHaveLength(2);
  });

  it('cancels an in-flight upload and allows retry', async () => {
    const { handler, calls } = controlledHandler();
    const onCancel = vi.fn();
    const store = createUploadStore({ upload: handler, onUploadCancel: onCancel });
    store.addFiles([makeFile('a.txt', 100)]);
    await flush();
    const id = store.getSnapshot().items[0]!.id;
    calls[0]!.ctx.onProgress(30, 100);
    store.cancel(id);
    await flush();
    expect(calls[0]!.ctx.signal.aborted).toBe(true);
    expect(store.getItem(id)!.status).toBe('canceled');
    expect(onCancel).toHaveBeenCalledOnce();

    store.retry(id);
    expect(store.getItem(id)!.progress).toBe(0);
    await flush();
    expect(calls).toHaveLength(2);
    expect(calls[1]!.ctx.attempt).toBe(2);
    calls[1]!.resolve();
    await flush();
    expect(store.getItem(id)!.status).toBe('success');
  });

  it('pauses and resumes uploads', async () => {
    const { handler, calls } = controlledHandler();
    const store = createUploadStore({ upload: handler });
    store.addFiles([makeFile('a.txt', 100)]);
    await flush();
    const id = store.getSnapshot().items[0]!.id;
    calls[0]!.ctx.onProgress(60, 100);
    store.pause();
    await flush();
    expect(store.getItem(id)!.status).toBe('paused');
    expect(store.getItem(id)!.progress).toBeCloseTo(0.6);
    store.resume();
    await flush();
    expect(calls).toHaveLength(2);
    expect(store.getItem(id)!.status).toBe('uploading');
  });

  it('marks failures as errors with the handler message', async () => {
    const { handler, calls } = controlledHandler();
    const onError = vi.fn();
    const store = createUploadStore({ upload: handler, onUploadError: onError });
    store.addFiles([makeFile('a.txt')]);
    await flush();
    calls[0]!.reject(new UploadError('http', 'Server error (HTTP 500)', { status: 500 }));
    await flush();
    const item = store.getSnapshot().items[0]!;
    expect(item.status).toBe('error');
    expect(item.error?.message).toBe('Server error (HTTP 500)');
    expect(item.error?.retryable).toBe(true);
    expect(onError).toHaveBeenCalledOnce();
    expect(store.getSnapshot().totals.error).toBe(1);
  });

  it('wraps thrown non-UploadErrors', async () => {
    const store = createUploadStore({
      upload: () => {
        throw new Error('boom');
      },
    });
    store.addFiles([makeFile('a.txt')]);
    await flush();
    await flush();
    const item = store.getSnapshot().items[0]!;
    expect(item.status).toBe('error');
    expect(item.error?.code).toBe('handler');
    expect(item.error?.message).toBe('boom');
  });

  it('automatically retries retryable errors with backoff', async () => {
    vi.useFakeTimers();
    try {
      let attempts = 0;
      const store = createUploadStore({
        retry: { attempts: 2, delay: 100 },
        upload: async () => {
          attempts += 1;
          if (attempts < 3) throw new UploadError('network', 'offline');
          return 'ok';
        },
      });
      store.addFiles([makeFile('a.txt')]);
      await vi.advanceTimersByTimeAsync(0);
      expect(store.getSnapshot().items[0]!.status).toBe('queued');
      expect(store.getSnapshot().items[0]!.retryAt).not.toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(200);
      expect(attempts).toBe(3);
      expect(store.getSnapshot().items[0]!.status).toBe('success');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not auto-retry non-retryable errors', async () => {
    let attempts = 0;
    const store = createUploadStore({
      retry: 3,
      upload: async () => {
        attempts += 1;
        throw new UploadError('http', 'Forbidden', { status: 403 });
      },
    });
    store.addFiles([makeFile('a.txt')]);
    await flush();
    await flush();
    expect(attempts).toBe(1);
    expect(store.getSnapshot().items[0]!.status).toBe('error');
  });

  it('removes files and aborts their requests', async () => {
    const { handler, calls } = controlledHandler();
    const onRemoved = vi.fn();
    const store = createUploadStore({ upload: handler, onFileRemoved: onRemoved });
    store.addFiles([makeFile('a.txt')]);
    await flush();
    const id = store.getSnapshot().items[0]!.id;
    store.remove(id);
    expect(calls[0]!.ctx.signal.aborted).toBe(true);
    expect(store.getSnapshot().items).toHaveLength(0);
    expect(onRemoved).toHaveBeenCalledOnce();
  });

  it('validates type, size and file count', () => {
    const onRejected = vi.fn();
    const store = createUploadStore({
      accept: 'image/*,.pdf',
      maxSize: 1000,
      maxFiles: 2,
      onFilesRejected: onRejected,
    });
    const result = store.addFiles([
      makeFile('ok.png', 10, 'image/png'),
      makeFile('big.png', 5000, 'image/png'),
      makeFile('notes.txt', 10, 'text/plain'),
      makeFile('doc.pdf', 10, 'application/pdf'),
      makeFile('extra.pdf', 10, 'application/pdf'),
    ]);
    expect(result.accepted.map((item) => item.name)).toEqual(['ok.png', 'doc.pdf']);
    const codes = result.rejected.map((rejection) => [rejection.file.name, rejection.errors[0]!.code]);
    expect(codes).toEqual([
      ['big.png', 'file-too-large'],
      ['notes.txt', 'file-invalid-type'],
      ['extra.pdf', 'too-many-files'],
    ]);
    expect(onRejected).toHaveBeenCalledOnce();
    expect(store.getSnapshot().rejections).toHaveLength(3);
    store.dismissRejection();
    expect(store.getSnapshot().rejections).toHaveLength(0);
  });

  it('replaces the current file in single mode', () => {
    const store = createUploadStore({ multiple: false });
    store.addFiles([makeFile('a.txt')]);
    const result = store.addFiles([makeFile('b.txt'), makeFile('c.txt')]);
    expect(store.getSnapshot().items.map((item) => item.name)).toEqual(['b.txt']);
    expect(result.rejected[0]!.errors[0]!.code).toBe('too-many-files');
  });

  it('supports custom validators', () => {
    const store = createUploadStore({ validate: (file) => (file.name.includes(' ') ? 'No spaces allowed' : null) });
    const result = store.addFiles([makeFile('my file.txt'), makeFile('ok.txt')]);
    expect(result.rejected[0]!.errors[0]).toEqual({ code: 'custom', message: 'No spaces allowed' });
    expect(result.accepted).toHaveLength(1);
  });

  it('clears by filter', async () => {
    const { handler, calls } = controlledHandler();
    const store = createUploadStore({ upload: handler });
    store.addFiles([makeFile('a.txt'), makeFile('b.txt')]);
    await flush();
    calls[0]!.resolve();
    calls[1]!.reject(new UploadError('http', 'nope', { status: 400 }));
    await flush();
    store.clear('completed');
    expect(store.getSnapshot().items.map((item) => item.name)).toEqual(['b.txt']);
    store.clear('failed');
    expect(store.getSnapshot().items).toHaveLength(0);
  });

  it('keeps snapshot identity stable until something changes', () => {
    const store = createUploadStore();
    const a = store.getSnapshot();
    expect(store.getSnapshot()).toBe(a);
    store.addFiles([makeFile('a.txt')]);
    expect(store.getSnapshot()).not.toBe(a);
  });

  it('labels simulated transports', () => {
    const handler = Object.assign(async () => 'x', { simulated: true });
    expect(createUploadStore({ upload: handler }).getSnapshot().transport).toBe('simulated');
  });

  it('dispose aborts in-flight uploads', async () => {
    const { handler, calls } = controlledHandler();
    const store = createUploadStore({ upload: handler });
    store.addFiles([makeFile('a.txt')]);
    await flush();
    store.dispose();
    await flush();
    expect(calls[0]!.ctx.signal.aborted).toBe(true);
    expect(store.getSnapshot().items[0]!.status).toBe('canceled');
  });
});
