import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

export interface BundleSizes {
  js: number;
  core: number;
  css: number;
}

function findDist(): string | null {
  const candidates = [
    join(process.cwd(), 'node_modules/upload-motion/dist'),
    join(process.cwd(), '../../node_modules/upload-motion/dist'),
    join(process.cwd(), '../../packages/react/dist'),
  ];
  return candidates.find((dir) => existsSync(join(dir, 'index.js'))) ?? null;
}

const gz = (file: string) => gzipSync(readFileSync(/*turbopackIgnore: true*/ file), { level: 9 }).length;

/** Gzipped sizes measured from the built package at build time – never hard-coded. */
export function getBundleSizes(): BundleSizes | null {
  const dist = findDist();
  if (!dist) return null;
  const chunk = (prefix: string) =>
    readdirSync(/*turbopackIgnore: true*/ dist)
      .filter((file) => file.startsWith(prefix) && file.endsWith('.js'))
      .map((file) => join(/*turbopackIgnore: true*/ dist, file));
  const core = chunk('core').reduce((sum, file) => sum + gz(file), 0);
  return {
    js: gz(join(/*turbopackIgnore: true*/ dist, 'index.js')) + core,
    core,
    css: gz(join(/*turbopackIgnore: true*/ dist, 'styles.css')),
  };
}

export const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`;
