import { useEffect, useMemo, useState } from 'react';
import { FileUpload, type PresetId } from 'upload-motion';
import { type Mode } from '../lib/mode';
import { createDemoUploader, useDemoStore } from './demo';

const TABS: { id: PresetId; label: string; hint: string }[] = [
  { id: 'wave-bar', label: 'Wave Bar', hint: 'Expand it to manage each file, or pause the whole batch.' },
  { id: 'card-fan', label: 'Card Fan', hint: 'Drag files from your desktop: the cards fan out before you reach the zone.' },
  { id: 'hoop-shot', label: 'Hoop Shot', hint: 'Pull a file back and release to shoot it into the hoop. Enter takes the perfect shot.' },
];

function HeroUploader({ preset, mode, autoplay }: { preset: PresetId; mode: Mode; autoplay: boolean }) {
  const { store, loading, load } = useDemoStore();
  const upload = useMemo(() => createDemoUploader(), []);
  useEffect(() => {
    if (autoplay) void load(['image', 'pdf', 'audio']);
  }, [autoplay, load]);

  return (
    <>
      <div className="hero-stage">
        <FileUpload preset={preset} store={store} upload={upload} appearance={{ theme: mode }} maxSize={25 * 1024 * 1024} />
      </div>
      <div className="hero-card-foot">
        <span className="sim-note">
          <span className="sim-dot" aria-hidden="true" />
          Simulated uploads · nothing leaves your browser
        </span>
        <span className="hero-card-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => load(['image', 'pdf', 'audio'])} disabled={loading}>
            {loading ? 'Generating…' : 'Add sample files'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => store.clear()}>
            Reset
          </button>
        </span>
      </div>
    </>
  );
}

export function HeroDemo({ mode }: { mode: Mode }) {
  const [active, setActive] = useState<PresetId>('wave-bar');
  const tab = TABS.find((item) => item.id === active)!;
  return (
    <div className="hero-card">
      <div className="hero-card-head">
        <div className="tabs" role="tablist" aria-label="Signature presets">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`hero-tab-${item.id}`}
              aria-selected={item.id === active}
              aria-controls="hero-panel"
              className="tab"
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div id="hero-panel" role="tabpanel" aria-labelledby={`hero-tab-${active}`} className="hero-panel">
        <p className="hero-card-kicker">{tab.hint}</p>
        {/* Keyed so each preset starts with its own queue. */}
        <HeroUploader key={active} preset={active} mode={mode} autoplay />
      </div>
    </div>
  );
}
