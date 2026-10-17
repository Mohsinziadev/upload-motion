const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * `25 * 1024 * 1024` → `"25 MB"`. Uses 1024-based units so limits written the
 * usual way (`n * 1024 * 1024`) read back exactly as configured.
 */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const exponent = Math.min(Math.floor(Math.log2(bytes) / 10), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  const digits = exponent === 0 || value >= 100 || Number.isInteger(value) ? 0 : fractionDigits;
  return `${value.toFixed(digits)} ${UNITS[exponent]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

/** `5` → `"5 seconds"`, `90` → `"2 minutes"`, `3900` → `"1 hour"` */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const s = Math.max(1, Math.round(seconds));
  if (s < 60) return `${s} ${s === 1 ? 'second' : 'seconds'}`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  const h = Math.round(m / 60);
  return `${h} ${h === 1 ? 'hour' : 'hours'}`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(clamp01(fraction) * 100)}%`;
}

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : Number.isFinite(value) ? value : 0;
}
