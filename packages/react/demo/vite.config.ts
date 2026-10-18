import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pkg = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

// The demo consumes the package by name, exactly like an app would, but from source.
// Styles come from dist/styles.css, which `npm run demo` / `build:site` build first.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^upload-motion\/styles\.css$/, replacement: pkg('dist/styles.css') },
      { find: /^upload-motion\/core$/, replacement: pkg('src/core/index.ts') },
      { find: /^upload-motion$/, replacement: pkg('src/index.ts') },
    ],
  },
  server: { port: 5180 },
  build: { outDir: pkg('site-dist'), emptyOutDir: true },
});
