import { memo, type ReactNode } from 'react';
import { formatBytes, formatDuration, formatPercent, formatSpeed } from '../core/format';
import type { UploadItem } from '../core/types';
import { cx, useBecameTrue } from '../hooks/utils';
import { AlertIcon, CloseIcon, PauseIcon, PlayIcon, RetryIcon, TrashIcon, UploadIcon } from '../icons';
import type { ProgressVariant, UploadLabels } from '../types';
import { useUploaderContext } from './context';
import { AnimatedCheck, Burst } from './Effects';
import { FilePreview } from './FileVisual';
import { UploadProgress } from './Progress';

/** Plain-language status line, e.g. "45% · 2.1 MB/s · 3 seconds left". */
export function describeItemStatus(item: UploadItem, labels: UploadLabels, transport: 'network' | 'simulated' | 'none'): string {
  switch (item.status) {
    case 'uploading': {
      if (item.progress >= 1) return labels.finishing;
      const parts = [formatPercent(item.progress)];
      if (item.speed > 0) parts.push(formatSpeed(item.speed));
      if (item.eta !== null && item.eta > 0.5) parts.push(labels.timeLeft(formatDuration(item.eta)));
      return parts.join(' · ');
    }
    case 'queued':
      if (item.retryAt !== null) {
        const seconds = Math.max(1, Math.ceil((item.retryAt - Date.now()) / 1000));
        return `${labels.retryingIn(seconds)}${item.error ? ` ${item.error.message}` : ''}`;
      }
      return labels.status.queued;
    case 'error':
      return item.error?.message ?? labels.status.error;
    case 'pending':
      return transport === 'none' ? labels.noHandler : labels.status.pending;
    default:
      return labels.status[item.status];
  }
}

/** Accessible value text for progress bars. */
export function progressValueText(item: UploadItem, labels: UploadLabels): string {
  const percent = formatPercent(item.progress);
  if (item.status !== 'uploading' || item.eta === null) return `${percent}, ${labels.status[item.status]}`;
  return `${percent}, ${labels.timeLeft(formatDuration(item.eta))}`;
}

export function ItemStatus({ item, className }: { item: UploadItem; className?: string }) {
  const { labels, transport } = useUploaderContext();
  const text = describeItemStatus(item, labels, transport);
  return (
    <span className={cx('um-status', className)} data-status={item.status}>
      {item.status === 'error' ? (
        <>
          <AlertIcon size={13} />
          <span className="um-sr-only">{labels.status.error}: </span>
        </>
      ) : null}
      <span className="um-status__text">{text}</span>
    </span>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: 'default' | 'danger' | 'accent';
}

export function IconButton({ label, onClick, children, tone = 'default' }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="um-icon-btn"
      data-tone={tone}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

/** Contextual actions for one file: start, pause/resume, cancel, retry, remove. */
export function ItemActions({ item, className, allowPause = false }: { item: UploadItem; className?: string; allowPause?: boolean }) {
  const context = useUploaderContext();
  const { labels } = context;
  const name = item.name;
  const buttons: ReactNode[] = [];

  if (item.status === 'pending' && context.transport !== 'none') {
    buttons.push(
      <IconButton key="start" label={`${labels.upload} ${name}`} onClick={() => context.start(item.id)} tone="accent">
        <UploadIcon size={16} />
      </IconButton>,
    );
  }
  if (item.status === 'uploading' && allowPause) {
    buttons.push(
      <IconButton key="pause" label={`${labels.pause} ${name}`} onClick={() => context.pause(item.id)}>
        <PauseIcon size={15} />
      </IconButton>,
    );
  }
  if (item.status === 'paused') {
    buttons.push(
      <IconButton key="resume" label={`${labels.resume} ${name}`} onClick={() => context.resume(item.id)} tone="accent">
        <PlayIcon size={15} />
      </IconButton>,
    );
  }
  if (item.status === 'error' || item.status === 'canceled') {
    buttons.push(
      <IconButton key="retry" label={`${labels.retry} ${name}`} onClick={() => context.retry(item.id)} tone="accent">
        <RetryIcon size={16} className="um-retry-icon" />
      </IconButton>,
    );
  }
  if (item.status === 'uploading' || item.status === 'queued' || item.status === 'paused') {
    buttons.push(
      <IconButton key="cancel" label={`${labels.cancel} ${name}`} onClick={() => context.cancel(item.id)}>
        <CloseIcon size={16} />
      </IconButton>,
    );
  } else {
    buttons.push(
      <IconButton key="remove" label={`${labels.remove} ${name}`} onClick={() => context.remove(item.id)} tone="danger">
        {item.status === 'success' ? <CloseIcon size={16} /> : <TrashIcon size={16} />}
      </IconButton>,
    );
  }

  return <div className={cx('um-actions', className)}>{buttons}</div>;
}

export interface FileCardProps {
  item: UploadItem;
  progressVariant?: ProgressVariant;
  className?: string;
  /** Leading visual. Defaults to a thumbnail/icon. */
  media?: ReactNode;
  allowPause?: boolean;
  /** Celebrate success with a particle burst. Default true. */
  celebrate?: boolean;
}

/** The default animated file row used by list-based presets. */
export const FileCard = /* @__PURE__ */ memo(function FileCard({
  item,
  progressVariant = 'bar',
  className,
  media,
  allowPause,
  celebrate = true,
}: FileCardProps) {
  const { labels } = useUploaderContext();
  const justSucceeded = useBecameTrue(item.status === 'success', 1200);
  const justFailed = useBecameTrue(item.status === 'error', 700);
  const showProgress = item.status !== 'pending' && item.status !== 'canceled';

  return (
    <div
      className={cx('um-card', className)}
      data-status={item.status}
      data-kind={item.kind}
      data-celebrate={justSucceeded || undefined}
      data-shake={justFailed || undefined}
    >
      <div className="um-card__media">
        {media ?? <FilePreview item={item} size={42} />}
        {item.status === 'success' ? <AnimatedCheck size={18} className="um-card__check" /> : null}
      </div>
      <div className="um-card__body">
        <div className="um-card__row">
          <span className="um-card__name" title={item.name}>
            {item.name}
          </span>
          <span className="um-card__size">{formatBytes(item.size)}</span>
        </div>
        {showProgress ? (
          <UploadProgress
            value={item.status === 'success' ? 1 : item.progress}
            status={item.status}
            variant={progressVariant}
            label={item.name}
            valueText={progressValueText(item, labels)}
            size={22}
          />
        ) : null}
        <ItemStatus item={item} />
      </div>
      <ItemActions item={item} allowPause={allowPause} />
      {celebrate && justSucceeded ? <Burst seed={item.id} count={10} spread={44} className="um-card__burst" /> : null}
    </div>
  );
});
