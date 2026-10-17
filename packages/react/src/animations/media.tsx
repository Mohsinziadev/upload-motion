import { PRESET_INFO } from '../core/preset-catalog';
import type { CSSProperties, ReactNode } from 'react';
import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { AnimatedList } from '../components/FileList';
import { TransportBadge, UploadRejections } from '../components/Status';
import type { UploadItem } from '../core/types';
import { cx } from '../hooks/utils';
import { ImageIcon, MusicIcon, PlusIcon, UploadIcon, VideoIcon } from '../icons';
import type { FileVisualizer, PresetProps, UploadPreset } from '../types';
import { useRenderFile } from './shared';
import {
  AudioPreviewButton,
  BloomVisual,
  DEFAULT_KIND_VISUALIZERS,
  PageVisual,
  PixelVisual,
  VISUALIZERS,
  VisualRow,
  VisualTile,
  ZoneTile,
} from './visualizers';

/** Grid of tiles where the first tile is the drop zone. */
function TileGrid({
  props,
  variant,
  zoneTitle,
  zoneIcon,
  render,
}: {
  props: PresetProps;
  variant: string;
  zoneTitle: string;
  zoneIcon: ReactNode;
  render: (item: UploadItem) => ReactNode;
}) {
  const { items } = useUploaderContext();
  const renderFile = useRenderFile(props);
  return (
    <div className={cx('um-media', `um-media--${variant}`, props.classNames?.root)}>
      <div className="um-media__grid">
        <ZoneTile title={props.title ? String(props.title) : zoneTitle} icon={zoneIcon} className={props.classNames?.zone} />
        <AnimatedList
          as="div"
          items={items}
          className={cx('um-media__items', props.classNames?.list)}
          itemClassName={props.classNames?.item}
          aria-label="Files"
          renderItem={(item) => renderFile(item, () => render(item))}
        />
      </div>
      <div className="um-footer-row">
        <UploadHint />
        <span className="um-media__footer">
          <TransportBadge />
          <BrowseButton variant="soft" />
        </span>
      </div>
      {props.showRejections !== false ? <UploadRejections /> : null}
    </div>
  );
}

/** Banner zone + list of rows. */
function RowList({
  props,
  variant,
  zoneTitle,
  zoneIcon,
  visualFor,
  leading,
}: {
  props: PresetProps;
  variant: string;
  zoneTitle: string;
  zoneIcon: ReactNode;
  visualFor: (item: UploadItem) => FileVisualizer;
  leading?: (item: UploadItem) => ReactNode;
}) {
  const { items, dropzone, labels } = useUploaderContext();
  const renderFile = useRenderFile(props);
  return (
    <div className={cx('um-media', `um-media--${variant}`, props.classNames?.root)}>
      <div {...dropzone.getRootProps()} className={cx('um-zone', 'um-media__banner', props.classNames?.zone)}>
        <span className="um-media__deco um-deco" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => (
            <span key={index} style={{ '--i': index } as CSSProperties} />
          ))}
        </span>
        {props.zoneContent ?? (
          <>
            <span className="um-media__banner-icon">{zoneIcon}</span>
            <span className="um-media__banner-text">
              <strong>
                {dropzone.dragState === 'reject' ? labels.dropReject : dropzone.dragState === 'accept' ? labels.dropActive : (props.title ?? zoneTitle)}
              </strong>
              <span>
                <BrowseButton variant="link" /> · <UploadHint />
              </span>
            </span>
            <TransportBadge />
          </>
        )}
      </div>
      {props.showRejections !== false ? <UploadRejections /> : null}
      <AnimatedList
        items={items}
        className={cx('um-media__rows', props.classNames?.list)}
        itemClassName={props.classNames?.item}
        aria-label="Files"
        renderItem={(item) =>
          renderFile(item, () => {
            const kind = visualFor(item);
            const Visual = VISUALIZERS[kind];
            return <VisualRow item={item} visual={<Visual item={item} />} visualKind={kind} leading={leading?.(item)} />;
          })
        }
      />
    </div>
  );
}

export const bloomPreset: UploadPreset = {
  ...PRESET_INFO['bloom'],
  Component: (props) => (
    <TileGrid props={props} variant="bloom" zoneTitle="Add photos" zoneIcon={<ImageIcon size={26} />} render={(item) => <VisualTile item={item} visual={<BloomVisual item={item} />} />} />
  ),
};

export const pixelPreset: UploadPreset = {
  ...PRESET_INFO['pixel'],
  Component: (props) => (
    <TileGrid props={props} variant="pixel" zoneTitle="Drop to assemble" zoneIcon={<PlusIcon size={26} />} render={(item) => <VisualTile item={item} visual={<PixelVisual item={item} />} />} />
  ),
};

export const pageRevealPreset: UploadPreset = {
  ...PRESET_INFO['page-reveal'],
  Component: (props) => (
    <TileGrid
      props={props}
      variant="page"
      zoneTitle="Add documents"
      zoneIcon={<UploadIcon size={24} />}
      render={(item) => <VisualTile item={item} visual={<PageVisual item={item} />} />}
    />
  ),
};

export const filmstripPreset: UploadPreset = {
  ...PRESET_INFO['filmstrip'],
  Component: (props) => (
    <RowList props={props} variant="film" zoneTitle="Drop video clips" zoneIcon={<VideoIcon size={24} />} visualFor={() => 'filmstrip'} />
  ),
};

export const waveformPreset: UploadPreset = {
  ...PRESET_INFO['waveform'],
  Component: (props) => (
    <RowList
      props={props}
      variant="wave"
      zoneTitle="Drop audio files"
      zoneIcon={<MusicIcon size={24} />}
      visualFor={() => 'waveform'}
      leading={(item) => <AudioPreviewButton item={item} />}
    />
  ),
};

function AdaptivePreset(props: PresetProps) {
  const mapping = { ...DEFAULT_KIND_VISUALIZERS, ...props.fileAnimations };
  return (
    <RowList
      props={props}
      variant="adaptive"
      zoneTitle="Drop anything – each type gets its own motion"
      zoneIcon={<UploadIcon size={24} />}
      visualFor={(item) => mapping[item.kind]}
      leading={(item) => (item.kind === 'audio' ? <AudioPreviewButton item={item} /> : null)}
    />
  );
}

export const adaptivePreset: UploadPreset = {
  ...PRESET_INFO['adaptive'],
  Component: AdaptivePreset,
};

