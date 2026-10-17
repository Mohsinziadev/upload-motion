import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts', core: 'src/core/index.ts' },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
  fixedExtension: false,
  deps: { neverBundle: ['react', 'react-dom', 'react/jsx-runtime'] },
  // Only the React entry is a client boundary; `upload-motion/core` stays usable on the server.
  banner: ({ fileName }) => (/^index\.(c?js)$/.test(fileName) ? { js: "'use client';" } : undefined),
});
