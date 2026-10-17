import { useId, useState, type CSSProperties } from 'react';
import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { AnimatedCheck } from '../components/Effects';
import { ItemActions, ItemStatus, progressValueText } from '../components/FileItem';
import { AnimatedList } from '../components/FileList';
import { FilePreview } from '../components/FileVisual';
import { UploadProgress } from '../components/Progress';
import { TransportBadge } from '../components/Status';
import { formatBytes } from '../core/format';
import { usePresence } from '../hooks/useListAnimation';
import { cx } from '../hooks/utils';
import { PlusIcon } from '../icons';
import { PRESET_INFO } from '../core/preset-catalog';
import type { PresetProps, UploadPreset } from '../types';
import { PresetQueue, useRenderFile } from './shared';

const VISIBLE = 5;

function StackPreset(props: PresetProps) {
  const { items, dropzone, labels, motion, store } = useUploaderContext();
  const [showList, setShowList] = useState(false);
  const listId = useId();
  const renderFile = useRenderFile(props);
  const deck = items.filter((item) => item.status !== 'success');
  const done = items.filter((item) => item.status === 'success');
  const entries = usePresence(deck, motion.reduced ? 0 : 700);
  let depth = 0;

  return (
    <div className={cx('um-stack', props.classNames?.root)}>
      <div className="um-stack__layout">
        <div
          {...dropzone.getRootProps({ noClick: deck.length > 0 })}
          className={cx('um-zone', 'um-stack__deck', props.classNames?.zone)}
          data-count={Math.min(deck.length, VISIBLE)}
        >
          {deck.length === 0 && !entries.some((entry) => entry.exiting) ? (
            <div className="um-stack__empty">
              <span className="um-stack__ghost" style={{ '--d': 2 } as CSSProperties} aria-hidden="true" />
              <span className="um-stack__ghost" style={{ '--d': 1 } as CSSProperties} aria-hidden="true" />
              <span className="um-stack__placeholder">
                {props.zoneContent ?? (
                  <>
                    <PlusIcon size={26} />
                    <strong>
                      {dropzone.dragState === 'reject' ? labels.dropReject : dropzone.dragState === 'accept' ? labels.dropActive : (props.title ?? 'Stack files here')}
                    </strong>
                    <BrowseButton variant="link" />
                    <UploadHint />
                  </>
                )}
              </span>
            </div>
          ) : null}
          {entries.map(({ item, exiting }) => {
            const d = exiting ? -1 : depth++;
            if (d >= VISIBLE) return null;
            const landed = exiting && store.getItem(item.id)?.status === 'success';
            return (
              <div
                key={item.id}
                className="um-stack__card"
                data-status={item.status}
                data-exit={exiting ? (landed ? 'land' : 'discard') : undefined}
                data-front={d === 0 || undefined}
                style={{ '--d': Math.max(d, 0) } as CSSProperties}
                aria-hidden={d !== 0 || exiting || undefined}
                inert={d !== 0 || exiting || undefined}
              >
                {renderFile(item, () => (
                  <>
                    <FilePreview item={item} size={58} />
                    <span className="um-stack__meta">
                      <span className="um-stack__name" title={item.name}>
                        {item.name}
                      </span>
                      <span className="um-stack__size">{formatBytes(item.size)}</span>
                    </span>
                    <UploadProgress
                      value={item.progress}
                      status={item.status}
                      label={item.name}
                      valueText={progressValueText(item, labels)}
                    />
                    <span className="um-stack__foot">
                      <ItemStatus item={item} />
                      <ItemActions item={item} allowPause />
                    </span>
                  </>
                ))}
              </div>
            );
          })}
          {deck.length > VISIBLE ? <span className="um-stack__more">+{deck.length - VISIBLE}</span> : null}
          {deck.length > 0 ? (
            <BrowseButton variant="icon" className="um-stack__add" aria-label={labels.uploadMore}>
              <PlusIcon size={18} />
            </BrowseButton>
          ) : null}
        </div>

        <div className="um-stack__tray">
          <span className="um-stack__tray-title">
            {labels.status.success} <strong>{done.length}</strong>
          </span>
          {done.length === 0 ? <span className="um-stack__tray-empty">Finished files land here</span> : null}
          <AnimatedList
            items={done}
            className="um-stack__done"
            aria-label={labels.status.success}
            renderItem={(item) => (
              <span className="um-stack__chip" title={item.name}>
                <FilePreview item={item} size={28} />
                <span className="um-stack__chip-name">{item.name}</span>
                <AnimatedCheck size={16} />
              </span>
            )}
          />
        </div>
      </div>

      <div className="um-footer-row">
        <TransportBadge />
        <button
          type="button"
          className="um-btn um-btn--link um-stack__toggle"
          aria-expanded={showList}
          aria-controls={listId}
          onClick={() => setShowList((value) => !value)}
          disabled={items.length === 0}
        >
          {showList ? labels.collapse : `${labels.expand} (${items.length})`}
        </button>
      </div>
      <div id={listId} hidden={!showList}>
        <PresetQueue props={props} progressVariant="bar" allowPause />
      </div>
    </div>
  );
}

export const stackPreset: UploadPreset = {
  ...PRESET_INFO['stack'],
  Component: StackPreset,
};
