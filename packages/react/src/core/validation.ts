import { getExtension } from './file-kind';
import { formatBytes } from './format';
import type { CustomValidator, RejectionReason, UploadItem } from './types';

/** Normalises `accept` to lower-case tokens: `['image/*', '.pdf', 'application/json']`. */
export function parseAccept(accept: string | readonly string[] | undefined): string[] {
  if (!accept) return [];
  const raw = typeof accept === 'string' ? accept.split(',') : accept.flatMap((a) => a.split(','));
  return raw.map((token) => token.trim().toLowerCase()).filter(Boolean);
}

/** Mirrors the browser's `accept` matching rules. An empty list accepts everything. */
export function isFileAccepted(file: { name: string; type?: string }, accept: readonly string[]): boolean {
  if (accept.length === 0) return true;
  const type = (file.type ?? '').toLowerCase();
  const ext = getExtension(file.name);
  return accept.some((token) => {
    if (token.startsWith('.')) return ext !== '' && token.slice(1) === ext;
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

const MIME_NAMES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/json': 'JSON',
  'application/zip': 'ZIP',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
};

/** Human description of an accept list: `"Images, PDF"`. */
export function describeAccept(accept: readonly string[]): string {
  const words = accept.map((token) => {
    if (token === 'image/*') return 'Images';
    if (token === 'video/*') return 'Videos';
    if (token === 'audio/*') return 'Audio';
    if (token === 'text/*') return 'Text files';
    if (token.startsWith('.')) return token.slice(1).toUpperCase();
    if (MIME_NAMES[token]) return MIME_NAMES[token];
    const sub = token.split('/')[1] ?? token;
    return sub.replace(/^(x-|vnd\.)/, '').split(/[.+-]/)[0]!.toUpperCase();
  });
  return Array.from(new Set(words)).join(', ');
}

export interface ValidationRules {
  accept: readonly string[];
  maxSize?: number;
  minSize?: number;
  validate?: CustomValidator;
}

export function validateFile(file: File, rules: ValidationRules, items: readonly UploadItem[]): RejectionReason[] {
  const errors: RejectionReason[] = [];
  if (!isFileAccepted(file, rules.accept)) {
    errors.push({
      code: 'file-invalid-type',
      message: `${file.name} isn't an accepted file type (${describeAccept(rules.accept)}).`,
    });
  }
  if (rules.maxSize !== undefined && file.size > rules.maxSize) {
    errors.push({
      code: 'file-too-large',
      message: `${file.name} is ${formatBytes(file.size)}; the limit is ${formatBytes(rules.maxSize)}.`,
    });
  }
  if (rules.minSize !== undefined && file.size < rules.minSize) {
    errors.push({
      code: 'file-too-small',
      message: `${file.name} is smaller than the ${formatBytes(rules.minSize)} minimum.`,
    });
  }
  if (rules.validate) {
    const custom = rules.validate(file, { items });
    if (custom) errors.push({ code: 'custom', message: custom });
  }
  return errors;
}
