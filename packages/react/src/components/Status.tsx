import { formatDuration, formatPercent, formatSpeed } from '../core/format';
import { cx } from '../hooks/utils';
import { AlertIcon, CloseIcon } from '../icons';
import { useUploaderContext } from './context';
import { AnimatedList } from './FileList';

/** "Uploading 3 files" + "63% · 6.4 MB/s · 5 seconds left". */
export function useSummaryText() {
  const { totals, labels } = useUploaderContext();
  const title = labels.summary(totals);
  const parts: string[] = [];
  if (totals.active > 0 || totals.paused > 0) {
    parts.push(formatPercent(totals.progress));
    if (totals.speed > 0) parts.push(formatSpeed(totals.speed));
    if (totals.eta !== null && totals.eta > 0.5) parts.push(labels.timeLeft(formatDuration(totals.eta)));
  }
  return { title, detail: parts.join(' · ') };
}

export function UploadSummary({ className }: { className?: string }) {
  const { title, detail } = useSummaryText();
  return (
    <div className={cx('um-summary', className)}>
      <span className="um-summary__title">{title}</span>
      {detail ? <span className="um-summary__detail">{detail}</span> : null}
    </div>
  );
}

/** Badge shown when the transport is simulated, so demos never pass fake progress off as real. */
export function TransportBadge({ className }: { className?: string }) {
  const { transport, labels } = useUploaderContext();
  if (transport !== 'simulated') return null;
  return (
    <span className={cx('um-badge', className)} title={labels.simulatedHint}>
      <span className="um-badge__dot" aria-hidden="true" />
      {labels.simulated}
      <span className="um-sr-only">: {labels.simulatedHint}</span>
    </span>
  );
}

/** Dismissible list of files that failed validation, with the reason in text (not colour alone). */
export function UploadRejections({ className }: { className?: string }) {
  const { rejections, dismissRejection, labels } = useUploaderContext();
  if (rejections.length === 0) return null;
  return (
    <AnimatedList
      items={rejections}
      className={cx('um-rejections', className)}
      aria-label="Rejected files"
      renderItem={(rejection) => (
        <div className="um-rejection">
          <AlertIcon size={16} />
          <span className="um-rejection__text">{rejection.errors.map((error) => error.message).join(' ')}</span>
          <button
            type="button"
            className="um-icon-btn"
            aria-label={`${labels.dismiss}: ${rejection.file.name}`}
            onClick={(event) => {
              event.stopPropagation();
              dismissRejection(rejection.id);
            }}
          >
            <CloseIcon size={14} />
          </button>
        </div>
      )}
    />
  );
}
