import { useState, type CSSProperties } from 'react';
import { getFileLabel } from '../core/file-kind';
import type { FileKind, UploadItem } from '../core/types';
import { useFilePreview } from '../hooks/useMedia';
import { cx } from '../hooks/utils';
import { KIND_ICONS } from '../icons';

export interface FileIconProps {
  kind: FileKind;
  /** Badge text such as `PDF`. Omit to hide the badge. */
  label?: string;
  size?: number;
  className?: string;
}

/** Paper-shaped file icon with a kind glyph and coloured extension badge. */
export function FileIcon({ kind, label, size = 40, className }: FileIconProps) {
  const Glyph = KIND_ICONS[kind];
  return (
    <span
      className={cx('um-ficon', className)}
      data-kind={kind}
      style={{ '--um-ficon-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="um-ficon__paper">
        <Glyph size={Math.round(size * 0.42)} />
      </span>
      {label ? <span className="um-ficon__badge">{label}</span> : null}
    </span>
  );
}

export interface FilePreviewProps {
  item: UploadItem;
  size?: number;
  /** Max bytes for generating an image preview. Default 25 MB. */
  maxPreviewSize?: number;
  className?: string;
  rounded?: boolean;
}

/** Image thumbnail for previewable images, otherwise a `FileIcon`. Object URLs are revoked automatically. */
export function FilePreview({ item, size = 44, maxPreviewSize, className }: FilePreviewProps) {
  const url = useFilePreview(item, maxPreviewSize);
  const [loaded, setLoaded] = useState(false);
  if (!url) return <FileIcon kind={item.kind} label={getFileLabel(item)} size={size} className={className} />;
  return (
    <span
      className={cx('um-thumb', className)}
      style={{ '--um-thumb-size': `${size}px` } as CSSProperties}
      data-loaded={loaded || undefined}
    >
      <img src={url} alt="" decoding="async" loading="lazy" draggable={false} onLoad={() => setLoaded(true)} />
    </span>
  );
}
