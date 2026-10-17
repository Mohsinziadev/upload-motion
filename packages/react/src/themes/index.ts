import type { CSSProperties } from 'react';

import type { Appearance, MotionOptions, ResolvedMotion, UploadLabels } from '../types';

const SHADOWS: Record<string, string> = {
  none: 'none',
  soft: '0 1px 2px rgb(15 15 40 / 0.04), 0 8px 24px -8px rgb(15 15 40 / 0.12)',
  elevated: '0 2px 4px rgb(15 15 40 / 0.04), 0 24px 48px -16px rgb(15 15 40 / 0.22)',
};

const length = (value: number | string | undefined) => (typeof value === 'number' ? `${value}px` : value);

/** Converts appearance + motion settings to inline CSS custom properties. Unset values fall back to the stylesheet. */
export function appearanceToStyle(appearance: Appearance = {}, motion: ResolvedMotion): CSSProperties {
  const vars: Record<string, string | number | undefined> = {
    '--um-accent': appearance.accent,
    '--um-accent-2': appearance.accentSecondary,
    '--um-bg': appearance.background,
    '--um-surface': appearance.surface,
    '--um-text': appearance.text,
    '--um-muted': appearance.mutedText,
    '--um-border': appearance.border,
    '--um-success': appearance.success,
    '--um-danger': appearance.danger,
    '--um-radius': length(appearance.radius),
    '--um-font': appearance.fontFamily,
    '--um-shadow': appearance.shadow ? (SHADOWS[appearance.shadow] ?? appearance.shadow) : undefined,
    '--um-zone-h': length(appearance.zoneHeight),
    '--um-time': motion.speed === 1 ? undefined : (1 / motion.speed).toFixed(3),
    '--um-intensity': motion.intensity === 1 ? undefined : motion.intensity,
    '--um-particles': motion.particles === 1 ? undefined : motion.particles,
  };
  const style: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(vars)) if (value !== undefined && value !== '') style[key] = value;
  return style as CSSProperties;
}

export function resolveMotion(motion: MotionOptions = {}, prefersReduced: boolean): ResolvedMotion {
  const mode = motion.reducedMotion ?? 'user';
  return {
    reduced: mode === 'always' || (mode === 'user' && prefersReduced),
    speed: Math.min(4, Math.max(0.25, motion.speed ?? 1)),
    intensity: Math.min(1.5, Math.max(0, motion.intensity ?? 1)),
    particles: Math.min(1, Math.max(0, motion.particles ?? 1)),
  };
}

export const defaultLabels: UploadLabels = {
  dropTitle: 'Drag & drop files here',
  dropHint: 'or browse files on your computer',
  browse: 'Browse files',
  dropActive: 'Release to upload',
  dropReject: 'Some of these files can’t be uploaded',
  zoneLabel: 'Upload files',
  upload: 'Upload',
  uploadMore: 'Add more files',
  pause: 'Pause',
  resume: 'Resume',
  cancel: 'Cancel',
  cancelAll: 'Cancel all uploads',
  retry: 'Retry',
  retryFailed: 'Retry failed uploads',
  remove: 'Remove',
  clearCompleted: 'Clear completed',
  clearAll: 'Clear all',
  expand: 'Show files',
  collapse: 'Hide files',
  moreActions: 'More actions',
  dismiss: 'Dismiss',
  finishing: 'Finishing…',
  simulated: 'Simulated',
  simulatedHint: 'Demo transport: progress is simulated and no data leaves your browser.',
  noHandler: 'Selected – no upload handler configured',
  status: {
    pending: 'Ready to upload',
    queued: 'Waiting…',
    uploading: 'Uploading',
    paused: 'Paused',
    success: 'Uploaded',
    error: 'Failed',
    canceled: 'Canceled',
  },
  timeLeft: (duration) => `${duration} left`,
  retryingIn: (seconds) => `Retrying in ${seconds}s…`,
  summary: (t) => {
    const files = (n: number) => `${n} ${n === 1 ? 'file' : 'files'}`;
    if (t.count === 0) return 'No files yet';
    if (t.uploading + t.queued > 0) return `Uploading ${files(t.uploading + t.queued)}`;
    if (t.paused > 0) return `${files(t.paused)} paused`;
    if (t.error > 0) return `${t.error} ${t.error === 1 ? 'upload' : 'uploads'} failed`;
    if (t.pending > 0) return `${files(t.pending)} ready`;
    if (t.success > 0) return `${files(t.success)} uploaded`;
    return files(t.count);
  },
  acceptHint: ({ types, maxSize, maxFiles }) =>
    [types || 'Any file type', maxSize && `up to ${maxSize}`, maxFiles && `max ${maxFiles} ${maxFiles === 1 ? 'file' : 'files'}`]
      .filter(Boolean)
      .join(' · '),
};

