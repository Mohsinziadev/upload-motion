# Changelog

All notable changes to `upload-motion` are documented here. The project follows [Semantic Versioning](https://semver.org): breaking API changes bump the major version (minor while in 0.x), new features bump the minor version, and fixes bump the patch version.

## 0.1.0 – unreleased

Initial release.

- Framework-agnostic upload engine (`upload-motion/core`): queue, concurrency, pause/resume, cancel, retry with backoff, validation, rAF-batched snapshots.
- Transports: `createXhrUploader` (multipart or raw/presigned PUT, real progress) and `createSimulatedUploader` (badged demo transport).
- React layer: `FileUpload`, `Uploader` with composable parts, `useUploader`, `useDropzone`, and media analysis hooks.
- 17 motion presets, including the reference-inspired Card Fan, Wave Bar and Hoop Shot.
- Theming through `appearance` and CSS variables, motion controls, i18n labels, and reduced-motion support.
