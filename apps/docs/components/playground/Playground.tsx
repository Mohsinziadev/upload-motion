'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  createUploadStore,
  FileUpload,
  formatBytes,
  getPreset,
  presets,
  type FileUploadProps,
  type PresetId,
  type UploadStore,
} from 'upload-motion';
import { CopyButton } from '@/components/CopyButton';
import { createDemoTransport } from '@/lib/demo-transport';
import { highlightTsx } from '@/lib/highlight';
import { createOversizedFile, createSampleFile, SAMPLE_LABELS, samplesFor, type SampleKind } from '@/lib/sample-files';
import { useSiteTheme } from '@/lib/site-theme';
import { acceptOf, DEFAULT_CONFIG, generateCode, generateConfigJson, type PlaygroundConfig } from './config';
import { ColorField, Field, Section, Segmented, Slider, Toggle } from './Controls';

interface LogEntry {
  id: number;
  time: string;
  type: 'added' | 'rejected' | 'start' | 'success' | 'error' | 'cancel' | 'removed' | 'complete';
  text: string;
}

const CATEGORY_ORDER = ['reference', 'professional', 'expressive', 'media'] as const;
const CATEGORY_LABEL = { reference: 'Signature (from references)', professional: 'Professional', expressive: 'Expressive', media: 'Media-aware' };

let logId = 0;

function PresetSelect({ id, value, onChange, allowNone }: { id: string; value: string; onChange: (value: string) => void; allowNone?: boolean }) {
  return (
    <select id={id} className="pg-select" value={value} onChange={(event) => onChange(event.target.value)}>
      {allowNone ? <option value="none">No comparison</option> : null}
      {CATEGORY_ORDER.map((category) => (
        <optgroup key={category} label={CATEGORY_LABEL[category]}>
          {presets
            .filter((preset) => preset.category === category)
            .map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

export function Playground() {
  const searchParams = useSearchParams();
  const siteTheme = useSiteTheme();
  const initialPreset = searchParams.get('preset');
  const [config, setConfig] = useState<PlaygroundConfig>(() => ({
    ...DEFAULT_CONFIG,
    preset: initialPreset && getPreset(initialPreset) ? (initialPreset as PresetId) : DEFAULT_CONFIG.preset,
  }));
  const [themeTouched, setThemeTouched] = useState(false);
  const [stores] = useState<[UploadStore, UploadStore]>(() => [createUploadStore(), createUploadStore()]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<'jsx' | 'json'>('jsx');

  const update = <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) => setConfig((current) => ({ ...current, [key]: value }));
  const theme = themeTouched ? config.theme : siteTheme;

  useEffect(() => () => stores.forEach((store) => store.dispose()), [stores]);

  // Keep ?preset= in sync so configurations are shareable (native History API: no server round trip).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('preset') !== config.preset) {
      url.searchParams.set('preset', config.preset);
      window.history.replaceState(null, '', url);
    }
  }, [config.preset]);

  const upload = useMemo(
    () => createDemoTransport(config.transport, { failureRate: config.failureRate, throttleKbps: config.throttleKbps }),
    [config.transport, config.failureRate, config.throttleKbps],
  );

  const push = (type: LogEntry['type'], text: string) =>
    setLog((entries) => [{ id: (logId += 1), time: new Date().toLocaleTimeString([], { hour12: false }), type, text }, ...entries].slice(0, 60));

  const shared: Omit<FileUploadProps, 'preset' | 'store'> = {
    upload,
    accept: acceptOf(config),
    multiple: config.multiple,
    maxFiles: config.multiple && config.maxFiles > 0 ? config.maxFiles : undefined,
    maxSize: config.maxSizeMb * 1024 * 1024,
    concurrency: config.concurrency,
    retry: { attempts: config.retries },
    autoUpload: config.autoUpload === 'preset' ? undefined : config.autoUpload === 'on',
    progressVariant: config.progressVariant === 'preset' ? undefined : config.progressVariant,
    appearance: {
      theme,
      accent: config.accent,
      accentSecondary: config.accentSecondary,
      radius: config.radius,
      density: config.density,
    },
    motion: { speed: config.speed, intensity: config.intensity, particles: config.particles, reducedMotion: config.reducedMotion },
  };

  const callbacks = (label: string): Partial<FileUploadProps> => ({
    onFilesAdded: (items) => push('added', `${label}${items.length} added: ${items.map((item) => item.name).join(', ')}`),
    onFilesRejected: (rejections) => push('rejected', `${label}${rejections.map((r) => r.errors[0]?.message).join(' ')}`),
    onUploadStart: (item) => push('start', `${label}start ${item.name} (attempt ${item.attempts})`),
    onUploadSuccess: (item, response) => push('success', `${label}success ${item.name} → ${JSON.stringify(response).slice(0, 90)}`),
    onUploadError: (item, error) => push('error', `${label}error ${item.name}: ${error.message}${error.retryable ? ' (retryable)' : ''}`),
    onUploadCancel: (item) => push('cancel', `${label}cancel ${item.name}`),
    onFileRemoved: (item) => push('removed', `${label}removed ${item.name}`),
    onQueueComplete: (items) => push('complete', `${label}queue settled: ${items.filter((i) => i.status === 'success').length}/${items.length} succeeded`),
  });

  const addFiles = (files: File[]) => {
    stores[0].addFiles(files);
    if (config.compare !== 'none') stores[1].addFiles(files);
  };

  const addSample = async (kind: SampleKind | 'preset' | 'oversized') => {
    setBusy(kind);
    try {
      if (kind === 'oversized') {
        addFiles([createOversizedFile(config.maxSizeMb * 1024 * 1024)]);
      } else {
        const kinds = kind === 'preset' ? samplesFor(config.preset) : [kind];
        const files = (await Promise.all(kinds.map((k) => createSampleFile(k)))).filter((file): file is File => file !== null);
        if (files.length === 0) push('rejected', 'This browser cannot generate that sample (MediaRecorder unavailable).');
        addFiles(files);
      }
    } finally {
      setBusy(null);
    }
  };

  const primary = getPreset(config.preset)!;
  const secondary = config.compare !== 'none' ? getPreset(config.compare) : undefined;
  const code = generateCode({ ...config, theme });
  const json = generateConfigJson({ ...config, theme });

  return (
    <div className="pg">
      <aside className="pg-controls" aria-label="Playground settings">
        <Section title="Preset">
          <Field label="Animation preset">{(id) => <PresetSelect id={id} value={config.preset} onChange={(value) => update('preset', value as PresetId)} />}</Field>
          <Field label="Compare with">
            {(id) => <PresetSelect id={id} value={config.compare} allowNone onChange={(value) => update('compare', value as PresetId | 'none')} />}
          </Field>
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
        </Section>

        <Section title="Appearance">
          <Segmented
            label="Theme"
            value={theme}
            onChange={(value) => {
              setThemeTouched(true);
              update('theme', value);
            }}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <ColorField label="Accent" value={config.accent} onChange={(value) => update('accent', value)} />
          <ColorField label="Gradient end" value={config.accentSecondary} onChange={(value) => update('accentSecondary', value)} />
          <Slider label="Corner radius" value={config.radius} min={0} max={32} step={1} onChange={(value) => update('radius', value)} format={(v) => `${v}px`} />
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
        </Section>

        <Section title="Motion">
          <Slider label="Speed" value={config.speed} min={0.5} max={2} step={0.1} onChange={(value) => update('speed', value)} format={(v) => `${v.toFixed(1)}×`} />
          <Slider label="Intensity" value={config.intensity} min={0} max={1.5} step={0.1} onChange={(value) => update('intensity', value)} format={(v) => v.toFixed(1)} />
          <Slider label="Particles" value={config.particles} min={0} max={1} step={0.1} onChange={(value) => update('particles', value)} format={(v) => (v === 0 ? 'Off' : v.toFixed(1))} />
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
        </Section>

        <Section title="Files & validation">
          <Toggle label="Multiple files" checked={config.multiple} onChange={(value) => update('multiple', value)} hint={config.multiple ? undefined : 'Single mode: a new file replaces the current one.'} />
          {config.multiple ? (
            <Slider label="Max files" value={config.maxFiles} min={0} max={20} step={1} onChange={(value) => update('maxFiles', value)} format={(v) => (v === 0 ? 'No limit' : String(v))} />
          ) : null}
          <Slider label="Max file size" value={config.maxSizeMb} min={1} max={50} step={1} onChange={(value) => update('maxSizeMb', value)} format={(v) => `${v} MB`} />
          <Field label="Accepted types">
            {(id) => (
              <select id={id} className="pg-select" value={config.accept} onChange={(event) => update('accept', event.target.value as PlaygroundConfig['accept'])}>
                <option value="any">Any file</option>
                <option value="images">Images only</option>
                <option value="documents">Documents</option>
                <option value="media">Images, video & audio</option>
                <option value="custom">Custom…</option>
              </select>
            )}
          </Field>
          {config.accept === 'custom' ? (
            <Field label="Custom accept" hint="Same syntax as the HTML accept attribute.">
              {(id) => <input id={id} className="pg-input" value={config.customAccept} onChange={(event) => update('customAccept', event.target.value)} />}
            </Field>
          ) : null}
        </Section>

        <Section title="Transport & queue">
          <Segmented
            label="Transport"
            value={config.transport}
            onChange={(value) => update('transport', value)}
            options={[
              { value: 'simulated', label: 'Simulated' },
              { value: 'network', label: 'Real network' },
            ]}
          />
          <p className="pg-hint">
            {config.transport === 'simulated'
              ? 'Fake progress generated in your browser – no data is sent. Components show a “Simulated” badge.'
              : 'Real multipart POST to /api/upload on this site with true XHR progress. The server counts the bytes and discards them.'}
          </p>
          {config.transport === 'network' ? (
            <Slider
              label="Server read throttle"
              value={config.throttleKbps}
              min={0}
              max={4000}
              step={100}
              onChange={(value) => update('throttleKbps', value)}
              format={(v) => (v === 0 ? 'Unthrottled' : `${v} KB/s`)}
            />
          ) : null}
          <Slider label="Failure rate" value={config.failureRate} min={0} max={0.8} step={0.1} onChange={(value) => update('failureRate', value)} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Auto retries" value={config.retries} min={0} max={3} step={1} onChange={(value) => update('retries', value)} />
          <Slider label="Concurrency" value={config.concurrency} min={1} max={6} step={1} onChange={(value) => update('concurrency', value)} />
          <Segmented
            label="Start uploads"
            value={config.autoUpload}
            onChange={(value) => update('autoUpload', value)}
            options={[
              { value: 'preset', label: 'Preset default' },
              { value: 'on', label: 'Auto' },
              { value: 'off', label: 'Manual' },
            ]}
          />
        </Section>
        <button type="button" className="button button--ghost button--small pg-reset" onClick={() => setConfig({ ...DEFAULT_CONFIG, preset: config.preset })}>
          Reset settings
        </button>
      </aside>

      <section className="pg-main" aria-label="Preview">
        <div className="pg-samples">
          <span className="pg-samples__label">Try sample files</span>
          <div className="pg-samples__buttons">
            <button type="button" className="pg-chip pg-chip--accent" onClick={() => addSample('preset')} disabled={busy !== null}>
              ✦ Best for {primary.name}
            </button>
            {(Object.keys(SAMPLE_LABELS) as SampleKind[]).map((kind) => (
              <button key={kind} type="button" className="pg-chip" onClick={() => addSample(kind)} disabled={busy !== null}>
                {busy === kind ? 'Generating…' : SAMPLE_LABELS[kind]}
              </button>
            ))}
            <button type="button" className="pg-chip pg-chip--warn" onClick={() => addSample('oversized')} disabled={busy !== null}>
              Too large ({formatBytes((config.maxSizeMb + 1) * 1024 * 1024)})
            </button>
            <button type="button" className="pg-chip" onClick={() => stores.forEach((store) => store.clear())}>
              Clear queue
            </button>
          </div>
          <p className="pg-hint">Sample files are generated in your browser. You can also drag in or browse your own files.</p>
        </div>

        <div className={secondary ? 'pg-previews pg-previews--compare' : 'pg-previews'}>
          {[{ preset: primary, store: stores[0], label: '' }, ...(secondary ? [{ preset: secondary, store: stores[1], label: '[B] ' }] : [])].map(
            ({ preset, store, label }) => (
              <div key={label || 'a'} className="pg-preview" data-theme={theme}>
                <div className="pg-preview__head">
                  <div>
                    <strong>{preset.name}</strong>
                    <span className="pg-preview__desc">{preset.description}</span>
                  </div>
                  <span className={config.transport === 'simulated' ? 'pill pill--warn' : 'pill pill--accent'}>
                    {config.transport === 'simulated' ? 'Simulated' : 'Real network'}
                  </span>
                </div>
                <div className="pg-preview__stage">
                  <FileUpload preset={preset.id as PresetId} store={store} {...shared} {...callbacks(label)} />
                </div>
              </div>
            ),
          )}
        </div>

        <div className="pg-bottom">
          <div className="code pg-code">
            <div className="code__bar">
              <div className="pg-tabs" role="tablist" aria-label="Output format">
                <button type="button" role="tab" aria-selected={codeTab === 'jsx'} onClick={() => setCodeTab('jsx')}>
                  React
                </button>
                <button type="button" role="tab" aria-selected={codeTab === 'json'} onClick={() => setCodeTab('json')}>
                  Config JSON
                </button>
              </div>
              <CopyButton text={codeTab === 'jsx' ? code : json} label={codeTab === 'jsx' ? 'Copy code' : 'Copy JSON'} />
            </div>
            <pre>
              <code>{codeTab === 'jsx' ? highlightTsx(code) : json}</code>
            </pre>
          </div>
          <div className="pg-log card">
            <div className="pg-log__head">
              <strong>Lifecycle events</strong>
              <button type="button" className="copy-button" onClick={() => setLog([])} disabled={log.length === 0}>
                Clear
              </button>
            </div>
            {log.length === 0 ? (
              <p className="pg-hint">Callbacks like onUploadStart, onUploadSuccess and onUploadError appear here as they fire.</p>
            ) : (
              <ol className="pg-log__list">
                {log.map((entry) => (
                  <li key={entry.id} data-type={entry.type}>
                    <time>{entry.time}</time>
                    <span className="pg-log__type">{entry.type}</span>
                    <span className="pg-log__text">{entry.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
