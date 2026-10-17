import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { TransportBadge } from '../components/Status';
import { cx } from '../hooks/utils';
import { UploadIcon } from '../icons';
import { PRESET_INFO } from '../core/preset-catalog';
import type { PresetProps, UploadPreset } from '../types';
import { PresetQueue } from './shared';

function MagneticPreset(props: PresetProps) {
  const { dropzone, labels } = useUploaderContext();
  const { dragState, isWindowDrag, lastDrop } = dropzone;
  return (
    <div className={cx('um-magnetic', props.classNames?.root)} data-window-drag={isWindowDrag || undefined}>
      <div
        {...dropzone.getRootProps({ trackPointer: true })}
        className={cx('um-zone', 'um-magnetic__zone', props.classNames?.zone)}
      >
        <span className="um-magnetic__field um-deco" aria-hidden="true" />
        <span className="um-magnetic__glow" aria-hidden="true" />
        {props.zoneContent ?? (
          <div className="um-magnetic__content">
            <span className="um-magnetic__core" key={lastDrop?.at ?? 0} data-snap={lastDrop ? 'true' : undefined}>
              <span className="um-magnetic__ring" aria-hidden="true" />
              <span className="um-magnetic__ring um-magnetic__ring--2" aria-hidden="true" />
              <UploadIcon size={24} />
            </span>
            <strong className="um-magnetic__title">
              {dragState === 'reject' ? labels.dropReject : dragState === 'accept' ? labels.dropActive : (props.title ?? 'Pull files into the field')}
            </strong>
            <span className="um-magnetic__sub">
              Drop anywhere here, paste, or <BrowseButton variant="link">browse</BrowseButton>
            </span>
            <UploadHint />
          </div>
        )}
      </div>
      <PresetQueue props={props} progressVariant="bar" allowPause className="um-magnetic__queue" />
      <TransportBadge className="um-magnetic__badge" />
    </div>
  );
}

export const magneticPreset: UploadPreset = {
  ...PRESET_INFO['magnetic'],
  Component: MagneticPreset,
};
