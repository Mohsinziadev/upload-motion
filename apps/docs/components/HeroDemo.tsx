'use client';

import { useState } from 'react';
import type { PresetId } from 'upload-motion';
import { DemoUploader } from './DemoUploader';

const TABS: { id: PresetId; label: string }[] = [
  { id: 'wave-bar', label: 'Wave Bar' },
  { id: 'card-fan', label: 'Card Fan' },
  { id: 'hoop-shot', label: 'Hoop Shot' },
];

export function HeroDemo() {
  const [active, setActive] = useState<PresetId>('wave-bar');
  return (
    <div className="hero-demo">
      <div className="hero-demo__tabs" role="tablist" aria-label="Featured presets">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`hero-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls="hero-panel"
            className="hero-demo__tab"
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id="hero-panel" role="tabpanel" aria-labelledby={`hero-tab-${active}`} className="hero-demo__panel">
        <DemoUploader key={active} preset={active} autoplay={active === 'wave-bar'} samples={['image', 'pdf', 'audio']} />
      </div>
      <p className="hero-demo__hint">
        {active === 'wave-bar'
          ? 'Drop your own files on the bar, or expand it to manage each upload.'
          : active === 'card-fan'
            ? 'Drag files from your desktop – the cards fan out before you even reach the zone.'
            : 'Add files, then pull one back and release to shoot it into the hoop.'}
      </p>
    </div>
  );
}
