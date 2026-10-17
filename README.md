# upload-motion monorepo

Animated, accessible file uploads for React. This repository contains the publishable package and its documentation site.

```
upload-motion/
├── packages/react/        # the npm package "upload-motion"
│   ├── src/core/          # framework-agnostic engine: store, transports, validation, preset catalog
│   ├── src/hooks/         # useUploader, useDropzone, media analysis, list animation
│   ├── src/components/    # Uploader, FileUpload and composable parts
│   ├── src/animations/    # the 17 presets and per-file visualizers
│   ├── src/styles/        # base tokens + one stylesheet per preset → dist/styles.css
│   ├── src/themes/        # appearance → CSS variables, default labels
│   └── tests/             # Vitest + Testing Library
└── apps/docs/             # Next.js site: landing, gallery, playground, documentation, demo upload API
```

## Getting started

Requires Node 22.12+ and npm 11 (see `packageManager`). npm 10.9 hits an arborist bug ("Cannot read properties of null (reading 'edgesOut')") while resolving Vitest's optional peers, so use `npx npm@11 install` if your global npm is older.

```bash
npm install
npm run dev          # builds the package, then runs the docs site (port 3000, or the next free port)
```

| Script | What it does |
| --- | --- |
| `npm run build` | Builds the package (tsdown + CSS) and then the docs site (Turbo handles the order) |
| `npm run test` | Package unit and component tests |
| `npm run lint` | ESLint across the monorepo |
| `npm run typecheck` | `tsc` for the package and the docs app |
| `npm run check` | All of the above |
| `npm run size` | Raw / gzip / brotli sizes of the built package |

## Architecture notes

- **Engine and UI are separate.** `src/core` imports nothing from React and is enforced by an ESLint rule. A Vue or vanilla adapter only needs to subscribe to `createUploadStore()` and render.
- **Presets are pure presentation.** Each preset reads state from `useUploaderContext()`, so switching presets never touches upload logic.
- **Honest progress.** Without a handler nothing is reported as uploaded, and simulated transports are flagged (`handler.simulated`) and badged in every preset.
- **Client boundary.** Only the React entry (`dist/index.*`) carries `'use client'`. `upload-motion/core`, including `presetCatalog`, stays server-safe.

## Demo upload endpoint

`apps/docs/app/api/upload/route.ts` streams and counts the request body, then discards it. It supports `x-throttle-kbps` (server read throttle that produces genuine slow progress through TCP backpressure) and `x-simulate-failure`. It caps uploads at 50 MB and stores nothing.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for conventions and the release checklist.
