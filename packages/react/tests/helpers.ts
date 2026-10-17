import type { UploadContext, UploadHandler } from '../src/core';

export function makeFile(name: string, size = 1024, type = ''): File {
  const file = new File([new Uint8Array(Math.min(size, 64))], name, { type });
  // Avoid allocating huge buffers in tests while still reporting the size we want.
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

export interface ControlledUpload {
  ctx: UploadContext;
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
}

/** A handler whose uploads are resolved manually from the test. */
export function controlledHandler() {
  const calls: ControlledUpload[] = [];
  const handler: UploadHandler = (ctx) =>
    new Promise((resolve, reject) => {
      const call: ControlledUpload = { ctx, resolve: (value) => resolve(value ?? { ok: true }), reject };
      ctx.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      calls.push(call);
    });
  return { handler, calls };
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
