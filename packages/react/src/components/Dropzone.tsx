import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../hooks/utils';
import { UploadIcon } from '../icons';
import { useUploaderContext } from './context';

export interface UploadDropzoneProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /**
   * Make the whole zone a focusable button. Leave `false` (default) when the
   * zone contains its own buttons, e.g. `<BrowseButton>`.
   */
  focusable?: boolean;
  /** Track the pointer into `--um-px` / `--um-py` CSS variables. */
  trackPointer?: boolean;
  'aria-label'?: string;
}

/** Drop target. Click anywhere (outside inner controls) to open the file dialog; paste works while focused. */
export function UploadDropzone({ children, className, style, focusable, trackPointer, ...rest }: UploadDropzoneProps) {
  const { dropzone, labels, hintId, disabled } = useUploaderContext();
  return (
    <div
      {...dropzone.getRootProps({
        focusable,
        trackPointer,
        'aria-label': focusable ? (rest['aria-label'] ?? labels.zoneLabel) : undefined,
        'aria-describedby': hintId,
      })}
      className={cx('um-zone', className)}
      style={style}
      data-um-disabled={disabled || undefined}
    >
      {children ?? <DropzoneContent />}
    </div>
  );
}

/** Default zone content: icon, headline, browse button and limits hint. */
export function DropzoneContent({ icon, title }: { icon?: ReactNode; title?: ReactNode }) {
  const { dropzone, labels } = useUploaderContext();
  const headline =
    dropzone.dragState === 'reject' ? labels.dropReject : dropzone.dragState === 'accept' ? labels.dropActive : title ?? labels.dropTitle;
  return (
    <div className="um-zone__content">
      <span className="um-zone__icon">{icon ?? <UploadIcon size={22} />}</span>
      <span className="um-zone__title">{headline}</span>
      <BrowseButton variant="link" />
      <UploadHint />
    </div>
  );
}

export function UploadHint({ className }: { className?: string }) {
  const { hint, hintId } = useUploaderContext();
  return (
    <span id={hintId} className={cx('um-hint', className)}>
      {hint}
    </span>
  );
}

export interface BrowseButtonProps {
  children?: ReactNode;
  className?: string;
  variant?: 'solid' | 'soft' | 'link' | 'icon';
  'aria-label'?: string;
}

/** Keyboard-accessible trigger for the native file dialog. */
export function BrowseButton({ children, className, variant = 'soft', ...rest }: BrowseButtonProps) {
  const { openFileDialog, labels, disabled, hintId } = useUploaderContext();
  return (
    <button
      type="button"
      className={cx('um-btn', `um-btn--${variant}`, className)}
      onClick={(event) => {
        event.stopPropagation();
        openFileDialog();
      }}
      disabled={disabled}
      aria-describedby={hintId}
      aria-label={rest['aria-label']}
    >
      {children ?? labels.browse}
    </button>
  );
}

/** Starts pending uploads in manual mode (`autoUpload={false}`). Shows aggregate progress while uploading. */
export function StartUploadButton({ className, children }: { className?: string; children?: ReactNode }) {
  const { totals, start, labels, transport } = useUploaderContext();
  const uploading = totals.active > 0;
  const percent = Math.round(totals.progress * 100);
  const disabled = transport === 'none' || (totals.pending === 0 && !uploading);
  const done = !uploading && totals.pending === 0 && totals.isComplete;
  return (
    <button
      type="button"
      className={cx('um-btn', 'um-btn--solid', 'um-start-btn', className)}
      data-state={uploading ? 'uploading' : done ? 'done' : 'idle'}
      style={{ '--um-p': totals.progress } as CSSProperties}
      disabled={disabled}
      aria-disabled={uploading || undefined}
      onClick={(event) => {
        event.stopPropagation();
        if (!uploading) start();
      }}
    >
      <span className="um-start-btn__fill" aria-hidden="true" />
      <span className="um-start-btn__label">
        {uploading
          ? `${labels.status.uploading} ${percent}%`
          : done
            ? `✓ ${labels.status.success}`
            : (children ?? (totals.pending > 1 ? `${labels.upload} ${totals.pending} files` : labels.upload))}
      </span>
    </button>
  );
}
