import { useMemo, useRef, useState } from 'react';
import { FileUpload, presets, type PresetCategory, type PresetId } from 'upload-motion';
import { type Mode } from '../lib/mode';
import { samplesFor } from '../lib/samples';
import { createDemoUploader, useDemoStore, useOnceVisible } from './demo';

const CATEGORIES: { id: PresetCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reference', label: 'Signature' },
  { id: 'professional', label: 'Professional' },
  { id: 'expressive', label: 'Expressive' },
  { id: 'media', label: 'Media-aware' },
];

const CATEGORY_LABEL: Record<PresetCategory, string> = {
  reference: 'Signature',
  professional: 'Professional',
  expressive: 'Expressive',
  media: 'Media-aware',
};

function Stage({ preset, mode, autoplay }: { preset: PresetId; mode: Mode; autoplay: boolean }) {
  const { store, loading, load } = useDemoStore();
  const upload = useMemo(() => createDemoUploader(), []);
  const ref = useRef<HTMLDivElement>(null);
  useOnceVisible(ref, () => void load(samplesFor(preset)), autoplay);
  return (
    <div ref={ref} className="showcase-stage">
      <FileUpload preset={preset} store={store} upload={upload} appearance={{ theme: mode }} />
      <div className="showcase-stage-foot">
        <span className="sim-note">
          <span className="sim-dot" aria-hidden="true" />
          Simulated uploads
        </span>
        <span className="hero-card-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => load(samplesFor(preset))} disabled={loading}>
            {loading ? 'Generating…' : 'Replay with samples'}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => store.clear()}>
            Reset
          </button>
        </span>
      </div>
    </div>
  );
}

export function Showcase({ mode, onCustomize }: { mode: Mode; onCustomize: (id: PresetId) => void }) {
  const [category, setCategory] = useState<PresetCategory | 'all'>('all');
  const [active, setActive] = useState<PresetId>('hoop-shot');
  const [interacted, setInteracted] = useState(false);
  const visible = presets.filter((preset) => category === 'all' || preset.category === category);
  const preset = presets.find((item) => item.id === active)!;

  return (
    <div className="showcase">
      <div className="chips" role="group" aria-label="Filter presets by style">
        {CATEGORIES.map((item) => (
          <button key={item.id} type="button" className="chip" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>
            {item.label}
            <span className="chip-count">{item.id === 'all' ? presets.length : presets.filter((p) => p.category === item.id).length}</span>
          </button>
        ))}
      </div>
      <div className="showcase-grid">
        <div className="showcase-list" role="tablist" aria-label="Presets" aria-orientation="vertical">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === active}
              aria-controls="showcase-panel"
              className="showcase-item"
              onClick={() => {
                setInteracted(true);
                setActive(item.id as PresetId);
              }}
            >
              <span className="showcase-name">{item.name}</span>
              <span className="showcase-cat">{CATEGORY_LABEL[item.category]}</span>
            </button>
          ))}
        </div>
        <div className="showcase-panel" id="showcase-panel" role="tabpanel" aria-labelledby="showcase-title">
          <div className="showcase-meta">
            <div>
              <h3 id="showcase-title">
                {preset.name} <code>{preset.id}</code>
              </h3>
              <p>{preset.description}</p>
              <ul className="tags" aria-label="Best for">
                {preset.bestFor.map((use) => (
                  <li key={use}>{use}</li>
                ))}
                {preset.defaults?.autoUpload === false ? <li className="tag-strong">Manual start</li> : null}
              </ul>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onCustomize(preset.id as PresetId)}>
              Customize in playground
            </button>
          </div>
          <Stage key={active} preset={active} mode={mode} autoplay={interacted || active === 'hoop-shot'} />
        </div>
      </div>
    </div>
  );
}
