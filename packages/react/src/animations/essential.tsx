import { useUploaderContext } from '../components/context';
import { DropzoneContent, StartUploadButton } from '../components/Dropzone';
import { TransportBadge } from '../components/Status';
import { cx } from '../hooks/utils';
import { PRESET_INFO } from '../core/preset-catalog';
import type { PresetProps, UploadPreset } from '../types';
import { PresetQueue } from './shared';

function EssentialPreset(props: PresetProps) {
  const { dropzone, autoUpload, totals, transport } = useUploaderContext();
  const showStart = !autoUpload && totals.pending + totals.active > 0;
  return (
    <div className={cx('um-essential', props.classNames?.root)}>
      <div {...dropzone.getRootProps()} className={cx('um-zone', 'um-essential__zone', props.classNames?.zone)}>
        {props.zoneContent ?? <DropzoneContent title={props.title} />}
      </div>
      <PresetQueue props={props} progressVariant="bar" allowPause />
      {showStart || transport === 'simulated' ? (
        <div className="um-footer-row">
          <TransportBadge />
          {showStart ? <StartUploadButton /> : null}
        </div>
      ) : null}
    </div>
  );
}

export const essentialPreset: UploadPreset = {
  ...PRESET_INFO['essential'],
  Component: EssentialPreset,
};
