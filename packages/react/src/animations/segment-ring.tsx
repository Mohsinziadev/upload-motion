import { PRESET_INFO } from '../core/preset-catalog';
import type { CSSProperties } from 'react';
import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { AnimatedCheck, Burst } from '../components/Effects';
import { TransportBadge, useSummaryText } from '../components/Status';
import { cx, useBecameTrue } from '../hooks/utils';
import { UploadIcon } from '../icons';
import type { PresetProps, UploadPreset } from '../types';
import { KIND_COLORS, PresetQueue } from './shared';

const SIZE = 184;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function SegmentRingPreset(props: PresetProps) {
  const { items, totals, dropzone, labels } = useUploaderContext();
  const { title, detail } = useSummaryText();
  const ringItems = items.filter((item) => item.status !== 'canceled');
  const done = totals.isComplete && totals.error === 0;
  const celebrate = useBecameTrue(done, 1300);

  // Each file owns an arc proportional to its size (with a floor so tiny files stay visible).
  const totalSize = ringItems.reduce((sum, item) => sum + item.size, 0);
  const floor = totalSize * 0.05;
  const weights = ringItems.map((item) => Math.max(item.size, floor, 1));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const gap = ringItems.length > 1 ? 4 : 0;
  let cursor = 0;
  const segments = ringItems.map((item, index) => {
    const sweep = (weights[index]! / weightSum) * 360;
    const start = cursor;
    cursor += sweep;
    const length = Math.max(0, ((sweep - gap) / 360) * CIRCUMFERENCE);
    const progress = item.status === 'success' ? 1 : item.progress;
    return { item, start, length, progress };
  });

  return (
    <div className={cx('um-ring', props.classNames?.root)} data-done={done || undefined}>
      <div {...dropzone.getRootProps()} className={cx('um-zone', 'um-ring__zone', props.classNames?.zone)}>
        <div className="um-ring__dial">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
            <circle className="um-ring__base" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
            {segments.map(({ item, start, length, progress }) => (
              <g
                key={item.id}
                className="um-ring__segment"
                data-status={item.status}
                style={{ rotate: `${start - 90}deg`, '--k': KIND_COLORS[item.kind] } as CSSProperties}
              >
                <circle
                  className="um-ring__track"
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  strokeWidth={STROKE}
                  strokeDasharray={`${length} ${CIRCUMFERENCE}`}
                />
                <circle
                  className="um-ring__fill"
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  strokeWidth={STROKE}
                  strokeDasharray={`${length * progress} ${CIRCUMFERENCE}`}
                />
              </g>
            ))}
          </svg>
          <div className="um-ring__center">
            {done ? (
              <AnimatedCheck size={52} />
            ) : ringItems.length > 0 ? (
              <>
                <span className="um-ring__percent">{Math.round(totals.progress * 100)}%</span>
                <span className="um-ring__count">
                  {totals.success} of {ringItems.length}
                </span>
              </>
            ) : (
              <UploadIcon size={30} />
            )}
          </div>
          {celebrate ? <Burst seed="ring" count={18} spread={110} /> : null}
        </div>
        {props.zoneContent ?? (
          <div className="um-ring__text">
            <strong>
              {dropzone.dragState === 'reject'
                ? labels.dropReject
                : dropzone.dragState === 'accept'
                  ? labels.dropActive
                  : ringItems.length > 0
                    ? title
                    : (props.title ?? 'Every file gets its own arc')}
            </strong>
            <span className="um-ring__detail">{detail || (ringItems.length > 0 ? 'Drop more files on the dial' : 'Drop files on the dial')}</span>
            <span className="um-ring__browse">
              <BrowseButton variant="soft" />
            </span>
            <UploadHint />
            <TransportBadge />
          </div>
        )}
      </div>
      <PresetQueue props={props} progressVariant="ring" />
    </div>
  );
}

export const segmentRingPreset: UploadPreset = {
  ...PRESET_INFO['segment-ring'],
  Component: SegmentRingPreset,
};
