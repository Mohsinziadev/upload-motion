import Link from 'next/link';
import type { ComponentType } from 'react';
import { ComponentsDoc, HeadlessDoc, ThemingDoc } from './content-api';
import {
  AccessibilityDoc,
  ErrorsDoc,
  ExamplesDoc,
  MultipleFilesDoc,
  PerformanceDoc,
  ProgressDoc,
  TroubleshootingDoc,
  UploadHandlersDoc,
  ValidationDoc,
} from './content-guides';
import { GettingStarted, PresetsDoc } from './content-start';
import { DOC_LINKS, docHref } from './nav';

export const DOC_CONTENT: Record<string, ComponentType> = {
  '': GettingStarted,
  presets: PresetsDoc,
  components: ComponentsDoc,
  headless: HeadlessDoc,
  theming: ThemingDoc,
  'upload-handlers': UploadHandlersDoc,
  progress: ProgressDoc,
  validation: ValidationDoc,
  'multiple-files': MultipleFilesDoc,
  errors: ErrorsDoc,
  accessibility: AccessibilityDoc,
  performance: PerformanceDoc,
  examples: ExamplesDoc,
  troubleshooting: TroubleshootingDoc,
};

export function DocPage({ slug }: { slug: string }) {
  const index = DOC_LINKS.findIndex((link) => link.slug === slug);
  const link = DOC_LINKS[index]!;
  const Content = DOC_CONTENT[slug]!;
  const previous = DOC_LINKS[index - 1];
  const next = DOC_LINKS[index + 1];
  return (
    <>
      <header className="doc-header">
        <span className="kicker">Documentation</span>
        <h1>{link.title}</h1>
        <p>{link.description}</p>
      </header>
      <Content />
      <nav className="doc-pager" aria-label="Previous and next page">
        {previous ? (
          <Link href={docHref(previous.slug)} data-dir="prev">
            <span>← Previous</span>
            <strong>{previous.title}</strong>
          </Link>
        ) : null}
        {next ? (
          <Link href={docHref(next.slug)} data-dir="next">
            <span>Next →</span>
            <strong>{next.title}</strong>
          </Link>
        ) : null}
      </nav>
    </>
  );
}
