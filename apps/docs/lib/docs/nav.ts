export interface DocLink {
  slug: string;
  title: string;
  description: string;
}

export interface DocSection {
  title: string;
  links: DocLink[];
}

/** Single source of truth for docs navigation, ordering and metadata. */
export const DOC_SECTIONS: DocSection[] = [
  {
    title: 'Getting started',
    links: [
      { slug: '', title: 'Installation & quick start', description: 'Install the package, import the styles and render your first animated uploader.' },
      { slug: 'presets', title: 'Animation presets', description: 'All 17 presets, what they are for and which customisation props each supports.' },
    ],
  },
  {
    title: 'API',
    links: [
      { slug: 'components', title: 'Components', description: 'FileUpload, Uploader and every composable part, with full prop tables.' },
      { slug: 'headless', title: 'Headless & core', description: 'useUploader, createUploadStore and the framework-agnostic upload-motion/core entry.' },
      { slug: 'theming', title: 'Theming & customisation', description: 'Appearance tokens, CSS variables, dark mode, motion controls, labels and class names.' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { slug: 'upload-handlers', title: 'Upload handlers', description: 'Connect any backend: multipart POST, presigned S3/R2/GCS URLs, or your own transport.' },
      { slug: 'progress', title: 'Progress reporting', description: 'How real progress, speed and ETA are measured – and how simulated progress is labelled.' },
      { slug: 'validation', title: 'File validation', description: 'Accepted types, size limits, file counts and custom validators with human messages.' },
      { slug: 'multiple-files', title: 'Multi-file queues', description: 'Concurrency, manual start, single-file mode, removing and clearing files.' },
      { slug: 'errors', title: 'Errors, retries & cancellation', description: 'Error codes, automatic retry with backoff, manual retry, cancel, pause and resume.' },
      { slug: 'accessibility', title: 'Accessibility', description: 'Keyboard support, screen-reader announcements, reduced motion and custom renderer guidance.' },
      { slug: 'performance', title: 'Performance', description: 'Rendering strategy, large queues, previews, media analysis limits and bundle size.' },
      { slug: 'examples', title: 'Integration examples', description: 'Next.js route handlers, Express, presigned uploads, forms and chunked transports.' },
      { slug: 'troubleshooting', title: 'Troubleshooting', description: 'Missing styles, server components, drag-and-drop conflicts, CORS and more.' },
    ],
  },
];

export const DOC_LINKS: DocLink[] = DOC_SECTIONS.flatMap((section) => section.links);

export function docHref(slug: string) {
  return slug ? `/docs/${slug}` : '/docs';
}
