import type { CSSProperties } from 'react';
import { clamp01 } from '../core/format';
import type { UploadStatus } from '../core/types';
import { cx } from '../hooks/utils';
import type { ProgressVariant } from '../types';

/** Builds a sine-like quadratic wave: `width` px wide, one crest every `period` px. */
export function wavePath(width: number, period: number, amplitude: number, baseline: number): string {
  const half = period / 2;
  let d = `M0 ${baseline} Q ${half / 2} ${baseline - amplitude} ${half} ${baseline}`;
  for (let x = half; x < width; x += half) d += ` T ${x + half} ${baseline}`;
  return d;
}

const WAVE_PATH = /* @__PURE__ */ wavePath(240, 30, 5, 6);

export interface UploadProgressProps {
  /** 0..1 */
  value: number;
  status?: UploadStatus;
  variant?: ProgressVariant;
  /** Accessible name, e.g. the file name. */
  label?: string;
  /** Accessible value text, e.g. "45%, 3 seconds left". */
  valueText?: string;
  /** Ring diameter in px (ring variant). */
  size?: number;
  className?: string;
}

/**
 * Progress indicator with four styles. Animates with transforms/clip-path only,
 * so it stays cheap even with many concurrent uploads.
 */
export function UploadProgress({
  value,
  status = 'uploading',
  variant = 'bar',
  label,
  valueText,
  size = 36,
  className,
}: UploadProgressProps) {
  const progress = clamp01(value);
  const percent = Math.round(progress * 100);
  const a11y = {
    role: 'progressbar' as const,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': percent,
    'aria-valuetext': valueText ?? `${percent}%`,
    'aria-label': label,
  };
  const style = { '--um-p': progress } as CSSProperties;

  if (variant === 'ring') {
    const stroke = 3;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    return (
      <span {...a11y} className={cx('um-progress', 'um-progress--ring', className)} data-status={status} style={style}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle className="um-progress__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
          <circle
            className="um-progress__arc"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <span className="um-progress__label" aria-hidden="true">
          {percent}
        </span>
      </span>
    );
  }

  if (variant === 'wave') {
    return (
      <span {...a11y} className={cx('um-progress', 'um-progress--wave', className)} data-status={status} style={style}>
        <span className="um-progress__wave-clip" aria-hidden="true">
          <svg className="um-progress__wave" viewBox="0 0 240 12" preserveAspectRatio="none">
            <path d={WAVE_PATH} />
          </svg>
        </span>
      </span>
    );
  }

  return (
    <span
      {...a11y}
      className={cx('um-progress', variant === 'beam' ? 'um-progress--beam' : 'um-progress--bar', className)}
      data-status={status}
      style={style}
    >
      <span className="um-progress__fill" aria-hidden="true" />
    </span>
  );
}
