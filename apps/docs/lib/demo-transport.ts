'use client';

import { createSimulatedUploader, createXhrUploader, type UploadHandler } from 'upload-motion';

export type TransportMode = 'simulated' | 'network';

export interface DemoTransportOptions {
  /** 0..1 */
  failureRate?: number;
  /** Server-side read throttle for the real endpoint, in KB/s (0 = unthrottled). */
  throttleKbps?: number;
}

/**
 * Simulated: clearly labelled fake progress, nothing leaves the browser.
 * Network: real multipart POST to this site's /api/upload route (data is counted and discarded).
 */
export function createDemoTransport(mode: TransportMode, options: DemoTransportOptions = {}): UploadHandler {
  if (mode === 'simulated') {
    return createSimulatedUploader({
      speed: [500_000, 2_000_000],
      minDuration: 2200,
      failureRate: options.failureRate ?? 0,
    }) as UploadHandler;
  }
  return createXhrUploader({
    url: '/api/upload',
    headers: (item) => ({
      'x-file-name': encodeURIComponent(item.name),
      'x-throttle-kbps': String(options.throttleKbps ?? 0),
      'x-simulate-failure': Math.random() < (options.failureRate ?? 0) ? '1' : '0',
    }),
  });
}
