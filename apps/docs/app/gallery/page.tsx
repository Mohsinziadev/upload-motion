import type { Metadata } from 'next';
import { presetCatalog as presets } from 'upload-motion/core';
import { highlight } from '@/components/Code';
import { GalleryCard } from '@/components/GalleryCard';
import './gallery.css';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Every upload-motion preset, live and interactive, with code you can copy.',
};

function snippetFor(id: string, autoUpload: boolean) {
  return `import { FileUpload, createXhrUploader } from 'upload-motion';
import 'upload-motion/styles.css';

const upload = createXhrUploader({ url: '/api/upload' });

export function Uploader() {
  return <FileUpload preset="${id}" upload={upload} />;
}${autoUpload ? '' : `\n\n// "${id}" starts uploads manually by default – pass autoUpload to change that.`}`;
}

export default async function GalleryPage() {
  const cards = await Promise.all(
    presets.map(async (preset) => {
      const autoUpload = preset.defaults?.autoUpload !== false;
      const code = snippetFor(preset.id, autoUpload);
      return {
        preset: {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          category: preset.category,
          bestFor: preset.bestFor,
          autoUpload,
        },
        code,
        codeHtml: await highlight(code),
      };
    }),
  );

  return (
    <div className="container gallery-page">
      <header className="gallery-intro">
        <span className="kicker">Gallery</span>
        <h1 className="h2">
          {presets.length} presets, all <em>live</em>.
        </h1>
        <p className="lead">
          Each card runs the real component. Drop your own files onto any of them, or press <strong>Add sample files</strong> to generate
          images, documents, audio and video right in your browser. Uploads here use a clearly labelled simulated transport.
        </p>
        <nav className="gallery-jump" aria-label="Jump to preset">
          {presets.map((preset) => (
            <a key={preset.id} href={`#${preset.id}`} className="pill">
              {preset.name}
            </a>
          ))}
        </nav>
      </header>
      <div className="gallery-grid">
        {cards.map((card) => (
          <GalleryCard key={card.preset.id} {...card} />
        ))}
      </div>
    </div>
  );
}
