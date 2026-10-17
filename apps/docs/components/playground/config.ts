import type { Density, PresetId, ProgressVariant } from 'upload-motion';

export type AcceptPreset = 'any' | 'images' | 'documents' | 'media' | 'custom';

export interface PlaygroundConfig {
  preset: PresetId;
  compare: PresetId | 'none';
  theme: 'light' | 'dark';
  accent: string;
  accentSecondary: string;
  radius: number;
  density: Density;
  speed: number;
  intensity: number;
  particles: number;
  reducedMotion: 'user' | 'always' | 'never';
  multiple: boolean;
  maxFiles: number;
  maxSizeMb: number;
  accept: AcceptPreset;
  customAccept: string;
  transport: 'simulated' | 'network';
  failureRate: number;
  throttleKbps: number;
  concurrency: number;
  retries: number;
  autoUpload: 'preset' | 'on' | 'off';
  progressVariant: 'preset' | ProgressVariant;
}

export const DEFAULT_CONFIG: PlaygroundConfig = {
  preset: 'wave-bar',
  compare: 'none',
  theme: 'light',
  accent: '#5b5ef4',
  accentSecondary: '#a855f7',
  radius: 18,
  density: 'comfortable',
  speed: 1,
  intensity: 1,
  particles: 1,
  reducedMotion: 'user',
  multiple: true,
  maxFiles: 10,
  maxSizeMb: 25,
  accept: 'any',
  customAccept: 'image/*,.pdf',
  transport: 'simulated',
  failureRate: 0,
  throttleKbps: 400,
  concurrency: 3,
  retries: 0,
  autoUpload: 'preset',
  progressVariant: 'preset',
};

export const ACCEPT_VALUES: Record<Exclude<AcceptPreset, 'custom'>, string | undefined> = {
  any: undefined,
  images: 'image/*',
  documents: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json',
  media: 'image/*,video/*,audio/*',
};

export function acceptOf(config: PlaygroundConfig): string | undefined {
  return config.accept === 'custom' ? config.customAccept || undefined : ACCEPT_VALUES[config.accept];
}

/** Produces copy-pasteable JSX containing only non-default settings. */
export function generateCode(config: PlaygroundConfig): string {
  const props: string[] = [`preset="${config.preset}"`];
  const transport =
    config.transport === 'network'
      ? `createXhrUploader({ url: '/api/upload' })`
      : `createSimulatedUploader()`;
  props.push(`upload={upload}`);
  const accept = acceptOf(config);
  if (accept) props.push(`accept="${accept}"`);
  if (!config.multiple) props.push('multiple={false}');
  else if (config.maxFiles > 0) props.push(`maxFiles={${config.maxFiles}}`);
  props.push(`maxSize={${config.maxSizeMb} * 1024 * 1024}`);
  if (config.concurrency !== 3) props.push(`concurrency={${config.concurrency}}`);
  if (config.retries > 0) props.push(`retry={{ attempts: ${config.retries} }}`);
  if (config.autoUpload !== 'preset') props.push(`autoUpload={${config.autoUpload === 'on'}}`);
  if (config.progressVariant !== 'preset') props.push(`progressVariant="${config.progressVariant}"`);

  const appearance: string[] = [`theme: '${config.theme}'`];
  if (config.accent !== DEFAULT_CONFIG.accent) appearance.push(`accent: '${config.accent}'`);
  if (config.accentSecondary !== DEFAULT_CONFIG.accentSecondary) appearance.push(`accentSecondary: '${config.accentSecondary}'`);
  if (config.radius !== DEFAULT_CONFIG.radius) appearance.push(`radius: ${config.radius}`);
  if (config.density !== 'comfortable') appearance.push(`density: '${config.density}'`);
  props.push(`appearance={{ ${appearance.join(', ')} }}`);

  const motion: string[] = [];
  if (config.speed !== 1) motion.push(`speed: ${config.speed}`);
  if (config.intensity !== 1) motion.push(`intensity: ${config.intensity}`);
  if (config.particles !== 1) motion.push(`particles: ${config.particles}`);
  if (config.reducedMotion !== 'user') motion.push(`reducedMotion: '${config.reducedMotion}'`);
  if (motion.length > 0) props.push(`motion={{ ${motion.join(', ')} }}`);

  props.push(`onUploadSuccess={(file, response) => console.log('uploaded', file.name, response)}`);

  const importName = config.transport === 'network' ? 'createXhrUploader' : 'createSimulatedUploader';
  return `import { FileUpload, ${importName} } from 'upload-motion';
import 'upload-motion/styles.css';

const upload = ${transport};

export function Uploader() {
  return (
    <FileUpload
      ${props.join('\n      ')}
    />
  );
}`;
}

export function generateConfigJson(config: PlaygroundConfig): string {
  return JSON.stringify(
    {
      preset: config.preset,
      accept: acceptOf(config) ?? null,
      multiple: config.multiple,
      maxFiles: config.multiple ? config.maxFiles || null : 1,
      maxSize: config.maxSizeMb * 1024 * 1024,
      concurrency: config.concurrency,
      retry: { attempts: config.retries },
      appearance: {
        theme: config.theme,
        accent: config.accent,
        accentSecondary: config.accentSecondary,
        radius: config.radius,
        density: config.density,
      },
      motion: {
        speed: config.speed,
        intensity: config.intensity,
        particles: config.particles,
        reducedMotion: config.reducedMotion,
      },
    },
    null,
    2,
  );
}
