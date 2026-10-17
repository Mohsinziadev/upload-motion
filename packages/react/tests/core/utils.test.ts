import { describe, expect, it } from 'vitest';
import {
  describeAccept,
  formatBytes,
  formatDuration,
  getFileKind,
  getFileLabel,
  isFileAccepted,
  isPreviewableImage,
  parseAccept,
  UploadError,
  isUploadError,
  toUploadError,
} from '../../src/core';

describe('getFileKind', () => {
  it.each([
    ['report.pdf', '', 'pdf'],
    ['letter.doc', '', 'document'],
    ['letter.docx', '', 'document'],
    ['budget.xls', '', 'spreadsheet'],
    ['budget.xlsx', '', 'spreadsheet'],
    ['table.csv', 'text/csv', 'spreadsheet'],
    ['photo.jpg', 'image/jpeg', 'image'],
    ['photo.PNG', '', 'image'],
    ['photo.webp', '', 'image'],
    ['anim.gif', '', 'image'],
    ['logo.svg', 'image/svg+xml', 'image'],
    ['clip.mp4', 'video/mp4', 'video'],
    ['clip.mov', 'video/quicktime', 'video'],
    ['song.mp3', 'audio/mpeg', 'audio'],
    ['take.wav', 'audio/wav', 'audio'],
    ['bundle.zip', 'application/zip', 'archive'],
    ['data.json', 'application/json', 'data'],
    ['app.js', 'text/javascript', 'code'],
    ['app.ts', '', 'code'],
    ['mystery', '', 'unknown'],
    ['blob', 'image/heic', 'image'],
  ])('%s (%s) → %s', (name, type, kind) => {
    expect(getFileKind({ name, type })).toBe(kind);
  });

  it('builds short badge labels', () => {
    expect(getFileLabel({ name: 'a.docx' })).toBe('DOCX');
    expect(getFileLabel({ name: 'noext' })).toBe('FILE');
  });

  it('knows which images can be previewed natively', () => {
    expect(isPreviewableImage({ name: 'a.png', type: 'image/png' })).toBe(true);
    expect(isPreviewableImage({ name: 'a.heic', type: 'image/heic' })).toBe(false);
    expect(isPreviewableImage({ name: 'a.webp' })).toBe(true);
  });
});

describe('accept handling', () => {
  it('parses strings and arrays', () => {
    expect(parseAccept('image/*, .PDF')).toEqual(['image/*', '.pdf']);
    expect(parseAccept(['video/mp4', '.zip,.json'])).toEqual(['video/mp4', '.zip', '.json']);
  });

  it('matches like the browser', () => {
    const accept = parseAccept('image/*,.pdf,application/json');
    expect(isFileAccepted({ name: 'a.png', type: 'image/png' }, accept)).toBe(true);
    expect(isFileAccepted({ name: 'a.pdf', type: '' }, accept)).toBe(true);
    expect(isFileAccepted({ name: 'a.json', type: 'application/json' }, accept)).toBe(true);
    expect(isFileAccepted({ name: 'a.txt', type: 'text/plain' }, accept)).toBe(false);
    expect(isFileAccepted({ name: 'anything' }, [])).toBe(true);
  });

  it('describes accept lists for humans', () => {
    expect(describeAccept(parseAccept('image/*,.pdf,application/vnd.ms-excel'))).toBe('Images, PDF, XLS');
  });
});

describe('formatting', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(6.4 * 1024 * 1024)).toBe('6.4 MB');
    expect(formatBytes(25 * 1024 * 1024)).toBe('25 MB');
    expect(formatBytes(150 * 1024 * 1024)).toBe('150 MB');
  });

  it('formats durations', () => {
    expect(formatDuration(5)).toBe('5 seconds');
    expect(formatDuration(1)).toBe('1 second');
    expect(formatDuration(95)).toBe('2 minutes');
    expect(formatDuration(7200)).toBe('2 hours');
  });
});

describe('errors', () => {
  it('derives retryability from codes and statuses', () => {
    expect(new UploadError('network', 'x').retryable).toBe(true);
    expect(new UploadError('http', 'x', { status: 503 }).retryable).toBe(true);
    expect(new UploadError('http', 'x', { status: 429 }).retryable).toBe(true);
    expect(new UploadError('http', 'x', { status: 413 }).retryable).toBe(false);
    expect(new UploadError('aborted', 'x').retryable).toBe(false);
  });

  it('identifies errors without instanceof', () => {
    expect(isUploadError(new UploadError('network', 'x'))).toBe(true);
    expect(isUploadError(new Error('x'))).toBe(false);
    expect(toUploadError(new DOMException('a', 'AbortError')).code).toBe('aborted');
  });
});
