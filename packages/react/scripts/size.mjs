// Reports raw / gzip / brotli sizes of the published entry points.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, brotliCompressSync } from 'node:zlib';

const dist = join(dirname(fileURLToPath(import.meta.url)), '../dist');
const files = ['index.js', 'index.cjs', 'core.js', 'styles.css'];
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

console.log('file'.padEnd(14), 'raw'.padStart(10), 'gzip'.padStart(10), 'brotli'.padStart(10));
for (const file of files) {
  const path = join(dist, file);
  if (!existsSync(path)) {
    console.log(file.padEnd(14), 'missing – run npm run build');
    continue;
  }
  const buffer = readFileSync(path);
  console.log(
    file.padEnd(14),
    kb(buffer.length).padStart(10),
    kb(gzipSync(buffer, { level: 9 }).length).padStart(10),
    kb(brotliCompressSync(buffer).length).padStart(10),
  );
}
