# Contributing

## Development loop

```bash
npm install
npm run dev     # package watch build + docs at http://localhost:3000
npm run check   # lint, typecheck, tests, build: run before opening a PR
```

The docs site consumes the **built** package (`packages/react/dist`), exactly like an external app would. When you change library code, keep `npm run dev` running or rebuild with `npm run build:lib`.

## Conventions

- **Core stays framework-free.** Nothing in `packages/react/src/core` may import React or other `src` folders (ESLint enforces this).
- **Every preset needs:** an entry in `src/core/preset-catalog.ts`, a component in `src/animations/`, a stylesheet in `src/styles/presets/`, reduced-motion behaviour (decorative layers marked `um-deco` or `aria-hidden`), keyboard access to every action, and a row in the preset tests (added automatically through `presets`).
- **Animate cheaply.** Use transform, opacity and clip-path, driven by CSS variables (`--um-p`, `--um-time`, `--um-intensity`). Avoid per-frame React renders for decoration.
- **Never fake success.** UI must not show "uploaded" unless the handler resolved, and simulated transports must stay badged.
- **Write tests** for new engine behaviour (`tests/core`) and user-visible interactions (`tests/react`).

## Landing page

The package's landing page lives in `packages/react/demo/` (Vite + React) and is published on
[m2toolkit.com/npm-packages/upload-motion](https://www.m2toolkit.com/npm-packages/upload-motion).

```bash
cd packages/react
npm run demo                                          # dev server on http://localhost:5180
SITE_BASE=/npm-packages/upload-motion/ npm run build:site   # prerendered page → site-dist/
```

- `scripts/build-site.mjs` is shared verbatim with the other packages listed on m2toolkit.com; per-package
  settings (listing title, tagline, highlights, accent) live in `packages/react/site.config.json`.
- The page must keep exactly one `<h1>`, a 15–65 character `<title>` and a 70–170 character meta description.
- The site is static, so every demo uses the clearly badged simulated transport.
- To publish changes, run `npm run sync:packages -- --only upload-motion` in the m2toolkit repo and commit its
  `public/npm-packages/` and `src/data/npm-packages.generated.json` changes.

## Releasing (maintainers)

1. Update `packages/react/CHANGELOG.md` and bump the version in `packages/react/package.json` (semver).
2. `npm run check`
3. `cd packages/react && npm pack --dry-run` and review the file list.
4. `npm publish` from `packages/react` (`prepublishOnly` runs typecheck, tests and build again).
