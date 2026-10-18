import { useMemo, useState } from 'react';
import { FileUpload, formatBytes, presets, type FileUploadProps, type PresetId } from 'upload-motion';
import { type Mode } from '../lib/mode';
import { acceptOf, DEFAULT_CONFIG, generateCode, generateConfigJson, type PlaygroundConfig } from '../lib/playground';
import { createOversizedFile, createSampleFile, SAMPLE_LABELS, samplesFor, type SampleKind } from '../lib/samples';
import { createDemoUploader, useDemoStore } from './demo';
import { CodeBlock, Panel, Segmented, Slider, Toggle } from './ui';

const CATEGORY_ORDER = ['reference', 'professional', 'expressive', 'media'] as const;
const CATEGORY_LABEL = { reference: 'Signature', professional: 'Professional', expressive: 'Expressive', media: 'Media-aware' };
const SWATCHES = ['#7357ff', '#2563eb', '#0f9f6e', '#ea580c', '#e11d48', '#18181b'];

interface LogEntry {
  id: number;
  type: string;
  text: string;
}
let logId = 0;

export function Playground({ preset, onPreset, mode }: { preset: PresetId; onPreset: (id: PresetId) => void; mode: Mode }) {
  const [config, setConfig] = useState<PlaygroundConfig>({ ...DEFAULT_CONFIG, theme: 'system' });
  const [tab, setTab] = useState<'jsx' | 'json'>('jsx');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const { store } = useDemoStore();
  const upload = useMemo(() => createDemoUploader(config.failureRate), [config.failureRate]);
  const update = <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) => setConfig((current) => ({ ...current, [key]: value }));
  const theme = config.theme === 'system' ? mode : config.theme;
  const current = { ...config, preset };
  const info = presets.find((item) => item.id === preset)!;

  const push = (type: string, text: string) => setLog((entries) => [{ id: (logId += 1), type, text }, ...entries].slice(0, 30));

  const props: Omit<FileUploadProps, 'preset' | 'store'> = {
    upload,
    accept: acceptOf(config),
    multiple: config.multiple,
    maxFiles: config.multiple && config.maxFiles > 0 ? config.maxFiles : undefined,
    maxSize: config.maxSizeMb * 1024 * 1024,
    concurrency: config.concurrency,
    retry: { attempts: config.retries },
    autoUpload: config.autoUpload === 'preset' ? undefined : config.autoUpload === 'on',
    progressVariant: config.progressVariant === 'preset' ? undefined : config.progressVariant,
    appearance: { theme, accent: config.accent, accentSecondary: config.accentSecondary, radius: config.radius, density: config.density },
    motion: { speed: config.speed, intensity: config.intensity, particles: config.particles, reducedMotion: config.reducedMotion },
    onFilesAdded: (items) => push('added', items.map((item) => item.name).join(', ')),
    onFilesRejected: (rejections) => push('rejected', rejections.map((r) => r.errors[0]?.message).join(' ')),
    onUploadStart: (item) => push('start', `${item.name} (attempt ${item.attempts})`),
    onUploadSuccess: (item) => push('success', item.name),
    onUploadError: (item, error) => push('error', `${item.name}: ${error.message}`),
    onUploadCancel: (item) => push('cancel', item.name),
    onQueueComplete: (items) => push('complete', `${items.filter((i) => i.status === 'success').length} of ${items.length} uploaded`),
  };

  const addSample = async (kind: SampleKind | 'best' | 'oversized') => {
    setBusy(kind);
    try {
      if (kind === 'oversized') {
        store.addFiles([createOversizedFile(config.maxSizeMb * 1024 * 1024)]);
        return;
      }
      const kinds = kind === 'best' ? samplesFor(preset) : [kind];
      const files = (await Promise.all(kinds.map((k) => createSampleFile(k)))).filter((file): file is File => file !== null);
      if (files.length === 0) push('rejected', 'This browser can’t record a sample video (MediaRecorder unavailable).');
      store.addFiles(files);
    } finally {
      setBusy(null);
    }
  };

  const code = generateCode(current);
  const json = generateConfigJson(current);

  return (
    <div className="playground">
      <div className="pg-main">
        <div className="pg-preview">
          <div className="pg-toolbar">
            <div className="pg-samples" role="group" aria-label="Add sample files">
              <button type="button" className="chip chip-accent" onClick={() => addSample('best')} disabled={busy !== null}>
                Samples for {info.name}
              </button>
              {(['image', 'pdf', 'csv', 'audio', 'video', 'zip'] as SampleKind[]).map((kind) => (
                <button key={kind} type="button" className="chip" onClick={() => addSample(kind)} disabled={busy !== null}>
                  {busy === kind ? 'Generating…' : SAMPLE_LABELS[kind].replace(/ \(.*\)/, '')}
                </button>
              ))}
              <button type="button" className="chip chip-warn" onClick={() => addSample('oversized')} disabled={busy !== null}>
                Too large ({formatBytes((config.maxSizeMb + 1) * 1024 * 1024)})
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => store.clear()}>
              Clear
            </button>
          </div>
          <div className="pg-stage" data-theme={theme}>
            <FileUpload preset={preset} store={store} {...props} />
          </div>
          <div className="pg-log" aria-label="Lifecycle callbacks">
            {log.length === 0 ? (
              <span className="muted">Callbacks appear here as they fire: onUploadStart, onUploadSuccess, onUploadError…</span>
            ) : (
              <ol>
                {log.slice(0, 4).map((entry) => (
                  <li key={entry.id} data-type={entry.type}>
                    <span className="pg-log-type">{entry.type}</span>
                    <span className="pg-log-text">{entry.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
        <CodeBlock
          code={tab === 'jsx' ? code : json}
          title={
            <span className="code-tabs" role="tablist" aria-label="Output">
              <button type="button" role="tab" aria-selected={tab === 'jsx'} onClick={() => setTab('jsx')}>
                Uploader.tsx
              </button>
              <button type="button" role="tab" aria-selected={tab === 'json'} onClick={() => setTab('json')}>
                config.json
              </button>
            </span>
          }
        />
      </div>

      <aside className="pg-controls" aria-label="Playground settings">
        <Panel title="Preset">
          <div className="field">
            <label className="field-label" htmlFor="pg-preset">
              Animation preset
            </label>
            <select id="pg-preset" className="select" value={preset} onChange={(event) => onPreset(event.target.value as PresetId)}>
              {CATEGORY_ORDER.map((category) => (
                <optgroup key={category} label={CATEGORY_LABEL[category]}>
                  {presets
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <Segmented
            label="Progress style"
            value={config.progressVariant}
            onChange={(value) => update('progressVariant', value)}
            options={[
              { value: 'preset', label: 'Preset' },
              { value: 'bar', label: 'Bar' },
              { value: 'ring', label: 'Ring' },
              { value: 'wave', label: 'Wave' },
              { value: 'beam', label: 'Beam' },
            ]}
          />
        </Panel>
        <Panel title="Appearance">
          <Segmented
            label="Theme"
            value={config.theme}
            onChange={(value) => update('theme', value)}
            options={[
              { value: 'system', label: 'Page' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <fieldset className="field">
            <legend className="field-label">Accent</legend>
            <div className="swatches">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className="swatch"
                  style={{ background: swatch }}
                  aria-label={`Accent ${swatch}`}
                  aria-pressed={config.accent === swatch}
                  onClick={() => setConfig((c) => ({ ...c, accent: swatch, accentSecondary: swatch }))}
                />
              ))}
              <input
                type="color"
                className="swatch-input"
                aria-label="Custom accent colour"
                value={config.accent}
                onChange={(event) => setConfig((c) => ({ ...c, accent: event.target.value, accentSecondary: event.target.value }))}
              />
            </div>
          </fieldset>
          <Slider label="Corner radius" value={config.radius} min={0} max={28} step={1} onChange={(v) => update('radius', v)} format={(v) => `${v}px`} />
          <Segmented
            label="Density"
            value={config.density}
            onChange={(value) => update('density', value)}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'spacious', label: 'Spacious' },
            ]}
          />
        </Panel>
        <Panel title="Motion">
          <Slider label="Speed" value={config.speed} min={0.5} max={2} step={0.1} onChange={(v) => update('speed', v)} format={(v) => `${v.toFixed(1)}×`} />
          <Slider label="Intensity" value={config.intensity} min={0} max={1.5} step={0.1} onChange={(v) => update('intensity', v)} format={(v) => v.toFixed(1)} />
          <Slider label="Particles" value={config.particles} min={0} max={1} step={0.1} onChange={(v) => update('particles', v)} format={(v) => (v === 0 ? 'Off' : v.toFixed(1))} />
          <Segmented
            label="Reduced motion"
            value={config.reducedMotion}
            onChange={(value) => update('reducedMotion', value)}
            options={[
              { value: 'user', label: 'Follow OS' },
              { value: 'always', label: 'Always' },
              { value: 'never', label: 'Never' },
            ]}
          />
        </Panel>
        <Panel title="Files & queue" open={false}>
          <Toggle label="Multiple files" checked={config.multiple} onChange={(v) => update('multiple', v)} hint={config.multiple ? undefined : 'A new file replaces the current one'} />
          {config.multiple ? (
            <Slider label="Max files" value={config.maxFiles} min={0} max={20} step={1} onChange={(v) => update('maxFiles', v)} format={(v) => (v === 0 ? 'No limit' : String(v))} />
          ) : null}
          <Slider label="Max file size" value={config.maxSizeMb} min={1} max={50} step={1} onChange={(v) => update('maxSizeMb', v)} format={(v) => `${v} MB`} />
          <div className="field">
            <label className="field-label" htmlFor="pg-accept">
              Accepted types
            </label>
            <select id="pg-accept" className="select" value={config.accept} onChange={(event) => update('accept', event.target.value as PlaygroundConfig['accept'])}>
              <option value="any">Any file</option>
              <option value="images">Images only</option>
              <option value="documents">Documents</option>
              <option value="media">Images, video & audio</option>
            </select>
          </div>
          <Slider label="Concurrency" value={config.concurrency} min={1} max={6} step={1} onChange={(v) => update('concurrency', v)} />
          <Slider label="Failure rate" value={config.failureRate} min={0} max={0.8} step={0.1} onChange={(v) => update('failureRate', v)} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Auto retries" value={config.retries} min={0} max={3} step={1} onChange={(v) => update('retries', v)} />
          <Segmented
            label="Start uploads"
            value={config.autoUpload}
            onChange={(value) => update('autoUpload', value)}
            options={[
              { value: 'preset', label: 'Preset' },
              { value: 'on', label: 'Auto' },
              { value: 'off', label: 'Manual' },
            ]}
          />
        </Panel>
        <button type="button" className="btn btn-ghost btn-sm pg-reset" onClick={() => setConfig({ ...DEFAULT_CONFIG, theme: 'system' })}>
          Reset settings
        </button>
      </aside>
    </div>
  );
}
