import { PRESET_INFO } from '../core/preset-catalog';
import type { CSSProperties } from 'react';
import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { AnimatedCheck } from '../components/Effects';
import { FilePreview } from '../components/FileVisual';
import { TransportBadge, useSummaryText } from '../components/Status';
import { usePresence } from '../hooks/useListAnimation';
import { cx } from '../hooks/utils';
import { UploadIcon } from '../icons';
import type { PresetProps, UploadPreset } from '../types';
import { KIND_COLORS, PresetQueue } from './shared';

const LANES = [74, 104, 134];
const SPEEDS = [9, 13, 18];
const MAX_PLANETS = 12;

/** Stable lane/phase per file so planets never jump lanes when siblings land. */
function laneOf(id: string, order: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return { lane: order % LANES.length, phase: (Math.abs(hash) % 100) / 100 };
}

function OrbitPreset(props: PresetProps) {
  const { items, totals, dropzone, labels, motion } = useUploaderContext();
  const { title, detail } = useSummaryText();
  const orbiting = items.filter((item) => item.status !== 'success').slice(0, MAX_PLANETS);
  const planets = usePresence(orbiting, motion.reduced ? 0 : 900);
  const done = totals.isComplete && totals.error === 0;
  const order = new Map(items.map((item, index) => [item.id, index]));

  return (
    <div className={cx('um-orbit', props.classNames?.root)} data-active={totals.active > 0 || undefined}>
      <div {...dropzone.getRootProps()} className={cx('um-zone', 'um-orbit__zone', props.classNames?.zone)}>
        <div className="um-orbit__system" aria-hidden="true">
          {LANES.map((radius) => (
            <span key={radius} className="um-orbit__lane" style={{ '--r': `${radius}px` } as CSSProperties} />
          ))}
          {planets.map(({ item, exiting }) => {
            const { lane, phase } = laneOf(item.id, order.get(item.id) ?? 0);
            const base = LANES[lane]!;
            const pull = item.status === 'uploading' ? item.progress : 0;
            const radius = exiting ? 0 : base * (1 - 0.55 * pull);
            return (
              <span
                key={item.id}
                className="um-orbit__track"
                data-status={item.status}
                data-exiting={exiting || undefined}
                style={
                  {
                    '--r': `${radius}px`,
                    '--speed': `${SPEEDS[lane]}s`,
                    '--delay': `${-phase * SPEEDS[lane]!}s`,
                    '--k': KIND_COLORS[item.kind],
                  } as CSSProperties
                }
              >
                <span className="um-orbit__planet">
                  <span className="um-orbit__body">
                    <FilePreview item={item} size={30} />
                  </span>
                </span>
              </span>
            );
          })}
          <span className="um-orbit__core" key={totals.success} data-pulse={totals.success > 0 || undefined}>
            {done ? (
              <AnimatedCheck size={40} />
            ) : items.length > 0 ? (
              <span className="um-orbit__percent">{Math.round(totals.progress * 100)}%</span>
            ) : (
              <UploadIcon size={28} />
            )}
          </span>
        </div>
        {props.zoneContent ?? (
          <div className="um-orbit__text">
            <strong>
              {dropzone.dragState === 'reject'
                ? labels.dropReject
                : dropzone.dragState === 'accept'
                  ? labels.dropActive
                  : items.length > 0
                    ? title
                    : (props.title ?? 'Put your files in orbit')}
            </strong>
            <span>{items.length > 0 && detail ? detail : <>Drop files or <BrowseButton variant="link">browse</BrowseButton></>}</span>
            <UploadHint />
            <TransportBadge />
          </div>
        )}
      </div>
      <PresetQueue props={props} progressVariant="bar" />
    </div>
  );
}

export const orbitPreset: UploadPreset = {
  ...PRESET_INFO['orbit'],
  Component: OrbitPreset,
};
