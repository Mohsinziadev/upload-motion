import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { TransportBadge } from '../components/Status';
import { cx } from '../hooks/utils';
import { CloudIcon } from '../icons';
import { PRESET_INFO } from '../core/preset-catalog';
import type { PresetProps, UploadPreset } from '../types';
import { PresetQueue } from './shared';

function BeamPreset(props: PresetProps) {
  const { dropzone, labels, totals } = useUploaderContext();
  const mode = dropzone.dragState !== 'idle' ? dropzone.dragState : totals.active > 0 ? 'active' : 'idle';
  return (
    <div className={cx('um-beam', props.classNames?.root)} data-mode={mode}>
      <div {...dropzone.getRootProps()} className={cx('um-zone', 'um-beam__zone', props.classNames?.zone)}>
        <span className="um-beam__border" aria-hidden="true" />
        <span className="um-beam__grid um-deco" aria-hidden="true" />
        {props.zoneContent ?? (
          <div className="um-beam__content">
            <span className="um-beam__icon">
              <CloudIcon size={26} />
            </span>
            <strong className="um-beam__title">
              {dropzone.dragState === 'reject'
                ? labels.dropReject
                : dropzone.dragState === 'accept'
                  ? labels.dropActive
                  : (props.title ?? 'Drop files to sync')}
            </strong>
            <span className="um-beam__sub">
              <BrowseButton variant="soft">{labels.browse}</BrowseButton>
            </span>
            <UploadHint />
          </div>
        )}
      </div>
      <PresetQueue props={props} progressVariant="beam" allowPause />
      <TransportBadge className="um-beam__badge" />
    </div>
  );
}

export const beamPreset: UploadPreset = {
  ...PRESET_INFO['beam'],
  Component: BeamPreset,
};
