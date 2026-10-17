import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { AnimatedCheck } from '../components/Effects';
import { wavePath } from '../components/Progress';
import { TransportBadge, useSummaryText } from '../components/Status';
import { cx, seededRandom } from '../hooks/utils';
import { UploadIcon } from '../icons';
import { PRESET_INFO } from '../core/preset-catalog';
import type { PresetProps, UploadPreset } from '../types';
import { PresetQueue } from './shared';

const FRONT = /* @__PURE__ */ wavePath(800, 200, 7, 10) + ' V 20 H 0 Z';
const BACK = /* @__PURE__ */ wavePath(800, 160, 9, 10) + ' V 20 H 0 Z';

function LiquidPreset(props: PresetProps) {
  const { dropzone, totals, items, labels } = useUploaderContext();
  const { title, detail } = useSummaryText();
  const hasFiles = items.length > 0;
  const done = totals.isComplete && totals.error === 0;
  const dragging = dropzone.dragState === 'accept';
  const level = done ? 1 : hasFiles ? Math.max(0.08, totals.progress) : dragging ? 0.24 : 0.1;
  const bubbles = useMemo(() => {
    const random = seededRandom('liquid');
    return Array.from({ length: 9 }, () => ({ left: 6 + random() * 88, size: 4 + random() * 8, delay: random() * 3, duration: 2.2 + random() * 2 }));
  }, []);

  const content: ReactNode = hasFiles ? (
    <>
      <span className="um-liquid__percent">{done ? <AnimatedCheck size={40} /> : `${Math.round(totals.progress * 100)}%`}</span>
      <strong className="um-liquid__title">{title}</strong>
      <span className="um-liquid__detail">{detail || (done ? 'Drop more to refill' : labels.status[totals.error > 0 ? 'error' : 'pending'])}</span>
    </>
  ) : (
    <>
      <span className="um-liquid__icon">
        <UploadIcon size={26} />
      </span>
      <strong className="um-liquid__title">
        {dropzone.dragState === 'reject' ? labels.dropReject : dragging ? labels.dropActive : (props.title ?? 'Pour your files in')}
      </strong>
      <span className="um-liquid__detail">Drop files, paste, or press Enter to browse</span>
    </>
  );

  return (
    <div
      className={cx('um-liquid', props.classNames?.root)}
      data-active={totals.active > 0 || undefined}
      data-done={done || undefined}
      data-error={(totals.error > 0 && totals.active === 0) || undefined}
    >
      <div
        {...dropzone.getRootProps({ focusable: true })}
        className={cx('um-zone', 'um-liquid__vessel', props.classNames?.zone)}
        style={{ '--um-level': level } as CSSProperties}
      >
        <div className="um-liquid__fluid" aria-hidden="true">
          <svg className="um-liquid__wave um-liquid__wave--back" viewBox="0 0 800 20" preserveAspectRatio="none">
            <path d={BACK} />
          </svg>
          <svg className="um-liquid__wave um-liquid__wave--front" viewBox="0 0 800 20" preserveAspectRatio="none">
            <path d={FRONT} />
          </svg>
          <span className="um-liquid__body">
            {bubbles.map((bubble, index) => (
              <span
                key={index}
                className="um-liquid__bubble um-deco"
                style={
                  {
                    left: `${bubble.left}%`,
                    width: bubble.size,
                    height: bubble.size,
                    animationDelay: `${bubble.delay}s`,
                    animationDuration: `calc(var(--um-time) * ${bubble.duration}s)`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        </div>
        {props.zoneContent ?? (
          <>
            <div className="um-liquid__layer">{content}</div>
            <div className="um-liquid__layer um-liquid__layer--inverse" aria-hidden="true">
              {content}
            </div>
          </>
        )}
      </div>
      <div className="um-footer-row um-liquid__footer">
        <UploadHint />
        <span className="um-liquid__footer-actions">
          <TransportBadge />
          <BrowseButton variant="soft" />
        </span>
      </div>
      <PresetQueue props={props} progressVariant="bar" />
    </div>
  );
}

export const liquidPreset: UploadPreset = {
  ...PRESET_INFO['liquid'],
  Component: LiquidPreset,
};
