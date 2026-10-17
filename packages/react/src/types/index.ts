import type { ComponentType, ReactNode } from 'react';
import type { PresetId, PresetInfo } from '../core/preset-catalog';
import type { FileKind, UploadItem, UploadStatus, UploadTotals } from '../core/types';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type ProgressVariant = 'bar' | 'ring' | 'wave' | 'beam';
export type QueueLayout = 'list' | 'grid';

/** Visual tokens. Every value maps to a `--um-*` CSS custom property you can also set in CSS. */
export interface Appearance {
  theme?: ThemeMode;
  /** Primary brand colour. Any CSS colour. */
  accent?: string;
  /** Second gradient stop. Defaults to a shifted accent. */
  accentSecondary?: string;
  background?: string;
  surface?: string;
  text?: string;
  mutedText?: string;
  border?: string;
  success?: string;
  danger?: string;
  /** Corner radius, e.g. `16` or `"1rem"`. */
  radius?: number | string;
  density?: Density;
  shadow?: 'none' | 'soft' | 'elevated' | (string & {});
  fontFamily?: string;
  /** Minimum height of the drop zone, e.g. `240` or `"18rem"`. */
  zoneHeight?: number | string;
}

export interface MotionOptions {
  /** Playback speed multiplier. `2` = twice as fast. Default 1. */
  speed?: number;
  /** 0..1.5 amplitude of decorative motion (tilt, bounce, wobble). Default 1. */
  intensity?: number;
  /** 0..1 particle density for presets that use particles. 0 disables them. Default 1. */
  particles?: number;
  /** `user` follows `prefers-reduced-motion`; `always` forces reduced motion; `never` ignores the OS setting. */
  reducedMotion?: 'user' | 'always' | 'never';
}

export interface ResolvedMotion {
  reduced: boolean;
  speed: number;
  intensity: number;
  particles: number;
}

export interface UploadLabels {
  dropTitle: string;
  dropHint: string;
  browse: string;
  dropActive: string;
  dropReject: string;
  zoneLabel: string;
  upload: string;
  uploadMore: string;
  pause: string;
  resume: string;
  cancel: string;
  cancelAll: string;
  retry: string;
  retryFailed: string;
  remove: string;
  clearCompleted: string;
  clearAll: string;
  expand: string;
  collapse: string;
  moreActions: string;
  dismiss: string;
  finishing: string;
  simulated: string;
  simulatedHint: string;
  noHandler: string;
  status: Record<UploadStatus, string>;
  timeLeft: (duration: string) => string;
  retryingIn: (seconds: number) => string;
  summary: (totals: UploadTotals) => string;
  acceptHint: (parts: { types: string; maxSize: string; maxFiles: number | null }) => string;
}

/** Per-kind visualizers used by list presets (e.g. `adaptive`). */
export type FileVisualizer = 'bloom' | 'page' | 'filmstrip' | 'waveform' | 'pixel' | 'card';

export interface FileRenderHelpers {
  remove: () => void;
  cancel: () => void;
  retry: () => void;
  pause: () => void;
  resume: () => void;
  start: () => void;
  labels: UploadLabels;
}

export interface UploadClassNames {
  root?: string;
  zone?: string;
  list?: string;
  item?: string;
  progress?: string;
  actions?: string;
}

/** Props every preset understands. Presets ignore what doesn't fit their concept (documented per preset). */
export interface PresetProps {
  /** Replace the per-file card. */
  renderFile?: (item: UploadItem, helpers: FileRenderHelpers) => ReactNode;
  /** Replace the default drop-zone content (icon + headline). */
  zoneContent?: ReactNode;
  classNames?: UploadClassNames;
  progressVariant?: ProgressVariant;
  layout?: QueueLayout;
  fileAnimations?: Partial<Record<FileKind, FileVisualizer>>;
  /** Show the list of rejected files. Default true. */
  showRejections?: boolean;
  /** Headline/title override for presets with a header. */
  title?: ReactNode;
  description?: ReactNode;
}

export type { PresetId, PresetCategory, PresetInfo } from '../core/preset-catalog';

export interface UploadPreset extends Omit<PresetInfo, 'id'> {
  id: PresetId | (string & {});
  Component: ComponentType<PresetProps>;
}
