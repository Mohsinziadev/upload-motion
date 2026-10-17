import { useRef, type CSSProperties, type ReactNode } from 'react';
import type { UploadItem } from '../core/types';
import { useFlip, usePresence } from '../hooks/useListAnimation';
import { cx } from '../hooks/utils';
import type { FileRenderHelpers, ProgressVariant, QueueLayout } from '../types';
import { getFileHelpers, useUploaderContext } from './context';
import { FileCard } from './FileItem';

export interface AnimatedListProps<T extends { id: string }> {
  items: readonly T[];
  renderItem: (item: T, state: { exiting: boolean; index: number }) => ReactNode;
  className?: string;
  itemClassName?: string;
  /** Exit animation length in ms. Default 320. */
  exitDuration?: number;
  as?: 'ul' | 'ol' | 'div';
  /** Exposed as `data-layout` for styling (`list`, `grid`, …). */
  layout?: string;
  'aria-label'?: string;
}

/**
 * List with enter/exit presence and FLIP re-layout animations.
 * Generic so presets can animate any collection, not only upload items.
 */
export function AnimatedList<T extends { id: string }>({
  items,
  renderItem,
  className,
  itemClassName,
  exitDuration = 320,
  as: Tag = 'ul',
  layout,
  'aria-label': ariaLabel,
}: AnimatedListProps<T>) {
  const { motion } = useUploaderContext();
  const ref = useRef<HTMLElement | null>(null);
  const entries = usePresence(items, motion.reduced ? 0 : exitDuration);
  const layoutKey = entries.map((entry) => `${entry.item.id}${entry.exiting ? '~' : ''}`).join('|');
  useFlip(ref, layoutKey, !motion.reduced);
  const ItemTag = Tag === 'div' ? 'div' : 'li';

  return (
    <Tag ref={ref as never} className={cx('um-list', className)} data-layout={layout} aria-label={ariaLabel}>
      {entries.map((entry, index) => (
        <ItemTag
          key={entry.item.id}
          data-flip-id={entry.item.id}
          className={cx('um-list__item', itemClassName)}
          data-exiting={entry.exiting || undefined}
          aria-hidden={entry.exiting || undefined}
          style={{ '--um-i': index } as CSSProperties}
        >
          {renderItem(entry.item, { exiting: entry.exiting, index })}
        </ItemTag>
      ))}
    </Tag>
  );
}

export interface UploadFileListProps {
  layout?: QueueLayout;
  progressVariant?: ProgressVariant;
  renderFile?: (item: UploadItem, helpers: FileRenderHelpers) => ReactNode;
  /** Defaults to every item in the queue. */
  items?: readonly UploadItem[];
  className?: string;
  itemClassName?: string;
  allowPause?: boolean;
}

/** The queue, rendered with `FileCard` (or your `renderFile`). */
export function UploadFileList({
  layout = 'list',
  progressVariant,
  renderFile,
  items,
  className,
  itemClassName,
  allowPause,
}: UploadFileListProps) {
  const context = useUploaderContext();
  const list = items ?? context.items;
  if (list.length === 0) return null;
  return (
    <AnimatedList
      items={list}
      className={cx('um-file-list', className)}
      itemClassName={itemClassName}
      aria-label="Files"
      renderItem={(item) =>
        renderFile ? (
          renderFile(item, getFileHelpers(context, item))
        ) : (
          <FileCard item={item} progressVariant={progressVariant} allowPause={allowPause} />
        )
      }
      layout={layout}
    />
  );
}
