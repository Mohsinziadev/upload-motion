// Concatenates src/styles into dist/styles.css (base first, then presets alphabetically)
// and strips comments/blank lines. Pass --watch to rebuild on change.
import { mkdirSync, readdirSync, readFileSync, watch, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stylesDir = join(root, 'src/styles');
const outFile = join(root, 'dist/styles.css');

function build() {
  const presetDir = join(stylesDir, 'presets');
  const files = [
    join(stylesDir, 'base.css'),
    ...readdirSync(presetDir)
      .filter((file) => file.endsWith('.css'))
      .sort()
      .map((file) => join(presetDir, file)),
  ];
  const css = files
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `/* upload-motion | MIT */\n${css}\n`);
  // Lets `import 'upload-motion/styles.css'` type-check under noUncheckedSideEffectImports (TS 6 default).
  writeFileSync(`${outFile}.d.ts`, 'export {};\n');
  console.log(`styles.css: ${(Buffer.byteLength(css) / 1024).toFixed(1)} kB from ${files.length} files`);
}

build();
if (process.argv.includes('--watch')) {
  watch(stylesDir, { recursive: true }, () => build());
}
