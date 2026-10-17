import { useId, useState, type CSSProperties } from 'react';
import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { AnimatedCheck, Burst } from '../components/Effects';
import { IconButton } from '../components/FileItem';
import { ActionMenu, type MenuAction } from '../components/Menu';
import { wavePath } from '../components/Progress';
import { TransportBadge, UploadRejections, useSummaryText } from '../components/Status';
import { cx, useBecameTrue } from '../hooks/utils';
import { CloseIcon, CollapseIcon, ExpandIcon, MoreIcon, PauseIcon, PlayIcon, RetryIcon, UploadIcon } from '../icons';
import { PRESET_INFO } from '../core/preset-catalog';
import type { PresetProps, UploadPreset } from '../types';
import { PresetQueue } from './shared';

const BAR_WAVE = /* @__PURE__ */ wavePath(1200, 38, 3.2, 8);

type BarState = 'idle' | 'active' | 'paused' | 'error' | 'done';

function WaveBarPreset(props: PresetProps) {
  const context = useUploaderContext();
  const { totals, items, dropzone, labels } = context;
  const [expanded, setExpanded] = useState(false);
  const drawerId = useId();
  const { title, detail } = useSummaryText();

  const state: BarState =
    items.length === 0
      ? 'idle'
      : totals.active > 0
        ? 'active'
        : totals.paused > 0
          ? 'paused'
          : totals.error > 0
            ? 'error'
            : totals.isComplete
              ? 'done'
              : 'idle';
  const celebrate = useBecameTrue(state === 'done', 1400);
  const dragging = dropzone.dragState !== 'idle';
  const progress = state === 'done' ? 1 : totals.progress;

  const menuActions: MenuAction[] = [
    { id: 'add', label: labels.uploadMore, onSelect: context.openFileDialog },
    { id: 'retry', label: labels.retryFailed, onSelect: () => context.retry(), disabled: totals.error + totals.canceled === 0 },
    { id: 'clear-done', label: labels.clearCompleted, onSelect: () => context.clear('completed'), disabled: totals.success === 0 },
    { id: 'clear', label: labels.clearAll, onSelect: () => context.clear('all'), tone: 'danger', disabled: items.length === 0 },
  ];

  return (
    <div
      className={cx('um-wavebar', props.classNames?.root)}
      data-state={state}
      data-drag={dropzone.dragState}
      data-expanded={expanded || undefined}
    >
      <div
        {...dropzone.getRootProps({ noClick: state !== 'idle' })}
        className={cx('um-zone', 'um-wavebar__bar', props.classNames?.zone)}
        style={{ '--um-p': progress } as CSSProperties}
      >
        <span className="um-wavebar__fill" aria-hidden="true" />
        <span className="um-wavebar__edge" aria-hidden="true" />

        <div className="um-wavebar__text">
          {state === 'idle' ? (
            props.zoneContent ?? (
              <>
                <span className="um-wavebar__title">
                  {dropzone.dragState === 'reject'
                    ? labels.dropReject
                    : dragging
                      ? labels.dropActive
                      : (props.title ?? 'Drop files to upload')}
                </span>
                <span className="um-wavebar__detail">
                  or <BrowseButton variant="link">browse</BrowseButton> · <UploadHint className="um-wavebar__hint" />
                </span>
              </>
            )
          ) : (
            <>
              <span className="um-wavebar__title">
                {state === 'done' ? <AnimatedCheck size={18} className="um-wavebar__check" /> : null}
                {title}
                <TransportBadge className="um-wavebar__badge" />
              </span>
              <span className="um-wavebar__detail" aria-hidden={state === 'active' || undefined}>
                {detail || (state === 'done' ? `${items.length} of ${items.length} complete` : labels.summary(totals))}
              </span>
            </>
          )}
        </div>

        <div className="um-wavebar__controls">
          {state === 'idle' ? (
            <BrowseButton variant="icon" className="um-wavebar__browse" aria-label={labels.browse}>
              <UploadIcon size={18} />
            </BrowseButton>
          ) : (
            <>
              {state === 'active' ? (
                <IconButton label={labels.pause} onClick={() => context.pause()}>
                  <PauseIcon size={16} />
                </IconButton>
              ) : state === 'paused' ? (
                <IconButton label={labels.resume} onClick={() => context.resume()} tone="accent">
                  <PlayIcon size={16} />
                </IconButton>
              ) : state === 'error' ? (
                <IconButton label={labels.retryFailed} onClick={() => context.retry()} tone="accent">
                  <RetryIcon size={16} className="um-retry-icon" />
                </IconButton>
              ) : null}
              {state === 'active' || state === 'paused' ? (
                <IconButton label={labels.cancelAll} onClick={() => context.cancel()}>
                  <CloseIcon size={16} />
                </IconButton>
              ) : (
                <IconButton label={labels.uploadMore} onClick={context.openFileDialog} tone="accent">
                  <UploadIcon size={16} />
                </IconButton>
              )}
              <button
                type="button"
                className="um-icon-btn"
                aria-expanded={expanded}
                aria-controls={drawerId}
                aria-label={expanded ? labels.collapse : labels.expand}
                title={expanded ? labels.collapse : labels.expand}
                onClick={(event) => {
                  event.stopPropagation();
                  setExpanded((value) => !value);
                }}
              >
                {expanded ? <CollapseIcon size={16} /> : <ExpandIcon size={16} />}
              </button>
              <ActionMenu label={labels.moreActions} icon={<MoreIcon size={16} />} actions={menuActions} />
            </>
          )}
        </div>

        <span className="um-wavebar__wave-clip" aria-hidden="true">
          <svg className="um-wavebar__wave" viewBox="0 0 1200 16" preserveAspectRatio="none">
            <path d={BAR_WAVE} />
          </svg>
        </span>
        {state !== 'idle' ? (
          <span
            className="um-sr-only"
            role="progressbar"
            aria-label={title}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-valuetext={detail || title}
          />
        ) : null}
        {celebrate ? <Burst seed="wavebar" count={16} spread={70} className="um-wavebar__burst" /> : null}
      </div>

      <div className="um-wavebar__drawer" id={drawerId} hidden={!expanded || items.length === 0}>
        <div className="um-wavebar__drawer-inner">
          <PresetQueue props={props} progressVariant="wave" allowPause />
        </div>
      </div>
      {!expanded && props.showRejections !== false && context.rejections.length > 0 ? (
        <UploadRejections />
      ) : null}
    </div>
  );
}

export const waveBarPreset: UploadPreset = {
  ...PRESET_INFO['wave-bar'],
  Component: WaveBarPreset,
};
