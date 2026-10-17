import type { FileKind } from './types';

const EXTENSION_KIND: Record<string, FileKind> = {
  // images
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', gif: 'image', svg: 'image',
  avif: 'image', bmp: 'image', ico: 'image', heic: 'image', heif: 'image', tif: 'image', tiff: 'image',
  // video
  mp4: 'video', mov: 'video', webm: 'video', mkv: 'video', avi: 'video', m4v: 'video', ogv: 'video',
  // audio
  mp3: 'audio', wav: 'audio', ogg: 'audio', oga: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio', opus: 'audio',
  // documents
  pdf: 'pdf',
  doc: 'document', docx: 'document', odt: 'document', rtf: 'document', pages: 'document',
  xls: 'spreadsheet', xlsx: 'spreadsheet', ods: 'spreadsheet', csv: 'spreadsheet', tsv: 'spreadsheet', numbers: 'spreadsheet',
  ppt: 'presentation', pptx: 'presentation', odp: 'presentation', key: 'presentation',
  // archives
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive', tgz: 'archive', bz2: 'archive', xz: 'archive',
  // code
  js: 'code', mjs: 'code', cjs: 'code', jsx: 'code', ts: 'code', tsx: 'code', py: 'code', rb: 'code', go: 'code',
  rs: 'code', java: 'code', kt: 'code', swift: 'code', c: 'code', cpp: 'code', h: 'code', cs: 'code', php: 'code',
  html: 'code', css: 'code', scss: 'code', sh: 'code', sql: 'code', vue: 'code', svelte: 'code',
  // data
  json: 'data', xml: 'data', yaml: 'data', yml: 'data', toml: 'data', ndjson: 'data', parquet: 'data',
  // text
  txt: 'text', md: 'text', log: 'text', ini: 'text',
};

const MIME_KIND: Array<[RegExp, FileKind]> = [
  [/^image\//, 'image'],
  [/^video\//, 'video'],
  [/^audio\//, 'audio'],
  [/^application\/pdf$/, 'pdf'],
  [/(msword|wordprocessingml|opendocument\.text|rtf)/, 'document'],
  [/(ms-excel|spreadsheetml|opendocument\.spreadsheet|text\/csv)/, 'spreadsheet'],
  [/(ms-powerpoint|presentationml|opendocument\.presentation)/, 'presentation'],
  [/(zip|x-rar|x-7z|x-tar|gzip|x-bzip)/, 'archive'],
  [/(javascript|typescript|x-python|x-sh)/, 'code'],
  [/(json|xml|yaml)/, 'data'],
  [/^text\//, 'text'],
];

export function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/** Classifies a file by extension first (more specific), then MIME type. */
export function getFileKind(file: { name: string; type?: string }): FileKind {
  const fromExt = EXTENSION_KIND[getExtension(file.name)];
  if (fromExt) return fromExt;
  const type = (file.type ?? '').toLowerCase();
  if (type) {
    for (const [pattern, kind] of MIME_KIND) if (pattern.test(type)) return kind;
  }
  return 'unknown';
}

/** Short badge label such as `PDF`, `DOCX`, `MP4`. Falls back to the kind. */
export function getFileLabel(file: { name: string; type?: string }): string {
  const ext = getExtension(file.name);
  if (ext && ext.length <= 5) return ext.toUpperCase();
  const kind = getFileKind(file);
  return kind === 'unknown' ? 'FILE' : kind.slice(0, 4).toUpperCase();
}

/** Kinds that browsers can render as an `<img>` without extra libraries. */
export function isPreviewableImage(file: { name: string; type?: string }): boolean {
  const type = (file.type ?? '').toLowerCase();
  if (type) return /^image\/(png|jpe?g|webp|gif|svg\+xml|avif|bmp|x-icon|vnd\.microsoft\.icon)$/.test(type);
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif', 'bmp', 'ico'].includes(getExtension(file.name));
}
