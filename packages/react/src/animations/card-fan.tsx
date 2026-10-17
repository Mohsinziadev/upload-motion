import { useUploaderContext } from '../components/context';
import { BrowseButton, StartUploadButton, UploadHint } from '../components/Dropzone';
import { TransportBadge } from '../components/Status';
import { cx } from '../hooks/utils';
import { ImageIcon, MusicIcon, VideoIcon } from '../icons';
import { PRESET_INFO } from '../core/preset-catalog';
import type { PresetProps, UploadPreset } from '../types';
import { PresetQueue } from './shared';

function CurvedArrow({ side }: { side: 'left' | 'right' }) {
  return (
    <svg className="um-fan__arrow" data-side={side} width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <path className="um-fan__arrow-line" d="M8 4 C 4 18, 12 30, 32 31" pathLength={1} />
      <path className="um-fan__arrow-head" d="M24 24 L 33 31 L 24 38" pathLength={1} />
    </svg>
  );
}

function CardFanPreset(props: PresetProps) {
  const { dropzone, labels, totals, autoUpload, transport } = useUploaderContext();
  const { dragState, isWindowDrag, lastDrop } = dropzone;
  const mode = dragState === 'reject' ? 'reject' : dragState === 'accept' ? 'over' : isWindowDrag ? 'anticipate' : 'idle';
  const showStart = !autoUpload || totals.pending > 0;

  const headline =
    mode === 'reject' ? (
      labels.dropReject
    ) : mode === 'over' ? (
      labels.dropActive
    ) : props.title ? (
      props.title
    ) : (
      <>
        Drag &amp; drop <em>images,</em> <em>videos,</em> or any <em>file</em>
      </>
    );

  return (
    <div className={cx('um-panel', 'um-fan', props.classNames?.root)} data-mode={mode}>
      <div {...dropzone.getRootProps()} className={cx('um-zone', 'um-fan__zone', props.classNames?.zone)}>
        <svg className="um-fan__border" aria-hidden="true">
          <rect x="0" y="0" width="100%" height="100%" rx="16" ry="16" />
        </svg>
        {props.zoneContent ?? (
          <div className="um-fan__content">
            <div className="um-fan__stage" aria-hidden="true">
              <CurvedArrow side="left" />
              {/* Re-keyed on drop so the cards replay their "deal" animation. */}
              <div className="um-fan__cards" key={lastDrop?.at ?? 0} data-dealt={lastDrop ? 'true' : undefined}>
                <span className="um-fan__card" data-pos="left">
                  <VideoIcon size={20} />
                </span>
                <span className="um-fan__card" data-pos="center">
                  <ImageIcon size={24} />
                </span>
                <span className="um-fan__card" data-pos="right">
                  <MusicIcon size={20} />
                </span>
              </div>
              <CurvedArrow side="right" />
            </div>
            <p className="um-fan__title" aria-live="polite">
              {headline}
            </p>
            <p className="um-fan__sub">
              or{' '}
              <BrowseButton variant="link" className="um-fan__browse">
                browse files
              </BrowseButton>{' '}
              on your computer
            </p>
            <UploadHint className="um-fan__hint" />
          </div>
        )}
      </div>
      <PresetQueue props={props} progressVariant="bar" />
      {showStart || transport === 'simulated' ? (
        <div className="um-fan__footer">
          <TransportBadge />
          {showStart ? <StartUploadButton /> : null}
        </div>
      ) : null}
    </div>
  );
}

export const cardFanPreset: UploadPreset = {
  ...PRESET_INFO['card-fan'],
  Component: CardFanPreset,
};
