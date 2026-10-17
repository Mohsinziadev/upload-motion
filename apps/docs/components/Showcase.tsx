'use client';

import Link from 'next/link';
import { useState } from 'react';
import { presets, type PresetId } from 'upload-motion';
import { DemoUploader } from './DemoUploader';

const CATEGORY_LABEL: Record<string, string> = {
  reference: 'Signature',
  professional: 'Professional',
  expressive: 'Expressive',
  media: 'Media-aware',
};

export function Showcase() {
  const [active, setActive] = useState<PresetId>('segment-ring');
  const preset = presets.find((item) => item.id === active)!;
  return (
    <div className="showcase">
      <div className="showcase__rail" role="tablist" aria-label="Animation presets" aria-orientation="vertical">
        {presets.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === active}
            aria-controls="showcase-panel"
            className="showcase__item"
            onClick={() => setActive(item.id as PresetId)}
          >
            <span className="showcase__name">{item.name}</span>
            <span className="showcase__cat">{CATEGORY_LABEL[item.category]}</span>
          </button>
        ))}
      </div>
      <div className="showcase__stage card" id="showcase-panel" role="tabpanel" aria-label={preset.name}>
        <div className="showcase__meta">
          <div>
            <h3>{preset.name}</h3>
            <p>{preset.description}</p>
          </div>
          <Link className="button button--ghost button--small" href={`/playground?preset=${preset.id}`}>
            Open in playground →
          </Link>
        </div>
        <DemoUploader key={active} preset={active} autoplay />
      </div>
    </div>
  );
}
