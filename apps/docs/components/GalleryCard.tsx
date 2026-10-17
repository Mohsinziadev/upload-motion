'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { PresetId, UploadPreset } from 'upload-motion';
import { CopyButton } from './CopyButton';
import { DemoUploader } from './DemoUploader';

const CATEGORY_LABEL: Record<string, string> = {
  reference: 'Signature',
  professional: 'Professional',
  expressive: 'Expressive',
  media: 'Media-aware',
};

export function GalleryCard({
  preset,
  code,
  codeHtml,
}: {
  preset: Pick<UploadPreset, 'id' | 'name' | 'description' | 'category' | 'bestFor'> & { autoUpload: boolean };
  code: string;
  codeHtml: string;
}) {
  const [showCode, setShowCode] = useState(false);
  const panelId = `code-${preset.id}`;
  return (
    <article className="gallery-card card" id={preset.id} aria-labelledby={`${preset.id}-title`}>
      <header className="gallery-card__head">
        <div>
          <span className="gallery-card__cat" data-cat={preset.category}>
            {CATEGORY_LABEL[preset.category]}
          </span>
          <h2 id={`${preset.id}-title`}>{preset.name}</h2>
        </div>
        <span className="pill">{preset.autoUpload ? 'Auto upload' : 'Manual start'}</span>
      </header>
      <p className="gallery-card__desc">{preset.description}</p>
      <ul className="gallery-card__tags" aria-label="Best for">
        {preset.bestFor.map((use) => (
          <li key={use} className="pill">
            {use}
          </li>
        ))}
      </ul>
      <div className="gallery-card__stage">
        <DemoUploader preset={preset.id as PresetId} compact />
      </div>
      <footer className="gallery-card__foot">
        <button
          type="button"
          className="button button--ghost button--small"
          aria-expanded={showCode}
          aria-controls={panelId}
          onClick={() => setShowCode((value) => !value)}
        >
          {showCode ? 'Hide code' : 'Show code'}
        </button>
        <Link className="button button--primary button--small" href={`/playground?preset=${preset.id}`}>
          Customize in playground
        </Link>
      </footer>
      <div id={panelId} hidden={!showCode} className="code gallery-card__code">
        <div className="code__bar">
          <span>{preset.id}.tsx</span>
          <CopyButton text={code} />
        </div>
        <div dangerouslySetInnerHTML={{ __html: codeHtml }} />
      </div>
    </article>
  );
}
